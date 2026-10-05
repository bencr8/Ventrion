use anchor_lang::prelude::*;

use crate::constants::MAX_MILESTONES;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default, InitSpace)]
pub enum MilestoneStatus {
    #[default]
    Pending,
    /// Submitted by the founder; 7-day veto window running.
    Proposed,
    /// Tranche paid out to the OpCo treasury.
    Released,
    /// Veto > 33.33%; founder may cure via `amend_milestone` (max 3 times).
    Vetoed,
    /// Vetoed after the last cure attempt; ragequit enabled.
    Breached,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, InitSpace)]
pub struct MilestoneItem {
    pub percentage_bps: u16,
    /// Nominal allocation fixed at graduation (scaled by remaining/base on release).
    pub amount_usdc: u64,
    pub target_completion_date: i64,
    pub proposed_at: i64,
    pub veto_deadline: i64,
    pub votes_for: u64,
    pub votes_against: u64,
    pub status: MilestoneStatus,
    pub amendment_count: u8,
}

/// Founder roadmap input, committed before the curve opens so $VENT stakers vote on it.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct MilestoneInput {
    pub percentage_bps: u16,
    pub target_completion_date: i64,
}

/// Tranche-specific milestone escrow. `[b"milestone_escrow", funding_round]`
#[account]
#[derive(InitSpace)]
pub struct MilestoneEscrow {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    /// `MilestoneEscrowUsdcVault`. `[b"milestone_usdc_vault", milestone_escrow]`
    pub escrow_usdc_vault: Pubkey,
    pub total_allocated_usdc: u64,
    pub total_released_usdc: u64,
    pub total_ragequit_usdc: u64,
    /// Round shares sold (quorum base for milestone votes).
    pub primary_tokens_quorum_base: u64,
    /// Decrements on ragequit.
    pub primary_tokens_remaining: u64,
    pub current_milestone_index: u8,
    pub milestones_count: u8,
    pub is_funded: bool,
    pub bump: u8,
    pub vault_bump: u8,
    pub milestones: [MilestoneItem; MAX_MILESTONES],
}
