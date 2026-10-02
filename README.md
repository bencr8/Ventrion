# Ventrion ($VTRN)
### Tokenize Real-World Businesses, Startups, and Ventures on Solana.

[![Solana](https://img.shields.io/badge/Blockchain-Solana-blue?style=flat&logo=solana)](https://solana.com)
[![Anchor Framework](https://img.shields.io/badge/Framework-Anchor%200.30-orange?style=flat)](https://www.anchor-lang.com/)
[![Meteora DLMM](https://img.shields.io/badge/DEX-Meteora%20DLMM%20%26%20DBC-purple?style=flat)](https://meteora.ag)
[![License](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)

---

<!-- HERO BANNER -->
<p align="center">
  <img src="./Documentation/assets/hero_banner.png" alt="Ventrion Hero Banner" width="100%">
</p>

---

## Overview

When founders want to bring a real business on-chain today, the only visible options are speculative meme coin launchpads. Those platforms were designed for fast financial speculation, not for building enduring companies:

* **Lifespans in hours:** Tokens launch, pump with sniper bots, dump on retail, and die by midnight.
* **Founders get exploited:** Creators do not own their equity upon launch. They must spend their own capital to buy tokens off an aggressive curve against sniper bots.
* **Zero accountability:** 100% of raised capital goes straight into creator personal wallets with zero milestones, zero roadmaps, and zero refunds.
* **The SOL volatility trap:** Denominating operating budgets in volatile gas tokens makes payroll and real budgeting impossible.

**Ventrion replaces this with institutional venture standards on Solana.**  
Founders mint 100% of their company equity (exactly 1,000,000 shares) directly into an on-chain vault without paying a single dollar. Capital is raised in canonical USDC on a flat, fair bonding curve powered by Meteora DBC. Liquidity is permanently locked, and unspent capital is guarded by on-chain milestone escrows with optimistic review and ragequit protection.

---

## How Ventrion Works

Ventrion replaces chaos with five transparent stages:

### 1. Company Genesis
You mint exactly **1,000,000 common shares** directly into an on-chain company vault. In the very same atomic transaction, the mint authority is permanently revoked. Share dilution is mathematically impossible, and the founder establishes clean cap-table ownership from day one.

### 2. Fair Capital Raising
Primary financing happens on a flat, near-linear curve powered by Meteora DBC in **canonical USDC**. The first backer and the last backer pay the same fair price. Frontrunning bots and sandwich attacks are eliminated.

### 3. Permanent Liquidity & Milestone Escrows
When the funding target is reached, capital is distributed atomically in a two-step graduation:
* **17.0%** of raised USDC and round shares seed a permanent, locked Meteora DLMM pool. Liquidity can never be pulled.
* **max($5,000, 5%)** covers legal corporate setup (MIDAO DAO LLC or Swiss Association registration).
* **Upfront Working Capital (Capped at 15%):** Founder-defined initial cash to begin immediate operations.
* **Milestone Escrow:** The entire remaining capital is locked in an on-chain milestone vault, released only as real deliverables are completed.

### 4. Autonomous Milestones, Optimistic Review & Challenge Bonds
Founders maintain full operational autonomy without bureaucratic DAO voting:
* **Autonomous Submission:** The founder submits a deliverable proof (SHA256 hash anchored to Arweave).
* **14-Day Optimistic Window:** Funds release automatically after 14 days unless formally challenged.
* **Anti-Trolling Challenge Bond:** To challenge a delivery, a backer must deposit `min($1,000 USDC, 5% of tranche)` with a $250 USDC minimum floor. Disputes are resolved by neutral arbitration oracles (Kleros Resolver / Squads Alumni Guild), preventing competitor veto attacks.

### 5. Game-Theoretic Safeguards & Smart Staking
* **Symmetric Founder Equity Burn:** If a milestone fails and backers ragequit, unvested founder shares burn in exact mathematical proportion. Founders can never profit from failure.
* **Dynamic Escrow Floor Snapshot:** At breach, a fixed floor price is snapshot. Arbitrageurs peg secondary markets to the cash floor, completely preventing bank runs.
* **Constant-Time O(1) Yield:** Stakers lock common shares for flexible horizons (0 to 730 days) to earn **1.0x to 3.0x dividend multipliers**. Calculations run in O(1) time using an overflow-safe accumulator scaled by 10^12.

---

## Cross-Border Legal Engineering & Institutional Compliance

Ventrion operates a robust, multi-jurisdictional framework designed to protect founders and backers worldwide:

### 1. Multi-Jurisdiction Corporate SPV Architecture
Ventrion bridges decentralized token float with traditional corporate entities:
* **Offshore Tech Ventures:** Plug-and-play legal wrappers via Marshall Islands DAO LLCs (MIDAO) or Cayman Foundation SPVs.
* **Onshore Commercial Clearing:** For founders requiring white-listed European or OECD corporate alignment, Ventrion routes ecosystem incentives through a dedicated non-profit association hub (e.g. Swiss Verein, Zug), providing clean corporate firewalls between operating entities and public liquidity.

### 2. Global Regulatory Perimeter (SEC Reg S & Reverse Solicitation)
Ventrion insulates participating ventures from cross-border public offering registration traps:
* **Network Layer:** Automated IP and VPN geoblocking for restricted retail jurisdictions (including the United States) at the RPC and gateway layer.
* **Application Layer:** Mandatory clickwrap self-certification on wallet connection establishing offshore status.
* **Communication Layer:** Global English documentation, USD-only pricing, and zero active domestic marketing in restricted territories.
* **Regulatory Safe Harbors:** Fully structured under **SEC Regulation S (Rule 903 Category 1)** for offshore foreign issuances with No Substantial U.S. Market Interest (SUSMI), alongside international **Reverse Solicitation** standards (such as MiCA Art. 61).

### 3. Arm's Length B2B Merchant & Marketing Clearing
Real-world businesses cannot wire corporate capital to anonymous internet wallets without severe tax and bookkeeping penalties:
* **B2B Service Structure:** The operating business remits an arm's length **Ecosystem Marketing & Merchant Acquisition Fee** (benchmarked against standard payment network interchange at 2.5% GMV processed via Solana Pay).
* **Verifiable Accounting:** Invoices are issued by a recognized corporate entity with formal tax identifiers, enabling 100% ordinary business expense deductibility and zero withholding tax leakage across international double taxation treaties.
* **Programmatic Staker Distribution:** The ecosystem association programmatically disburses collected fees to on-chain staking vaults, turning merchant cash flow into legitimate token rewards.

### 4. Honest Failure Safe Harbor
Under the international **Business Judgment Rule**, founders who act in good faith, communicate openly, and spend raised capital on legitimate operational costs are shielded from personal liability. If a venture honestly fails, remaining unspent milestone escrow cash is automatically unlocked for 100% pro-rata backer ragequit, enabling clean, orderly corporate wind-downs without predatory litigation.

---

## The Core Numbers

| Feature | Ventrion Standard | What It Means |
| :--- | :--- | :--- |
| **Share Supply** | **1,000,000 Fixed** | Fixed forever. Mint authority burned at creation. |
| **Quote Currency** | **100% USDC** | Real dollar stability for payroll, operations, and rewards. |
| **Liquidity Seed** | **17.0% Irrevocable** | Permanently locked in Meteora DLMM. Zero rugpull risk. |
| **Legal Setup Fee** | **max($5,000, 5%)** | Corporate formation and platform infrastructure. |
| **Upfront Capital** | **Max 15% Cap** | Operational runway while preventing cash-and-dash risks. |
| **Milestone Review** | **14 Days Optimistic** | Funds unlock automatically unless a formal challenge is lodged. |
| **Challenge Bond** | **min($1,000, 5%)** | Minimum deposit required to challenge a submission ($250 floor). |
| **Staking Multiplier** | **1.0x to 3.0x** | Higher reward shares for long-term committed token holders. |
| **Platform Royalty** | **0.5% LP Cut** | Protocol fee routed to Mother Token ($VTRN) stakers. |

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
