# Ventrion ($VENT)
### The Institutional Standard for Real-World Business, Startup, and Venture Tokenization on Solana.

[![Solana](https://img.shields.io/badge/Blockchain-Solana%20Devnet-blue?style=flat&logo=solana)](https://explorer.solana.com/address/37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8?cluster=devnet)
[![Anchor Framework](https://img.shields.io/badge/Framework-Anchor%200.30.1-orange?style=flat)](https://www.anchor-lang.com/)
[![Meteora DLMM](https://img.shields.io/badge/DEX-Meteora%20DLMM%20v2-purple?style=flat)](https://meteora.ag)
[![License](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)

---

<!-- HERO BANNER -->
<p align="center">
  <img src="./Documentation/assets/hero_banner.png" alt="Ventrion Hero Banner" width="100%">
</p>

---

## Live Solana Devnet Deployment & Verification

Ventrion is deployed and cryptographically verified on Solana Devnet with native Meteora DLMM v2 integration:

* **Canonical Program ID:** [`37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8`](https://explorer.solana.com/address/37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8?cluster=devnet)
* **Mother-Token ($VENT) Mint:** [`5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ`](https://explorer.solana.com/address/5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ?cluster=devnet)
* **Settlement USDC Mint (Devnet):** [`5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt`](https://explorer.solana.com/address/5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt?cluster=devnet)
* **Global Config PDA:** [`9W5BqZ32GkZyhbs6KqhfWCNwi1KXNiZemBerMsb2n57M`](https://explorer.solana.com/address/9W5BqZ32GkZyhbs6KqhfWCNwi1KXNiZemBerMsb2n57M?cluster=devnet)
* **Meteora DLMM Program ID:** [`LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`](https://explorer.solana.com/address/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?cluster=devnet)

### Live Verified Ventures
1. **Ventrion Pioneer 1 ($PVENT):**
   * **Venture Share Mint:** [`5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn`](https://explorer.solana.com/address/5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn?cluster=devnet)
   * **Meteora DLMM Pool:** [`Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h`](https://app.meteora.ag/dlmm/Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h) | [Solscan](https://solscan.io/account/Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h?cluster=devnet)
   * **Permanent DLMM Position:** [`CZe7nkMMrZUFKzKeQeNhwCLprehRvh4MP8gC2JZ3guZk`](https://explorer.solana.com/address/CZe7nkMMrZUFKzKeQeNhwCLprehRvh4MP8gC2JZ3guZk?cluster=devnet)
2. **QuantumCompute Systems ($QCMP) with Metaplex Token Metadata:**
   * **Company Mint:** [`Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E`](https://explorer.solana.com/address/Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E?cluster=devnet)
   * **Metaplex Metadata PDA:** [`AAJwDz75nu3oxL23xQzxTUgQYdR7T5F1b9YU5s4b8GzH`](https://explorer.solana.com/address/AAJwDz75nu3oxL23xQzxTUgQYdR7T5F1b9YU5s4b8GzH?cluster=devnet)
   * **Meteora DLMM Pool:** [`CKfSPXBoLq2Xp5KNPDdp6wKYRBMX5FtMYja8HJKQEvDh`](https://explorer.solana.com/address/CKfSPXBoLq2Xp5KNPDdp6wKYRBMX5FtMYja8HJKQEvDh?cluster=devnet)

👉 **For the complete forensic deployment matrix and cryptographic transaction proofs, see [MANIFEST.md](./MANIFEST.md).**

---

## Overview

When founders want to bring a real business on-chain today, the only visible options are speculative meme coin launchpads. Those platforms were designed for fast financial speculation, not for building enduring companies:

* **Lifespans in hours:** Tokens launch, pump with sniper bots, dump on retail, and die by midnight.
* **Founders get exploited:** Creators do not own their equity upon launch. They must spend their own capital to buy tokens off an aggressive curve against sniper bots.
* **Zero accountability:** 100% of raised capital goes straight into creator personal wallets with zero milestones, zero roadmaps, and zero refunds.
* **The SOL volatility trap:** Denominating operating budgets in volatile gas tokens makes payroll and real budgeting impossible.

**Ventrion replaces this with institutional venture standards on Solana.**  
Founders mint 100% of their company equity (exactly 1,000,000 shares) directly into an on-chain vault without paying a single dollar. Capital is raised in canonical USDC on a flat, fair bonding curve powered by Meteora DBC. Liquidity is permanently locked in Meteora DLMM, and unspent capital is guarded by on-chain milestone escrows protecting both founder operational focus and backer capital.

---

## How Ventrion Works

Ventrion replaces chaos with five transparent stages:

### 1. Company Genesis
You mint exactly **1,000,000 common shares** directly into an on-chain company vault (`MasterLockVault`). In the very same atomic transaction, the mint authority is permanently revoked. Share dilution is mathematically impossible, and the founder establishes clean cap-table ownership from day one.

### 2. Fair Capital Raising
Primary financing happens on a flat, near-linear curve in **canonical USDC**. The first backer and the last backer pay the same fair price. Frontrunning bots and sandwich attacks are eliminated, with 100% two-way liquidity prior to cap closure.

### 3. Permanent Liquidity & Milestone Escrows
When the funding target is reached, capital is distributed atomically in graduation:
* **17.0%** of raised USDC and round shares seed a permanent, locked Meteora DLMM pool. Liquidity can never be pulled.
* **max($3,000, 3%)** covers legal corporate setup (MIDAO DAO LLC or Swiss Association registration).
* **Upfront Working Capital (Capped at 15%):** Founder-defined initial cash to begin immediate operations.
* **Milestone Escrow:** The entire remaining capital is locked in an on-chain milestone vault, released only as real deliverables are completed.

### 4. Legal Contract Synthesis & $VENT Decentralized Verification
Real businesses require operational certainty, not arbitrary 14-day time windows where anonymous internet trolls can freeze payroll:
* **Institutional Contract Synthesis:** Ventrion acts as legal architect, translating founder roadmap commitments into binding corporate contracts (MIDAO DAO LLC Operating Agreement, SAFE, or Token Warrant) countersigned by the CEO.
* **Decentralized $VENT Staker Approval:** Mother-token ($VENT) stakers vote on company verification at `CapReached`. Reaching >50% majority verifies the venture, unlocking secondary DLMM liquidity and 1:1 common share redemption.
* **Tranche-Specific Milestone Governance:** Each funding round possesses its own isolated milestone escrow. Only primary backers who funded that specific round hold voting rights. Releases occur via a dual-path trigger: either immediate fast-track payout (>50% active backer vote) or automatic 7-day optimistic release (unless >=33.33% of primary shares cast a veto). If rework is needed, founders utilize up to 3 cure cycles (`amend_milestone`).

### 5. Sovereign Founder Flexibility & Institutional Safeguards
* **Sovereign Token Allocation:** Founders choose whether to lock tokens in linear vesting streams, milestone tranches, or stake directly in the `InvestorVault` from day one to earn protocol yield alongside community backers.
* **Tranche-Specific Capital Protection:** Unspent milestone capital remains safely locked in the round-specific `MilestoneEscrow`. Backers retain floor-price ragequit rights if deliverables are breached.
* **Continuous Secondary Liquidity:** Investors trade common shares directly on the 17% permanently locked Meteora DLMM pool.
* **Constant-Time O(1) Yield:** Stakers lock common shares for flexible horizons (0 to 730 days) to earn **1.0x to 3.0x dividend multipliers** computed in O(1) time via an overflow-safe accumulator scaled by $10^{12}$ with 256-bit unsigned math.

---

## The Core Numbers

| Feature | Ventrion Standard | What It Means |
| :--- | :--- | :--- |
| **Share Supply** | **1,000,000 Fixed** | Fixed forever. Mint authority permanently revoked at creation. |
| **Quote Currency** | **100% Canonical USDC** | Real dollar stability for payroll, operations, and rewards. |
| **Liquidity Seed** | **17.0% Irrevocable** | Permanently locked in Meteora DLMM. Zero rugpull risk. |
| **Legal Setup Fee** | **max($3,000, 3%)** | Covers MIDAO DAO LLC setup ($3,000 tier for <$250k funding) and filings. |
| **Upfront Capital** | **Capped at 15% Runway** | Flexible founder runway validated in the $VENT verification vote. |
| **Venture Verification**| **$VENT Majority (>50%)**| Decentralized mother token approval required for launch activation. |
| **Founder Sovereignity**| **Full Flexibility** | Linear vesting, milestone tranches, or direct staking from day one. |
| **Staking Multiplier** | **1.0x to 3.0x** | Higher reward shares for long-term committed token holders. |
| **Platform Royalty** | **0.5% LP Cut** | Protocol fee routed to Mother Token ($VENT) stakers. |

---

## In-Depth Documentation

Looking for the complete mathematical models, PDA seed matrices, data layouts, and smart contract specifications?

👉 **[Read the Full Ventrion Protocol Manifesto (MANIFEST.md)](./MANIFEST.md)**

---

## Repository Structure

```
Ventrion/
├── anchor/          # Core Solana smart contracts (Rust / Anchor 0.30.1)
│   ├── programs/    # ventrion_protocol program
│   ├── scripts/     # Live Devnet deployment & verification scripts
│   └── tests/       # End-to-end real lifecycle test suite
├── Documentation/   # Master Manifesto, specifications, and visual assets
├── sdk/             # Official TypeScript client library (@ventrion/sdk)
├── web/             # Next.js web application and venture dashboard
├── MANIFEST.md      # The Official Protocol Specification & Devnet Proofs
└── README.md        # Main repository overview
```

---

## Quickstart

```bash
# Clone the repository
git clone https://github.com/bencr8/Ventrion.git
cd Ventrion

# Build Solana programs
cd anchor
anchor build

# Run test suite
anchor test
```

---

## License

The core smart contracts are licensed under the [Business Source License 1.1 (BUSL-1.1)](LICENSE), converting automatically to Apache 2.0 on October 1, 2028. The client SDK is licensed under the Apache License 2.0.
