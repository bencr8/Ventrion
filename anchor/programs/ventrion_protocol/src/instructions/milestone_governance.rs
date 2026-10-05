use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{MilestoneProposed, MilestoneResolved, MilestoneVoteCast};
use crate::instructions::shared::RoundSeeds;
use crate::state::{
    FundingRound, MilestoneEscrow, MilestoneStatus, RoundInvestorRecord, RoundStatus, VentureState,
    VentureStatus,
};
use crate::utils::{math, token};

/// Common gate: graduated round with a funded escrow, sequential milestone id.
fn current_milestone_index(round: &FundingRound, escrow: &MilestoneEscrow, milestone_id: u8) -> Result<usize> {
    require!(round.round_status == RoundStatus::Graduated, VentrionError::InvalidRoundStatus);
    require!(escrow.is_funded, VentrionError::InvalidRoundStatus);
    require!(milestone_id < escrow.milestones_count, VentrionError::InvalidMilestoneId);
    require!(
        milestone_id == escrow.current_milestone_index,
        VentrionError::MilestoneOutOfOrder
    );
    Ok(milestone_id as usize)
}

fn open_review(escrow: &mut MilestoneEscrow, id: usize, now: i64) -> Result<i64> {
    let deadline = now
        .checked_add(OPTIMISTIC_VETO_WINDOW_SECONDS)
        .ok_or(VentrionError::MathOverflow)?;
    let milestone = &mut escrow.milestones[id];
    milestone.status = MilestoneStatus::Proposed;
    milestone.proposed_at = now;
    milestone.veto_deadline = deadline;
    milestone.votes_for = 0;
    milestone.votes_against = 0;
    Ok(deadline)
}

// -----------------------------------------------------------------------------
// propose_milestone / amend_milestone (founder)
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct FounderMilestoneAction<'info> {
    pub founder: Signer<'info>,

    #[account(
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = founder @ VentrionError::Unauthorized
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
        has_one = milestone_escrow @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(mut)]
    pub milestone_escrow: Box<Account<'info, MilestoneEscrow>>,
}

/// Founder submits the current milestone as delivered; a 7-day optimistic veto
/// window opens for the round's primary backers.
pub fn handle_propose_milestone(ctx: Context<FounderMilestoneAction>, milestone_id: u8) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let escrow = &mut ctx.accounts.milestone_escrow;
    let id = current_milestone_index(&ctx.accounts.funding_round, escrow, milestone_id)?;
    require!(
        escrow.milestones[id].status == MilestoneStatus::Pending,
        VentrionError::MilestoneNotEligibleForRelease
    );
    let veto_deadline = open_review(escrow, id, now)?;
    emit!(MilestoneProposed {
        funding_round: escrow.funding_round,
        milestone_id,
        veto_deadline,
        amendment_count: escrow.milestones[id].amendment_count,
    });
    Ok(())
}

/// Founder cures a vetoed milestone (max 3 times) and re-submits it, optionally
/// with a revised target date (must stay before the next milestone's date).
pub fn handle_amend_milestone(
    ctx: Context<FounderMilestoneAction>,
    milestone_id: u8,
    new_target_completion_date: i64,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let escrow = &mut ctx.accounts.milestone_escrow;
    let id = current_milestone_index(&ctx.accounts.funding_round, escrow, milestone_id)?;
    require!(
        escrow.milestones[id].status == MilestoneStatus::Vetoed,
        VentrionError::MilestoneNotEligibleForRelease
    );
    require!(
        escrow.milestones[id].amendment_count < MAX_AMENDMENT_COUNT,
        VentrionError::AmendmentLimitExceeded
    );
    require!(new_target_completion_date > now, VentrionError::InvalidMilestoneSchedule);
    if id + 1 < escrow.milestones_count as usize {
        require!(
            new_target_completion_date < escrow.milestones[id + 1].target_completion_date,
            VentrionError::InvalidMilestoneSchedule
        );
    }
    escrow.milestones[id].amendment_count += 1;
    escrow.milestones[id].target_completion_date = new_target_completion_date;
    let veto_deadline = open_review(escrow, id, now)?;
    emit!(MilestoneProposed {
        funding_round: escrow.funding_round,
        milestone_id,
        veto_deadline,
        amendment_count: escrow.milestones[id].amendment_count,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// vote_milestone (primary backers)
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct VoteMilestone<'info> {
    pub investor: Signer<'info>,

    #[account(
        seeds = [SEED_FUNDING_ROUND, funding_round.venture.as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = milestone_escrow @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(mut)]
    pub milestone_escrow: Box<Account<'info, MilestoneEscrow>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_RECORD, funding_round.key().as_ref(), investor.key().as_ref()],
        bump = round_record.bump,
        has_one = investor @ VentrionError::Unauthorized
    )]
    pub round_record: Box<Account<'info, RoundInvestorRecord>>,
}

/// Approve (`true`) or veto (`false`) the proposed milestone, weighted by the
/// backer's primary allocation in this round (net of ragequit).
pub fn handle_vote_milestone(ctx: Context<VoteMilestone>, milestone_id: u8, approve: bool) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let escrow = &mut ctx.accounts.milestone_escrow;
    let id = current_milestone_index(&ctx.accounts.funding_round, escrow, milestone_id)?;
    let milestone = &mut escrow.milestones[id];
    require!(milestone.status == MilestoneStatus::Proposed, VentrionError::MilestoneNotProposed);
    require!(now < milestone.veto_deadline, VentrionError::VetoPeriodExpired);

    let record = &mut ctx.accounts.round_record;
    let weight = record.primary_weight();
    require!(weight > 0, VentrionError::NoPrimaryVotingWeight);
    record.sync_review_cycle(id, milestone.amendment_count);
    require!(!record.has_voted(id), VentrionError::MilestoneAlreadyVoted);

    let bit = 1u16 << id;
    if approve {
        milestone.votes_for = math::add(milestone.votes_for, weight)?;
        record.vote_mask |= bit;
    } else {
        milestone.votes_against = math::add(milestone.votes_against, weight)?;
        record.veto_mask |= bit;
    }

    emit!(MilestoneVoteCast {
        funding_round: escrow.funding_round,
        investor: record.investor,
        milestone_id,
        approve,
        weight,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// execute_milestone_release (permissionless)
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct ExecuteMilestoneRelease<'info> {
    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
        has_one = milestone_escrow @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(mut)]
    pub milestone_escrow: Box<Account<'info, MilestoneEscrow>>,

    #[account(
        mut,
        seeds = [SEED_MILESTONE_USDC_VAULT, milestone_escrow.key().as_ref()],
        bump = milestone_escrow.vault_bump
    )]
    pub milestone_usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = venture.usdc_mint,
        token::authority = venture.treasury_wallet
    )]
    pub founder_treasury_usdc: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

/// Resolution of a proposed milestone:
/// * `votes_for > 50%` of the remaining primary weight: released immediately;
/// * after the veto window, veto `<= 33.33%`: released (optimistic default);
/// * after the veto window, veto `> 33.33%`: `Vetoed` (founder may amend) or
///   `Breached` once all 3 cure attempts are used up (ragequit opens).
pub fn handle_execute_milestone_release(ctx: Context<ExecuteMilestoneRelease>, milestone_id: u8) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let escrow = &mut ctx.accounts.milestone_escrow;
    let id = current_milestone_index(&ctx.accounts.funding_round, escrow, milestone_id)?;
    let remaining_weight = escrow.primary_tokens_remaining;
    let base_weight = escrow.primary_tokens_quorum_base;
    let is_last = id + 1 == escrow.milestones_count as usize;
    let milestone = escrow.milestones[id];
    require!(milestone.status == MilestoneStatus::Proposed, VentrionError::MilestoneNotProposed);

    let weight = remaining_weight as u128;
    let approved_early = weight > 0
        && milestone.votes_for as u128 * BPS_DENOMINATOR as u128 > APPROVAL_THRESHOLD_BPS as u128 * weight;
    require!(
        approved_early || now >= milestone.veto_deadline,
        VentrionError::MilestoneNotEligibleForRelease
    );
    let vetoed = !approved_early
        && milestone.votes_against as u128 * BPS_DENOMINATOR as u128 > VETO_THRESHOLD_BPS as u128 * weight;

    if vetoed {
        let status = if milestone.amendment_count >= MAX_AMENDMENT_COUNT {
            MilestoneStatus::Breached
        } else {
            MilestoneStatus::Vetoed
        };
        escrow.milestones[id].status = status;
        emit!(MilestoneResolved {
            funding_round: escrow.funding_round,
            milestone_id,
            released: false,
            status: status as u8,
            amount_usdc: 0,
        });
        return Ok(());
    }

    // Tranche scaled by the share of primary backers that did not ragequit; the
    // final tranche sweeps the vault so no USDC is ever stranded.
    let amount = if is_last {
        ctx.accounts.milestone_usdc_vault.amount
    } else {
        math::mul_div_floor(milestone.amount_usdc, remaining_weight, base_weight)?
            .min(ctx.accounts.milestone_usdc_vault.amount)
    };
    escrow.milestones[id].status = MilestoneStatus::Released;
    escrow.current_milestone_index += 1;
    escrow.total_released_usdc = math::add(escrow.total_released_usdc, amount)?;
    let all_released = escrow.current_milestone_index == escrow.milestones_count;

    let round_seeds = RoundSeeds::new(&ctx.accounts.funding_round);
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.milestone_usdc_vault.to_account_info(),
        &ctx.accounts.founder_treasury_usdc.to_account_info(),
        &ctx.accounts.funding_round.to_account_info(),
        &[&round_seeds.seeds()],
        amount,
    )?;

    if all_released {
        ctx.accounts.funding_round.round_status = RoundStatus::Completed;
        let venture = &mut ctx.accounts.venture;
        venture.status = VentureStatus::OperationalMature;
        venture.is_round_active = false;
    }

    emit!(MilestoneResolved {
        funding_round: ctx.accounts.milestone_escrow.funding_round,
        milestone_id,
        released: true,
        status: MilestoneStatus::Released as u8,
        amount_usdc: amount,
    });
    Ok(())
}
