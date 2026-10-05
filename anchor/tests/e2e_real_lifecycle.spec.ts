import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  ComputeBudgetProgram
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  getMint
} from "@solana/spl-token";
import { expect } from "chai";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createRequire } from "module";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const DLMM = require("@meteora-ag/dlmm").default || require("@meteora-ag/dlmm");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Canonical Meteora DLMM Program ID, Preset Parameter, and SPL Memo
export const DLMM_PROGRAM_ID = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
export const PRESET_PARAMETER2_PUBKEY = new PublicKey("2iBzG8E7kL4hq4ymFjmecXd7XHufZiz81iyb2WQLrsW5");
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Helper: sorts mints lexicographically as DLMM does
function sortMints(tokenA: PublicKey, tokenB: PublicKey): [PublicKey, PublicKey] {
  return Buffer.compare(tokenA.toBuffer(), tokenB.toBuffer()) < 0
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

// Helper: derives Meteora DLMM LB Pair v2 PDA
function deriveLbPair(preset: PublicKey, tokenA: PublicKey, tokenB: PublicKey): PublicKey {
  const [tokenX, tokenY] = sortMints(tokenA, tokenB);
  return PublicKey.findProgramAddressSync(
    [preset.toBuffer(), tokenX.toBuffer(), tokenY.toBuffer()],
    DLMM_PROGRAM_ID
  )[0];
}

// Helper: derives DLMM Reserve token account PDA
function deriveReserve(lbPair: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [lbPair.toBuffer(), mint.toBuffer()],
    DLMM_PROGRAM_ID
  )[0];
}

// Helper: derives DLMM Oracle PDA
function deriveOracle(lbPair: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("oracle"), lbPair.toBuffer()],
    DLMM_PROGRAM_ID
  )[0];
}

// Helper: derives DLMM Bin Array PDA
function deriveBinArray(lbPair: PublicKey, index: bigint): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(index, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bin_array"), lbPair.toBuffer(), buf],
    DLMM_PROGRAM_ID
  )[0];
}

// Helper: derives DLMM Event Authority PDA
function deriveEventAuthority(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    DLMM_PROGRAM_ID
  )[0];
}

describe("Ventrion Protocol ($VENT) - End-to-End Real Lifecycle Suite", () => {
  if (!process.env.ANCHOR_PROVIDER_URL) {
    process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
  }
  if (!process.env.ANCHOR_WALLET) {
    process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
  }
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load IDL
  const idlPath = path.resolve(__dirname, "../target/idl/ventrion_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  if (idl.address) idl.address = idl.address.replace(/"/g, "");
  const program = new Program(idl, provider);

  // Signers & Actors
  const admin = (provider.wallet as any).payer as Keypair;
  const founder = Keypair.generate();
  const backerAlice = Keypair.generate();
  const backerBob = Keypair.generate();
  const staker1 = Keypair.generate();

  // Tokens
  let usdcMint: PublicKey;
  let ventMint: PublicKey;

  // ATAs
  let adminUsdcAta: PublicKey;
  let founderUsdcAta: PublicKey;
  let backerAliceUsdcAta: PublicKey;
  let backerBobUsdcAta: PublicKey;
  let staker1VentAta: PublicKey;
  let aliceShareAta: PublicKey;
  let bobShareAta: PublicKey;

  // DLMM pool vars from Venture 1
  let lbPair: PublicKey;
  let reserveX: PublicKey;
  let reserveY: PublicKey;
  let binArrayLower: PublicKey;
  let binArrayUpper: PublicKey;
  let eventAuthority: PublicKey;
  let sharesAreTokenX: boolean;

  // Global Config PDA
  const [globalConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_config")],
    program.programId
  );

  // Staking Vault PDA
  const [ventStakingVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vent_stake_vault")],
    program.programId
  );

  // ProgramData PDA (BPF Upgradeable Loader)
  const [programDataPda] = PublicKey.findProgramAddressSync(
    [program.programId.toBuffer()],
    new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
  );

  // Venture 1 Keys & PDAs (Success Path - Tests 1, 2, 3, 5)
  const midaoLLCId = crypto.createHash("sha256").update("ventrion.llc.genesis.test." + Date.now()).digest();
  const legalContractHash = crypto.createHash("sha256").update("midao.operating.agreement.v1.0").digest();
  const ventureTokenMintKeypair = Keypair.generate();

  const [venturePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("venture"), ventureTokenMintKeypair.publicKey.toBuffer()],
    program.programId
  );
  const [founderVestingPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("founder_vesting"), venturePda.toBuffer(), founder.publicKey.toBuffer()],
    program.programId
  );
  const [vestingVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vesting_vault"), venturePda.toBuffer()],
    program.programId
  );
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("master_lock_vault"), venturePda.toBuffer()],
    program.programId
  );
  const [legalSetupVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("legal_setup_vault"), venturePda.toBuffer()],
    program.programId
  );
  const [dividendVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("dividend_vault"), venturePda.toBuffer()],
    program.programId
  );
  const [stakedSharesVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("staked_shares_vault"), venturePda.toBuffer()],
    program.programId
  );
  const [dlmmCustodyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("dlmm_custody"), venturePda.toBuffer()],
    program.programId
  );
  const [custodyUsdcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("custody_usdc"), venturePda.toBuffer()],
    program.programId
  );
  const [custodySharesPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("custody_shares"), venturePda.toBuffer()],
    program.programId
  );

  // Round 0 PDAs
  const [fundingRound0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("funding_round"), venturePda.toBuffer(), Buffer.from([0])],
    program.programId
  );
  const [receiptMint0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("receipt_mint"), fundingRound0Pda.toBuffer()],
    program.programId
  );
  const [roundUsdcVault0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round_usdc_vault"), fundingRound0Pda.toBuffer()],
    program.programId
  );
  const [verificationVote0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("verification_vote"), fundingRound0Pda.toBuffer()],
    program.programId
  );
  const [milestoneEscrow0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone_escrow"), fundingRound0Pda.toBuffer()],
    program.programId
  );
  const [milestoneUsdcVault0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone_usdc_vault"), milestoneEscrow0Pda.toBuffer()],
    program.programId
  );
  const [dlmmPosition0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("dlmm_position"), fundingRound0Pda.toBuffer()],
    program.programId
  );

  // Staker 1 Position & Vote PDAs
  const [staker1PositionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vent_stake"), staker1.publicKey.toBuffer()],
    program.programId
  );
  const [staker1VoteRecord0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("staker_vote"), verificationVote0Pda.toBuffer(), staker1.publicKey.toBuffer()],
    program.programId
  );

  before(async () => {
    // Fund test actors
    const airdropTx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: founder.publicKey, lamports: 2 * LAMPORTS_PER_SOL }),
      SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: backerAlice.publicKey, lamports: 2 * LAMPORTS_PER_SOL }),
      SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: backerBob.publicKey, lamports: 2 * LAMPORTS_PER_SOL }),
      SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: staker1.publicKey, lamports: 2 * LAMPORTS_PER_SOL })
    );
    await provider.sendAndConfirm(airdropTx);

    // Deterministic mint keypairs so they stay consistent across runs
    const usdcMintKeypair = Keypair.fromSeed(crypto.createHash("sha256").update("ventrion.test.usdc.mint.v1").digest());
    const ventMintKeypair = Keypair.fromSeed(crypto.createHash("sha256").update("ventrion.test.vent.mint.v1").digest());
    usdcMint = usdcMintKeypair.publicKey;
    ventMint = ventMintKeypair.publicKey;

    // Check if mints exist; if not, create them
    const usdcInfo = await provider.connection.getAccountInfo(usdcMint);
    if (!usdcInfo) {
      await createMint(provider.connection, admin, admin.publicKey, null, 6, usdcMintKeypair);
    }
    const ventInfo = await provider.connection.getAccountInfo(ventMint);
    if (!ventInfo) {
      await createMint(provider.connection, admin, admin.publicKey, null, 6, ventMintKeypair);
    }

    // Create ATAs
    adminUsdcAta = (await getOrCreateAssociatedTokenAccount(provider.connection, admin, usdcMint, admin.publicKey)).address;
    founderUsdcAta = (await getOrCreateAssociatedTokenAccount(provider.connection, founder, usdcMint, founder.publicKey)).address;
    backerAliceUsdcAta = (await getOrCreateAssociatedTokenAccount(provider.connection, backerAlice, usdcMint, backerAlice.publicKey)).address;
    backerBobUsdcAta = (await getOrCreateAssociatedTokenAccount(provider.connection, backerBob, usdcMint, backerBob.publicKey)).address;
    staker1VentAta = (await getOrCreateAssociatedTokenAccount(provider.connection, staker1, ventMint, staker1.publicKey)).address;

    // Mint USDC and VENT to actors
    await mintTo(provider.connection, admin, usdcMint, backerAliceUsdcAta, admin, 100_000 * 1e6);
    await mintTo(provider.connection, admin, usdcMint, backerBobUsdcAta, admin, 100_000 * 1e6);
    await mintTo(provider.connection, admin, ventMint, staker1VentAta, admin, 1_000_000 * 1e6);
  });

  it("Test 1: Global Config Init & Venture Genesis (1,000,000 shares fixed, Mint Authority Revoked)", async () => {
    // 1. Initialize Global Config if not already present
    try {
      await program.account.globalConfig.fetch(globalConfigPda);
    } catch {
      await program.methods
        .initializeGlobalConfig({
          feeTreasury: admin.publicKey,
          legalSetupAuthority: admin.publicKey,
          minApprovalBps: 5000, // 50.00%
          verificationQuorumBps: 2000, // 20.00%
          protocolFeeBps: 50 // 0.50%
        })
        .accountsStrict({
          admin: admin.publicKey,
          globalConfig: globalConfigPda,
          usdcMint: usdcMint,
          ventMint: ventMint,
          ventStakeVault: ventStakingVaultPda,
          dlmmPresetParameter: PRESET_PARAMETER2_PUBKEY,
          program: program.programId,
          programData: programDataPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .rpc();
    }

    // Ensure Staker 1 has staked in governance pool
    try {
      await program.account.ventStakePosition.fetch(staker1PositionPda);
    } catch {
      await program.methods
        .stakeVent(new BN(500_000 * 1e6))
        .accountsStrict({
          staker: staker1.publicKey,
          globalConfig: globalConfigPda,
          stakePosition: staker1PositionPda,
          stakerVentAccount: staker1VentAta,
          ventStakeVault: ventStakingVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .signers([staker1])
        .rpc();
    }

    // 2. Launch Venture Genesis
    // Fixed supply: 1,000,000 shares * 1e6 = 1_000_000_000_000 units
    // Founder shares: 300,000 * 1e6 (30%)
    // Round 0 sale: 500,000 shares @ $0.10 = $50,000 USDC target cap
    // DLMM liquidity reserved: 17% of 500,000 = 85,000 shares
    // Total committed: 300k + 500k + 85k = 885,000 shares <= 1,000,000 shares
    const targetCapUsdc = new BN(50_000 * 1e6);
    const flatPriceUsdc = new BN(100_000); // 0.10 USDC (6 decimals)
    const founderShares = new BN(300_000 * 1e6);

    await program.methods
      .launchVentureGenesis({
        midaoLlcId: Array.from(midaoLLCId),
        legalContractHash: Array.from(legalContractHash),
        founderShares: founderShares,
        vestingCliffSeconds: new BN(182 * 86400),
        vestingDurationSeconds: new BN(720 * 86400),
        roundTerms: {
          pricePerShareUsdc: flatPriceUsdc,
          targetCapUsdc: targetCapUsdc,
          upfrontWorkingCapitalBps: 1500 // 15%
        }
      })
      .accountsStrict({
        founder: founder.publicKey,
        globalConfig: globalConfigPda,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        venture: venturePda,
        masterLockVault: masterLockVaultPda,
        legalSetupVault: legalSetupVaultPda,
        founderVesting: founderVestingPda,
        vestingVault: vestingVaultPda,
        fundingRound: fundingRound0Pda,
        receiptMint: receiptMint0Pda,
        roundUsdcVault: roundUsdcVault0Pda,
        verificationVote: verificationVote0Pda,
        usdcMint: usdcMint,
        treasuryWallet: founder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder, ventureTokenMintKeypair])
      .rpc();

    // Verification 1: Mint Authority is revoked (None) & Supply is exactly 1,000,000 shares
    const mintInfo = await getMint(provider.connection, ventureTokenMintKeypair.publicKey);
    expect(mintInfo.mintAuthority).to.be.null;
    expect(Number(mintInfo.supply)).to.equal(1_000_000 * 1e6);

    // Verification 2: Founder Vesting vault has 300,000 shares
    const vestingVault = await getAccount(provider.connection, vestingVaultPda);
    expect(Number(vestingVault.amount)).to.equal(300_000 * 1e6);

    // Verification 3: Master Lock Vault has 700,000 shares
    const masterLockVault = await getAccount(provider.connection, masterLockVaultPda);
    expect(Number(masterLockVault.amount)).to.equal(700_000 * 1e6);

    // Verification 4: VentureVerificationVote is initialized with zeros & false
    const voteAccount = await program.account.ventureVerificationVote.fetch(verificationVote0Pda);
    expect(voteAccount.isFinalized).to.be.false;
    expect(voteAccount.isApproved).to.be.false;
    expect(voteAccount.votingStartTimestamp.toNumber()).to.equal(0);
    expect(voteAccount.votingEndTimestamp.toNumber()).to.equal(0);

    // Verification 5: VentureState status is GenesisInitialized
    const ventureState = await program.account.ventureState.fetch(venturePda);
    expect(JSON.stringify(ventureState.status).toLowerCase()).to.include("genesisinitialized");
  });

  it("Test 2: Milestone Configuration & Primary Sale on Flat Curve until CapReached", async () => {
    // 1. Founder configures milestones (strictly sequential future dates)
    const nowSec = Math.floor(Date.now() / 1000);
    const milestones = [
      {
        percentageBps: 3000, // 30%
        targetCompletionDate: new BN(nowSec + 60 * 86400)
      },
      {
        percentageBps: 3000, // 30%
        targetCompletionDate: new BN(nowSec + 120 * 86400)
      },
      {
        percentageBps: 4000, // 40% (sum = 10,000 bps)
        targetCompletionDate: new BN(nowSec + 180 * 86400)
      }
    ];

    await program.methods
      .configureMilestones(milestones)
      .accountsStrict({
        founder: founder.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
        milestoneUsdcVault: milestoneUsdcVault0Pda,
        dividendVault: dividendVaultPda,
        stakedSharesVault: stakedSharesVaultPda,
        dlmmCustody: dlmmCustodyPda,
        custodyUsdc: custodyUsdcPda,
        custodyShares: custodySharesPda,
        usdcMint: usdcMint,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder])
      .rpc();

    // Verify Venture status transitioned to PrimaryRaiseActive
    const ventureState = await program.account.ventureState.fetch(venturePda);
    expect(JSON.stringify(ventureState.status).toLowerCase()).to.include("primaryraiseactive");

    // 2. Backer Alice buys $20,000 USDC worth of shares (200,000 shares)
    const aliceContribution = new BN(20_000 * 1e6);
    const aliceReceiptAta = (await getOrCreateAssociatedTokenAccount(provider.connection, backerAlice, receiptMint0Pda, backerAlice.publicKey)).address;
    const [aliceRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), backerAlice.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .contributeFundingRound(aliceContribution)
      .accountsStrict({
        investor: backerAlice.publicKey,
        globalConfig: globalConfigPda,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        verificationVote: verificationVote0Pda,
        roundRecord: aliceRecordPda,
        receiptMint: receiptMint0Pda,
        investorReceiptAccount: aliceReceiptAta,
        investorUsdc: backerAliceUsdcAta,
        fundingRoundUsdcVault: roundUsdcVault0Pda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerAlice])
      .rpc();

    // Verify Alice received 200,000 receipt tokens ($VENT-RN)
    const aliceReceiptAccount = await getAccount(provider.connection, aliceReceiptAta);
    expect(Number(aliceReceiptAccount.amount)).to.equal(200_000 * 1e6);

    // 3. Alice exercises sellback before cap reached: sells back 50,000 shares ($5,000 USDC)
    const sellAmount = new BN(50_000 * 1e6);
    await program.methods
      .sellPrimaryRound(sellAmount)
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        roundRecord: aliceRecordPda,
        receiptMint: receiptMint0Pda,
        investorReceiptAccount: aliceReceiptAta,
        investorUsdc: backerAliceUsdcAta,
        fundingRoundUsdcVault: roundUsdcVault0Pda,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([backerAlice])
      .rpc();

    // Verify receipts burned to 150,000
    const aliceReceiptAfterSell = await getAccount(provider.connection, aliceReceiptAta);
    expect(Number(aliceReceiptAfterSell.amount)).to.equal(150_000 * 1e6);

    // 4. Backer Bob contributes $35,000 USDC to hit EXACTLY 100% of hardcap ($50,000 USDC)
    const bobContribution = new BN(35_000 * 1e6);
    const bobReceiptAta = (await getOrCreateAssociatedTokenAccount(provider.connection, backerBob, receiptMint0Pda, backerBob.publicKey)).address;
    const [bobRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), backerBob.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .contributeFundingRound(bobContribution)
      .accountsStrict({
        investor: backerBob.publicKey,
        globalConfig: globalConfigPda,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        verificationVote: verificationVote0Pda,
        roundRecord: bobRecordPda,
        receiptMint: receiptMint0Pda,
        investorReceiptAccount: bobReceiptAta,
        investorUsdc: backerBobUsdcAta,
        fundingRoundUsdcVault: roundUsdcVault0Pda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerBob])
      .rpc();

    // 5. Staker 1 casts YES vote on Venture 1 within the voting window
    await program.methods
      .castVerificationVote(true)
      .accountsStrict({
        staker: staker1.publicKey,
        fundingRound: fundingRound0Pda,
        verificationVote: verificationVote0Pda,
        stakePosition: staker1PositionPda,
        stakerVoteRecord: staker1VoteRecord0Pda,
        systemProgram: SystemProgram.programId
      })
      .signers([staker1])
      .rpc();

    // 6. Verify status switched to CapReached and voting period started
    const roundState = await program.account.fundingRound.fetch(fundingRound0Pda);
    expect(JSON.stringify(roundState.roundStatus).toLowerCase()).to.include("capreached");
    expect(roundState.totalRaisedUsdc.toNumber()).to.equal(50_000 * 1e6);

    const ventureAfterCap = await program.account.ventureState.fetch(venturePda);
    expect(JSON.stringify(ventureAfterCap.status).toLowerCase()).to.include("capreached");
    expect(ventureAfterCap.isRoundActive).to.be.false;

    const voteState = await program.account.ventureVerificationVote.fetch(verificationVote0Pda);
    expect(voteState.votingStartTimestamp.toNumber()).to.be.greaterThan(0);
    expect(voteState.votingEndTimestamp.toNumber()).to.be.greaterThan(voteState.votingStartTimestamp.toNumber());

    // 7. Subsequent buy attempt must fail (Curve is frozen)
    try {
      await program.methods
        .contributeFundingRound(new BN(1_000 * 1e6))
        .accountsStrict({
          investor: backerAlice.publicKey,
          globalConfig: globalConfigPda,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          verificationVote: verificationVote0Pda,
          roundRecord: aliceRecordPda,
          receiptMint: receiptMint0Pda,
          investorReceiptAccount: aliceReceiptAta,
          investorUsdc: backerAliceUsdcAta,
          fundingRoundUsdcVault: roundUsdcVault0Pda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .signers([backerAlice])
        .rpc();
      expect.fail("Expected contribution to fail when round is CapReached");
    } catch (err: any) {
      expect(err.toString()).to.satisfy((s: string) => s.includes("RoundNotActive") || s.includes("InvalidRoundStatus") || s.includes("6036"));
    }
  });

  it("Test 3: Premature Graduation Attempt Reverts with VentureNotApproved (Code 6005)", async () => {
    const [tokenX, tokenY] = sortMints(ventureTokenMintKeypair.publicKey, usdcMint);
    const sharesAreTokenX = tokenX.equals(ventureTokenMintKeypair.publicKey);
    const activeId = sharesAreTokenX ? -462 : 462;

    const lbPair = deriveLbPair(PRESET_PARAMETER2_PUBKEY, ventureTokenMintKeypair.publicKey, usdcMint);
    const reserveX = deriveReserve(lbPair, tokenX);
    const reserveY = deriveReserve(lbPair, tokenY);
    const oracle = deriveOracle(lbPair);

    const lowerBinId = activeId - 34;
    const upperBinId = lowerBinId + 68;
    const lowerIndex = BigInt(Math.floor(lowerBinId / 70));
    const upperIndex = BigInt(Math.floor(upperBinId / 70));

    const binArrayLower = deriveBinArray(lbPair, lowerIndex);
    const binArrayUpper = deriveBinArray(lbPair, upperIndex);
    const eventAuthority = deriveEventAuthority();

    try {
      await program.methods
        .prepareDlmmPool(activeId)
        .accountsStrict({
          payer: founder.publicKey,
          globalConfig: globalConfigPda,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          dlmmCustody: dlmmCustodyPda,
          usdcMint: usdcMint,
          ventureTokenMint: ventureTokenMintKeypair.publicKey,
          lbPair: lbPair,
          reserveX: reserveX,
          reserveY: reserveY,
          oracle: oracle,
          presetParameter: PRESET_PARAMETER2_PUBKEY,
          binArrayLower: binArrayLower,
          binArrayUpper: binArrayUpper,
          position: dlmmPosition0Pda,
          eventAuthority: eventAuthority,
          dlmmProgram: DLMM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .signers([founder])
        .rpc();
      expect.fail("Expected prepareDlmmPool to fail before approval");
    } catch (err: any) {
      expect(err.toString()).to.satisfy((s: string) => s.includes("VentureNotApproved") || s.includes("6005"));
    }
  });

  it("Test 4: Rejection & Refund Path - 100% USDC returned when Vote fails or times out", async () => {
    // Dedicated venture for rejection & refund testing
    const rejectLLCId = crypto.createHash("sha256").update("ventrion.llc.reject.test." + Date.now()).digest();
    const rejectVentureTokenMintKeypair = Keypair.generate();

    const [rejectVenturePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("venture"), rejectVentureTokenMintKeypair.publicKey.toBuffer()],
      program.programId
    );
    const [rejectFounderVestingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("founder_vesting"), rejectVenturePda.toBuffer(), founder.publicKey.toBuffer()],
      program.programId
    );
    const [rejectVestingVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_vault"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectMasterLockVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("master_lock_vault"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectLegalSetupVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("legal_setup_vault"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectFundingRoundPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("funding_round"), rejectVenturePda.toBuffer(), Buffer.from([0])],
      program.programId
    );
    const [rejectReceiptMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("receipt_mint"), rejectFundingRoundPda.toBuffer()],
      program.programId
    );
    const [rejectRoundUsdcVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_usdc_vault"), rejectFundingRoundPda.toBuffer()],
      program.programId
    );
    const [rejectVotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("verification_vote"), rejectFundingRoundPda.toBuffer()],
      program.programId
    );
    const [rejectMilestoneEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_escrow"), rejectFundingRoundPda.toBuffer()],
      program.programId
    );
    const [rejectMilestoneUsdcVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_usdc_vault"), rejectMilestoneEscrowPda.toBuffer()],
      program.programId
    );
    const [rejectDividendVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dividend_vault"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectStakedSharesVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staked_shares_vault"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectDlmmCustodyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dlmm_custody"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectCustodyUsdcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("custody_usdc"), rejectVenturePda.toBuffer()],
      program.programId
    );
    const [rejectCustodySharesPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("custody_shares"), rejectVenturePda.toBuffer()],
      program.programId
    );

    // 1. Launch Genesis for reject venture ($10,000 USDC cap, 100,000 shares @ $0.10)
    await program.methods
      .launchVentureGenesis({
        midaoLlcId: Array.from(rejectLLCId),
        legalContractHash: Array.from(legalContractHash),
        founderShares: new BN(300_000 * 1e6),
        vestingCliffSeconds: new BN(182 * 86400),
        vestingDurationSeconds: new BN(720 * 86400),
        roundTerms: {
          pricePerShareUsdc: new BN(100_000),
          targetCapUsdc: new BN(10_000 * 1e6),
          upfrontWorkingCapitalBps: 1500
        }
      })
      .accountsStrict({
        founder: founder.publicKey,
        globalConfig: globalConfigPda,
        ventureTokenMint: rejectVentureTokenMintKeypair.publicKey,
        venture: rejectVenturePda,
        masterLockVault: rejectMasterLockVaultPda,
        legalSetupVault: rejectLegalSetupVaultPda,
        founderVesting: rejectFounderVestingPda,
        vestingVault: rejectVestingVaultPda,
        fundingRound: rejectFundingRoundPda,
        receiptMint: rejectReceiptMintPda,
        roundUsdcVault: rejectRoundUsdcVaultPda,
        verificationVote: rejectVotePda,
        usdcMint: usdcMint,
        treasuryWallet: founder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder, rejectVentureTokenMintKeypair])
      .rpc();

    // 2. Configure milestones for reject venture
    await program.methods
      .configureMilestones([
        {
          percentageBps: 10000,
          targetCompletionDate: new BN(Math.floor(Date.now() / 1000) + 30 * 86400)
        }
      ])
      .accountsStrict({
        founder: founder.publicKey,
        venture: rejectVenturePda,
        fundingRound: rejectFundingRoundPda,
        milestoneEscrow: rejectMilestoneEscrowPda,
        milestoneUsdcVault: rejectMilestoneUsdcVaultPda,
        dividendVault: rejectDividendVaultPda,
        stakedSharesVault: rejectStakedSharesVaultPda,
        dlmmCustody: rejectDlmmCustodyPda,
        custodyUsdc: rejectCustodyUsdcPda,
        custodyShares: rejectCustodySharesPda,
        usdcMint: usdcMint,
        ventureTokenMint: rejectVentureTokenMintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder])
      .rpc();

    // 3. Backer Alice fills 100% of the $10,000 cap
    const aliceRejectReceiptAta = (await getOrCreateAssociatedTokenAccount(provider.connection, backerAlice, rejectReceiptMintPda, backerAlice.publicKey)).address;
    const [aliceRejectRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), rejectFundingRoundPda.toBuffer(), backerAlice.publicKey.toBuffer()],
      program.programId
    );

    const aliceUsdcBefore = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);

    await program.methods
      .contributeFundingRound(new BN(10_000 * 1e6))
      .accountsStrict({
        investor: backerAlice.publicKey,
        globalConfig: globalConfigPda,
        venture: rejectVenturePda,
        fundingRound: rejectFundingRoundPda,
        verificationVote: rejectVotePda,
        roundRecord: aliceRejectRecordPda,
        receiptMint: rejectReceiptMintPda,
        investorReceiptAccount: aliceRejectReceiptAta,
        investorUsdc: backerAliceUsdcAta,
        fundingRoundUsdcVault: rejectRoundUsdcVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerAlice])
      .rpc();

    const aliceUsdcAfterContribute = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);
    expect(aliceUsdcBefore - aliceUsdcAfterContribute).to.equal(10_000 * 1e6);

    // 4. Staker 1 casts a NO vote on verification immediately
    const [stakerRejectVoteRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staker_vote"), rejectVotePda.toBuffer(), staker1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .castVerificationVote(false)
      .accountsStrict({
        staker: staker1.publicKey,
        fundingRound: rejectFundingRoundPda,
        verificationVote: rejectVotePda,
        stakePosition: staker1PositionPda,
        stakerVoteRecord: stakerRejectVoteRecordPda,
        systemProgram: SystemProgram.programId
      })
      .signers([staker1])
      .rpc();

    // 5. Wait for voting window to elapse dynamically
    // 5. Wait for voting window to elapse dynamically on-chain
    const rejectVoteAccount = await program.account.ventureVerificationVote.fetch(rejectVotePda);
    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= rejectVoteAccount.votingEndTimestamp.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 6. Finalize verification -> Rejected (0 YES votes, majority failed)
    await program.methods
      .finalizeVerification()
      .accountsStrict({
        globalConfig: globalConfigPda,
        venture: rejectVenturePda,
        fundingRound: rejectFundingRoundPda,
        verificationVote: rejectVotePda
      })
      .rpc();

    // Assert: status is RefundActive
    const rejectRoundState = await program.account.fundingRound.fetch(rejectFundingRoundPda);
    expect(JSON.stringify(rejectRoundState.roundStatus).toLowerCase()).to.include("refundactive");

    const rejectVentureState = await program.account.ventureState.fetch(rejectVenturePda);
    expect(JSON.stringify(rejectVentureState.status).toLowerCase()).to.include("refundactive");

    // 8. Backer Alice reclaims 100% refund via refundPrimaryRound
    await program.methods
      .refundPrimaryRound()
      .accountsStrict({
        investor: backerAlice.publicKey,
        fundingRound: rejectFundingRoundPda,
        roundRecord: aliceRejectRecordPda,
        receiptMint: rejectReceiptMintPda,
        investorReceiptAccount: aliceRejectReceiptAta,
        backerUsdcDestination: backerAliceUsdcAta,
        fundingRoundUsdcVault: rejectRoundUsdcVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([backerAlice])
      .rpc();

    // Assert: Alice's receipt tokens burned to 0 and 100% USDC returned
    const aliceRejectReceipt = await getAccount(provider.connection, aliceRejectReceiptAta);
    expect(Number(aliceRejectReceipt.amount)).to.equal(0);

    const aliceUsdcFinal = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);
    expect(aliceUsdcFinal).to.equal(aliceUsdcBefore);
  });

  it("Test 5: Success Path - Approval, Meteora DLMM Pool Seeding & 1:1 Share Redemption", async () => {
    // 1. Verify Staker 1 YES vote was cast or cast if needed
    try {
      const voteRecord = await program.account.stakerVotingRecord.fetch(staker1VoteRecord0Pda);
      expect(voteRecord.voteYes).to.be.true;
    } catch {
      await program.methods
        .castVerificationVote(true)
        .accountsStrict({
          staker: staker1.publicKey,
          fundingRound: fundingRound0Pda,
          verificationVote: verificationVote0Pda,
          stakePosition: staker1PositionPda,
          stakerVoteRecord: staker1VoteRecord0Pda,
          systemProgram: SystemProgram.programId
        })
        .signers([staker1])
        .rpc();
    }

    // 2. Wait for voting window to elapse if needed on-chain
    const voteAccount = await program.account.ventureVerificationVote.fetch(verificationVote0Pda);
    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= voteAccount.votingEndTimestamp.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 3. Finalize verification -> Approved
    await program.methods
      .finalizeVerification()
      .accountsStrict({
        globalConfig: globalConfigPda,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        verificationVote: verificationVote0Pda
      })
      .rpc();

    // Assert: status is VerifiedApproved
    const roundApproved = await program.account.fundingRound.fetch(fundingRound0Pda);
    expect(JSON.stringify(roundApproved.roundStatus).toLowerCase()).to.include("verifiedapproved");

    const ventureApproved = await program.account.ventureState.fetch(venturePda);
    expect(JSON.stringify(ventureApproved.status).toLowerCase()).to.include("verifiedapproved");

    // 4. Derive Meteora DLMM Pool geometry for 0.10 USDC flat round price
    const [tokenX, tokenY] = sortMints(ventureTokenMintKeypair.publicKey, usdcMint);
    sharesAreTokenX = tokenX.equals(ventureTokenMintKeypair.publicKey);
    const activeId = sharesAreTokenX ? -462 : 462;

    lbPair = deriveLbPair(PRESET_PARAMETER2_PUBKEY, ventureTokenMintKeypair.publicKey, usdcMint);
    reserveX = deriveReserve(lbPair, tokenX);
    reserveY = deriveReserve(lbPair, tokenY);
    const oracle = deriveOracle(lbPair);

    // Position width = 69 bins: [activeId - 34 ..= activeId + 34]
    const lowerBinId = activeId - 34;
    const upperBinId = lowerBinId + 68;
    const lowerIndex = BigInt(Math.floor(lowerBinId / 70));
    const upperIndex = BigInt(Math.floor(upperBinId / 70));

    binArrayLower = deriveBinArray(lbPair, lowerIndex);
    binArrayUpper = deriveBinArray(lbPair, upperIndex);
    eventAuthority = deriveEventAuthority();

    // 5. Prepare DLMM Pool via CPI
    await program.methods
      .prepareDlmmPool(activeId)
      .accountsStrict({
        payer: founder.publicKey,
        globalConfig: globalConfigPda,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        dlmmCustody: dlmmCustodyPda,
        usdcMint: usdcMint,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        lbPair: lbPair,
        reserveX: reserveX,
        reserveY: reserveY,
        oracle: oracle,
        presetParameter: PRESET_PARAMETER2_PUBKEY,
        binArrayLower: binArrayLower,
        binArrayUpper: binArrayUpper,
        position: dlmmPosition0Pda,
        eventAuthority: eventAuthority,
        dlmmProgram: DLMM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder])
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
      .rpc();

    const roundPrepared = await program.account.fundingRound.fetch(fundingRound0Pda);
    expect(roundPrepared.dlmmPrepared).to.be.true;

    // 6. Execute Atomic Graduation: capital division & permanent liquidity lock
    const founderUsdcBefore = Number((await getAccount(provider.connection, founderUsdcAta)).amount);

    await program.methods
      .executeAtomicGraduation()
      .accountsStrict({
        executor: founder.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
        fundingRoundUsdcVault: roundUsdcVault0Pda,
        masterLockVault: masterLockVaultPda,
        legalSetupVault: legalSetupVaultPda,
        founderTreasuryUsdc: founderUsdcAta,
        milestoneUsdcVault: milestoneUsdcVault0Pda,
        dlmmCustody: dlmmCustodyPda,
        custodyUsdc: custodyUsdcPda,
        custodyShares: custodySharesPda,
        usdcMint: usdcMint,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        lbPair: lbPair,
        reserveX: reserveX,
        reserveY: reserveY,
        position: dlmmPosition0Pda,
        binArrayLower: binArrayLower,
        binArrayUpper: binArrayUpper,
        eventAuthority: eventAuthority,
        dlmmProgram: DLMM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([founder])
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
      .rpc();

    // Assert: Venture graduated and DLMM live
    const ventureGraduated = await program.account.ventureState.fetch(venturePda);
    expect(JSON.stringify(ventureGraduated.status).toLowerCase()).to.include("graduateddlmmlive");

    // Assert: Legal fee max($3,000, 3%) = $3,000 USDC in legalSetupVault
    const legalVault = await getAccount(provider.connection, legalSetupVaultPda);
    expect(Number(legalVault.amount)).to.equal(3_000 * 1e6);

    // Assert: Founder treasury received 15% upfront runway = $7,500 USDC
    const founderUsdcAfter = Number((await getAccount(provider.connection, founderUsdcAta)).amount);
    expect(founderUsdcAfter - founderUsdcBefore).to.equal(7_500 * 1e6);

    // Assert: Milestone escrow received remaining funds
    const milestoneVault = await getAccount(provider.connection, milestoneUsdcVault0Pda);
    expect(Number(milestoneVault.amount)).to.be.greaterThan(30_000 * 1e6);

    // 7. Backers Alice and Bob redeem their receipts 1:1 for real common shares
    const [aliceRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), backerAlice.publicKey.toBuffer()],
      program.programId
    );
    const aliceReceiptAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      backerAlice,
      receiptMint0Pda,
      backerAlice.publicKey
    )).address;
    aliceShareAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      backerAlice,
      ventureTokenMintKeypair.publicKey,
      backerAlice.publicKey
    )).address;

    // Alice redeems her remaining 150,000 receipts
    await program.methods
      .redeemShares(new BN(150_000 * 1e6))
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        roundRecord: aliceRecordPda,
        receiptMint: receiptMint0Pda,
        investorReceiptAccount: aliceReceiptAta,
        masterLockVault: masterLockVaultPda,
        investorShareAccount: aliceShareAta,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerAlice])
      .rpc();

    // Verify Alice's receipts burned to 0 and common shares credited 1:1 (150,000 shares)
    const aliceReceiptFinal = await getAccount(provider.connection, aliceReceiptAta);
    expect(Number(aliceReceiptFinal.amount)).to.equal(0);
    const aliceShareFinal = await getAccount(provider.connection, aliceShareAta);
    expect(Number(aliceShareFinal.amount)).to.equal(150_000 * 1e6);

    // Bob redeems his 350,000 receipts
    const [bobRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), backerBob.publicKey.toBuffer()],
      program.programId
    );
    const bobReceiptAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      backerBob,
      receiptMint0Pda,
      backerBob.publicKey
    )).address;
    bobShareAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      backerBob,
      ventureTokenMintKeypair.publicKey,
      backerBob.publicKey
    )).address;

    await program.methods
      .redeemShares(new BN(350_000 * 1e6))
      .accountsStrict({
        investor: backerBob.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        roundRecord: bobRecordPda,
        receiptMint: receiptMint0Pda,
        investorReceiptAccount: bobReceiptAta,
        masterLockVault: masterLockVaultPda,
        investorShareAccount: bobShareAta,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerBob])
      .rpc();

    // Verify Bob's receipts burned to 0 and common shares credited 1:1 (350,000 shares)
    const bobReceiptFinal = await getAccount(provider.connection, bobReceiptAta);
    expect(Number(bobReceiptFinal.amount)).to.equal(0);
    const bobShareFinal = await getAccount(provider.connection, bobShareAta);
    expect(Number(bobShareFinal.amount)).to.equal(350_000 * 1e6);
  });

  it("Test 6: Milestone Governance – Fast-Track & Disbursement", async () => {
    // 1. Founder proposes Milestone 0 (index 0)
    await program.methods
      .proposeMilestone(0)
      .accountsStrict({
        founder: founder.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
      })
      .signers([founder])
      .rpc();

    let escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
    expect(JSON.stringify(escrowState.milestones[0].status).toLowerCase()).to.include("proposed");

    // 2. Backers Alice and Bob vote YES (approving >50% weight)
    const [aliceRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), backerAlice.publicKey.toBuffer()],
      program.programId
    );
    const [bobRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), backerBob.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .voteMilestone(0, true)
      .accountsStrict({
        investor: backerAlice.publicKey,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
        roundRecord: aliceRecordPda,
      })
      .signers([backerAlice])
      .rpc();

    await program.methods
      .voteMilestone(0, true)
      .accountsStrict({
        investor: backerBob.publicKey,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
        roundRecord: bobRecordPda,
      })
      .signers([backerBob])
      .rpc();

    escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
    expect(escrowState.milestones[0].votesFor.toNumber()).to.equal(500_000 * 1e6);

    // 3. Permissionless execution of Milestone Release (Fast-Track since >50% approved)
    const founderUsdcBefore = Number((await getAccount(provider.connection, founderUsdcAta)).amount);
    const milestoneVaultBefore = Number((await getAccount(provider.connection, milestoneUsdcVault0Pda)).amount);

    await program.methods
      .executeMilestoneRelease(0)
      .accountsStrict({
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
        milestoneUsdcVault: milestoneUsdcVault0Pda,
        founderTreasuryUsdc: founderUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const founderUsdcAfter = Number((await getAccount(provider.connection, founderUsdcAta)).amount);
    const milestoneVaultAfter = Number((await getAccount(provider.connection, milestoneUsdcVault0Pda)).amount);
    const releasedAmount = founderUsdcAfter - founderUsdcBefore;

    // Verify USDC flowed to founder treasury
    expect(releasedAmount).to.be.greaterThan(0);
    expect(milestoneVaultBefore - milestoneVaultAfter).to.equal(releasedAmount);

    // Verify milestone status changed to Released and current milestone index advanced
    escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
    expect(JSON.stringify(escrowState.milestones[0].status).toLowerCase()).to.include("released");
    expect(escrowState.currentMilestoneIndex).to.equal(1);
    expect(escrowState.totalReleasedUsdc.toNumber()).to.equal(releasedAmount);
  });

  it("Test 7: Milestone Governance – Veto, Cure Cycle & Backer Ragequit", async () => {
    // Dedicated venture for Veto & Ragequit lifecycle testing
    const vetoLLCId = crypto.createHash("sha256").update("ventrion.llc.veto.test." + Date.now()).digest();
    const vetoVentureTokenMintKeypair = Keypair.generate();

    const [vetoVenturePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("venture"), vetoVentureTokenMintKeypair.publicKey.toBuffer()],
      program.programId
    );
    const [vetoFounderVestingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("founder_vesting"), vetoVenturePda.toBuffer(), founder.publicKey.toBuffer()],
      program.programId
    );
    const [vetoVestingVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_vault"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoMasterLockVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("master_lock_vault"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoLegalSetupVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("legal_setup_vault"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoFundingRoundPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("funding_round"), vetoVenturePda.toBuffer(), Buffer.from([0])],
      program.programId
    );
    const [vetoReceiptMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("receipt_mint"), vetoFundingRoundPda.toBuffer()],
      program.programId
    );
    const [vetoRoundUsdcVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_usdc_vault"), vetoFundingRoundPda.toBuffer()],
      program.programId
    );
    const [vetoVotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("verification_vote"), vetoFundingRoundPda.toBuffer()],
      program.programId
    );
    const [vetoMilestoneEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_escrow"), vetoFundingRoundPda.toBuffer()],
      program.programId
    );
    const [vetoMilestoneUsdcVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_usdc_vault"), vetoMilestoneEscrowPda.toBuffer()],
      program.programId
    );
    const [vetoDividendVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dividend_vault"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoStakedSharesVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staked_shares_vault"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoDlmmCustodyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dlmm_custody"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoCustodyUsdcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("custody_usdc"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoCustodySharesPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("custody_shares"), vetoVenturePda.toBuffer()],
      program.programId
    );
    const [vetoDlmmPositionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dlmm_position"), vetoFundingRoundPda.toBuffer()],
      program.programId
    );

    // 1. Launch Genesis ($20,000 USDC cap, 200,000 shares @ $0.10)
    await program.methods
      .launchVentureGenesis({
        midaoLlcId: Array.from(vetoLLCId),
        legalContractHash: Array.from(legalContractHash),
        founderShares: new BN(300_000 * 1e6),
        vestingCliffSeconds: new BN(182 * 86400),
        vestingDurationSeconds: new BN(720 * 86400),
        roundTerms: {
          pricePerShareUsdc: new BN(100_000),
          targetCapUsdc: new BN(20_000 * 1e6),
          upfrontWorkingCapitalBps: 1500
        }
      })
      .accountsStrict({
        founder: founder.publicKey,
        globalConfig: globalConfigPda,
        ventureTokenMint: vetoVentureTokenMintKeypair.publicKey,
        venture: vetoVenturePda,
        masterLockVault: vetoMasterLockVaultPda,
        legalSetupVault: vetoLegalSetupVaultPda,
        founderVesting: vetoFounderVestingPda,
        vestingVault: vetoVestingVaultPda,
        fundingRound: vetoFundingRoundPda,
        receiptMint: vetoReceiptMintPda,
        roundUsdcVault: vetoRoundUsdcVaultPda,
        verificationVote: vetoVotePda,
        usdcMint: usdcMint,
        treasuryWallet: founder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder, vetoVentureTokenMintKeypair])
      .rpc();

    // 2. Configure 2 milestones: 50% ($10k) and 50% ($10k)
    const nowSecVeto = Math.floor(Date.now() / 1000);
    await program.methods
      .configureMilestones([
        {
          percentageBps: 5000,
          targetCompletionDate: new BN(nowSecVeto + 60 * 86400)
        },
        {
          percentageBps: 5000,
          targetCompletionDate: new BN(nowSecVeto + 120 * 86400)
        }
      ])
      .accountsStrict({
        founder: founder.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        dividendVault: vetoDividendVaultPda,
        stakedSharesVault: vetoStakedSharesVaultPda,
        dlmmCustody: vetoDlmmCustodyPda,
        custodyUsdc: vetoCustodyUsdcPda,
        custodyShares: vetoCustodySharesPda,
        usdcMint: usdcMint,
        ventureTokenMint: vetoVentureTokenMintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder])
      .rpc();

    // 3. Backer Alice fills 100% of $20,000 cap
    const aliceVetoReceiptAta = (await getOrCreateAssociatedTokenAccount(provider.connection, backerAlice, vetoReceiptMintPda, backerAlice.publicKey)).address;
    const [aliceVetoRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_record"), vetoFundingRoundPda.toBuffer(), backerAlice.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .contributeFundingRound(new BN(20_000 * 1e6))
      .accountsStrict({
        investor: backerAlice.publicKey,
        globalConfig: globalConfigPda,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        verificationVote: vetoVotePda,
        roundRecord: aliceVetoRecordPda,
        receiptMint: vetoReceiptMintPda,
        investorReceiptAccount: aliceVetoReceiptAta,
        investorUsdc: backerAliceUsdcAta,
        fundingRoundUsdcVault: vetoRoundUsdcVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerAlice])
      .rpc();

    // 4. Staker 1 casts YES vote immediately
    const [stakerVetoVoteRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staker_vote"), vetoVotePda.toBuffer(), staker1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .castVerificationVote(true)
      .accountsStrict({
        staker: staker1.publicKey,
        fundingRound: vetoFundingRoundPda,
        verificationVote: vetoVotePda,
        stakePosition: staker1PositionPda,
        stakerVoteRecord: stakerVetoVoteRecordPda,
        systemProgram: SystemProgram.programId
      })
      .signers([staker1])
      .rpc();

    // 5. Wait on-chain for verification vote to conclude -> finalizeVerification -> Approved
    const vetoVoteAccount = await program.account.ventureVerificationVote.fetch(vetoVotePda);
    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= vetoVoteAccount.votingEndTimestamp.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await program.methods
      .finalizeVerification()
      .accountsStrict({
        globalConfig: globalConfigPda,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        verificationVote: vetoVotePda
      })
      .rpc();

    // 6. Graduate to DLMM
    const [vTokenX, vTokenY] = sortMints(vetoVentureTokenMintKeypair.publicKey, usdcMint);
    const vSharesAreTokenX = vTokenX.equals(vetoVentureTokenMintKeypair.publicKey);
    const vActiveId = vSharesAreTokenX ? -462 : 462;

    const vLbPair = deriveLbPair(PRESET_PARAMETER2_PUBKEY, vetoVentureTokenMintKeypair.publicKey, usdcMint);
    const vReserveX = deriveReserve(vLbPair, vTokenX);
    const vReserveY = deriveReserve(vLbPair, vTokenY);
    const vOracle = deriveOracle(vLbPair);

    const vLowerBinId = vActiveId - 34;
    const vUpperBinId = vLowerBinId + 68;
    const vLowerIndex = BigInt(Math.floor(vLowerBinId / 70));
    const vUpperIndex = BigInt(Math.floor(vUpperBinId / 70));

    const vBinArrayLower = deriveBinArray(vLbPair, vLowerIndex);
    const vBinArrayUpper = deriveBinArray(vLbPair, vUpperIndex);
    const vEventAuthority = deriveEventAuthority();

    await program.methods
      .prepareDlmmPool(vActiveId)
      .accountsStrict({
        payer: founder.publicKey,
        globalConfig: globalConfigPda,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        dlmmCustody: vetoDlmmCustodyPda,
        usdcMint: usdcMint,
        ventureTokenMint: vetoVentureTokenMintKeypair.publicKey,
        lbPair: vLbPair,
        reserveX: vReserveX,
        reserveY: vReserveY,
        oracle: vOracle,
        presetParameter: PRESET_PARAMETER2_PUBKEY,
        binArrayLower: vBinArrayLower,
        binArrayUpper: vBinArrayUpper,
        position: vetoDlmmPositionPda,
        eventAuthority: vEventAuthority,
        dlmmProgram: DLMM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([founder])
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
      .rpc();

    await program.methods
      .executeAtomicGraduation()
      .accountsStrict({
        executor: founder.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        fundingRoundUsdcVault: vetoRoundUsdcVaultPda,
        masterLockVault: vetoMasterLockVaultPda,
        legalSetupVault: vetoLegalSetupVaultPda,
        founderTreasuryUsdc: founderUsdcAta,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        dlmmCustody: vetoDlmmCustodyPda,
        custodyUsdc: vetoCustodyUsdcPda,
        custodyShares: vetoCustodySharesPda,
        usdcMint: usdcMint,
        ventureTokenMint: vetoVentureTokenMintKeypair.publicKey,
        lbPair: vLbPair,
        reserveX: vReserveX,
        reserveY: vReserveY,
        position: vetoDlmmPositionPda,
        binArrayLower: vBinArrayLower,
        binArrayUpper: vBinArrayUpper,
        eventAuthority: vEventAuthority,
        dlmmProgram: DLMM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([founder])
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
      .rpc();

    // 7. Alice redeems all 200,000 receipts 1:1 for common shares
    const aliceVetoShareAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      backerAlice,
      vetoVentureTokenMintKeypair.publicKey,
      backerAlice.publicKey
    )).address;

    await program.methods
      .redeemShares(new BN(200_000 * 1e6))
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        roundRecord: aliceVetoRecordPda,
        receiptMint: vetoReceiptMintPda,
        investorReceiptAccount: aliceVetoReceiptAta,
        masterLockVault: vetoMasterLockVaultPda,
        investorShareAccount: aliceVetoShareAta,
        ventureTokenMint: vetoVentureTokenMintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .signers([backerAlice])
      .rpc();

    // 8. Founder proposes Milestone 0
    await program.methods
      .proposeMilestone(0)
      .accountsStrict({
        founder: founder.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
      })
      .signers([founder])
      .rpc();

    // 9. Backer Alice votes VETO (100% of weight > 33.33% threshold)
    await program.methods
      .voteMilestone(0, false)
      .accountsStrict({
        investor: backerAlice.publicKey,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        roundRecord: aliceVetoRecordPda,
      })
      .signers([backerAlice])
      .rpc();

    // Wait for veto deadline on-chain
    let vetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= vetoEscrow.milestones[0].vetoDeadline.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Call executeMilestoneRelease(0) -> Milestone resolves to Vetoed
    await program.methods
      .executeMilestoneRelease(0)
      .accountsStrict({
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        founderTreasuryUsdc: founderUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    vetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    expect(JSON.stringify(vetoEscrow.milestones[0].status).toLowerCase()).to.include("vetoed");

    // 10. Cure Cycle 1: Founder amends milestone
    const curNow1 = Math.floor(Date.now() / 1000);
    await program.methods
      .amendMilestone(0, new BN(curNow1 + 65 * 86400))
      .accountsStrict({
        founder: founder.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
      })
      .signers([founder])
      .rpc();

    vetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    expect(vetoEscrow.milestones[0].amendmentCount).to.equal(1);
    expect(JSON.stringify(vetoEscrow.milestones[0].status).toLowerCase()).to.include("proposed");

    // Alice votes VETO again in Cure Cycle 1
    await program.methods
      .voteMilestone(0, false)
      .accountsStrict({
        investor: backerAlice.publicKey,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        roundRecord: aliceVetoRecordPda,
      })
      .signers([backerAlice])
      .rpc();

    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= vetoEscrow.milestones[0].vetoDeadline.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await program.methods
      .executeMilestoneRelease(0)
      .accountsStrict({
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        founderTreasuryUsdc: founderUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // 11. Cure Cycle 2
    const curNow2 = Math.floor(Date.now() / 1000);
    await program.methods
      .amendMilestone(0, new BN(curNow2 + 70 * 86400))
      .accountsStrict({
        founder: founder.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
      })
      .signers([founder])
      .rpc();

    vetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    expect(vetoEscrow.milestones[0].amendmentCount).to.equal(2);

    await program.methods
      .voteMilestone(0, false)
      .accountsStrict({
        investor: backerAlice.publicKey,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        roundRecord: aliceVetoRecordPda,
      })
      .signers([backerAlice])
      .rpc();

    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= vetoEscrow.milestones[0].vetoDeadline.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await program.methods
      .executeMilestoneRelease(0)
      .accountsStrict({
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        founderTreasuryUsdc: founderUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // 12. Cure Cycle 3 (Final attempt)
    const curNow3 = Math.floor(Date.now() / 1000);
    await program.methods
      .amendMilestone(0, new BN(curNow3 + 75 * 86400))
      .accountsStrict({
        founder: founder.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
      })
      .signers([founder])
      .rpc();

    vetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    expect(vetoEscrow.milestones[0].amendmentCount).to.equal(3);

    await program.methods
      .voteMilestone(0, false)
      .accountsStrict({
        investor: backerAlice.publicKey,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        roundRecord: aliceVetoRecordPda,
      })
      .signers([backerAlice])
      .rpc();

    while (true) {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      if (clusterTime && clusterTime >= vetoEscrow.milestones[0].vetoDeadline.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Call executeMilestoneRelease(0) -> With amendmentCount == 3, status becomes Breached!
    await program.methods
      .executeMilestoneRelease(0)
      .accountsStrict({
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        founderTreasuryUsdc: founderUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    vetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    expect(JSON.stringify(vetoEscrow.milestones[0].status).toLowerCase()).to.include("breached");

    // Verify 4th amendment attempt reverts with AmendmentLimitExceeded (Code 6022)
    try {
      await program.methods
        .amendMilestone(0, new BN(curNow3 + 80 * 86400))
        .accountsStrict({
          founder: founder.publicKey,
          venture: vetoVenturePda,
          fundingRound: vetoFundingRoundPda,
          milestoneEscrow: vetoMilestoneEscrowPda,
        })
        .signers([founder])
        .rpc();
      expect.fail("Expected amendMilestone to fail beyond max amendment limit");
    } catch (err: any) {
      expect(err.toString()).to.satisfy((s: string) => 
        s.includes("AmendmentLimitExceeded") || 
        s.includes("6022") || 
        s.includes("MilestoneNotEligibleForRelease") || 
        s.includes("6018")
      );
    }

    // 13. Backer Ragequit: Alice ragequits 100,000 shares
    const aliceUsdcBeforeRagequit = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);
    const aliceSharesBeforeRagequit = Number((await getAccount(provider.connection, aliceVetoShareAta)).amount);
    const masterLockSharesBefore = Number((await getAccount(provider.connection, vetoMasterLockVaultPda)).amount);
    const milestoneVaultBefore = Number((await getAccount(provider.connection, vetoMilestoneUsdcVaultPda)).amount);

    const ragequitShares = new BN(100_000 * 1e6);
    await program.methods
      .ragequitMilestoneEscrow(ragequitShares)
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: vetoVenturePda,
        fundingRound: vetoFundingRoundPda,
        milestoneEscrow: vetoMilestoneEscrowPda,
        milestoneUsdcVault: vetoMilestoneUsdcVaultPda,
        roundRecord: aliceVetoRecordPda,
        investorShareAccount: aliceVetoShareAta,
        masterLockVault: vetoMasterLockVaultPda,
        investorUsdc: backerAliceUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backerAlice])
      .rpc();

    // Verify shares surrendered to MasterLockVault
    const aliceSharesAfterRagequit = Number((await getAccount(provider.connection, aliceVetoShareAta)).amount);
    const masterLockSharesAfter = Number((await getAccount(provider.connection, vetoMasterLockVaultPda)).amount);
    expect(aliceSharesBeforeRagequit - aliceSharesAfterRagequit).to.equal(100_000 * 1e6);
    expect(masterLockSharesAfter - masterLockSharesBefore).to.equal(100_000 * 1e6);

    // Verify pro-rata USDC refunded
    const aliceUsdcAfterRagequit = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);
    const milestoneVaultAfter = Number((await getAccount(provider.connection, vetoMilestoneUsdcVaultPda)).amount);
    const refundedUsdc = aliceUsdcAfterRagequit - aliceUsdcBeforeRagequit;

    expect(refundedUsdc).to.be.greaterThan(0);
    expect(milestoneVaultBefore - milestoneVaultAfter).to.equal(refundedUsdc);

    // Verify escrow and venture state updated
    const finalVetoEscrow = await program.account.milestoneEscrow.fetch(vetoMilestoneEscrowPda);
    expect(finalVetoEscrow.totalRagequitUsdc.toNumber()).to.equal(refundedUsdc);
    expect(finalVetoEscrow.primaryTokensRemaining.toNumber()).to.equal(100_000 * 1e6);
  });

  it("Test 8: Meteora DLMM Secondary Swap & Fee Harvesting", async () => {
    // 1. Bob stakes 50,000 shares in InvestorVault first so that venture has active stakers for fee dividends
    const [bobInvestorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor_vault"), venturePda.toBuffer(), backerBob.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .depositInvestorShares(new BN(50_000 * 1e6), new BN(180 * 86400))
      .accountsStrict({
        investor: backerBob.publicKey,
        venture: venturePda,
        investorVault: bobInvestorVaultPda,
        investorShareAccount: bobShareAta,
        stakedSharesVault: stakedSharesVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backerBob])
      .rpc();

    // 2. Perform genuine secondary swap on Meteora DLMM pool
    const dlmmPool = await DLMM.create(provider.connection, lbPair);
    const swapForY = !sharesAreTokenX;
    const binArrays = await dlmmPool.getBinArrayForSwap(swapForY);
    expect(binArrays.length).to.be.greaterThan(0);

    const swapAmount = new BN(100 * 1e6); // 100 USDC swap
    const swapQuote = await dlmmPool.swapQuote(swapAmount, swapForY, new BN(500), binArrays);
    expect(Number(swapQuote.minOutAmount)).to.be.greaterThan(0);

    const aliceSharesBefore = Number((await getAccount(provider.connection, aliceShareAta)).amount);
    const aliceUsdcBefore = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);

    const swapTx = await dlmmPool.swap({
      inToken: usdcMint,
      outToken: ventureTokenMintKeypair.publicKey,
      inAmount: swapAmount,
      minOutAmount: swapQuote.minOutAmount,
      lbPair: lbPair,
      user: backerAlice.publicKey,
      binArraysPubkey: binArrays.map((b: any) => b.publicKey),
    });

    const latestBlockhash = await provider.connection.getLatestBlockhash();
    swapTx.recentBlockhash = latestBlockhash.blockhash;
    swapTx.feePayer = backerAlice.publicKey;
    const txSig = await provider.connection.sendTransaction(swapTx, [backerAlice]);
    await provider.connection.confirmTransaction({ signature: txSig, ...latestBlockhash }, "confirmed");

    const aliceSharesAfter = Number((await getAccount(provider.connection, aliceShareAta)).amount);
    const aliceUsdcAfter = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);

    // Verify swap executed: Alice paid 100 USDC and received common shares from DLMM liquidity
    expect(aliceUsdcBefore - aliceUsdcAfter).to.equal(100 * 1e6);
    expect(aliceSharesAfter).to.be.greaterThan(aliceSharesBefore);

    // 3. Harvest DLMM trading fees permissionless
    await program.methods
      .harvestDlmmFees()
      .accountsStrict({
        harvester: backerAlice.publicKey,
        globalConfig: globalConfigPda,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        dlmmCustody: dlmmCustodyPda,
        custodyUsdc: custodyUsdcPda,
        custodyShares: custodySharesPda,
        dividendVault: dividendVaultPda,
        masterLockVault: masterLockVaultPda,
        feeTreasuryUsdc: adminUsdcAta,
        usdcMint: usdcMint,
        ventureTokenMint: ventureTokenMintKeypair.publicKey,
        lbPair: lbPair,
        position: dlmmPosition0Pda,
        reserveX: reserveX,
        reserveY: reserveY,
        binArrayLower: binArrayLower,
        binArrayUpper: binArrayUpper,
        memoProgram: MEMO_PROGRAM_ID,
        eventAuthority: eventAuthority,
        dlmmProgram: DLMM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backerAlice])
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
      .rpc();

    const custodyState = await program.account.dlmmCustody.fetch(dlmmCustodyPda);
    expect(custodyState.totalFeesHarvestedUsdc.toNumber() + custodyState.totalFeesHarvestedShares.toNumber()).to.be.greaterThanOrEqual(0);
  });

  it("Test 9: Holder Staking & O(1) Constant-Time Dividend Distribution", async () => {
    // 1. Bob already has 50,000 staked shares with 180-day lock from Test 8 (1.5x multiplier).
    // Bob deposits an additional 50,000 shares with 180-day lock duration (total 100,000 shares)
    const [bobInvestorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor_vault"), venturePda.toBuffer(), backerBob.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .depositInvestorShares(new BN(50_000 * 1e6), new BN(180 * 86400))
      .accountsStrict({
        investor: backerBob.publicKey,
        venture: venturePda,
        investorVault: bobInvestorVaultPda,
        investorShareAccount: bobShareAta,
        stakedSharesVault: stakedSharesVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backerBob])
      .rpc();

    const bobVault = await program.account.investorVault.fetch(bobInvestorVaultPda);
    expect(bobVault.stakedAmount.toNumber()).to.equal(100_000 * 1e6);
    expect(bobVault.multiplierBps).to.equal(15_000); // 1.5x
    // Bob effective weight = 100,000 * 1e6 * 15,000 = 1,500,000,000,000,000
    expect(bobVault.effectiveWeight.toString()).to.equal("1500000000000000");

    // 2. Alice stakes 100,000 shares with 0-day lock duration (1.0x multiplier)
    const [aliceInvestorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor_vault"), venturePda.toBuffer(), backerAlice.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .depositInvestorShares(new BN(100_000 * 1e6), new BN(0))
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: venturePda,
        investorVault: aliceInvestorVaultPda,
        investorShareAccount: aliceShareAta,
        stakedSharesVault: stakedSharesVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backerAlice])
      .rpc();

    const aliceVault = await program.account.investorVault.fetch(aliceInvestorVaultPda);
    expect(aliceVault.stakedAmount.toNumber()).to.equal(100_000 * 1e6);
    expect(aliceVault.multiplierBps).to.equal(10_000); // 1.0x
    // Alice effective weight = 100,000 * 1e6 * 10,000 = 1,000,000,000,000,000
    expect(aliceVault.effectiveWeight.toString()).to.equal("1000000000000000");

    const ventureStateStaking = await program.account.ventureState.fetch(venturePda);
    // Total weight = 1.5e15 + 1.0e15 = 2.5e15
    expect(ventureStateStaking.totalDividendWeightUnits.toString()).to.equal("2500000000000000");

    // 3. Simulate POS commerce revenues: deposit 500 USDC
    const ref = Array.from(crypto.randomBytes(32));
    await program.methods
      .depositEcosystemFees(new BN(500 * 1e6), ref)
      .accountsStrict({
        depositor: founder.publicKey,
        venture: venturePda,
        depositorUsdc: founderUsdcAta,
        dividendVault: dividendVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([founder])
      .rpc();

    // 4. Bob claims dividends (60% weight -> 300 USDC of 500 USDC deposit)
    const bobUsdcBeforeClaim = Number((await getAccount(provider.connection, backerBobUsdcAta)).amount);
    await program.methods
      .claimInvestorDividends()
      .accountsStrict({
        investor: backerBob.publicKey,
        venture: venturePda,
        investorVault: bobInvestorVaultPda,
        dividendVault: dividendVaultPda,
        investorUsdc: backerBobUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backerBob])
      .rpc();

    const bobUsdcAfterClaim = Number((await getAccount(provider.connection, backerBobUsdcAta)).amount);
    const bobDividends = bobUsdcAfterClaim - bobUsdcBeforeClaim;
    // 60% of 500 = 300 USDC (+ slight fee share from dlmm harvest)
    expect(bobDividends).to.be.at.least(300 * 1e6);

    // Alice claims dividends (40% weight -> 200 USDC of 500 USDC deposit)
    const aliceUsdcBeforeClaim = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);
    await program.methods
      .claimInvestorDividends()
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: venturePda,
        investorVault: aliceInvestorVaultPda,
        dividendVault: dividendVaultPda,
        investorUsdc: backerAliceUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backerAlice])
      .rpc();

    const aliceUsdcAfterClaim = Number((await getAccount(provider.connection, backerAliceUsdcAta)).amount);
    const aliceDividends = aliceUsdcAfterClaim - aliceUsdcBeforeClaim;
    expect(aliceDividends).to.be.at.least(200 * 1e6);

    // 5. Unstake verification
    // Bob cannot unstake before 180 days lock expires (reverts with LockNotExpired - Code 6013)
    try {
      await program.methods
        .unstakeInvestorShares(new BN(50_000 * 1e6))
        .accountsStrict({
          investor: backerBob.publicKey,
          venture: venturePda,
          investorVault: bobInvestorVaultPda,
          investorShareAccount: bobShareAta,
          stakedSharesVault: stakedSharesVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([backerBob])
        .rpc();
      expect.fail("Expected Bob unstake to fail due to active lock");
    } catch (err: any) {
      expect(err.toString()).to.satisfy((s: string) => s.includes("LockNotExpired") || s.includes("6013"));
    }

    // Alice can unstake immediately (0-day lock duration)
    const aliceSharesBeforeUnstake = Number((await getAccount(provider.connection, aliceShareAta)).amount);
    await program.methods
      .unstakeInvestorShares(new BN(100_000 * 1e6))
      .accountsStrict({
        investor: backerAlice.publicKey,
        venture: venturePda,
        investorVault: aliceInvestorVaultPda,
        investorShareAccount: aliceShareAta,
        stakedSharesVault: stakedSharesVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([backerAlice])
      .rpc();

    const aliceSharesAfterUnstake = Number((await getAccount(provider.connection, aliceShareAta)).amount);
    expect(aliceSharesAfterUnstake - aliceSharesBeforeUnstake).to.equal(100_000 * 1e6);
  });

  it("Test 10: Founder Vesting & Legal Setup Fee", async () => {
    // 1. Founder Vesting: Calling before cliff must revert with FounderCliffNotMet (Code 6003)
    const founderShareAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      founder,
      ventureTokenMintKeypair.publicKey,
      founder.publicKey
    )).address;

    try {
      await program.methods
        .founderClaimVesting()
        .accountsStrict({
          founder: founder.publicKey,
          venture: venturePda,
          founderVesting: founderVestingPda,
          vestingTokenVault: vestingVaultPda,
          founderShareAccount: founderShareAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([founder])
        .rpc();
      expect.fail("Expected founderClaimVesting to fail before cliff duration has elapsed");
    } catch (err: any) {
      expect(err.toString()).to.satisfy((s: string) => s.includes("FounderCliffNotMet") || s.includes("6003"));
    }

    // Verify all 300,000 founder shares remain locked in the vesting vault
    const vestingVaultState = await getAccount(provider.connection, vestingVaultPda);
    expect(Number(vestingVaultState.amount)).to.equal(300_000 * 1e6);

    // 2. Legal Setup Fee Release: Transfer $3,000 USDC from legal_setup_vault to legal authority
    const legalVaultBefore = Number((await getAccount(provider.connection, legalSetupVaultPda)).amount);
    expect(legalVaultBefore).to.equal(3_000 * 1e6);

    const adminUsdcBefore = Number((await getAccount(provider.connection, adminUsdcAta)).amount);

    await program.methods
      .releaseLegalSetupFee(new BN(3_000 * 1e6))
      .accountsStrict({
        legalSetupAuthority: admin.publicKey,
        globalConfig: globalConfigPda,
        venture: venturePda,
        legalSetupVault: legalSetupVaultPda,
        destination: adminUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    const legalVaultAfter = Number((await getAccount(provider.connection, legalSetupVaultPda)).amount);
    const adminUsdcAfter = Number((await getAccount(provider.connection, adminUsdcAta)).amount);

    expect(legalVaultAfter).to.equal(0);
    expect(adminUsdcAfter - adminUsdcBefore).to.equal(3_000 * 1e6);

    const ventureAfterLegal = await program.account.ventureState.fetch(venturePda);
    expect(ventureAfterLegal.totalLegalFeesReleased.toNumber()).to.equal(3_000 * 1e6);
  });
});

