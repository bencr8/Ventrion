import { PublicKey, Connection } from "@solana/web3.js";
import { TOTAL_SHARES, QUORUM_VOTES_REQUIRED, DEFAULT_VENTURE } from "./constants";
import ventrionProtocolIdl from "./idl/ventrion_protocol.json";

// =============================================================================
// PROGRAM CONSTANTS & CANONICAL PROGRAM ID
// =============================================================================
export const VENTRION_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_VENTRION_PROGRAM_ID || "37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8"
);

export const VENTRION_PROTOCOL_IDL = ventrionProtocolIdl;
export const VENTRION_ALPHA_IDL = ventrionProtocolIdl; // Backward-compatibility alias

export const METEORA_DLMM_PROGRAM_ID = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
export const METEORA_DBC_PROGRAM_ID = new PublicKey("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN");
export const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const SEEDS = {
  GLOBAL_CONFIG: Buffer.from("global_config"),
  PROTOCOL_FEE_VAULT: Buffer.from("protocol_fee_vault"),
  STAKING_POOL: Buffer.from("staking_pool"),
  STAKE_RECEIPT: Buffer.from("stake_receipt"),
  VENTURE: Buffer.from("venture"),
  MASTER_LOCK_VAULT: Buffer.from("master_lock_vault"),
  LOCAL_DIVIDEND_VAULT: Buffer.from("local_dividend_vault"),
  DLMM_CUSTODY: Buffer.from("dlmm_custody"),
  FOUNDER_LOCK: Buffer.from("founder_lock"),
  FOUNDER_VESTING: Buffer.from("founder_vesting"),
  HOLDER_LOCK: Buffer.from("holder_lock"),
  FUNDING_ROUND: Buffer.from("funding_round"),
  ROUND_TOKEN_ESCROW: Buffer.from("round_token_escrow"),
  ROUND_USDC_ESCROW: Buffer.from("round_usdc_escrow"),
  MILESTONE_ESCROW: Buffer.from("milestone_escrow"),
  MILESTONE_USDC_VAULT: Buffer.from("milestone_usdc_vault"),
  PRIMARY_BACKER: Buffer.from("primary_backer"),
  ROUND_RECORD: Buffer.from("round_record"),
  SHAREHOLDER_RECEIPT: Buffer.from("shareholder"),
  INVESTOR_VAULT: Buffer.from("investor_vault"),
  ROUND_VAULT: Buffer.from("round_vault"),
  VERIFICATION_VOTE: Buffer.from("verification_vote"),
  STAKER_VERIFICATION_VOTE: Buffer.from("staker_verification_vote"),
  LEGAL_SETUP_VAULT: Buffer.from("legal_setup_vault"),
  RECEIPT_MINT: Buffer.from("receipt_mint"),
};

// =============================================================================
// PDA DERIVATION HELPERS
// =============================================================================

export function getGlobalConfigPda(programId: PublicKey = VENTRION_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.GLOBAL_CONFIG], programId);
}

export function getProtocolFeeVaultPda(
  globalConfigPda: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.PROTOCOL_FEE_VAULT, globalConfigPda.toBuffer()], programId);
}

export function getStakingPoolPda(
  ventMint: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.STAKING_POOL, ventMint.toBuffer()], programId);
}

export function getStakeReceiptPda(
  stakingPool: PublicKey,
  user: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.STAKE_RECEIPT, stakingPool.toBuffer(), user.toBuffer()], programId);
}

export function getVenturePda(
  ventureTokenMint: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.VENTURE, ventureTokenMint.toBuffer()], programId);
}

export function getMasterLockVaultPda(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.MASTER_LOCK_VAULT, venture.toBuffer()], programId);
}

export function getLocalDividendVaultPda(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.LOCAL_DIVIDEND_VAULT, venture.toBuffer()], programId);
}

export function getDlmmCustodyPda(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.DLMM_CUSTODY, venture.toBuffer()], programId);
}

export function getFounderLockPda(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.FOUNDER_LOCK, venture.toBuffer()], programId);
}

export function getFounderVestingPda(
  venture: PublicKey,
  founder: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.FOUNDER_VESTING, venture.toBuffer(), founder.toBuffer()],
    programId
  );
}

export function getRoundRecordPda(
  fundingRound: PublicKey,
  investor: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ROUND_RECORD, fundingRound.toBuffer(), investor.toBuffer()],
    programId
  );
}

export function getVerificationVotePda(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.VERIFICATION_VOTE, venture.toBuffer()], programId);
}

export function getStakerVotingRecordPda(
  venture: PublicKey,
  staker: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.STAKER_VERIFICATION_VOTE, venture.toBuffer(), staker.toBuffer()],
    programId
  );
}

export function getLegalSetupVaultPda(
  venture: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.LEGAL_SETUP_VAULT, venture.toBuffer()], programId);
}

export function getMeteoraLbPairPda(
  tokenA: PublicKey,
  tokenB: PublicKey,
  binStep: number = 10,
  dlmmProgramId: PublicKey = METEORA_DLMM_PROGRAM_ID
): [PublicKey, number] {
  const isTokenALess = tokenA.toBuffer().compare(tokenB.toBuffer()) < 0;
  const tokenX = isTokenALess ? tokenA : tokenB;
  const tokenY = isTokenALess ? tokenB : tokenA;
  const binStepBuffer = Buffer.alloc(2);
  binStepBuffer.writeUInt16LE(binStep, 0);
  return PublicKey.findProgramAddressSync(
    [tokenX.toBuffer(), tokenY.toBuffer(), binStepBuffer],
    dlmmProgramId
  );
}

export function getMeteoraDbcPoolPda(
  config: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  dbcProgramId: PublicKey = METEORA_DBC_PROGRAM_ID
): [PublicKey, number] {
  const isQuoteBigger = tokenA.toBuffer().compare(tokenB.toBuffer()) > 0;
  const maxMint = isQuoteBigger ? tokenA : tokenB;
  const minMint = isQuoteBigger ? tokenB : tokenA;
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), config.toBuffer(), maxMint.toBuffer(), minMint.toBuffer()],
    dbcProgramId
  );
}

export function getHolderLockPda(
  venture: PublicKey,
  holder: PublicKey,
  positionIndex: number,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.HOLDER_LOCK, venture.toBuffer(), holder.toBuffer(), Buffer.from([positionIndex])],
    programId
  );
}

export function getFundingRoundPda(
  venture: PublicKey,
  roundIndex: number,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.FUNDING_ROUND, venture.toBuffer(), Buffer.from([roundIndex])],
    programId
  );
}

export function getRoundTokenEscrowPda(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.ROUND_TOKEN_ESCROW, fundingRound.toBuffer()], programId);
}

export function getRoundUsdcEscrowPda(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.ROUND_USDC_ESCROW, fundingRound.toBuffer()], programId);
}

export function getMilestoneEscrowPda(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.MILESTONE_ESCROW, fundingRound.toBuffer()], programId);
}

export function getMilestoneUsdcVaultPda(
  milestoneEscrow: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.MILESTONE_USDC_VAULT, milestoneEscrow.toBuffer()], programId);
}

export function getPrimaryBackerReceiptPda(
  fundingRound: PublicKey,
  backer: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.PRIMARY_BACKER, fundingRound.toBuffer(), backer.toBuffer()], programId);
}

export function getShareholderReceiptPda(
  venture: PublicKey,
  shareholder: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.SHAREHOLDER_RECEIPT, venture.toBuffer(), shareholder.toBuffer()],
    programId
  );
}

export function getInvestorVaultPda(
  venture: PublicKey,
  investor: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.INVESTOR_VAULT, venture.toBuffer(), investor.toBuffer()],
    programId
  );
}

export function getRoundVaultPda(
  fundingRound: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.ROUND_VAULT, fundingRound.toBuffer()], programId);
}

// =============================================================================
// LIVE ON-CHAIN ACCOUNT FETCHERS (SOLANA DEVNET RPC)
// =============================================================================

export async function fetchOnChainVentureAccount(
  connection: Connection,
  mint: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): Promise<{ pda: PublicKey; exists: boolean; lamports: number; rawData: Buffer | null }> {
  const [venturePda] = getVenturePda(mint, programId);
  const accountInfo = await connection.getAccountInfo(venturePda);
  return {
    pda: venturePda,
    exists: accountInfo !== null,
    lamports: accountInfo?.lamports || 0,
    rawData: accountInfo?.data || null,
  };
}

export async function fetchFundingRoundAccount(
  connection: Connection,
  venturePda: PublicKey,
  roundIndex: number,
  programId: PublicKey = VENTRION_PROGRAM_ID
): Promise<{ pda: PublicKey; exists: boolean; lamports: number }> {
  const [roundPda] = getFundingRoundPda(venturePda, roundIndex, programId);
  const accountInfo = await connection.getAccountInfo(roundPda);
  return {
    pda: roundPda,
    exists: accountInfo !== null,
    lamports: accountInfo?.lamports || 0,
  };
}

export async function fetchInvestorVaultAccount(
  connection: Connection,
  venturePda: PublicKey,
  investor: PublicKey,
  programId: PublicKey = VENTRION_PROGRAM_ID
): Promise<{ pda: PublicKey; exists: boolean; lamports: number; rawData: Buffer | null }> {
  const [investorVaultPda] = getInvestorVaultPda(venturePda, investor, programId);
  const accountInfo = await connection.getAccountInfo(investorVaultPda);
  return {
    pda: investorVaultPda,
    exists: accountInfo !== null,
    lamports: accountInfo?.lamports || 0,
    rawData: accountInfo?.data || null,
  };
}

// =============================================================================
// ON-CHAIN PROTOCOL DATA SCHEMAS
// =============================================================================

export interface OnChainInvestorVault {
  venture: PublicKey;
  investor: PublicKey;
  stakedAmount: bigint;
  lockStartTimestamp: bigint;
  lockEndTimestamp: bigint;
  lockDurationSeconds: bigint;
  multiplierBps: number;
  effectiveWeight: bigint;
  lastAccDividendWeight: bigint;
  totalClaimedUsdc: bigint;
  isActive: boolean;
  bump: number;
  milestoneVoteMask: number;
  milestoneVetoMask: number;
  milestoneRagequitMask: number;
  lastVotedRoundIndex: number;
  amendmentSeen: number[];
}

export interface OnChainVentureState {
  globalConfig: PublicKey;
  founder: PublicKey;
  treasuryWallet: PublicKey;
  ventureTokenMint: PublicKey;
  usdcMint: PublicKey;
  masterLockVault: PublicKey;
  localDividendVault: PublicKey;
  dlmmCustody: PublicKey;
  meteoraDlmmLbPair: PublicKey;
  totalSupply: bigint;
  circulatingPublicFloat: bigint;
  totalLockedInVault: bigint;
  unlockedTreasuryTokens: bigint;
  totalDividendWeightUnits: bigint;
  accDividendPerWeightUnit: bigint;
  totalDividendsDistributed: bigint;
  currentRoundIndex: number;
  dlmmPoolInitialized: boolean;
  bump: number;
}

export interface OnChainFounderLock {
  venture: PublicKey;
  founder: PublicKey;
  amountLocked: bigint;
  lockStartTimestamp: bigint;
  unlockTimestamp: bigint;
  isUnlocked: boolean;
  earlyUnlockApprovedByDao: boolean;
  bump: number;
}

export interface OnChainHolderLock {
  venture: PublicKey;
  holder: PublicKey;
  amountLocked: bigint;
  lockStartTimestamp: bigint;
  unlockTimestamp: bigint;
  durationSeconds: bigint;
  boostMultiplierBps: number;
  lastAccDividendWeight: bigint;
  totalClaimedUsdc: bigint;
  positionIndex: number;
  isActive: boolean;
  bump: number;
}

export interface OnChainFundingRound {
  venture: PublicKey;
  roundTokenEscrow: PublicKey;
  roundUsdcEscrow: PublicKey;
  milestoneEscrow: PublicKey;
  meteoraDbcPool: PublicKey;
  roundIndex: number;
  targetCapUsdc: bigint;
  tokensAllocated: bigint;
  tokensSold: bigint;
  totalUsdcRaised: bigint;
  pricePerTokenUsdc: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  dlmmSeedBps: number;
  status: "Pending" | "Active" | "Graduated" | "Failed" | "Completed";
  bump: number;
}

export interface OnChainMilestoneItem {
  id: number;
  percentageBps: number;
  amountUsdc: bigint;
  targetCompletionDate: bigint;
  proposedAt: bigint;
  vetoDeadline: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  status: "Pending" | "Proposed" | "Approved" | "Vetoed" | "Released";
}

// =============================================================================
// COMPONENT-FACING RUNTIME STATE (Backward Compatible Interface)
// =============================================================================

export interface Proposal {
  id: number;
  title: string;
  description: string;
  type: "UpdateCogs" | "UpdatePrice" | "UpdateSupplier" | "UpdateCeoSalary";
  targetValue: number | string;
  votesFor: number;
  votesAgainst: number;
  deadline: string;
  executed: boolean;
  proposer: string;
}

export interface VentrionState {
  companyName: string;
  symbol: string;
  founderWallet: string;
  totalShares: number;
  quorumShares: number;
  reserveRateBps: number;
  ceoSalaryBps: number;
  supplierWallet: string;
  supplierName: string;

  // Product state
  productId: string;
  productName: string;
  productPriceUsdc: number;
  productCogsUsdc: number;
  unitsSold: number;

  // Financial telemetry
  totalRevenueUsdc: number;
  totalCogsPaidUsdc: number;
  totalReservesUsdc: number;
  totalDividendsDistributedUsdc: number;

  // Shareholder state (connected user)
  userShares: number;
  userClaimedDividendsUsdc: number;
  userPendingDividendsUsdc: number;
  accumulatedDividendPerShare: number;
  lastUserAccumulatedPerShare: number;

  // Governance
  proposals: Proposal[];
}

export const INITIAL_VENTRION_STATE: VentrionState = {
  companyName: "Ventrion Enterprise",
  symbol: "$VENT",
  founderWallet: "7Y4vN4FqL9aGkxYq5y2oW7p1P8Q8kLzRt8uE6sYwB9z",
  totalShares: TOTAL_SHARES,
  quorumShares: QUORUM_VOTES_REQUIRED,
  reserveRateBps: 1000, // 10%
  ceoSalaryBps: 500, // 5%
  supplierWallet: "9xQeWvG816bUx9EPjHmaT23yvVM2VXmzLsDaA88Wv",
  supplierName: "Apex PrintWorks (Berlin, DE)",

  productId: "VENT-HOODIE-GENESIS",
  productName: "Genesis Heavyweight Hoodie (Physical)",
  productPriceUsdc: 60.0,
  productCogsUsdc: 24.0,
  unitsSold: 37,

  totalRevenueUsdc: 2220.0,
  totalCogsPaidUsdc: 888.0,
  totalReservesUsdc: 222.0,
  totalDividendsDistributedUsdc: 1000.0,

  userShares: 50_000,
  userClaimedDividendsUsdc: 35.0,
  userPendingDividendsUsdc: 15.0,
  accumulatedDividendPerShare: 0.001,
  lastUserAccumulatedPerShare: 0.0007,

  proposals: [
    {
      id: 1,
      title: "Increase Supplier COGS from $24 to $32",
      description: "Supplier request due to organic cotton price spikes. Higher COGS directly lowers shareholder dividends.",
      type: "UpdateCogs",
      targetValue: 32.0,
      votesFor: 460_000,
      votesAgainst: 80_000,
      deadline: "2d 14h remaining",
      executed: false,
      proposer: "7Y4vN...wB9z (CEO)",
    },
    {
      id: 2,
      title: "Reduce Tax Reserve Rate from 10% to 7%",
      description: "Redirect 3% operating reserves into the direct shareholder dividend vault.",
      type: "UpdateCeoSalary",
      targetValue: 700,
      votesFor: 520_000,
      votesAgainst: 15_000,
      deadline: "Completed",
      executed: true,
      proposer: "3kRm9...L18x (Backer Syndicate)",
    },
  ],
};
