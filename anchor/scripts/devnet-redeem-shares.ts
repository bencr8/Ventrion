import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Connection,
  ComputeBudgetProgram
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
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
  console.log("🎟️ VENTRION PROTOCOL: DEVNET ON-CHAIN SHARE REDEMPTION (PHASE 1)");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load deployer keypair
  const keypairPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  console.log(`Deployer / Primary Backer: ${deployer.publicKey.toBase58()}`);

  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "..", "target", "idl", "ventrion_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
  const program = new Program(idl, provider);

  const ventureTokenMint = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
  const [venturePda] = PublicKey.findProgramAddressSync([Buffer.from("venture"), ventureTokenMint.toBuffer()], programId);
  const [fundingRound0Pda] = PublicKey.findProgramAddressSync([Buffer.from("funding_round"), venturePda.toBuffer(), Buffer.from([0])], programId);
  const [receiptMint0Pda] = PublicKey.findProgramAddressSync([Buffer.from("receipt_mint"), fundingRound0Pda.toBuffer()], programId);
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("master_lock_vault"), venturePda.toBuffer()], programId);
  const [roundRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round_record"), fundingRound0Pda.toBuffer(), deployer.publicKey.toBuffer()],
    programId
  );

  console.log(`Venture PDA: ${venturePda.toBase58()}`);
  console.log(`Funding Round 0 PDA: ${fundingRound0Pda.toBase58()}`);
  console.log(`Receipt Mint ($PVENT-R0): ${receiptMint0Pda.toBase58()}`);
  console.log(`Master Lock Vault: ${masterLockVaultPda.toBase58()}`);
  console.log(`Round Record PDA: ${roundRecordPda.toBase58()}`);

  // Fetch balances before redemption
  const deployerReceiptAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, receiptMint0Pda, deployer.publicKey)).address;
  const deployerShareAta = (await getOrCreateAssociatedTokenAccount(connection, deployer, ventureTokenMint, deployer.publicKey)).address;

  const receiptAccBefore = await getAccount(connection, deployerReceiptAta);
  let shareBalanceBefore = 0n;
  try {
    const shareAccBefore = await getAccount(connection, deployerShareAta);
    shareBalanceBefore = shareAccBefore.amount;
  } catch {}

  console.log(`\n--- Pre-Redemption Balances ---`);
  console.log(`Deployer $PVENT-R0 Receipts: ${Number(receiptAccBefore.amount) / 1e6} (Atomic: ${receiptAccBefore.amount.toString()})`);
  console.log(`Deployer $PVENT Real Shares: ${Number(shareBalanceBefore) / 1e6} (Atomic: ${shareBalanceBefore.toString()})`);

  if (receiptAccBefore.amount === 0n) {
    console.log("No receipts left to redeem! Already redeemed.");
    return;
  }

  // Redeem 400,000 shares (400_000 * 1e6)
  const redeemAmount = 400_000n * 1_000_000n;
  const actualRedeem = receiptAccBefore.amount < redeemAmount ? receiptAccBefore.amount : redeemAmount;
  console.log(`Redeeming ${Number(actualRedeem) / 1e6} receipts 1:1 into genuine $PVENT common shares...`);

  const redeemTx = await sendWithRetry("Redeem Shares", () =>
    program.methods
      .redeemShares(new BN(actualRedeem.toString()))
      .accountsStrict({
        investor: deployer.publicKey,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        roundRecord: roundRecordPda,
        receiptMint: receiptMint0Pda,
        investorReceiptAccount: deployerReceiptAta,
        masterLockVault: masterLockVaultPda,
        investorShareAccount: deployerShareAta,
        ventureTokenMint: ventureTokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      })
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 })])
      .rpc()
  );

  console.log(`\n✅ Transaction Confirmed: https://explorer.solana.com/tx/${redeemTx}?cluster=devnet`);

  // Verify on-chain post-redemption
  const receiptAccAfter = await getAccount(connection, deployerReceiptAta);
  const shareAccAfter = await getAccount(connection, deployerShareAta);
  const masterLockAfter = await getAccount(connection, masterLockVaultPda);

  console.log(`\n--- Post-Redemption Balances ---`);
  console.log(`Deployer $PVENT-R0 Receipts: ${Number(receiptAccAfter.amount) / 1e6} (Atomic: ${receiptAccAfter.amount.toString()})`);
  console.log(`Deployer $PVENT Real Shares: ${Number(shareAccAfter.amount) / 1e6} (Atomic: ${shareAccAfter.amount.toString()})`);
  console.log(`Master Lock Vault Balance: ${Number(masterLockAfter.amount) / 1e6} $PVENT`);

  const updatedRecord = await program.account.roundInvestorRecord.fetch(roundRecordPda);
  console.log(`\nRound Record on-chain: tokens_redeemed = ${Number(updatedRecord.tokensRedeemed) / 1e6} $PVENT`);

  // Save result
  const result = {
    step: "Phase 1: Share Redemption",
    txSignature: redeemTx,
    explorerUrl: `https://explorer.solana.com/tx/${redeemTx}?cluster=devnet`,
    redeemedAmountShares: Number(actualRedeem) / 1e6,
    deployerPventBalance: Number(shareAccAfter.amount) / 1e6,
    deployerReceiptBalance: Number(receiptAccAfter.amount) / 1e6,
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.resolve(__dirname, "..", "..", "docs", "PHASE1_REDEMPTION_RESULT.json");
  fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
  console.log(`✅ Result logged to ${resultsPath}`);
}

main().catch((err) => {
  console.error("❌ Share redemption failed:", err);
  process.exit(1);
});
