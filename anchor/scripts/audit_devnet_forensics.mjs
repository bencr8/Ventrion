import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getMint, getAccount } from "@solana/spl-token";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runForensics() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  console.log("=== VENTRION DEVNET FORENSIC DATA GATHERING ===");

  const programId = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
  const pventMint = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
  const usdcMint = new PublicKey("5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt");
  const ventMint = new PublicKey("5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ");
  const r0Mint = new PublicKey("GWyp7KVHoyGZFxsSWMVsDZcpLemPZgsNJAno7X5myKY9");
  const globalConfigPda = new PublicKey("9W5BqZ32GkZyhbs6KqhfWCNwi1KXNiZemBerMsb2n57M");
  const venturePda = new PublicKey("GsPUAiuzCcr1PnrkxSXQYosJMYLroDy8tnfcF8YfWSmG");
  const round0Pda = new PublicKey("ofPFE4gdAg7wkS3NLLPh4vZBMfh7SY5qtuuXq8kJ6ZZ");
  const meteoraPool = new PublicKey("Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h");
  const meteoraProgram = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");

  // 1. Program Info
  console.log("\n--- 1. PROGRAM INFO ---");
  const programAccount = await connection.getAccountInfo(programId);
  console.log("Program Exists:", !!programAccount);
  console.log("Program Owner:", programAccount?.owner.toBase58());
  console.log("Program Executable:", programAccount?.executable);
  
  // ProgramData PDA for BPF Upgradeable Loader
  const [programDataAddress] = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
  );
  console.log("ProgramData Address:", programDataAddress.toBase58());
  const programDataAccount = await connection.getAccountInfo(programDataAddress);
  if (programDataAccount) {
    console.log("ProgramData Data Len (Bytecode size):", programDataAccount.data.length, "bytes");
    // Parse upgrade authority from ProgramData header:
    // 0..4: discriminator (3 for ProgramData)
    // 4..12: slot
    // 12: Option<Pubkey> -> 1 = Some, followed by 32 bytes pubkey; 0 = None
    const hasUpgradeAuth = programDataAccount.data[12] === 1;
    let upgradeAuth = "None (Immutable)";
    if (hasUpgradeAuth) {
      upgradeAuth = new PublicKey(programDataAccount.data.slice(13, 45)).toBase58();
    }
    console.log("Program Upgrade Authority:", upgradeAuth);
  }

  // 2. Token Mints
  console.log("\n--- 2. TOKEN MINTS ---");
  for (const [name, mintPk] of [
    ["$VENT", ventMint],
    ["USDC", usdcMint],
    ["$PVENT", pventMint],
    ["Receipt R0", r0Mint]
  ]) {
    try {
      const mintInfo = await getMint(connection, mintPk);
      console.log(`${name} (${mintPk.toBase58()}):`);
      console.log(`  Supply: ${mintInfo.supply.toString()}`);
      console.log(`  Decimals: ${mintInfo.decimals}`);
      console.log(`  Mint Authority: ${mintInfo.mintAuthority ? mintInfo.mintAuthority.toBase58() : "null (REVOKED)"}`);
      console.log(`  Freeze Authority: ${mintInfo.freezeAuthority ? mintInfo.freezeAuthority.toBase58() : "null (REVOKED)"}`);
    } catch (e) {
      console.log(`  Error fetching ${name}:`, e.message);
    }
  }

  // 3. Meteora LB Pair Pool
  console.log("\n--- 3. METEORA LB PAIR POOL ---");
  const poolAcc = await connection.getAccountInfo(meteoraPool);
  console.log("Pool exists:", !!poolAcc);
  console.log("Pool Owner:", poolAcc?.owner.toBase58());
  console.log("Expected Meteora Program:", meteoraProgram.toBase58());
  console.log("Is Owner Meteora?:", poolAcc?.owner.equals(meteoraProgram));
  console.log("Pool Data Length:", poolAcc?.data.length);

  // Derive reserve X and reserve Y
  // Need to know sort order of tokenX and tokenY
  const tokenX = Buffer.compare(pventMint.toBuffer(), usdcMint.toBuffer()) < 0 ? pventMint : usdcMint;
  const tokenY = tokenX.equals(pventMint) ? usdcMint : pventMint;
  console.log("Token X:", tokenX.toBase58(), tokenX.equals(pventMint) ? "($PVENT)" : "(USDC)");
  console.log("Token Y:", tokenY.toBase58(), tokenY.equals(usdcMint) ? "(USDC)" : "($PVENT)");

  const [reserveX] = PublicKey.findProgramAddressSync([meteoraPool.toBuffer(), tokenX.toBuffer()], meteoraProgram);
  const [reserveY] = PublicKey.findProgramAddressSync([meteoraPool.toBuffer(), tokenY.toBuffer()], meteoraProgram);
  console.log("Reserve X PDA:", reserveX.toBase58());
  console.log("Reserve Y PDA:", reserveY.toBase58());

  try {
    const accX = await getAccount(connection, reserveX);
    console.log(`Reserve X (${tokenX.equals(pventMint) ? "$PVENT" : "USDC"}) Balance:`, accX.amount.toString(), `(Owner: ${accX.owner.toBase58()})`);
  } catch (e) {
    console.log("Error Reserve X:", e.message);
  }
  try {
    const accY = await getAccount(connection, reserveY);
    console.log(`Reserve Y (${tokenY.equals(usdcMint) ? "USDC" : "$PVENT"}) Balance:`, accY.amount.toString(), `(Owner: ${accY.owner.toBase58()})`);
  } catch (e) {
    console.log("Error Reserve Y:", e.message);
  }

  // 4. Deserializing Ventrion State Accounts using IDL
  console.log("\n--- 4. DESERIALIZING PROTOCOL ACCOUNTS ---");
  const idlPath = path.resolve(__dirname, "..", "target", "idl", "ventrion_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  const provider = new anchor.AnchorProvider(connection, dummyWallet, { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);

  try {
    const ventureData = await program.account.ventureState.fetch(venturePda);
    console.log("Venture State:", JSON.stringify(ventureData, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    console.log("Venture decode error:", e.message);
  }

  try {
    const round0Data = await program.account.fundingRound.fetch(round0Pda);
    console.log("Funding Round 0 State:", JSON.stringify(round0Data, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    console.log("Round 0 decode error:", e.message);
  }

  try {
    const configData = await program.account.globalConfig.fetch(globalConfigPda);
    console.log("Global Config State:", JSON.stringify(configData, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    console.log("Config decode error:", e.message);
  }

  // 5. Inspecting All Associated Protocol Vaults
  console.log("\n--- 5. PROTOCOL VAULTS BALANCES ---");
  const [masterLockVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("master_lock_vault"), venturePda.toBuffer()], programId);
  const [legalSetupVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("legal_setup_vault"), venturePda.toBuffer()], programId);
  const [roundUsdcVault0Pda] = PublicKey.findProgramAddressSync([Buffer.from("round_usdc_vault"), round0Pda.toBuffer()], programId);
  const [milestoneEscrow0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_escrow"), round0Pda.toBuffer()], programId);
  const [milestoneUsdcVault0Pda] = PublicKey.findProgramAddressSync([Buffer.from("milestone_usdc_vault"), milestoneEscrow0Pda.toBuffer()], programId);
  const [custodyUsdcPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_usdc"), venturePda.toBuffer()], programId);
  const [custodySharesPda] = PublicKey.findProgramAddressSync([Buffer.from("custody_shares"), venturePda.toBuffer()], programId);
  const [dlmmCustodyPda] = PublicKey.findProgramAddressSync([Buffer.from("dlmm_custody"), venturePda.toBuffer()], programId);
  const [vestingVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vesting_vault"), venturePda.toBuffer()], programId);

  const vaults = [
    { name: "Master Lock Vault ($PVENT)", pda: masterLockVaultPda },
    { name: "Legal Setup Vault ($PVENT)", pda: legalSetupVaultPda },
    { name: "Round 0 USDC Vault (USDC)", pda: roundUsdcVault0Pda },
    { name: "Milestone USDC Vault (USDC)", pda: milestoneUsdcVault0Pda },
    { name: "DLMM Custody USDC (USDC)", pda: custodyUsdcPda },
    { name: "DLMM Custody Shares ($PVENT)", pda: custodySharesPda },
    { name: "Founder Vesting Vault ($PVENT)", pda: vestingVaultPda }
  ];

  for (const v of vaults) {
    try {
      const tokAcc = await getAccount(connection, v.pda);
      console.log(`Vault ${v.name} (${v.pda.toBase58()}):`);
      console.log(`  Amount: ${tokAcc.amount.toString()}`);
      console.log(`  Mint: ${tokAcc.mint.toBase58()}`);
      console.log(`  Owner: ${tokAcc.owner.toBase58()}`);
    } catch (e) {
      console.log(`Vault ${v.name} (${v.pda.toBase58()}): Error fetching -> ${e.message}`);
    }
  }

  // 6. Signatures and Transactions
  console.log("\n--- 6. RECENT TRANSACTIONS FOR VENTURE STATE PDA ---");
  const signatures = await connection.getSignaturesForAddress(venturePda, { limit: 20 });
  console.log(`Total recent txs found for Venture PDA: ${signatures.length}`);
  for (const sig of signatures) {
    console.log(`  Sig: ${sig.signature} | Slot: ${sig.slot} | Err: ${JSON.stringify(sig.err)} | Memo: ${sig.memo}`);
  }
}

runForensics().catch(console.error);
