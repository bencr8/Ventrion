import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  ComputeBudgetProgram,
  Connection,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint
} from "@solana/spl-token";
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

export const DLMM_PROGRAM_ID = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
export const DEVNET_PRESET_PARAMETER = new PublicKey("4vP4DFDJLRz85NBCfJALYPNdieWwzQSstrUuTms1gekn");
export const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

function sortMints(tokenA: PublicKey, tokenB: PublicKey): [PublicKey, PublicKey] {
  return Buffer.compare(tokenA.toBuffer(), tokenB.toBuffer()) < 0
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

function deriveLbPair(preset: PublicKey, tokenA: PublicKey, tokenB: PublicKey): PublicKey {
  const [tokenX, tokenY] = sortMints(tokenA, tokenB);
  return PublicKey.findProgramAddressSync(
    [preset.toBuffer(), tokenX.toBuffer(), tokenY.toBuffer()],
    DLMM_PROGRAM_ID
  )[0];
}

function deriveReserve(lbPair: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [lbPair.toBuffer(), mint.toBuffer()],
    DLMM_PROGRAM_ID
  )[0];
}

function deriveOracle(lbPair: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("oracle"), lbPair.toBuffer()],
    DLMM_PROGRAM_ID
  )[0];
}

function deriveBinArray(lbPair: PublicKey, index: bigint): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(index, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bin_array"), lbPair.toBuffer(), buf],
    DLMM_PROGRAM_ID
  )[0];
}

function deriveEventAuthority(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    DLMM_PROGRAM_ID
  )[0];
}

async function sendWithRetry(actionName: string, fn: () => Promise<string>, maxRetries = 10): Promise<string> {
  let delay = 3000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Executing] ${actionName}...`);
      const tx = await fn();
      console.log(`[Success] ${actionName} -> Tx: ${tx}`);
      await new Promise((r) => setTimeout(r, 2000));
      return tx;
    } catch (err: any) {
      const errStr = err.toString();
      if (
        errStr.includes("429") ||
        errStr.includes("Too Many Requests") ||
        errStr.includes("blockhash not found") ||
        errStr.includes("Node is behind")
      ) {
        console.warn(`[Retry ${attempt}/${maxRetries}] ${actionName} transient error... waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 1.5, 20000);
      } else {
        throw err;
      }
    }
  }
  throw new Error(`Exceeded max retries for ${actionName}`);
}

function parseMetaplexMetadata(buffer: Buffer) {
  let offset = 1 + 32 + 32; // key (1) + update_auth (32) + mint (32)
  const nameLen = buffer.readUInt32LE(offset);
  offset += 4;
  const name = buffer.subarray(offset, offset + nameLen).toString("utf8").replace(/\0/g, "").trim();
  offset += nameLen;

  const symbolLen = buffer.readUInt32LE(offset);
  offset += 4;
  const symbol = buffer.subarray(offset, offset + symbolLen).toString("utf8").replace(/\0/g, "").trim();
  offset += symbolLen;

  const uriLen = buffer.readUInt32LE(offset);
  offset += 4;
  const uri = buffer.subarray(offset, offset + uriLen).toString("utf8").replace(/\0/g, "").trim();

  return { name, symbol, uri };
}

async function main() {
  console.log("================================================================================");
  console.log("🚀 VENTRION PROTOCOL: LAUNCH NEW COMPANY WITH ON-CHAIN METAPLEX METADATA");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`Connecting to Solana Devnet RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load deployer keypair
  const keypairPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  console.log(`Deployer / Founder Address: ${deployer.publicKey.toBase58()}`);

  const balanceLamports = await connection.getBalance(deployer.publicKey);
  console.log(`Deployer SOL Balance: ${(balanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load IDL
  const idlPath = path.resolve(__dirname, "..", "target", "idl", "ventrion_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
  const program = new Program(idl, provider);

  const usdcMint = new PublicKey("5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt");
  const ventMint = new PublicKey("5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ");

  const [globalConfigPda] = PublicKey.findProgramAddressSync([Buffer.from("global_config")], programId);
  const [stakerPositionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vent_stake"), deployer.publicKey.toBuffer()],
    programId
  );

  // Check or generate Company Keypair
  const companyKeypairPath = path.resolve(__dirname, "..", ".qcmp_company_mint.json");
  let companyMintKeypair: Keypair;
  if (fs.existsSync(companyKeypairPath)) {
    companyMintKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(companyKeypairPath, "utf-8"))));
    console.log(`Loaded existing Company Mint Keypair: ${companyMintKeypair.publicKey.toBase58()}`);
  } else {
    companyMintKeypair = Keypair.generate();
    fs.writeFileSync(companyKeypairPath, JSON.stringify(Array.from(companyMintKeypair.secretKey)));
    console.log(`Generated new Company Mint Keypair: ${companyMintKeypair.publicKey.toBase58()}`);
  }

  const companyMint = companyMintKeypair.publicKey;
  const companyName = "QuantumCompute Systems";
  const companySymbol = "QCMP";
  const companyUri = "https://files.catbox.moe/ofu899.json";

  console.log(`\n--- Company Metadata Details ---`);
  console.log(`Name:   ${companyName}`);
  console.log(`Symbol: ${companySymbol}`);
  console.log(`URI:    ${companyUri}`);
  console.log(`Mint:   ${companyMint.toBase58()}`);

  // Derive PDAs
  const [venturePda] = PublicKey.findProgramAddressSync([Buffer.from("venture"), companyMint.toBuffer()], programId);
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("master_lock_vault"), venturePda.toBuffer()], programId);
  const [legalSetupVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("legal_setup_vault"), venturePda.toBuffer()], programId);
  const [founderVestingPda] = PublicKey.findProgramAddressSync([Buffer.from("founder_vesting"), venturePda.toBuffer(), deployer.publicKey.toBuffer()], programId);
  const [vestingVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vesting_vault"), venturePda.toBuffer()], programId);
  const [fundingRound0Pda] = PublicKey.findProgramAddressSync([Buffer.from("funding_round"), venturePda.toBuffer(), Buffer.from([0])], programId);
  const [receiptMint0Pda] = PublicKey.findProgramAddressSync([Buffer.from("receipt_mint"), fundingRound0Pda.toBuffer()], programId);
  const [roundUsdcVault0Pda] = PublicKey.findProgramAddressSync([Buffer.from("round_usdc_vault"), fundingRound0Pda.toBuffer()], programId);
  const [verificationVote0Pda] = PublicKey.findProgramAddressSync([Buffer.from("verification_vote"), fundingRound0Pda.toBuffer()], programId);

  // Metaplex Metadata PDA
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METAPLEX_PROGRAM_ID.toBuffer(), companyMint.toBuffer()],
    METAPLEX_PROGRAM_ID
  );
  console.log(`Metaplex Metadata PDA: ${metadataPda.toBase58()}`);

  // Derived Milestone & DLMM PDAs
  const [milestoneEscrow0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_escrow"), fundingRound0Pda.toBuffer()], programId);
  const [milestoneUsdcVault0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_usdc_vault"), milestoneEscrow0Pda.toBuffer()], programId);
  const [dividendVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault"), venturePda.toBuffer()], programId);
  const [stakedSharesVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("staked_shares_vault"), venturePda.toBuffer()], programId);
  const [dlmmCustodyPda] = PublicKey.findProgramAddressSync([Buffer.from("dlmm_custody"), venturePda.toBuffer()], programId);
  const [custodyUsdcPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_usdc"), venturePda.toBuffer()], programId);
  const [custodySharesPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_shares"), venturePda.toBuffer()], programId);
  const [dlmmPosition0Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("dlmm_position"), fundingRound0Pda.toBuffer()],
    programId
  );

  const results: Record<string, string> = {};

  // Check if venture already exists
  let ventureExists = false;
  try {
    const vState = await program.account.ventureState.fetch(venturePda);
    ventureExists = true;
    console.log(`Venture account already exists on Devnet with status: ${JSON.stringify(vState.status)}`);
  } catch {
    console.log("Venture does not exist yet. Proceeding with Launch Genesis with Metadata...");
  }

  // ---------------------------------------------------------------------------
  // STEP 1: LAUNCH VENTURE GENESIS WITH METADATA
  // ---------------------------------------------------------------------------
  if (!ventureExists) {
    const midaoLLCId = crypto.createHash("sha256").update("quantumcompute.midao.dao.llc").digest();
    const legalContractHash = crypto.createHash("sha256").update("quantumcompute.operating.agreement.v1").digest();
    const founderShares = new BN(300_000 * 1e6); // 300,000 shares
    const flatPriceUsdc = new BN(100_000); // 0.10 USDC per share
    const targetCapUsdc = new BN(20_000 * 1e6); // 20,000 USDC (200,000 shares)

    console.log("\n=======================================================");
    console.log("🔥 CALLING launch_venture_genesis_with_metadata");
    console.log("=======================================================");

    const genesisTx = await sendWithRetry("Launch Venture Genesis with Metaplex Metadata", () =>
      program.methods
        .launchVentureGenesisWithMetadata(
          companyName,
          companySymbol,
          companyUri,
          {
            midaoLlcId: Array.from(midaoLLCId),
            legalContractHash: Array.from(legalContractHash),
            founderShares: founderShares,
            vestingCliffSeconds: new BN(182 * 86400),
            vestingDurationSeconds: new BN(730 * 86400),
            roundTerms: {
              pricePerShareUsdc: flatPriceUsdc,
              targetCapUsdc: targetCapUsdc,
              upfrontWorkingCapitalBps: 1500 // 15%
            }
          }
        )
        .accountsStrict({
          founder: deployer.publicKey,
          globalConfig: globalConfigPda,
          ventureTokenMint: companyMintKeypair.publicKey,
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
          treasuryWallet: deployer.publicKey,
          metadata: metadataPda,
          tokenMetadataProgram: METAPLEX_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .signers([deployer, companyMintKeypair])
        .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 })])
        .rpc()
    );
    results["1_launch_genesis_with_metadata"] = genesisTx;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: VERIFY METAPLEX METADATA ON-CHAIN
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🔍 AUDITING ON-CHAIN METAPLEX TOKEN METADATA");
  console.log("=======================================================");
  const metadataAccountInfo = await connection.getAccountInfo(metadataPda);
  if (!metadataAccountInfo) {
    throw new Error(`CRITICAL: Metadata account ${metadataPda.toBase58()} was not created!`);
  }
  console.log(`✅ Metaplex Metadata Account Owner: ${metadataAccountInfo.owner.toBase58()}`);
  console.log(`✅ Metaplex Metadata Data Length:  ${metadataAccountInfo.data.length} bytes`);

  const decodedMeta = parseMetaplexMetadata(metadataAccountInfo.data);
  console.log(`✅ On-Chain Token Name:   "${decodedMeta.name}"`);
  console.log(`✅ On-Chain Token Symbol: "${decodedMeta.symbol}"`);
  console.log(`✅ On-Chain Token URI:    "${decodedMeta.uri}"`);

  // Verify Mint Authority Revoked & Total Supply
  const mintInfo = await getMint(connection, companyMint);
  console.log(`✅ Token Total Supply: ${Number(mintInfo.supply) / 1e6} ${decodedMeta.symbol}`);
  console.log(`✅ Mint Authority Status: ${mintInfo.mintAuthority === null ? "REVOKED (null) - IMMUTABLE!" : mintInfo.mintAuthority.toBase58()}`);

  // ---------------------------------------------------------------------------
  // STEP 3: CONFIGURE MILESTONES
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🎯 STEP 3: CONFIGURE MILESTONES");
  console.log("=======================================================");
  let ventureState = await program.account.ventureState.fetch(venturePda);
  const statusStr = JSON.stringify(ventureState.status).toLowerCase();

  if (statusStr.includes("genesisinitialized")) {
    const nowSec = Math.floor(Date.now() / 1000);
    const milestones = [
      { percentageBps: 3000, targetCompletionDate: new BN(nowSec + 30 * 86400) },
      { percentageBps: 3000, targetCompletionDate: new BN(nowSec + 60 * 86400) },
      { percentageBps: 4000, targetCompletionDate: new BN(nowSec + 90 * 86400) }
    ];

    const configMilestonesTx = await sendWithRetry("Configure Milestones", () =>
      program.methods
        .configureMilestones(milestones)
        .accountsStrict({
          founder: deployer.publicKey,
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
          ventureTokenMint: companyMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .rpc()
    );
    results["2_configure_milestones"] = configMilestonesTx;
  }

  ventureState = await program.account.ventureState.fetch(venturePda);
  console.log(`Venture status after Milestone config: ${JSON.stringify(ventureState.status)}`);

  // ---------------------------------------------------------------------------
  // STEP 4: CONTRIBUTE PRIMARY SALE (FILL 100% OF HARDCAP)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("💰 STEP 4: PRIMARY SALE ON FLAT CURVE");
  console.log("=======================================================");
  const deployerUsdcAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, usdcMint, deployer.publicKey)).address;
  const deployerReceiptAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, receiptMint0Pda, deployer.publicKey)).address;
  const [deployerRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), deployer.publicKey.toBuffer()],
    programId
  );

  let roundState = await program.account.fundingRound.fetch(fundingRound0Pda);
  console.log(`Round Status: ${JSON.stringify(roundState.roundStatus)}, Total Raised: ${Number(roundState.totalRaisedUsdc) / 1e6} USDC`);

  if (Number(roundState.totalRaisedUsdc) < 20_000 * 1e6) {
    const contributionNeeded = new BN(20_000 * 1e6).sub(roundState.totalRaisedUsdc);
    console.log(`Contributing ${Number(contributionNeeded) / 1e6} USDC to fill 100% of hard cap...`);

    const contributeTx = await sendWithRetry("Contribute to Primary Round", () =>
      program.methods
        .contributeFundingRound(contributionNeeded)
        .accountsStrict({
          investor: deployer.publicKey,
          globalConfig: globalConfigPda,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          verificationVote: verificationVote0Pda,
          roundRecord: deployerRecordPda,
          receiptMint: receiptMint0Pda,
          investorReceiptAccount: deployerReceiptAta,
          investorUsdc: deployerUsdcAta,
          fundingRoundUsdcVault: roundUsdcVault0Pda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .rpc()
    );
    results["3_contribute_primary_round"] = contributeTx;
  }

  roundState = await program.account.fundingRound.fetch(fundingRound0Pda);
  console.log(`Round status after contribution: ${JSON.stringify(roundState.roundStatus)}`);

  // ---------------------------------------------------------------------------
  // STEP 5: VERIFICATION GOVERNANCE VOTE & FINALIZATION
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🗳️ STEP 5: VERIFICATION GOVERNANCE BALLOT");
  console.log("=======================================================");
  const [stakerVoteRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("staker_vote"), verificationVote0Pda.toBuffer(), deployer.publicKey.toBuffer()],
    programId
  );

  let voteRecordExists = false;
  try {
    const rec = await program.account.stakerVotingRecord.fetch(stakerVoteRecordPda);
    voteRecordExists = true;
    console.log(`Staker vote already cast: YES=${rec.voteYes}`);
  } catch {
    console.log("Casting Staker YES Vote...");
  }

  if (!voteRecordExists) {
    const voteTx = await sendWithRetry("Cast Verification Vote (YES)", () =>
      program.methods
        .castVerificationVote(true)
        .accountsStrict({
          staker: deployer.publicKey,
          fundingRound: fundingRound0Pda,
          verificationVote: verificationVote0Pda,
          stakePosition: stakerPositionPda,
          stakerVoteRecord: stakerVoteRecordPda,
          systemProgram: SystemProgram.programId
        })
        .rpc()
    );
    results["4_cast_verification_vote"] = voteTx;
  }

  // Finalize verification if not already approved
  roundState = await program.account.fundingRound.fetch(fundingRound0Pda);
  const roundStatusStr = JSON.stringify(roundState.roundStatus).toLowerCase();

  if (!roundStatusStr.includes("verifiedapproved") && !roundStatusStr.includes("graduateddlmmlive") && !roundStatusStr.includes("graduated")) {
    console.log("Finalizing verification ballot on-chain...");
    const finalizeTx = await sendWithRetry("Finalize Verification Ballot", () =>
      program.methods
        .finalizeVerification()
        .accountsStrict({
          globalConfig: globalConfigPda,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          verificationVote: verificationVote0Pda
        })
        .rpc()
    );
    results["5_finalize_verification"] = finalizeTx;
  }

  ventureState = await program.account.ventureState.fetch(venturePda);
  console.log(`Venture Status after Verification: ${JSON.stringify(ventureState.status)}`);

  // ---------------------------------------------------------------------------
  // STEP 6: PREPARE METEORA DLMM POOL
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🌊 STEP 6: METEORA DLMM POOL INITIALIZATION & PREPARATION");
  console.log("=======================================================");
  const [tokenX, tokenY] = sortMints(companyMint, usdcMint);
  const sharesAreTokenX = tokenX.equals(companyMint);
  const activeId = sharesAreTokenX ? -2304 : 2304;

  const lbPair = deriveLbPair(DEVNET_PRESET_PARAMETER, companyMint, usdcMint);
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

  console.log(`Meteora LB Pair: ${lbPair.toBase58()}`);
  console.log(`Active Bin ID:   ${activeId}`);
  console.log(`Token X:         ${tokenX.toBase58()}`);
  console.log(`Token Y:         ${tokenY.toBase58()}`);

  roundState = await program.account.fundingRound.fetch(fundingRound0Pda);
  if (!roundState.dlmmPrepared) {
    const prepareTx = await sendWithRetry("Prepare DLMM Pool via CPI", () =>
      program.methods
        .prepareDlmmPool(activeId)
        .accountsStrict({
          payer: deployer.publicKey,
          globalConfig: globalConfigPda,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          dlmmCustody: dlmmCustodyPda,
          usdcMint: usdcMint,
          ventureTokenMint: companyMint,
          lbPair: lbPair,
          reserveX: reserveX,
          reserveY: reserveY,
          oracle: oracle,
          presetParameter: DEVNET_PRESET_PARAMETER,
          binArrayLower: binArrayLower,
          binArrayUpper: binArrayUpper,
          position: dlmmPosition0Pda,
          eventAuthority: eventAuthority,
          dlmmProgram: DLMM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
        .rpc()
    );
    results["6_prepare_dlmm_pool"] = prepareTx;
  }

  // ---------------------------------------------------------------------------
  // STEP 7: EXECUTE ATOMIC GRADUATION
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🎓 STEP 7: EXECUTE ATOMIC GRADUATION");
  console.log("=======================================================");
  ventureState = await program.account.ventureState.fetch(venturePda);
  const ventStatusStr = JSON.stringify(ventureState.status).toLowerCase();

  if (!ventStatusStr.includes("graduateddlmmlive")) {
    const graduationTx = await sendWithRetry("Execute Atomic Graduation", () =>
      program.methods
        .executeAtomicGraduation()
        .accountsStrict({
          executor: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
          fundingRoundUsdcVault: roundUsdcVault0Pda,
          masterLockVault: masterLockVaultPda,
          legalSetupVault: legalSetupVaultPda,
          founderTreasuryUsdc: deployerUsdcAta,
          milestoneUsdcVault: milestoneUsdcVault0Pda,
          dlmmCustody: dlmmCustodyPda,
          custodyUsdc: custodyUsdcPda,
          custodyShares: custodySharesPda,
          usdcMint: usdcMint,
          ventureTokenMint: companyMint,
          lbPair: lbPair,
          position: dlmmPosition0Pda,
          reserveX: reserveX,
          reserveY: reserveY,
          binArrayLower: binArrayLower,
          binArrayUpper: binArrayUpper,
          tokenX: tokenX,
          tokenY: tokenY,
          eventAuthority: eventAuthority,
          dlmmProgram: DLMM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_200_000 })])
        .rpc()
    );
    results["7_atomic_graduation"] = graduationTx;
  }

  ventureState = await program.account.ventureState.fetch(venturePda);
  console.log(`Venture status after graduation: ${JSON.stringify(ventureState.status)}`);

  // ---------------------------------------------------------------------------
  // STEP 8: 1:1 SHARE REDEMPTION (BURN RECEIPT TOKENS -> REAL SHARES)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🎟️ STEP 8: 1:1 COMMON SHARE REDEMPTION");
  console.log("=======================================================");
  const deployerCompanySharesAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, companyMint, deployer.publicKey)).address;
  const receiptBal = await getAccount(connection, deployerReceiptAta);
  console.log(`Deployer Receipt Token Balance: ${Number(receiptBal.amount) / 1e6} ${companySymbol}-R0`);

  if (Number(receiptBal.amount) > 0) {
    const redeemAmount = new BN(receiptBal.amount.toString());
    const redeemTx = await sendWithRetry("Redeem Receipts for Real Shares 1:1", () =>
      program.methods
        .redeemShares(redeemAmount)
        .accountsStrict({
          investor: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          roundRecord: deployerRecordPda,
          receiptMint: receiptMint0Pda,
          investorReceiptAccount: deployerReceiptAta,
          masterLockVault: masterLockVaultPda,
          investorShareAccount: deployerCompanySharesAta,
          ventureTokenMint: companyMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 })])
        .rpc()
    );
    results["8_redeem_shares"] = redeemTx;
  }

  const sharesBal = await getAccount(connection, deployerCompanySharesAta);
  console.log(`✅ Deployer Real Shares Balance: ${Number(sharesBal.amount) / 1e6} ${companySymbol}`);

  // ---------------------------------------------------------------------------
  // STEP 9: METEORA DLMM SECONDARY SWAP TEST
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🔄 STEP 9: LIVE METEORA DLMM SECONDARY SWAP (USDC -> QCMP)");
  console.log("=======================================================");
  const dlmmPool = await DLMM.create(connection, lbPair);
  const activeBin = await dlmmPool.getActiveBin();
  console.log(`DLMM Pool Active Bin ID: ${activeBin.binId}, Price: ${activeBin.pricePerToken}`);

  const swapAmountUsdc = new BN(50 * 1e6); // 50 USDC
  // Token X is USDC, Token Y is QCMP. Swapping USDC (X) -> QCMP (Y).
  const swapForY = true;
  const binArraysForSwap = await dlmmPool.getBinArrayForSwap(swapForY);
  console.log(`Bin arrays available for swap: ${binArraysForSwap.length}`);

  const quote = await dlmmPool.swapQuote(swapAmountUsdc, swapForY, new BN(500), binArraysForSwap);
  console.log(`Quote: ${Number(quote.consumedInAmount) / 1e6} USDC -> ${Number(quote.outAmount) / 1e6} ${companySymbol}`);

  const swapTx = await dlmmPool.swap({
    inToken: usdcMint,
    outToken: companyMint,
    inAmount: swapAmountUsdc,
    minOutAmount: quote.minOutAmount,
    lbPair: lbPair,
    user: deployer.publicKey,
    binArraysPubkey: binArraysForSwap.map((b: any) => b.publicKey)
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  swapTx.recentBlockhash = latestBlockhash.blockhash;
  swapTx.feePayer = deployer.publicKey;

  const swapSig = await sendWithRetry("Execute Meteora DLMM Swap", () =>
    sendAndConfirmTransaction(connection, swapTx, [deployer], { commitment: "confirmed" })
  );
  results["9_dlmm_secondary_swap"] = swapSig;

  // Final summary
  console.log("\n================================================================================");
  console.log("🏆 SUCCESS! NEW COMPANY LAUNCH & FULL LIFECYCLE COMPLETED ON SOLANA DEVNET");
  console.log("================================================================================");
  console.log(`Company Name:          ${companyName}`);
  console.log(`Company Ticker:        $${companySymbol}`);
  console.log(`Common Share Mint:     ${companyMint.toBase58()}`);
  console.log(`Metaplex Metadata PDA: ${metadataPda.toBase58()}`);
  console.log(`Metadata JSON URL:     ${companyUri}`);
  console.log(`Meteora DLMM Pool:     ${lbPair.toBase58()}`);
  console.log("\n--- DEVNET TRANSACTIONS ---");
  for (const [step, tx] of Object.entries(results)) {
    console.log(`${step}: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  }

  // Save report to docs
  const outPath = path.resolve(__dirname, "..", "..", "docs", "NEW_COMPANY_DEVNET_LAUNCH_QCMP.json");
  fs.writeFileSync(outPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    cluster: "devnet",
    company: {
      name: companyName,
      symbol: companySymbol,
      mint: companyMint.toBase58(),
      metadataPda: metadataPda.toBase58(),
      metadataUri: companyUri,
      dlmmPool: lbPair.toBase58()
    },
    transactions: results
  }, null, 2));
  console.log(`\nReport saved to: ${outPath}`);
}

main().catch((err) => {
  console.error("FATAL ERROR in launch script:", err);
  process.exit(1);
});
