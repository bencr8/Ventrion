import { PublicKey } from "@solana/web3.js";

/** Canonical Ventrion Protocol Program ID on Solana Devnet */
export const VENTRION_PROGRAM_ID = new PublicKey(
  "37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8"
);

/** Canonical Meteora DLMM v2 Program ID */
export const METEORA_DLMM_PROGRAM_ID = new PublicKey(
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
);

/** Metaplex Token Metadata Program ID */
export const METAPLEX_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

/** Devnet Mother-Token ($VENT) Mint */
export const DEVNET_VENT_MINT = new PublicKey(
  "5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ"
);

/** Devnet Settlement USDC Mint */
export const DEVNET_USDC_MINT = new PublicKey(
  "5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt"
);

/** Mainnet Canonical USDC Mint */
export const MAINNET_USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

/** Exactly 1,000,000 common shares */
export const TOTAL_SHARES = 1_000_000;
export const SHARE_DECIMALS = 6;
export const USDC_DECIMALS = 6;

/** PDA Seed Constants */
export const SEEDS = {
  GLOBAL_CONFIG: Buffer.from("global_config"),
  VENT_STAKE_VAULT: Buffer.from("vent_stake_vault"),
  VENT_STAKE: Buffer.from("vent_stake"),
  VENTURE: Buffer.from("venture"),
  MASTER_LOCK_VAULT: Buffer.from("master_lock_vault"),
  LEGAL_SETUP_VAULT: Buffer.from("legal_setup_vault"),
  DIVIDEND_VAULT: Buffer.from("dividend_vault"),
  STAKED_SHARES_VAULT: Buffer.from("staked_shares_vault"),
  FOUNDER_VESTING: Buffer.from("founder_vesting"),
  VESTING_VAULT: Buffer.from("vesting_vault"),
  FUNDING_ROUND: Buffer.from("funding_round"),
  RECEIPT_MINT: Buffer.from("receipt_mint"),
  ROUND_USDC_VAULT: Buffer.from("round_usdc_vault"),
  ROUND_RECORD: Buffer.from("round_record"),
  VERIFICATION_VOTE: Buffer.from("verification_vote"),
  STAKER_VOTE: Buffer.from("staker_vote"),
  MILESTONE_ESCROW: Buffer.from("milestone_escrow"),
  MILESTONE_USDC_VAULT: Buffer.from("milestone_usdc_vault"),
  INVESTOR_VAULT: Buffer.from("investor_vault"),
  DLMM_CUSTODY: Buffer.from("dlmm_custody"),
  CUSTODY_USDC: Buffer.from("custody_usdc"),
  CUSTODY_SHARES: Buffer.from("custody_shares"),
  DLMM_POSITION: Buffer.from("dlmm_position"),
} as const;
