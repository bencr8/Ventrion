//! # Ventrion Protocol Error Codes
//!
//! Error codes 6000-6025 adhere strictly to the Ventrion Manifesto specification (Section 7.2).
//! Protocol extensions start at error code 6026.

use anchor_lang::prelude::*;

/// Error codes 6000-6025 follow the manifesto (section 7.2) verbatim and in order,
/// so client-side error mapping stays stable. Codes >= 6026 are protocol extensions.
#[error_code]
pub enum VentrionError {
    #[msg("6000: Quote currency mint must match canonical USDC.")]
    InvalidUsdcMint,
    #[msg("6001: Target funding cap must be greater than zero.")]
    ZeroTargetCap,
    #[msg("6002: Lock commitment duration out of bounds.")]
    LockDurationTooShort,
    #[msg("6003: Founder vesting cliff has not elapsed.")]
    FounderCliffNotMet,
    #[msg("6004: Funding round is not currently active.")]
    RoundNotActive,
    #[msg("6005: Round is not eligible for graduation.")]
    RoundNotEligibleForGraduation,
    #[msg("6006: Round is not eligible for refund.")]
    RoundNotEligibleForRefund,
    #[msg("6007: Milestone is not eligible for release.")]
    MilestoneNotEligibleForRelease,
    #[msg("6008: Previous funding round is still active.")]
    RoundAlreadyActive,
    #[msg("6009: Math overflow occurred during financial precision calculation.")]
    MathOverflow,
    #[msg("6010: Zero claimable rewards available.")]
    NoDividendsOwed,
    #[msg("6011: Global supply invariant violated. Total shares must equal 1,000,000.")]
    SupplyInvariantViolated,
    #[msg("6012: Caller lacks required authority for this instruction.")]
    Unauthorized,
    #[msg("6013: Position is still within lock commitment period.")]
    LockNotExpired,
    #[msg("6014: Milestone is not currently in proposed status.")]
    MilestoneNotProposed,
    #[msg("6015: Venture has not received legal approval by $VENT stakers.")]
    VentureNotApproved,
    #[msg("6016: Verification vote is currently active.")]
    VerificationVoteActive,
    #[msg("6017: CPI to Meteora DLMM pool initialization failed.")]
    DlmmPoolInitFailed,
    #[msg("6018: CPI to Meteora DLMM add_liquidity_by_weight2 failed.")]
    DlmmLiquiditySeedFailed,
    #[msg("6019: Upfront working capital percentage out of bounds (max 15%).")]
    InvalidUpfrontCapitalBps,
    #[msg("6020: Milestones count out of bounds. Exactly 1 to 10 milestone tranches permitted.")]
    InvalidMilestoneCount,
    #[msg("6021: Total allocation percentage sum must equal exactly 10,000 basis points.")]
    InvalidAllocationSum,
    #[msg("6022: Milestone amendment limit exceeded (maximum 3 revisions allowed).")]
    AmendmentLimitExceeded,
    #[msg("6023: Provided Meteora program ID does not match canonical deployment.")]
    InvalidMeteoraProgram,
    #[msg("6024: Primary receipt token balance insufficient for share redemption.")]
    InsufficientReceiptBalance,
    #[msg("6025: Legal Operating Agreement SHA256 contract hash cannot be empty.")]
    EmptyLegalContractHash,

    // ---------------------------------------------------------------- extensions
    #[msg("6026: Invalid round index. Rounds must increment sequentially.")]
    InvalidRoundIndex,
    #[msg("6027: Amount must be greater than zero.")]
    ZeroAmount,
    #[msg("6028: Contribution would exceed the round hard cap.")]
    ExceedsHardCap,
    #[msg("6029: Amount does not convert to an exact number of share atoms at the flat price.")]
    InexactPriceConversion,
    #[msg("6030: Flat price per share must be greater than zero.")]
    InvalidPrice,
    #[msg("6031: Round economics invalid: legal fee, DLMM seed and runway exceed the raise.")]
    InvalidRoundEconomics,
    #[msg("6032: Master lock vault does not hold enough shares for this round.")]
    InsufficientTreasuryShares,
    #[msg("6033: Verification vote window is closed.")]
    VerificationVoteClosed,
    #[msg("6034: Verification vote has already been finalized.")]
    VerificationAlreadyFinalized,
    #[msg("6035: Caller has no staked $VENT voting power.")]
    InsufficientStakedBalance,
    #[msg("6036: Round is not in the expected status for this instruction.")]
    InvalidRoundStatus,
    #[msg("6037: Venture is not in the expected status for this instruction.")]
    InvalidVentureStatus,
    #[msg("6038: Milestones have already been configured for this round.")]
    MilestonesAlreadyConfigured,
    #[msg("6039: Milestone target dates must be in the future and strictly increasing.")]
    InvalidMilestoneSchedule,
    #[msg("6040: Milestone index out of range.")]
    InvalidMilestoneId,
    #[msg("6041: Milestones must be processed sequentially.")]
    MilestoneOutOfOrder,
    #[msg("6042: Backer already voted on this milestone review cycle.")]
    MilestoneAlreadyVoted,
    #[msg("6043: Milestone veto window has expired.")]
    VetoPeriodExpired,
    #[msg("6044: Caller holds no primary backer voting weight for this round.")]
    NoPrimaryVotingWeight,
    #[msg("6045: Ragequit is only possible for breached or overdue milestones.")]
    RagequitNotAllowed,
    #[msg("6046: Account is not owned by the Meteora DLMM program or has the wrong type.")]
    InvalidMeteoraAccount,
    #[msg("6047: Meteora DLMM pool address does not match the canonical derivation.")]
    InvalidMeteoraPool,
    #[msg("6048: DLMM active bin does not match the flat round price.")]
    DlmmPriceMismatch,
    #[msg("6049: DLMM bin array index lies outside the default bitmap range.")]
    DlmmBinArrayOutOfRange,
    #[msg("6050: Provided DLMM bin array does not match the expected derivation.")]
    InvalidDlmmBinArray,
    #[msg("6051: DLMM pool has not been prepared for this round.")]
    DlmmNotPrepared,
    #[msg("6052: CPI to Meteora DLMM claim_fee2 failed.")]
    DlmmFeeClaimFailed,
    #[msg("6053: Invalid governance or protocol parameter.")]
    InvalidParameter,
    #[msg("6054: Venture has no active stakers to receive dividends.")]
    NoActiveStakers,
    #[msg("6055: Legal setup vault balance insufficient.")]
    InsufficientLegalVaultBalance,
    #[msg("6056: Account mint or owner does not match the expected value.")]
    InvalidTokenAccount,
    #[msg("6057: Nothing to refund for this backer.")]
    NothingToRefund,
    #[msg("6058: Founder vesting has nothing claimable.")]
    NothingVested,
    #[msg("6059: Insufficient $VENT staked to bootstrap venture creation.")]
    InsufficientVentStaked,
    #[msg("6060: Zero claimable $VENT holding dividends available.")]
    NoVentDividendsOwed,
}
