use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum VentureStatus {
    /// 1,000,000 shares minted into the `MasterLockVault`, mint authority revoked.
    GenesisInitialized,
    /// Flat curve open: contributions and 100% sellbacks.
    PrimaryRaiseActive,
    /// Hard cap reached: curve frozen, 14-day $VENT verification vote running.
    CapReached,
    /// $VENT stakers approved (>50%): DLMM graduation unlocked.
    VerifiedApproved,
    /// Rejected or timed out: 100% USDC refunds enabled.
    RefundActive,
    /// Graduated: 17% permanently locked DLMM liquidity, escrow funded, redemptions open.
    GraduatedDLMMLive,
    /// All milestone tranches of the active round released.
    OperationalMature,
}

/// Master company state machine. `[b"venture", venture_token_mint]`
#[account]
#[derive(InitSpace)]
pub struct VentureState {
    pub global_config: Pubkey,
    pub founder: Pubkey,
    /// Wallet that owns the OpCo treasury USDC account (upfront runway + milestone payouts).
    pub treasury_wallet: Pubkey,
    pub venture_token_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub master_lock_vault: Pubkey,
    pub legal_setup_vault: Pubkey,
    pub dividend_vault: Pubkey,
    pub dlmm_custody: Pubkey,
    pub meteora_dlmm_pool: Pubkey,
    /// Legal entity registry ID (MIDAO DAO LLC / Verein).
    pub midao_llc_id: [u8; 32],
    /// SHA-256 of the signed Operating Agreement.
    pub legal_contract_hash: [u8; 32],
    pub total_supply: u64,
    pub founder_vesting_tokens: u64,
    /// Shares that left the master vault into the market (redemptions + DLMM seed).
    pub circulating_public_float: u64,
    /// Shares owed to receipt holders of graduated rounds (reserved in the master vault).
    pub unredeemed_receipt_shares: u64,
    pub total_staked_in_vaults: u64,
    pub total_legal_fees_escrowed: u64,
    pub total_legal_fees_released: u64,
    /// O(1) dividend accumulator (scaled by ACC_PRECISION * 10_000).
    pub acc_dividend_per_weight_unit: u128,
    pub total_dividend_weight_units: u128,
    pub total_dividends_distributed: u64,
    pub current_round_index: u8,
    /// Sequential round mutex.
    pub is_round_active: bool,
    pub status: VentureStatus,
    pub bump: u8,
    pub master_lock_vault_bump: u8,
    pub legal_setup_vault_bump: u8,
    pub dividend_vault_bump: u8,
}

/// Founder vesting schedule. `[b"founder_vesting", venture, founder]`
#[account]
#[derive(InitSpace)]
pub struct FounderVesting {
    pub venture: Pubkey,
    pub founder: Pubkey,
    pub vesting_token_vault: Pubkey,
    pub total_allocated_tokens: u64,
    pub total_claimed_tokens: u64,
    pub start_timestamp: i64,
    pub cliff_duration_seconds: i64,
    pub total_duration_seconds: i64,
    pub bump: u8,
    pub vault_bump: u8,
}
