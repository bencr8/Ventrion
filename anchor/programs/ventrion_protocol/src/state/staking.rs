use anchor_lang::prelude::*;

/// Personal staking vault and dividend ledger. `[b"investor_vault", venture, investor]`
#[account]
#[derive(InitSpace)]
pub struct InvestorVault {
    pub venture: Pubkey,
    pub investor: Pubkey,
    pub staked_amount: u64,
    pub lock_start_timestamp: i64,
    pub lock_end_timestamp: i64,
    pub lock_duration_seconds: i64,
    /// 10_000..=30_000 (1.0x to 3.0x).
    pub multiplier_bps: u16,
    /// `staked_amount * multiplier_bps`.
    pub effective_weight: u128,
    /// O(1) accumulator checkpoint.
    pub last_acc_yield: u128,
    /// Settled but unclaimed USDC.
    pub pending_usdc: u64,
    pub total_claimed_usdc: u64,
    pub is_active: bool,
    pub bump: u8,
}
