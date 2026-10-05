//! # Ventrion Protocol
//!
//! Ventrion is the premier institutional venture operating system and capital formation
//! protocol on Solana. It establishes common equity tokenization for real businesses:
//!
//! 1. **Fixed Cap Table & Sovereign Genesis** – Exactly 1,000,000 common shares minted
//!    into an on-chain `MasterLockVault`. Mint authority is permanently revoked in genesis.
//! 2. **Native Flat Curve Escrow** – Constant-price primary capital formation in canonical
//!    USDC; funds sit safely in the round's `funding_round_usdc_vault` while backers receive
//!    non-transferable $VENT-RN receipts (with 100% sellback guarantees prior to cap closure).
//! 3. **14-Day Decentralized $VENT Governance Gate** – Upon reaching the hard cap, the curve
//!    freezes and $VENT stakers vote on company verification. Approval unlocks secondary
//!    market graduation; rejection or timeout guarantees 100% USDC refunds to primary backers.
//! 4. **Permanent Meteora DLMM Liquidity & Milestone Escrows** – Graduation atomically seeds
//!    an irrevocable 17.0% DLMM position owned by `DlmmCustody`, reserves legal corporate setup
//!    costs (`max($3,000, 3%)`), delivers upfront founder runway (capped at 15%), and locks the
//!    balance into tranche-specific `MilestoneEscrow` accounts.
//! 5. **O(1) Constant-Time Yield & Investor Protection** – Backers redeem receipts 1:1 for
//!    common shares, stake for 1.0x to 3.0x dividend multipliers powered by an overflow-safe
//!    accumulator scaled by 10^12, and exercise ragequit rights if roadmap deliverables fail.

#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;
use state::MilestoneInput;

declare_id!("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");

#[program]
pub mod ventrion_protocol {
    use super::*;

    // =========================================================================
    // Protocol Administration
    // =========================================================================

    /// Initializes global protocol configuration, canonical mint references,
    /// $VENT staking vault, and default Meteora DLMM preset parameters.
    pub fn initialize_global_config(ctx: Context<InitializeGlobalConfig>, params: GlobalConfigParams) -> Result<()> {
        instructions::admin::handle_initialize_global_config(ctx, params)
    }

    /// Updates mutable protocol governance parameters including fee treasuries,
    /// verification quorum thresholds, and protocol fee basis points.
    pub fn update_global_config(
        ctx: Context<UpdateGlobalConfig>,
        new_admin: Pubkey,
        params: GlobalConfigParams,
    ) -> Result<()> {
        instructions::admin::handle_update_global_config(ctx, new_admin, params)
    }

    /// Releases escrowed legal setup fees from the venture's legal setup vault to
    /// the designated legal service provider (e.g., MIDAO DAO LLC registry authority).
    pub fn release_legal_setup_fee(ctx: Context<ReleaseLegalSetupFee>, amount: u64) -> Result<()> {
        instructions::admin::handle_release_legal_setup_fee(ctx, amount)
    }

    // =========================================================================
    // Mother-Token ($VENT) Staking Governance
    // =========================================================================

    /// Stakes mother token ($VENT) into the protocol governance vault, granting voting
    /// weight in upcoming venture verification ballots.
    pub fn stake_vent(ctx: Context<StakeVent>, amount: u64) -> Result<()> {
        instructions::vent_staking::handle_stake_vent(ctx, amount)
    }

    /// Unstakes mother token ($VENT) from the governance vault after all active ballot
    /// lock commitments have expired.
    pub fn unstake_vent(ctx: Context<UnstakeVent>, amount: u64) -> Result<()> {
        instructions::vent_staking::handle_unstake_vent(ctx, amount)
    }

    // =========================================================================
    // Venture Genesis & Primary Financing Round
    // =========================================================================

    /// Initializes a new company on-chain, minting exactly 1,000,000 shares to the
    /// MasterLockVault, revoking mint authority forever, and configuring round 0.
    pub fn launch_venture_genesis(ctx: Context<LaunchVentureGenesis>, params: VentureGenesisParams) -> Result<()> {
        instructions::launch_venture_genesis::handle_launch_venture_genesis(ctx, params)
    }

    /// Initializes a new company on-chain and registers official Metaplex Token Metadata
    /// (name, symbol, URI) in a single atomic transaction.
    pub fn launch_venture_genesis_with_metadata(
        ctx: Context<LaunchVentureGenesisWithMetadata>,
        name: String,
        symbol: String,
        uri: String,
        params: VentureGenesisParams,
    ) -> Result<()> {
        instructions::launch_venture_genesis::handle_launch_venture_genesis_with_metadata(ctx, name, symbol, uri, params)
    }

    /// Commits the milestone roadmap (1 to 10 tranches) for the active round, initializing
    /// secondary vaults and transitioning the round to active capital formation.
    pub fn configure_milestones(ctx: Context<ConfigureMilestones>, milestones: Vec<MilestoneInput>) -> Result<()> {
        instructions::configure_milestones::handle_configure_milestones(ctx, milestones)
    }

    /// Creates a subsequent funding round (Round N+1) once all prior round milestones
    /// are successfully finalized.
    pub fn create_funding_round(ctx: Context<CreateFundingRound>, round_index: u8, terms: RoundTerms) -> Result<()> {
        instructions::create_funding_round::handle_create_funding_round(ctx, round_index, terms)
    }

    /// Contributes USDC into the primary flat curve escrow in exchange for non-transferable
    /// $VENT-RN primary receipts. Automatically triggers CapReached when 100% funded.
    pub fn contribute_funding_round(ctx: Context<ContributeFundingRound>, usdc_amount: u64) -> Result<()> {
        instructions::contribute_funding_round::handle_contribute_funding_round(ctx, usdc_amount)
    }

    /// Sells primary receipts back to the escrow vault at 100% face value prior to
    /// hard cap completion, guaranteeing zero-loss capital liquidity.
    pub fn sell_primary_round(ctx: Context<SellPrimaryRound>, receipt_amount: u64) -> Result<()> {
        instructions::sell_primary_round::handle_sell_primary_round(ctx, receipt_amount)
    }

    // =========================================================================
    // 14-Day Verification Gate & Settlement
    // =========================================================================

    /// Casts a $VENT staker verification vote (YES/NO) on a company that reached its hard cap.
    pub fn cast_verification_vote(ctx: Context<CastVerificationVote>, vote_yes: bool) -> Result<()> {
        instructions::cast_verification_vote::handle_cast_verification_vote(ctx, vote_yes)
    }

    /// Finalizes the verification vote after the 14-day voting window elapses, transitioning
    /// the venture to VerifiedApproved (if >50% majority achieved) or RefundActive.
    pub fn finalize_verification(ctx: Context<FinalizeVerification>) -> Result<()> {
        instructions::finalize_verification::handle_finalize_verification(ctx)
    }

    /// Allows primary backers to claim 100% of their deposited USDC if verification
    /// fails, quorum is not met, or the voting window expires without approval.
    pub fn refund_primary_round(ctx: Context<RefundPrimaryRound>) -> Result<()> {
        instructions::refund_primary_round::handle_refund_primary_round(ctx)
    }

    // =========================================================================
    // Meteora DLMM Secondary Market & Graduation
    // =========================================================================

    /// Prepares the canonical Meteora DLMM pool for graduation, initializing bin arrays
    /// and aligning the active bin with the primary curve price.
    pub fn prepare_dlmm_pool(ctx: Context<PrepareDlmmPool>, active_id: i32) -> Result<()> {
        instructions::prepare_dlmm_pool::handle_prepare_dlmm_pool(ctx, active_id)
    }

    /// Atomically executes secondary graduation: transfers legal fees, upfront runway,
    /// permanently deposits 17% USDC and 17% shares into Meteora DLMM, and funds milestone escrow.
    pub fn execute_atomic_graduation(ctx: Context<ExecuteAtomicGraduation>) -> Result<()> {
        instructions::execute_atomic_graduation::handle_execute_atomic_graduation(ctx)
    }

    /// Redeems primary receipts 1:1 for freely tradeable common shares from the MasterLockVault.
    pub fn redeem_shares(ctx: Context<RedeemShares>, amount: u64) -> Result<()> {
        instructions::redeem_shares::handle_redeem_shares(ctx, amount)
    }

    /// Atomically redeems primary receipts 1:1 into common shares and deposits them directly
    /// into the InvestorVault staking pool with a time-lock dividend multiplier.
    pub fn redeem_and_stake_shares(
        ctx: Context<RedeemAndStakeShares>,
        amount: u64,
        lock_duration_seconds: i64,
    ) -> Result<()> {
        instructions::redeem_shares::handle_redeem_and_stake_shares(ctx, amount, lock_duration_seconds)
    }

    /// Permissionlessly harvests accrued trading fees from the permanently locked Meteora DLMM
    /// position, routing protocol royalty to fee_treasury and staker yield to dividend_vault.
    pub fn harvest_dlmm_fees(ctx: Context<HarvestDlmmFees>) -> Result<()> {
        instructions::harvest_dlmm_fees::handle_harvest_dlmm_fees(ctx)
    }

    // =========================================================================
    // Founder Vesting
    // =========================================================================

    /// Claims unlocked founder common shares from the vesting vault according to linear
    /// schedule post-cliff.
    pub fn founder_claim_vesting(ctx: Context<FounderClaimVesting>) -> Result<()> {
        instructions::founder_claim_vesting::handle_founder_claim_vesting(ctx)
    }

    // =========================================================================
    // Milestone Governance & Escrow
    // =========================================================================

    /// Proposes completion of a milestone tranche, initiating the 7-day optimistic review window.
    pub fn propose_milestone(ctx: Context<FounderMilestoneAction>, milestone_id: u8) -> Result<()> {
        instructions::milestone_governance::handle_propose_milestone(ctx, milestone_id)
    }

    /// Proposes an amended timeline or scope during a cure cycle following a backer veto (max 3 amendments).
    pub fn amend_milestone(
        ctx: Context<FounderMilestoneAction>,
        milestone_id: u8,
        new_target_completion_date: i64,
    ) -> Result<()> {
        instructions::milestone_governance::handle_amend_milestone(ctx, milestone_id, new_target_completion_date)
    }

    /// Casts an approval or veto vote on an active milestone tranche using primary backer weighting.
    pub fn vote_milestone(ctx: Context<VoteMilestone>, milestone_id: u8, approve: bool) -> Result<()> {
        instructions::milestone_governance::handle_vote_milestone(ctx, milestone_id, approve)
    }

    /// Executes release of an approved or optimistically matured milestone tranche to the OpCo treasury.
    pub fn execute_milestone_release(ctx: Context<ExecuteMilestoneRelease>, milestone_id: u8) -> Result<()> {
        instructions::milestone_governance::handle_execute_milestone_release(ctx, milestone_id)
    }

    /// Surrenders common shares back to the MasterLockVault in exchange for a pro-rata refund of
    /// unspent milestone escrow USDC following a breached milestone.
    pub fn ragequit_milestone_escrow(ctx: Context<RagequitMilestoneEscrow>, shares_amount: u64) -> Result<()> {
        instructions::ragequit_milestone_escrow::handle_ragequit_milestone_escrow(ctx, shares_amount)
    }

    // =========================================================================
    // Investor Staking & Constant-Time Dividends
    // =========================================================================

    /// Stakes common shares in the company InvestorVault for 0 to 730 days to receive
    /// 1.0x to 3.0x dividend weight multipliers.
    pub fn deposit_investor_shares(
        ctx: Context<DepositInvestorShares>,
        amount: u64,
        lock_duration_seconds: i64,
    ) -> Result<()> {
        instructions::investor_staking::handle_deposit_investor_shares(ctx, amount, lock_duration_seconds)
    }

    /// Unstakes unlocked common shares from the InvestorVault after the lock duration expires.
    pub fn unstake_investor_shares(ctx: Context<UnstakeInvestorShares>, amount: u64) -> Result<()> {
        instructions::investor_staking::handle_unstake_investor_shares(ctx, amount)
    }

    /// Claims accumulated USDC dividend payouts calculated in O(1) constant time.
    pub fn claim_investor_dividends(ctx: Context<ClaimInvestorDividends>) -> Result<()> {
        instructions::investor_staking::handle_claim_investor_dividends(ctx)
    }

    /// Refreshes the local staking vault accumulator against recent venture revenue inflows.
    pub fn refresh_investor_vault(ctx: Context<RefreshInvestorVault>) -> Result<()> {
        instructions::investor_staking::handle_refresh_investor_vault(ctx)
    }

    /// Deposits corporate B2B merchant acquisition and commercial operating fees directly into
    /// the venture dividend vault with an external invoice reference hash.
    pub fn deposit_ecosystem_fees(
        ctx: Context<DepositEcosystemFees>,
        amount: u64,
        reference: [u8; 32],
    ) -> Result<()> {
        instructions::investor_staking::handle_deposit_ecosystem_fees(ctx, amount, reference)
    }
}
