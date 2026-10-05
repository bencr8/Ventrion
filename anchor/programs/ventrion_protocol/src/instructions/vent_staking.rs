use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{VentStaked, VentUnstaked};
use crate::state::{GlobalConfig, VentStakePosition};
use crate::utils::{math, token};

// -----------------------------------------------------------------------------
// stake_vent
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct StakeVent<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(mut, seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + VentStakePosition::INIT_SPACE,
        seeds = [SEED_VENT_STAKE, staker.key().as_ref()],
        bump
    )]
    pub stake_position: Box<Account<'info, VentStakePosition>>,

    #[account(
        mut,
        token::mint = global_config.vent_mint,
        token::authority = staker
    )]
    pub staker_vent_account: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = global_config.vent_stake_vault @ VentrionError::InvalidTokenAccount)]
    pub vent_stake_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_stake_vent(ctx: Context<StakeVent>, amount: u64) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);

    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.staker_vent_account.to_account_info(),
        &ctx.accounts.vent_stake_vault.to_account_info(),
        &ctx.accounts.staker.to_account_info(),
        &[],
        amount,
    )?;

    let position = &mut ctx.accounts.stake_position;
    if position.staker == Pubkey::default() {
        position.staker = ctx.accounts.staker.key();
        position.bump = ctx.bumps.stake_position;
    }
    position.amount = math::add(position.amount, amount)?;

    let config = &mut ctx.accounts.global_config;
    config.total_vent_staked = math::add(config.total_vent_staked, amount)?;

    emit!(VentStaked {
        staker: position.staker,
        amount,
        position_amount: position.amount,
        total_vent_staked: config.total_vent_staked,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// unstake_vent
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct UnstakeVent<'info> {
    pub staker: Signer<'info>,

    #[account(mut, seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [SEED_VENT_STAKE, staker.key().as_ref()],
        bump = stake_position.bump,
        has_one = staker @ VentrionError::Unauthorized
    )]
    pub stake_position: Box<Account<'info, VentStakePosition>>,

    #[account(mut, token::mint = global_config.vent_mint)]
    pub destination: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = global_config.vent_stake_vault @ VentrionError::InvalidTokenAccount)]
    pub vent_stake_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_unstake_vent(ctx: Context<UnstakeVent>, amount: u64) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);
    let now = Clock::get()?.unix_timestamp;
    let position = &mut ctx.accounts.stake_position;
    require!(now >= position.locked_until, VentrionError::LockNotExpired);
    require!(position.amount >= amount, VentrionError::InsufficientStakedBalance);

    position.amount -= amount;
    let config = &mut ctx.accounts.global_config;
    config.total_vent_staked = math::sub(config.total_vent_staked, amount)?;

    let bump = [config.bump];
    let seeds: &[&[u8]] = &[SEED_GLOBAL_CONFIG, &bump];
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.vent_stake_vault.to_account_info(),
        &ctx.accounts.destination.to_account_info(),
        &config.to_account_info(),
        &[seeds],
        amount,
    )?;

    emit!(VentUnstaked {
        staker: position.staker,
        amount,
        position_amount: position.amount,
        total_vent_staked: config.total_vent_staked,
    });
    Ok(())
}
