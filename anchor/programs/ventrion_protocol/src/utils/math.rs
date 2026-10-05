//! Checked fixed-point arithmetic used by every financial code path.
//!
//! All functions return `Result` and never panic: every multiplication is widened
//! (u128 / U256) and every division is checked, so rounding is always explicit
//! (floor) and always in favour of the protocol vaults.

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::VentrionError;

#[allow(clippy::assign_op_pattern, clippy::ptr_offset_with_cast, clippy::manual_range_contains)]
mod u256 {
    uint::construct_uint! {
        /// 256-bit unsigned integer for overflow-free intermediates.
        pub struct U256(4);
    }
}
pub use u256::U256;

/// Q64.64 fixed-point `1.0`.
pub const Q64_ONE: u128 = 1u128 << 64;

/// Scaling factor of the dividend accumulator. Investor weights are expressed in
/// `share_atoms * multiplier_bps`, so the accumulator is additionally scaled by the
/// bps denominator to retain full ACC_PRECISION per share atom.
pub const ACC_SCALE: u128 = ACC_PRECISION * BPS_DENOMINATOR as u128;

#[inline]
fn overflow() -> Error {
    error!(VentrionError::MathOverflow)
}

/// `floor(a * b / denominator)` with a u128 intermediate.
pub fn mul_div_floor(a: u64, b: u64, denominator: u64) -> Result<u64> {
    require!(denominator != 0, VentrionError::MathOverflow);
    let value = (a as u128)
        .checked_mul(b as u128)
        .ok_or_else(overflow)?
        .checked_div(denominator as u128)
        .ok_or_else(overflow)?;
    u64::try_from(value).map_err(|_| overflow())
}

/// `floor(amount * bps / 10_000)`.
pub fn apply_bps(amount: u64, bps: u64) -> Result<u64> {
    mul_div_floor(amount, bps, BPS_DENOMINATOR)
}

pub fn add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or_else(overflow)
}

pub fn sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or_else(overflow)
}

// -----------------------------------------------------------------------------
// Flat-curve price conversions (exact, never rounded)
// -----------------------------------------------------------------------------

/// Share atoms bought for `usdc_amount` atoms at the flat price. Must be exact.
pub fn shares_for_usdc(usdc_amount: u64, price_per_share_usdc: u64) -> Result<u64> {
    require!(price_per_share_usdc > 0, VentrionError::InvalidPrice);
    let numerator = (usdc_amount as u128)
        .checked_mul(ONE_SHARE as u128)
        .ok_or_else(overflow)?;
    require!(
        numerator % price_per_share_usdc as u128 == 0,
        VentrionError::InexactPriceConversion
    );
    u64::try_from(numerator / price_per_share_usdc as u128).map_err(|_| overflow())
}

/// USDC atoms owed for `share_amount` atoms at the flat price. Must be exact.
pub fn usdc_for_shares(share_amount: u64, price_per_share_usdc: u64) -> Result<u64> {
    require!(price_per_share_usdc > 0, VentrionError::InvalidPrice);
    let numerator = (share_amount as u128)
        .checked_mul(price_per_share_usdc as u128)
        .ok_or_else(overflow)?;
    require!(
        numerator % ONE_SHARE as u128 == 0,
        VentrionError::InexactPriceConversion
    );
    u64::try_from(numerator / ONE_SHARE as u128).map_err(|_| overflow())
}

// -----------------------------------------------------------------------------
// Round capital allocation (manifesto section 4.3)
// -----------------------------------------------------------------------------

/// Deterministic split of a fully raised round.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct RoundAllocation {
    /// `max($3,000, 3%)` -> `LegalSetupVault`.
    pub legal_fee_usdc: u64,
    /// 17.0% of raised USDC -> permanent DLMM liquidity.
    pub dlmm_usdc: u64,
    /// `upfront_working_capital_bps` (max 15%) -> founder treasury.
    pub upfront_usdc: u64,
    /// Remainder -> `MilestoneEscrowUsdcVault`.
    pub escrow_usdc: u64,
    /// 17.0% of the round shares -> permanent DLMM liquidity (from the master vault).
    pub dlmm_shares: u64,
}

pub fn legal_fee(total_raised_usdc: u64) -> Result<u64> {
    Ok(apply_bps(total_raised_usdc, LEGAL_FEE_BPS)?.max(LEGAL_FEE_MIN_USDC))
}

/// Computes the graduation split. Fails with `InvalidRoundEconomics` unless a
/// strictly positive milestone escrow remains.
pub fn round_allocation(
    total_raised_usdc: u64,
    shares_for_sale: u64,
    upfront_working_capital_bps: u16,
) -> Result<RoundAllocation> {
    require!(
        upfront_working_capital_bps <= MAX_UPFRONT_CAPITAL_BPS,
        VentrionError::InvalidUpfrontCapitalBps
    );
    let legal_fee_usdc = legal_fee(total_raised_usdc)?;
    let dlmm_usdc = apply_bps(total_raised_usdc, DLMM_LIQUIDITY_BPS)?;
    let upfront_usdc = apply_bps(total_raised_usdc, upfront_working_capital_bps as u64)?;
    let committed = legal_fee_usdc
        .checked_add(dlmm_usdc)
        .and_then(|v| v.checked_add(upfront_usdc))
        .ok_or_else(overflow)?;
    require!(committed < total_raised_usdc, VentrionError::InvalidRoundEconomics);
    let dlmm_shares = apply_bps(shares_for_sale, DLMM_LIQUIDITY_BPS)?;
    require!(dlmm_usdc > 0 && dlmm_shares > 0, VentrionError::InvalidRoundEconomics);
    Ok(RoundAllocation {
        legal_fee_usdc,
        dlmm_usdc,
        upfront_usdc,
        escrow_usdc: total_raised_usdc - committed,
        dlmm_shares,
    })
}

// -----------------------------------------------------------------------------
// Founder vesting
// -----------------------------------------------------------------------------

/// Linear vesting from `start` over `duration`, nothing before `start + cliff`.
pub fn vested_amount(total: u64, start: i64, cliff: i64, duration: i64, now: i64) -> Result<u64> {
    let elapsed = now.checked_sub(start).ok_or_else(overflow)?;
    if elapsed < cliff {
        return Ok(0);
    }
    if elapsed >= duration {
        return Ok(total);
    }
    // 0 <= elapsed < duration, both positive (validated at genesis).
    mul_div_floor(total, elapsed as u64, duration as u64)
}

// -----------------------------------------------------------------------------
// Investor staking
// -----------------------------------------------------------------------------

/// Lock tier multiplier (manifesto section 5.2).
pub fn staking_multiplier_bps(lock_duration_seconds: i64) -> Result<u16> {
    require!(
        (0..=MAX_STAKE_LOCK_SECONDS).contains(&lock_duration_seconds),
        VentrionError::LockDurationTooShort
    );
    let days = lock_duration_seconds / SECONDS_PER_DAY;
    Ok(match days {
        d if d >= 730 => STAKING_MULT_730D_BPS,
        d if d >= 365 => STAKING_MULT_365D_BPS,
        d if d >= 180 => STAKING_MULT_180D_BPS,
        d if d >= 90 => STAKING_MULT_90D_BPS,
        _ => STAKING_MULT_0D_BPS,
    })
}

pub fn effective_weight(staked_amount: u64, multiplier_bps: u16) -> u128 {
    // u64 * u16 always fits into u128.
    staked_amount as u128 * multiplier_bps as u128
}

/// Accumulator increment for distributing `amount` over `total_weight`.
pub fn accumulator_increment(amount: u64, total_weight: u128) -> Result<u128> {
    require!(total_weight > 0, VentrionError::NoActiveStakers);
    let value = U256::from(amount)
        .checked_mul(U256::from(ACC_SCALE))
        .ok_or_else(overflow)?
        / U256::from(total_weight);
    u256_to_u128(value)
}

/// USDC owed to `weight` since checkpoint `last_acc`.
pub fn pending_dividends(weight: u128, acc: u128, last_acc: u128) -> Result<u64> {
    let delta = acc.checked_sub(last_acc).ok_or_else(overflow)?;
    let value = U256::from(weight)
        .checked_mul(U256::from(delta))
        .ok_or_else(overflow)?
        / U256::from(ACC_SCALE);
    u64::try_from(u256_to_u128(value)?).map_err(|_| overflow())
}

fn u256_to_u128(value: U256) -> Result<u128> {
    require!(value.bits() <= 128, VentrionError::MathOverflow);
    Ok(value.as_u128())
}

// -----------------------------------------------------------------------------
// Meteora DLMM bin price (Q64.64)
// -----------------------------------------------------------------------------

/// `(1 + bin_step / 10_000)^bin_id` in Q64.64, computed by binary exponentiation
/// over U256. Relative error is far below one bin step, which is all the
/// nearest-bin check below requires.
pub fn dlmm_bin_price_q64(bin_id: i32, bin_step: u16) -> Result<u128> {
    require!(bin_step > 0, VentrionError::InvalidParameter);
    let one = U256::from(Q64_ONE);
    let base = one + (U256::from(bin_step as u64) << 64) / U256::from(BPS_DENOMINATOR);
    let mut exp = bin_id.unsigned_abs();
    let mut result = one;
    let mut factor = base;
    while exp > 0 {
        if exp & 1 == 1 {
            result = q64_mul(result, factor)?;
        }
        exp >>= 1;
        if exp > 0 {
            factor = q64_mul(factor, factor)?;
        }
    }
    if bin_id < 0 {
        require!(!result.is_zero(), VentrionError::MathOverflow);
        result = (one << 64) / result;
    }
    require!(!result.is_zero(), VentrionError::MathOverflow);
    u256_to_u128(result)
}

fn q64_mul(a: U256, b: U256) -> Result<U256> {
    let product = a.checked_mul(b).ok_or_else(overflow)? >> 64;
    // Keep every intermediate within Q64.64 range so the next multiply cannot overflow.
    require!(product.bits() <= 128, VentrionError::MathOverflow);
    Ok(product)
}

/// Target DLMM price (Y atoms per X atom, Q64.64) of the flat round price.
///
/// * shares are token X: `price = price_per_share_usdc / ONE_SHARE`
/// * USDC is token X:    `price = ONE_SHARE / price_per_share_usdc`
pub fn flat_price_q64(price_per_share_usdc: u64, shares_are_token_x: bool) -> Result<u128> {
    require!(price_per_share_usdc > 0, VentrionError::InvalidPrice);
    let (numerator, denominator) = if shares_are_token_x {
        (price_per_share_usdc, ONE_SHARE)
    } else {
        (ONE_SHARE, price_per_share_usdc)
    };
    let value = (U256::from(numerator) << 64) / U256::from(denominator);
    require!(!value.is_zero(), VentrionError::InvalidPrice);
    u256_to_u128(value)
}

/// Returns `true` iff `bin_id` is (one of) the bin(s) whose price is nearest to
/// `target_q64`, i.e. neither neighbour is strictly closer.
pub fn is_nearest_bin(bin_id: i32, bin_step: u16, target_q64: u128) -> Result<bool> {
    let price = dlmm_bin_price_q64(bin_id, bin_step)?;
    let lower = dlmm_bin_price_q64(bin_id.checked_sub(1).ok_or_else(overflow)?, bin_step)?;
    let upper = dlmm_bin_price_q64(bin_id.checked_add(1).ok_or_else(overflow)?, bin_step)?;
    let distance = price.abs_diff(target_q64);
    Ok(distance <= lower.abs_diff(target_q64) && distance <= upper.abs_diff(target_q64))
}

// -----------------------------------------------------------------------------
// Meteora DLMM geometry
// -----------------------------------------------------------------------------

/// `floor(bin_id / 70)` (rounds towards negative infinity, like the DLMM program).
pub fn bin_array_index(bin_id: i32) -> i64 {
    (bin_id as i64).div_euclid(DLMM_BINS_PER_ARRAY as i64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flat_price_conversions_are_exact() {
        // 0.10 USDC per share.
        assert_eq!(shares_for_usdc(1_000_000, 100_000).unwrap(), 10 * ONE_SHARE);
        assert_eq!(usdc_for_shares(10 * ONE_SHARE, 100_000).unwrap(), 1_000_000);
        assert!(shares_for_usdc(1, 300_000).is_err());
    }

    #[test]
    fn allocation_matches_manifesto() {
        // $100,000 raise, 10% upfront, 1,000,000 shares for sale at 0.10 USDC.
        let a = round_allocation(100_000_000_000, 1_000_000 * ONE_SHARE, 1_000).unwrap();
        assert_eq!(a.legal_fee_usdc, 3_000_000_000);
        assert_eq!(a.dlmm_usdc, 17_000_000_000);
        assert_eq!(a.upfront_usdc, 10_000_000_000);
        assert_eq!(a.escrow_usdc, 70_000_000_000);
        assert_eq!(a.dlmm_shares, 170_000 * ONE_SHARE);
        // Small raise: legal floor of $3,000 applies.
        let b = round_allocation(20_000_000_000, 200_000 * ONE_SHARE, 0).unwrap();
        assert_eq!(b.legal_fee_usdc, LEGAL_FEE_MIN_USDC);
        // Raise too small to leave an escrow.
        assert!(round_allocation(3_500_000_000, 35_000 * ONE_SHARE, 1_500).is_err());
    }

    #[test]
    fn vesting_is_linear_after_cliff() {
        let year = 365 * SECONDS_PER_DAY;
        assert_eq!(vested_amount(1_000, 0, year / 2, year, year / 4).unwrap(), 0);
        assert_eq!(vested_amount(1_000, 0, year / 2, year, year / 2).unwrap(), 500);
        assert_eq!(vested_amount(1_000, 0, year / 2, year, 2 * year).unwrap(), 1_000);
    }

    #[test]
    fn staking_tiers() {
        assert_eq!(staking_multiplier_bps(0).unwrap(), 10_000);
        assert_eq!(staking_multiplier_bps(90 * SECONDS_PER_DAY).unwrap(), 12_500);
        assert_eq!(staking_multiplier_bps(180 * SECONDS_PER_DAY).unwrap(), 15_000);
        assert_eq!(staking_multiplier_bps(365 * SECONDS_PER_DAY).unwrap(), 20_000);
        assert_eq!(staking_multiplier_bps(730 * SECONDS_PER_DAY).unwrap(), 30_000);
        assert!(staking_multiplier_bps(731 * SECONDS_PER_DAY).is_err());
    }

    #[test]
    fn dividend_accumulator_round_trip() {
        let w1 = effective_weight(1_000 * ONE_SHARE, 10_000);
        let w2 = effective_weight(1_000 * ONE_SHARE, 30_000);
        let inc = accumulator_increment(4_000_000, w1 + w2).unwrap();
        assert_eq!(pending_dividends(w1, inc, 0).unwrap(), 1_000_000);
        assert_eq!(pending_dividends(w2, inc, 0).unwrap(), 3_000_000);
    }

    #[test]
    fn bin_price_and_nearest_bin() {
        assert_eq!(dlmm_bin_price_q64(0, 10).unwrap(), Q64_ONE);
        // 0.10 USDC/share with bin_step 10: ln(0.1)/ln(1.001) = -2303.7 -> nearest bin -2304.
        let target = flat_price_q64(100_000, true).unwrap();
        assert!(is_nearest_bin(-2304, 10, target).unwrap());
        assert!(!is_nearest_bin(-2302, 10, target).unwrap());
        // Inverse orientation: 10 shares per USDC -> +2304.
        let inverse = flat_price_q64(100_000, false).unwrap();
        assert!(is_nearest_bin(2304, 10, inverse).unwrap());
    }

    #[test]
    fn bin_array_index_floors() {
        assert_eq!(bin_array_index(0), 0);
        assert_eq!(bin_array_index(69), 0);
        assert_eq!(bin_array_index(70), 1);
        assert_eq!(bin_array_index(-1), -1);
        assert_eq!(bin_array_index(-70), -1);
        assert_eq!(bin_array_index(-71), -2);
    }
}
