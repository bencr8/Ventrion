import { PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  VENTRION_PROGRAM_ID,
  METEORA_DLMM_PROGRAM_ID,
  METAPLEX_PROGRAM_ID,
  SEEDS,
  TOTAL_SHARES,
  SHARE_DECIMALS,
  USDC_DECIMALS
} from "./constants";
import ventrionIdl from "./idl/ventrion_protocol.json";

/**
 * Official TypeScript Client for interacting with the Ventrion Protocol on Solana.
 */
export class VentrionClient {
  public program: Program;
  public connection: Connection;
  public programId: PublicKey;

  constructor(provider: AnchorProvider, programId: PublicKey = VENTRION_PROGRAM_ID) {
    this.program = new Program(ventrionIdl as Idl, provider);
    this.connection = provider.connection;
    this.programId = programId;
  }

  // ===========================================================================
  // PDA Derivations
  // ===========================================================================

  public getGlobalConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.GLOBAL_CONFIG], this.programId);
  }

  public getVentStakeVaultPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.VENT_STAKE_VAULT], this.programId);
  }

  public getVentStakePositionPda(staker: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.VENT_STAKE, staker.toBuffer()], this.programId);
  }

  public getVenturePda(ventureTokenMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.VENTURE, ventureTokenMint.toBuffer()], this.programId);
  }

  public getMasterLockVaultPda(venturePda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.MASTER_LOCK_VAULT, venturePda.toBuffer()], this.programId);
  }

  public getLegalSetupVaultPda(venturePda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.LEGAL_SETUP_VAULT, venturePda.toBuffer()], this.programId);
  }

  public getDividendVaultPda(venturePda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.DIVIDEND_VAULT, venturePda.toBuffer()], this.programId);
  }

  public getStakedSharesVaultPda(venturePda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.STAKED_SHARES_VAULT, venturePda.toBuffer()], this.programId);
  }

  public getFounderVestingPda(venturePda: PublicKey, founder: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.FOUNDER_VESTING, venturePda.toBuffer(), founder.toBuffer()],
      this.programId
    );
  }

  public getFundingRoundPda(venturePda: PublicKey, roundIndex: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.FUNDING_ROUND, venturePda.toBuffer(), Buffer.from([roundIndex])],
      this.programId
    );
  }

  public getReceiptMintPda(fundingRoundPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.RECEIPT_MINT, fundingRoundPda.toBuffer()], this.programId);
  }

  public getRoundUsdcVaultPda(fundingRoundPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.ROUND_USDC_VAULT, fundingRoundPda.toBuffer()], this.programId);
  }

  public getVerificationVotePda(fundingRoundPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.VERIFICATION_VOTE, fundingRoundPda.toBuffer()], this.programId);
  }

  public getMilestoneEscrowPda(fundingRoundPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.MILESTONE_ESCROW, fundingRoundPda.toBuffer()], this.programId);
  }

  public getMilestoneUsdcVaultPda(milestoneEscrowPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.MILESTONE_USDC_VAULT, milestoneEscrowPda.toBuffer()],
      this.programId
    );
  }

  public getInvestorVaultPda(venturePda: PublicKey, investor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEEDS.INVESTOR_VAULT, venturePda.toBuffer(), investor.toBuffer()],
      this.programId
    );
  }

  public getDlmmCustodyPda(venturePda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([SEEDS.DLMM_CUSTODY, venturePda.toBuffer()], this.programId);
  }

  // ===========================================================================
  // State Account Fetchers
  // ===========================================================================

  /** Fetches global protocol configuration state */
  public async getGlobalConfig() {
    const [pda] = this.getGlobalConfigPda();
    return (this.program.account as any).globalConfig.fetch(pda);
  }

  /** Fetches master venture state for a company mint */
  public async getVentureState(ventureTokenMint: PublicKey) {
    const [pda] = this.getVenturePda(ventureTokenMint);
    return (this.program.account as any).ventureState.fetch(pda);
  }

  /** Fetches funding round state for a given venture and round index */
  public async getFundingRound(ventureTokenMint: PublicKey, roundIndex: number = 0) {
    const [venturePda] = this.getVenturePda(ventureTokenMint);
    const [roundPda] = this.getFundingRoundPda(venturePda, roundIndex);
    return (this.program.account as any).fundingRound.fetch(roundPda);
  }

  /** Fetches milestone escrow state for a given venture and round */
  public async getMilestoneEscrow(ventureTokenMint: PublicKey, roundIndex: number = 0) {
    const [venturePda] = this.getVenturePda(ventureTokenMint);
    const [roundPda] = this.getFundingRoundPda(venturePda, roundIndex);
    const [escrowPda] = this.getMilestoneEscrowPda(roundPda);
    return (this.program.account as any).milestoneEscrow.fetch(escrowPda);
  }

  /** Fetches an individual investor staking vault */
  public async getInvestorVault(ventureTokenMint: PublicKey, investor: PublicKey) {
    const [venturePda] = this.getVenturePda(ventureTokenMint);
    const [vaultPda] = this.getInvestorVaultPda(venturePda, investor);
    return (this.program.account as any).investorVault.fetch(vaultPda);
  }
}
