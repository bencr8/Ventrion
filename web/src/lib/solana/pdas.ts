import { PublicKey } from "@solana/web3.js";
import { VENTRION_PROGRAM_ID } from "./ventrionProgram";

/**
 * VENTRION PROTOCOL SEED CONSTANTS & PDA DERIVATION SUITE
 * 
 * Strict On-Chain Protocol Seeds according to Anchor IDL and VENTRION_MAIN_MANIFEST.md
 * Program ID: 37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8
 */

export const PROTOCOL_SEEDS = {
  GLOBAL_CONFIG: Buffer.from("global_config"),
  VENTURE: Buffer.from("venture"),
  FUNDING_ROUND: Buffer.from("funding_round"),
  MILESTONE: Buffer.from("milestone"),
  MILESTONE_ESCROW: Buffer.from("milestone_escrow"),
  STAKING_POOL: Buffer.from("staking_pool"),
  FOUNDER_LOCK: Buffer.from("founder_lock"),
  FOUNDER_VESTING: Buffer.from("founder_vesting"),
  MASTER_LOCK_VAULT: Buffer.from("master_lock_vault"),
  LEGAL_SETUP_VAULT: Buffer.from("legal_setup_vault"),
  DIVIDEND_VAULT: Buffer.from("dividend_vault"),
  STAKED_SHARES_VAULT: Buffer.from("staked_shares_vault"),
  INVESTOR_VAULT: Buffer.from("investor_vault"),
  RECEIPT_MINT: Buffer.from("receipt_mint"),
  ROUND_USDC_VAULT: Buffer.from("round_usdc_vault"),
  ROUND_RECORD: Buffer.from("round_record"),
  INVESTOR_RECORD: Buffer.from("investor_record"),
  VERIFICATION_VOTE: Buffer.from("verification_vote"),
  MILESTONE_USDC_VAULT: Buffer.from("milestone_usdc_vault"),
  DLMM_CUSTODY: Buffer.from("dlmm_custody"),
} as const;

/**
 * 1. Global Config PDA: [b"global_config"]
 */
export function getGlobalConfigPDA(
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([PROTOCOL_SEEDS.GLOBAL_CONFIG], programId);
}

/**
 * 2. Venture State PDA: [b"venture", company_mint.key().as_ref()]
 */
export function getVenturePDA(
  companyMint: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.VENTURE, companyMint.toBuffer()],
    programId
  );
}

/**
 * 3. Funding Round PDA: [b"funding_round", venture.key().as_ref(), round_id.to_le_bytes()]
 */
export function getFundingRoundPDA(
  venture: PublicKey,
  roundId: number = 0,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.FUNDING_ROUND, venture.toBuffer(), Buffer.from([roundId])],
    programId
  );
}

/**
 * 4. Milestone Escrow PDA:
 * Supports [b"milestone_escrow", funding_round.key().as_ref()] (IDL layout)
 * or [b"milestone", funding_round.key().as_ref(), milestone_id.to_le_bytes()]
 */
export function getMilestoneEscrowPDA(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.MILESTONE_ESCROW, fundingRound.toBuffer()],
    programId
  );
}

export function getMilestonePDA(
  fundingRound: PublicKey,
  milestoneId?: number,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  if (milestoneId !== undefined) {
    return PublicKey.findProgramAddressSync(
      [PROTOCOL_SEEDS.MILESTONE, fundingRound.toBuffer(), Buffer.from([milestoneId])],
      programId
    );
  }
  return getMilestoneEscrowPDA(fundingRound, programId);
}

/**
 * 5. Dividend Pool / Staking Pool PDA:
 * [b"staking_pool", venture.key().as_ref()] or [b"dividend_vault", venture.key().as_ref()]
 */
export function getStakingPoolPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.STAKING_POOL, venture.toBuffer()],
    programId
  );
}

export function getDividendVaultPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.DIVIDEND_VAULT, venture.toBuffer()],
    programId
  );
}

/**
 * 6. Founder Lock / Vesting PDA:
 * [b"founder_lock", venture.key().as_ref()] or [b"founder_vesting", venture.key().as_ref(), founder.key().as_ref()]
 */
export function getFounderLockPDA(
  venture: PublicKey,
  founder?: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  if (founder) {
    return PublicKey.findProgramAddressSync(
      [PROTOCOL_SEEDS.FOUNDER_VESTING, venture.toBuffer(), founder.toBuffer()],
      programId
    );
  }
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.FOUNDER_LOCK, venture.toBuffer()],
    programId
  );
}

/**
 * 7. Master Lock Vault PDA: [b"master_lock_vault", venture.key().as_ref()]
 */
export function getMasterLockVaultPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.MASTER_LOCK_VAULT, venture.toBuffer()],
    programId
  );
}

/**
 * 8. Investor Staking Vault PDA: [b"investor_vault", venture.key().as_ref(), investor.key().as_ref()]
 */
export function getInvestorVaultPDA(
  venture: PublicKey,
  investor: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.INVESTOR_VAULT, venture.toBuffer(), investor.toBuffer()],
    programId
  );
}

/**
 * 9. Receipt Mint PDA: [b"receipt_mint", funding_round.key().as_ref()]
 */
export function getReceiptMintPDA(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.RECEIPT_MINT, fundingRound.toBuffer()],
    programId
  );
}

/**
 * 10. Milestone USDC Vault PDA: [b"milestone_usdc_vault", milestone_escrow.key().as_ref()]
 */
export function getMilestoneUsdcVaultPDA(
  milestoneEscrow: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.MILESTONE_USDC_VAULT, milestoneEscrow.toBuffer()],
    programId
  );
}

/**
 * 11. DLMM Custody PDA: [b"dlmm_custody", venture.key().as_ref()]
 */
export function getDlmmCustodyPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.DLMM_CUSTODY, venture.toBuffer()],
    programId
  );
}

/**
 * 12. Legal Setup Vault PDA: [b"legal_setup_vault", venture.key().as_ref()]
 */
export function getLegalSetupVaultPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEEDS.LEGAL_SETUP_VAULT, venture.toBuffer()],
    programId
  );
}
