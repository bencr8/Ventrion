use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{PrimaryContribution, RoundCapReached};
use crate::instructions::shared::{mint_receipts, ReceiptAccounts, RoundSeeds};
use crate::state::{
    FundingRound, GlobalConfig, RoundInvestorRecord, RoundStatus, VentureState, VentureStatus,
    VentureVerificationVote,
};
use crate::utils::{math, token};

/// Buys $VENT-RN receipts on the Ventrion flat curve. USDC stays in the round's
/// treasury escrow until graduation or refund. Hitting the hard cap exactly freezes
/// the curve and starts the 14-day $VENT verification vote.
#[derive(Accounts)]
pub struct ContributeFundingRound<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = global_config @ VentrionError::Unauthorized
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
        has_one = receipt_mint @ VentrionError::InvalidTokenAccount,
        has_one = verification_vote @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(mut)]
    pub verification_vote: Box<Account<'info, VentureVerificationVote>>,

    #[account(
        init_if_needed,
        payer = investor,
        space = 8 + RoundInvestorRecord::INIT_SPACE,
        seeds = [SEED_ROUND_RECORD, funding_round.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub round_record: Box<Account<'info, RoundInvestorRecord>>,

    #[account(mut)]
    pub receipt_mint: Box<Account<'info, Mint>>,

    /// CHECK: Created if needed in handler
    #[account(mut)]
    pub investor_receipt_account: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = venture.usdc_mint,
        token::authority = investor
    )]
    pub investor_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump = funding_round.usdc_vault_bump
    )]
    pub funding_round_usdc_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_contribute_funding_round(
    ctx: Context<ContributeFundingRound>,
    usdc_amount: u64,
) -> Result<()> {
    require!(usdc_amount > 0, VentrionError::ZeroAmount);
    let round = &ctx.accounts.funding_round;
    require!(round.round_status == RoundStatus::Active, VentrionError::RoundNotActive);
    require!(
        ctx.accounts.venture.status == VentureStatus::PrimaryRaiseActive
            && ctx.accounts.venture.is_round_active,
        VentrionError::RoundNotActive
    );
    let new_total_raised = math::add(round.total_raised_usdc, usdc_amount)?;
    require!(new_total_raised <= round.target_cap_usdc, VentrionError::ExceedsHardCap);
    let receipts = math::shares_for_usdc(usdc_amount, round.price_per_share_usdc)?;
    require!(receipts > 0, VentrionError::ZeroAmount);

    // ---------------------------------------------------------- interactions
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.investor_usdc.to_account_info(),
        &ctx.accounts.funding_round_usdc_vault.to_account_info(),
        &ctx.accounts.investor.to_account_info(),
        &[],
        usdc_amount,
    )?;
    let investor_receipt_info = ctx.accounts.investor_receipt_account.to_account_info();
    token::create_ata_if_needed(
        &ctx.accounts.investor.to_account_info(),
        &investor_receipt_info,
        &ctx.accounts.investor.to_account_info(),
        &ctx.accounts.receipt_mint.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
    )?;
    let round_seeds = RoundSeeds::new(round);
    mint_receipts(
        &ReceiptAccounts {
            token_program: &ctx.accounts.token_program.to_account_info(),
            receipt_mint: &ctx.accounts.receipt_mint.to_account_info(),
            holder_account: &investor_receipt_info,
            funding_round: &ctx.accounts.funding_round.to_account_info(),
        },
        &round_seeds.seeds(),
        receipts,
    )?;

    // ---------------------------------------------------------------- effects
    let now = Clock::get()?.unix_timestamp;
    let record = &mut ctx.accounts.round_record;
    if record.investor == Pubkey::default() {
        record.venture = ctx.accounts.venture.key();
        record.funding_round = ctx.accounts.funding_round.key();
        record.investor = ctx.accounts.investor.key();
        record.bump = ctx.bumps.round_record;
    }
    record.usdc_contributed = math::add(record.usdc_contributed, usdc_amount)?;
    record.tokens_purchased = math::add(record.tokens_purchased, receipts)?;

    let round = &mut ctx.accounts.funding_round;
    round.total_raised_usdc = new_total_raised;
    round.receipts_outstanding = math::add(round.receipts_outstanding, receipts)?;

    emit!(PrimaryContribution {
        venture: round.venture,
        funding_round: round.key(),
        investor: record.investor,
        usdc_amount,
        receipts_minted: receipts,
        total_raised_usdc: new_total_raised,
        timestamp: now,
    });

    if new_total_raised == round.target_cap_usdc {
        // 100% sold: freeze the curve and open the 14-day $VENT governance gate.
        round.round_status = RoundStatus::CapReached;
        round.cap_reached_ts = now;
        let venture = &mut ctx.accounts.venture;
        venture.status = VentureStatus::CapReached;
        venture.is_round_active = false;

        let vote = &mut ctx.accounts.verification_vote;
        vote.voting_start_timestamp = now;
        vote.voting_end_timestamp = now
            .checked_add(VERIFICATION_VOTING_PERIOD_SECONDS)
            .ok_or(VentrionError::MathOverflow)?;
        vote.total_vent_staked_snapshot = ctx.accounts.global_config.total_vent_staked;

        emit!(RoundCapReached {
            venture: venture.key(),
            funding_round: round.key(),
            total_raised_usdc: new_total_raised,
            voting_start_timestamp: vote.voting_start_timestamp,
            voting_end_timestamp: vote.voting_end_timestamp,
        });
    }
    Ok(())
}
