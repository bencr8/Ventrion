#!/usr/bin/env node
/**
 * Fetches the real, deployed Meteora DLMM artifacts used by the E2E suite:
 *
 *   tests/fixtures/lb_clmm.so                 – ELF of LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo
 *   tests/fixtures/preset_parameter2.json      – a live `PresetParameter2` account
 *
 * Both are read straight from mainnet-beta (no modification), so the tests run
 * the exact bytecode and pool parameters a production graduation uses.
 * The JSON uses the `solana account --output json` layout and can also be passed
 * to `solana-test-validator --account`.
 *
 * Usage: node scripts/fetch-meteora-fixtures.mjs [rpcUrl] [presetParameter2]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DLMM_PROGRAM_ID = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";
// Mainnet PresetParameter2: bin_step 50, base_factor 1000.
const DEFAULT_PRESET = "2iBzG8E7kL4hq4ymFjmecXd7XHufZiz81iyb2WQLrsW5";
const PRESET_PARAMETER2_DISCRIMINATOR = Buffer.from([171, 236, 148, 115, 162, 113, 222, 174]);
const PROGRAMDATA_METADATA_LEN = 45;

const rpcUrl = process.argv[2] ?? "https://api.mainnet-beta.solana.com";
const presetAddress = process.argv[3] ?? DEFAULT_PRESET;
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "tests", "fixtures");

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

async function getAccount(address) {
  const result = await rpc("getAccountInfo", [address, { encoding: "base64" }]);
  if (!result?.value) throw new Error(`account ${address} not found on ${rpcUrl}`);
  return result.value;
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes) {
  let n = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  let out = "";
  while (n > 0n) {
    out = BASE58[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out;
}

async function main() {
  mkdirSync(fixturesDir, { recursive: true });

  // 1. DLMM program: Program account -> ProgramData account -> ELF.
  const program = await getAccount(DLMM_PROGRAM_ID);
  const programData = Buffer.from(program.data[0], "base64");
  if (programData.readUInt32LE(0) !== 2) throw new Error("DLMM is not an upgradeable program");
  const programDataAddress = base58(programData.subarray(4, 36));
  const programDataAccount = await getAccount(programDataAddress);
  const elf = Buffer.from(programDataAccount.data[0], "base64").subarray(PROGRAMDATA_METADATA_LEN);
  if (elf.subarray(0, 4).toString("latin1") !== "\x7fELF") throw new Error("ProgramData does not contain an ELF");
  writeFileSync(join(fixturesDir, "lb_clmm.so"), elf);
  console.log(`lb_clmm.so          ${elf.length} bytes (programdata ${programDataAddress})`);

  // 2. PresetParameter2 account.
  const preset = await getAccount(presetAddress);
  const presetData = Buffer.from(preset.data[0], "base64");
  if (preset.owner !== DLMM_PROGRAM_ID || !presetData.subarray(0, 8).equals(PRESET_PARAMETER2_DISCRIMINATOR)) {
    throw new Error(`${presetAddress} is not a DLMM PresetParameter2 account`);
  }
  const fixture = {
    pubkey: presetAddress,
    account: {
      lamports: preset.lamports,
      data: [preset.data[0], "base64"],
      owner: preset.owner,
      executable: preset.executable,
      rentEpoch: 0,
      space: presetData.length,
    },
  };
  writeFileSync(join(fixturesDir, "preset_parameter2.json"), JSON.stringify(fixture, null, 2));
  console.log(
    `preset_parameter2   ${presetAddress} bin_step=${presetData.readUInt16LE(8)} base_factor=${presetData.readUInt16LE(10)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
