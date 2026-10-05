import { Connection } from "@solana/web3.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const DLMM = require("@meteora-ag/dlmm").default || require("@meteora-ag/dlmm");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");
  const presets = await DLMM.getAllPresetParams(connection);
  console.log("Total devnet DLMM presets:", presets.length);
  for (const p of presets) {
    console.log(`Pubkey: ${p.publicKey.toBase58()}, binStep: ${p.account.binStep}, baseFactor: ${p.account.baseFactor}`);
  }
}

main().catch(console.error);
