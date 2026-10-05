use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::VentrionError;
use crate::events::{GlobalConfigInitialized, GlobalConfigUpdated, LegalSetupFeeReleased};
use crate::program::VentrionProtocol;
use crate::state::{GlobalConfig, VentureState};
use crate::utils::{math, meteora, token};

/// Mutable protocol parameters.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct GlobalConfigParams {
    pub fee_treasury: Pubkey,
    pub legal_setup_authority: Pubkey,
    pub min_approval_bps: u16,
    pub verification_quorum_bps: u16,
    pub protocol_fee_bps: u16,
}

impl GlobalConfigParams {
    fn validate(&self) -> Result<()> {
        require!(
            self.min_approval_bps >= MIN_APPROVAL_BPS_FLOOR
                && (self.min_approval_bps as u64) < BPS_DENOMINATOR,
            VentrionError::InvalidParameter
        );
        require!(self.verification_quorum_bps <= MAX_QUORUM_BPS, VentrionError::InvalidParameter);
        require!(self.protocol_fee_bps <= MAX_PROTOCOL_FEE_BPS, VentrionError::InvalidParameter);
        require!(
            self.fee_treasury != Pubkey::default() && self.legal_setup_authority != Pubkey::default(),
            VentrionError::InvalidParameter
        );
        Ok(())
    }

    fn apply(&self, config: &mut GlobalConfig) {
        config.fee_treasury = self.fee_treasury;
        config.legal_setup_authority = self.legal_setup_authority;
        config.min_approval_bps = self.min_approval_bps;
        config.verification_quorum_bps = self.verification_quorum_bps;
        config.protocol_fee_bps = self.protocol_fee_bps;
    }
}

/// Validates that `preset` is a live DLMM `PresetParameter2` account.
fn validate_preset(preset: &AccountInfo) -> Result<()> {
    let view = meteora::read_preset_parameter2(preset)?;
    require!(view.bin_step > 0, VentrionError::InvalidMeteoraAccount);
    Ok(())
}

// -----------------------------------------------------------------------------
// initialize_global_config
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeGlobalConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [SEED_GLOBAL_CONFIG],
        bump
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(mint::decimals = USDC_DECIMALS)]
    pub usdc_mint: Box<Account<'info, Mint>>,

    pub vent_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        seeds = [SEED_VENT_STAKE_VAULT],
        bump,
        token::mint = vent_mint,
        token::authority = global_config
    )]
    pub vent_stake_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: validated as a Meteora DLMM `PresetParameter2` (owner + discriminator).
    pub dlmm_preset_parameter: UncheckedAccount<'info>,

    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ VentrionError::Unauthorized)]
    pub program: Program<'info, VentrionProtocol>,

    /// Only the program upgrade authority may bootstrap the protocol.
    #[account(constraint = program_data.upgrade_authority_address == Some(admin.key()) @ VentrionError::Unauthorized)]
    pub program_data: Box<Account<'info, ProgramData>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_global_config(
    ctx: Context<InitializeGlobalConfig>,
    params: GlobalConfigParams,
) -> Result<()> {
    params.validate()?;
    #[cfg(feature = "mainnet")]
    require_keys_eq!(ctx.accounts.usdc_mint.key(), CANONICAL_USDC_MINT, VentrionError::InvalidUsdcMint);
    validate_preset(&ctx.accounts.dlmm_preset_parameter)?;

    let config = &mut ctx.accounts.global_config;
    config.admin = ctx.accounts.admin.key();
    config.usdc_mint = ctx.accounts.usdc_mint.key();
    config.vent_mint = ctx.accounts.vent_mint.key();
    config.vent_stake_vault = ctx.accounts.vent_stake_vault.key();
    config.dlmm_preset_parameter = ctx.accounts.dlmm_preset_parameter.key();
    config.total_vent_staked = 0;
    config.bump = ctx.bumps.global_config;
    config.vent_stake_vault_bump = ctx.bumps.vent_stake_vault;
    params.apply(config);

    emit!(GlobalConfigInitialized {
        admin: config.admin,
        usdc_mint: config.usdc_mint,
        vent_mint: config.vent_mint,
        dlmm_preset_parameter: config.dlmm_preset_parameter,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// update_global_config
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct UpdateGlobalConfig<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump,
        has_one = admin @ VentrionError::Unauthorized
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// CHECK: validated as a Meteora DLMM `PresetParameter2`; applies to pools created afterwards.
    pub dlmm_preset_parameter: UncheckedAccount<'info>,
}

pub fn handle_update_global_config(
    ctx: Context<UpdateGlobalConfig>,
    new_admin: Pubkey,
    params: GlobalConfigParams,
) -> Result<()> {
    params.validate()?;
    require!(new_admin != Pubkey::default(), VentrionError::InvalidParameter);
    validate_preset(&ctx.accounts.dlmm_preset_parameter)?;

    let config = &mut ctx.accounts.global_config;
    config.admin = new_admin;
    config.dlmm_preset_parameter = ctx.accounts.dlmm_preset_parameter.key();
    params.apply(config);

    emit!(GlobalConfigUpdated {
        admin: config.admin,
        dlmm_preset_parameter: config.dlmm_preset_parameter,
        min_approval_bps: config.min_approval_bps,
        verification_quorum_bps: config.verification_quorum_bps,
        protocol_fee_bps: config.protocol_fee_bps,
    });
    Ok(())
}

// -----------------------------------------------------------------------------
// release_legal_setup_fee
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct ReleaseLegalSetupFee<'info> {
    pub legal_setup_authority: Signer<'info>,

    #[account(
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump,
        has_one = legal_setup_authority @ VentrionError::Unauthorized
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [SEED_VENTURE, venture.venture_token_mint.as_ref()],
        bump = venture.bump,
        has_one = legal_setup_vault @ VentrionError::InvalidTokenAccount,
        has_one = global_config @ VentrionError::Unauthorized
    )]
    pub venture: Box<Account<'info, VentureState>>,

    #[account(mut)]
    pub legal_setup_vault: Box<Account<'info, TokenAccount>>,

    /// USDC account of the legal service provider (e.g. MIDAO).
    #[account(mut, token::mint = global_config.usdc_mint)]
    pub destination: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_release_legal_setup_fee(ctx: Context<ReleaseLegalSetupFee>, amount: u64) -> Result<()> {
    require!(amount > 0, VentrionError::ZeroAmount);
    require!(
        ctx.accounts.legal_setup_vault.amount >= amount,
        VentrionError::InsufficientLegalVaultBalance
    );

    let mint_key = ctx.accounts.venture.venture_token_mint;
    let bump = [ctx.accounts.venture.bump];
    let seeds: &[&[u8]] = &[SEED_VENTURE, mint_key.as_ref(), &bump];
    token::transfer(
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.legal_setup_vault.to_account_info(),
        &ctx.accounts.destination.to_account_info(),
        &ctx.accounts.venture.to_account_info(),
        &[seeds],
        amount,
    )?;

    let venture = &mut ctx.accounts.venture;
    venture.total_legal_fees_released = math::add(venture.total_legal_fees_released, amount)?;

    emit!(LegalSetupFeeReleased {
        venture: venture.key(),
        destination: ctx.accounts.destination.key(),
        amount,
    });
    Ok(())
}
