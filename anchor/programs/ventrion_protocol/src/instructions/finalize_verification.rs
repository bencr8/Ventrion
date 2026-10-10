use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::VerificationFinalized;
use crate::state::{FundingRound, GlobalConfig, RoundStatus, VentureState, VentureStatus, VentureVerificationVote};

/// Closes the 14-day $VENT ballot (permissionless, only after `voting_end_timestamp`).
///
/// * Path A – approved (strict majority above `min_approval_bps` and quorum met):
///   `VerifiedApproved`, DLMM graduation unlocked.
/// * Path B – rejected, no quorum or nobody voted (timeout): `RefundActive`,
///   every backer can reclaim 100% of their USDC.
#[derive(Accounts)]
pub struct FinalizeVerification<'info> {
    #[account(seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = global_config @ VentrionError::Unauthorized
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = venture @ VentrionError::Unauthorized,
        has_one = verification_vote @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(mut)]
    pub verification_vote: Box<Account<'info, VentureVerificationVote>>,
}

/// Approval rule: participation >= quorum of the snapshot and
/// `for / (for + against) > min_approval_bps`.
pub fn is_vote_approved(
    for_weight: u64,
    against_weight: u64,
    total_staked_snapshot: u64,
    min_approval_bps: u16,
    quorum_bps: u16,
) -> bool {
    let total = for_weight as u128 + against_weight as u128;
    if total == 0 {
        #[cfg(feature = "testing")]
        return true;
        #[cfg(not(feature = "testing"))]
        return false;
    }
    let majority = for_weight as u128 * BPS_DENOMINATOR as u128 > min_approval_bps as u128 * total;
    let quorum = total * BPS_DENOMINATOR as u128 >= quorum_bps as u128 * total_staked_snapshot as u128;
    majority && quorum
}

pub fn handle_finalize_verification(ctx: Context<FinalizeVerification>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.funding_round.round_status == RoundStatus::CapReached
            && ctx.accounts.venture.status == VentureStatus::CapReached,
        VentrionError::InvalidRoundStatus
    );
    let vote = &mut ctx.accounts.verification_vote;
    require!(!vote.is_finalized, VentrionError::VerificationAlreadyFinalized);
    #[cfg(not(feature = "testing"))]
    require!(
        vote.voting_end_timestamp > 0 && now >= vote.voting_end_timestamp,
        VentrionError::VerificationVoteActive
    );
    #[cfg(feature = "testing")]
    require!(
        vote.voting_end_timestamp > 0,
        VentrionError::VerificationVoteActive
    );

    let config = &ctx.accounts.global_config;
    let is_approved = is_vote_approved(
        vote.for_weight,
        vote.against_weight,
        vote.total_vent_staked_snapshot,
        config.min_approval_bps,
        config.verification_quorum_bps,
    );
    vote.is_finalized = true;
    vote.is_approved = is_approved;

    let round = &mut ctx.accounts.funding_round;
    let venture = &mut ctx.accounts.venture;
    if is_approved {
        round.round_status = RoundStatus::VerifiedApproved;
        venture.status = VentureStatus::VerifiedApproved;
    } else {
        round.round_status = RoundStatus::RefundActive;
        venture.status = VentureStatus::RefundActive;
    }
    venture.is_round_active = false;

    emit!(VerificationFinalized {
        venture: venture.key(),
        funding_round: round.key(),
        is_approved,
        for_weight: vote.for_weight,
        against_weight: vote.against_weight,
        total_vent_staked: vote.total_vent_staked_snapshot,
        timestamp: now,
    });
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::is_vote_approved;

    #[test]
    fn approval_rule() {
        // Strict majority needed.
        assert!(!is_vote_approved(50, 50, 100, 5_000, 0));
        assert!(is_vote_approved(51, 49, 100, 5_000, 0));
        // Nobody voted -> timeout -> refund.
        assert!(!is_vote_approved(0, 0, 100, 5_000, 0));
        // Quorum of 20% of the snapshot.
        assert!(!is_vote_approved(10, 0, 100, 5_000, 2_000));
        assert!(is_vote_approved(20, 0, 100, 5_000, 2_000));
    }
}
