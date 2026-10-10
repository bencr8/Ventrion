//! # Ventrion Protocol Constants
//!
//! Protocol-wide mathematical invariants, PDA seeds, financial basis points,
//! Meteora DLMM geometric parameters, and external program addresses.

use anchor_lang::prelude::*;

// -----------------------------------------------------------------------------
// External programs & canonical mints
// -----------------------------------------------------------------------------

/// Meteora DLMM (lb_clmm) program, identical on mainnet-beta and devnet.
pub const METEORA_DLMM_PROGRAM_ID: Pubkey = pubkey!("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
/// SPL Memo v3, required by DLMM `claim_fee2`.
pub const MEMO_PROGRAM_ID: Pubkey = pubkey!("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
/// Metaplex Token Metadata program.
pub const METAPLEX_PROGRAM_ID: Pubkey = pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
/// Canonical Circle USDC on mainnet-beta (enforced when built with `--features mainnet`).
pub const CANONICAL_USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// -----------------------------------------------------------------------------
// Share supply invariants
// -----------------------------------------------------------------------------

pub const SHARE_DECIMALS: u8 = 6;
pub const USDC_DECIMALS: u8 = 6;
/// Atomic units of one whole common share (and one whole $VENT-RN receipt).
pub const ONE_SHARE: u64 = 1_000_000;
/// Exactly 1,000,000 common shares, minted once at genesis.
pub const FIXED_TOTAL_SUPPLY: u64 = 1_000_000 * ONE_SHARE;

// -----------------------------------------------------------------------------
// Capital allocation (basis points)
// -----------------------------------------------------------------------------

pub const BPS_DENOMINATOR: u64 = 10_000;
/// 17.0% of raised USDC and 17.0% of round shares seed the permanent DLMM pool.
pub const DLMM_LIQUIDITY_BPS: u64 = 1_700;
/// Legal setup fee = max($3,000, 3%).
pub const LEGAL_FEE_BPS: u64 = 300;
pub const LEGAL_FEE_MIN_USDC: u64 = 3_000 * 1_000_000;
/// Upfront runway transferred to the founder treasury at graduation (max 15%).
pub const MAX_UPFRONT_CAPITAL_BPS: u16 = 1_500;

// -----------------------------------------------------------------------------
// $VENT verification governance
// -----------------------------------------------------------------------------

/// The verification vote runs for exactly 14 days, starting at `CapReached` (6 seconds in test mode).
#[cfg(not(feature = "testing"))]
pub const VERIFICATION_VOTING_PERIOD_SECONDS: i64 = 14 * SECONDS_PER_DAY;
#[cfg(feature = "testing")]
pub const VERIFICATION_VOTING_PERIOD_SECONDS: i64 = 60;
/// Strict majority: approval requires `for_bps > min_approval_bps` (>= 50.00% floor).
pub const MIN_APPROVAL_BPS_FLOOR: u16 = 5_000;
pub const MAX_QUORUM_BPS: u16 = 10_000;
/// Max protocol royalty on harvested DLMM fees (manifesto default: 50 bps = 0.5%).
pub const MAX_PROTOCOL_FEE_BPS: u16 = 1_000;
/// Minimum $VENT staked required before ventures can launch genesis
#[cfg(not(feature = "testing"))]
pub const MIN_VENT_STAKED_THRESHOLD: u64 = 100_000 * ONE_SHARE;
#[cfg(feature = "testing")]
pub const MIN_VENT_STAKED_THRESHOLD: u64 = 0;

// -----------------------------------------------------------------------------
// Milestone governance
// -----------------------------------------------------------------------------

#[cfg(not(feature = "testing"))]
pub const OPTIMISTIC_VETO_WINDOW_SECONDS: i64 = 7 * SECONDS_PER_DAY;
#[cfg(feature = "testing")]
pub const OPTIMISTIC_VETO_WINDOW_SECONDS: i64 = 8;
pub const VETO_THRESHOLD_BPS: u64 = 3_333;
pub const APPROVAL_THRESHOLD_BPS: u64 = 5_000;
pub const MAX_AMENDMENT_COUNT: u8 = 3;
pub const MAX_MILESTONES: usize = 10;

// -----------------------------------------------------------------------------
// Founder vesting bounds (12-36 months, 6-12 month cliff)
// -----------------------------------------------------------------------------

pub const SECONDS_PER_DAY: i64 = 86_400;
pub const MIN_FOUNDER_VESTING_SECONDS: i64 = 365 * SECONDS_PER_DAY;
pub const MAX_FOUNDER_VESTING_SECONDS: i64 = 3 * 365 * SECONDS_PER_DAY;
#[cfg(not(feature = "testing"))]
pub const MIN_FOUNDER_CLIFF_SECONDS: i64 = 182 * SECONDS_PER_DAY;
#[cfg(feature = "testing")]
pub const MIN_FOUNDER_CLIFF_SECONDS: i64 = 0;
pub const MAX_FOUNDER_CLIFF_SECONDS: i64 = 365 * SECONDS_PER_DAY;

// -----------------------------------------------------------------------------
// Investor staking (O(1) dividend accumulator)
// -----------------------------------------------------------------------------

pub const MAX_STAKE_LOCK_SECONDS: i64 = 730 * SECONDS_PER_DAY;
pub const STAKING_MULT_0D_BPS: u16 = 10_000;
pub const STAKING_MULT_90D_BPS: u16 = 12_500;
pub const STAKING_MULT_180D_BPS: u16 = 15_000;
pub const STAKING_MULT_365D_BPS: u16 = 20_000;
pub const STAKING_MULT_730D_BPS: u16 = 30_000;
/// 10^12 scaling factor of the dividend accumulator (intermediates use u256).
pub const ACC_PRECISION: u128 = 1_000_000_000_000;

// -----------------------------------------------------------------------------
// Meteora DLMM geometry
// -----------------------------------------------------------------------------

/// Bins per DLMM bin array (`MAX_BIN_PER_ARRAY`).
pub const DLMM_BINS_PER_ARRAY: i32 = 70;
/// Liquidity is spread uniformly across `active_id - 34 ..= active_id + 34` (69 bins).
pub const DLMM_POSITION_HALF_WIDTH: i32 = 34;
pub const DLMM_POSITION_WIDTH: i32 = 2 * DLMM_POSITION_HALF_WIDTH + 1;
/// Default in-account bin array bitmap covers indices [-512, 511] (`BIN_ARRAY_BITMAP_SIZE`).
pub const DLMM_DEFAULT_BITMAP_MIN_INDEX: i64 = -512;
pub const DLMM_DEFAULT_BITMAP_MAX_INDEX: i64 = 511;
pub const DLMM_MAX_ACTIVE_BIN_SLIPPAGE: i32 = 3;
pub const DLMM_BIN_WEIGHT: u16 = 1_000;

// -----------------------------------------------------------------------------
// PDA seeds
// -----------------------------------------------------------------------------

pub const SEED_GLOBAL_CONFIG: &[u8] = b"global_config";
pub const SEED_MASTER_FEE_VAULT: &[u8] = b"master_fee_vault";
pub const SEED_VENT_STAKE_VAULT: &[u8] = b"vent_stake_vault";
pub const SEED_VENT_STAKE: &[u8] = b"vent_stake";
pub const SEED_VENTURE: &[u8] = b"venture";
pub const SEED_MASTER_LOCK_VAULT: &[u8] = b"master_lock_vault";
pub const SEED_LEGAL_SETUP_VAULT: &[u8] = b"legal_setup_vault";
pub const SEED_DIVIDEND_VAULT: &[u8] = b"dividend_vault";
pub const SEED_STAKED_SHARES_VAULT: &[u8] = b"staked_shares_vault";
pub const SEED_FOUNDER_VESTING: &[u8] = b"founder_vesting";
pub const SEED_VESTING_VAULT: &[u8] = b"vesting_vault";
pub const SEED_FUNDING_ROUND: &[u8] = b"funding_round";
pub const SEED_RECEIPT_MINT: &[u8] = b"receipt_mint";
pub const SEED_ROUND_USDC_VAULT: &[u8] = b"round_usdc_vault";
pub const SEED_ROUND_RECORD: &[u8] = b"round_record";
pub const SEED_VERIFICATION_VOTE: &[u8] = b"verification_vote";
pub const SEED_STAKER_VOTE: &[u8] = b"staker_vote";
pub const SEED_MILESTONE_ESCROW: &[u8] = b"milestone_escrow";
pub const SEED_MILESTONE_USDC_VAULT: &[u8] = b"milestone_usdc_vault";
pub const SEED_INVESTOR_VAULT: &[u8] = b"investor_vault";
pub const SEED_DLMM_CUSTODY: &[u8] = b"dlmm_custody";
pub const SEED_CUSTODY_USDC: &[u8] = b"custody_usdc";
pub const SEED_CUSTODY_SHARES: &[u8] = b"custody_shares";
pub const SEED_DLMM_POSITION: &[u8] = b"dlmm_position";
