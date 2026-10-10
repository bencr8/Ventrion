use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::AtomicGraduationExecuted;
use crate::instructions::shared::{RoundSeeds, VentureSeeds};
use crate::state::{DlmmCustody, FundingRound, MilestoneEscrow, RoundStatus, VentureState, VentureStatus};
use crate::utils::meteora::cpi::{self as dlmm_cpi, AddLiquidityByWeight2, BinWeight, LiquidityByWeight};
use crate::utils::{math, meteora, token};

/// Graduation step B (permissionless, requires `VerifiedApproved` and a prepared pool).
///
/// Atomically distributes the fully raised round:
/// 1. legal fee `max($3,000, 3%)`       -> `LegalSetupVault`
/// 2. upfront runway (<= 15%)            -> founder treasury USDC account
/// 3. 17.0% USDC + 17.0% round shares    -> Meteora DLMM via `add_liquidity_by_weight2`,
///    position owned by `DlmmCustody` (no removal instruction exists: permanently locked)
/// 4. remainder (+ unused DLMM USDC)      -> `MilestoneEscrowUsdcVault`
///
/// Clients should request ~600k compute units.
#[derive(Accounts)]
pub struct ExecuteAtomicGraduation<'info> {
    pub executor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = master_lock_vault @ VentrionError::InvalidTokenAccount,
        has_one = legal_setup_vault @ VentrionError::InvalidTokenAccount,
        has_one = dlmm_custody @ VentrionError::InvalidMeteoraAccount,
        has_one = usdc_mint @ VentrionError::InvalidUsdcMint,
        has_one = venture_token_mint @ VentrionError::InvalidTokenAccount
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
        has_one = milestone_escrow @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(
        mut,
        seeds = [SEED_MILESTONE_ESCROW, funding_round.key().as_ref()],
        bump = milestone_escrow.bump
    )]
    pub milestone_escrow: Box<Account<'info, MilestoneEscrow>>,

    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump = funding_round.usdc_vault_bump
    )]
    pub funding_round_usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub master_lock_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub legal_setup_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = venture.treasury_wallet
    )]
    pub founder_treasury_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_MILESTONE_USDC_VAULT, milestone_escrow.key().as_ref()],
        bump = milestone_escrow.vault_bump
    )]
    pub milestone_usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_DLMM_CUSTODY, venture.key().as_ref()],
        bump = dlmm_custody.bump,
        has_one = custody_usdc @ VentrionError::InvalidTokenAccount,
        has_one = custody_shares @ VentrionError::InvalidTokenAccount
    )]
    pub dlmm_custody: Box<Account<'info, DlmmCustody>>,

    #[account(mut)]
    pub custody_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub custody_shares: Box<Account<'info, TokenAccount>>,

    pub usdc_mint: Box<Account<'info, Mint>>,
    pub venture_token_mint: Box<Account<'info, Mint>>,

    /// CHECK: must equal `dlmm_custody.lb_pair` (checked in the handler).
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,
    /// CHECK: verified against the LB pair state in the handler and by the DLMM program.
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,
    /// CHECK: verified against the LB pair state in the handler and by the DLMM program.
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,
    /// CHECK: must equal `funding_round.dlmm_position` (checked in the handler).
    #[account(mut)]
    pub position: UncheckedAccount<'info>,
    /// CHECK: derived from the recorded lower bin (checked in the handler).
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,
    /// CHECK: derived from the recorded upper bin (checked in the handler).
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,
    /// CHECK: DLMM event authority, seeds enforced by the DLMM program.
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK: canonical Meteora DLMM program.
    #[account(address = METEORA_DLMM_PROGRAM_ID @ VentrionError::InvalidMeteoraProgram)]
    pub dlmm_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_execute_atomic_graduation(ctx: Context<ExecuteAtomicGraduation>) -> Result<()> {
    // ---------------------------------------------------------------- gating
    require!(
        ctx.accounts.venture.status == VentureStatus::VerifiedApproved,
        VentrionError::VentureNotApproved
    );
    let round = &ctx.accounts.funding_round;
    require!(
        round.round_status == RoundStatus::VerifiedApproved,
        VentrionError::RoundNotEligibleForGraduation
    );
    require!(round.dlmm_prepared, VentrionError::DlmmNotPrepared);
    require!(
        round.total_raised_usdc == round.target_cap_usdc
            && ctx.accounts.funding_round_usdc_vault.amount == round.total_raised_usdc,
        VentrionError::RoundNotEligibleForGraduation
    );

    // ------------------------------------------------------ DLMM accounts
    let custody = &ctx.accounts.dlmm_custody;
    require_keys_eq!(ctx.accounts.lb_pair.key(), custody.lb_pair, VentrionError::InvalidMeteoraPool);
    require_keys_eq!(ctx.accounts.position.key(), round.dlmm_position, VentrionError::InvalidMeteoraAccount);
    let pool = meteora::read_lb_pair(&ctx.accounts.lb_pair)?;
    require!(
        pool.reserve_x == ctx.accounts.reserve_x.key() && pool.reserve_y == ctx.accounts.reserve_y.key(),
        VentrionError::InvalidMeteoraPool
    );
    let first_seeding = custody.positions_count == 0;
    if first_seeding {
        require!(pool.active_id == round.dlmm_active_id, VentrionError::DlmmPriceMismatch);
    }
    let lower_bin_id = round.dlmm_lower_bin_id;
    let upper_bin_id = lower_bin_id + DLMM_POSITION_WIDTH - 1;
    require_keys_eq!(
        ctx.accounts.bin_array_lower.key(),
        meteora::derive_bin_array(&custody.lb_pair, math::bin_array_index(lower_bin_id)).0,
        VentrionError::InvalidDlmmBinArray
    );
    require_keys_eq!(
        ctx.accounts.bin_array_upper.key(),
        meteora::derive_bin_array(&custody.lb_pair, math::bin_array_index(upper_bin_id)).0,
        VentrionError::InvalidDlmmBinArray
    );

    // -------------------------------------------------- share reservation
    let reserved = math::add(round.shares_for_sale, round.dlmm_seed_shares)?;
    let free_shares = ctx
        .accounts
        .master_lock_vault
        .amount
        .checked_sub(ctx.accounts.venture.unredeemed_receipt_shares)
        .ok_or(VentrionError::SupplyInvariantViolated)?;
    require!(free_shares >= reserved, VentrionError::InsufficientTreasuryShares);

    let legal_fee = round.legal_fee_usdc;
    let upfront = round.upfront_usdc;
    let dlmm_usdc = round.dlmm_seed_usdc;
    let dlmm_shares = round.dlmm_seed_shares;
    let escrow_base = round.escrow_usdc;
    let shares_sold = round.shares_for_sale;
    let active_id = round.dlmm_active_id;
    let total_raised = round.total_raised_usdc;
    require!(
        math::add(math::add(legal_fee, upfront)?, math::add(dlmm_usdc, escrow_base)?)? == total_raised,
        VentrionError::InvalidRoundEconomics
    );

    let token_program = ctx.accounts.token_program.to_account_info();
    let round_seeds = RoundSeeds::new(round);
    let round_info = ctx.accounts.funding_round.to_account_info();
    let venture_seeds = VentureSeeds::new(ctx.accounts.venture.venture_token_mint, ctx.accounts.venture.bump);
    let venture_info = ctx.accounts.venture.to_account_info();
    let venture_key = venture_info.key();
    let custody_bump = [ctx.accounts.dlmm_custody.bump];
    let custody_seeds: &[&[u8]] = &[SEED_DLMM_CUSTODY, venture_key.as_ref(), &custody_bump];
    let custody_info = ctx.accounts.dlmm_custody.to_account_info();
    let custody_usdc_before = ctx.accounts.custody_usdc.amount;
    let custody_shares_before = ctx.accounts.custody_shares.amount;
    let vault = ctx.accounts.funding_round_usdc_vault.to_account_info();

    // ---------------------------------------------- 1 + 2: legal fee, runway
    token::transfer(&token_program, &vault, &ctx.accounts.legal_setup_vault.to_account_info(), &round_info, &[&round_seeds.seeds()], legal_fee)?;
    token::transfer(&token_program, &vault, &ctx.accounts.founder_treasury_usdc.to_account_info(), &round_info, &[&round_seeds.seeds()], upfront)?;

    // ------------------------------------------ 3: permanent DLMM liquidity
    token::transfer(&token_program, &vault, &ctx.accounts.custody_usdc.to_account_info(), &round_info, &[&round_seeds.seeds()], dlmm_usdc)?;
    token::transfer(
        &token_program,
        &ctx.accounts.master_lock_vault.to_account_info(),
        &ctx.accounts.custody_shares.to_account_info(),
        &venture_info,
        &[&venture_seeds.seeds()],
        dlmm_shares,
    )?;

    let shares_are_token_x = pool.token_x_mint == ctx.accounts.venture_token_mint.key();
    let (amount_x, amount_y, user_token_x, user_token_y, mint_x, mint_y) = if shares_are_token_x {
        (
            dlmm_shares,
            dlmm_usdc,
            ctx.accounts.custody_shares.to_account_info(),
            ctx.accounts.custody_usdc.to_account_info(),
            ctx.accounts.venture_token_mint.to_account_info(),
            ctx.accounts.usdc_mint.to_account_info(),
        )
    } else {
        (
            dlmm_usdc,
            dlmm_shares,
            ctx.accounts.custody_usdc.to_account_info(),
            ctx.accounts.custody_shares.to_account_info(),
            ctx.accounts.usdc_mint.to_account_info(),
            ctx.accounts.venture_token_mint.to_account_info(),
        )
    };
    let distribution: Vec<BinWeight> = (lower_bin_id..=upper_bin_id)
        .map(|bin_id| {
            let distance = (bin_id - active_id).abs() as u32;
            // Degressive weight: concentrated around active_id, tapering off over 140+ bins
            let weight = (1000u32.saturating_sub(distance * 6)).max(150) as u16;
            BinWeight { bin_id, weight }
        })
        .collect();
    let bin_arrays = [
        ctx.accounts.bin_array_lower.to_account_info(),
        ctx.accounts.bin_array_upper.to_account_info(),
    ];
    let bin_arrays: &[AccountInfo] = if bin_arrays[0].key() == bin_arrays[1].key() {
        &bin_arrays[..1]
    } else {
        &bin_arrays[..]
    };
    dlmm_cpi::add_liquidity_by_weight2(
        AddLiquidityByWeight2 {
            position: &ctx.accounts.position.to_account_info(),
            lb_pair: &ctx.accounts.lb_pair.to_account_info(),
            user_token_x: &user_token_x,
            user_token_y: &user_token_y,
            reserve_x: &ctx.accounts.reserve_x.to_account_info(),
            reserve_y: &ctx.accounts.reserve_y.to_account_info(),
            token_x_mint: &mint_x,
            token_y_mint: &mint_y,
            sender: &custody_info,
            token_program: &token_program,
            event_authority: &ctx.accounts.event_authority.to_account_info(),
            dlmm_program: &ctx.accounts.dlmm_program.to_account_info(),
            bin_arrays,
        },
        LiquidityByWeight {
            amount_x,
            amount_y,
            active_id,
            max_active_bin_slippage: if first_seeding { 0 } else { DLMM_MAX_ACTIVE_BIN_SLIPPAGE },
            bin_liquidity_dist: &distribution,
        },
        &[custody_seeds],
    )?;

    // Sweep whatever the weight distribution did not consume.
    ctx.accounts.custody_usdc.reload()?;
    ctx.accounts.custody_shares.reload()?;
    let leftover_usdc = ctx.accounts.custody_usdc.amount.saturating_sub(custody_usdc_before);
    let leftover_shares = ctx.accounts.custody_shares.amount.saturating_sub(custody_shares_before);
    let deposited_usdc = math::sub(dlmm_usdc, leftover_usdc)?;
    let deposited_shares = math::sub(dlmm_shares, leftover_shares)?;
    require!(deposited_usdc > 0 || deposited_shares > 0, VentrionError::DlmmLiquiditySeedFailed);
    token::transfer(
        &token_program,
        &ctx.accounts.custody_usdc.to_account_info(),
        &ctx.accounts.milestone_usdc_vault.to_account_info(),
        &custody_info,
        &[custody_seeds],
        leftover_usdc,
    )?;
    token::transfer(
        &token_program,
        &ctx.accounts.custody_shares.to_account_info(),
        &ctx.accounts.master_lock_vault.to_account_info(),
        &custody_info,
        &[custody_seeds],
        leftover_shares,
    )?;

    // ------------------------------------------------ 4: milestone escrow
    token::transfer(&token_program, &vault, &ctx.accounts.milestone_usdc_vault.to_account_info(), &round_info, &[&round_seeds.seeds()], escrow_base)?;
    let escrow_total = math::add(escrow_base, leftover_usdc)?;

    // ---------------------------------------------------------------- effects
    let now = Clock::get()?.unix_timestamp;
    let escrow = &mut ctx.accounts.milestone_escrow;
    let count = escrow.milestones_count as usize;
    let mut allocated: u64 = 0;
    for (i, milestone) in escrow.milestones.iter_mut().take(count).enumerate() {
        milestone.amount_usdc = if i + 1 == count {
            escrow_total - allocated
        } else {
            math::apply_bps(escrow_total, milestone.percentage_bps as u64)?
        };
        allocated = math::add(allocated, milestone.amount_usdc)?;
    }
    escrow.total_allocated_usdc = escrow_total;
    escrow.primary_tokens_quorum_base = shares_sold;
    escrow.primary_tokens_remaining = shares_sold;
    escrow.is_funded = true;

    let custody = &mut ctx.accounts.dlmm_custody;
    custody.positions_count = custody.positions_count.checked_add(1).ok_or(VentrionError::MathOverflow)?;
    custody.total_usdc_deposited = math::add(custody.total_usdc_deposited, deposited_usdc)?;
    custody.total_shares_deposited = math::add(custody.total_shares_deposited, deposited_shares)?;
    custody.is_permanently_locked = true;

    let round = &mut ctx.accounts.funding_round;
    round.escrow_usdc = escrow_total;
    round.dlmm_seed_usdc = deposited_usdc;
    round.dlmm_seed_shares = deposited_shares;
    round.round_status = RoundStatus::Graduated;
    round.graduated_ts = now;

    let venture = &mut ctx.accounts.venture;
    venture.status = VentureStatus::GraduatedDLMMLive;
    venture.unredeemed_receipt_shares = math::add(venture.unredeemed_receipt_shares, shares_sold)?;
    venture.circulating_public_float = math::add(venture.circulating_public_float, deposited_shares)?;
    venture.total_legal_fees_escrowed = math::add(venture.total_legal_fees_escrowed, legal_fee)?;

    emit!(AtomicGraduationExecuted {
        venture: venture_key,
        funding_round: round.key(),
        lb_pair: ctx.accounts.lb_pair.key(),
        total_raised_usdc: total_raised,
        legal_fee_usdc: legal_fee,
        upfront_usdc: upfront,
        dlmm_usdc_deposited: deposited_usdc,
        dlmm_shares_deposited: deposited_shares,
        escrow_usdc: escrow_total,
        timestamp: now,
    });
    Ok(())
}
