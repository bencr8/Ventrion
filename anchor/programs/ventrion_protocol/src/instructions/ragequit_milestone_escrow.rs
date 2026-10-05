use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::MilestoneRagequit;
use crate::instructions::shared::RoundSeeds;
use crate::state::{FundingRound, MilestoneEscrow, MilestoneStatus, RoundInvestorRecord, RoundStatus, VentureState};
use crate::utils::{math, token};

/// Investor protection: if the current milestone is breached (vetoed after the
/// last cure) or overdue, a primary backer surrenders redeemed common shares back
/// to the `MasterLockVault` and receives their pro-rata part of the remaining
/// milestone escrow.
#[derive(Accounts)]
pub struct RagequitMilestoneEscrow<'info> {
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = master_lock_vault @ VentrionError::InvalidTokenAccount
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

    #[account(
        mut,
        seeds = [SEED_MILESTONE_USDC_VAULT, milestone_escrow.key().as_ref()],
        bump = milestone_escrow.vault_bump
    )]
    pub milestone_usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_RECORD, funding_round.key().as_ref(), investor.key().as_ref()],
        bump = round_record.bump,
        has_one = investor @ VentrionError::Unauthorized
    )]
    pub round_record: Box<Account<'info, RoundInvestorRecord>>,

    #[account(
        mut,
        token::mint = venture.venture_token_mint,
        token::authority = investor
    )]
    pub investor_share_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub master_lock_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, token::mint = venture.usdc_mint)]
    pub investor_usdc: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_ragequit_milestone_escrow(ctx: Context<RagequitMilestoneEscrow>, shares_amount: u64) -> Result<()> {
    require!(shares_amount > 0, VentrionError::ZeroAmount);
    let now = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.funding_round.round_status == RoundStatus::Graduated,
        VentrionError::RagequitNotAllowed
    );

    let escrow = &mut ctx.accounts.milestone_escrow;
    require!(escrow.is_funded, VentrionError::RagequitNotAllowed);
    let index = escrow.current_milestone_index as usize;
    require!(index < escrow.milestones_count as usize, VentrionError::RagequitNotAllowed);
    let milestone = escrow.milestones[index];
    let overdue = now > milestone.target_completion_date
        && matches!(milestone.status, MilestoneStatus::Pending | MilestoneStatus::Vetoed);
    require!(
        milestone.status == MilestoneStatus::Breached || overdue,
        VentrionError::RagequitNotAllowed
    );

    // Only redeemed shares of this round that were not surrendered yet qualify.
    let record = &mut ctx.accounts.round_record;
    let surrenderable = math::sub(record.tokens_redeemed, record.tokens_surrendered)?;
    require!(shares_amount <= surrenderable, VentrionError::NoPrimaryVotingWeight);
    require!(
        escrow.primary_tokens_remaining >= shares_amount,
        VentrionError::SupplyInvariantViolated
    );

    let vault_balance = ctx.accounts.milestone_usdc_vault.amount;
    let refund = math::mul_div_floor(shares_amount, vault_balance, escrow.primary_tokens_remaining)?;

    // ---------------------------------------------------------------- effects
    record.tokens_surrendered = math::add(record.tokens_surrendered, shares_amount)?;
    record.usdc_ragequit = math::add(record.usdc_ragequit, refund)?;
    escrow.primary_tokens_remaining -= shares_amount;
    escrow.total_ragequit_usdc = math::add(escrow.total_ragequit_usdc, refund)?;
    let venture = &mut ctx.accounts.venture;
    venture.circulating_public_float = math::sub(venture.circulating_public_float, shares_amount)?;

    // ---------------------------------------------------------- interactions
    let token_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        &token_program,
        &ctx.accounts.investor_share_account.to_account_info(),
        &ctx.accounts.master_lock_vault.to_account_info(),
        &ctx.accounts.investor.to_account_info(),
        &[],
        shares_amount,
    )?;
    let round_seeds = RoundSeeds::new(&ctx.accounts.funding_round);
    token::transfer(
        &token_program,
        &ctx.accounts.milestone_usdc_vault.to_account_info(),
        &ctx.accounts.investor_usdc.to_account_info(),
        &ctx.accounts.funding_round.to_account_info(),
        &[&round_seeds.seeds()],
        refund,
    )?;

    emit!(MilestoneRagequit {
        funding_round: ctx.accounts.funding_round.key(),
        investor: ctx.accounts.investor.key(),
        shares_surrendered: shares_amount,
        usdc_refunded: refund,
    });
    Ok(())
}
