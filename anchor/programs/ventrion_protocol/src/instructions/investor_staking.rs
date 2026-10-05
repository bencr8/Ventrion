use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{DividendsClaimed, DividendsDistributed, InvestorStaked, InvestorUnstaked};
use crate::instructions::shared::VentureSeeds;
use crate::state::{InvestorVault, VentureState};
use crate::utils::{math, token};

/// Dividend source tags carried by `DividendsDistributed`.
pub const DIVIDEND_SOURCE_ECOSYSTEM: u8 = 0;
pub const DIVIDEND_SOURCE_DLMM_FEES: u8 = 1;

// -----------------------------------------------------------------------------
// O(1) accumulator bookkeeping
// -----------------------------------------------------------------------------

/// Credits everything accrued since the last checkpoint to `pending_usdc`.
pub fn settle(venture: &VentureState, vault: &mut InvestorVault) -> Result<()> {
    let owed = math::pending_dividends(
        vault.effective_weight,
        venture.acc_dividend_per_weight_unit,
        vault.last_acc_yield,
    )?;
    vault.pending_usdc = math::add(vault.pending_usdc, owed)?;
    vault.last_acc_yield = venture.acc_dividend_per_weight_unit;
    Ok(())
}

fn set_weight(venture: &mut VentureState, vault: &mut InvestorVault, new_weight: u128) -> Result<()> {
    venture.total_dividend_weight_units = venture
        .total_dividend_weight_units
        .checked_sub(vault.effective_weight)
        .and_then(|w| w.checked_add(new_weight))
        .ok_or(VentrionError::MathOverflow)?;
    vault.effective_weight = new_weight;
    Ok(())
}

/// Drops an expired lock boost back to 1.0x (after settling at the boosted weight).
pub fn expire_lock_if_due(venture: &mut VentureState, vault: &mut InvestorVault, now: i64) -> Result<()> {
    settle(venture, vault)?;
    if now >= vault.lock_end_timestamp && vault.multiplier_bps != STAKING_MULT_0D_BPS {
        vault.multiplier_bps = STAKING_MULT_0D_BPS;
        vault.lock_duration_seconds = 0;
        set_weight(venture, vault, math::effective_weight(vault.staked_amount, STAKING_MULT_0D_BPS))?;
    }
    Ok(())
}

/// Adds `amount` shares to an investor vault with the requested lock tier. An
/// active lock is never shortened and its multiplier never reduced.
pub fn apply_stake(
    venture: &mut VentureState,
    vault: &mut InvestorVault,
    amount: u64,
    lock_duration_seconds: i64,
    now: i64,
) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);
    let requested_multiplier = math::staking_multiplier_bps(lock_duration_seconds)?;
    expire_lock_if_due(venture, vault, now)?;

    let requested_end = now
        .checked_add(lock_duration_seconds)
        .ok_or(VentrionError::MathOverflow)?;
    if vault.lock_end_timestamp > now {
        vault.multiplier_bps = vault.multiplier_bps.max(requested_multiplier);
        if requested_end > vault.lock_end_timestamp {
            vault.lock_end_timestamp = requested_end;
            vault.lock_duration_seconds = lock_duration_seconds;
        }
    } else {
        vault.multiplier_bps = requested_multiplier;
        vault.lock_start_timestamp = now;
        vault.lock_end_timestamp = requested_end;
        vault.lock_duration_seconds = lock_duration_seconds;
    }
    vault.staked_amount = math::add(vault.staked_amount, amount)?;
    vault.is_active = true;
    let weight = math::effective_weight(vault.staked_amount, vault.multiplier_bps);
    set_weight(venture, vault, weight)?;
    venture.total_staked_in_vaults = math::add(venture.total_staked_in_vaults, amount)?;
    Ok(())
}

/// Initializes identity fields of a freshly created investor vault.
pub fn init_vault_if_new(vault: &mut InvestorVault, venture: Pubkey, investor: Pubkey, bump: u8) {
    if vault.investor == Pubkey::default() {
        vault.venture = venture;
        vault.investor = investor;
        vault.multiplier_bps = STAKING_MULT_0D_BPS;
        vault.bump = bump;
    }
}

// -----------------------------------------------------------------------------
// deposit_investor_shares
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct DepositInvestorShares<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

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
        token::mint = venture.venture_token_mint,
        token::authority = investor
    )]
    pub investor_share_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_STAKED_SHARES_VAULT, venture.key().as_ref()],
        bump
    )]
    pub staked_shares_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_deposit_investor_shares(
    ctx: Context<DepositInvestorShares>,
    amount: u64,
    lock_duration_seconds: i64,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.investor_share_account.to_account_info(),
        &ctx.accounts.staked_shares_vault.to_account_info(),
        &ctx.accounts.investor.to_account_info(),
        &[],
        amount,
    )?;
    let venture_key = ctx.accounts.venture.key();
    let vault = &mut ctx.accounts.investor_vault;
    init_vault_if_new(vault, venture_key, ctx.accounts.investor.key(), ctx.bumps.investor_vault);
    apply_stake(&mut ctx.accounts.venture, vault, amount, lock_duration_seconds, now)?;

    emit!(InvestorStaked {
        venture: venture_key,
        investor: vault.investor,
        amount,
        staked_amount: vault.staked_amount,
        multiplier_bps: vault.multiplier_bps,
        lock_end_timestamp: vault.lock_end_timestamp,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// unstake_investor_shares
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct UnstakeInvestorShares<'info> {
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_INVESTOR_VAULT, venture.key().as_ref(), investor.key().as_ref()],
        bump = investor_vault.bump,
        has_one = investor @ VentrionError::Unauthorized
    )]
    pub investor_vault: Box<Account<'info, InvestorVault>>,

    #[account(mut, token::mint = venture.venture_token_mint)]
    pub investor_share_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_STAKED_SHARES_VAULT, venture.key().as_ref()],
        bump
    )]
    pub staked_shares_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_unstake_investor_shares(ctx: Context<UnstakeInvestorShares>, amount: u64) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);
    let now = Clock::get()?.unix_timestamp;
    let vault = &mut ctx.accounts.investor_vault;
    require!(now >= vault.lock_end_timestamp, VentrionError::LockNotExpired);
    require!(vault.staked_amount >= amount, VentrionError::InsufficientStakedBalance);

    let venture = &mut ctx.accounts.venture;
    expire_lock_if_due(venture, vault, now)?;
    vault.staked_amount -= amount;
    vault.is_active = vault.staked_amount > 0;
    let new_weight = math::effective_weight(vault.staked_amount, vault.multiplier_bps);
    set_weight(venture, vault, new_weight)?;
    venture.total_staked_in_vaults = math::sub(venture.total_staked_in_vaults, amount)?;

    let seeds = VentureSeeds::new(venture.venture_token_mint, venture.bump);
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.staked_shares_vault.to_account_info(),
        &ctx.accounts.investor_share_account.to_account_info(),
        &venture.to_account_info(),
        &[&seeds.seeds()],
        amount,
    )?;

    emit!(InvestorUnstaked {
        venture: venture.key(),
        investor: vault.investor,
        amount,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// claim_investor_dividends
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct ClaimInvestorDividends<'info> {
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = dividend_vault @ VentrionError::InvalidTokenAccount
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_INVESTOR_VAULT, venture.key().as_ref(), investor.key().as_ref()],
        bump = investor_vault.bump,
        has_one = investor @ VentrionError::Unauthorized
    )]
    pub investor_vault: Box<Account<'info, InvestorVault>>,

    #[account(mut)]
    pub dividend_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, token::mint = venture.usdc_mint)]
    pub investor_usdc: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_claim_investor_dividends(ctx: Context<ClaimInvestorDividends>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let venture = &mut ctx.accounts.venture;
    let vault = &mut ctx.accounts.investor_vault;
    expire_lock_if_due(venture, vault, now)?;
    let amount = vault.pending_usdc;
    require!(amount > 0, VentrionError::NoDividendsOwed);
    vault.pending_usdc = 0;
    vault.total_claimed_usdc = math::add(vault.total_claimed_usdc, amount)?;

    let seeds = VentureSeeds::new(venture.venture_token_mint, venture.bump);
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.dividend_vault.to_account_info(),
        &ctx.accounts.investor_usdc.to_account_info(),
        &venture.to_account_info(),
        &[&seeds.seeds()],
        amount,
    )?;

    emit!(DividendsClaimed {
        venture: venture.key(),
        investor: vault.investor,
        amount,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// refresh_investor_vault (permissionless keeper)
// -----------------------------------------------------------------------------

/// Anyone may drop an expired lock boost back to 1.0x so expired multipliers do
/// not dilute active lockers.
#[derive(Accounts)]
pub struct RefreshInvestorVault<'info> {
    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_INVESTOR_VAULT, venture.key().as_ref(), investor_vault.investor.as_ref()],
        bump = investor_vault.bump
    )]
    pub investor_vault: Box<Account<'info, InvestorVault>>,
}

pub fn handle_refresh_investor_vault(ctx: Context<RefreshInvestorVault>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    expire_lock_if_due(&mut ctx.accounts.venture, &mut ctx.accounts.investor_vault, now)
}

// -----------------------------------------------------------------------------
// deposit_ecosystem_fees
// -----------------------------------------------------------------------------

/// Deposits real USDC revenue (e.g. commerce income of the OpCo) as dividends for
/// all staked shareholders of the venture.
#[derive(Accounts)]
pub struct DepositEcosystemFees<'info> {
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = dividend_vault @ VentrionError::InvalidTokenAccount
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        token::mint = venture.usdc_mint,
        token::authority = depositor
    )]
    pub depositor_usdc: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub dividend_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

/// Books `amount` USDC (already in the dividend vault) into the accumulator.
pub fn distribute_dividends(venture: &mut VentureState, amount: u64) -> Result<()> {
    let increment = math::accumulator_increment(amount, venture.total_dividend_weight_units)?;
    venture.acc_dividend_per_weight_unit = venture
        .acc_dividend_per_weight_unit
        .checked_add(increment)
        .ok_or(VentrionError::MathOverflow)?;
    venture.total_dividends_distributed = math::add(venture.total_dividends_distributed, amount)?;
    Ok(())
}

pub fn handle_deposit_ecosystem_fees(
    ctx: Context<DepositEcosystemFees>,
    amount: u64,
    reference: [u8; 32],
) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);
    require!(
        ctx.accounts.venture.total_dividend_weight_units > 0,
        VentrionError::NoActiveStakers
    );
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.depositor_usdc.to_account_info(),
        &ctx.accounts.dividend_vault.to_account_info(),
        &ctx.accounts.depositor.to_account_info(),
        &[],
        amount,
    )?;
    let venture = &mut ctx.accounts.venture;
    distribute_dividends(venture, amount)?;

    emit!(DividendsDistributed {
        venture: venture.key(),
        amount_usdc: amount,
        source: DIVIDEND_SOURCE_ECOSYSTEM,
        reference,
        acc_dividend_per_weight_unit: venture.acc_dividend_per_weight_unit,
    });
    Ok(())
}
