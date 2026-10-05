use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::PrimaryRefund;
use crate::instructions::shared::{burn_receipts, ReceiptAccounts, RoundSeeds};
use crate::state::{FundingRound, RoundInvestorRecord, RoundStatus};
use crate::utils::{math, token};

/// Path B of the governance gate: the venture was rejected or the ballot timed out.
/// The backer's receipts are burned and every USDC atom they paid is returned from
/// the round escrow, signed by the funding round PDA.
#[derive(Accounts)]
pub struct RefundPrimaryRound<'info> {
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, funding_round.venture.as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = receipt_mint @ VentrionError::InvalidTokenAccount
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_RECORD, funding_round.key().as_ref(), investor.key().as_ref()],
        bump = round_record.bump,
        has_one = investor @ VentrionError::Unauthorized
    )]
    pub round_record: Box<Account<'info, RoundInvestorRecord>>,

    #[account(mut)]
    pub receipt_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        token::mint = receipt_mint,
        token::authority = investor
    )]
    pub investor_receipt_account: Box<Account<'info, TokenAccount>>,

    /// Receives the refund (any USDC account chosen by the backer).
    #[account(mut, token::mint = funding_round_usdc_vault.mint)]
    pub backer_usdc_destination: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump = funding_round.usdc_vault_bump
    )]
    pub funding_round_usdc_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_refund_primary_round(ctx: Context<RefundPrimaryRound>) -> Result<()> {
    require!(
        ctx.accounts.funding_round.round_status == RoundStatus::RefundActive,
        VentrionError::RoundNotEligibleForRefund
    );
    let record = &mut ctx.accounts.round_record;
    let refundable = math::sub(record.usdc_contributed, record.usdc_refunded)?;
    require!(refundable > 0, VentrionError::NothingToRefund);
    let receipts = math::sub(record.tokens_purchased, record.tokens_redeemed)?;

    // ---------------------------------------------------------------- effects
    record.usdc_refunded = record.usdc_contributed;
    record.tokens_redeemed = record.tokens_purchased;
    let round = &mut ctx.accounts.funding_round;
    round.total_refunded_usdc = math::add(round.total_refunded_usdc, refundable)?;
    round.receipts_outstanding = math::sub(round.receipts_outstanding, receipts)?;

    // ---------------------------------------------------------- interactions
    let round_seeds = RoundSeeds::new(round);
    let round_info = ctx.accounts.funding_round.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();
    if receipts > 0 {
        burn_receipts(
            &ReceiptAccounts {
                token_program: &token_program,
                receipt_mint: &ctx.accounts.receipt_mint.to_account_info(),
                holder_account: &ctx.accounts.investor_receipt_account.to_account_info(),
                funding_round: &round_info,
            },
            &ctx.accounts.investor.to_account_info(),
            &round_seeds.seeds(),
            receipts,
        )?;
    }
    token::transfer(
        &token_program,
        &ctx.accounts.funding_round_usdc_vault.to_account_info(),
        &ctx.accounts.backer_usdc_destination.to_account_info(),
        &round_info,
        &[&round_seeds.seeds()],
        refundable,
    )?;

    emit!(PrimaryRefund {
        venture: ctx.accounts.funding_round.venture,
        funding_round: round_info.key(),
        investor: ctx.accounts.investor.key(),
        receipts_burned: receipts,
        usdc_refunded: refundable,
        timestamp: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
