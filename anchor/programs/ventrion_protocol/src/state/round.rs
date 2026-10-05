use anchor_lang::prelude::*;

use crate::constants::MAX_MILESTONES;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum RoundStatus {
    /// Created; the founder must commit the milestone roadmap before the curve opens.
    Initialized,
    /// Flat curve open for contributions and sellbacks.
    Active,
    /// `total_raised_usdc == target_cap_usdc`: curve frozen, 14-day vote running.
    CapReached,
    /// $VENT stakers approved: graduation unlocked.
    VerifiedApproved,
    /// Rejected or timed out: full USDC refunds.
    RefundActive,
    /// Capital distributed, DLMM seeded and locked, receipts redeemable.
    Graduated,
    /// All milestone tranches released.
    Completed,
}

/// Terms, treasury custody and lifecycle of funding round N.
/// `[b"funding_round", venture, &[round_index]]`
#[account]
#[derive(InitSpace)]
pub struct FundingRound {
    pub venture: Pubkey,
    /// $VENT-RN receipt mint (mint & freeze authority = this PDA; receipts are non-transferable).
    pub receipt_mint: Pubkey,
    /// `funding_round_usdc_vault`: escrow holding all primary USDC until graduation/refund.
    pub usdc_vault: Pubkey,
    pub verification_vote: Pubkey,
    pub milestone_escrow: Pubkey,
    /// Meteora DLMM position funded by this round (owned by `DlmmCustody`).
    pub dlmm_position: Pubkey,
    /// Flat price: USDC atoms per whole share (e.g. 100_000 = 0.10 USDC).
    pub price_per_share_usdc: u64,
    pub target_cap_usdc: u64,
    pub total_raised_usdc: u64,
    /// `target_cap_usdc * ONE_SHARE / price_per_share_usdc` (exact).
    pub shares_for_sale: u64,
    /// Outstanding receipts (net of sellbacks and refunds).
    pub receipts_outstanding: u64,
    pub receipts_redeemed: u64,
    pub total_refunded_usdc: u64,
    pub legal_fee_usdc: u64,
    pub upfront_usdc: u64,
    pub escrow_usdc: u64,
    pub dlmm_seed_usdc: u64,
    pub dlmm_seed_shares: u64,
    pub cap_reached_ts: i64,
    pub graduated_ts: i64,
    /// Expected DLMM active bin (flat price) recorded by `prepare_dlmm_pool`.
    pub dlmm_active_id: i32,
    pub dlmm_lower_bin_id: i32,
    pub upfront_working_capital_bps: u16,
    pub round_index: u8,
    pub round_status: RoundStatus,
    pub dlmm_prepared: bool,
    pub bump: u8,
    pub receipt_mint_bump: u8,
    pub usdc_vault_bump: u8,
}

/// Primary backer ledger for one round. `[b"round_record", funding_round, investor]`
#[account]
#[derive(InitSpace)]
pub struct RoundInvestorRecord {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub investor: Pubkey,
    /// Net USDC contributed (sellbacks decrement).
    pub usdc_contributed: u64,
    /// Net receipts purchased (sellbacks decrement).
    pub tokens_purchased: u64,
    pub usdc_refunded: u64,
    pub tokens_redeemed: u64,
    /// Shares surrendered through milestone ragequit.
    pub tokens_surrendered: u64,
    pub usdc_ragequit: u64,
    /// Bit i = voted YES on milestone i in its current review cycle.
    pub vote_mask: u16,
    /// Bit i = voted VETO on milestone i in its current review cycle.
    pub veto_mask: u16,
    /// Review cycle (amendment count) the masks refer to, per milestone.
    pub amendment_seen: [u8; MAX_MILESTONES],
    pub bump: u8,
}

impl RoundInvestorRecord {
    /// Primary voting / ragequit weight (receipts or redeemed shares not yet surrendered).
    pub fn primary_weight(&self) -> u64 {
        self.tokens_purchased.saturating_sub(self.tokens_surrendered)
    }

    /// Resets this backer's vote bits for `id` when the milestone entered a new cure cycle.
    pub fn sync_review_cycle(&mut self, id: usize, amendment_count: u8) {
        if self.amendment_seen[id] != amendment_count {
            let bit = !(1u16 << id);
            self.vote_mask &= bit;
            self.veto_mask &= bit;
            self.amendment_seen[id] = amendment_count;
        }
    }

    pub fn has_voted(&self, id: usize) -> bool {
        let bit = 1u16 << id;
        (self.vote_mask & bit) != 0 || (self.veto_mask & bit) != 0
    }
}

/// On-chain $VENT staker approval ballot for one round.
/// `[b"verification_vote", funding_round]`
#[account]
#[derive(InitSpace)]
pub struct VentureVerificationVote {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub for_weight: u64,
    pub against_weight: u64,
    pub voter_count: u32,
    /// `GlobalConfig::total_vent_staked` captured at `CapReached` (quorum denominator).
    pub total_vent_staked_snapshot: u64,
    /// Set exactly when the round reaches `CapReached` (0 before).
    pub voting_start_timestamp: i64,
    /// `voting_start_timestamp + 14 days` (0 before `CapReached`).
    pub voting_end_timestamp: i64,
    pub is_finalized: bool,
    pub is_approved: bool,
    pub bump: u8,
}

/// One staker's ballot. `[b"staker_vote", verification_vote, staker]`
#[account]
#[derive(InitSpace)]
pub struct StakerVotingRecord {
    pub staker: Pubkey,
    pub verification_vote: Pubkey,
    pub vote_weight: u64,
    pub vote_yes: bool,
    pub bump: u8,
}
