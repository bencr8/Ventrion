use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::VerificationVoteCast;
use crate::state::{FundingRound, RoundStatus, StakerVotingRecord, VentStakePosition, VentureVerificationVote};

/// A $VENT staker votes on the legal/operational verification of a venture whose
/// round reached its hard cap. Weight = staked $VENT; the stake stays locked until
/// the ballot closes so it cannot be moved and counted twice.
#[derive(Accounts)]
pub struct CastVerificationVote<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(
        seeds = [SEED_FUNDING_ROUND, funding_round.venture.as_ref(), &[funding_round.round_index]],
        bump = funding_round.bump,
        has_one = verification_vote @ VentrionError::Unauthorized
    )]
    pub funding_round: Box<Account<'info, FundingRound>>,

    #[account(
        mut,
        seeds = [SEED_VERIFICATION_VOTE, funding_round.key().as_ref()],
        bump = verification_vote.bump
    )]
    pub verification_vote: Box<Account<'info, VentureVerificationVote>>,

    #[account(
        mut,
        seeds = [SEED_VENT_STAKE, staker.key().as_ref()],
        bump = stake_position.bump,
        has_one = staker @ VentrionError::Unauthorized
    )]
    pub stake_position: Box<Account<'info, VentStakePosition>>,

    /// One ballot per staker and round (account creation fails on a second vote).
    #[account(
        init,
        payer = staker,
        space = 8 + StakerVotingRecord::INIT_SPACE,
        seeds = [SEED_STAKER_VOTE, verification_vote.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub staker_vote_record: Box<Account<'info, StakerVotingRecord>>,

    pub system_program: Program<'info, System>,
}

pub fn handle_cast_verification_vote(ctx: Context<CastVerificationVote>, vote_yes: bool) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.funding_round.round_status == RoundStatus::CapReached,
        VentrionError::InvalidRoundStatus
    );
    let vote = &mut ctx.accounts.verification_vote;
    require!(!vote.is_finalized, VentrionError::VerificationAlreadyFinalized);
    require!(
        vote.voting_start_timestamp > 0
            && now >= vote.voting_start_timestamp
            && now < vote.voting_end_timestamp,
        VentrionError::VerificationVoteClosed
    );
    let position = &mut ctx.accounts.stake_position;
    let weight = position.amount;
    require!(weight > 0, VentrionError::InsufficientStakedBalance);

    if vote_yes {
        vote.for_weight = vote.for_weight.checked_add(weight).ok_or(VentrionError::MathOverflow)?;
    } else {
        vote.against_weight = vote
            .against_weight
            .checked_add(weight)
            .ok_or(VentrionError::MathOverflow)?;
    }
    vote.voter_count = vote.voter_count.checked_add(1).ok_or(VentrionError::MathOverflow)?;
    position.locked_until = position.locked_until.max(vote.voting_end_timestamp);

    let record = &mut ctx.accounts.staker_vote_record;
    record.staker = ctx.accounts.staker.key();
    record.verification_vote = vote.key();
    record.vote_weight = weight;
    record.vote_yes = vote_yes;
    record.bump = ctx.bumps.staker_vote_record;

    emit!(VerificationVoteCast {
        venture: vote.venture,
        funding_round: vote.funding_round,
        staker: record.staker,
        vote_yes,
        vote_weight: weight,
        for_weight: vote.for_weight,
        against_weight: vote.against_weight,
        timestamp: now,
    });
    Ok(())
}
