//! Raw CPI builders for the Meteora DLMM instructions used by the protocol.
//!
//! Instruction data is encoded exactly as the `lb_clmm` v0.12 IDL specifies
//! (8-byte Anchor discriminator followed by Borsh-encoded arguments). Optional
//! accounts that are absent are passed as the DLMM program id (Anchor's `None`).

use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;

use crate::constants::{MEMO_PROGRAM_ID, METEORA_DLMM_PROGRAM_ID};
use crate::errors::VentrionError;

pub const IX_INITIALIZE_LB_PAIR2: [u8; 8] = [73, 59, 36, 120, 237, 83, 108, 198];
pub const IX_INITIALIZE_BIN_ARRAY: [u8; 8] = [35, 86, 19, 185, 78, 212, 75, 211];
pub const IX_INITIALIZE_POSITION2: [u8; 8] = [143, 19, 242, 145, 213, 15, 104, 115];
pub const IX_ADD_LIQUIDITY_BY_WEIGHT2: [u8; 8] = [209, 59, 63, 91, 111, 200, 153, 228];
pub const IX_CLAIM_FEE2: [u8; 8] = [112, 191, 101, 171, 28, 144, 127, 187];

/// One `(bin_id, weight)` entry of `LiquidityParameterByWeight::bin_liquidity_dist`.
#[derive(Clone, Copy, Debug)]
pub struct BinWeight {
    pub bin_id: i32,
    pub weight: u16,
}

fn meta(info: &AccountInfo, is_writable: bool) -> AccountMeta {
    if is_writable {
        AccountMeta::new(*info.key, info.is_signer)
    } else {
        AccountMeta::new_readonly(*info.key, info.is_signer)
    }
}

fn signer_meta(info: &AccountInfo, is_writable: bool) -> AccountMeta {
    if is_writable {
        AccountMeta::new(*info.key, true)
    } else {
        AccountMeta::new_readonly(*info.key, true)
    }
}

/// `None` for an optional DLMM account.
fn none_meta() -> AccountMeta {
    AccountMeta::new_readonly(METEORA_DLMM_PROGRAM_ID, false)
}

/// Empty `RemainingAccountsInfo { slices: vec![] }` (SPL Token mints have no transfer hooks).
const EMPTY_REMAINING_ACCOUNTS_INFO: [u8; 4] = 0u32.to_le_bytes();

fn invoke_dlmm(
    accounts: Vec<AccountMeta>,
    data: Vec<u8>,
    infos: &[AccountInfo],
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let ix = Instruction {
        program_id: METEORA_DLMM_PROGRAM_ID,
        accounts,
        data,
    };
    invoke_signed(&ix, infos, signer_seeds).map_err(Into::into)
}

fn assert_dlmm_program(program: &AccountInfo) -> Result<()> {
    require_keys_eq!(*program.key, METEORA_DLMM_PROGRAM_ID, VentrionError::InvalidMeteoraProgram);
    require!(program.executable, VentrionError::InvalidMeteoraProgram);
    Ok(())
}

// -----------------------------------------------------------------------------
// initialize_lb_pair2
// -----------------------------------------------------------------------------

pub struct InitializeLbPair2<'a, 'info> {
    pub lb_pair: &'a AccountInfo<'info>,
    pub token_mint_x: &'a AccountInfo<'info>,
    pub token_mint_y: &'a AccountInfo<'info>,
    pub reserve_x: &'a AccountInfo<'info>,
    pub reserve_y: &'a AccountInfo<'info>,
    pub oracle: &'a AccountInfo<'info>,
    pub preset_parameter: &'a AccountInfo<'info>,
    pub funder: &'a AccountInfo<'info>,
    pub token_program: &'a AccountInfo<'info>,
    pub system_program: &'a AccountInfo<'info>,
    pub event_authority: &'a AccountInfo<'info>,
    pub dlmm_program: &'a AccountInfo<'info>,
}

pub fn initialize_lb_pair2(accts: InitializeLbPair2, active_id: i32) -> Result<()> {
    assert_dlmm_program(accts.dlmm_program)?;
    let accounts = vec![
        meta(accts.lb_pair, true),
        none_meta(), // bin_array_bitmap_extension
        meta(accts.token_mint_x, false),
        meta(accts.token_mint_y, false),
        meta(accts.reserve_x, true),
        meta(accts.reserve_y, true),
        meta(accts.oracle, true),
        meta(accts.preset_parameter, false),
        signer_meta(accts.funder, true),
        none_meta(), // token_badge_x
        none_meta(), // token_badge_y
        meta(accts.token_program, false),
        meta(accts.token_program, false),
        meta(accts.system_program, false),
        meta(accts.event_authority, false),
        meta(accts.dlmm_program, false),
    ];
    let mut data = Vec::with_capacity(8 + 4 + 96);
    data.extend_from_slice(&IX_INITIALIZE_LB_PAIR2);
    data.extend_from_slice(&active_id.to_le_bytes());
    data.extend_from_slice(&[0u8; 96]); // InitializeLbPair2Params::padding
    invoke_dlmm(
        accounts,
        data,
        &[
            accts.lb_pair.clone(),
            accts.token_mint_x.clone(),
            accts.token_mint_y.clone(),
            accts.reserve_x.clone(),
            accts.reserve_y.clone(),
            accts.oracle.clone(),
            accts.preset_parameter.clone(),
            accts.funder.clone(),
            accts.token_program.clone(),
            accts.system_program.clone(),
            accts.event_authority.clone(),
            accts.dlmm_program.clone(),
        ],
        &[],
    )
    .map_err(|_| error!(VentrionError::DlmmPoolInitFailed))
}

// -----------------------------------------------------------------------------
// initialize_bin_array
// -----------------------------------------------------------------------------

pub fn initialize_bin_array<'info>(
    lb_pair: &AccountInfo<'info>,
    bin_array: &AccountInfo<'info>,
    funder: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    dlmm_program: &AccountInfo<'info>,
    index: i64,
) -> Result<()> {
    assert_dlmm_program(dlmm_program)?;
    let accounts = vec![
        meta(lb_pair, false),
        meta(bin_array, true),
        signer_meta(funder, true),
        meta(system_program, false),
    ];
    let mut data = Vec::with_capacity(16);
    data.extend_from_slice(&IX_INITIALIZE_BIN_ARRAY);
    data.extend_from_slice(&index.to_le_bytes());
    invoke_dlmm(
        accounts,
        data,
        &[
            lb_pair.clone(),
            bin_array.clone(),
            funder.clone(),
            system_program.clone(),
            dlmm_program.clone(),
        ],
        &[],
    )
    .map_err(|_| error!(VentrionError::DlmmPoolInitFailed))
}

// -----------------------------------------------------------------------------
// initialize_position2
// -----------------------------------------------------------------------------

pub struct InitializePosition2<'a, 'info> {
    pub payer: &'a AccountInfo<'info>,
    /// Program PDA `[b"dlmm_position", funding_round]`, signs via `signer_seeds`.
    pub position: &'a AccountInfo<'info>,
    pub lb_pair: &'a AccountInfo<'info>,
    /// `DlmmCustody` PDA, signs via `signer_seeds`.
    pub owner: &'a AccountInfo<'info>,
    pub system_program: &'a AccountInfo<'info>,
    pub event_authority: &'a AccountInfo<'info>,
    pub dlmm_program: &'a AccountInfo<'info>,
}

pub fn initialize_position2(
    accts: InitializePosition2,
    lower_bin_id: i32,
    width: i32,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    assert_dlmm_program(accts.dlmm_program)?;
    let accounts = vec![
        signer_meta(accts.payer, true),
        signer_meta(accts.position, true),
        meta(accts.lb_pair, false),
        signer_meta(accts.owner, false),
        meta(accts.system_program, false),
        meta(accts.event_authority, false),
        meta(accts.dlmm_program, false),
    ];
    let mut data = Vec::with_capacity(16);
    data.extend_from_slice(&IX_INITIALIZE_POSITION2);
    data.extend_from_slice(&lower_bin_id.to_le_bytes());
    data.extend_from_slice(&width.to_le_bytes());
    invoke_dlmm(
        accounts,
        data,
        &[
            accts.payer.clone(),
            accts.position.clone(),
            accts.lb_pair.clone(),
            accts.owner.clone(),
            accts.system_program.clone(),
            accts.event_authority.clone(),
            accts.dlmm_program.clone(),
        ],
        signer_seeds,
    )
    .map_err(|_| error!(VentrionError::DlmmPoolInitFailed))
}

// -----------------------------------------------------------------------------
// add_liquidity_by_weight2
// -----------------------------------------------------------------------------

pub struct AddLiquidityByWeight2<'a, 'info> {
    pub position: &'a AccountInfo<'info>,
    pub lb_pair: &'a AccountInfo<'info>,
    pub user_token_x: &'a AccountInfo<'info>,
    pub user_token_y: &'a AccountInfo<'info>,
    pub reserve_x: &'a AccountInfo<'info>,
    pub reserve_y: &'a AccountInfo<'info>,
    pub token_x_mint: &'a AccountInfo<'info>,
    pub token_y_mint: &'a AccountInfo<'info>,
    /// Position owner and authority of the user token accounts (`DlmmCustody`).
    pub sender: &'a AccountInfo<'info>,
    pub token_program: &'a AccountInfo<'info>,
    pub event_authority: &'a AccountInfo<'info>,
    pub dlmm_program: &'a AccountInfo<'info>,
    /// Bin arrays covering the position, ascending by index (writable).
    pub bin_arrays: &'a [AccountInfo<'info>],
}

pub struct LiquidityByWeight<'a> {
    pub amount_x: u64,
    pub amount_y: u64,
    pub active_id: i32,
    pub max_active_bin_slippage: i32,
    pub bin_liquidity_dist: &'a [BinWeight],
}

pub fn add_liquidity_by_weight2(
    accts: AddLiquidityByWeight2,
    params: LiquidityByWeight,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    assert_dlmm_program(accts.dlmm_program)?;
    let mut accounts = vec![
        meta(accts.position, true),
        meta(accts.lb_pair, true),
        none_meta(), // bin_array_bitmap_extension
        meta(accts.user_token_x, true),
        meta(accts.user_token_y, true),
        meta(accts.reserve_x, true),
        meta(accts.reserve_y, true),
        meta(accts.token_x_mint, false),
        meta(accts.token_y_mint, false),
        signer_meta(accts.sender, false),
        meta(accts.token_program, false),
        meta(accts.token_program, false),
        meta(accts.event_authority, false),
        meta(accts.dlmm_program, false),
    ];
    accounts.extend(accts.bin_arrays.iter().map(|info| AccountMeta::new(*info.key, false)));

    let dist_len = u32::try_from(params.bin_liquidity_dist.len())
        .map_err(|_| error!(VentrionError::MathOverflow))?;
    let mut data = Vec::with_capacity(8 + 8 + 8 + 4 + 4 + 4 + 6 * dist_len as usize + 4);
    data.extend_from_slice(&IX_ADD_LIQUIDITY_BY_WEIGHT2);
    data.extend_from_slice(&params.amount_x.to_le_bytes());
    data.extend_from_slice(&params.amount_y.to_le_bytes());
    data.extend_from_slice(&params.active_id.to_le_bytes());
    data.extend_from_slice(&params.max_active_bin_slippage.to_le_bytes());
    data.extend_from_slice(&dist_len.to_le_bytes());
    for bin in params.bin_liquidity_dist {
        data.extend_from_slice(&bin.bin_id.to_le_bytes());
        data.extend_from_slice(&bin.weight.to_le_bytes());
    }
    data.extend_from_slice(&EMPTY_REMAINING_ACCOUNTS_INFO);

    let mut infos = vec![
        accts.position.clone(),
        accts.lb_pair.clone(),
        accts.user_token_x.clone(),
        accts.user_token_y.clone(),
        accts.reserve_x.clone(),
        accts.reserve_y.clone(),
        accts.token_x_mint.clone(),
        accts.token_y_mint.clone(),
        accts.sender.clone(),
        accts.token_program.clone(),
        accts.event_authority.clone(),
        accts.dlmm_program.clone(),
    ];
    infos.extend(accts.bin_arrays.iter().cloned());
    invoke_dlmm(accounts, data, &infos, signer_seeds)
        .map_err(|_| error!(VentrionError::DlmmLiquiditySeedFailed))
}

// -----------------------------------------------------------------------------
// claim_fee2
// -----------------------------------------------------------------------------

pub struct ClaimFee2<'a, 'info> {
    pub lb_pair: &'a AccountInfo<'info>,
    pub position: &'a AccountInfo<'info>,
    pub sender: &'a AccountInfo<'info>,
    pub reserve_x: &'a AccountInfo<'info>,
    pub reserve_y: &'a AccountInfo<'info>,
    pub user_token_x: &'a AccountInfo<'info>,
    pub user_token_y: &'a AccountInfo<'info>,
    pub token_x_mint: &'a AccountInfo<'info>,
    pub token_y_mint: &'a AccountInfo<'info>,
    pub token_program: &'a AccountInfo<'info>,
    pub memo_program: &'a AccountInfo<'info>,
    pub event_authority: &'a AccountInfo<'info>,
    pub dlmm_program: &'a AccountInfo<'info>,
    pub bin_arrays: &'a [AccountInfo<'info>],
}

pub fn claim_fee2(
    accts: ClaimFee2,
    min_bin_id: i32,
    max_bin_id: i32,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    assert_dlmm_program(accts.dlmm_program)?;
    require_keys_eq!(*accts.memo_program.key, MEMO_PROGRAM_ID, VentrionError::InvalidParameter);
    let mut accounts = vec![
        meta(accts.lb_pair, true),
        meta(accts.position, true),
        signer_meta(accts.sender, false),
        meta(accts.reserve_x, true),
        meta(accts.reserve_y, true),
        meta(accts.user_token_x, true),
        meta(accts.user_token_y, true),
        meta(accts.token_x_mint, false),
        meta(accts.token_y_mint, false),
        meta(accts.token_program, false),
        meta(accts.token_program, false),
        meta(accts.memo_program, false),
        meta(accts.event_authority, false),
        meta(accts.dlmm_program, false),
    ];
    accounts.extend(accts.bin_arrays.iter().map(|info| AccountMeta::new(*info.key, false)));

    let mut data = Vec::with_capacity(8 + 4 + 4 + 4);
    data.extend_from_slice(&IX_CLAIM_FEE2);
    data.extend_from_slice(&min_bin_id.to_le_bytes());
    data.extend_from_slice(&max_bin_id.to_le_bytes());
    data.extend_from_slice(&EMPTY_REMAINING_ACCOUNTS_INFO);

    let mut infos = vec![
        accts.lb_pair.clone(),
        accts.position.clone(),
        accts.sender.clone(),
        accts.reserve_x.clone(),
        accts.reserve_y.clone(),
        accts.user_token_x.clone(),
        accts.user_token_y.clone(),
        accts.token_x_mint.clone(),
        accts.token_y_mint.clone(),
        accts.token_program.clone(),
        accts.memo_program.clone(),
        accts.event_authority.clone(),
        accts.dlmm_program.clone(),
    ];
    infos.extend(accts.bin_arrays.iter().cloned());
    invoke_dlmm(accounts, data, &infos, signer_seeds)
        .map_err(|_| error!(VentrionError::DlmmFeeClaimFailed))
}
