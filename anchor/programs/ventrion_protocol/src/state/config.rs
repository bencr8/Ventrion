use anchor_lang::prelude::*;

/// Protocol-wide configuration. `[b"global_config"]`
#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    /// Protocol admin (must be the program upgrade authority at initialization).
    pub admin: Pubkey,
    /// Owner of the USDC account that receives the protocol royalty on DLMM fees.
    pub fee_treasury: Pubkey,
    /// Authority allowed to release escrowed legal setup fees (e.g. MIDAO payment).
    pub legal_setup_authority: Pubkey,
    /// Quote mint used by every venture (canonical USDC on mainnet).
    pub usdc_mint: Pubkey,
    /// $VENT mother token mint (governance).
    pub vent_mint: Pubkey,
    /// Program-owned vault holding all staked $VENT. `[b"vent_stake_vault"]`
    pub vent_stake_vault: Pubkey,
    /// Meteora DLMM `PresetParameter2` used to create every venture pool.
    pub dlmm_preset_parameter: Pubkey,
    /// Sum of all staked $VENT (quorum denominator).
    pub total_vent_staked: u64,
    /// Approval requires `for_bps > min_approval_bps` (>= 5000 => strict majority).
    pub min_approval_bps: u16,
    /// Minimum participation (for + against) relative to `total_vent_staked`, in bps.
    pub verification_quorum_bps: u16,
    /// Royalty on harvested DLMM USDC fees routed to `fee_treasury` (e.g. 50 = 0.5%).
    pub protocol_fee_bps: u16,
    pub bump: u8,
    pub vent_stake_vault_bump: u8,
}

/// A staker's position in the $VENT governance pool. `[b"vent_stake", staker]`
///
/// Voting locks the position until the end of the ballot, so the same tokens can
/// never be moved to another wallet and counted twice.
#[account]
#[derive(InitSpace)]
pub struct VentStakePosition {
    pub staker: Pubkey,
    pub amount: u64,
    /// Unix timestamp until which `unstake_vent` is blocked (max over all ballots voted on).
    pub locked_until: i64,
    pub bump: u8,
}
