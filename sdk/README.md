# @ventrion/sdk

Official TypeScript SDK for the **Ventrion Protocol** on Solana.

---

## Installation

```bash
npm install @ventrion/sdk @solana/web3.js @coral-xyz/anchor
```

---

## Quickstart

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { VentrionClient, VENTRION_PROGRAM_ID } from "@ventrion/sdk";

// Initialize connection and provider
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const provider = new AnchorProvider(connection, wallet, {});

// Initialize Ventrion client
const client = new VentrionClient(provider, VENTRION_PROGRAM_ID);

// Fetch Pioneer Venture state
const PVENT_MINT = new PublicKey("5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn");
const venture = await client.getVentureState(PVENT_MINT);

console.log("Venture Status:", venture.status);
console.log("Total Supply:", venture.totalSupply.toString());
console.log("Circulating Float:", venture.circulatingPublicFloat.toString());
```

---

## Core Capabilities

* **PDA Derivations:** Full cryptographic seed derivations for ventures, master locks, milestone escrows, DLMM custody, and staking vaults.
* **On-Chain State Deserialization:** Zero-copy typed parsing of global configurations, funding rounds, and milestone governance progress.
* **Meteora DLMM Integration:** Derive canonical Meteora DLMM pool addresses and positions.

---

## License

Apache-2.0
