use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{DividendsDistributed, DlmmFeesHarvested, VentDividendsHarvested};
use crate::instructions::investor_staking::{distribute_dividends, DIVIDEND_SOURCE_DLMM_FEES};
use crate::state::{DlmmCustody, FundingRound, GlobalConfig, RoundStatus, VentureState};
use crate::utils::meteora::cpi::{self as dlmm_cpi, ClaimFee2};
use crate::utils::{math, meteora, token};

/// Permissionless: claims the trading fees accrued by a round's permanently locked
/// DLMM position. USDC fees (minus the protocol royalty) become dividends of the
/// venture's share stakers; share-denominated fees return to the company treasury
/// (`MasterLockVault`). The liquidity itself can never be withdrawn.
#[derive(Accounts)]
pub struct HarvestDlmmFees<'info> {
    pub harvester: Signer<'info>,

    #[account(mut, seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = global_config @ VentrionError::Unauthorized,
        has_one = dlmm_custody @ VentrionError::InvalidMeteoraAccount,
        has_one = dividend_vault @ VentrionError::InvalidTokenAccount,
        has_one = master_lock_vault @ VentrionError::InvalidTokenAccount,
        has_one = usdc_mint @ VentrionError::InvalidUsdcMint,
        has_one = venture_token_mint @ VentrionError::InvalidTokenAccount
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
        constraint = matches!(funding_round.round_status, RoundStatus::Graduated | RoundStatus::Completed)
            @ VentrionError::InvalidRoundStatus
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(
        mut,
        seeds = [SEED_DLMM_CUSTODY, venture.key().as_ref()],
        bump = dlmm_custody.bump,
        has_one = custody_usdc @ VentrionError::InvalidTokenAccount,
        has_one = custody_shares @ VentrionError::InvalidTokenAccount,
        has_one = lb_pair @ VentrionError::InvalidMeteoraPool
    )]
    pub dlmm_custody: Box<Account<'info, DlmmCustody>>,

    #[account(mut)]
    pub custody_usdc: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub custody_shares: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub dividend_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub master_lock_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [SEED_MASTER_FEE_VAULT],
        bump = global_config.master_fee_vault_bump,
        token::mint = usdc_mint,
        token::authority = global_config
    )]
    pub master_fee_vault: Box<Account<'info, TokenAccount>>,

    pub usdc_mint: Box<Account<'info, Mint>>,
    pub venture_token_mint: Box<Account<'info, Mint>>,

    /// CHECK: equals `dlmm_custody.lb_pair` (has_one).
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,
    /// CHECK: equals `funding_round.dlmm_position`.
    #[account(mut, address = funding_round.dlmm_position @ VentrionError::InvalidMeteoraAccount)]
    pub position: UncheckedAccount<'info>,
    /// CHECK: verified against the LB pair state and by the DLMM program.
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,
    /// CHECK: verified against the LB pair state and by the DLMM program.
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,
    /// CHECK: derived from the recorded lower bin (checked in the handler).
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,
    /// CHECK: derived from the recorded upper bin (checked in the handler).
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,
    /// CHECK: SPL Memo program (required by `claim_fee2`).
    #[account(address = MEMO_PROGRAM_ID @ VentrionError::InvalidParameter)]
    pub memo_program: UncheckedAccount<'info>,
    /// CHECK: DLMM event authority, seeds enforced by the DLMM program.
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK: canonical Meteora DLMM program.
    #[account(address = METEORA_DLMM_PROGRAM_ID @ VentrionError::InvalidMeteoraProgram)]
    pub dlmm_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_harvest_dlmm_fees(ctx: Context<HarvestDlmmFees>) -> Result<()> {
    let lb_pair_key = ctx.accounts.lb_pair.key();
    let pool = meteora::read_lb_pair(&ctx.accounts.lb_pair)?;
    require!(
        pool.reserve_x == ctx.accounts.reserve_x.key() && pool.reserve_y == ctx.accounts.reserve_y.key(),
        VentrionError::InvalidMeteoraPool
    );
    let lower_bin_id = ctx.accounts.funding_round.dlmm_lower_bin_id;
    let upper_bin_id = lower_bin_id + DLMM_POSITION_WIDTH - 1;
    require_keys_eq!(
        ctx.accounts.bin_array_lower.key(),
        meteora::derive_bin_array(&lb_pair_key, math::bin_array_index(lower_bin_id)).0,
        VentrionError::InvalidDlmmBinArray
    );
    require_keys_eq!(
        ctx.accounts.bin_array_upper.key(),
        meteora::derive_bin_array(&lb_pair_key, math::bin_array_index(upper_bin_id)).0,
        VentrionError::InvalidDlmmBinArray
    );

    let shares_are_token_x = pool.token_x_mint == ctx.accounts.venture_token_mint.key();
    let (user_token_x, user_token_y, mint_x, mint_y) = if shares_are_token_x {
        (
            ctx.accounts.custody_shares.to_account_info(),
            ctx.accounts.custody_usdc.to_account_info(),
            ctx.accounts.venture_token_mint.to_account_info(),
            ctx.accounts.usdc_mint.to_account_info(),
        )
    } else {
        (
            ctx.accounts.custody_usdc.to_account_info(),
            ctx.accounts.custody_shares.to_account_info(),
            ctx.accounts.usdc_mint.to_account_info(),
            ctx.accounts.venture_token_mint.to_account_info(),
        )
    };
    let bin_arrays = [
        ctx.accounts.bin_array_lower.to_account_info(),
        ctx.accounts.bin_array_upper.to_account_info(),
    ];
    let bin_arrays: &[AccountInfo] = if bin_arrays[0].key() == bin_arrays[1].key() {
        &bin_arrays[..1]
    } else {
        &bin_arrays[..]
    };

    let venture_key = ctx.accounts.venture.key();
    let custody_bump = [ctx.accounts.dlmm_custody.bump];
    let custody_seeds: &[&[u8]] = &[SEED_DLMM_CUSTODY, venture_key.as_ref(), &custody_bump];
    let custody_info = ctx.accounts.dlmm_custody.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();
    let usdc_before = ctx.accounts.custody_usdc.amount;
    let shares_before = ctx.accounts.custody_shares.amount;

    dlmm_cpi::claim_fee2(
        ClaimFee2 {
            lb_pair: &ctx.accounts.lb_pair.to_account_info(),
            position: &ctx.accounts.position.to_account_info(),
            sender: &custody_info,
            reserve_x: &ctx.accounts.reserve_x.to_account_info(),
            reserve_y: &ctx.accounts.reserve_y.to_account_info(),
            user_token_x: &user_token_x,
            user_token_y: &user_token_y,
            token_x_mint: &mint_x,
            token_y_mint: &mint_y,
            token_program: &token_program,
            memo_program: &ctx.accounts.memo_program.to_account_info(),
            event_authority: &ctx.accounts.event_authority.to_account_info(),
            dlmm_program: &ctx.accounts.dlmm_program.to_account_info(),
            bin_arrays,
        },
        lower_bin_id,
        upper_bin_id,
        &[custody_seeds],
    )?;

    ctx.accounts.custody_usdc.reload()?;
    ctx.accounts.custody_shares.reload()?;
    let usdc_fees = ctx.accounts.custody_usdc.amount.saturating_sub(usdc_before);
    let share_fees = ctx.accounts.custody_shares.amount.saturating_sub(shares_before);

    // Share fees -> company treasury.
    token::transfer(
        &token_program,
        &ctx.accounts.custody_shares.to_account_info(),
        &ctx.accounts.master_lock_vault.to_account_info(),
        &custody_info,
        &[custody_seeds],
        ctx.accounts.custody_shares.amount,
    )?;

    // USDC fees (including any previously retained) -> royalty + dividends.
    // Without active stakers the USDC stays in custody until the next harvest.
    let distributable = ctx.accounts.custody_usdc.amount;
    let mut royalty = 0;
    let mut dividends = 0;
    if distributable > 0 && ctx.accounts.venture.total_dividend_weight_units > 0 {
        // Dynamic Creator Fee: 100 to 500 bps (default 200 bps = 2.0%)
        let raw_fee = ctx.accounts.funding_round.trading_fee_bps;
        let f_bps = if (100..=500).contains(&raw_fee) {
            raw_fee as u64
        } else {
            200u64
        };
        // Linear protocol royalty formula: R_bps = 25 + (F_bps - 100) / 8
        // At 100 bps -> 25 bps; at 500 bps -> 75 bps
        let r_bps = 25 + (f_bps.saturating_sub(100)) / 8;
        royalty = math::mul_div_floor(distributable, r_bps, f_bps)?;
        dividends = distributable.saturating_sub(royalty);
        if royalty > 0 {
            token::transfer(
                &token_program,
                &ctx.accounts.custody_usdc.to_account_info(),
                &ctx.accounts.master_fee_vault.to_account_info(),
                &custody_info,
                &[custody_seeds],
                royalty,
            )?;

            if ctx.accounts.global_config.total_vent_staked > 0 {
                let inc = math::accumulator_increment(royalty, ctx.accounts.global_config.total_vent_staked as u128)?;
                let config = &mut ctx.accounts.global_config;
                config.acc_vent_dividend_per_share = config.acc_vent_dividend_per_share.checked_add(inc).ok_or(VentrionError::MathOverflow)?;
                config.total_vent_dividends_distributed = math::add(config.total_vent_dividends_distributed, royalty)?;

                emit!(VentDividendsHarvested {
                    amount_usdc: royalty,
                    new_acc_dividend_per_share: config.acc_vent_dividend_per_share,
                    total_distributed_usdc: config.total_vent_dividends_distributed,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            }
        }
        if dividends > 0 {
            token::transfer(
                &token_program,
                &ctx.accounts.custody_usdc.to_account_info(),
                &ctx.accounts.dividend_vault.to_account_info(),
                &custody_info,
                &[custody_seeds],
                dividends,
            )?;
            distribute_dividends(&mut ctx.accounts.venture, dividends)?;
        }
    }

    let custody = &mut ctx.accounts.dlmm_custody;
    custody.total_fees_harvested_usdc = math::add(custody.total_fees_harvested_usdc, usdc_fees)?;
    custody.total_fees_harvested_shares = math::add(custody.total_fees_harvested_shares, share_fees)?;

    emit!(DlmmFeesHarvested {
        venture: venture_key,
        usdc_fees,
        share_fees,
        protocol_royalty_usdc: royalty,
    });
    if dividends > 0 {
        emit!(DividendsDistributed {
            venture: venture_key,
            amount_usdc: dividends,
            source: DIVIDEND_SOURCE_DLMM_FEES,
            reference: lb_pair_key.to_bytes(),
            acc_dividend_per_weight_unit: ctx.accounts.venture.acc_dividend_per_weight_unit,
        });
    }
    Ok(())
}
