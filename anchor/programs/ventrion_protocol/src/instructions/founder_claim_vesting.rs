use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::FounderVestingClaimed;
use crate::instructions::shared::VentureSeeds;
use crate::state::{FounderVesting, VentureState};
use crate::utils::{math, token};

/// Founder claims linearly vested shares after the cliff.
#[derive(Accounts)]
pub struct FounderClaimVesting<'info> {
    pub founder: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = founder @ VentrionError::Unauthorized
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FOUNDER_VESTING, venture.key().as_ref(), founder.key().as_ref()],
        bump = founder_vesting.bump,
        has_one = founder @ VentrionError::Unauthorized,
        has_one = vesting_token_vault @ VentrionError::InvalidTokenAccount
    )]
    pub founder_vesting: Box<Account<'info, FounderVesting>>,

    #[account(mut)]
    pub vesting_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = venture.venture_token_mint,
        token::authority = founder
    )]
    pub founder_share_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_founder_claim_vesting(ctx: Context<FounderClaimVesting>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let vesting = &mut ctx.accounts.founder_vesting;
    let cliff_end = vesting
        .start_timestamp
        .checked_add(vesting.cliff_duration_seconds)
        .ok_or(VentrionError::MathOverflow)?;
    require!(now >= cliff_end, VentrionError::FounderCliffNotMet);

    let vested = math::vested_amount(
        vesting.total_allocated_tokens,
        vesting.start_timestamp,
        vesting.cliff_duration_seconds,
        vesting.total_duration_seconds,
        now,
    )?;
    let claimable = math::sub(vested, vesting.total_claimed_tokens)?;
    require!(claimable > 0, VentrionError::NothingVested);
    vesting.total_claimed_tokens = vested;

    let venture = &mut ctx.accounts.venture;
    venture.circulating_public_float = math::add(venture.circulating_public_float, claimable)?;

    let seeds = VentureSeeds::new(venture.venture_token_mint, venture.bump);
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.vesting_token_vault.to_account_info(),
        &ctx.accounts.founder_share_account.to_account_info(),
        &venture.to_account_info(),
        &[&seeds.seeds()],
        claimable,
    )?;

    emit!(FounderVestingClaimed {
        venture: venture.key(),
        founder: vesting.founder,
        amount: claimable,
        total_claimed: vesting.total_claimed_tokens,
    });
    Ok(())
}
