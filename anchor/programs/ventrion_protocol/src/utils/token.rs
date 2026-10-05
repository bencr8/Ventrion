//! Thin, explicit wrappers around SPL Token CPIs.
//!
//! Every helper takes the authority's signer seeds (empty slice = user signature),
//! so call sites read as one line and never forget the PDA signer.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self, program_pack::Pack};
use anchor_lang::Discriminator;
use anchor_spl::token::{self, Burn, FreezeAccount, MintTo, ThawAccount, Transfer};

pub fn transfer<'info>(
    token_program: &AccountInfo<'info>,
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    token::transfer(
        CpiContext::new_with_signer(
            token_program.clone(),
            Transfer {
                from: from.clone(),
                to: to.clone(),
                authority: authority.clone(),
            },
            signer_seeds,
        ),
        amount,
    )
}

pub fn mint_to<'info>(
    token_program: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    token::mint_to(
        CpiContext::new_with_signer(
            token_program.clone(),
            MintTo {
                mint: mint.clone(),
                to: to.clone(),
                authority: authority.clone(),
            },
            signer_seeds,
        ),
        amount,
    )
}

pub fn burn<'info>(
    token_program: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    from: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    token::burn(
        CpiContext::new_with_signer(
            token_program.clone(),
            Burn {
                mint: mint.clone(),
                from: from.clone(),
                authority: authority.clone(),
            },
            signer_seeds,
        ),
        amount,
    )
}

pub fn freeze<'info>(
    token_program: &AccountInfo<'info>,
    account: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    freeze_authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    token::freeze_account(CpiContext::new_with_signer(
        token_program.clone(),
        FreezeAccount {
            account: account.clone(),
            mint: mint.clone(),
            authority: freeze_authority.clone(),
        },
        signer_seeds,
    ))
}

pub fn thaw<'info>(
    token_program: &AccountInfo<'info>,
    account: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    freeze_authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    token::thaw_account(CpiContext::new_with_signer(
        token_program.clone(),
        ThawAccount {
            account: account.clone(),
            mint: mint.clone(),
            authority: freeze_authority.clone(),
        },
        signer_seeds,
    ))
}

#[inline(never)]
pub fn create_mint_account<'info>(
    payer: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    freeze_authority: Option<&AccountInfo<'info>>,
    decimals: u8,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
) -> Result<()> {
    let rent = Rent::get()?;
    let space = anchor_spl::token::spl_token::state::Mint::LEN;
    let lamports = rent.minimum_balance(space);
    solana_program::program::invoke(
        &solana_program::system_instruction::create_account(
            payer.key,
            mint.key,
            lamports,
            space as u64,
            token_program.key,
        ),
        &[payer.clone(), mint.clone(), system_program.clone()],
    )?;
    solana_program::program::invoke(
        &anchor_spl::token::spl_token::instruction::initialize_mint2(
            token_program.key,
            mint.key,
            authority.key,
            freeze_authority.map(|a| a.key),
            decimals,
        )?,
        &[mint.clone(), token_program.clone()],
    )?;
    Ok(())
}

#[inline(never)]
pub fn create_pda_mint<'info>(
    payer: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    freeze_authority: Option<&AccountInfo<'info>>,
    decimals: u8,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    let rent = Rent::get()?;
    let space = anchor_spl::token::spl_token::state::Mint::LEN;
    let lamports = rent.minimum_balance(space);
    solana_program::program::invoke_signed(
        &solana_program::system_instruction::create_account(
            payer.key,
            mint.key,
            lamports,
            space as u64,
            token_program.key,
        ),
        &[payer.clone(), mint.clone(), system_program.clone()],
        &[signer_seeds],
    )?;
    solana_program::program::invoke(
        &anchor_spl::token::spl_token::instruction::initialize_mint2(
            token_program.key,
            mint.key,
            authority.key,
            freeze_authority.map(|a| a.key),
            decimals,
        )?,
        &[mint.clone(), token_program.clone()],
    )?;
    Ok(())
}

#[inline(never)]
pub fn create_pda_token_account<'info>(
    payer: &AccountInfo<'info>,
    token_account: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    let rent = Rent::get()?;
    let space = anchor_spl::token::spl_token::state::Account::LEN;
    let lamports = rent.minimum_balance(space);
    solana_program::program::invoke_signed(
        &solana_program::system_instruction::create_account(
            payer.key,
            token_account.key,
            lamports,
            space as u64,
            token_program.key,
        ),
        &[payer.clone(), token_account.clone(), system_program.clone()],
        &[signer_seeds],
    )?;
    solana_program::program::invoke(
        &anchor_spl::token::spl_token::instruction::initialize_account3(
            token_program.key,
            token_account.key,
            mint.key,
            authority.key,
        )?,
        &[token_account.clone(), mint.clone(), token_program.clone()],
    )?;
    Ok(())
}

#[inline(never)]
pub fn create_pda_token_account_if_needed<'info>(
    payer: &AccountInfo<'info>,
    token_account: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    if token_account.owner == &solana_program::system_program::ID && token_account.data_is_empty() {
        create_pda_token_account(
            payer,
            token_account,
            mint,
            authority,
            system_program,
            token_program,
            signer_seeds,
        )?;
    }
    Ok(())
}

#[inline(never)]
pub fn create_pda_program_account<'info>(
    payer: &AccountInfo<'info>,
    account: &AccountInfo<'info>,
    space: usize,
    program_id: &Pubkey,
    system_program: &AccountInfo<'info>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);
    solana_program::program::invoke_signed(
        &solana_program::system_instruction::create_account(
            payer.key,
            account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[payer.clone(), account.clone(), system_program.clone()],
        &[signer_seeds],
    )?;
    Ok(())
}

#[inline(never)]
pub fn write_pda_account<T: AnchorSerialize + Discriminator>(
    account: &AccountInfo,
    value: &T,
) -> Result<()> {
    let mut data = account.try_borrow_mut_data()?;
    let mut slice: &mut [u8] = &mut data;
    T::DISCRIMINATOR.serialize(&mut slice)?;
    value.serialize(&mut slice)?;
    Ok(())
}

#[inline(never)]
pub fn create_ata_if_needed<'info>(
    payer: &AccountInfo<'info>,
    ata: &AccountInfo<'info>,
    wallet: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
) -> Result<()> {
    if ata.owner == &solana_program::system_program::ID && ata.data_is_empty() {
        solana_program::program::invoke(
            &anchor_spl::associated_token::spl_associated_token_account::instruction::create_associated_token_account(
                payer.key,
                wallet.key,
                mint.key,
                token_program.key,
            ),
            &[
                payer.clone(),
                ata.clone(),
                wallet.clone(),
                mint.clone(),
                system_program.clone(),
                token_program.clone(),
            ],
        )?;
    }
    Ok(())
}
