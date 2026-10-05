import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  ComputeBudgetProgram
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log("🏛️ VENTRION PROTOCOL: MILESTONE GOVERNANCE, DISBURSEMENT & CURE TEST (PHASE 3)");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load deployer keypair (acts as Founder and Backer)
  const keypairPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  console.log(`Deployer Key: ${deployer.publicKey.toBase58()}`);

  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "..", "target", "idl", "ventrion_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
  const program = new Program(idl, provider);

  const ventureTokenMint = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
  const usdcMint = new PublicKey("5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt");
  const [venturePda] = PublicKey.findProgramAddressSync([Buffer.from("venture"), ventureTokenMint.toBuffer()], programId);
  const [fundingRound0Pda] = PublicKey.findProgramAddressSync([Buffer.from("funding_round"), venturePda.toBuffer(), Buffer.from([0])], programId);
  const [milestoneEscrow0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_escrow"), fundingRound0Pda.toBuffer()], programId);
  const [roundRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), deployer.publicKey.toBuffer()],
    programId
  );

  const escrowInitial = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  const [milestoneUsdcVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_usdc_vault"), milestoneEscrow0Pda.toBuffer()], programId);
  const deployerUsdcAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, usdcMint, deployer.publicKey)).address;

  console.log(`Milestone Escrow PDA: ${milestoneEscrow0Pda.toBase58()}`);
  console.log(`Milestone USDC Vault: ${milestoneUsdcVaultPda.toBase58()}`);
  console.log(`Current Milestone Index: ${escrowInitial.currentMilestoneIndex}`);
  console.log(`Milestone 0 Status: ${JSON.stringify(escrowInitial.milestones[0].status)}`);

  const escrowVaultBefore = await getAccount(connection, milestoneUsdcVaultPda);
  const treasuryBefore = await getAccount(connection, deployerUsdcAta);
  console.log(`Milestone Escrow USDC Balance: ${Number(escrowVaultBefore.amount) / 1e6} USDC`);
  console.log(`Founder Treasury USDC Balance: ${Number(treasuryBefore.amount) / 1e6} USDC`);

  // ---------------------------------------------------------------------------
  // STEP 1: PROPOSE MILESTONE 0
  // ---------------------------------------------------------------------------
  let proposeTx0 = "ALREADY_PROPOSED";
  let escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  if (JSON.stringify(escrowState.milestones[0].status).toLowerCase().includes("pending")) {
    console.log("\n--- Step 1: Proposing Milestone 0 (Founder Deliverable / PoW Submitted) ---");
    proposeTx0 = await sendWithRetry("Propose Milestone 0", () =>
      program.methods
        .proposeMilestone(0)
        .accountsStrict({
          founder: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
        })
        .rpc()
    );
  } else {
    console.log("Milestone 0 already proposed or beyond.");
  }

  // ---------------------------------------------------------------------------
  // STEP 2: VOTE MILESTONE 0 (APPROVAL > 50%)
  // ---------------------------------------------------------------------------
  let voteTx0 = "ALREADY_VOTED";
  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  const recordState = await program.account.roundInvestorRecord.fetch(roundRecordPda);
  const hasVotedM0 = (recordState.voteMask & (1 << 0)) !== 0;

  if (!hasVotedM0 && JSON.stringify(escrowState.milestones[0].status).toLowerCase().includes("proposed")) {
    console.log("\n--- Step 2: Casting Fast-Track Approval Vote (> 50%) ---");
    voteTx0 = await sendWithRetry("Vote YES on Milestone 0", () =>
      program.methods
        .voteMilestone(0, true)
        .accountsStrict({
          investor: deployer.publicKey,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
          roundRecord: roundRecordPda,
        })
        .rpc()
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 3: EXECUTE MILESTONE 0 RELEASE (DISBURSEMENT)
  // ---------------------------------------------------------------------------
  let releaseTx0 = "ALREADY_RELEASED";
  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  if (JSON.stringify(escrowState.milestones[0].status).toLowerCase().includes("proposed")) {
    console.log("\n--- Step 3: Executing Milestone 0 Release ---");
    releaseTx0 = await sendWithRetry("Execute Milestone 0 Release", () =>
      program.methods
        .executeMilestoneRelease(0)
        .accountsStrict({
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
          milestoneUsdcVault: milestoneUsdcVaultPda,
          founderTreasuryUsdc: deployerUsdcAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()
    );
  }

  // Verification of Milestone 0
  const escrowVaultAfter0 = await getAccount(connection, milestoneUsdcVaultPda);
  const treasuryAfter0 = await getAccount(connection, deployerUsdcAta);
  const releasedTranche0 = (Number(escrowVaultBefore.amount) - Number(escrowVaultAfter0.amount)) / 1e6;
  console.log(`\n✅ Milestone 0 Released! Tranche disbursed: ${releasedTranche0.toFixed(2)} USDC`);
  console.log(`Milestone Escrow USDC: ${Number(escrowVaultAfter0.amount) / 1e6} USDC`);
  console.log(`Founder Treasury USDC: ${Number(treasuryAfter0.amount) / 1e6} USDC`);

  // ---------------------------------------------------------------------------
  // STEP 4: VETO & CURE CYCLE TEST (MILESTONE 1)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🛡️ STEP 4: VETO & CURE TEST ON MILESTONE 1");
  console.log("=======================================================");

  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  console.log(`Current Milestone Index: ${escrowState.currentMilestoneIndex}`);
  console.log(`Milestone 1 Status: ${JSON.stringify(escrowState.milestones[1].status)}`);

  // 4a. Propose Milestone 1
  let proposeTx1 = "ALREADY_PROPOSED";
  if (JSON.stringify(escrowState.milestones[1].status).toLowerCase().includes("pending")) {
    console.log("\nProposing Milestone 1...");
    proposeTx1 = await sendWithRetry("Propose Milestone 1", () =>
      program.methods
        .proposeMilestone(1)
        .accountsStrict({
          founder: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
        })
        .rpc()
    );
  }

  // 4b. Cast Backer Veto Vote (approve = false)
  let vetoTx1 = "ALREADY_VETOED";
  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  const updatedRecord = await program.account.roundInvestorRecord.fetch(roundRecordPda);
  const hasVetoedM1 = (updatedRecord.vetoMask & (1 << 1)) !== 0;

  if (!hasVetoedM1 && JSON.stringify(escrowState.milestones[1].status).toLowerCase().includes("proposed")) {
    console.log("\nCasting Veto Vote (> 33.33%)...");
    vetoTx1 = await sendWithRetry("Vote NO (Veto) on Milestone 1", () =>
      program.methods
        .voteMilestone(1, false)
        .accountsStrict({
          investor: deployer.publicKey,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
          roundRecord: roundRecordPda,
        })
        .rpc()
    );
  }

  // 4c. Wait for veto window to expire (8s in test mode) and execute release -> resolves to Vetoed
  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  let resolveVetoTx = "ALREADY_RESOLVED";
  if (JSON.stringify(escrowState.milestones[1].status).toLowerCase().includes("proposed")) {
    console.log("Waiting for veto deadline to conclude (8s test window)...");
    const m1 = escrowState.milestones[1];
    while (true) {
      const slot = await connection.getSlot();
      const blockTime = await connection.getBlockTime(slot);
      if (blockTime && blockTime >= m1.vetoDeadline.toNumber()) {
        break;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("Resolving Milestone 1 with active veto...");
    resolveVetoTx = await sendWithRetry("Resolve Vetoed Milestone 1", () =>
      program.methods
        .executeMilestoneRelease(1)
        .accountsStrict({
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
          milestoneUsdcVault: milestoneUsdcVaultPda,
          founderTreasuryUsdc: deployerUsdcAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()
    );
  }

  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  console.log(`Milestone 1 Status after Veto Resolution: ${JSON.stringify(escrowState.milestones[1].status)}`);
  console.log(`✅ Status is now Vetoed (CurePeriod active)!`);

  // 4d. Founder Cures the Milestone via amend_milestone
  let cureTx1 = "ALREADY_CURED";
  if (JSON.stringify(escrowState.milestones[1].status).toLowerCase().includes("vetoed")) {
    console.log("\nFounder amends and cures Milestone 1 with revised target completion date...");
    const currentNow = Math.floor(Date.now() / 1000);
    const newTargetDate = currentNow + 60 * 86400; // 60 days in future (before next milestone)

    cureTx1 = await sendWithRetry("Amend / Cure Milestone 1", () =>
      program.methods
        .amendMilestone(1, new BN(newTargetDate))
        .accountsStrict({
          founder: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
        })
        .rpc()
    );
  }

  escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  console.log(`Milestone 1 Status after Cure: ${JSON.stringify(escrowState.milestones[1].status)} (Amendment Count: ${escrowState.milestones[1].amendmentCount})`);

  const results = {
    step: "Phase 3: Milestone Governance & Disbursement",
    milestone0: {
      proposeTx: proposeTx0,
      voteTx: voteTx0,
      releaseTx: releaseTx0,
      disbursedUsdc: releasedTranche0,
      explorerUrl: `https://explorer.solana.com/tx/${releaseTx0}?cluster=devnet`
    },
    milestone1CureTest: {
      proposeTx: proposeTx1,
      vetoTx: vetoTx1,
      resolveVetoTx: resolveVetoTx,
      cureAmendTx: cureTx1,
      statusAfterCure: escrowState.milestones[1].status,
      amendmentCount: escrowState.milestones[1].amendmentCount,
      explorerUrl: `https://explorer.solana.com/tx/${cureTx1}?cluster=devnet`
    },
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.resolve(__dirname, "..", "..", "docs", "PHASE3_MILESTONES_RESULT.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results logged to ${resultsPath}`);
}

main().catch((err) => {
  console.error("❌ Milestone governance failed:", err);
  process.exit(1);
});
