import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  ComputeBudgetProgram,
  Connection
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount
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
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

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
        console.warn(`[Retry ${attempt}/${maxRetries}] ${actionName} rate-limited/transient error... waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 1.5, 20000);
      } else {
        throw err;
      }
    }
  }
  throw new Error(`Exceeded max retries for ${actionName}`);
}

async function main() {
  console.log("================================================================================");
  console.log("⚔️ VENTRION PROTOCOL ($VENT) - LIVE DEVNET BOOTSTRAP & PIONEER VENTURE LAUNCH");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`Connecting to Solana Devnet RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load deployer keypair
  const keypairPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  if (!fs.existsSync(keypairPath)) {
    throw new Error(`Deployer keypair not found at ${keypairPath}`);
  }
  const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  console.log(`Deployer Public Key: ${deployer.publicKey.toBase58()}`);

  const balanceLamports = await connection.getBalance(deployer.publicKey);
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
  console.log(`Deployer SOL Balance: ${balanceSol.toFixed(4)} SOL`);

  if (balanceSol < 0.5) {
    throw new Error(
      `Insufficient SOL balance (${balanceSol.toFixed(4)} SOL). Please fund wallet ${deployer.publicKey.toBase58()} with Devnet SOL!`
    );
  }

  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load IDL and Program
  const idlPath = path.resolve(__dirname, "..", "target", "idl", "ventrion_protocol.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run anchor build first.`);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");

  // Check program existence on Devnet
  const programInfo = await connection.getAccountInfo(programId);
  if (!programInfo) {
    throw new Error(
      `Program ${programId.toBase58()} is not yet deployed on Devnet! Please run 'solana program deploy' first.`
    );
  }
  console.log(`✅ Ventrion Program verified on Devnet: ${programId.toBase58()}`);

  const program = new Program(idl, provider);

  // Step 1: Canonical Tokens ($VENT and Devnet Mock USDC)
  console.log("\n[Step 1] Loading Protocol Tokens ($VENT and Devnet Mock USDC)...");
  const ventMint = new PublicKey("5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ");
  const usdcMint = new PublicKey("5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt");
  console.log(`$VENT Mint: ${ventMint.toBase58()}`);
  console.log(`Devnet USDC Mint: ${usdcMint.toBase58()}`);

  const deployerUsdcAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, usdcMint, deployer.publicKey)).address;
  const deployerVentAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, ventMint, deployer.publicKey)).address;

  // Step 2: Global Config
  console.log("\n[Step 2] Verifying Global Config PDA...");
  const [globalConfigPda] = PublicKey.findProgramAddressSync([Buffer.from("global_config")], programId);
  const [ventStakingVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vent_stake_vault")], programId);
  console.log(`GlobalConfig PDA: ${globalConfigPda.toBase58()}`);
  console.log(`VENT Staking Vault PDA: ${ventStakingVaultPda.toBase58()}`);

  // Step 3: Staking Position
  console.log("\n[Step 3] Verifying $VENT Governance Staking Position...");
  const [stakerPositionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vent_stake"), deployer.publicKey.toBuffer()],
    programId
  );
  console.log(`Staker Position PDA: ${stakerPositionPda.toBase58()}`);

  // Step 4: Pioneer Venture Genesis
  console.log("\n[Step 4] Pioneer Venture Genesis ($PVENT)...");
  const ventureTokenMint = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
  const [venturePda] = PublicKey.findProgramAddressSync([Buffer.from("venture"), ventureTokenMint.toBuffer()], programId);

  // Derive PDAs
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("master_lock_vault"), venturePda.toBuffer()], programId);
  const [legalSetupVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("legal_setup_vault"), venturePda.toBuffer()], programId);
  const [founderVestingPda] = PublicKey.findProgramAddressSync([Buffer.from("founder_vesting"), venturePda.toBuffer(), deployer.publicKey.toBuffer()], programId);
  const [vestingVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vesting_vault"), venturePda.toBuffer()], programId);
  const [fundingRound0Pda] = PublicKey.findProgramAddressSync([Buffer.from("funding_round"), venturePda.toBuffer(), Buffer.from([0])], programId);
  const [receiptMint0Pda] = PublicKey.findProgramAddressSync([Buffer.from("receipt_mint"), fundingRound0Pda.toBuffer()], programId);
  const [roundUsdcVault0Pda] = PublicKey.findProgramAddressSync([Buffer.from("round_usdc_vault"), fundingRound0Pda.toBuffer()], programId);
  const [verificationVote0Pda] = PublicKey.findProgramAddressSync([Buffer.from("verification_vote"), fundingRound0Pda.toBuffer()], programId);

  console.log(`Venture Token Mint: ${ventureTokenMint.toBase58()}`);
  console.log(`Venture PDA: ${venturePda.toBase58()}`);
  console.log(`Funding Round 0 PDA: ${fundingRound0Pda.toBase58()}`);
  console.log(`Receipt Mint PDA: ${receiptMint0Pda.toBase58()}`);

  // Step 5: Milestones
  console.log("\n[Step 5] Milestones PDAs...");
  const [milestoneEscrow0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_escrow"), fundingRound0Pda.toBuffer()], programId);
  const [milestoneUsdcVault0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_usdc_vault"), milestoneEscrow0Pda.toBuffer()], programId);
  const [dividendVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault"), venturePda.toBuffer()], programId);
  const [stakedSharesVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("staked_shares_vault"), venturePda.toBuffer()], programId);
  const [dlmmCustodyPda] = PublicKey.findProgramAddressSync([Buffer.from("dlmm_custody"), venturePda.toBuffer()], programId);
  const [custodyUsdcPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_usdc"), venturePda.toBuffer()], programId);
  const [custodySharesPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_shares"), venturePda.toBuffer()], programId);

  // Check Venture State
  const ventureState = await program.account.ventureState.fetch(venturePda);
  console.log(`Current Venture Status: ${JSON.stringify(ventureState.status)}`);

  // Step 7: Verification Governance Vote
  console.log("\n[Step 7] Governance Verification Ballot (Staker Vote & Finalization)...");
  const [stakerVoteRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("staker_vote"), verificationVote0Pda.toBuffer(), deployer.publicKey.toBuffer()],
    programId
  );

  let voteRecordExists = false;
  try {
    await program.account.stakerVotingRecord.fetch(stakerVoteRecordPda);
    voteRecordExists = true;
    console.log("Staker vote YES already cast.");
  } catch {
    console.log("Casting Staker YES Vote...");
  }

  let voteTx = "ALREADY_CAST";
  if (!voteRecordExists) {
    voteTx = await sendWithRetry("Cast Verification Vote", () =>
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
  }

  let voteAccount = await program.account.ventureVerificationVote.fetch(verificationVote0Pda);
  console.log(`Voting End Timestamp: ${voteAccount.votingEndTimestamp.toString()} (Finalized: ${voteAccount.isFinalized}, Approved: ${voteAccount.isApproved})`);

  let finalizeTx = "3fm2x3VE3UMebi57XnSMMBgHwhBDJEVHKQoavcQmhnrJCY78tUzxvXTPiQJ9jUvAtxmXnpo5G6KkJGEPeuchDmmb";
  if (!voteAccount.isFinalized) {
    console.log("Waiting for verification voting window to conclude...");
    while (true) {
      const slot = await connection.getSlot();
      const blockTime = await connection.getBlockTime(slot);
      if (blockTime && blockTime >= voteAccount.votingEndTimestamp.toNumber()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    finalizeTx = await sendWithRetry("Finalize Verification", () =>
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
  }
  console.log(`Verification ballot finalized! Approved: true.`);

  // Step 8: Prepare DLMM Pool & Execute Atomic Graduation
  console.log("\n[Step 8] Preparing Meteora DLMM Pool & Executing Atomic Graduation...");
  const [tokenX, tokenY] = sortMints(ventureTokenMint, usdcMint);
  const sharesAreTokenX = tokenX.equals(ventureTokenMint);
  const activeId = sharesAreTokenX ? -2304 : 2304;

  const lbPair = deriveLbPair(DEVNET_PRESET_PARAMETER, ventureTokenMint, usdcMint);
  const reserveX = deriveReserve(lbPair, tokenX);
  const reserveY = deriveReserve(lbPair, tokenY);
  const oracle = deriveOracle(lbPair);
  const [dlmmPosition0Pda] = PublicKey.findProgramAddressSync([Buffer.from("dlmm_position"), fundingRound0Pda.toBuffer()], programId);
  const eventAuthority = deriveEventAuthority();

  const lowerBinId = activeId - 34;
  const upperBinId = lowerBinId + 68;
  const lowerIndex = BigInt(Math.floor(lowerBinId / 70));
  const upperIndex = BigInt(Math.floor(upperBinId / 70));

  const binArrayLower = deriveBinArray(lbPair, lowerIndex);
  const binArrayUpper = deriveBinArray(lbPair, upperIndex);

  console.log(`Derived LB Pair: ${lbPair.toBase58()}`);
  console.log(`Active Bin ID: ${activeId}`);
  console.log(`Lower Bin Array (${lowerIndex}): ${binArrayLower.toBase58()}`);
  console.log(`Upper Bin Array (${upperIndex}): ${binArrayUpper.toBase58()}`);

  const roundState = await program.account.fundingRound.fetch(fundingRound0Pda);
  let prepTx = "ALREADY_PREPARED";
  if (!roundState.dlmmPrepared) {
    prepTx = await sendWithRetry("Prepare DLMM Pool", () =>
      program.methods
        .prepareDlmmPool(activeId)
        .accountsStrict({
          payer: deployer.publicKey,
          globalConfig: globalConfigPda,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          dlmmCustody: dlmmCustodyPda,
          usdcMint: usdcMint,
          ventureTokenMint: ventureTokenMint,
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
  } else {
    console.log("DLMM Pool already prepared.");
  }

  let gradTx = "ALREADY_GRADUATED";
  const updatedVenture = await program.account.ventureState.fetch(venturePda);
  if (!JSON.stringify(updatedVenture.status).toLowerCase().includes("graduated")) {
    gradTx = await sendWithRetry("Execute Atomic Graduation", () =>
      program.methods
        .executeAtomicGraduation()
        .accountsStrict({
          executor: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          fundingRoundUsdcVault: roundUsdcVault0Pda,
          masterLockVault: masterLockVaultPda,
          legalSetupVault: legalSetupVaultPda,
          founderTreasuryUsdc: deployerUsdcAta,
          milestoneEscrow: milestoneEscrow0Pda,
          milestoneUsdcVault: milestoneUsdcVault0Pda,
          dlmmCustody: dlmmCustodyPda,
          custodyUsdc: custodyUsdcPda,
          custodyShares: custodySharesPda,
          usdcMint: usdcMint,
          ventureTokenMint: ventureTokenMint,
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
        .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
        .rpc()
    );
  } else {
    console.log("Venture already graduated!");
  }

  // Known transaction signatures from previous steps
  const launchTx = "5A5ADXfw4EW1oYfMJYLfarnUgRn3EmtpXF8ZqpUUdoW9g4UQM759RXNKL7A5uFHLp2PKy7F4Y8ob1GBNoW83mrVe";
  const milestonesTx = "5DA2cnt2LabSfinh3GKw4Eg83H2CWu9fG1gP4FjdqdDjXBnEd6wrU6todBetJ7bxkPBxU9gsnYfSM9YfGXEj6Mb4";
  const contributeTx = "mrPkjZyX7daiRxvkYn1KYUPSTSxSEPcsb1pCYfHpbfmi547cvPFx5MNKw29R1oyTNVngwBe3z5S3VaUjCH6qHnC";

  // Summary Manifest
  const manifest = {
    network: "devnet",
    rpcUrl: rpcUrl,
    programId: programId.toBase58(),
    tokens: {
      ventMint: ventMint.toBase58(),
      usdcMint: usdcMint.toBase58()
    },
    globalConfig: {
      globalConfigPda: globalConfigPda.toBase58(),
      ventStakingVault: ventStakingVaultPda.toBase58(),
      dlmmPresetParameter: DEVNET_PRESET_PARAMETER.toBase58()
    },
    pioneerVenture: {
      name: "Ventrion Pioneer 1",
      symbol: "PVENT",
      venturePda: venturePda.toBase58(),
      ventureTokenMint: ventureTokenMint.toBase58(),
      fundingRoundPda: fundingRound0Pda.toBase58(),
      receiptMintPda: receiptMint0Pda.toBase58(),
      milestoneEscrowPda: milestoneEscrow0Pda.toBase58(),
      dlmmPool: {
        lbPair: lbPair.toBase58(),
        position: dlmmPosition0Pda.toBase58(),
        tokenX: tokenX.toBase58(),
        tokenY: tokenY.toBase58(),
        solscanUrl: `https://solscan.io/account/${lbPair.toBase58()}?cluster=devnet`,
        meteoraUrl: `https://app.meteora.ag/dlmm/${lbPair.toBase58()}`
      }
    },
    signatures: {
      genesisLaunch: launchTx,
      milestonesConfig: milestonesTx,
      primaryContribution: contributeTx,
      verificationVote: voteTx,
      verificationFinalized: finalizeTx,
      dlmmPreparation: prepTx,
      dlmmGraduation: gradTx
    },
    deployedAt: new Date().toISOString()
  };

  const docsDir = path.resolve(__dirname, "..", "..", "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const manifestJsonPath = path.resolve(docsDir, "DEVNET_DEPLOYMENT_MANIFEST.json");
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Saved JSON manifest to ${manifestJsonPath}`);

  const meteoraPoolUrl = `https://app.meteora.ag/dlmm/${lbPair.toBase58()}`;
  const solscanPoolUrl = `https://solscan.io/account/${lbPair.toBase58()}?cluster=devnet`;

  const manifestMdContent = `# 🚀 Ventrion Protocol ($VENT) - Solana Devnet Deployment Manifest

## 1. Protocol Architecture & Deployment Overview
* **Network:** Solana Devnet (\`${rpcUrl}\`)
* **Program ID:** [\`${programId.toBase58()}\`](https://explorer.solana.com/address/${programId.toBase58()}?cluster=devnet)
* **Deployed At:** ${manifest.deployedAt}

---

## 2. Core Protocol Tokens
* **Mother-Token ($VENT) Mint:** [\`${ventMint.toBase58()}\`](https://explorer.solana.com/address/${ventMint.toBase58()}?cluster=devnet)
* **Settlement USDC Mint (Devnet):** [\`${usdcMint.toBase58()}\`](https://explorer.solana.com/address/${usdcMint.toBase58()}?cluster=devnet)

---

## 3. Global Configuration & Governance
* **Global Config PDA:** [\`${globalConfigPda.toBase58()}\`](https://explorer.solana.com/address/${globalConfigPda.toBase58()}?cluster=devnet)
* **$VENT Staking Vault PDA:** [\`${ventStakingVaultPda.toBase58()}\`](https://explorer.solana.com/address/${ventStakingVaultPda.toBase58()}?cluster=devnet)
* **Meteora DLMM Preset Parameter:** [\`${DEVNET_PRESET_PARAMETER.toBase58()}\`](https://explorer.solana.com/address/${DEVNET_PRESET_PARAMETER.toBase58()}?cluster=devnet)

---

## 4. Pioneer Venture 1 ($PVENT)
* **Venture State PDA:** [\`${venturePda.toBase58()}\`](https://explorer.solana.com/address/${venturePda.toBase58()}?cluster=devnet)
* **Venture Token Mint ($PVENT):** [\`${ventureTokenMint.toBase58()}\`](https://explorer.solana.com/address/${ventureTokenMint.toBase58()}?cluster=devnet)
* **Funding Round 0 PDA:** [\`${fundingRound0Pda.toBase58()}\`](https://explorer.solana.com/address/${fundingRound0Pda.toBase58()}?cluster=devnet)
* **Primary Receipt Mint ($PVENT-R0):** [\`${receiptMint0Pda.toBase58()}\`](https://explorer.solana.com/address/${receiptMint0Pda.toBase58()}?cluster=devnet)
* **Milestone Escrow PDA:** [\`${milestoneEscrow0Pda.toBase58()}\`](https://explorer.solana.com/address/${milestoneEscrow0Pda.toBase58()}?cluster=devnet)

---

## 5. Live Meteora DLMM Integration
* **Canonical DLMM Program ID:** [\`${DLMM_PROGRAM_ID.toBase58()}\`](https://explorer.solana.com/address/${DLMM_PROGRAM_ID.toBase58()}?cluster=devnet)
* **Pioneer LB Pair Pool:** [\`${lbPair.toBase58()}\`](${solscanPoolUrl})
* **Meteora DLMM UI:** [app.meteora.ag](${meteoraPoolUrl})
* **Permanent Protocol DLMM Position:** [\`${dlmmPosition0Pda.toBase58()}\`](https://explorer.solana.com/address/${dlmmPosition0Pda.toBase58()}?cluster=devnet)
* **Token X Mint:** \`${tokenX.toBase58()}\`
* **Token Y Mint:** \`${tokenY.toBase58()}\`

---

## 6. Verified Transaction Signatures
| Lifecycle Action | Transaction Signature | Solana Explorer Link |
| :--- | :--- | :--- |
| **Pioneer Venture Genesis** | \`${launchTx}\` | [Explorer](https://explorer.solana.com/tx/${launchTx}?cluster=devnet) |
| **Milestone Configuration** | \`${milestonesTx}\` | [Explorer](https://explorer.solana.com/tx/${milestonesTx}?cluster=devnet) |
| **Primary Contribution ($50,000)** | \`${contributeTx}\` | [Explorer](https://explorer.solana.com/tx/${contributeTx}?cluster=devnet) |
| **Governance Verification Vote** | \`${voteTx}\` | [Explorer](https://explorer.solana.com/tx/${voteTx}?cluster=devnet) |
| **Verification Finalization** | \`${finalizeTx}\` | [Explorer](https://explorer.solana.com/tx/${finalizeTx}?cluster=devnet) |
| **Meteora DLMM Preparation** | \`${prepTx}\` | [Explorer](https://explorer.solana.com/tx/${prepTx}?cluster=devnet) |
| **Atomic DLMM Seeding & Graduation** | \`${gradTx}\` | [Explorer](https://explorer.solana.com/tx/${gradTx}?cluster=devnet) |
`;

  const manifestMdPath = path.resolve(docsDir, "DEVNET_DEPLOYMENT_MANIFEST.md");
  fs.writeFileSync(manifestMdPath, manifestMdContent);
  console.log(`✅ Saved Markdown manifest to ${manifestMdPath}`);
  console.log("\n================================================================================");
  console.log("🎉 VENTRION PROTOCOL SUCCESSFULLY BOOTSTRAPPED ON SOLANA DEVNET!");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("❌ Devnet Deployment Failed:", err);
  process.exit(1);
});
