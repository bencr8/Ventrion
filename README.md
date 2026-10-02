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

When founders want to bring a real business on-chain today, the only visible options are speculative meme coin launchpads. Those platforms were designed for fast financial musical chairs, not for building enduring companies:

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

## Institutional Legal Architecture & Tax Compliance

Ventrion operates an institutional legal framework to protect founders and backers across global jurisdictions:

### 1. 3-Tier Compliance Perimeter
Ventrion insulates the protocol from active offering registration rules:
* **Network Layer:** Automated IP and VPN geoblocking of US and German retail addresses at the RPC and gateway layer.
* **Application Layer:** Mandatory clickwrap self-certification on wallet connection certifying non-US and non-DE residency.
* **Communication Layer:** Exclusive English documentation, zero Euro pricing, and a complete ban on active domestic marketing.
* **Jurisdictional Shields:** Qualified under **SEC Regulation S (Rule 903 Category 1)** for offshore foreign offerings and **Art. 61 MiCA Reverse Solicitation** under EU and BaFin administrative standards.

### 2. Triple-Entity Tax Clearing (German OpCo GmbH Model)
German founders cannot pay anonymous wallets without severe tax penalties:
* **Section 160 AO (Empfaengerbenennung):** Requires named recipients for business expense deductions.
* **Section 50a EStG Royalty Trap:** Software licenses to offshore SPVs trigger a 15.825% German withholding tax.
* **Section 9 StAbwG (Tax Haven Defense Act):** Direct payments to blacklisted jurisdictions (such as the Marshall Islands) face an absolute deduction ban.

**The Ventrion Solution:**  
The German OpCo GmbH enters a B2B Ecosystem Marketing Agreement with the **Ventrion Global Ecosystem Association** in Zug, Switzerland (a white-listed jurisdiction with a comprehensive German Double Taxation Agreement). The OpCo remits a standard 2.5% GMV marketing fee on Solana Pay POS volume, fully deductible as an arm's length advertising expense (DATEV SKR03: 4600 / SKR04: 6600, Section 13b UStG Reverse Charge, 0.0% withholding tax). The Swiss Association then programmatically routes rewards to on-chain stakers.

### 3. Honest Failure Safe Harbor
Under the **Business Judgment Rule**, founders who act in good faith, communicate openly, and spend capital on legitimate operations are fully protected from personal liability. If a venture honestly fails, remaining escrow cash is returned 100% pro-rata to backers via ragequit, allowing the company to wind down cleanly.

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
