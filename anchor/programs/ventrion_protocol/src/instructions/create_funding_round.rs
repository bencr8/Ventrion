use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::FundingRoundCreated;
use crate::instructions::shared::{initialize_round, RoundInit, RoundTerms};
use crate::state::{FundingRound, VentureState, VentureStatus, VentureVerificationVote};
use crate::utils::token as token_utils;

/// Opens funding round N+1 once the previous round is fully completed
/// (`OperationalMature`) or was rejected (`RefundActive`).
#[derive(Accounts)]
#[instruction(round_index: u8)]
pub struct CreateFundingRound<'info> {
    #[account(mut)]
    pub founder: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = founder @ VentrionError::Unauthorized,
        has_one = master_lock_vault @ VentrionError::InvalidTokenAccount,
        has_one = usdc_mint @ VentrionError::InvalidUsdcMint
    )]
    pub venture: Box<Account<'info, VentureState>>,

    pub master_lock_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = founder,
        space = 8 + FundingRound::INIT_SPACE,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[round_index]],
        bump
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    /// $VENT-RN receipt mint of round N.
    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_RECEIPT_MINT, funding_round.key().as_ref()],
        bump
    )]
    pub receipt_mint: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump
    )]
    pub round_usdc_vault: UncheckedAccount<'info>,

    #[account(
        init,
        payer = founder,
        space = 8 + VentureVerificationVote::INIT_SPACE,
        seeds = [SEED_VERIFICATION_VOTE, funding_round.key().as_ref()],
        bump
    )]
    pub verification_vote: Box<Account<'info, VentureVerificationVote>>,

    pub usdc_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_funding_round(
    ctx: Context<CreateFundingRound>,
    round_index: u8,
    terms: RoundTerms,
) -> Result<()> {
    let venture = &ctx.accounts.venture;
    require!(!venture.is_round_active, VentrionError::RoundAlreadyActive);
    require!(
        matches!(
            venture.status,
            VentureStatus::OperationalMature | VentureStatus::RefundActive
        ),
        VentrionError::RoundAlreadyActive
    );
    require!(
        venture.current_round_index.checked_add(1) == Some(round_index),
        VentrionError::InvalidRoundIndex
    );

    let plan = terms.plan()?;
    // Shares owed to receipt holders of earlier rounds stay reserved.
    let available = ctx
        .accounts
        .master_lock_vault
        .amount
        .checked_sub(venture.unredeemed_receipt_shares)
        .ok_or(VentrionError::SupplyInvariantViolated)?;
    require!(
        available >= plan.shares_required()?,
        VentrionError::InsufficientTreasuryShares
    );

    let round_key = ctx.accounts.funding_round.key();
    let round_info = ctx.accounts.funding_round.to_account_info();
    let founder_info = ctx.accounts.founder.to_account_info();
    let system_program = ctx.accounts.system_program.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();

    let receipt_mint_seeds = [SEED_RECEIPT_MINT, round_key.as_ref(), &[ctx.bumps.receipt_mint]];
    token_utils::create_pda_mint(
        &founder_info,
        &ctx.accounts.receipt_mint.to_account_info(),
        &round_info,
        Some(&round_info),
        SHARE_DECIMALS,
        &system_program,
        &token_program,
        &receipt_mint_seeds,
    )?;

    let round_usdc_vault_seeds = [SEED_ROUND_USDC_VAULT, round_key.as_ref(), &[ctx.bumps.round_usdc_vault]];
    token_utils::create_pda_token_account(
        &founder_info,
        &ctx.accounts.round_usdc_vault.to_account_info(),
        &ctx.accounts.usdc_mint.to_account_info(),
        &round_info,
        &system_program,
        &token_program,
        &round_usdc_vault_seeds,
    )?;

    let init = RoundInit {
        venture: venture.key(),
        funding_round: ctx.accounts.funding_round.key(),
        receipt_mint: ctx.accounts.receipt_mint.key(),
        usdc_vault: ctx.accounts.round_usdc_vault.key(),
        verification_vote: ctx.accounts.verification_vote.key(),
        round_index,
        bump: ctx.bumps.funding_round,
        receipt_mint_bump: ctx.bumps.receipt_mint,
        usdc_vault_bump: ctx.bumps.round_usdc_vault,
        vote_bump: ctx.bumps.verification_vote,
    };
    initialize_round(
        &mut ctx.accounts.funding_round,
        &mut ctx.accounts.verification_vote,
        &init,
        &terms,
        &plan,
    );
    ctx.accounts.venture.current_round_index = round_index;

    emit!(FundingRoundCreated {
        venture: init.venture,
        funding_round: init.funding_round,
        round_index,
        price_per_share_usdc: terms.price_per_share_usdc,
        target_cap_usdc: terms.target_cap_usdc,
        shares_for_sale: plan.shares_for_sale,
        upfront_working_capital_bps: terms.upfront_working_capital_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
