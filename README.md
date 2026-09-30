# Ventrion Protocol ($VTRN)
> **The Sovereign Decentralized Equity Operating System on Solana.**  
> *Tokenize real-world startups, operating businesses, and ventures with institutional governance, milestone escrows, and sustainable USDC dividends.*

[![Solana](https://img.shields.io/badge/Blockchain-Solana-blue?style=flat&logo=solana)](https://solana.com)
[![Anchor Framework](https://img.shields.io/badge/Framework-Anchor%200.30-orange?style=flat)](https://www.anchor-lang.com/)
[![Meteora DLMM](https://img.shields.io/badge/DEX-Meteora%20DLMM%20%26%20DBC-purple?style=flat)](https://meteora.ag)
[![License](https://img.shields.io/badge/License-Apache--2.0-green.svg)](LICENSE)

---

<!-- HERO / BRAND BANNER PLACEHOLDER -->
<!-- Place your hero banner image in Documentation/assets/hero_banner.png -->
<!-- ![Ventrion Banner](./Documentation/assets/hero_banner.png) -->

---

## The Vision

When business owners and founders want to bring their company on-chain, the only accessible launch options today are meme coin launchpads like Pump.fun. Those platforms are fundamentally hostile to real businesses:

* **Lifespans measured in hours:** Tokens are launched, pumped by automated bots, dumped on retail buyers, and abandoned by the end of the day.
* **Founders get exploited:** Founders do not even own their company's equity upon creation. They have to spend their own personal capital to buy shares off an exponential curve, competing against sniper bots.
* **Zero accountability:** 100% of raised capital goes straight to creator private wallets with zero milestone accountability, zero roadmap escrow, and zero investor refunds when projects fail.
* **The SOL volatility trap:** Denominating business operating budgets in fluctuating gas tokens makes payroll and operational planning impossible.

**Ventrion is built for longevity and realistic capital formation.**  
Founders mint 100% of their enterprise shares (exactly 1,000,000 common shares) into an on-chain vault without paying a penny. They commit a transparent business roadmap, lock their equity to prove long-term dedication, and raise growth capital in stable USDC on a fair, flat curve.

---

## Core Protocol Architecture

<!-- SYSTEM ARCHITECTURE DIAGRAM PLACEHOLDER -->
<!-- Place your architecture diagram in Documentation/assets/protocol_architecture.png -->
<!-- ![Protocol Architecture](./Documentation/assets/protocol_architecture.png) -->

### 1. Fixed Supply with Revoked Mint Authority
Every company on Ventrion has exactly **1,000,000 common shares** (with 6 decimals). In the very same transaction that initializes the company, the SPL token mint authority is permanently set to `None`. No dilution is possible.

### 2. Pure USDC Denomination
All raises, milestone escrows, trading pairs, and dividend payouts run exclusively in canonical **USDC**. Founders can budget for salaries, equipment, and server bills with complete fiat stability.

### 3. Meteora Flat Curve Financing
Primary funding rounds are conducted via Meteora's Dynamic Bonding Curve (DBC) using a near-linear flat curve. The first buyer and the last buyer pay essentially the same fair price, eliminating frontrunning and sandwich bots.

### 4. 75/25 Graduation and Irrevocable Liquidity
Upon reaching the funding hard cap:
* **25% of raised USDC and 25% of round shares** are automatically deposited into a permanent Meteora DLMM pool (`creatorPermanentLockedLiquidityPercentage = 100`).
* **75% of raised USDC** is moved into an on-chain `MilestoneEscrow` vault, governed by investor veto rights.

### 5. Milestone Escrows with Optimistic Veto Governance
Funds are never handed out all at once:
* **Early Delivery Fast Track:** If a milestone is delivered early, an active vote of **>50.00%** releases funds immediately.
* **Regular Deadline Expiry:** When the agreed deadline arrives, a **7-day review window** opens. Funds release automatically unless **33.33% or more** of primary backer shares vote to veto.
* **Cure and Resubmission Cycle:** If vetoed, the founder can amend the milestone (adding 0 to 30 days) up to 3 times before permanent failure.
* **Founder Exclusions:** Founder locked shares have **0 votes and 0 dividends**.

### 6. Cross-Round Protection and Breached Milestone Ragequits
Primary backers have an immutable on-chain record (`PrimaryBackerReceipt` PDA). If a milestone is officially vetoed, disputed, or passes its completion deadline without delivery, backers can **ragequit** at any time. They return their proportional shares to the treasury and receive their pro-rata cash refund from remaining unreleased escrow cash.

### 7. Smart Contract Staking and Constant-Time Dividends
To prevent flash-loan attacks, circulating shares earn dividends only when deposited into personal `InvestorVault` accounts:
* **Flexible:** 1.0x baseline yield, withdrawable anytime.
* **Time Commitments:** Up to **2.0x (1 Year)** or **3.0x (>2 Years)** dividend multipliers.
* **$O(1)$ Accounting:** Claiming dividends takes a fixed, tiny amount of compute units regardless of whether there are 10 or 100,000 stakers.
* **Capped 25% Slashing:** Early exits pay a linearly decaying penalty capped at a maximum of 25%. Slashed weight immediately boosts the yield for remaining loyal stakers.

### 8. V-Score Liquidity Drain Protection
Standard launchpads ignore pool draining. If a founder raises 1% and locks 90%, they still hold 9% unlocked float, which is 36 times larger than the entire liquidity pool!  
Ventrion's **V-Score** computes both commitment and liquidity safety:
$$M_{\text{pool\_safety}} = \frac{S_{\text{raised}}}{1,000,000 - S_{\text{locked}}}$$
If an unlocked treasury poses a pool-draining hazard, the trust rating collapses to Junk Tier, giving backers immediate transparency.

---

## Protocol Numbers at a Glance

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Total Share Supply** | **1,000,000 Shares** | Fixed forever. Mint authority revoked at genesis. |
| **Quote Currency** | **Canonical USDC** | Pure dollar stability for all operations and dividends. |
| **Minimum Raise Size** | **1.0% (10,000 Shares)** | Smallest permissible funding tranche. |
| **Founder Lock Range** | **1 Day to 3 Years** | Founders can lock up to 99% of company equity. |
| **Meteora LP Allocation**| **Exactly 25.0%** | Irrevocably locked in Meteora DLMM pool. |
| **Milestone Escrow** | **75.0% of Raise** | Locked in on-chain escrow; released upon milestone delivery. |
| **Veto Threshold** | **33.33% (One Third)** | Unchangeable blocking minority for primary backers. |
| **Maximum Slashing Cap** | **25.0% Maximum** | Linearly decays over time; 75% to 100% principal guaranteed. |
| **Staking Multipliers** | **1.0x to 3.0x** | Higher dividend yield for longer lock horizons. |
| **Platform Protocol Fee**| **0.5% Gross Profit** | Routes permissionlessly to parent $VTRN token stakers. |

---

## Detailed Documentation

For the complete, exhaustive protocol specification, mathematical proofs, PDA seed derivation tables, and state machine transitions, read the official Single Source of Truth:

👉 **[Read the Full Ventrion Main Manifesto](./Documentation/VENTRION_MAIN_MANIFEST.md)**

---

## Repository Structure

```
Ventrion/
├── .github/
│   └── workflows/                  # CI / CD verification workflows
├── anchor/
│   ├── programs/
│   │   └── ventrion_core/          # Core Solana smart contracts (Rust / Anchor)
│   ├── tests/                      # Integration and adversarial attack tests
│   └── scripts/                    # Devnet simulation and deployment scripts
├── Documentation/
│   ├── VENTRION_MAIN_MANIFEST.md   # Official Master Manifesto & Specification
│   └── assets/                     # Diagrams, visual charts, and branding
├── sdk/
│   ├── src/                        # TypeScript SDK (@ventrion/sdk)
│   └── package.json
├── web/                            # Next.js web application and dashboard
├── .gitignore                      # Security-first Git ignore configuration
└── README.md                       # Main project introduction
```

---

## Local Development & Testing

### Prerequisites
* Rust 1.79+
* Solana CLI 1.18+
* Anchor CLI 0.30+
* Node.js 20+

### Building the Smart Contracts
```bash
cd anchor
anchor build
```

### Running the Test Suite
```bash
anchor test
```

---

## License

Ventrion is open-source software licensed under the [Apache License 2.0](LICENSE).
