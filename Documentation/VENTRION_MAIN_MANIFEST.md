# Ventrion Protocol ($VENT)
## The Official Protocol Specification and Operating Architecture
*A decentralized framework for honest capital raises, community-backed businesses, and milestone escrows on Solana.*

---

# Table of Contents

* [1. The Problem with Crypto Launches](#1-the-problem-with-crypto-launches)
  * [1.1 Why Standard Launchpads Fail Real Businesses](#11-why-standard-launchpads-fail-real-businesses)
  * [1.2 The Ventrion Model: Real Accountability for Retail and Founders](#12-the-ventrion-model-real-accountability-for-retail-and-founders)
  * [1.3 Core Protocol Metrics at a Glance](#13-core-protocol-metrics-at-a-glance)
* [2. The Five Bundled Pillars of Ventrion](#2-the-five-bundled-pillars-of-ventrion)
  * [2.1 Pillar 1: The Mother Protocol ($VENT) & Multi-Jurisdiction Pipeline](#21-pillar-1-the-mother-protocol-vtrn--multi-jurisdiction-pipeline)
  * [2.2 Pillar 2: Capital Formation & The Primary Raise Engine](#22-pillar-2-capital-formation--the-primary-raise-engine)
  * [2.3 Pillar 3: Founder Autonomy, Vesting & Skin in the Game](#23-pillar-3-founder-autonomy-vesting--skin-in-the-game)
  * [2.4 Pillar 4: Ventrion Legal Structuring, $VENT Staker Approval & Ragequit](#24-pillar-4-ventrion-legal-structuring-vent-staker-approval--ragequit)
  * [2.5 Pillar 5: Holder Staking & The Constant Time Yield Engine](#25-pillar-5-holder-staking--the-constant-time-yield-engine)
* [3. Step-by-Step Capital Raise and Redistribution Lifecycle](#3-step-by-step-capital-raise-and-redistribution-lifecycle)
  * [3.1 Step 1: Venture Initialization & Mint Authority Revocation](#31-step-1-venture-initialization--mint-authority-revocation)
  * [3.2 Step 2: Corporate Setup Execution & Fee Allocation](#32-step-2-corporate-setup-execution--fee-allocation)
  * [3.3 Step 3: Seed Capital Collection & Sellback on the Flat Curve](#33-step-3-seed-capital-collection--sellback-on-the-flat-curve)
  * [3.4 Step 4: Atomic Two-Step Redistribution (17% LP, Legal Fee, Milestone Vault)](#34-step-4-atomic-two-step-redistribution-17-lp-legal-fee-milestone-vault)
  * [3.5 Step 5: Receipt Token Redemption (1:1 Unified Shares)](#35-step-5-receipt-token-redemption-11-unified-shares)
* [4. Staking, Vesting and Game-Theoretic Safeguards](#4-staking-vesting-and-game-theoretic-safeguards)
  * [4.1 Founder Locking: Flexible Multi-Year Vesting Schedules](#41-founder-locking-flexible-multi-year-vesting-schedules)
  * [4.2 Backer Staking: Voluntary Time-Locks and Fee Capture](#42-backer-staking-voluntary-time-locks-and-fee-capture)
  * [4.3 The Symmetric Founder Equity Burn (No Equity Inflation Paradox)](#43-the-symmetric-founder-equity-burn-no-equity-inflation-paradox)
  * [4.4 Dynamic Escrow Floor Price (Eliminating the Dead Escrow Trap)](#44-dynamic-escrow-floor-price-eliminating-the-dead-escrow-trap)
  * [4.5 Complete Hostile Takeover Immunity](#45-complete-hostile-takeover-immunity)
* [5. Legal Architecture, Geofencing and Tax-Compliant Clearing](#5-legal-architecture-geofencing-and-tax-compliant-clearing)
  * [5.1 Geofencing, Active Marketing Ban and Reverse Solicitation](#51-geofencing-active-marketing-ban-and-reverse-solicitation)
  * [5.2 Tax-Compliant Triple-Entity Clearing Architecture](#52-tax-compliant-triple-entity-clearing-architecture)
  * [5.3 Tech Startups vs. Decentralized Gastro & Retail Brands](#53-tech-startups-vs-decentralized-gastro--retail-brands)
  * [5.4 Clear Distinction: Honest Failure vs. Willful Fraud](#54-clear-distinction-honest-failure-vs-willful-fraud)
  * [5.5 Precision on Asset Protection and Brand Ownership](#55-precision-on-asset-protection-and-brand-ownership)
* [6. Technical Specifications and Solana Anchor Layouts](#6-technical-specifications-and-solana-anchor-layouts)
  * [6.1 Program Derived Address (PDA) Matrix](#61-program-derived-address-pda-matrix)
  * [6.2 State Machine Progression](#62-state-machine-progression)
  * [6.3 Exact Account Memory Layouts](#63-exact-account-memory-layouts)
  * [6.4 Constant-Time O(1) Yield Math (Overflow-Safe u256)](#64-constant-time-o1-yield-math-overflow-safe-u256)
  * [6.5 Compute Unit Profile and Zero-Loop Guarantee](#65-compute-unit-profile-and-zero-loop-guarantee)
* [7. Security Rules and Error Codes](#7-security-rules-and-error-codes)
  * [7.1 Attack Vectors and Built-In Defenses](#71-attack-vectors-and-built-in-defenses)
  * [7.2 Program Error Code Reference](#72-program-error-code-reference)
* [8. Developer Implementation and Integration](#8-developer-implementation-and-integration)
  * [8.1 SDK Overview](#81-sdk-overview)
  * [8.2 Complete End-to-End TypeScript Lifecycle](#82-complete-end-to-end-typescript-lifecycle)

---

# 1. The Problem with Crypto Launches

### 1.1 Why Standard Launchpads Fail Real Businesses
Token launches on Solana currently follow a broken pattern designed exclusively for speculation. When an entrepreneur tries to launch a legitimate company, digital product, or local business on standard launchpads, they encounter structural flaws:

* **Predatory Bonding Curves:** Tokens launch on steep exponential curves. Automated sniper bots buy up the initial supply in the first millisecond and dump on real community members seconds later.
* **Immediate Capital Drain:** When a raise completes, 100% of the funds transfer directly to the creator's personal wallet without any milestone checks or roadmaps.
* **The SOL Volatility Trap:** Capital is raised and held in SOL. If the market drops 30%, the business can no longer cover real-world payroll, inventory, or rent.
* **Founder Penalization:** Founders do not own their own company at launch. They must spend their personal savings to buy their own tokens off a public bonding curve while competing against MEV bots.

### 1.2 The Ventrion Model: Real Accountability for Retail and Founders
Ventrion replaces this speculative casino with a structured venture operating system:

* **Fixed Supply from Genesis:** Every company has exactly 1,000,000 common shares. The mint authority is destroyed in the exact genesis transaction. Dilution is impossible.
* **100% USDC Denominated:** Capital raises, escrows, and payouts run purely on canonical USDC. Operational planning is predictable.
* **Autonomous Milestone Execution:** Capital does not go to the founder in an uncontrolled lump sum. The team designs its own milestone roadmap. When goals are achieved, the founder submits on-chain delivery proof with an automated 14-day review window.
* **Guaranteed Ragequit:** If a founder fails to deliver or misses deadlines, backers can pull their remaining unspent money out of the escrow directly.
* **Institutional Multi-Jurisdiction Architecture:** Primary raises operate strictly outside the United States and Germany via a 3-tier geofencing perimeter (IP, VPN filter, forced clickwrap self-certification). German/EU operating companies route rewards via a compliant Swiss Association clearing hub, ensuring 100% tax-deductible marketing expenses without withholding tax friction.

### 1.3 Core Protocol Metrics at a Glance

| Parameter | Standard Value | Description |
| :--- | :--- | :--- |
| **Total Share Supply** | **1,000,000 Shares** | Fixed forever. Mint authority revoked at genesis. |
| **Quote Currency** | **Canonical USDC** | Pure dollar stability for all raises, escrows, and fees. |
| **Meteora Liquidity Seed** | **Exactly 17.0%** | 17% of raised USDC and 17% of round shares locked permanently in DLMM. |
| **Legal Setup Fee** | **max($3,000, 3%)** | Covers corporate MIDAO DAO LLC formation ($3,000 baseline) and registry costs. |
| **Milestone Escrow Share** | **Founder Defined** | Remainder after 17% LP, legal fee, and upfront working capital. |
| **Upfront Working Capital** | **Founder Defined (10% to 25%)**| Flexible runway chosen by founder, validated in the $VENT verification vote. |
| **Founder Token Sovereignity**| **Full Sovereign Freedom** | Linear vesting, milestone unlocks, or direct staking in InvestorVault from day 1. |
| **Protocol Verification** | **$VENT Majority Approval** | Ventrion legal contracts + decentralized staker approval (>50% majority). |
| **Staking Lock Multipliers**| **1.0x to 3.0x** | Stakers locking 0 to 730 days earn up to triple fee yield. |
| **Ventrion Platform Royalty**| **0.5% on LP Fees** | Small protocol fee routed to Mother Token ($VENT) stakers. |

---

# 2. The Five Bundled Pillars of Ventrion

The Ventrion architecture is organized into five clean, modular pillars. Each pillar handles a distinct component of the lifecycle:

```
+─────────────────────────────────────────────────────────────────────────────+
|                         THE FIVE PILLARS OF VENTRION                        |
+─────────────────────────────────────────────────────────────────────────────+
|                                                                             |
|  PILLAR 1: MOTHER PROTOCOL ($VENT) & MULTI-JURISDICTION PIPELINE            |
|  • Platform governance, directory curation, and multi-jurisdiction setup.   |
|  • Captures max($3,000, 3%) setup fees and routes rewards to $VENT stakers. |
|                                                                             |
|  PILLAR 2: CAPITAL FORMATION & FLAT CURVE ENGINE                            |
|  • Fair-launch primary funding on Meteora Dynamic Bonding Curves.           |
|  • Full buy and sell liquidity on curve prior to graduation.                |
|  • Flat pricing prevents sandwich bots and MEV exploitation.                |
|                                                                             |
|  PILLAR 3: FOUNDER AUTONOMY, VESTING & COMMITMENT                           |
|  • Founder designs their own vesting schedule (1 to 3 years, custom cliff). |
|  • Retains equity without fear of sudden hostile token takeovers.           |
|                                                                             |
|  PILLAR 4: AUTONOMOUS MILESTONES, OPTIMISTIC REVIEW & RAGEQUIT              |
|  • Founder sets upfront working capital (max 15%) and milestone tranches.   |
|  • Autonomous delivery submissions with 14-day optimistic disbursement.    |
|  • Backers can ragequit unspent funds if milestones are breached.           |
|                                                                             |
|  PILLAR 5: HOLDER STAKING & CONSTANT-TIME YIELD                             |
|  • Secondary token holders stake for 0 to 2 years (1.0x to 3.0x yield).     |
|  • 100% of Meteora LP trading fees distributed in O(1) constant time.       |
|  • Receives verified B2B Ecosystem Marketing Rewards from partner OpCos.    |
|                                                                             |
+─────────────────────────────────────────────────────────────────────────────+
```

### 2.1 Pillar 1: The Mother Protocol ($VENT) & Legal Structuring Pipeline
The Ventrion Mother Token ($VENT) governs the overarching protocol and provides decentralized oversight for new venture onboarding.
* **Institutional Legal Structuring:** Ventrion acts as the legal architect. It translates the founder's pitch deck, milestone roadmap, and token terms into binding corporate contracts (MIDAO DAO LLC Operating Agreement, SAFE, or Token Warrant). The CEO digital countersigns these legal agreements.
* **Decentralized $VENT Staker Approval:** The venture cannot launch publicly or graduate liquidity based solely on an anonymous automated timer. Instead, $VENT mother token stakers vote on-chain to verify the venture's legal setup:
  * Ventrion Foundation holds approximately 10% of $VENT at inception, locked for 3 years in the governance staking pool.
  * With an initial 15% public float, Ventrion's 10% lock represents 40% of the active voting power (10 / 25).
  * Ventrion needs only 10% community consensus from independent $VENT stakers to cross the 50%+ absolute majority threshold.
  * This architecture combines centralized legal drafting with decentralized on-chain checks and balances. Centralization cannot override decentralization.
* **The Legal Fee:** MIDAO offers a reduced rate of exactly $3,000 USDC for ventures raising under $250,000 (payable in USDC on Solana). A fixed allocation of `max($3,000, 3%)` covers the complete corporate formation, first-year registered agent, and official government filing.
* **Protocol Value Accrual:** 50% of platform setup fees and a 0.5% cut of all secondary trading fees flow directly to stakers of the parent $VENT token.

### 2.2 Pillar 2: Capital Formation & The Primary Raise Engine
Primary financing runs on a flat pricing curve via Meteora Dynamic Bonding Curves (DBC):
* **No Price Squeezing:** Unlike meme launchpads where early buyers get 100x cheaper tokens than late buyers, Ventrion uses a flat, near-linear curve. The first contributor and the last contributor pay the same fair price.
* **Full Two-Way Curve Liquidity:** During the active raise, buyers can sell their tokens back to the bonding curve at any time if they change their mind before graduation. There is no forced lock-in while the raise is open.
* **Receipt Token Mechanics:** When the target cap is reached, tranche tokens seamlessly convert 1:1 into canonical market-circulating common shares.

### 2.3 Pillar 3: Founder Autonomy, Vesting & Skin in the Game
Ventrion respects founder autonomy. The protocol does not dictate how a founder must structure their personal equity:
* **Founder Sets the Horizon:** The founder decides how long their shares remain locked (between 12 and 36 months, with a chosen 6 to 12 month cliff). A founder who commits to a 3-year lock sends a powerful trust signal to backers, while shorter locks offer flexibility.
* **Linear Predictability:** Following the cliff, shares unlock gradually on-chain. The founder cannot dump their entire allocation on retail buyers on day one.
* **Clear Role Boundaries:** Locked founder shares carry zero political veto rights over escrow payouts and do not dilute backer staking pools.

### 2.4 Pillar 4: Ventrion Legal Structuring, $VENT Staker Approval & Ragequit
Real businesses require operational predictability, not arbitrary 14-day time windows where anonymous internet trolls can freeze company payroll for a $250 bond. Ventrion eliminates this flaw:
* **Founder Designs the Roadmap:** At launch, the founder explicitly defines:
  1. The upfront working capital percentage (flexible between 10% for pure digital software up to 25% for physical retail/gastro requiring equipment and lease deposits).
  2. The milestone schedule (1 to 10 tranches) and target delivery dates.
  3. The founder token allocation model (linear vesting stream, milestone-tied lump sums, or direct staking in the InvestorVault from day one).
* **Institutional Contract Synthesis:** Ventrion translates the roadmap into an enforceable corporate contract countersigned by the CEO.
* **Decentralized $VENT Staker Verification:** The milestone schedule and venture genesis are verified by an on-chain vote of $VENT stakers. Once approved, the venture is verified (`is_verified = true`), liquidity is seeded, and primary receipts unlock 1:1.
* **Autonomous Milestone Release:** When a milestone is completed, the founder submits proof on-chain (`submit_milestone_delivery`) with a cryptographic deliverable hash (SHA-256 / Arweave proof link). Because the contract terms are legally binding under the signed Operating Agreement, funds release directly to the OpCo treasury without being held hostage by anonymous griefing bonds.
* **The Ragequit Right:** If a founder defaults, vanishes for over 60 days, or breaches agreed deliverables, the venture enters `BreachedRefundActive`. Common share holders can call `ragequit_milestone_escrow` to withdraw their exact pro-rata share of remaining unspent escrow USDC at the snapshot floor price.

### 2.5 Pillar 5: Holder Staking & The Constant Time Yield Engine
Retail buyers on the secondary market can choose between holding liquid tokens or locking them for rewards:
* **Trading Fee Distribution:** The permanent Meteora DLMM pool generates continuous trading fees. 100% of these fees go directly to stakers in the `InvestorVault`.
* **Protocol Performance Rewards:** When an operating business generates revenue via the Solana Pay POS terminal, it remits an Ecosystem Marketing & Advocacy Fee (e.g. 2.5% of Gross Merchandise Volume) through the compliant clearing hub directly into the vault.
* **Constant Time Accounting:** Reward calculations execute in O(1) time using an overflow-safe $10^{12}$ scaled accumulator computed with intermediate 256-bit math (`u256`). Claiming rewards costs roughly 11,300 Compute Units, well below Solana's 200,000 limit.

---

# 3. Step-by-Step Capital Raise and Redistribution Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CAPITAL ALLOCATION BREAKDOWN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Total Raised Capital: 100% USDC                                             │
│                                                                             │
│ ├── 1. LEGAL SETUP ALLOCATION: max($3,000, 3%)                              │
│ │   • Sent to Ventrion Legal Setup Wallet                                   │
│ │   • Funds entity incorporation, registry fees, and registered agent       │
│ │                                                                           │
│ ├── 2. PERMANENT LIQUIDITY POOL: Exactly 17.0%                              │
│ │   • 17% of USDC + 17% of Round Shares                                     │
│ │   • Permanently deposited into Meteora DLMM pool (Locked LP NFT)          │
│ │                                                                           │
│ └── 3. OPERATING & MILESTONE ESCROW: Remaining Balance                      │
│     ├── Upfront Working Capital (Founder Defined: max 15%)                  │
│     └── Milestone Tranches (Locked in on-chain escrow until delivery)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1 Step 1: Venture Initialization & Mint Authority Revocation
1. The founder defines the venture parameters: name, symbol, total raise cap, founder lock duration, and milestone roadmap.
2. The transaction calls `launch_venture_all_in_one`. Exactly 1,000,000 shares are minted directly into the `MasterLockVault`.
3. The SPL token mint authority is set to `None`. No additional shares can ever be created.

### 3.2 Step 2: Corporate Setup Execution & Fee Allocation
1. Before public trading begins, the founder executes the corporate setup and roadmap commitment.
2. The venture receives its registered legal entity (MIDAO DAO LLC for global founders, or Swiss Verein / Liechtenstein structure for European OpCos).
3. The registry ID and the SHA-256 hash of the signed contract are permanently stored on the `VentureState` PDA.

### 3.3 Step 3: Seed Capital Collection & Sellback on the Flat Curve
1. The primary raise opens on the Meteora Dynamic Bonding Curve.
2. The primary raise frontend enforces the 3-tier compliance perimeter (IP-filter, VPN blocking, and forced clickwrap self-certification excluding US and German/EU retail residents).
3. Backers deposit canonical USDC and receive tranche tokens at flat, fair pricing.
4. If a backer wants to exit before the round concludes, they can sell their tokens directly back to the curve for USDC.

### 3.4 Step 4: Atomic Two-Step Redistribution (17% LP, Legal Fee, Milestone Vault)
When the raise reaches its target cap, graduation executes across two atomic transactions with a 48-hour graduation timeout guard:

#### Sub-Step 4A: Accounting and Escrow Partitioning (`finalize_round_escrow`)
1. Transacts within ~21,500 Compute Units.
2. **The Legal Fee:** Exactly `max($3,000, 3% of total raise)` in USDC is transferred to the Ventrion Legal Setup Wallet (unless prepaid).
3. **Upfront Operational Disbursement:** The founder's pre-defined upfront percentage (founder-defined 10% to 25% of escrowed USDC) transfers directly to the founder's corporate OpCo wallet.
4. **Milestone Escrow:** The remaining USDC balance is locked into `MilestoneEscrow`.
5. **State Progression:** Venture transitions to `GraduationPending`.

#### Sub-Step 4B: Permanent DLMM Pool Seeding (`seed_dlmm_liquidity`)
1. Transacts within ~135,000 Compute Units via CPI to Meteora DLMM (`initialize_lb_pair` and `add_liquidity_by_strategy`).
2. Exactly 17% of total raised USDC and 17% of round shares are permanently committed to the pool.
3. The LP position NFT is locked inside `DlmmCustody` permanently. Nobody can pull this liquidity.
4. **State Progression:** Venture transitions to `GraduatedDLMMLive`.

#### Graduation Timeout and Rollback Guard (`abort_pending_graduation`)
If Sub-Step 4B fails to execute within 48 hours following Sub-Step 4A (e.g. due to Meteora bin array rent shortage or caller abandonment), any backer can permissionlessly call `abort_pending_graduation`. This unlocks the remaining escrowed funds for immediate pro-rata refund, preventing permanent capital lockups.

### 3.5 Step 5: Receipt Token Redemption (1:1 Unified Shares)
* **Race Condition Guard:** While Sub-Step 4A is confirmed but Sub-Step 4B is pending, the venture remains in the `GraduationPending` state. The redemption instruction `unify_impregnated_tokens` is strictly locked until `seed_dlmm_liquidity` confirms on-chain. This prevents illiquid ghost shares from entering circulation before the Meteora DLMM pool is fully funded and active.
* **1:1 Unified Shares:** Once graduation is fully confirmed (`GraduatedDLMMLive`), backers call `unify_impregnated_tokens` to convert their tranche tokens 1:1 into canonical, freely tradeable common shares.
* **Secondary Market Open:** Secondary market trading opens immediately on Meteora DLMM.

---

# 4. Staking, Vesting and Game-Theoretic Safeguards

Ventrion strictly separates founder locks from backer staking. These two groups have entirely different incentives and restrictions.

```
+─────────────────────────────────────────────────────────────────────────────+
|                         FOUNDER LOCK VS. BACKER STAKING                     |
+─────────────────────────────────────┬───────────────────────────────────────+
| FOUNDER LOCKING (PILLAR 3)          | BACKER STAKING (PILLAR 5)             |
+─────────────────────────────────────┼───────────────────────────────────────+
| • Purpose: Long-term commitment     | • Purpose: Fee capture & advocacy     |
| • Structure: 1 to 3 Years (Custom)  | • Structure: 0 to 730 Days Flexible   |
| • Political Control: 0 Escrow Votes | • Escrow Recourse: Challenge & Ragequit|
| • Dividend Yield: Strictly 0 yield  | • Dividend Yield: 100% of DLMM fees   |
| • Early Exit: Impossible            | • Protocol Rewards: B2B Advocacy Fees |
+─────────────────────────────────────┴───────────────────────────────────────+
```

### 4.1 Founder Locking: Sovereign Allocation and Staking Flexibility
Founders and CEOs enjoy complete sovereign flexibility over how they structure their token equity:
* **Option A: Linear Vesting Stream:** Traditional vesting over 12 to 36 months with an optional 6 to 12 month cliff. Following the cliff, tokens unlock linearly.
* **Option B: Milestone-Tied Tranches:** Equity unlocks in tranches matching the completion of business milestones.
* **Option C: Direct Holder Staking from Day 1:** The founder can immediately lock their shares into the `InvestorVault` alongside community backers. By committing tokens for 1 to 3 years, the founder earns protocol rewards and POS marketing fees as a long-term stakeholder.
* **Operational Control:** The founder maintains exclusive authority over operational company decisions, milestone delivery submissions, and voluntary dividend allocations.

### 4.2 Backer Staking: Voluntary Time-Locks and Fee Capture
Secondary buyers and primary backers can deposit their common shares into their personal `InvestorVault`:
* **Flexible (0 days):** 1.0x baseline yield, withdrawable anytime.
* **90 Days:** 1.25x yield (+25% boost).
* **180 Days:** 1.5x yield (+50% boost).
* **365 Days (1 Year):** 2.0x yield (Double rewards per share).
* **730 Days (2 Years):** 3.0x yield (Triple rewards per share).

Stakers receive their proportional share of all Meteora DLMM trading fees and verified B2B Ecosystem Marketing Rewards paid by the operating business.

### 4.3 The Symmetric Founder Equity Burn (No Equity Inflation Paradox)
In standard token refund mechanisms, burning backer tokens creates a dangerous mathematical flaw: if 150,000 backer tokens are burned after a failed milestone, the founder's 700,000 locked tokens would automatically jump from 70.0% to 82.35% of total remaining shares. The founder would end up owning a higher percentage of the company after failing than before the raise.

Ventrion completely neutralizes this flaw through **Symmetric Equity Burning**:
* When milestone failure occurs and backers execute a ragequit, unvested founder shares locked in `FounderVesting` are automatically burned in exact symmetry:
$$\text{Burn}_{\text{Founder}} = \text{Burn}_{\text{Backer}} \times \left( \frac{\text{Founder Shares}}{\text{Public Shares}} \right)$$
* Under this invariant, the founder's relative cap-table percentage remains strictly constant or decreases:
$$Q_1 = \frac{S_{F,0} \left(1 - \frac{B_P}{S_{P,0}}\right)}{(S_{F,0} + S_{P,0}) \left(1 - \frac{B_P}{S_{P,0}}\right)} = Q_0 \equiv 70.0\%$$
* **Vested Clawback Governance:** If a default occurs after the cliff period and remaining unvested tokens do not cover the full symmetric burn, 100% of remaining unvested shares are burned, and any already-claimed founder tokens contractually forfeit future dividend and governance rights.

### 4.4 Dynamic Escrow Floor Price (Eliminating the Dead Escrow Trap)
A critical issue in milestone protocols occurs when primary backers sell their tokens on the secondary market. If ragequit rights were tied strictly to an initial primary receipt PDA, the seller would hold a useless receipt while the secondary buyer holds tokens without refund rights. In a default, unspent escrow capital would become trapped forever.

Ventrion solves this via **Fixed Snapshot Escrow Floor Backing**:
* At the exact moment a venture transitions to `BreachedRefundActive`, the contract computes and immutably records the fixed liquidation price:
$$\text{Floor Price}_{\text{fixed}} = \frac{\text{Escrow USDC at Breach}}{\text{Circulating Eligible Shares at Breach}}$$
* Any holder of circulating common shares can ragequit and burn their shares at this guaranteed snapshot price:
  1. It prevents bank runs because late claimers receive the exact same price per share as early claimers.
  2. It creates an automated floor price on secondary markets. If market panic pushes the token price on Meteora below its cash liquidation value, arbitrageurs purchase tokens from the pool and burn them for net escrow USDC until the pool price matches the cash floor.

### 4.5 Complete Hostile Takeover Immunity
A fatal vulnerability in conventional DAO token models is that a hostile competitor or short-seller can accumulate 51% of circulating tokens on an open DEX and vote to dissolve the company, seize intellectual property, or fire the leadership.

Ventrion completely eliminates this attack vector:
* **Circulating tokens do not have the power to dissolve the physical company.**
* Token holders do not vote on day-to-day operations or firing the founder.
* Backer recourse is strictly confined to the **smart contract escrow**:
  * Unreleased milestone cash belongs to the escrow, not the founder.
  * If the founder fails or stops communicating, backers ragequit their remaining cash.
  * But a hostile whale cannot force the founder out of their own business or seize physical company equipment.
* The entrepreneur retains full operating sovereignty while backers enjoy full financial downside protection.

---

# 5. Legal Architecture, Geofencing and Tax-Compliant Clearing

### 5.1 Geofencing, Active Marketing Ban and Reverse Solicitation
Ventrion operates an institutional compliance perimeter to eliminate exposure to local securities offering rules (such as US SEC registration or German BaFin prospectus requirements):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3-TIER COMPLIANCE PERIMETER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Network Layer (IP & VPN Geoblocking):                                    │
│    Automated block of US and German IP ranges via Cloudflare / MaxMind.     │
│    Commercial VPN exit nodes hard-blocked at the Web & RPC gateways.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Application Layer (Forced Clickwrap Self-Certification):                 │
│    Mandatory modal on connectWallet():                                      │
│    "User certifies under penalty of perjury non-US and non-DE residency."   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Communication Layer (Active Marketing Ban & Reverse Solicitation):       │
│    Whitepaper and platform exclusively in English. Zero EUR pricing.        │
│    Zero active marketing, influencer campaigns, or ads in Germany or the US.│
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Legal Grounds:
* **United States (SEC Regulation S Safe Harbor):** The token emission qualifies under **Rule 903 Category 1** (Foreign Issuer with No Substantial U.S. Market Interest). The 3-tier perimeter satisfies SEC Release No. 33-7516 for offshore internet offerings.
* **Germany & European Union (Reverse Solicitation):** Under Art. 61 MiCA and established BaFin cross-border guidance, the provision of decentralized protocol infrastructure does not constitute an offering within Germany if active domestic marketing is absent. Unprompted secondary market interaction via decentralized AMMs (Meteora DLMM) constitutes passive cross-border engagement initiated on the user's exclusive initiative (*Passive Dienstleistungsfreiheit*).

---

### 5.2 Tax-Compliant Triple-Entity Clearing Architecture
Under German tax law, a domestic operating company (GmbH) cannot transfer money directly to anonymous crypto wallets:
* **Section 160 AO (Empfaengerbenennung):** German tax law requires the taxpayer to identify recipients of expenditures by full legal name and address. Payments to anonymous wallets result in mandatory denial of business expense deductibility.
* **Section 50a EStG Royalty Trap:** Outbound payments structured as "software licenses" to offshore entities without a double taxation treaty trigger a mandatory **15.825% German withholding tax**.
* **Section 9 StAbwG (Tax Haven Defense Act Trap):** Direct payments to entities in non-cooperative tax jurisdictions (such as the Marshall Islands, which is on the EU Blacklist) trigger an unconditional prohibition of business expense deduction (Betriebsausgabenabzugsverbot). Routing the commercial agreement through a white-listed jurisdiction with an active Double Taxation Agreement (Switzerland) completely eliminates Section 9 StAbwG liability.

To solve this, Ventrion utilizes a **Triple-Entity Clearing Structure**:

```
+-------------------------------------------------------------+
|                     GERMAN OPCO (GmbH)                      |
|     • Holds physical leases, staff, and POS terminal IP     |
|     • Deducts 100% as business expense (SKR03: 4600)        |
+------------------------------+------------------------------+
                               |
                               |  B2B Service Agreement:
                               |  Ecosystem Marketing Fee (2.5% GMV)
                               v
+-------------------------------------------------------------+
|             SWISS VEREIN (Art. 60 ff. ZGB)                  |
|           "Ventrion Global Ecosystem Association"           |
|     • Seat: Zug, Switzerland (Crypto Valley)                |
|     • White-listed jurisdiction (Full DTA, no StAbwG)       |
|     • Issues formal invoice (UID: CHE-xxx.xxx.xxx)          |
+------------------------------+------------------------------+
                               |
                               |  On-Chain Protocol Performance
                               |  Bounty Routing
                               v
+-------------------------------------------------------------+
|               ON-CHAIN STAKING REWARD VAULT                 |
|     • Programmatic payout to active stakers and ambassadors |
+-------------------------------------------------------------+
```

#### Tax Mechanics of the Ecosystem Marketing Fee:
1. **Commercial Character:** The agreement between the German OpCo and the Swiss Association is a **pure marketing and merchant acquisition service contract**. It involves no licensing of IP, avoiding Section 50a EStG withholding tax completely (0.0% withholding tax).
2. **Arm's Length Benchmark (Section 1 AStG):** The fee is structured as an industry-standard performance fee: **2.5% of Gross Merchandise Volume (GMV)** processed through the Solana Pay terminal. This matches standard payment interchange benchmarks (Stripe, Visa, Adyen) and withstands corporate tax audits.
3. **Receipt Compliance (Section 160 AO):** The recipient is clearly identified as the Swiss Association with its Swiss Business Identification Number (UID).
4. **Accounting Entry (DATEV):**
   * *Debit:* Account 4600 (SKR03) / 6600 (SKR04) (Advertising & Marketing Expense).
   * *Credit:* Account 1200 / 1800 (Bank / USDC Corporate Account).
   * *Tax Key:* Section 13b UStG Reverse Charge (Third-Country B2B Service, 19% input tax / 19% output tax = cash-neutral).

---

### 5.3 Tech Startups vs. Decentralized Gastro & Retail Brands
Ventrion natively supports two distinct business archetypes:

#### Class A: Software & Tech Startups (Global Digital Ventures)
* **Contract Mechanism:** Standardized SAFE (Simple Agreement for Future Equity) and Token Warrant with the operating company.
* **Cap Table Clarity:** Exactly one clean institutional line on the startup's cap table.
* **Community Utility:** Backers receive global digital perks: API credits, lifetime developer licenses, token-gated beta releases, and protocol governance.

#### Class B: Decentralized Gastro, Creator & Retail Brands (Local Physical Ventures)
* **Contract Mechanism:** B2B Community Advocacy & Merchant Agreement.
* **Real-World Value Engine:**
  * **Direct Solana Pay Discounts:** Verified token holders receive an instant 15% discount at the point of sale. For a patron spending $500 annually, this returns $75 in real savings.
  * **Brand Advocacy:** Stakers act as authentic promoters, driving local foot traffic through Solana Mobile geo-targeted campaigns.
  * **Ecosystem Performance Fee:** The OpCo remits 2.5% of POS GMV as a tax-deductible marketing fee to the Swiss Association, which programmatically distributes it to the staker vault.

---

### 5.4 Clear Distinction: Honest Failure vs. Willful Fraud

```
+─────────────────────────────────────────────────────────────────────────────+
|                     HONEST FAILURE VS. WILLFUL FRAUD                        |
+─────────────────────────────────────┬───────────────────────────────────────+
| HONEST VENTURE FAILURE              | WILLFUL FRAUD & EMBEZZLEMENT          |
| (100% PROTECTED UNDER SAFE HARBOR)  | (ACTIONABLE UNDER LAW & ESCROW VOID)  |
+─────────────────────────────────────┼───────────────────────────────────────+
| • Lack of customer demand or sales  | • Forged invoices or fake receipts    |
| • Cost overruns, supplier delays    | • Fabricated milestone proof links    |
| • Good-faith attempts to pivot      | • Funneling cash to personal luxury   |
| • Open, transparent communication   | • Intentional ghosting (>60 days dark)|
| • Funds spent on real operations    | • Refusal to provide bank records     |
+─────────────────────────────────────┼───────────────────────────────────────+
| LEGAL & PROTOCOL CONSEQUENCE:       | LEGAL & PROTOCOL CONSEQUENCE:         |
| • Zero personal liability for CEO   | • Corporate veil pierced              |
| • Zero lawsuits or court claims     | • Direct personal liability for theft |
| • Unspent escrow refunded to backers| • Legal setup & counsel enforcement   |
| • Founder walks away cleanly        | • Full international legal pursuit    |
+─────────────────────────────────────┴───────────────────────────────────────+
```

#### The Honest Failure Safe Harbor
* Governed by the **Business Judgment Rule (BJR)**.
* If a founder works in good faith, updates the community, and spends funds on legitimate business activities, they are **fully protected from personal liability**.
* When an honest failure occurs, remaining unspent milestone cash in the escrow is released directly for 100% pro-rata backer ragequit.
* The company winds down cleanly without personal bankruptcy or legal harassment.

#### Actionable Fraud & Embezzlement
* Intentional fraud occurs only in concrete, provable cases: forging milestone deliverables, wiring corporate funds to personal accounts for non-business purposes, or raising funds and vanishing completely without communication.
* In these explicit cases, the founder loses the Safe Harbor shield and faces direct legal accountability.

---

### 5.5 Precision on Asset Protection and Brand Ownership
Founders often fear that tokenizing their business means risking their personal brand or life's work. Ventrion establishes strict boundaries:

* **Founder Retains Core IP and Accounts:** The founder's personal social media accounts, proprietary technology, and primary company assets remain 100% their own.
* **No Hostile Confiscation:** Ventrion does not confiscate trademarks or personal handles in an honest failure. If a venture fails to reach profitability, the owner simply winds down operations; anonymous internet users do not seize their name.
* **Malicious Abandonment Exception:** A transfer of official company-created project assets (such as an official project GitHub repository or project-specific website domain) only occurs if a founder commits verified, malicious abandonment (taking funds, severing all communication for over 60 days, and refusing to return unspent capital). In all normal business outcomes, the founder's property is untouchable.

---

# 6. Technical Specifications and Solana Anchor Layouts

### 6.1 Program Derived Address (PDA) Matrix

All PDA derivations use static string literals and fixed-width byte components to prevent hash collision vulnerabilities.

| Account Name | Seeds (Borsh Specification) | Space (Allocated) | Owner Program | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GlobalConfig` | `[b"global_config"]` | **120 Bytes** | Ventrion Core | Protocol-wide parameters & fees |
| `VentureState` | `[b"venture", venture_token_mint]` | **368 Bytes** | Ventrion Core | Master company state machine |
| `MasterLockVault` | `[b"master_lock_vault", venture_key]` | **SPL Token Account**| SPL Token Program | Custody of all 1,000,000 shares |
| `FounderVesting` | `[b"founder_vesting", venture_key, founder_key]`| **168 Bytes** | Ventrion Core | Custom vesting schedule tracking |
| `FundingRound` | `[b"funding_round", venture_key, &[round_index]]`| **184 Bytes** | Ventrion Core | Terms and targets for round N |
| `RoundInvestorRecord`| `[b"round_record", funding_round_key, user_key]`| **96 Bytes** | Ventrion Core | Primary raise contribution receipts |
| `MilestoneEscrow` | `[b"milestone_escrow", funding_round_key]` | **806 Bytes** | Ventrion Core | Milestone timeline and delivery state |
| `MilestoneUsdcVault`| `[b"milestone_usdc_vault", milestone_escrow_key]`| **SPL Token Account**| SPL Token Program | Escrowed milestone USDC funds |
| `VentureVerificationVote`| `[b"verification_vote", venture_key]` | **96 Bytes** | Ventrion Core | On-chain $VENT staker approval ballot |
| `InvestorVault` | `[b"investor_vault", venture_key, investor_key]` | **184 Bytes** | Ventrion Core | Staking vault and dividend ledger |
| `DlmmCustody` | `[b"dlmm_custody", venture_key]` | **SPL Token Account**| Ventrion Core | Permanent locked LP position custody |
| `LegalSetupVault` | `[b"legal_setup_vault", venture_key]` | **SPL Token Account**| SPL Token Program | Holds legal setup fee until entity confirmation |

---

### 6.2 State Machine Progression

Every venture progresses through seven deterministic on-chain states:

1. `GenesisInitialized`: 1,000,000 shares minted into `MasterLockVault`. Mint authority revoked.
2. `PrimaryRaiseActive`: Meteora flat curve open for USDC deposits and sellbacks outside US/DE.
3. `CapReached`: Target funding cap reached. Ready for two-step graduation.
4. `GraduationPending`: Sub-Step 4A finalized (`finalize_round_escrow`). DLMM liquidity seeding in progress (48h timeout guard).
5. `GraduatedDLMMLive`: Sub-Step 4B verified (`seed_dlmm_liquidity`). 17% LP locked. Unification enabled.
6. `OperationalMature`: All milestone tranches delivered and released to treasury.
7. `BreachedRefundActive`: Milestone deadline breached or fraud confirmed. Fixed snapshot ragequit floor active.

---

### 6.3 Exact Account Memory Layouts

All structs enforce exact byte counts including the 8-byte Anchor discriminator:

#### 1. Global Config (`GlobalConfig`: 120 Bytes = 8B Disc + 112B Fields)
```rust
#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,                       // 32 bytes
    pub fee_treasury: Pubkey,                // 32 bytes
    pub vent_staking_pool: Pubkey,           // 32 bytes: Mother token governance pool
    pub protocol_fee_bps: u16,               // 2 bytes: e.g. 50 (0.5%)
    pub min_approval_bps: u16,               // 2 bytes: e.g. 5000 (50.0% majority)
    pub graduation_timeout_seconds: i64,     // 8 bytes: 172,800 (48 hours)
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 3],                  // 3 bytes: Alignment padding (Total 112B fields)
}
```

#### 2. Venture State (`VentureState`: 368 Bytes = 8B Disc + 360B Fields)
```rust
#[account]
pub struct VentureState {
    pub global_config: Pubkey,               // 32 bytes
    pub founder: Pubkey,                     // 32 bytes
    pub venture_token_mint: Pubkey,          // 32 bytes
    pub usdc_mint: Pubkey,                   // 32 bytes
    pub master_lock_vault: Pubkey,           // 32 bytes
    pub dlmm_custody: Pubkey,                // 32 bytes
    pub meteora_dlmm_pool: Pubkey,           // 32 bytes
    pub midao_llc_id: [u8; 32],              // 32 bytes: Registry ID
    pub legal_contract_hash: [u8; 32],       // 32 bytes: SHA256 of Operating Agreement
    pub total_supply: u64,                   // 8 bytes: Exactly 1,000,000 * 10^6
    pub circulating_public_float: u64,       // 8 bytes
    pub total_staked_in_vaults: u64,         // 8 bytes
    pub founder_vesting_tokens: u64,         // 8 bytes
    pub current_round_index: u8,             // 1 byte
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 38],                 // 38 bytes: Exact alignment padding
}
```

#### 3. Founder Vesting Account (`FounderVesting`: 168 Bytes = 8B Disc + 160B Fields)
```rust
#[account]
pub struct FounderVesting {
    pub venture: Pubkey,                     // 32 bytes
    pub founder: Pubkey,                     // 32 bytes
    pub vesting_token_vault: Pubkey,         // 32 bytes
    pub total_allocated_tokens: u64,         // 8 bytes: e.g. 700,000 * 10^6
    pub total_claimed_tokens: u64,           // 8 bytes
    pub start_timestamp: i64,                // 8 bytes
    pub cliff_duration_seconds: i64,         // 8 bytes: Founder chosen cliff
    pub total_duration_seconds: i64,         // 8 bytes: Founder chosen duration (1 to 3 years)
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 23],                 // 23 bytes: Alignment padding
}
```

#### 4. Milestone Escrow Account (`MilestoneEscrow`: 806 Bytes = 8B Disc + 798B Fields)
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug)]
#[repr(u8)]
pub enum MilestoneStatus {
    #[default]
    Pending = 0,
    Delivered = 1,
    Released = 2,
    Disputed = 3,
    Breached = 4,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, Debug)]
pub struct MilestoneItem {
    pub id: u8,                              // 1 byte
    pub percentage_bps: u16,                 // 2 bytes: Founder defined tranche percentage
    pub amount_usdc: u64,                    // 8 bytes
    pub target_completion_date: i64,         // 8 bytes
    pub deliverable_hash: [u8; 32],          // 32 bytes: SHA256 of Proof
    pub submission_timestamp: i64,           // 8 bytes: When deliverable was submitted
    pub status: MilestoneStatus,             // 1 byte
    pub _reserved: [u8; 4],                  // 4 bytes: Alignment
} // 64 bytes per milestone * 10 = 640 bytes

#[account]
pub struct MilestoneEscrow {
    pub venture: Pubkey,                     // 32 bytes
    pub funding_round: Pubkey,               // 32 bytes
    pub escrow_usdc_vault: Pubkey,           // 32 bytes
    pub total_allocated_usdc: u64,           // 8 bytes
    pub total_released_usdc: u64,            // 8 bytes
    pub total_ragequit_usdc: u64,            // 8 bytes
    pub floor_price_snapshot_usdc: u64,      // 8 bytes: Immutable snapshot at breach
    pub current_milestone_index: u8,         // 1 byte
    pub milestones_count: u8,                // 1 byte
    pub bump: u8,                            // 1 byte
    pub milestones: [MilestoneItem; 10],     // 640 bytes
    pub _reserved: [u8; 27],                 // 27 bytes: Exact alignment padding
}
```

#### 5. Funding Round Account (`FundingRound`: 184 Bytes = 8B Disc + 176B Fields)
```rust
#[account]
pub struct FundingRound {
    pub venture: Pubkey,                     // 32 bytes
    pub round_index: u8,                     // 1 byte
    pub target_cap_usdc: u64,                // 8 bytes
    pub total_raised_usdc: u64,              // 8 bytes
    pub upfront_working_capital_bps: u16,    // 2 bytes: e.g. 1500 to 2500 (15% to 25%)
    pub round_status: u8,                    // 1 byte
    pub graduation_initiated_ts: i64,        // 8 bytes: Timestamp of Step 4A
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 115],                // 115 bytes: Alignment padding
}
```

#### 6. Round Investor Record (`RoundInvestorRecord`: 96 Bytes = 8B Disc + 88B Fields)
```rust
#[account]
pub struct RoundInvestorRecord {
    pub funding_round: Pubkey,               // 32 bytes
    pub investor: Pubkey,                    // 32 bytes
    pub usdc_contributed: u64,               // 8 bytes
    pub shares_allocated: u64,               // 8 bytes
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 7],                  // 7 bytes: Alignment padding
}
```

#### 7. Venture Verification Vote (`VentureVerificationVote`: 96 Bytes = 8B Disc + 88B Fields)
```rust
#[account]
pub struct VentureVerificationVote {
    pub venture: Pubkey,                     // 32 bytes
    pub for_weight: u64,                     // 8 bytes: $VENT staker yes-votes
    pub against_weight: u64,                 // 8 bytes: $VENT staker no-votes
    pub voting_end_timestamp: i64,           // 8 bytes: Voting deadline
    pub is_finalized: bool,                  // 1 byte
    pub is_approved: bool,                   // 1 byte
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 29],                 // 29 bytes: Alignment padding (Total 88B fields)
}
```

#### 8. Investor Staking Vault (`InvestorVault`: 184 Bytes = 8B Disc + 176B Fields)
```rust
#[account]
pub struct InvestorVault {
    pub venture: Pubkey,                     // 32 bytes
    pub investor: Pubkey,                    // 32 bytes
    pub staked_amount: u64,                  // 8 bytes
    pub lock_start_timestamp: i64,           // 8 bytes
    pub lock_end_timestamp: i64,             // 8 bytes
    pub lock_duration_seconds: i64,          // 8 bytes
    pub multiplier_bps: u16,                 // 2 bytes: 10,000 to 30,000 (1.0x to 3.0x)
    pub effective_weight: u128,              // 16 bytes: staked_amount * multiplier_bps
    pub last_acc_yield: u128,                // 16 bytes: O(1) Checkpoint
    pub total_claimed_usdc: u64,             // 8 bytes
    pub is_active: bool,                     // 1 byte
    pub bump: u8,                            // 1 byte
    pub _reserved: [u8; 36],                 // 36 bytes: Alignment padding
}
```

---

### 6.4 Constant-Time O(1) Yield Math (Overflow-Safe u256)

To completely eliminate the risk of `u128` arithmetic overflow, the scaling factor is calibrated to $10^{12}$, and all intermediate multiplications execute in 256-bit precision:

#### Global Checkpoint Update:
When marketing rewards or trading fees arrive:
$$\Delta \text{Acc} = \left\lfloor \frac{\text{USDC}_{\text{inflow}} \times 10^{12} \times 10,000}{\sum_{j} W_j} \right\rfloor$$
$$\text{Acc}_{\text{global}} \leftarrow \text{Acc}_{\text{global}} + \Delta \text{Acc}$$

#### Individual Claim:
Using intermediate 256-bit unsigned math:
$$\text{Claimable USDC}_i = \left\lfloor \frac{W_i \times (\text{Acc}_{\text{global}} - \text{Acc}_{\text{user}, i})}{10^{12} \times 10,000} \right\rfloor$$
$$\text{Acc}_{\text{user}, i} \leftarrow \text{Acc}_{\text{global}}$$

Under $10^{12}$ scaling and `u256` multiplication, maximum intermediate products never exceed $10^{28}$, leaving over 10 orders of magnitude headroom below `u128::MAX` ($3.4 \times 10^{38}$) and guaranteeing absolute overflow safety.

---

### 6.5 Compute Unit Profile and Zero-Loop Guarantee

| Instruction | Operations Executed | Total Compute Units | Headroom vs 200k Limit |
| :--- | :--- | :--- | :--- |
| `claim_investor_dividends` | O(1) Accumulator math + USDC transfer | **~11,300 CU** | 94.3% Headroom |
| `deposit_investor_shares` | Token custody transfer + Weight update | **~12,600 CU** | 93.7% Headroom |
| `finalize_round_escrow` | Accounting split + Legal fee + Escrow seed | **~21,500 CU** | 89.2% Headroom |
| `seed_dlmm_liquidity` | Meteora CPI pool init + Add liquidity | **~135,000 CU** | 32.5% Headroom |
| `abort_pending_graduation`| 48h timeout verification + Refund unlock | **~14,800 CU** | 92.6% Headroom |
| `submit_milestone_delivery` | Autonomous deliverable hash recording | **~6,200 CU** | 96.9% Headroom |
| `execute_milestone_release`| Optimistic tranche payout to OpCo treasury| **~13,500 CU** | 93.2% Headroom |
| `challenge_milestone` | Challenge bond custody + Status to Disputed | **~14,200 CU** | 92.9% Headroom |
| `ragequit_milestone_escrow`| Fixed snapshot floor refund + Symmetric burn | **~18,500 CU** | 90.7% Headroom |

---

# 7. Security Rules and Error Codes

### 7.1 Attack Vectors and Built-In Defenses

* **Hostile Takeover by Competitor:** Competitors who accumulate circulating tokens cannot vote to dissolve the operating business or seize assets. They only own public shares and fee rights.
* **Founder Day-One Dump:** Founder shares are held in `FounderVesting` with an automated cliff. The code prohibits early transfers.
* **Liquidity Rugpull:** The 17% Meteora DLMM LP position NFT is custodied in `DlmmCustody` with permanent withdrawal locks.
* **Milestone Cash Grab:** Escrowed USDC can only be released upon milestone delivery verification. If deadlines lapse, primary backers pull their funds via ragequit.
* **Equity Inflation on Default:** When backers ragequit, unvested founder tokens are burned in exact mathematical proportion, preventing founder enrichment from project failure.
* **Dead Escrow Lockup:** Token holders can burn shares to claim net remaining escrow funds at the fixed snapshot price, creating an arbitrage floor and preventing stranded liquidity.
* **Graduation Deadlock:** The 48-hour graduation timeout allows permissionless rollback via `abort_pending_graduation` if Sub-Step 4B is never executed.

### 7.2 Program Error Code Reference

```rust
#[error_code]
pub enum VentrionError {
    #[msg("6000: Quote currency mint must match canonical USDC.")]
    InvalidUsdcMint,
    #[msg("6001: Target funding cap must be greater than zero.")]
    ZeroTargetCap,
    #[msg("6002: Lock commitment duration must be at least 1 day.")]
    LockDurationTooShort,
    #[msg("6003: Founder vesting cliff has not elapsed.")]
    FounderCliffNotMet,
    #[msg("6004: Funding round is not currently active.")]
    RoundNotActive,
    #[msg("6005: Round is not eligible for graduation.")]
    RoundNotEligibleForGraduation,
    #[msg("6006: Round is not eligible for refund.")]
    RoundNotEligibleForRefund,
    #[msg("6007: Milestone is not eligible for release.")]
    MilestoneNotEligibleForRelease,
    #[msg("6008: Milestone deadline has not been breached.")]
    MilestoneNotBreached,
    #[msg("6009: Math overflow occurred during financial precision calculation.")]
    MathOverflow,
    #[msg("6010: Zero claimable rewards available.")]
    NoDividendsOwed,
    #[msg("6011: Global supply invariant violated. Total shares must equal 1,000,000 minus total burned.")]
    SupplyInvariantViolated,
    #[msg("6012: Caller lacks required authority for this instruction.")]
    Unauthorized,
    #[msg("6013: Position is still within lock commitment period.")]
    LockNotExpired,
    #[msg("6014: Milestone deliverable proof has not been submitted.")]
    DeliverableNotSubmitted,
    #[msg("6015: Venture has not received legal approval by $VENT stakers.")]
    VentureNotApproved,
    #[msg("6016: Verification vote is currently active.")]
    VerificationVoteActive,
    #[msg("6017: Graduation is still pending. DLMM liquidity must be seeded first.")]
    GraduationPending,
    #[msg("6018: Graduation timeout has not yet elapsed (48 hours required).")]
    GraduationTimeoutNotElapsed,
}
```

---

# 8. Developer Implementation and Integration

### 8.1 SDK Overview
The official `@ventrion/sdk` provides a typed TypeScript client to interact with all on-chain programs:

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { VentrionCore } from "./types/ventrion_core";

export class VentrionClient {
  public program: Program<VentrionCore>;

  constructor(
    public connection: Connection,
    public provider: AnchorProvider
  ) {
    this.program = new Program<VentrionCore>(IDL, provider);
  }

  public getVenturePda(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("venture"), mint.toBuffer()],
      this.program.programId
    );
  }

  public getFounderVestingPda(venture: PublicKey, founder: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("founder_vesting"), venture.toBuffer(), founder.toBuffer()],
      this.program.programId
    );
  }

  public getMilestoneEscrowPda(fundingRound: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("milestone_escrow"), fundingRound.toBuffer()],
      this.program.programId
    );
  }

  public getChallengeBondPda(milestoneEscrow: PublicKey, milestoneId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_bond"), milestoneEscrow.toBuffer(), Buffer.from([milestoneId])],
      this.program.programId
    );
  }

  public getInvestorVaultPda(venture: PublicKey, investor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("investor_vault"), venture.toBuffer(), investor.toBuffer()],
      this.program.programId
    );
  }
}
```

---

### 8.2 Complete End-to-End TypeScript Lifecycle

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import { VentrionClient } from "@ventrion/sdk";

async function runVentrionLifecycle() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const founder = Keypair.generate();
  const investor = Keypair.generate();
  const client = new VentrionClient(connection, new AnchorProvider(connection, new Wallet(founder), {}));

  console.log("1. Initializing Venture (1,000,000 Common Shares Fixed)...");
  const ventureMint = Keypair.generate();
  const [venturePda] = client.getVenturePda(ventureMint.publicKey);

  // Founder launches venture with custom vesting, milestones, and signed legal agreement
  await client.program.methods
    .launchVentureAllInOne({
      name: "Solana Bistro & Roastery",
      symbol: "BSTR",
      midaoLlcId: Array.from(Buffer.alloc(32, 7)),
      legalContractHash: Array.from(Buffer.alloc(32, 1)),
      targetCapUsdc: new BN(50_000 * 10 ** 6), // $50,000 USDC raise
      founderShares: new BN(700_000 * 10 ** 6), // 70% Founder Allocation
      founderLockMonths: 36,                    // Founder chose 3-year commitment
      founderCliffMonths: 12,                   // 12-month cliff
      upfrontWorkingCapitalBps: 1500,           // Founder chose 15% upfront for initial setup
    })
    .accounts({
      venture: venturePda,
      founder: founder.publicKey,
      // ... token mints and system vaults
    })
    .signers([founder])
    .rpc();

  console.log("2. Primary Backer deposits $3,000 USDC on the Flat Curve...");
  // contributePrimaryRound is a typed SDK wrapper around the Meteora Dynamic Bonding Curve (DBC) swap CPI
  await client.program.methods
    .contributePrimaryRound(new BN(5_000 * 10 ** 6))
    .accounts({
      venture: venturePda,
      investor: investor.publicKey,
    })
    .signers([investor])
    .rpc();

  console.log("3. Target cap reached. Executing two-step graduation...");
  // Step 4A: Accounting split, max($5000, 5%) legal fee, milestone escrow
  await client.program.methods
    .finalizeRoundEscrow()
    .accounts({ venture: venturePda })
    .rpc();

  // Step 4B: Seed 17% permanent Meteora DLMM pool
  await client.program.methods
    .seedDlmmLiquidity()
    .accounts({ venture: venturePda })
    .rpc();

  console.log("4. Backer stakes common shares for 1 Year (2.0x Conviction Multiplier)...");
  const [investorVaultPda] = client.getInvestorVaultPda(venturePda, investor.publicKey);
  await client.program.methods
    .depositInvestorShares(new BN(5_000 * 10 ** 6), new BN(365 * 86400))
    .accounts({
      venture: venturePda,
      investorVault: investorVaultPda,
      investor: investor.publicKey,
    })
    .signers([investor])
    .rpc();

  console.log("5. Founder autonomously submits Milestone 1 delivery proof...");
  const deliverableHash = Array.from(Buffer.alloc(32, 9)); // SHA256 of Arweave deliverable proof
  await client.program.methods
    .submitMilestoneDelivery(0, deliverableHash)
    .accounts({
      venture: venturePda,
      founder: founder.publicKey,
    })
    .signers([founder])
    .rpc();

  console.log("6. 14-day optimistic window passes without dispute. Executing release...");
  await client.program.methods
    .executeMilestoneRelease(0)
    .accounts({
      venture: venturePda,
      founder: founder.publicKey,
    })
    .rpc();

  console.log("Ventrion lifecycle active: 17% LP locked, milestones protected, zero takeover risk.");
}

runVentrionLifecycle().catch(console.error);
```

---

*Ventrion Protocol ($VENT): The Sovereign Decentralized Equity Operating System on Solana.*  
*Official Release Specification (October 2026).*
