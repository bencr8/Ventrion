import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Connection,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  Transaction
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DLMM_PROGRAM_ID = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

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
  console.log("💎 VENTRION PROTOCOL: STAKING, DLMM FEE HARVESTING & O(1) DIVIDENDS (PHASE 4)");
  console.log("================================================================================\n");

  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  console.log(`RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load Deployer (Holder 1)
  const deployerKeyPath = path.resolve(os.homedir(), ".config", "solana", "id.json");
  const holder1 = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(deployerKeyPath, "utf-8"))));
  console.log(`Holder 1 (Deployer): ${holder1.publicKey.toBase58()}`);

  // Load Clean Investor (Holder 2)
  const holder2KeyPath = path.resolve(__dirname, "..", ".clean_investor.json");
  const holder2 = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(holder2KeyPath, "utf-8"))));
  console.log(`Holder 2 (Clean Investor): ${holder2.publicKey.toBase58()}`);

  const wallet = new anchor.Wallet(holder1);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "..", "target", "idl", "ventrion_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
  const program = new Program(idl, provider);

  const ventureTokenMint = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
  const usdcMint = new PublicKey("5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt");
  const lbPair = new PublicKey("Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h");

  const [globalConfigPda] = PublicKey.findProgramAddressSync([Buffer.from("global_config")], programId);
  const [venturePda] = PublicKey.findProgramAddressSync([Buffer.from("venture"), ventureTokenMint.toBuffer()], programId);
  const [fundingRound0Pda] = PublicKey.findProgramAddressSync([Buffer.from("funding_round"), venturePda.toBuffer(), Buffer.from([0])], programId);
  const [dlmmCustodyPda] = PublicKey.findProgramAddressSync([Buffer.from("dlmm_custody"), venturePda.toBuffer()], programId);
  const [custodyUsdcPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_usdc"), venturePda.toBuffer()], programId);
  const [custodySharesPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_shares"), venturePda.toBuffer()], programId);
  const [dividendVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault"), venturePda.toBuffer()], programId);
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("master_lock_vault"), venturePda.toBuffer()], programId);
  const [stakedSharesVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("staked_shares_vault"), venturePda.toBuffer()], programId);
  const [dlmmPosition0Pda] = PublicKey.findProgramAddressSync([Buffer.from("dlmm_position"), fundingRound0Pda.toBuffer()], programId);

  const [reserveX] = PublicKey.findProgramAddressSync([lbPair.toBuffer(), ventureTokenMint.toBuffer()], DLMM_PROGRAM_ID);
  const [reserveY] = PublicKey.findProgramAddressSync([lbPair.toBuffer(), usdcMint.toBuffer()], DLMM_PROGRAM_ID);
  const binArrayLower = deriveBinArray(lbPair, -34n);
  const binArrayUpper = deriveBinArray(lbPair, -33n);
  const eventAuthority = deriveEventAuthority();

  const holder1UsdcAta = (await getOrCreateAssociatedTokenAccount(connection, holder1, usdcMint, holder1.publicKey)).address;
  const holder1ShareAta = (await getOrCreateAssociatedTokenAccount(connection, holder1, ventureTokenMint, holder1.publicKey)).address;
  const holder2UsdcAta = (await getOrCreateAssociatedTokenAccount(connection, holder1, usdcMint, holder2.publicKey)).address;
  const holder2ShareAta = (await getOrCreateAssociatedTokenAccount(connection, holder1, ventureTokenMint, holder2.publicKey)).address;

  // ---------------------------------------------------------------------------
  // STEP 1: FUND HOLDER 2 WITH SOL & $PVENT IF NEEDED
  // ---------------------------------------------------------------------------
  console.log("\n--- Checking Holder 2 SOL & Share Balances ---");
  const holder2SolBalance = await connection.getBalance(holder2.publicKey);
  if (holder2SolBalance < 0.05 * 1e9) {
    console.log("Funding Holder 2 with 0.1 SOL for gas...");
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: holder1.publicKey,
        toPubkey: holder2.publicKey,
        lamports: 0.1 * 1e9
      })
    );
    await sendAndConfirmTransaction(connection, tx, [holder1]);
    console.log("Holder 2 funded with 0.1 SOL.");
  }

  const holder2ShareAcc = await getAccount(connection, holder2ShareAta);
  if (holder2ShareAcc.amount < 5_000n * 1_000_000n) {
    console.log("Transferring 5,000 $PVENT from Holder 1 to Holder 2...");
    await transfer(
      connection,
      holder1,
      holder1ShareAta,
      holder2ShareAta,
      holder1.publicKey,
      5_000n * 1_000_000n
    );
    console.log("Transferred 5,000 $PVENT to Holder 2.");
  }

  // ---------------------------------------------------------------------------
  // STEP 2: STAKE $PVENT SHARES (HOLDER 1 & HOLDER 2)
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("📥 STEP 2: DEPOSITING INVESTOR SHARES INTO O(1) STAKING POOL");
  console.log("=======================================================");

  const [holder1VaultPda] = PublicKey.findProgramAddressSync([Buffer.from("investor_vault"), venturePda.toBuffer(), holder1.publicKey.toBuffer()], programId);
  const [holder2VaultPda] = PublicKey.findProgramAddressSync([Buffer.from("investor_vault"), venturePda.toBuffer(), holder2.publicKey.toBuffer()], programId);

  // Holder 1 stakes 15,000 shares with 180-day lock (1.5x multiplier -> 22,500 effective weight)
  let stakeTx1 = "ALREADY_STAKED";
  let h1VaultExists = false;
  try {
    const h1Vault = await program.account.investorVault.fetch(holder1VaultPda);
    h1VaultExists = h1Vault.isActive;
  } catch {}

  if (!h1VaultExists) {
    console.log("Holder 1 staking 15,000 $PVENT (180-day lock -> 1.5x multiplier)...");
    stakeTx1 = await sendWithRetry("Holder 1 Stake 15,000 Shares", () =>
      program.methods
        .depositInvestorShares(new BN(15_000 * 1e6), new BN(180 * 86400))
        .accountsStrict({
          investor: holder1.publicKey,
          venture: venturePda,
          investorVault: holder1VaultPda,
          investorShareAccount: holder1ShareAta,
          stakedSharesVault: stakedSharesVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  } else {
    console.log("Holder 1 already staked.");
  }

  // Holder 2 stakes 5,000 shares with 0-day lock (1.0x multiplier -> 5,000 effective weight)
  let stakeTx2 = "ALREADY_STAKED";
  let h2VaultExists = false;
  try {
    const h2Vault = await program.account.investorVault.fetch(holder2VaultPda);
    h2VaultExists = h2Vault.isActive;
  } catch {}

  if (!h2VaultExists) {
    console.log("Holder 2 staking 5,000 $PVENT (0-day flexible lock -> 1.0x multiplier)...");
    const holder2Provider = new anchor.AnchorProvider(connection, new anchor.Wallet(holder2), { commitment: "confirmed" });
    const holder2Program = new Program(idl, holder2Provider);
    stakeTx2 = await sendWithRetry("Holder 2 Stake 5,000 Shares", () =>
      holder2Program.methods
        .depositInvestorShares(new BN(5_000 * 1e6), new BN(0))
        .accountsStrict({
          investor: holder2.publicKey,
          venture: venturePda,
          investorVault: holder2VaultPda,
          investorShareAccount: holder2ShareAta,
          stakedSharesVault: stakedSharesVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );
  } else {
    console.log("Holder 2 already staked.");
  }

  const updatedVenture = await program.account.ventureState.fetch(venturePda);
  console.log(`\nTotal Staked in Vaults: ${Number(updatedVenture.totalStakedInVaults) / 1e6} $PVENT`);
  console.log(`Total Dividend Weight Units: ${updatedVenture.totalDividendWeightUnits.toString()}`);

  // ---------------------------------------------------------------------------
  // STEP 3: HARVEST METEORA DLMM FEES INTO DIVIDEND VAULT
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🌾 STEP 3: HARVESTING METEORA DLMM ACCRUED TRADING FEES");
  console.log("=======================================================");

  const harvestTx = await sendWithRetry("Harvest DLMM Fees", () =>
    program.methods
      .harvestDlmmFees()
      .accountsStrict({
        harvester: holder1.publicKey,
        globalConfig: globalConfigPda,
        venture: venturePda,
        fundingRound: fundingRound0Pda,
        dlmmCustody: dlmmCustodyPda,
        custodyUsdc: custodyUsdcPda,
        custodyShares: custodySharesPda,
        dividendVault: dividendVaultPda,
        masterLockVault: masterLockVaultPda,
        feeTreasuryUsdc: holder1UsdcAta,
        usdcMint: usdcMint,
        ventureTokenMint: ventureTokenMint,
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
      .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })])
      .rpc()
  );

  console.log(`✅ DLMM Fees Harvested! Tx: https://explorer.solana.com/tx/${harvestTx}?cluster=devnet`);

  // ---------------------------------------------------------------------------
  // STEP 4: DISTRIBUTE ECOSYSTEM REVENUE TO SIMULATE REAL B2B GMV INFLOW
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("💰 STEP 4: DEPOSITING ECOSYSTEM REVENUE ($100 USDC)");
  console.log("=======================================================");

  const ecoDividendAmount = 100n * 1_000_000n; // 100 USDC
  const refHash = Buffer.alloc(32);
  Buffer.from("solana.pay.merchant.clearing").copy(refHash);

  const ecoTx = await sendWithRetry("Deposit Ecosystem Revenue Fees", () =>
    program.methods
      .depositEcosystemFees(new BN(ecoDividendAmount.toString()), Array.from(refHash))
      .accountsStrict({
        depositor: holder1.publicKey,
        venture: venturePda,
        depositorUsdc: holder1UsdcAta,
        dividendVault: dividendVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
  );
  console.log(`✅ Ecosystem Revenue Deposited! Tx: https://explorer.solana.com/tx/${ecoTx}?cluster=devnet`);

  const ventureAfterDistribution = await program.account.ventureState.fetch(venturePda);
  console.log(`Accumulator acc_dividend_per_weight_unit: ${ventureAfterDistribution.accDividendPerWeightUnit.toString()}`);
  console.log(`Total Dividends Distributed: ${Number(ventureAfterDistribution.totalDividendsDistributed) / 1e6} USDC`);

  // ---------------------------------------------------------------------------
  // STEP 5: CLAIM O(1) DIVIDENDS FOR BOTH STAKERS
  // ---------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("🎁 STEP 5: CLAIMING O(1) INVESTOR DIVIDENDS");
  console.log("=======================================================");

  const h1UsdcBeforeClaim = Number((await getAccount(connection, holder1UsdcAta)).amount) / 1e6;
  const h2UsdcBeforeClaim = Number((await getAccount(connection, holder2UsdcAta)).amount) / 1e6;

  // Claim Holder 1
  const claimTx1 = await sendWithRetry("Holder 1 Claim Dividends", () =>
    program.methods
      .claimInvestorDividends()
      .accountsStrict({
        investor: holder1.publicKey,
        venture: venturePda,
        investorVault: holder1VaultPda,
        dividendVault: dividendVaultPda,
        investorUsdc: holder1UsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
  );

  // Claim Holder 2
  const holder2Provider = new anchor.AnchorProvider(connection, new anchor.Wallet(holder2), { commitment: "confirmed" });
  const holder2Program = new Program(idl, holder2Provider);
  const claimTx2 = await sendWithRetry("Holder 2 Claim Dividends", () =>
    holder2Program.methods
      .claimInvestorDividends()
      .accountsStrict({
        investor: holder2.publicKey,
        venture: venturePda,
        investorVault: holder2VaultPda,
        dividendVault: dividendVaultPda,
        investorUsdc: holder2UsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
  );

  const h1UsdcAfterClaim = Number((await getAccount(connection, holder1UsdcAta)).amount) / 1e6;
  const h2UsdcAfterClaim = Number((await getAccount(connection, holder2UsdcAta)).amount) / 1e6;

  const h1Received = h1UsdcAfterClaim - h1UsdcBeforeClaim;
  const h2Received = h2UsdcAfterClaim - h2UsdcBeforeClaim;

  console.log(`\n--- Dividend Distribution Results ---`);
  console.log(`Holder 1 (15k shares, 1.5x lock, weight 22,500 ~ 81.8%): Claimed ${h1Received.toFixed(4)} USDC`);
  console.log(`Holder 2 (5k shares, 1.0x lock, weight 5,000 ~ 18.2%): Claimed ${h2Received.toFixed(4)} USDC`);
  console.log(`Total Claimed: ${(h1Received + h2Received).toFixed(4)} USDC`);
  console.log(`Ratio H1 / H2: ${(h1Received / h2Received).toFixed(2)}x (Expected 22.5k / 5k = 4.50x)`);

  const results = {
    step: "Phase 4: Fee Harvesting, Staking & O(1) Dividends",
    holder1: {
      address: holder1.publicKey.toBase58(),
      stakeTx: stakeTx1,
      claimTx: claimTx1,
      dividendsReceivedUsdc: h1Received
    },
    holder2: {
      address: holder2.publicKey.toBase58(),
      stakeTx: stakeTx2,
      claimTx: claimTx2,
      dividendsReceivedUsdc: h2Received
    },
    harvestTx: harvestTx,
    ecosystemDepositTx: ecoTx,
    ratio: (h1Received / h2Received).toFixed(2),
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.resolve(__dirname, "..", "..", "docs", "PHASE4_STAKING_DIVIDENDS_RESULT.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results logged to ${resultsPath}`);
}

main().catch((err) => {
  console.error("❌ Staking & Dividend lifecycle failed:", err);
  process.exit(1);
});
