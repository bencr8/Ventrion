# Ventrion ($VTRN)
### Tokenize Real-World Businesses, Startups, and Ventures on Solana.

[![Solana](https://img.shields.io/badge/Blockchain-Solana-blue?style=flat&logo=solana)](https://solana.com)
[![Anchor Framework](https://img.shields.io/badge/Framework-Anchor%200.30-orange?style=flat)](https://www.anchor-lang.com/)
[![Meteora DLMM](https://img.shields.io/badge/DEX-Meteora%20DLMM%20%26%20DBC-purple?style=flat)](https://meteora.ag)
[![License](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)

---

<!-- HERO BANNER PLACEHOLDER -->
<p align="center">
  <img src="./Documentation/assets/hero_banner.png" alt="Ventrion Hero Banner" width="100%">
</p>

---

## Overview

When founders want to bring a real business on-chain today, the only visible options are meme coin launchpads like Pump.fun. Those platforms were designed for fast speculation, not for building enduring companies:

* **Lifespans in hours:** Tokens launch, pump with sniper bots, dump on retail, and die by midnight.
* **Founders get exploited:** Creators do not even own their equity upon launch. They must spend their own capital to buy shares off an aggressive curve against bots.
* **Zero accountability:** 100% of raised capital goes straight into creator private wallets with zero milestones, zero roadmaps, and zero refunds.
* **The SOL volatility trap:** Denominating operating budgets in volatile gas tokens makes payroll and real budgeting impossible.

**Ventrion replaces this with institutional venture standards on Solana.**  
Founders mint 100% of their company equity (exactly 1,000,000 shares) directly into an on-chain vault without paying a single dollar. Capital is raised in stable USDC on a fair, flat curve, liquidity is permanently locked, and 75% of funds are guarded by on-chain milestone escrows.

---

<!-- COMPARISON INFOGRAPHIC PLACEHOLDER -->
<p align="center">
  <img src="./Documentation/assets/meme_vs_ventrion.png" alt="Meme Launchpads vs Ventrion" width="100%">
</p>

---

## How Ventrion Works

Ventrion replaces chaos with five transparent steps:

### 1. Company Genesis
You mint exactly **1,000,000 common shares** directly into an on-chain company vault. In the very same transaction, the mint authority is permanently destroyed. Dilution is impossible, and you own 100% of your company from day one.

### 2. Fair Capital Raising
Primary financing happens on a flat, near-linear curve powered by Meteora DBC in **canonical USDC**. The first backer and the last backer pay the same fair price. No bots, no frontrunning, no sandwich attacks.

### 3. Permanent Liquidity & Milestone Escrows
When the funding target is reached:
* **25%** of raised USDC and round shares seed a permanent, locked Meteora DLMM pool. Liquidity can never be pulled.
* **75%** of raised USDC is locked in an on-chain milestone escrow, released only as the team delivers real results.

### 4. Honest Governance & Backer Protection
Backers hold real power over escrowed funds:
* **Veto Power:** If a milestone deadline passes without delivery, a 7-day review window opens. A 33.33% veto halts payments.
* **The Ragequit Right:** If goals are breached or overdue, backers can exit at any time, returning their shares for a direct pro-rata cash refund.

### 5. Smart Staking & Real Dividends
100% of company operating profits and trading fees flow directly to stakers in dedicated investor vaults. Commit your stock for longer horizons to earn up to **2x to 3x dividend multipliers**, with early exits protected by a fair, capped 25% penalty.

---

<!-- LIFECYCLE DIAGRAM PLACEHOLDER -->
<p align="center">
  <img src="./Documentation/assets/protocol_lifecycle.png" alt="Ventrion Protocol Lifecycle" width="100%">
</p>

---

## The Core Numbers

| Feature | Ventrion Standard | What It Means |
| :--- | :--- | :--- |
| **Share Supply** | **1,000,000 Fixed** | Fixed forever. Mint authority burned at creation. |
| **Currency** | **100% USDC** | Real dollar stability for payroll, operations, and dividends. |
| **Liquidity Seed** | **25% Irrevocable** | Permanently locked in Meteora DLMM. Zero rugpull risk. |
| **Milestone Escrow** | **75% of Raise** | Stays locked in smart contracts until goals are met. |
| **Veto Threshold** | **33.33% Minority** | One third of primary backers can stop any questionable release. |
| **Slashing Cap** | **25% Maximum** | Fair time-decaying penalty. You always keep at least 75%. |
| **Staking Boost** | **1.0x to 3.0x** | Higher dividends for long-term loyal shareholders. |

---

<!-- PLATFORM UI PREVIEW PLACEHOLDER -->
<p align="center">
  <img src="./Documentation/assets/platform_preview.png" alt="Ventrion Platform Interface" width="100%">
</p>

---

## In-Depth Documentation

Looking for the complete mathematical models, PDA seed matrices, data layouts, and smart contract specifications?

👉 **[Read the Full Ventrion Main Manifesto](./Documentation/VENTRION_MAIN_MANIFEST.md)**

---

## Repository Structure

```
Ventrion/
├── anchor/          # Core Solana smart contracts (Rust / Anchor 0.30)
├── Documentation/   # Master Manifesto, specifications, and visual assets
├── sdk/             # TypeScript client library (@ventrion/sdk)
├── web/             # Next.js web application and dashboard
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
