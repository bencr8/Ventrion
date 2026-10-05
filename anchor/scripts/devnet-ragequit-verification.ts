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
  console.log("⚖️ VENTRION PROTOCOL: RAGEQUIT FLOOR-PRICE BACKSTOP & ARBITRAGE (PHASE 5)");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load deployer keypair
  const keypairPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  console.log(`Deployer / Backer / Founder: ${deployer.publicKey.toBase58()}`);

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
  const [milestoneUsdcVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_usdc_vault"), milestoneEscrow0Pda.toBuffer()], programId);
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("master_lock_vault"), venturePda.toBuffer()], programId);
  const [roundRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), deployer.publicKey.toBuffer()],
    programId
  );

  const deployerUsdcAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, usdcMint, deployer.publicKey)).address;
  const deployerShareAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, ventureTokenMint, deployer.publicKey)).address;

  let escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  console.log(`Current Milestone Index: ${escrowState.currentMilestoneIndex}`);
  console.log(`Milestone 2 Status: ${JSON.stringify(escrowState.milestones[2].status)} (Amendments: ${escrowState.milestones[2].amendmentCount})`);

  const mid = 2; // Testing on Milestone 2

  // 1. If Milestone 2 is Pending, Propose it
  if (JSON.stringify(escrowState.milestones[mid].status).toLowerCase().includes("pending")) {
    console.log(`\nProposing Milestone ${mid}...`);
    await sendWithRetry(`Propose Milestone ${mid}`, () =>
      program.methods
        .proposeMilestone(mid)
        .accountsStrict({
          founder: deployer.publicKey,
          venture: venturePda,
          fundingRound: fundingRound0Pda,
          milestoneEscrow: milestoneEscrow0Pda,
        })
        .rpc()
    );
    escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  }

  // 2. Cycle Veto -> Amend until Breached (3 cures exhausted)
  console.log("\n=======================================================");
  console.log("🛑 ADVANCING MILESTONE 2 CURE EXHAUSTION TO 'BREACHED'");
  console.log("=======================================================");

  while (!JSON.stringify(escrowState.milestones[mid].status).toLowerCase().includes("breached")) {
    const statusStr = JSON.stringify(escrowState.milestones[mid].status).toLowerCase();
    const amendCount = escrowState.milestones[mid].amendmentCount;
    console.log(`\n--- Loop: status = ${statusStr}, amendmentCount = ${amendCount} ---`);

    if (statusStr.includes("proposed")) {
      console.log(`Casting Veto Vote for Milestone ${mid} (cycle ${amendCount})...`);
      await sendWithRetry(`Vote NO on Milestone ${mid} (cycle ${amendCount})`, () =>
        program.methods
          .voteMilestone(mid, false)
          .accountsStrict({
            investor: deployer.publicKey,
            fundingRound: fundingRound0Pda,
            milestoneEscrow: milestoneEscrow0Pda,
            roundRecord: roundRecordPda,
          })
          .rpc()
      );

      console.log("Waiting for 8s veto window to pass...");
      const updatedEscrow = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
      const deadline = updatedEscrow.milestones[mid].vetoDeadline.toNumber();
      while (true) {
        const slot = await connection.getSlot();
        const blockTime = await connection.getBlockTime(slot);
        if (blockTime && blockTime >= deadline) break;
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`Resolving Milestone ${mid} release under active veto...`);
      await sendWithRetry(`Resolve Vetoed Milestone ${mid}`, () =>
        program.methods
          .executeMilestoneRelease(mid)
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
    } else if (statusStr.includes("vetoed")) {
      if (amendCount < 3) {
        console.log(`Founder cures (amends) Milestone ${mid} for attempt ${amendCount + 1}...`);
        const now = Math.floor(Date.now() / 1000);
        const newDate = now + 90 * 86400;
        await sendWithRetry(`Amend Milestone ${mid} Attempt ${amendCount + 1}`, () =>
          program.methods
            .amendMilestone(mid, new BN(newDate))
            .accountsStrict({
              founder: deployer.publicKey,
              venture: venturePda,
              fundingRound: fundingRound0Pda,
              milestoneEscrow: milestoneEscrow0Pda,
            })
            .rpc()
        );
      }
    }

    escrowState = await program.account.milestoneEscrow.fetch(milestoneEscrow0Pda);
  }

  console.log(`\n🎉 Milestone 2 Status is now BREACHED: ${JSON.stringify(escrowState.milestones[mid].status)}`);

  // ---------------------------------------------------------------------------
  // STEP 3: EXECUTING BACKER RAGEQUIT
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("💥 STEP 3: EXECUTING BACKER RAGEQUIT & FLOOR DEFENSE");
  console.log("=======================================================");

  const recordBefore = await program.account.roundInvestorRecord.fetch(roundRecordPda);
  const surrenderable = Number(recordBefore.tokensRedeemed) - Number(recordBefore.tokensSurrendered);
  console.log(`Backer Tokens Redeemed: ${Number(recordBefore.tokensRedeemed) / 1e6} $PVENT`);
  console.log(`Backer Tokens Surrendered: ${Number(recordBefore.tokensSurrendered) / 1e6} $PVENT`);
  console.log(`Backer Surrenderable Limit: ${surrenderable / 1e6} $PVENT`);

  const shareAccBefore = await getAccount(connection, deployerShareAta);
  const usdcAccBefore = await getAccount(connection, deployerUsdcAta);
  const escrowVaultBefore = await getAccount(connection, milestoneUsdcVaultPda);
  const masterLockBefore = await getAccount(connection, masterLockVaultPda);

  console.log(`\n--- Pre-Ragequit Balances ---`);
  console.log(`Deployer $PVENT Balance: ${Number(shareAccBefore.amount) / 1e6} $PVENT`);
  console.log(`Deployer USDC Balance: ${Number(usdcAccBefore.amount) / 1e6} USDC`);
  console.log(`Milestone Escrow USDC: ${Number(escrowVaultBefore.amount) / 1e6} USDC`);
  console.log(`Master Lock Vault $PVENT: ${Number(masterLockBefore.amount) / 1e6} $PVENT`);

  // Surrender 5,000 $PVENT shares
  const ragequitAmount = 5_000n * 1_000_000n; // 5,000 $PVENT
  console.log(`\nSurrendering ${Number(ragequitAmount) / 1e6} $PVENT shares into Escrow...`);

  const ragequitTx = await sendWithRetry("Execute Ragequit Milestone Escrow", () =>
    program.methods
      .ragequitMilestoneEscrow(new BN(ragequitAmount.toString()))
      .accountsStrict({
        investor: deployer.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        milestoneEscrow: milestoneEscrow0Pda,
        milestoneUsdcVault: milestoneUsdcVaultPda,
        roundRecord: roundRecordPda,
        investorShareAccount: deployerShareAta,
        masterLockVault: masterLockVaultPda,
        investorUsdc: deployerUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
  );

  console.log(`✅ Ragequit Executed! Tx: https://explorer.solana.com/tx/${ragequitTx}?cluster=devnet`);

  // Verify on-chain results
  const shareAccAfter = await getAccount(connection, deployerShareAta);
  const usdcAccAfter = await getAccount(connection, deployerUsdcAta);
  const escrowVaultAfter = await getAccount(connection, milestoneUsdcVaultPda);
  const masterLockAfter = await getAccount(connection, masterLockVaultPda);
  const recordAfter = await program.account.roundInvestorRecord.fetch(roundRecordPda);

  const usdcRefunded = (Number(usdcAccAfter.amount) - Number(usdcAccBefore.amount)) / 1e6;
  const sharesSurrendered = (Number(shareAccBefore.amount) - Number(shareAccAfter.amount)) / 1e6;

  console.log(`\n--- Post-Ragequit Verification ---`);
  console.log(`$PVENT Shares Surrendered: ${sharesSurrendered} $PVENT`);
  console.log(`USDC Backstop Refund Received: ${usdcRefunded.toFixed(4)} USDC`);
  console.log(`Effective Floor Price Defended: $${(usdcRefunded / sharesSurrendered).toFixed(4)} per $PVENT share`);
  console.log(`Master Lock Vault $PVENT (Returned to Vault): ${Number(masterLockAfter.amount) / 1e6} $PVENT`);
  console.log(`Milestone Escrow USDC Remaining: ${Number(escrowVaultAfter.amount) / 1e6} USDC`);
  console.log(`Record on-chain: tokens_surrendered = ${Number(recordAfter.tokensSurrendered) / 1e6} $PVENT`);

  const results = {
    step: "Phase 5: Ragequit Floor-Price Arbitrage Verification",
    txSignature: ragequitTx,
    explorerUrl: `https://explorer.solana.com/tx/${ragequitTx}?cluster=devnet`,
    sharesSurrendered,
    usdcRefunded,
    floorPrice: usdcRefunded / sharesSurrendered,
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.resolve(__dirname, "..", "..", "docs", "PHASE5_RAGEQUIT_RESULT.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results logged to ${resultsPath}`);
}

main().catch((err) => {
  console.error("❌ Ragequit verification failed:", err);
  process.exit(1);
});
