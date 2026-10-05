use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::PrimarySellback;
use crate::instructions::shared::{burn_receipts, ReceiptAccounts, RoundSeeds};
use crate::state::{FundingRound, RoundInvestorRecord, RoundStatus, VentureState, VentureStatus};
use crate::utils::{math, token};

/// 100% sellback on the flat curve while the round is open (before the cap is hit):
/// receipts are burned and the exact USDC paid is returned from the round escrow.
#[derive(Accounts)]
pub struct SellPrimaryRound<'info> {
    pub investor: Signer<'info>,

    #[account(
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
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

    #[account(mut, token::mint = venture.usdc_mint)]
    pub investor_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump = funding_round.usdc_vault_bump
    )]
    pub funding_round_usdc_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_sell_primary_round(ctx: Context<SellPrimaryRound>, receipt_amount: u64) -> Result<()> {
    require!(receipt_amount > 0, VentrionError::ZeroAmount);
    let round = &ctx.accounts.funding_round;
    require!(round.round_status == RoundStatus::Active, VentrionError::RoundNotActive);
    require!(
        ctx.accounts.venture.status == VentureStatus::PrimaryRaiseActive,
        VentrionError::RoundNotActive
    );
    require!(
        ctx.accounts.round_record.tokens_purchased >= receipt_amount,
        VentrionError::InsufficientReceiptBalance
    );
    let usdc_amount = math::usdc_for_shares(receipt_amount, round.price_per_share_usdc)?;

    // ---------------------------------------------------------------- effects
    let record = &mut ctx.accounts.round_record;
    record.tokens_purchased -= receipt_amount;
    record.usdc_contributed = math::sub(record.usdc_contributed, usdc_amount)?;

    let round = &mut ctx.accounts.funding_round;
    round.total_raised_usdc = math::sub(round.total_raised_usdc, usdc_amount)?;
    round.receipts_outstanding = math::sub(round.receipts_outstanding, receipt_amount)?;

    // ---------------------------------------------------------- interactions
    let round_seeds = RoundSeeds::new(round);
    let round_info = ctx.accounts.funding_round.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();
    burn_receipts(
        &ReceiptAccounts {
            token_program: &token_program,
            receipt_mint: &ctx.accounts.receipt_mint.to_account_info(),
            holder_account: &ctx.accounts.investor_receipt_account.to_account_info(),
            funding_round: &round_info,
        },
        &ctx.accounts.investor.to_account_info(),
        &round_seeds.seeds(),
        receipt_amount,
    )?;
    token::transfer(
        &token_program,
        &ctx.accounts.funding_round_usdc_vault.to_account_info(),
        &ctx.accounts.investor_usdc.to_account_info(),
        &round_info,
        &[&round_seeds.seeds()],
        usdc_amount,
    )?;

    emit!(PrimarySellback {
        venture: ctx.accounts.venture.key(),
        funding_round: round_info.key(),
        investor: ctx.accounts.investor.key(),
        receipts_burned: receipt_amount,
        usdc_returned: usdc_amount,
        total_raised_usdc: ctx.accounts.funding_round.total_raised_usdc,
        timestamp: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
