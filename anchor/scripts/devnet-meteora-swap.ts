import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  getAccount
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const DLMM = require("@meteora-ag/dlmm").default || require("@meteora-ag/dlmm");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("================================================================================");
  console.log("🌊 VENTRION PROTOCOL: METEORA DLMM SECONDARY SWAPS & FEE ACCRUAL (PHASE 2)");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load deployer keypair
  const keypairPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  console.log(`Deployer / Trader: ${deployer.publicKey.toBase58()}`);

  const pventMint = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
  const usdcMint = new PublicKey("5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt");
  const lbPair = new PublicKey("Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h");
  const meteoraProgram = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");

  const [reserveX] = PublicKey.findProgramAddressSync([lbPair.toBuffer(), pventMint.toBuffer()], meteoraProgram);
  const [reserveY] = PublicKey.findProgramAddressSync([lbPair.toBuffer(), usdcMint.toBuffer()], meteoraProgram);

  console.log(`LB Pair: ${lbPair.toBase58()}`);
  console.log(`Reserve X ($PVENT): ${reserveX.toBase58()}`);
  console.log(`Reserve Y (USDC): ${reserveY.toBase58()}`);

  const dlmmPool = await DLMM.create(connection, lbPair);
  const activeBin = await dlmmPool.getActiveBin();
  console.log(`DLMM Pool loaded. Active Bin ID: ${activeBin.binId}, Price: ${activeBin.pricePerToken}`);

  // Fetch reserves before swaps
  const resXBefore = await getAccount(connection, reserveX);
  const resYBefore = await getAccount(connection, reserveY);
  console.log(`\n--- Initial Pool Reserves ---`);
  console.log(`Reserve X ($PVENT): ${Number(resXBefore.amount) / 1e6} $PVENT (Atomic: ${resXBefore.amount.toString()})`);
  console.log(`Reserve Y (USDC): ${Number(resYBefore.amount) / 1e6} USDC (Atomic: ${resYBefore.amount.toString()})`);

  // ---------------------------------------------------------------------------
  // SWAP A: Swap 100 USDC -> $PVENT (inToken: USDC, outToken: $PVENT)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🔄 EXECUTING SWAP A: 100 USDC -> $PVENT");
  console.log("=======================================================");

  const swapAAmount = new BN(100 * 1e6); // 100 USDC
  // swapForY is false because we are swapping Y (USDC) -> X ($PVENT)
  const swapForY_A = false;
  const binArraysA = await dlmmPool.getBinArrayForSwap(swapForY_A);
  console.log(`Bin arrays for Swap A: ${binArraysA.length} bin array(s) found`);

  const quoteA = await dlmmPool.swapQuote(swapAAmount, swapForY_A, new BN(500), binArraysA);
  console.log(`Swap A Quote: In = ${Number(quoteA.consumedInAmount) / 1e6} USDC -> Out = ${Number(quoteA.outAmount) / 1e6} $PVENT (Fee: ${quoteA.fee ? quoteA.fee.toString() : "N/A"})`);

  const swapTxA = await dlmmPool.swap({
    inToken: usdcMint,
    outToken: pventMint,
    inAmount: swapAAmount,
    minOutAmount: quoteA.minOutAmount,
    lbPair: lbPair,
    user: deployer.publicKey,
    binArraysPubkey: binArraysA.map((b: any) => b.publicKey),
  });

  const latestBlockhashA = await connection.getLatestBlockhash("confirmed");
  swapTxA.recentBlockhash = latestBlockhashA.blockhash;
  swapTxA.feePayer = deployer.publicKey;
  const txSigA = await sendAndConfirmTransaction(connection, swapTxA, [deployer], { commitment: "confirmed" });
  console.log(`✅ Swap A Confirmed!`);
  console.log(`Tx Signature: https://explorer.solana.com/tx/${txSigA}?cluster=devnet`);

  // Intermediate reserves check
  const resXMid = await getAccount(connection, reserveX);
  const resYMid = await getAccount(connection, reserveY);
  console.log(`Reserves after Swap A:`);
  console.log(`Reserve X ($PVENT): ${Number(resXMid.amount) / 1e6} (Diff: ${(Number(resXMid.amount) - Number(resXBefore.amount)) / 1e6} $PVENT)`);
  console.log(`Reserve Y (USDC): ${Number(resYMid.amount) / 1e6} (Diff: +${(Number(resYMid.amount) - Number(resYBefore.amount)) / 1e6} USDC)`);

  // Wait a slot
  await new Promise((r) => setTimeout(r, 2000));

  // ---------------------------------------------------------------------------
  // SWAP B: Swap 500 $PVENT -> USDC (inToken: $PVENT, outToken: USDC)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🔄 EXECUTING SWAP B: 500 $PVENT -> USDC");
  console.log("=======================================================");

  // Refetch pool state
  await dlmmPool.refetchStates();
  const swapBAmount = new BN(500 * 1e6); // 500 $PVENT
  // swapForY is true because we are swapping X ($PVENT) -> Y (USDC)
  const swapForY_B = true;
  const binArraysB = await dlmmPool.getBinArrayForSwap(swapForY_B);
  console.log(`Bin arrays for Swap B: ${binArraysB.length} bin array(s) found`);

  const quoteB = await dlmmPool.swapQuote(swapBAmount, swapForY_B, new BN(500), binArraysB);
  console.log(`Swap B Quote: In = ${Number(quoteB.consumedInAmount) / 1e6} $PVENT -> Out = ${Number(quoteB.outAmount) / 1e6} USDC (Fee: ${quoteB.fee ? quoteB.fee.toString() : "N/A"})`);

  const swapTxB = await dlmmPool.swap({
    inToken: pventMint,
    outToken: usdcMint,
    inAmount: swapBAmount,
    minOutAmount: quoteB.minOutAmount,
    lbPair: lbPair,
    user: deployer.publicKey,
    binArraysPubkey: binArraysB.map((b: any) => b.publicKey),
  });

  const latestBlockhashB = await connection.getLatestBlockhash("confirmed");
  swapTxB.recentBlockhash = latestBlockhashB.blockhash;
  swapTxB.feePayer = deployer.publicKey;
  const txSigB = await sendAndConfirmTransaction(connection, swapTxB, [deployer], { commitment: "confirmed" });
  console.log(`✅ Swap B Confirmed!`);
  console.log(`Tx Signature: https://explorer.solana.com/tx/${txSigB}?cluster=devnet`);

  // Final reserves check
  const resXAfter = await getAccount(connection, reserveX);
  const resYAfter = await getAccount(connection, reserveY);
  console.log(`\n--- Final Pool Reserves & Net Impact ---`);
  console.log(`Reserve X ($PVENT): ${Number(resXAfter.amount) / 1e6} $PVENT (Net change: ${(Number(resXAfter.amount) - Number(resXBefore.amount)) / 1e6} $PVENT)`);
  console.log(`Reserve Y (USDC): ${Number(resYAfter.amount) / 1e6} USDC (Net change: ${(Number(resYAfter.amount) - Number(resYBefore.amount)) / 1e6} USDC)`);

  const result = {
    step: "Phase 2: Meteora DLMM Secondary Swaps",
    swapA: {
      action: "100 USDC -> $PVENT",
      signature: txSigA,
      explorerUrl: `https://explorer.solana.com/tx/${txSigA}?cluster=devnet`,
      usdcIn: 100,
      pventOut: Number(quoteA.outAmount) / 1e6
    },
    swapB: {
      action: "500 $PVENT -> USDC",
      signature: txSigB,
      explorerUrl: `https://explorer.solana.com/tx/${txSigB}?cluster=devnet`,
      pventIn: 500,
      usdcOut: Number(quoteB.outAmount) / 1e6
    },
    reserves: {
      initialX: Number(resXBefore.amount) / 1e6,
      initialY: Number(resYBefore.amount) / 1e6,
      finalX: Number(resXAfter.amount) / 1e6,
      finalY: Number(resYAfter.amount) / 1e6
    },
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.resolve(__dirname, "..", "..", "docs", "PHASE2_METEORA_SWAPS_RESULT.json");
  fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
  console.log(`✅ Results logged to ${resultsPath}`);
}

main().catch((err) => {
  console.error("❌ Meteora swap failed:", err);
  process.exit(1);
});
