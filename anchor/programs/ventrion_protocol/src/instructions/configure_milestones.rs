use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::MilestonesConfigured;
use crate::state::{
    DlmmCustody, FundingRound, MilestoneEscrow, MilestoneInput, MilestoneItem, MilestoneStatus,
    RoundStatus, VentureState, VentureStatus,
};
use crate::utils::token as token_utils;

/// The founder commits the milestone roadmap of the current round. Only then does
/// the flat curve open, so backers and $VENT stakers judge a fixed plan.
///
/// The first call also provisions the venture-level vaults (dividend vault, pooled
/// staking vault) and the permanent `DlmmCustody` with its token accounts, so every
/// account later touched by graduation exists before the governance vote.
#[derive(Accounts)]
pub struct ConfigureMilestones<'info> {
    #[account(mut)]
    pub founder: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = founder @ VentrionError::Unauthorized,
        has_one = usdc_mint @ VentrionError::InvalidUsdcMint,
        has_one = venture_token_mint @ VentrionError::InvalidTokenAccount
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[venture.current_round_index]],
        bump = funding_round.bump
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_MILESTONE_ESCROW, funding_round.key().as_ref()],
        bump
    )]
    pub milestone_escrow: UncheckedAccount<'info>,

    /// `MilestoneEscrowUsdcVault` (authority = funding round PDA).
    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_MILESTONE_USDC_VAULT, milestone_escrow.key().as_ref()],
        bump
    )]
    pub milestone_usdc_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_DIVIDEND_VAULT, venture.key().as_ref()],
        bump
    )]
    pub dividend_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_STAKED_SHARES_VAULT, venture.key().as_ref()],
        bump
    )]
    pub staked_shares_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_DLMM_CUSTODY, venture.key().as_ref()],
        bump
    )]
    pub dlmm_custody: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_CUSTODY_USDC, venture.key().as_ref()],
        bump
    )]
    pub custody_usdc: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_CUSTODY_SHARES, venture.key().as_ref()],
        bump
    )]
    pub custody_shares: UncheckedAccount<'info>,

    pub usdc_mint: Box<Account<'info, Mint>>,
    pub venture_token_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_configure_milestones(
    ctx: Context<ConfigureMilestones>,
    milestones: Vec<MilestoneInput>,
) -> Result<()> {
    require!(
        ctx.accounts.funding_round.round_status == RoundStatus::Initialized,
        VentrionError::MilestonesAlreadyConfigured
    );
    require!(
        matches!(
            ctx.accounts.venture.status,
            VentureStatus::GenesisInitialized
                | VentureStatus::OperationalMature
                | VentureStatus::RefundActive
        ),
        VentrionError::InvalidVentureStatus
    );
    require!(
        (1..=MAX_MILESTONES).contains(&milestones.len()),
        VentrionError::InvalidMilestoneCount
    );

    let now = Clock::get()?.unix_timestamp;
    let mut bps_sum: u64 = 0;
    let mut previous_date = now;
    let mut items = [MilestoneItem::default(); MAX_MILESTONES];
    for (item, input) in items.iter_mut().zip(milestones.iter()) {
        require!(input.percentage_bps > 0, VentrionError::InvalidAllocationSum);
        require!(
            input.target_completion_date > previous_date,
            VentrionError::InvalidMilestoneSchedule
        );
        previous_date = input.target_completion_date;
        bps_sum += input.percentage_bps as u64;
        *item = MilestoneItem {
            percentage_bps: input.percentage_bps,
            target_completion_date: input.target_completion_date,
            status: MilestoneStatus::Pending,
            ..MilestoneItem::default()
        };
    }
    require!(bps_sum == BPS_DENOMINATOR, VentrionError::InvalidAllocationSum);

    let venture_key = ctx.accounts.venture.key();
    let round_key = ctx.accounts.funding_round.key();
    let milestone_escrow_key = ctx.accounts.milestone_escrow.key();

    let founder_info = ctx.accounts.founder.to_account_info();
    let system_program = ctx.accounts.system_program.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();
    let usdc_mint_info = ctx.accounts.usdc_mint.to_account_info();
    let venture_token_mint_info = ctx.accounts.venture_token_mint.to_account_info();
    let round_info = ctx.accounts.funding_round.to_account_info();
    let venture_info = ctx.accounts.venture.to_account_info();
    let dlmm_custody_info = ctx.accounts.dlmm_custody.to_account_info();

    let milestone_usdc_vault_seeds = [
        SEED_MILESTONE_USDC_VAULT,
        milestone_escrow_key.as_ref(),
        &[ctx.bumps.milestone_usdc_vault],
    ];
    token_utils::create_pda_token_account_if_needed(
        &founder_info,
        &ctx.accounts.milestone_usdc_vault.to_account_info(),
        &usdc_mint_info,
        &round_info,
        &system_program,
        &token_program,
        &milestone_usdc_vault_seeds,
    )?;

    let dividend_vault_seeds = [
        SEED_DIVIDEND_VAULT,
        venture_key.as_ref(),
        &[ctx.bumps.dividend_vault],
    ];
    token_utils::create_pda_token_account_if_needed(
        &founder_info,
        &ctx.accounts.dividend_vault.to_account_info(),
        &usdc_mint_info,
        &venture_info,
        &system_program,
        &token_program,
        &dividend_vault_seeds,
    )?;

    let staked_shares_vault_seeds = [
        SEED_STAKED_SHARES_VAULT,
        venture_key.as_ref(),
        &[ctx.bumps.staked_shares_vault],
    ];
    token_utils::create_pda_token_account_if_needed(
        &founder_info,
        &ctx.accounts.staked_shares_vault.to_account_info(),
        &venture_token_mint_info,
        &venture_info,
        &system_program,
        &token_program,
        &staked_shares_vault_seeds,
    )?;

    let custody_usdc_seeds = [
        SEED_CUSTODY_USDC,
        venture_key.as_ref(),
        &[ctx.bumps.custody_usdc],
    ];
    token_utils::create_pda_token_account_if_needed(
        &founder_info,
        &ctx.accounts.custody_usdc.to_account_info(),
        &usdc_mint_info,
        &dlmm_custody_info,
        &system_program,
        &token_program,
        &custody_usdc_seeds,
    )?;

    let custody_shares_seeds = [
        SEED_CUSTODY_SHARES,
        venture_key.as_ref(),
        &[ctx.bumps.custody_shares],
    ];
    token_utils::create_pda_token_account_if_needed(
        &founder_info,
        &ctx.accounts.custody_shares.to_account_info(),
        &venture_token_mint_info,
        &dlmm_custody_info,
        &system_program,
        &token_program,
        &custody_shares_seeds,
    )?;

    let milestone_escrow_seeds = [
        SEED_MILESTONE_ESCROW,
        round_key.as_ref(),
        &[ctx.bumps.milestone_escrow],
    ];
    token_utils::create_pda_program_account(
        &founder_info,
        &ctx.accounts.milestone_escrow.to_account_info(),
        8 + MilestoneEscrow::INIT_SPACE,
        &crate::ID,
        &system_program,
        &milestone_escrow_seeds,
    )?;

    let escrow = MilestoneEscrow {
        venture: venture_key,
        funding_round: round_key,
        escrow_usdc_vault: ctx.accounts.milestone_usdc_vault.key(),
        total_allocated_usdc: 0,
        total_released_usdc: 0,
        total_ragequit_usdc: 0,
        primary_tokens_quorum_base: 0,
        primary_tokens_remaining: 0,
        current_milestone_index: 0,
        milestones_count: milestones.len() as u8,
        is_funded: false,
        bump: ctx.bumps.milestone_escrow,
        vault_bump: ctx.bumps.milestone_usdc_vault,
        milestones: items,
    };
    token_utils::write_pda_account(&ctx.accounts.milestone_escrow.to_account_info(), &escrow)?;

    let dlmm_custody_seeds = [
        SEED_DLMM_CUSTODY,
        venture_key.as_ref(),
        &[ctx.bumps.dlmm_custody],
    ];
    if dlmm_custody_info.owner == &anchor_lang::solana_program::system_program::ID && dlmm_custody_info.data_is_empty() {
        token_utils::create_pda_program_account(
            &founder_info,
            &dlmm_custody_info,
            8 + DlmmCustody::INIT_SPACE,
            &crate::ID,
            &system_program,
            &dlmm_custody_seeds,
        )?;
        let custody = DlmmCustody {
            venture: venture_key,
            lb_pair: Pubkey::default(),
            token_x_mint: Pubkey::default(),
            token_y_mint: Pubkey::default(),
            custody_usdc: ctx.accounts.custody_usdc.key(),
            custody_shares: ctx.accounts.custody_shares.key(),
            positions_count: 0,
            total_usdc_deposited: 0,
            total_shares_deposited: 0,
            total_fees_harvested_usdc: 0,
            total_fees_harvested_shares: 0,
            is_permanently_locked: true,
            bump: ctx.bumps.dlmm_custody,
            custody_usdc_bump: ctx.bumps.custody_usdc,
            custody_shares_bump: ctx.bumps.custody_shares,
        };
        token_utils::write_pda_account(&dlmm_custody_info, &custody)?;
    }

    let round = &mut ctx.accounts.funding_round;
    round.milestone_escrow = ctx.accounts.milestone_escrow.key();
    round.round_status = RoundStatus::Active;

    let venture = &mut ctx.accounts.venture;
    venture.dividend_vault = ctx.accounts.dividend_vault.key();
    venture.dividend_vault_bump = ctx.bumps.dividend_vault;
    venture.dlmm_custody = ctx.accounts.dlmm_custody.key();
    venture.status = VentureStatus::PrimaryRaiseActive;
    venture.is_round_active = true;

    emit!(MilestonesConfigured {
        venture: venture_key,
        funding_round: round_key,
        milestones_count: escrow.milestones_count,
        timestamp: now,
    });
    Ok(())
}
