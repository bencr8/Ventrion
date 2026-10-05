use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{InvestorStaked, SharesRedeemed};
use crate::instructions::investor_staking::{apply_stake, init_vault_if_new};
use crate::instructions::shared::{burn_receipts, ReceiptAccounts, RoundSeeds, VentureSeeds};
use crate::state::{FundingRound, InvestorVault, RoundInvestorRecord, RoundStatus, VentureState};
use crate::utils::{math, token};

fn require_redeemable(round: &FundingRound) -> Result<()> {
    require!(
        matches!(round.round_status, RoundStatus::Graduated | RoundStatus::Completed),
        VentrionError::InvalidRoundStatus
    );
    Ok(())
}

/// Burns `amount` receipts of the investor and books the 1:1 share release.
fn burn_and_book<'info>(
    venture: &mut VentureState,
    round: &mut FundingRound,
    record: &mut RoundInvestorRecord,
    receipt_accounts: &ReceiptAccounts<'_, 'info>,
    investor: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);
    let outstanding = math::sub(record.tokens_purchased, record.tokens_redeemed)?;
    require!(outstanding >= amount, VentrionError::InsufficientReceiptBalance);

    record.tokens_redeemed = math::add(record.tokens_redeemed, amount)?;
    round.receipts_redeemed = math::add(round.receipts_redeemed, amount)?;
    round.receipts_outstanding = math::sub(round.receipts_outstanding, amount)?;
    venture.unredeemed_receipt_shares = math::sub(venture.unredeemed_receipt_shares, amount)?;
    venture.circulating_public_float = math::add(venture.circulating_public_float, amount)?;

    let round_seeds = RoundSeeds::new(round);
    burn_receipts(receipt_accounts, investor, &round_seeds.seeds(), amount)
}

// -----------------------------------------------------------------------------
// redeem_shares
// -----------------------------------------------------------------------------

/// After graduation, $VENT-RN receipts convert 1:1 into real common shares
/// released from the `MasterLockVault`.
#[derive(Accounts)]
pub struct RedeemShares<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = master_lock_vault @ VentrionError::InvalidTokenAccount,
        has_one = venture_token_mint @ VentrionError::InvalidTokenAccount
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

    #[account(mut, token::mint = receipt_mint, token::authority = investor)]
    pub investor_receipt_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub master_lock_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = venture_token_mint,
        associated_token::authority = investor
    )]
    pub investor_share_account: Box<Account<'info, TokenAccount>>,

    pub venture_token_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_redeem_shares(ctx: Context<RedeemShares>, amount: u64) -> Result<()> {
    require_redeemable(&ctx.accounts.funding_round)?;
    let token_program = ctx.accounts.token_program.to_account_info();
    let round_info = ctx.accounts.funding_round.to_account_info();
    let investor = ctx.accounts.investor.to_account_info();
    burn_and_book(
        &mut ctx.accounts.venture,
        &mut ctx.accounts.funding_round,
        &mut ctx.accounts.round_record,
        &ReceiptAccounts {
            token_program: &token_program,
            receipt_mint: &ctx.accounts.receipt_mint.to_account_info(),
            holder_account: &ctx.accounts.investor_receipt_account.to_account_info(),
            funding_round: &round_info,
        },
        &investor,
        amount,
    )?;

    let venture = &ctx.accounts.venture;
    let seeds = VentureSeeds::new(venture.venture_token_mint, venture.bump);
    token::transfer(
        &token_program,
        &ctx.accounts.master_lock_vault.to_account_info(),
        &ctx.accounts.investor_share_account.to_account_info(),
        &venture.to_account_info(),
        &[&seeds.seeds()],
        amount,
    )?;

    emit!(SharesRedeemed {
        venture: venture.key(),
        funding_round: round_info.key(),
        investor: investor.key(),
        amount,
        staked: false,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// redeem_and_stake_shares
// -----------------------------------------------------------------------------

/// Redeems receipts 1:1 and stakes the resulting shares directly into the
/// venture's dividend-bearing staking vault in one step.
#[derive(Accounts)]
pub struct RedeemAndStakeShares<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = master_lock_vault @ VentrionError::InvalidTokenAccount
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

    #[account(mut, token::mint = receipt_mint, token::authority = investor)]
    pub investor_receipt_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub master_lock_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = investor,
        space = 8 + InvestorVault::INIT_SPACE,
        seeds = [SEED_INVESTOR_VAULT, venture.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub investor_vault: Box<Account<'info, InvestorVault>>,

    #[account(
        mut,
        seeds = [SEED_STAKED_SHARES_VAULT, venture.key().as_ref()],
        bump
    )]
    pub staked_shares_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_redeem_and_stake_shares(
    ctx: Context<RedeemAndStakeShares>,
    amount: u64,
    lock_duration_seconds: i64,
) -> Result<()> {
    require_redeemable(&ctx.accounts.funding_round)?;
    let now = Clock::get()?.unix_timestamp;
    let token_program = ctx.accounts.token_program.to_account_info();
    let round_info = ctx.accounts.funding_round.to_account_info();
    let investor = ctx.accounts.investor.to_account_info();
    burn_and_book(
        &mut ctx.accounts.venture,
        &mut ctx.accounts.funding_round,
        &mut ctx.accounts.round_record,
        &ReceiptAccounts {
            token_program: &token_program,
            receipt_mint: &ctx.accounts.receipt_mint.to_account_info(),
            holder_account: &ctx.accounts.investor_receipt_account.to_account_info(),
            funding_round: &round_info,
        },
        &investor,
        amount,
    )?;

    let seeds = VentureSeeds::new(ctx.accounts.venture.venture_token_mint, ctx.accounts.venture.bump);
    token::transfer(
        &token_program,
        &ctx.accounts.master_lock_vault.to_account_info(),
        &ctx.accounts.staked_shares_vault.to_account_info(),
        &ctx.accounts.venture.to_account_info(),
        &[&seeds.seeds()],
        amount,
    )?;

    let venture_key = ctx.accounts.venture.key();
    let vault = &mut ctx.accounts.investor_vault;
    init_vault_if_new(vault, venture_key, investor.key(), ctx.bumps.investor_vault);
    apply_stake(&mut ctx.accounts.venture, vault, amount, lock_duration_seconds, now)?;

    emit!(SharesRedeemed {
        venture: venture_key,
        funding_round: round_info.key(),
        investor: investor.key(),
        amount,
        staked: true,
    });
    emit!(InvestorStaked {
        venture: venture_key,
        investor: investor.key(),
        amount,
        staked_amount: vault.staked_amount,
        multiplier_bps: vault.multiplier_bps,
        lock_end_timestamp: vault.lock_end_timestamp,
    });
    Ok(())
}
