use anchor_lang::prelude::*;

/// Permanent custodian of the venture's Meteora DLMM liquidity. `[b"dlmm_custody", venture]`
///
/// This PDA is the `owner` of every DLMM position funded by the venture and the
/// authority of the custody token accounts. The program exposes **no** instruction
/// that removes liquidity or closes a position, so the LP is permanently locked;
/// only accrued trading fees can be harvested (`harvest_dlmm_fees`).
#[account]
#[derive(InitSpace)]
pub struct DlmmCustody {
    pub venture: Pubkey,
    pub lb_pair: Pubkey,
    pub token_x_mint: Pubkey,
    pub token_y_mint: Pubkey,
    /// `[b"custody_usdc", venture]`
    pub custody_usdc: Pubkey,
    /// `[b"custody_shares", venture]`
    pub custody_shares: Pubkey,
    pub positions_count: u8,
    pub total_usdc_deposited: u64,
    pub total_shares_deposited: u64,
    pub total_fees_harvested_usdc: u64,
    pub total_fees_harvested_shares: u64,
    pub is_permanently_locked: bool,
    pub bump: u8,
    pub custody_usdc_bump: u8,
    pub custody_shares_bump: u8,
}
