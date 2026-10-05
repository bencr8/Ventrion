use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::DlmmPoolPrepared;
use crate::state::{DlmmCustody, FundingRound, GlobalConfig, RoundStatus, VentureState, VentureStatus};
use crate::utils::meteora::cpi::{self as dlmm_cpi, InitializeLbPair2, InitializePosition2};
use crate::utils::{math, meteora};

/// Graduation step A (permissionless): creates — or validates — the canonical
/// Meteora DLMM LB pair of the venture, the bin arrays covering the liquidity
/// range and the round's position owned by `DlmmCustody`.
///
/// Splitting graduation keeps both transactions inside the 1232-byte and compute
/// limits. Pool creation is front-running safe: a pool created by a third party is
/// only accepted if its active bin equals the flat round price (for the first
/// seeding); anyone may move an empty pool's price with DLMM `go_to_a_bin`.
#[derive(Accounts)]
pub struct PrepareDlmmPool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = global_config @ VentrionError::Unauthorized,
        has_one = dlmm_custody @ VentrionError::InvalidMeteoraAccount,
        has_one = usdc_mint @ VentrionError::InvalidUsdcMint,
        has_one = venture_token_mint @ VentrionError::InvalidTokenAccount
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(
        mut,
        seeds = [SEED_DLMM_CUSTODY, venture.key().as_ref()],
        bump = dlmm_custody.bump
    )]
    pub dlmm_custody: Box<Account<'info, DlmmCustody>>,

    pub usdc_mint: Box<Account<'info, Mint>>,
    pub venture_token_mint: Box<Account<'info, Mint>>,

    /// CHECK: canonical v2 LB pair PDA, verified in the handler.
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,
    /// CHECK: DLMM reserve `[lb_pair, token_x_mint]`, seeds enforced by the DLMM program.
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,
    /// CHECK: DLMM reserve `[lb_pair, token_y_mint]`, seeds enforced by the DLMM program.
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,
    /// CHECK: DLMM oracle `["oracle", lb_pair]`, seeds enforced by the DLMM program.
    #[account(mut)]
    pub oracle: UncheckedAccount<'info>,
    /// CHECK: must be the protocol's configured `PresetParameter2`.
    #[account(address = global_config.dlmm_preset_parameter @ VentrionError::InvalidMeteoraAccount)]
    pub preset_parameter: UncheckedAccount<'info>,
    /// CHECK: bin array containing the lowest bin of the position, verified in the handler.
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,
    /// CHECK: bin array containing the highest bin (may equal `bin_array_lower`).
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,
    /// CHECK: program PDA that becomes the DLMM position account (signs its creation).
    #[account(
        mut,
        seeds = [SEED_DLMM_POSITION, funding_round.key().as_ref()],
        bump
    )]
    pub position: UncheckedAccount<'info>,
    /// CHECK: DLMM event authority, seeds enforced by the DLMM program.
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK: canonical Meteora DLMM program.
    #[account(address = METEORA_DLMM_PROGRAM_ID @ VentrionError::InvalidMeteoraProgram)]
    pub dlmm_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_prepare_dlmm_pool(ctx: Context<PrepareDlmmPool>, active_id: i32) -> Result<()> {
    // ---------------------------------------------------------------- gating
    require!(
        ctx.accounts.venture.status == VentureStatus::VerifiedApproved,
        VentrionError::VentureNotApproved
    );
    require!(
        ctx.accounts.funding_round.round_status == RoundStatus::VerifiedApproved,
        VentrionError::RoundNotEligibleForGraduation
    );
    require!(!ctx.accounts.funding_round.dlmm_prepared, VentrionError::InvalidRoundStatus);

    // ------------------------------------------------------- pool identity
    let usdc_mint = ctx.accounts.usdc_mint.key();
    let share_mint = ctx.accounts.venture_token_mint.key();
    let (token_x_mint, token_y_mint) = meteora::sort_mints(&share_mint, &usdc_mint);
    let shares_are_token_x = token_x_mint == share_mint;
    let preset = meteora::read_preset_parameter2(&ctx.accounts.preset_parameter)?;

    let custody = &ctx.accounts.dlmm_custody;
    let first_seeding = custody.positions_count == 0;
    let expected_lb_pair = if custody.lb_pair == Pubkey::default() {
        meteora::derive_meteora_lb_pair_v2(&ctx.accounts.preset_parameter.key(), &share_mint, &usdc_mint).0
    } else {
        custody.lb_pair
    };
    require_keys_eq!(ctx.accounts.lb_pair.key(), expected_lb_pair, VentrionError::InvalidMeteoraPool);

    let flat_price = math::flat_price_q64(ctx.accounts.funding_round.price_per_share_usdc, shares_are_token_x)?;
    let dlmm_program = ctx.accounts.dlmm_program.to_account_info();
    let payer = ctx.accounts.payer.to_account_info();
    let system_program = ctx.accounts.system_program.to_account_info();
    let lb_pair = ctx.accounts.lb_pair.to_account_info();

    // ------------------------------------------------ create or validate pool
    let pool_created = meteora::is_uninitialized(&lb_pair);
    if pool_created {
        require!(
            math::is_nearest_bin(active_id, preset.bin_step, flat_price)?,
            VentrionError::DlmmPriceMismatch
        );
        dlmm_cpi::initialize_lb_pair2(
            InitializeLbPair2 {
                lb_pair: &lb_pair,
                token_mint_x: &ctx.accounts.mint_info(true),
                token_mint_y: &ctx.accounts.mint_info(false),
                reserve_x: &ctx.accounts.reserve_x.to_account_info(),
                reserve_y: &ctx.accounts.reserve_y.to_account_info(),
                oracle: &ctx.accounts.oracle.to_account_info(),
                preset_parameter: &ctx.accounts.preset_parameter.to_account_info(),
                funder: &payer,
                token_program: &ctx.accounts.token_program.to_account_info(),
                system_program: &system_program,
                event_authority: &ctx.accounts.event_authority.to_account_info(),
                dlmm_program: &dlmm_program,
            },
            active_id,
        )?;
    }
    let pool = meteora::read_lb_pair(&lb_pair)?;
    require!(
        pool.token_x_mint == token_x_mint
            && pool.token_y_mint == token_y_mint
            && pool.bin_step == preset.bin_step,
        VentrionError::InvalidMeteoraPool
    );
    require!(pool.active_id == active_id, VentrionError::DlmmPriceMismatch);
    if first_seeding {
        // The permanent liquidity must start exactly at the flat round price.
        require!(
            math::is_nearest_bin(active_id, preset.bin_step, flat_price)?,
            VentrionError::DlmmPriceMismatch
        );
    }

    // ------------------------------------------------------------ bin arrays
    let lower_bin_id = active_id
        .checked_sub(DLMM_POSITION_HALF_WIDTH)
        .ok_or(VentrionError::MathOverflow)?;
    let upper_bin_id = lower_bin_id
        .checked_add(DLMM_POSITION_WIDTH - 1)
        .ok_or(VentrionError::MathOverflow)?;
    let lower_index = math::bin_array_index(lower_bin_id);
    let upper_index = math::bin_array_index(upper_bin_id);
    require!(
        lower_index >= DLMM_DEFAULT_BITMAP_MIN_INDEX && upper_index <= DLMM_DEFAULT_BITMAP_MAX_INDEX,
        VentrionError::DlmmBinArrayOutOfRange
    );
    for (info, index) in [
        (ctx.accounts.bin_array_lower.to_account_info(), lower_index),
        (ctx.accounts.bin_array_upper.to_account_info(), upper_index),
    ] {
        require_keys_eq!(
            info.key(),
            meteora::derive_bin_array(&expected_lb_pair, index).0,
            VentrionError::InvalidDlmmBinArray
        );
        if meteora::is_uninitialized(&info) {
            dlmm_cpi::initialize_bin_array(&lb_pair, &info, &payer, &system_program, &dlmm_program, index)?;
        } else {
            meteora::assert_dlmm_account(&info, &meteora::BIN_ARRAY_DISCRIMINATOR)?;
        }
    }

    // -------------------------------------------- position owned by custody
    let position = ctx.accounts.position.to_account_info();
    require!(meteora::is_uninitialized(&position), VentrionError::InvalidRoundStatus);
    let round_key = ctx.accounts.funding_round.key();
    let venture_key = ctx.accounts.venture.key();
    let position_bump = [ctx.bumps.position];
    let custody_bump = [ctx.accounts.dlmm_custody.bump];
    let position_seeds: &[&[u8]] = &[SEED_DLMM_POSITION, round_key.as_ref(), &position_bump];
    let custody_seeds: &[&[u8]] = &[SEED_DLMM_CUSTODY, venture_key.as_ref(), &custody_bump];
    dlmm_cpi::initialize_position2(
        InitializePosition2 {
            payer: &payer,
            position: &position,
            lb_pair: &lb_pair,
            owner: &ctx.accounts.dlmm_custody.to_account_info(),
            system_program: &system_program,
            event_authority: &ctx.accounts.event_authority.to_account_info(),
            dlmm_program: &dlmm_program,
        },
        lower_bin_id,
        DLMM_POSITION_WIDTH,
        &[position_seeds, custody_seeds],
    )?;
    meteora::assert_dlmm_account(&position, &meteora::POSITION_V2_DISCRIMINATOR)?;

    // ---------------------------------------------------------------- effects
    let custody = &mut ctx.accounts.dlmm_custody;
    if custody.lb_pair == Pubkey::default() {
        custody.lb_pair = expected_lb_pair;
        custody.token_x_mint = token_x_mint;
        custody.token_y_mint = token_y_mint;
    }
    ctx.accounts.venture.meteora_dlmm_pool = expected_lb_pair;

    let round = &mut ctx.accounts.funding_round;
    round.dlmm_position = position.key();
    round.dlmm_active_id = active_id;
    round.dlmm_lower_bin_id = lower_bin_id;
    round.dlmm_prepared = true;

    emit!(DlmmPoolPrepared {
        venture: venture_key,
        funding_round: round_key,
        lb_pair: expected_lb_pair,
        position: position.key(),
        active_id,
        lower_bin_id,
        pool_created,
    });
    Ok(())
}

impl<'info> PrepareDlmmPool<'info> {
    /// Account info of DLMM token X (`x = true`) or token Y, i.e. the smaller /
    /// larger of the two mint addresses.
    fn mint_info(&self, x: bool) -> AccountInfo<'info> {
        let usdc = self.usdc_mint.to_account_info();
        let shares = self.venture_token_mint.to_account_info();
        let shares_are_x = shares.key() < usdc.key();
        if shares_are_x == x {
            shares
        } else {
            usdc
        }
    }
}
