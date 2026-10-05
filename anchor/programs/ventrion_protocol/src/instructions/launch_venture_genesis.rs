use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta, Instruction}, program::invoke_signed};
use anchor_spl::token::{self, spl_token::instruction::AuthorityType, Mint, SetAuthority, Token};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{FundingRoundCreated, VentureGenesisLaunched};
use crate::instructions::shared::{RoundInit, RoundTerms, VentureSeeds};
use crate::state::{FounderVesting, FundingRound, GlobalConfig, VentureState, VentureStatus, VentureVerificationVote};
use crate::utils::token as token_utils;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct VentureGenesisParams {
    /// Legal entity registry ID (MIDAO DAO LLC / Verein).
    pub midao_llc_id: [u8; 32],
    /// SHA-256 of the signed Operating Agreement.
    pub legal_contract_hash: [u8; 32],
    /// Founder allocation (share atoms), vested linearly after the cliff.
    pub founder_shares: u64,
    pub vesting_cliff_seconds: i64,
    pub vesting_duration_seconds: i64,
    /// Terms of funding round 0 (flat curve).
    pub round_terms: RoundTerms,
}

#[derive(Accounts)]
pub struct LaunchVentureGenesis<'info> {
    #[account(mut)]
    pub founder: Signer<'info>,

    #[account(seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// Fresh keypair: the venture's common share mint (6 decimals, no freeze authority).
    #[account(mut)]
    pub venture_token_mint: Signer<'info>,

    #[account(
        init,
        payer = founder,
        space = 8 + VentureState::INIT_SPACE,
        seeds = [SEED_VENTURE, venture_token_mint.key().as_ref()],
        bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

    /// CHECK: Master lock vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_MASTER_LOCK_VAULT, venture.key().as_ref()],
        bump
    )]
    pub master_lock_vault: UncheckedAccount<'info>,

    /// CHECK: Legal setup vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_LEGAL_SETUP_VAULT, venture.key().as_ref()],
        bump
    )]
    pub legal_setup_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_FOUNDER_VESTING, venture.key().as_ref(), founder.key().as_ref()],
        bump
    )]
    pub founder_vesting: UncheckedAccount<'info>,

    /// CHECK: Vesting vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_VESTING_VAULT, venture.key().as_ref()],
        bump
    )]
    pub vesting_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[0u8]],
        bump
    )]
    pub funding_round: UncheckedAccount<'info>,

    /// $VENT-RN receipt mint of round 0 (mint + freeze authority = round PDA).
    /// CHECK: Receipt mint initialized in handler
    #[account(
        mut,
        seeds = [SEED_RECEIPT_MINT, funding_round.key().as_ref()],
        bump
    )]
    pub receipt_mint: UncheckedAccount<'info>,

    /// `funding_round_usdc_vault`: flat-curve escrow of round 0.
    /// CHECK: Round usdc vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump
    )]
    pub round_usdc_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_VERIFICATION_VOTE, funding_round.key().as_ref()],
        bump
    )]
    pub verification_vote: UncheckedAccount<'info>,

    #[account(address = global_config.usdc_mint @ VentrionError::InvalidUsdcMint)]
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// CHECK: wallet owning the OpCo treasury; receives upfront runway and milestone tranches
    /// into its USDC token account. Any system account is acceptable.
    pub treasury_wallet: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LaunchVentureGenesisWithMetadata<'info> {
    #[account(mut)]
    pub founder: Signer<'info>,

    #[account(seeds = [SEED_GLOBAL_CONFIG], bump = global_config.bump)]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// Fresh keypair: the venture's common share mint (6 decimals, no freeze authority).
    #[account(mut)]
    pub venture_token_mint: Signer<'info>,

    #[account(
        init,
        payer = founder,
        space = 8 + VentureState::INIT_SPACE,
        seeds = [SEED_VENTURE, venture_token_mint.key().as_ref()],
        bump
    )]
    pub venture: Box<Account<'info, VentureState>>,

    /// CHECK: Master lock vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_MASTER_LOCK_VAULT, venture.key().as_ref()],
        bump
    )]
    pub master_lock_vault: UncheckedAccount<'info>,

    /// CHECK: Legal setup vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_LEGAL_SETUP_VAULT, venture.key().as_ref()],
        bump
    )]
    pub legal_setup_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_FOUNDER_VESTING, venture.key().as_ref(), founder.key().as_ref()],
        bump
    )]
    pub founder_vesting: UncheckedAccount<'info>,

    /// CHECK: Vesting vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_VESTING_VAULT, venture.key().as_ref()],
        bump
    )]
    pub vesting_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_FUNDING_ROUND, venture.key().as_ref(), &[0u8]],
        bump
    )]
    pub funding_round: UncheckedAccount<'info>,

    /// CHECK: Receipt mint initialized in handler
    #[account(
        mut,
        seeds = [SEED_RECEIPT_MINT, funding_round.key().as_ref()],
        bump
    )]
    pub receipt_mint: UncheckedAccount<'info>,

    /// CHECK: Round usdc vault initialized in handler
    #[account(
        mut,
        seeds = [SEED_ROUND_USDC_VAULT, funding_round.key().as_ref()],
        bump
    )]
    pub round_usdc_vault: UncheckedAccount<'info>,

    /// CHECK: Initialized in handler
    #[account(
        mut,
        seeds = [SEED_VERIFICATION_VOTE, funding_round.key().as_ref()],
        bump
    )]
    pub verification_vote: UncheckedAccount<'info>,

    #[account(address = global_config.usdc_mint @ VentrionError::InvalidUsdcMint)]
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// CHECK: wallet owning the OpCo treasury; receives upfront runway and milestone tranches
    pub treasury_wallet: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata account: PDA [b"metadata", token_metadata_program, venture_token_mint]
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
    pub token_metadata_program: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

struct MetadataCPIArgs<'a, 'info> {
    pub metadata: &'a AccountInfo<'info>,
    pub token_metadata_program: &'a AccountInfo<'info>,
    pub rent: &'a AccountInfo<'info>,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn handle_launch_venture_genesis(
    ctx: Context<LaunchVentureGenesis>,
    params: VentureGenesisParams,
) -> Result<()> {
    handle_launch_venture_genesis_core(
        &ctx.accounts.founder.to_account_info(),
        &ctx.accounts.global_config.to_account_info(),
        &ctx.accounts.venture_token_mint.to_account_info(),
        &ctx.accounts.venture.to_account_info(),
        &ctx.accounts.master_lock_vault.to_account_info(),
        &ctx.accounts.legal_setup_vault.to_account_info(),
        &ctx.accounts.founder_vesting.to_account_info(),
        &ctx.accounts.vesting_vault.to_account_info(),
        &ctx.accounts.funding_round.to_account_info(),
        &ctx.accounts.receipt_mint.to_account_info(),
        &ctx.accounts.round_usdc_vault.to_account_info(),
        &ctx.accounts.verification_vote.to_account_info(),
        &ctx.accounts.usdc_mint.to_account_info(),
        &ctx.accounts.treasury_wallet.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &mut ctx.accounts.venture,
        ctx.bumps.venture,
        ctx.bumps.master_lock_vault,
        ctx.bumps.legal_setup_vault,
        ctx.bumps.founder_vesting,
        ctx.bumps.vesting_vault,
        ctx.bumps.funding_round,
        ctx.bumps.receipt_mint,
        ctx.bumps.round_usdc_vault,
        ctx.bumps.verification_vote,
        params,
        None,
    )
}

pub fn handle_launch_venture_genesis_with_metadata(
    ctx: Context<LaunchVentureGenesisWithMetadata>,
    name: String,
    symbol: String,
    uri: String,
    params: VentureGenesisParams,
) -> Result<()> {
    let metadata_args = MetadataCPIArgs {
        metadata: &ctx.accounts.metadata.to_account_info(),
        token_metadata_program: &ctx.accounts.token_metadata_program.to_account_info(),
        rent: &ctx.accounts.rent.to_account_info(),
        name,
        symbol,
        uri,
    };
    handle_launch_venture_genesis_core(
        &ctx.accounts.founder.to_account_info(),
        &ctx.accounts.global_config.to_account_info(),
        &ctx.accounts.venture_token_mint.to_account_info(),
        &ctx.accounts.venture.to_account_info(),
        &ctx.accounts.master_lock_vault.to_account_info(),
        &ctx.accounts.legal_setup_vault.to_account_info(),
        &ctx.accounts.founder_vesting.to_account_info(),
        &ctx.accounts.vesting_vault.to_account_info(),
        &ctx.accounts.funding_round.to_account_info(),
        &ctx.accounts.receipt_mint.to_account_info(),
        &ctx.accounts.round_usdc_vault.to_account_info(),
        &ctx.accounts.verification_vote.to_account_info(),
        &ctx.accounts.usdc_mint.to_account_info(),
        &ctx.accounts.treasury_wallet.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &mut ctx.accounts.venture,
        ctx.bumps.venture,
        ctx.bumps.master_lock_vault,
        ctx.bumps.legal_setup_vault,
        ctx.bumps.founder_vesting,
        ctx.bumps.vesting_vault,
        ctx.bumps.funding_round,
        ctx.bumps.receipt_mint,
        ctx.bumps.round_usdc_vault,
        ctx.bumps.verification_vote,
        params,
        Some(metadata_args),
    )
}

#[inline(never)]
fn handle_launch_venture_genesis_core<'info>(
    founder_info: &AccountInfo<'info>,
    global_config_info: &AccountInfo<'info>,
    venture_token_mint_info: &AccountInfo<'info>,
    venture_info: &AccountInfo<'info>,
    master_lock_vault_info: &AccountInfo<'info>,
    legal_setup_vault_info: &AccountInfo<'info>,
    founder_vesting_info: &AccountInfo<'info>,
    vesting_vault_info: &AccountInfo<'info>,
    funding_round_info: &AccountInfo<'info>,
    receipt_mint_info: &AccountInfo<'info>,
    round_usdc_vault_info: &AccountInfo<'info>,
    verification_vote_info: &AccountInfo<'info>,
    usdc_mint_info: &AccountInfo<'info>,
    treasury_wallet_info: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    venture_state: &mut VentureState,
    bump_venture: u8,
    bump_master_lock_vault: u8,
    bump_legal_setup_vault: u8,
    bump_founder_vesting: u8,
    bump_vesting_vault: u8,
    bump_funding_round: u8,
    bump_receipt_mint: u8,
    bump_round_usdc_vault: u8,
    bump_verification_vote: u8,
    params: VentureGenesisParams,
    metadata_cpi: Option<MetadataCPIArgs<'_, 'info>>,
) -> Result<()> {
    // ---------------------------------------------------------------- checks
    require!(
        params.legal_contract_hash != [0u8; 32],
        VentrionError::EmptyLegalContractHash
    );
    require!(params.midao_llc_id != [0u8; 32], VentrionError::InvalidParameter);
    require!(
        treasury_wallet_info.key() != Pubkey::default(),
        VentrionError::InvalidParameter
    );
    require!(
        (MIN_FOUNDER_VESTING_SECONDS..=MAX_FOUNDER_VESTING_SECONDS)
            .contains(&params.vesting_duration_seconds)
            && (MIN_FOUNDER_CLIFF_SECONDS..=MAX_FOUNDER_CLIFF_SECONDS)
                .contains(&params.vesting_cliff_seconds)
            && params.vesting_cliff_seconds <= params.vesting_duration_seconds,
        VentrionError::LockDurationTooShort
    );
    let plan = params.round_terms.plan()?;
    let committed_shares = plan
        .shares_required()?
        .checked_add(params.founder_shares)
        .ok_or(VentrionError::MathOverflow)?;
    require!(
        committed_shares <= FIXED_TOTAL_SUPPLY,
        VentrionError::SupplyInvariantViolated
    );

    let now = Clock::get()?.unix_timestamp;
    let venture_key = venture_info.key();
    let mint_key = venture_token_mint_info.key();
    let venture_seeds = VentureSeeds::new(mint_key, bump_venture);
    let round_key = funding_round_info.key();

    // ------------------------------------------- initialize mint & token vaults
    token_utils::create_mint_account(
        founder_info,
        venture_token_mint_info,
        venture_info,
        None,
        SHARE_DECIMALS,
        system_program,
        token_program,
    )?;

    // ------------------------------------------- optional Metaplex Metadata V3 CPI
    if let Some(meta) = metadata_cpi {
        require_keys_eq!(
            *meta.token_metadata_program.key,
            METAPLEX_PROGRAM_ID,
            VentrionError::InvalidParameter
        );
        let mut instruction_data = Vec::with_capacity(128);
        instruction_data.push(33u8); // Discriminator 33 for CreateMetadataAccountV3
        let name_bytes = meta.name.as_bytes();
        instruction_data.extend_from_slice(&(name_bytes.len() as u32).to_le_bytes());
        instruction_data.extend_from_slice(name_bytes);
        let symbol_bytes = meta.symbol.as_bytes();
        instruction_data.extend_from_slice(&(symbol_bytes.len() as u32).to_le_bytes());
        instruction_data.extend_from_slice(symbol_bytes);
        let uri_bytes = meta.uri.as_bytes();
        instruction_data.extend_from_slice(&(uri_bytes.len() as u32).to_le_bytes());
        instruction_data.extend_from_slice(uri_bytes);
        instruction_data.extend_from_slice(&0u16.to_le_bytes()); // seller_fee_basis_points = 0
        instruction_data.push(0u8); // creators = None
        instruction_data.push(0u8); // collection = None
        instruction_data.push(0u8); // uses = None
        instruction_data.push(1u8); // is_mutable = true
        instruction_data.push(0u8); // collection_details = None

        invoke_signed(
            &Instruction {
                program_id: *meta.token_metadata_program.key,
                accounts: vec![
                    AccountMeta::new(*meta.metadata.key, false),
                    AccountMeta::new_readonly(*venture_token_mint_info.key, false),
                    AccountMeta::new_readonly(*venture_info.key, true),
                    AccountMeta::new(*founder_info.key, true),
                    AccountMeta::new_readonly(*founder_info.key, false),
                    AccountMeta::new_readonly(*system_program.key, false),
                    AccountMeta::new_readonly(*meta.rent.key, false),
                ],
                data: instruction_data,
            },
            &[
                meta.metadata.clone(),
                venture_token_mint_info.clone(),
                venture_info.clone(),
                founder_info.clone(),
                system_program.clone(),
                meta.rent.clone(),
                meta.token_metadata_program.clone(),
            ],
            &[&venture_seeds.seeds()],
        )?;
    }

    let master_lock_seeds = [SEED_MASTER_LOCK_VAULT, venture_key.as_ref(), &[bump_master_lock_vault]];
    token_utils::create_pda_token_account(
        founder_info,
        master_lock_vault_info,
        venture_token_mint_info,
        venture_info,
        system_program,
        token_program,
        &master_lock_seeds,
    )?;

    let legal_setup_seeds = [SEED_LEGAL_SETUP_VAULT, venture_key.as_ref(), &[bump_legal_setup_vault]];
    token_utils::create_pda_token_account(
        founder_info,
        legal_setup_vault_info,
        usdc_mint_info,
        venture_info,
        system_program,
        token_program,
        &legal_setup_seeds,
    )?;

    let vesting_vault_seeds = [SEED_VESTING_VAULT, venture_key.as_ref(), &[bump_vesting_vault]];
    token_utils::create_pda_token_account(
        founder_info,
        vesting_vault_info,
        venture_token_mint_info,
        venture_info,
        system_program,
        token_program,
        &vesting_vault_seeds,
    )?;

    let receipt_mint_seeds = [SEED_RECEIPT_MINT, round_key.as_ref(), &[bump_receipt_mint]];
    token_utils::create_pda_mint(
        founder_info,
        receipt_mint_info,
        funding_round_info,
        Some(funding_round_info),
        SHARE_DECIMALS,
        system_program,
        token_program,
        &receipt_mint_seeds,
    )?;

    let round_usdc_vault_seeds = [SEED_ROUND_USDC_VAULT, round_key.as_ref(), &[bump_round_usdc_vault]];
    token_utils::create_pda_token_account(
        founder_info,
        round_usdc_vault_info,
        usdc_mint_info,
        funding_round_info,
        system_program,
        token_program,
        &round_usdc_vault_seeds,
    )?;

    let founder_key = founder_info.key();
    let founder_vesting_seeds = [
        SEED_FOUNDER_VESTING,
        venture_key.as_ref(),
        founder_key.as_ref(),
        &[bump_founder_vesting],
    ];
    token_utils::create_pda_program_account(
        founder_info,
        founder_vesting_info,
        8 + FounderVesting::INIT_SPACE,
        &crate::ID,
        system_program,
        &founder_vesting_seeds,
    )?;

    let funding_round_seeds = [
        SEED_FUNDING_ROUND,
        venture_key.as_ref(),
        &[0u8],
        &[bump_funding_round],
    ];
    token_utils::create_pda_program_account(
        founder_info,
        funding_round_info,
        8 + FundingRound::INIT_SPACE,
        &crate::ID,
        system_program,
        &funding_round_seeds,
    )?;

    let verification_vote_seeds = [
        SEED_VERIFICATION_VOTE,
        round_key.as_ref(),
        &[bump_verification_vote],
    ];
    token_utils::create_pda_program_account(
        founder_info,
        verification_vote_info,
        8 + VentureVerificationVote::INIT_SPACE,
        &crate::ID,
        system_program,
        &verification_vote_seeds,
    )?;

    // ------------------------------------------- mint exactly 1,000,000 shares
    token_utils::mint_to(
        token_program,
        venture_token_mint_info,
        master_lock_vault_info,
        venture_info,
        &[&venture_seeds.seeds()],
        FIXED_TOTAL_SUPPLY,
    )?;
    // Revoke the mint authority forever: supply is immutable from here on.
    token::set_authority(
        CpiContext::new_with_signer(
            token_program.clone(),
            SetAuthority {
                current_authority: venture_info.clone(),
                account_or_mint: venture_token_mint_info.clone(),
            },
            &[&venture_seeds.seeds()],
        ),
        AuthorityType::MintTokens,
        None,
    )?;
    // Founder allocation moves into the vesting vault.
    token_utils::transfer(
        token_program,
        master_lock_vault_info,
        vesting_vault_info,
        venture_info,
        &[&venture_seeds.seeds()],
        params.founder_shares,
    )?;

    // ---------------------------------------------------------------- venture
    let venture = venture_state;
    venture.global_config = global_config_info.key();
    venture.founder = founder_info.key();
    venture.treasury_wallet = treasury_wallet_info.key();
    venture.venture_token_mint = mint_key;
    venture.usdc_mint = usdc_mint_info.key();
    venture.master_lock_vault = master_lock_vault_info.key();
    venture.legal_setup_vault = legal_setup_vault_info.key();
    venture.dividend_vault = Pubkey::default();
    venture.dlmm_custody = Pubkey::default();
    venture.meteora_dlmm_pool = Pubkey::default();
    venture.midao_llc_id = params.midao_llc_id;
    venture.legal_contract_hash = params.legal_contract_hash;
    venture.total_supply = FIXED_TOTAL_SUPPLY;
    venture.founder_vesting_tokens = params.founder_shares;
    venture.circulating_public_float = 0;
    venture.unredeemed_receipt_shares = 0;
    venture.total_staked_in_vaults = 0;
    venture.total_legal_fees_escrowed = 0;
    venture.total_legal_fees_released = 0;
    venture.acc_dividend_per_weight_unit = 0;
    venture.total_dividend_weight_units = 0;
    venture.total_dividends_distributed = 0;
    venture.current_round_index = 0;
    venture.is_round_active = false;
    venture.status = VentureStatus::GenesisInitialized;
    venture.bump = bump_venture;
    venture.master_lock_vault_bump = bump_master_lock_vault;
    venture.legal_setup_vault_bump = bump_legal_setup_vault;
    venture.dividend_vault_bump = 0;

    // ---------------------------------------------------------- founder vesting
    let vesting = FounderVesting {
        venture: venture_key,
        founder: founder_key,
        vesting_token_vault: vesting_vault_info.key(),
        total_allocated_tokens: params.founder_shares,
        total_claimed_tokens: 0,
        start_timestamp: now,
        cliff_duration_seconds: params.vesting_cliff_seconds,
        total_duration_seconds: params.vesting_duration_seconds,
        bump: bump_founder_vesting,
        vault_bump: bump_vesting_vault,
    };
    token_utils::write_pda_account(founder_vesting_info, &vesting)?;

    // ------------------------------------------------- round 0 + ballot (zeroed)
    let init = RoundInit {
        venture: venture_key,
        funding_round: round_key,
        receipt_mint: receipt_mint_info.key(),
        usdc_vault: round_usdc_vault_info.key(),
        verification_vote: verification_vote_info.key(),
        round_index: 0,
        bump: bump_funding_round,
        receipt_mint_bump: bump_receipt_mint,
        usdc_vault_bump: bump_round_usdc_vault,
        vote_bump: bump_verification_vote,
    };
    let (round, vote) = crate::instructions::shared::create_round(&init, &params.round_terms, &plan);
    token_utils::write_pda_account(funding_round_info, &round)?;
    token_utils::write_pda_account(verification_vote_info, &vote)?;

    emit!(VentureGenesisLaunched {
        venture: venture_key,
        founder: founder_info.key(),
        venture_token_mint: mint_key,
        midao_llc_id: params.midao_llc_id,
        legal_contract_hash: params.legal_contract_hash,
        total_supply: FIXED_TOTAL_SUPPLY,
        founder_shares: params.founder_shares,
        timestamp: now,
    });
    emit!(FundingRoundCreated {
        venture: venture_key,
        funding_round: init.funding_round,
        round_index: 0,
        price_per_share_usdc: params.round_terms.price_per_share_usdc,
        target_cap_usdc: params.round_terms.target_cap_usdc,
        shares_for_sale: plan.shares_for_sale,
        upfront_working_capital_bps: params.round_terms.upfront_working_capital_bps,
        timestamp: now,
    });
    Ok(())
}
