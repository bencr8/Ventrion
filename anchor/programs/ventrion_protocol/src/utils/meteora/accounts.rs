//! Read-only views over Meteora DLMM accounts.
//!
//! Only the fields the protocol relies on are decoded, at fixed offsets of the
//! zero-copy (`#[repr(C)]`) layouts of `lb_clmm` v0.12. Every reader first checks
//! the owning program and the 8-byte Anchor account discriminator.

use anchor_lang::prelude::*;

use crate::constants::METEORA_DLMM_PROGRAM_ID;
use crate::errors::VentrionError;

pub const LB_PAIR_DISCRIMINATOR: [u8; 8] = [33, 11, 49, 98, 181, 101, 177, 13];
pub const PRESET_PARAMETER2_DISCRIMINATOR: [u8; 8] = [171, 236, 148, 115, 162, 113, 222, 174];
pub const BIN_ARRAY_DISCRIMINATOR: [u8; 8] = [92, 142, 92, 220, 5, 148, 70, 181];
pub const POSITION_V2_DISCRIMINATOR: [u8; 8] = [117, 176, 212, 199, 245, 180, 133, 182];

// `LbPair` offsets (including the 8-byte discriminator):
// 8..40 StaticParameters, 40..72 VariableParameters, 72 bump_seed, 73..75 bin_step_seed,
// 75 pair_type, 76..80 active_id, 80..82 bin_step, 82 status, ..., 88.. mints/reserves.
const LB_PAIR_ACTIVE_ID: usize = 76;
const LB_PAIR_BIN_STEP: usize = 80;
const LB_PAIR_TOKEN_X_MINT: usize = 88;
const LB_PAIR_TOKEN_Y_MINT: usize = 120;
const LB_PAIR_RESERVE_X: usize = 152;
const LB_PAIR_RESERVE_Y: usize = 184;
const LB_PAIR_MIN_LEN: usize = 216;

// `PresetParameter2`: 8 disc, 8..10 bin_step, 10..12 base_factor.
const PRESET2_BIN_STEP: usize = 8;
const PRESET2_BASE_FACTOR: usize = 10;
const PRESET2_MIN_LEN: usize = 12;

/// Decoded subset of a DLMM `LbPair`.
#[derive(Clone, Copy, Debug)]
pub struct LbPairView {
    pub active_id: i32,
    pub bin_step: u16,
    pub token_x_mint: Pubkey,
    pub token_y_mint: Pubkey,
    pub reserve_x: Pubkey,
    pub reserve_y: Pubkey,
}

/// Decoded subset of a DLMM `PresetParameter2`.
#[derive(Clone, Copy, Debug)]
pub struct PresetParameter2View {
    pub bin_step: u16,
    pub base_factor: u16,
}

fn checked_data<'a>(
    info: &'a AccountInfo,
    discriminator: &[u8; 8],
    min_len: usize,
) -> Result<std::cell::Ref<'a, &'a mut [u8]>> {
    require_keys_eq!(*info.owner, METEORA_DLMM_PROGRAM_ID, VentrionError::InvalidMeteoraAccount);
    let data = info.try_borrow_data()?;
    require!(
        data.len() >= min_len && data[..8] == discriminator[..],
        VentrionError::InvalidMeteoraAccount
    );
    Ok(data)
}

fn read_pubkey(data: &[u8], offset: usize) -> Pubkey {
    let mut bytes = [0u8; 32];
    bytes.copy_from_slice(&data[offset..offset + 32]);
    Pubkey::new_from_array(bytes)
}

fn read_u16(data: &[u8], offset: usize) -> u16 {
    u16::from_le_bytes([data[offset], data[offset + 1]])
}

fn read_i32(data: &[u8], offset: usize) -> i32 {
    i32::from_le_bytes([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]])
}

pub fn read_lb_pair(info: &AccountInfo) -> Result<LbPairView> {
    let data = checked_data(info, &LB_PAIR_DISCRIMINATOR, LB_PAIR_MIN_LEN)?;
    Ok(LbPairView {
        active_id: read_i32(&data, LB_PAIR_ACTIVE_ID),
        bin_step: read_u16(&data, LB_PAIR_BIN_STEP),
        token_x_mint: read_pubkey(&data, LB_PAIR_TOKEN_X_MINT),
        token_y_mint: read_pubkey(&data, LB_PAIR_TOKEN_Y_MINT),
        reserve_x: read_pubkey(&data, LB_PAIR_RESERVE_X),
        reserve_y: read_pubkey(&data, LB_PAIR_RESERVE_Y),
    })
}

pub fn read_preset_parameter2(info: &AccountInfo) -> Result<PresetParameter2View> {
    let data = checked_data(info, &PRESET_PARAMETER2_DISCRIMINATOR, PRESET2_MIN_LEN)?;
    Ok(PresetParameter2View {
        bin_step: read_u16(&data, PRESET2_BIN_STEP),
        base_factor: read_u16(&data, PRESET2_BASE_FACTOR),
    })
}

/// `true` if the account has never been created (no lamports, no data).
pub fn is_uninitialized(info: &AccountInfo) -> bool {
    info.data_is_empty() && info.lamports() == 0
}

/// Validates an existing DLMM account of the given type (owner + discriminator).
pub fn assert_dlmm_account(info: &AccountInfo, discriminator: &[u8; 8]) -> Result<()> {
    checked_data(info, discriminator, 8).map(|_| ())
}
