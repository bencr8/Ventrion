//! # Ventrion Protocol Events
//!
//! Strongly-typed event telemetry emitted across every state transition and financial
//! lifecycle operation in the Ventrion Protocol. Indexed by indexers, Geyser plugins,
//! and front-end real-time notification hooks.

use anchor_lang::prelude::*;

/// Emitted when the global protocol state and canonical mint references are initialized.
#[event]
pub struct GlobalConfigInitialized {
    pub admin: Pubkey,
    pub usdc_mint: Pubkey,
    pub vent_mint: Pubkey,
    pub dlmm_preset_parameter: Pubkey,
}

/// Emitted when global protocol parameters or fee schedules are updated by the admin.
#[event]
pub struct GlobalConfigUpdated {
    pub admin: Pubkey,
    pub dlmm_preset_parameter: Pubkey,
    pub min_approval_bps: u16,
    pub verification_quorum_bps: u16,
    pub protocol_fee_bps: u16,
}

/// Emitted when mother tokens ($VENT) are deposited into the governance staking vault.
#[event]
pub struct VentStaked {
    pub staker: Pubkey,
    pub amount: u64,
    pub position_amount: u64,
    pub total_vent_staked: u64,
}

/// Emitted when mother tokens ($VENT) are withdrawn from the governance staking vault.
#[event]
pub struct VentUnstaked {
    pub staker: Pubkey,
    pub amount: u64,
    pub position_amount: u64,
    pub total_vent_staked: u64,
}

/// Emitted when a $VENT mother token staker claims accumulated protocol dividends.
#[event]
pub struct VentDividendsClaimed {
    pub staker: Pubkey,
    pub amount_usdc: u64,
    pub total_claimed_usdc: u64,
    pub timestamp: i64,
}

/// Emitted when protocol royalty fees are harvested into the Master Fee Vault for $VENT stakers.
#[event]
pub struct VentDividendsHarvested {
    pub amount_usdc: u64,
    pub new_acc_dividend_per_share: u128,
    pub total_distributed_usdc: u64,
    pub timestamp: i64,
}

/// Emitted when a new company is initialized at genesis with exactly 1,000,000 shares.
#[event]
pub struct VentureGenesisLaunched {
    pub venture: Pubkey,
    pub founder: Pubkey,
    pub venture_token_mint: Pubkey,
    pub midao_llc_id: [u8; 32],
    pub legal_contract_hash: [u8; 32],
    pub total_supply: u64,
    pub founder_shares: u64,
    pub timestamp: i64,
}

/// Emitted when a new flat-curve primary funding round is configured and opened.
#[event]
pub struct FundingRoundCreated {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub round_index: u8,
    pub price_per_share_usdc: u64,
    pub target_cap_usdc: u64,
    pub shares_for_sale: u64,
    pub upfront_working_capital_bps: u16,
    pub timestamp: i64,
}

/// Emitted when a founder commits the milestone roadmap schedule for a round.
#[event]
pub struct MilestonesConfigured {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub milestones_count: u8,
    pub timestamp: i64,
}

/// Emitted when an investor deposits USDC into a flat curve primary round.
#[event]
pub struct PrimaryContribution {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    pub usdc_amount: u64,
    pub receipts_minted: u64,
    pub total_raised_usdc: u64,
    pub timestamp: i64,
}

/// Emitted when an investor sells primary receipts back to the escrow vault prior to cap closure.
#[event]
pub struct PrimarySellback {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    pub receipts_burned: u64,
    pub usdc_returned: u64,
    pub total_raised_usdc: u64,
    pub timestamp: i64,
}

/// Emitted when a primary round reaches exactly 100% of its target funding cap.
#[event]
pub struct RoundCapReached {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub total_raised_usdc: u64,
    pub voting_start_timestamp: i64,
    pub voting_end_timestamp: i64,
}

/// Emitted when a $VENT staker casts a verification ballot on a venture.
#[event]
pub struct VerificationVoteCast {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub staker: Pubkey,
    pub vote_yes: bool,
    pub vote_weight: u64,
    pub for_weight: u64,
    pub against_weight: u64,
    pub timestamp: i64,
}

/// Emitted when the 14-day $VENT verification vote is closed and finalized.
#[event]
pub struct VerificationFinalized {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub is_approved: bool,
    pub for_weight: u64,
    pub against_weight: u64,
    pub total_vent_staked: u64,
    pub timestamp: i64,
}

/// Emitted when a primary backer claims a full USDC refund following a failed verification.
#[event]
pub struct PrimaryRefund {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    pub receipts_burned: u64,
    pub usdc_refunded: u64,
    pub timestamp: i64,
}

/// Emitted when the Meteora DLMM pool is prepared and verified prior to atomic graduation.
#[event]
pub struct DlmmPoolPrepared {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub lb_pair: Pubkey,
    pub position: Pubkey,
    pub active_id: i32,
    pub lower_bin_id: i32,
    pub pool_created: bool,
}

/// Emitted when atomic graduation is executed, seeding permanent DLMM liquidity and funding escrows.
#[event]
pub struct AtomicGraduationExecuted {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub lb_pair: Pubkey,
    pub total_raised_usdc: u64,
    pub legal_fee_usdc: u64,
    pub upfront_usdc: u64,
    pub dlmm_usdc_deposited: u64,
    pub dlmm_shares_deposited: u64,
    pub escrow_usdc: u64,
    pub timestamp: i64,
}

/// Emitted when primary receipts are redeemed 1:1 for tradeable common shares.
#[event]
pub struct SharesRedeemed {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub staked: bool,
}

/// Emitted when a founder claims vested common shares post-cliff.
#[event]
pub struct FounderVestingClaimed {
    pub venture: Pubkey,
    pub founder: Pubkey,
    pub amount: u64,
    pub total_claimed: u64,
}

/// Emitted when a founder proposes completion of a roadmap milestone tranche.
#[event]
pub struct MilestoneProposed {
    pub funding_round: Pubkey,
    pub milestone_id: u8,
    pub veto_deadline: i64,
    pub amendment_count: u8,
}

/// Emitted when a primary backer votes on a proposed milestone tranche.
#[event]
pub struct MilestoneVoteCast {
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    pub milestone_id: u8,
    pub approve: bool,
    pub weight: u64,
}

/// Emitted when a milestone tranche is released or resolved following review.
#[event]
pub struct MilestoneResolved {
    pub funding_round: Pubkey,
    pub milestone_id: u8,
    pub released: bool,
    pub status: u8,
    pub amount_usdc: u64,
}

/// Emitted when an investor executes a ragequit refund against a breached milestone.
#[event]
pub struct MilestoneRagequit {
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    pub shares_surrendered: u64,
    pub usdc_refunded: u64,
}

/// Emitted when common shares are deposited into the company staking vault with a time lock.
#[event]
pub struct InvestorStaked {
    pub venture: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub staked_amount: u64,
    pub multiplier_bps: u16,
    pub lock_end_timestamp: i64,
}

/// Emitted when time-locked common shares are unstaked from the company staking vault.
#[event]
pub struct InvestorUnstaked {
    pub venture: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
}

/// Emitted when an investor claims accumulated O(1) dividend rewards in USDC.
#[event]
pub struct DividendsClaimed {
    pub venture: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
}

/// Emitted when new revenue is distributed into the company dividend accumulator.
#[event]
pub struct DividendsDistributed {
    pub venture: Pubkey,
    pub amount_usdc: u64,
    pub source: u8,
    pub reference: [u8; 32],
    pub acc_dividend_per_weight_unit: u128,
}

/// Emitted when trading fees are harvested from the permanent Meteora DLMM position.
#[event]
pub struct DlmmFeesHarvested {
    pub venture: Pubkey,
    pub usdc_fees: u64,
    pub share_fees: u64,
    pub protocol_royalty_usdc: u64,
}

/// Emitted when legal corporate setup fees are released to the designated provider.
#[event]
pub struct LegalSetupFeeReleased {
    pub venture: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
}
