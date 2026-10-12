/**
 * VENTRION PROTOCOL SOLANA SDK BRIDGE
 * 
 * Program ID: vENT66Zyif8JMrb6GbkpwmRYhhYYgguZpfErJnrjEpY (Devnet)
 * Protocol Token: $VENT (5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ)
 * Devnet USDC Mint: 5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import ventrionProtocolIdl from "./idl.json";

// =============================================================================
// PROTOCOL CONSTANTS (STRICT TRUTH, LIVE SOLANA DEVNET)
// =============================================================================
export const VENTRION_PROGRAM_ID = new PublicKey(
  "vENT66Zyif8JMrb6GbkpwmRYhhYYgguZpfErJnrjEpY"
);
export const DEVNET_LEGACY_PROGRAM_ID = VENTRION_PROGRAM_ID;
export const VENT_TOKEN_MINT = new PublicKey(
  "5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ"
);
export const DEVNET_VENT_MINT = VENT_TOKEN_MINT;
export const DEVNET_USDC_MINT = new PublicKey(
  "5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt"
);

// Ventrion Protocol Native Venture
export const VENTRION_VENTURE_MINT = new PublicKey(
  "48X1XhQr7rSLKLQsmwUPyQ7snURtVcprFSWQV8x3YeDU"
);
export const VENTRION_VENTURE_PDA = new PublicKey(
  "FcLYBmNTL4qDoyRbVkn6ATSEtbLwprZLNbdnjAW8jDck"
);

// Apex Quantum
export const APEX_QUANTUM_MINT = new PublicKey(
  "C8UNEaZhDFxy4H8kdhwk3Y4zxDFpPfkLN1E5Hc6ypupJ"
);
export const APEX_QUANTUM_VENTURE_PDA = new PublicKey(
  "5n7DHyU8mT73UpftmemFxHK6jgba7FKiBbPZvan4C3Qn"
);
export const APEX_QUANTUM_MILESTONE_ESCROW_PDA = new PublicKey(
  "HQGn3cN7pke8g2CCon3M67GiWbAuNGqfQpvAa3wzVvtc"
);

// Solana BioDynamics
export const SBD_VENTURE_MINT = new PublicKey(
  "3VnWqQjw7T7YGSUVYYgrW6SZavMQ24u1FsrEzDvXwUYC"
);
export const SBD_VENTURE_PDA = new PublicKey(
  "91FMqn4zTLE2WZ1LT8MzPV4NiciAmHYUr3k5yFdu9WRy"
);

// Backward compatibility exports
export const PILOT_VENTURE_1_PVENT_MINT = VENTRION_VENTURE_MINT;
export const PILOT_VENTURE_2_QCMP_MINT = APEX_QUANTUM_MINT;
export const QCMP_METAPLEX_METADATA_PDA = new PublicKey("11111111111111111111111111111111");
export const QCMP_METEORA_DLMM_POOL = new PublicKey("11111111111111111111111111111111");

export const METAPLEX_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const IDL = ventrionProtocolIdl;

// =============================================================================
// SEED CONSTANTS
// =============================================================================
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
};

// =============================================================================
// PDA DERIVATIONS (TYPED FUNCTIONS)
// =============================================================================

/**
 * Derives the Global Config PDA
 */
export function getGlobalConfigPDA(
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.GLOBAL_CONFIG], programId);
}

/**
 * Derives the Venture State PDA from its mint
 */
export function getVenturePDA(
  ventureTokenMint: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.VENTURE, ventureTokenMint.toBuffer()],
    programId
  );
}

/**
 * Derives the Milestone Escrow PDA from the funding round
 */
export function getMilestonePDA(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MILESTONE_ESCROW, fundingRound.toBuffer()],
    programId
  );
}

/**
 * Derives Stake PDA:
 * - For a VENT staker position when given a user public key
 * - For an investor's staked position in a venture when given venture + investor
 */
export function getStakePDA(
  userOrVenture: PublicKey,
  optionalInvestor?: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  if (optionalInvestor) {
    return PublicKey.findProgramAddressSync(
      [SEEDS.INVESTOR_VAULT, userOrVenture.toBuffer(), optionalInvestor.toBuffer()],
      programId
    );
  }
  return PublicKey.findProgramAddressSync(
    [SEEDS.VENT_STAKE, userOrVenture.toBuffer()],
    programId
  );
}

/**
 * Derives Founder Vesting PDA
 */
export function getVestingPDA(
  venture: PublicKey,
  founder?: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  if (founder) {
    return PublicKey.findProgramAddressSync(
      [SEEDS.FOUNDER_VESTING, venture.toBuffer(), founder.toBuffer()],
      programId
    );
  }
  return PublicKey.findProgramAddressSync(
    [SEEDS.VESTING_VAULT, venture.toBuffer()],
    programId
  );
}

// ---------------- Helper PDAs ----------------
export function getFundingRoundPDA(
  venture: PublicKey,
  roundIndex: number = 0,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.FUNDING_ROUND, venture.toBuffer(), Buffer.from([roundIndex])],
    programId
  );
}

export function getReceiptMintPDA(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.RECEIPT_MINT, fundingRound.toBuffer()],
    programId
  );
}

export function getRoundUsdcVaultPDA(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ROUND_USDC_VAULT, fundingRound.toBuffer()],
    programId
  );
}

export function getRoundRecordPDA(
  fundingRound: PublicKey,
  investor: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ROUND_RECORD, fundingRound.toBuffer(), investor.toBuffer()],
    programId
  );
}

export function getVerificationVotePDA(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.VERIFICATION_VOTE, fundingRound.toBuffer()],
    programId
  );
}

export function getMasterLockVaultPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MASTER_LOCK_VAULT, venture.toBuffer()],
    programId
  );
}

export function getDividendVaultPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.DIVIDEND_VAULT, venture.toBuffer()],
    programId
  );
}

export function getStakedSharesVaultPDA(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.STAKED_SHARES_VAULT, venture.toBuffer()],
    programId
  );
}

export function getInvestorVaultPDA(
  venture: PublicKey,
  investor: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.INVESTOR_VAULT, venture.toBuffer(), investor.toBuffer()],
    programId
  );
}

export function getMilestoneUsdcVaultPDA(
  milestoneEscrow: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MILESTONE_USDC_VAULT, milestoneEscrow.toBuffer()],
    programId
  );
}

// =============================================================================
// TOKEN ATA UTILITIES
// =============================================================================
export function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
  programId: PublicKey = TOKEN_PROGRAM_ID,
  associatedTokenProgramId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    associatedTokenProgramId
  );
  return address;
}

export function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  programId: PublicKey = TOKEN_PROGRAM_ID,
  associatedTokenProgramId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: programId, isSigner: false, isWritable: false },
    ],
    programId: associatedTokenProgramId,
    data: Buffer.alloc(0),
  });
}

// =============================================================================
// INSTRUCTION DISCRIMINATORS (FROM ANCHOR IDL)
// =============================================================================
const DISCRIMINATORS = {
  contributeFundingRound: Buffer.from([79, 224, 117, 227, 87, 145, 130, 74]),
  redeemShares: Buffer.from([239, 154, 224, 89, 240, 196, 42, 187]),
  depositInvestorShares: Buffer.from([98, 43, 50, 47, 105, 177, 163, 200]),
  claimInvestorDividends: Buffer.from([60, 146, 219, 221, 107, 53, 220, 114]),
};

// =============================================================================
// TRANSACTION BUILDERS
// =============================================================================

/**
 * 1. buyFlatCurveShares: Invest in a venture during its active primary funding round.
 * 
 * @param connection Solana Connection
 * @param investor Investor wallet public key
 * @param ventureTokenMint Venture mint address or Venture PDA
 * @param amountUsdc Amount of USDC to invest (in base units / micro-USDC or parsed dollar amount)
 * @param roundIndex Funding round index (default: 0)
 */
export async function buyFlatCurveShares(
  connection: Connection,
  investor: PublicKey,
  ventureTokenMint: PublicKey,
  amountUsdc: number | bigint,
  roundIndex: number = 0,
  usdcMint: PublicKey = DEVNET_USDC_MINT
): Promise<Transaction> {
  const [globalConfig] = getGlobalConfigPDA();
  const [venture] = getVenturePDA(ventureTokenMint);
  const [fundingRound] = getFundingRoundPDA(venture, roundIndex);
  const [verificationVote] = getVerificationVotePDA(fundingRound);
  const [roundRecord] = getRoundRecordPDA(fundingRound, investor);
  const [receiptMint] = getReceiptMintPDA(fundingRound);
  const [fundingRoundUsdcVault] = getRoundUsdcVaultPDA(fundingRound);

  const investorUsdcAta = getAssociatedTokenAddressSync(usdcMint, investor);
  const investorReceiptAta = getAssociatedTokenAddressSync(receiptMint, investor);

  const tx = new Transaction();

  // Ensure investor has their receipt ATA created
  const receiptAtaInfo = await connection.getAccountInfo(investorReceiptAta);
  if (!receiptAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        investor,
        investorReceiptAta,
        investor,
        receiptMint
      )
    );
  }

  // Instruction Data: Discriminator (8) + u64 amount (8)
  const data = Buffer.alloc(16);
  DISCRIMINATORS.contributeFundingRound.copy(data, 0);
  const rawAmount = typeof amountUsdc === "bigint" ? amountUsdc : BigInt(Math.floor(amountUsdc));
  data.writeBigUInt64LE(rawAmount, 8);

  const ix = new TransactionInstruction({
    programId: VENTRION_PROGRAM_ID,
    keys: [
      { pubkey: investor, isSigner: true, isWritable: true },
      { pubkey: globalConfig, isSigner: false, isWritable: false },
      { pubkey: venture, isSigner: false, isWritable: true },
      { pubkey: fundingRound, isSigner: false, isWritable: true },
      { pubkey: verificationVote, isSigner: false, isWritable: true },
      { pubkey: roundRecord, isSigner: false, isWritable: true },
      { pubkey: receiptMint, isSigner: false, isWritable: true },
      { pubkey: investorReceiptAccountAta(investorReceiptAta), isSigner: false, isWritable: true },
      { pubkey: investorUsdcAta, isSigner: false, isWritable: true },
      { pubkey: fundingRoundUsdcVault, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  tx.add(ix);
  tx.feePayer = investor;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return tx;
}

function investorReceiptAccountAta(ata: PublicKey): PublicKey {
  return ata;
}

/**
 * 2. redeemShares: Burn receipt tokens 1:1 for common venture shares post-graduation.
 * 
 * @param connection Solana Connection
 * @param investor Investor wallet public key
 * @param ventureTokenMint Venture token mint
 * @param sharesAmount Number of receipt shares to redeem (in base units)
 * @param roundIndex Funding round index (default: 0)
 */
export async function redeemShares(
  connection: Connection,
  investor: PublicKey,
  ventureTokenMint: PublicKey,
  sharesAmount: number | bigint,
  roundIndex: number = 0
): Promise<Transaction> {
  const [venture] = getVenturePDA(ventureTokenMint);
  const [fundingRound] = getFundingRoundPDA(venture, roundIndex);
  const [roundRecord] = getRoundRecordPDA(fundingRound, investor);
  const [receiptMint] = getReceiptMintPDA(fundingRound);
  const [masterLockVault] = getMasterLockVaultPDA(venture);

  const investorReceiptAta = getAssociatedTokenAddressSync(receiptMint, investor);
  const investorShareAta = getAssociatedTokenAddressSync(ventureTokenMint, investor);

  const tx = new Transaction();

  // Ensure investor has their venture share ATA created
  const shareAtaInfo = await connection.getAccountInfo(investorShareAta);
  if (!shareAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        investor,
        investorShareAta,
        investor,
        ventureTokenMint
      )
    );
  }

  // Instruction Data: Discriminator (8) + u64 amount (8)
  const data = Buffer.alloc(16);
  DISCRIMINATORS.redeemShares.copy(data, 0);
  const rawAmount = typeof sharesAmount === "bigint" ? sharesAmount : BigInt(Math.floor(sharesAmount));
  data.writeBigUInt64LE(rawAmount, 8);

  const ix = new TransactionInstruction({
    programId: VENTRION_PROGRAM_ID,
    keys: [
      { pubkey: investor, isSigner: true, isWritable: true },
      { pubkey: venture, isSigner: false, isWritable: true },
      { pubkey: fundingRound, isSigner: false, isWritable: true },
      { pubkey: roundRecord, isSigner: false, isWritable: true },
      { pubkey: receiptMint, isSigner: false, isWritable: true },
      { pubkey: investorReceiptAta, isSigner: false, isWritable: true },
      { pubkey: masterLockVault, isSigner: false, isWritable: true },
      { pubkey: investorShareAta, isSigner: false, isWritable: true },
      { pubkey: ventureTokenMint, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  tx.add(ix);
  tx.feePayer = investor;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return tx;
}

/**
 * 3. depositInvestorShares: Stake venture shares into the O(1) dividend pool with lock duration.
 * 
 * @param connection Solana Connection
 * @param investor Investor wallet public key
 * @param ventureTokenMint Venture token mint
 * @param shares Number of shares to stake (in base units)
 * @param lockDays Lock duration in days (0 for flex 1.0x, 180 for 1.5x, 365 for 2.0x)
 */
export async function depositInvestorShares(
  connection: Connection,
  investor: PublicKey,
  ventureTokenMint: PublicKey,
  shares: number | bigint,
  lockDays: number = 0
): Promise<Transaction> {
  const [venture] = getVenturePDA(ventureTokenMint);
  const [investorVault] = getInvestorVaultPDA(venture, investor);
  const [stakedSharesVault] = getStakedSharesVaultPDA(venture);

  const investorShareAta = getAssociatedTokenAddressSync(ventureTokenMint, investor);

  const tx = new Transaction();

  // Instruction Data: Discriminator (8) + u64 amount (8) + i64 lock_duration_seconds (8)
  const data = Buffer.alloc(24);
  DISCRIMINATORS.depositInvestorShares.copy(data, 0);
  const rawShares = typeof shares === "bigint" ? shares : BigInt(Math.floor(shares));
  data.writeBigUInt64LE(rawShares, 8);
  const lockSeconds = BigInt(Math.floor(lockDays * 86400));
  data.writeBigInt64LE(lockSeconds, 16);

  const ix = new TransactionInstruction({
    programId: VENTRION_PROGRAM_ID,
    keys: [
      { pubkey: investor, isSigner: true, isWritable: true },
      { pubkey: venture, isSigner: false, isWritable: true },
      { pubkey: investorVault, isSigner: false, isWritable: true },
      { pubkey: investorShareAta, isSigner: false, isWritable: true },
      { pubkey: stakedSharesVault, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  tx.add(ix);
  tx.feePayer = investor;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return tx;
}

/**
 * 4. claimInvestorDividends: Claim accumulated USDC dividends from the venture dividend vault.
 * 
 * @param connection Solana Connection
 * @param investor Investor wallet public key
 * @param ventureTokenMint Venture token mint
 * @param usdcMint USDC Mint address (default: devnet USDC)
 */
export async function claimInvestorDividends(
  connection: Connection,
  investor: PublicKey,
  ventureTokenMint: PublicKey,
  usdcMint: PublicKey = DEVNET_USDC_MINT
): Promise<Transaction> {
  const [venture] = getVenturePDA(ventureTokenMint);
  const [investorVault] = getInvestorVaultPDA(venture, investor);
  const [dividendVault] = getDividendVaultPDA(venture);

  const investorUsdcAta = getAssociatedTokenAddressSync(usdcMint, investor);

  const tx = new Transaction();

  // Ensure investor has their USDC ATA created
  const usdcAtaInfo = await connection.getAccountInfo(investorUsdcAta);
  if (!usdcAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        investor,
        investorUsdcAta,
        investor,
        usdcMint
      )
    );
  }

  // Instruction Data: Discriminator (8) - no args
  const data = Buffer.alloc(8);
  DISCRIMINATORS.claimInvestorDividends.copy(data, 0);

  const ix = new TransactionInstruction({
    programId: VENTRION_PROGRAM_ID,
    keys: [
      { pubkey: investor, isSigner: true, isWritable: false },
      { pubkey: venture, isSigner: false, isWritable: true },
      { pubkey: investorVault, isSigner: false, isWritable: true },
      { pubkey: dividendVault, isSigner: false, isWritable: true },
      { pubkey: investorUsdcAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });

  tx.add(ix);
  tx.feePayer = investor;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return tx;
}

// Re-export all PDA derivations and seeds
export * from "./pdas";
