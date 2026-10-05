//! Meteora DLMM (`lb_clmm` v0.12) PDA derivations.
//!
//! Pools are created with `initialize_lb_pair2`, whose LB pair address is derived
//! from the `PresetParameter2` account key (the only preset type deployed on
//! mainnet-beta and devnet). The legacy derivations are kept as documented helpers
//! so off-chain tooling can locate pools created by older program versions.

use anchor_lang::prelude::*;

use crate::constants::METEORA_DLMM_PROGRAM_ID;

/// Sorts two mints the way DLMM does (`min`, `max`).
pub fn sort_mints(token_a: &Pubkey, token_b: &Pubkey) -> (Pubkey, Pubkey) {
    if token_a < token_b {
        (*token_a, *token_b)
    } else {
        (*token_b, *token_a)
    }
}

/// LB pair created by `initialize_lb_pair2`: `[preset_parameter2, min_mint, max_mint]`.
/// This is the derivation the protocol uses on-chain.
pub fn derive_meteora_lb_pair_v2(
    preset_parameter: &Pubkey,
    token_a: &Pubkey,
    token_b: &Pubkey,
) -> (Pubkey, u8) {
    let (token_x, token_y) = sort_mints(token_a, token_b);
    Pubkey::find_program_address(
        &[preset_parameter.as_ref(), token_x.as_ref(), token_y.as_ref()],
        &METEORA_DLMM_PROGRAM_ID,
    )
}

/// Legacy LB pair derivation `[min_mint, max_mint, bin_step_le]` (pre-base-factor
/// `initialize_lb_pair`). No longer creatable, kept for indexing historic pools.
pub fn derive_meteora_lb_pair(token_a: &Pubkey, token_b: &Pubkey, bin_step: u16) -> (Pubkey, u8) {
    let (token_x, token_y) = sort_mints(token_a, token_b);
    Pubkey::find_program_address(
        &[token_x.as_ref(), token_y.as_ref(), &bin_step.to_le_bytes()],
        &METEORA_DLMM_PROGRAM_ID,
    )
}

/// Legacy LB pair derivation with base factor `[min, max, bin_step_le, base_factor_le]`
/// (v1 `PresetParameter`, of which none remain deployed).
pub fn derive_meteora_lb_pair_with_base_factor(
    token_a: &Pubkey,
    token_b: &Pubkey,
    bin_step: u16,
    base_factor: u16,
) -> (Pubkey, u8) {
    let (token_x, token_y) = sort_mints(token_a, token_b);
    Pubkey::find_program_address(
        &[
            token_x.as_ref(),
            token_y.as_ref(),
            &bin_step.to_le_bytes(),
            &base_factor.to_le_bytes(),
        ],
        &METEORA_DLMM_PROGRAM_ID,
    )
}

/// Pool reserve token account: `[lb_pair, mint]`.
pub fn derive_reserve(lb_pair: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[lb_pair.as_ref(), mint.as_ref()], &METEORA_DLMM_PROGRAM_ID)
}

/// `["oracle", lb_pair]`.
pub fn derive_oracle(lb_pair: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"oracle", lb_pair.as_ref()], &METEORA_DLMM_PROGRAM_ID)
}

/// `["bitmap", lb_pair]` (only required for bin array indices outside [-512, 511]).
pub fn derive_bitmap_extension(lb_pair: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"bitmap", lb_pair.as_ref()], &METEORA_DLMM_PROGRAM_ID)
}

/// `["bin_array", lb_pair, index_i64_le]`.
pub fn derive_bin_array(lb_pair: &Pubkey, index: i64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"bin_array", lb_pair.as_ref(), &index.to_le_bytes()],
        &METEORA_DLMM_PROGRAM_ID,
    )
}

/// Anchor event CPI authority of the DLMM program: `["__event_authority"]`.
pub fn derive_event_authority() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"__event_authority"], &METEORA_DLMM_PROGRAM_ID)
}

/// `PresetParameter2` by index: `["preset_parameter2", index_u16_le]`.
pub fn derive_preset_parameter2(index: u16) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"preset_parameter2", &index.to_le_bytes()],
        &METEORA_DLMM_PROGRAM_ID,
    )
}

/// Legacy `PresetParameter` (v1): `["preset_parameter", bin_step_le, base_factor_le]`.
pub fn derive_preset_parameter(bin_step: u16, base_factor: u16) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"preset_parameter",
            &bin_step.to_le_bytes(),
            &base_factor.to_le_bytes(),
        ],
        &METEORA_DLMM_PROGRAM_ID,
    )
}
