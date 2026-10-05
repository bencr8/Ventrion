//! Logic shared by several instructions: round terms, round initialization and
//! the non-transferable $VENT-RN receipt lifecycle.

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::VentrionError;
use crate::state::{FundingRound, RoundStatus, VentureVerificationVote};
use crate::utils::{math, token};

/// Economic terms of a flat-curve funding round.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct RoundTerms {
    /// USDC atoms per whole share (e.g. `100_000` = 0.10 USDC). Constant for the round.
    pub price_per_share_usdc: u64,
    /// Hard cap in USDC atoms. The round only closes when exactly this amount is raised.
    pub target_cap_usdc: u64,
    /// Upfront runway paid to the founder treasury at graduation (max 1,500 bps).
    pub upfront_working_capital_bps: u16,
}

/// Validated, derived round figures.
pub struct RoundPlan {
    pub shares_for_sale: u64,
    pub allocation: math::RoundAllocation,
}

impl RoundPlan {
    /// Shares that must be reserved in the master vault (sale + 17% DLMM seed).
    pub fn shares_required(&self) -> Result<u64> {
        math::add(self.shares_for_sale, self.allocation.dlmm_shares)
    }
}

impl RoundTerms {
    pub fn plan(&self) -> Result<RoundPlan> {
        require!(self.target_cap_usdc > 0, VentrionError::ZeroTargetCap);
        require!(self.price_per_share_usdc > 0, VentrionError::InvalidPrice);
        require!(
            self.upfront_working_capital_bps <= MAX_UPFRONT_CAPITAL_BPS,
            VentrionError::InvalidUpfrontCapitalBps
        );
        let shares_for_sale = math::shares_for_usdc(self.target_cap_usdc, self.price_per_share_usdc)?;
        require!(shares_for_sale > 0, VentrionError::InvalidRoundEconomics);
        let allocation = math::round_allocation(
            self.target_cap_usdc,
            shares_for_sale,
            self.upfront_working_capital_bps,
        )?;
        Ok(RoundPlan {
            shares_for_sale,
            allocation,
        })
    }
}

/// Accounts and bumps of a freshly created round.
pub struct RoundInit {
    pub venture: Pubkey,
    pub funding_round: Pubkey,
    pub receipt_mint: Pubkey,
    pub usdc_vault: Pubkey,
    pub verification_vote: Pubkey,
    pub round_index: u8,
    pub bump: u8,
    pub receipt_mint_bump: u8,
    pub usdc_vault_bump: u8,
    pub vote_bump: u8,
}

/// Writes a new round in `Initialized` status and its verification ballot with
/// all timestamps zeroed: the 14-day vote only starts once the cap is reached.
pub fn initialize_round(
    round: &mut FundingRound,
    vote: &mut VentureVerificationVote,
    init: &RoundInit,
    terms: &RoundTerms,
    plan: &RoundPlan,
) {
    round.venture = init.venture;
    round.receipt_mint = init.receipt_mint;
    round.usdc_vault = init.usdc_vault;
    round.verification_vote = init.verification_vote;
    round.milestone_escrow = Pubkey::default();
    round.dlmm_position = Pubkey::default();
    round.price_per_share_usdc = terms.price_per_share_usdc;
    round.target_cap_usdc = terms.target_cap_usdc;
    round.total_raised_usdc = 0;
    round.shares_for_sale = plan.shares_for_sale;
    round.receipts_outstanding = 0;
    round.receipts_redeemed = 0;
    round.total_refunded_usdc = 0;
    round.legal_fee_usdc = plan.allocation.legal_fee_usdc;
    round.upfront_usdc = plan.allocation.upfront_usdc;
    round.escrow_usdc = plan.allocation.escrow_usdc;
    round.dlmm_seed_usdc = plan.allocation.dlmm_usdc;
    round.dlmm_seed_shares = plan.allocation.dlmm_shares;
    round.cap_reached_ts = 0;
    round.graduated_ts = 0;
    round.dlmm_active_id = 0;
    round.dlmm_lower_bin_id = 0;
    round.upfront_working_capital_bps = terms.upfront_working_capital_bps;
    round.round_index = init.round_index;
    round.round_status = RoundStatus::Initialized;
    round.dlmm_prepared = false;
    round.bump = init.bump;
    round.receipt_mint_bump = init.receipt_mint_bump;
    round.usdc_vault_bump = init.usdc_vault_bump;

    vote.venture = init.venture;
    vote.funding_round = init.funding_round;
    vote.for_weight = 0;
    vote.against_weight = 0;
    vote.voter_count = 0;
    vote.total_vent_staked_snapshot = 0;
    vote.voting_start_timestamp = 0;
    vote.voting_end_timestamp = 0;
    vote.is_finalized = false;
    vote.is_approved = false;
    vote.bump = init.vote_bump;
}

pub fn create_round(
    init: &RoundInit,
    terms: &RoundTerms,
    plan: &RoundPlan,
) -> (FundingRound, VentureVerificationVote) {
    let round = FundingRound {
        venture: init.venture,
        receipt_mint: init.receipt_mint,
        usdc_vault: init.usdc_vault,
        verification_vote: init.verification_vote,
        milestone_escrow: Pubkey::default(),
        dlmm_position: Pubkey::default(),
        price_per_share_usdc: terms.price_per_share_usdc,
        target_cap_usdc: terms.target_cap_usdc,
        total_raised_usdc: 0,
        shares_for_sale: plan.shares_for_sale,
        receipts_outstanding: 0,
        receipts_redeemed: 0,
        total_refunded_usdc: 0,
        legal_fee_usdc: plan.allocation.legal_fee_usdc,
        upfront_usdc: plan.allocation.upfront_usdc,
        escrow_usdc: plan.allocation.escrow_usdc,
        dlmm_seed_usdc: plan.allocation.dlmm_usdc,
        dlmm_seed_shares: plan.allocation.dlmm_shares,
        cap_reached_ts: 0,
        graduated_ts: 0,
        dlmm_active_id: 0,
        dlmm_lower_bin_id: 0,
        upfront_working_capital_bps: terms.upfront_working_capital_bps,
        round_index: init.round_index,
        round_status: RoundStatus::Initialized,
        dlmm_prepared: false,
        bump: init.bump,
        receipt_mint_bump: init.receipt_mint_bump,
        usdc_vault_bump: init.usdc_vault_bump,
    };
    let vote = VentureVerificationVote {
        venture: init.venture,
        funding_round: init.funding_round,
        for_weight: 0,
        against_weight: 0,
        voter_count: 0,
        total_vent_staked_snapshot: 0,
        voting_start_timestamp: 0,
        voting_end_timestamp: 0,
        is_finalized: false,
        is_approved: false,
        bump: init.vote_bump,
    };
    (round, vote)
}

/// Signer seeds of a funding round PDA: `[b"funding_round", venture, [index], [bump]]`.
pub struct RoundSeeds {
    venture: Pubkey,
    index: [u8; 1],
    bump: [u8; 1],
}

impl RoundSeeds {
    pub fn new(round: &FundingRound) -> Self {
        Self {
            venture: round.venture,
            index: [round.round_index],
            bump: [round.bump],
        }
    }

    pub fn seeds(&self) -> [&[u8]; 4] {
        [SEED_FUNDING_ROUND, self.venture.as_ref(), &self.index, &self.bump]
    }
}

/// Signer seeds of a venture PDA: `[b"venture", venture_token_mint, [bump]]`.
pub struct VentureSeeds {
    mint: Pubkey,
    bump: [u8; 1],
}

impl VentureSeeds {
    pub fn new(venture_token_mint: Pubkey, bump: u8) -> Self {
        Self {
            mint: venture_token_mint,
            bump: [bump],
        }
    }

    pub fn seeds(&self) -> [&[u8]; 3] {
        [SEED_VENTURE, self.mint.as_ref(), &self.bump]
    }
}

/// Accounts involved in moving $VENT-RN receipts.
pub struct ReceiptAccounts<'a, 'info> {
    pub token_program: &'a AccountInfo<'info>,
    pub receipt_mint: &'a AccountInfo<'info>,
    pub holder_account: &'a AccountInfo<'info>,
    /// Funding round PDA (mint + freeze authority).
    pub funding_round: &'a AccountInfo<'info>,
}

/// Mints receipts into the holder's account and leaves it frozen (non-transferable).
pub fn mint_receipts(accts: &ReceiptAccounts, round_seeds: &[&[u8]], amount: u64) -> Result<()> {
    let holder = accts.holder_account;
    let is_frozen = {
        let data = holder.try_borrow_data()?;
        if data.len() >= 109 {
            data[108] == 2
        } else {
            false
        }
    };
    if is_frozen {
        token::thaw(accts.token_program, holder, accts.receipt_mint, accts.funding_round, &[round_seeds])?;
    }
    token::mint_to(
        accts.token_program,
        accts.receipt_mint,
        holder,
        accts.funding_round,
        &[round_seeds],
        amount,
    )?;
    token::freeze(accts.token_program, holder, accts.receipt_mint, accts.funding_round, &[round_seeds])
}

/// Burns receipts from the holder's account: the round PDA thaws it as freeze
/// authority, the holder signs the burn, and the account is re-frozen if a
/// balance remains (`holder_account.amount` is the pre-burn balance).
pub fn burn_receipts<'info>(
    accts: &ReceiptAccounts<'_, 'info>,
    holder_authority: &AccountInfo<'info>,
    round_seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    let (is_frozen, current_amount) = {
        let data = accts.holder_account.try_borrow_data()?;
        if data.len() < 109 {
            return Err(VentrionError::InvalidTokenAccount.into());
        }
        let mut amount_bytes = [0u8; 8];
        amount_bytes.copy_from_slice(&data[64..72]);
        (data[108] == 2, u64::from_le_bytes(amount_bytes))
    };
    require!(
        current_amount >= amount,
        VentrionError::InsufficientReceiptBalance
    );
    let holder = accts.holder_account;
    if is_frozen {
        token::thaw(accts.token_program, holder, accts.receipt_mint, accts.funding_round, &[round_seeds])?;
    }
    token::burn(accts.token_program, accts.receipt_mint, holder, holder_authority, &[], amount)?;
    if current_amount > amount {
        token::freeze(accts.token_program, holder, accts.receipt_mint, accts.funding_round, &[round_seeds])?;
    }
    Ok(())
}
