# Ventrion Protocol ($VTRN)
## The Official Main Manifesto and Protocol Specification
*The standard for real-world business tokenization, honest governance, and sustainable equity on Solana.*

---

# Table of Contents

* [1. Why We Built Ventrion](#1-why-we-built-ventrion)
  * [1.1 The Meme Coin Launchpad Trap](#11-the-meme-coin-launchpad-trap)
  * [1.2 Real Companies Need Real Standards](#12-real-companies-need-real-standards)
  * [1.3 The Core Protocol Numbers at a Glance](#13-the-core-protocol-numbers-at-a-glance)
* [2. The Complete Journey for Founders and Investors](#2-the-complete-journey-for-founders-and-investors)
  * [2.1 Company Genesis and Mint Authority Revocation](#21-company-genesis-and-mint-authority-revocation)
  * [2.2 The Round Manifest and Roadmap Commitments](#22-the-round-manifest-and-roadmap-commitments)
  * [2.3 Founder Lock and the V-Score Trust Metric](#23-founder-lock-and-the-v-score-trust-metric)
  * [2.4 Raising Capital on the Meteora Flat Curve](#24-raising-capital-on-the-meteora-flat-curve)
  * [2.5 Graduation and Permanent Liquidity Seeding](#25-graduation-and-permanent-liquidity-seeding)
  * [2.6 Swapping Receipts for Real Common Shares](#26-swapping-receipts-for-real-common-shares)
  * [2.7 Milestone Governance, Capital Release, and the Cure Cycle](#27-milestone-governance-capital-release-and-the-cure-cycle)
  * [2.8 Cross-Round Protection and the Ragequit Right](#28-cross-round-protection-and-the-ragequit-right)
  * [2.9 General Shareholder DAO Governance](#29-general-shareholder-dao-governance)
  * [2.10 Smart Contract Staking and Real Dividends](#210-smart-contract-staking-and-real-dividends)
  * [2.11 Honest Unstaking with Capped Slashing](#211-honest-unstaking-with-capped-slashing)
  * [2.12 Future Growth Rounds](#212-future-growth-rounds)
  * [2.13 The Holding Company Platform Revenue Share](#213-the-holding-company-platform-revenue-share)
* [3. On-Chain Architecture and Data Layouts](#3-on-chain-architecture-and-data-layouts)
  * [3.1 PDA Seed Derivation Matrix](#31-pda-seed-derivation-matrix)
  * [3.2 State Machine Progression](#32-state-machine-progression)
  * [3.3 Dual Voting Data Structures and Storage Layouts](#33-dual-voting-data-structures-and-storage-layouts)
  * [3.4 Constant Time Accounting Data Structures](#34-constant-time-accounting-data-structures)
* [4. Mathematical Formulas and Invariants](#4-mathematical-formulas-and-invariants)
  * [4.1 Supply Conservation Invariant](#41-supply-conservation-invariant)
  * [4.2 The 75/25 Sale and Liquidity Split](#42-the-7525-sale-and-liquidity-split)
  * [4.3 V-Score and Pool Drain Protection Formula](#43-v-score-and-pool-drain-protection-formula)
  * [4.4 Scaled Dividend Checkpointing in Constant Time](#44-scaled-dividend-checkpointing-in-constant-time)
  * [4.5 Linear Slashing Formula](#45-linear-slashing-formula)
  * [4.6 Milestone Pro-Rata Ragequit Settlement Formula](#46-milestone-pro-rata-ragequit-settlement-formula)
  * [4.7 Primary Backer Eligible Weight Invariant](#47-primary-backer-eligible-weight-invariant)
* [5. Security and Error Reference](#5-security-and-error-reference)
  * [5.1 Defending Against Practical Exploits](#51-defending-against-practical-exploits)
  * [5.2 Program Error Codes](#52-program-error-codes)
* [6. Repository Structure and Release Roadmap](#6-repository-structure-and-release-roadmap)
  * [6.1 Clean GitHub Architecture](#61-clean-github-architecture)
  * [6.2 Strict Verification Boundary](#62-strict-verification-boundary)
  * [6.3 Developer Guide and TypeScript SDK](#63-developer-guide-and-typescript-sdk)
  * [6.4 Complete End-to-End Code Example](#64-complete-end-to-end-code-example)

---

# 1. Why We Built Ventrion

### 1.1 The Meme Coin Launchpad Trap
Let us be completely honest about token launches on Solana today. If you run a real company, an operational business, or an ambitious startup, your only accessible option right now is to launch on platforms designed for meme coins, like Pump.fun. That is completely broken for anyone building something that lasts.

Here is what happens on those platforms:
* **Lifespans measured in hours:** Tokens are launched, pumped by automated sniper bots, dumped on retail buyers, and abandoned by the end of the day.
* **Founders get exploited:** When you create a token on a meme launchpad, you do not even own your company's equity. You have to spend your own personal savings to buy your own shares off a steep exponential curve, competing against bots. Why on earth should a founder have to buy their own company?
* **Zero accountability:** Every dollar raised goes directly into the creator's private wallet with zero strings attached. There are no milestone escrows, no roadmaps, and no refunds when the creator disappears.
* **The SOL volatility trap:** Everything is denominated in SOL. If you raise 100 SOL to hire three engineers and pay your server bills, and SOL drops 40% next week, you can no longer pay payroll. Real businesses run on predictable fiat currencies, not fluctuating gas tokens.

### 1.2 Real Companies Need Real Standards
Ventrion solves this by bringing traditional venture capital standards and corporate governance directly on-chain on Solana.

* **You own 100% of your company from day one:** When you launch on Ventrion, exactly 1,000,000 common shares are minted directly into an on-chain vault. You do not pay a penny to own your company.
* **100% USDC denomination:** Raises, milestone escrows, trading pairs, and dividend payouts run exclusively on canonical USDC. Your business budget is stable and predictable.
* **No money moves without a plan:** Before any investor puts in a dollar, you provide a clear plan: what is the budget, what are the goals, and when will they be delivered? That commitment is hashed and stored permanently on the blockchain.
* **Real milestone protection:** 75% of raised funds stay locked in an on-chain escrow. If you deliver, you get paid. If you fail, investors have a guaranteed ragequit right to get their unspent cash back.
* **Skin in the game that actually protects liquidity:** Founders can lock up to 99% of their equity for up to 3 years. But we do not just look at how much you lock: our V-Score checks the ratio between your unlocked shares and the liquidity pool, so nobody can secretly drain the pool.
* **Real cashflow dividends:** 100% of company profits and trading fees flow directly to long-term stakers in dedicated investor vaults.

### 1.3 The Core Protocol Numbers at a Glance

| Parameter | Value | What It Means for You |
| :--- | :--- | :--- |
| **Total Share Supply** | **1,000,000 Shares** | Fixed forever. Mint authority is destroyed immediately. No dilution. |
| **Quote Currency** | **Canonical USDC** | Pure dollar stability for operations, salaries, and investor returns. |
| **Minimum Raise Size** | **1.0% (10,000 Shares)** | The smallest funding tranche permitted on the platform. |
| **Maximum Founder Lock** | **Up to 99.0% (990k Shares)**| Lock between 1 day and 3 years to prove commitment and earn trust. |
| **Meteora Liquidity Seed** | **Exactly 25.0%** | 25% of raised USDC and 25% of round shares fund permanent secondary liquidity. |
| **Liquidity Lock** | **100% Irrevocable** | LP positions are permanently custodied by the smart contract. Zero rugpull risk. |
| **Milestone Escrow Share**| **75.0% of Raise** | Held in escrow and released only as milestones are delivered. |
| **Protocol Veto Threshold** | **33.33% (One Third)** | An unchangeable blocking minority that lets investors halt questionable releases. |
| **Founder Voting Rights** | **0 Votes and 0 Dividends**| Founder shares cannot vote on milestones and cannot claim investor dividend pools. |
| **Maximum Slashing Cap** | **25.0% Maximum** | Linear penalty on early unstaking. You always walk away with at least 75%. |
| **Staking Multipliers** | **1.0x to 3.0x** | Boost your dividend share by committing your stock for longer horizons. |
| **Platform Fee** | **0.5% on Gross Profit** | A small protocol fee that flows directly to stakers of the parent $VTRN token. |

---

# 2. The Complete Journey for Founders and Investors

---

## 2.1 Company Genesis and Mint Authority Revocation

When a founder launches a company on Ventrion, the entire corporate setup happens in one single transaction through `launch_venture_all_in_one`.

1. **The 1,000,000 Share Rule:**
   Every single company on Ventrion has exactly 1,000,000 shares (with 6 decimal places, making it 1,000,000,000,000 base units). This makes share prices and ownership percentages immediately obvious: 1 share is always exactly 0.0001% of the company.
2. **The Master Lock Vault:**
   All 1,000,000 shares are minted straight into the company's `MasterLockVault` PDA:
   $$\text{MasterLockVault PDA} = \left[\text{b"master\_lock\_vault"}, \text{venture\_pda}\right]$$
   There are zero floating shares in circulation. Nobody can frontrun, snipe, or dump.
3. **Destroying the Mint Authority:**
   In that very same transaction, the SPL token mint authority is set to `None`:
   ```rust
   spl_token::instruction::set_authority(
       token_program.key,
       venture_token_mint.key,
       None,
       AuthorityType::MintTokens,
       founder.key,
       &[],
   )?;
   ```
   No one, not even the founder, can ever create another share. Dilution is cryptographically impossible.

---

## 2.2 The Round Manifest and Roadmap Commitments

Before a single dollar of investor money can enter the protocol, the founder must formally state what the money will be used for.

1. **What Goes Into the Manifest:**
   * **Target Cap in USDC:** For example, raising $15,000 USDC in a Seed round.
   * **Upfront Working Capital:** A modest percentage (such as 20% or $3,000 USDC) released immediately at graduation so the team can pay for initial setup, tooling, and legal costs.
   * **Milestone Tranches:** Between 1 and 10 concrete goals. For each milestone, the founder defines the percentage of escrowed cash, the deadline in days (e.g. 60 days, 120 days), and what will be delivered.
2. **Form vs Content:**
   The smart contract strictly requires the manifest data structure so the code knows how to handle the escrow. But founders have the freedom to fill fields as they see fit, even leaving description strings empty (`""`) if they choose. Of course, investors will simply refuse to fund a project that does not provide a clear roadmap.
3. **The Permanent Hash:**
   The entire manifest is hashed with SHA256 and stored on the `FundingRound` PDA. It becomes an immutable contract between founder and backers.

---

## 2.3 Founder Lock and the V-Score Trust Metric

Founders demonstrate long-term commitment by locking their remaining shares in the vault. Since a round requires at least 1% (10,000 shares), a founder can lock up to 99% (990,000 shares) for durations between 1 day and 3 years (1095 days).

### The Hidden Danger of Pool Draining
Here is a critical problem that standard launchpads completely ignore:
Suppose a founder raises 1% (10,000 shares) and locks 90% (900,000 shares) for 3 years. That sounds very impressive on paper. But look at what is left over:
$$1,000,000 - 900,000 - 10,000 = 90,000 \text{ shares unallocated in treasury (9%)}$$

Now look at the liquidity pool created after graduation:
* The pool receives 25% of the round shares: exactly 2,500 shares.
* The founder still holds 90,000 unlocked shares.
* That unlocked treasury is **36 times larger than the entire liquidity pool**.

If the founder sells even a small fraction of those unlocked shares into the pool, they suck out 100% of the USDC liquidity, crash the price to zero, and leave seed backers holding worthless paper. A simple lock percentage score would have given this founder a stellar AAA rating. That is dangerous.

### The Two-Stage V-Score Formula
To protect investors from this exact exploit, Ventrion evaluates both time commitment and pool drain exposure:

$$V_{\text{final}} = \min\left(10,000, \, \left\lfloor V_{\text{commitment}} \times M_{\text{pool\_safety}} \times 10,000 \right\rfloor \right)$$

1. **Commitment Score ($V_{\text{commitment}}$):**
   Evaluates how much equity is locked and for how long:
   $$V_{\text{commitment}} = \sum_{i=1}^{N} \left( \frac{\min(T_i, 1095)}{1095} \times \frac{\text{Shares}_i}{1,000,000} \right)$$
2. **Pool Safety Multiplier ($M_{\text{pool\_safety}}$):**
   Checks the proportion of uncommitted equity that is actually backed by liquidity:
   $$M_{\text{pool\_safety}} = \frac{S_{\text{raised}}}{1,000,000 - S_{\text{locked}}} = \frac{S_{\text{raised}}}{S_{\text{raised}} + S_{\text{unlocked}}}$$
3. **The Results:**
   * **Founder locks 99% and raises 1%:** Zero unlocked float. Safety multiplier is 1.0. Final score is **9,900 bps (AAA+)**.
   * **Founder locks 90%, raises 1%, leaves 9% unlocked:** Safety multiplier drops to $10,000 / 100,000 = 0.10$. The score collapses by 90% down to **900 bps (Junk Tier)**. Dashboards immediately display a severe liquidity drain warning.
4. **Strict Founder Exclusions:**
   Founder locked shares have **0 votes** on milestones and receive **0 dividends**. The founder cannot vote to pay themselves.

---

## 2.4 Raising Capital on the Meteora Flat Curve

Primary financing takes place on Meteora's Dynamic Bonding Curve (DBC) program.

1. **The Flat Curve Advantage:**
   Instead of an exponential pump-and-dump curve, Ventrion uses a flat, near-linear curve. The first buyer and the last buyer pay essentially the exact same fair price. Sniper bots cannot frontrun or sandwich retail investors.
2. **Pure USDC:**
   All contributions are in canonical USDC. No volatile tokens.
3. **Tranche Receipts ($VTRN-R0):**
   During the raise, buyers do not receive the final tradeable common shares. They receive dedicated receipt tokens (`$VTRN-R0`). The real common shares stay safe in the round escrow. This prevents early buyers from dumping on secondary markets or draining future financing rounds before graduation.
4. **The 75/25 Split:**
   From the shares allocated to the round (for example, 20,000 shares):
   * 75% (15,000 shares) are sold on the bonding curve.
   * 25% (5,000 shares) are held in reserve to pair with raised USDC in the liquidity pool.

---

## 2.5 Graduation and Permanent Liquidity Seeding

When all curve shares are sold and the hard cap is reached, graduation happens in one atomic transaction via `graduate_round_to_dlmm`.

1. **The Meteora DLMM Pool:**
   The protocol automatically initializes a permanent Meteora DLMM pool.
2. **Permanent Locked Liquidity:**
   25% of the total raised USDC (e.g. $3,750 on a $15k raise) and the 5,000 reserved shares are deposited into the pool. The liquidity position is locked permanently with `creatorPermanentLockedLiquidityPercentage = 100`. Nobody can pull this liquidity.
3. **Funding the Milestone Escrow:**
   The remaining 75% of USDC (e.g. $11,250) moves directly into the protocol's `MilestoneEscrow` vault.
4. **Upfront Founder Disbursement:**
   The upfront percentage agreed in the manifest (e.g. 20% of the escrow = $2,250) is paid immediately to the founder's corporate wallet for initial operations. The remaining $9,000 stays locked in escrow for milestones.

---

## 2.6 Swapping Receipts for Real Common Shares

Once the company graduates, investors call `unify_impregnated_tokens` to exchange their temporary receipts for real common shares:

1. The smart contract burns the `$VTRN-R0` receipts through an SPL token burn instruction.
2. The contract transfers the real, canonical `$VTRN` common shares 1:1 out of the round escrow into the investor's wallet.
3. There is zero dust and zero mismatch: every burned receipt releases exactly one real share.

---

## 2.7 Milestone Governance, Capital Release, and the Cure Cycle

Passive investors often forget to vote, which can freeze a company's budget. Ventrion solves this with an honest dual-path system:

1. **Path A: The Fast Track (Early Delivery):**
   If the founder finishes a 60-day milestone in just 25 days, they submit proof via `propose_milestone`. If **more than 50% of eligible backer shares vote YES**, the money is paid out immediately without waiting.
2. **Path B: The Regular Track (Deadline Expiry):**
   If the deadline arrives and no early 50% vote happened, a **7-day veto window** opens automatically.
   * If **less than 33.33%** of eligible shares vote to veto: the work is considered accepted, and the milestone funds are released to the founder.
   * If **33.33% or more** of eligible shares veto: the payment is blocked.
3. **The Cure and Resubmission Cycle:**
   What happens when a milestone is vetoed? The payment is blocked, but that does not mean the venture immediately collapses. In the real world, if clients or investors point out defects, the CEO needs the opportunity to fix them.
   The founder can address the feedback and resubmit the deliverable through `amend_milestone`. This resets the vote counters back to zero and starts a fresh 7-day review window (with up to 30 additional days granted if physical rework is required).
   The **33.33% veto threshold strictly applies across every single review cycle**. If backers are satisfied with the improvements and the veto stays below 33.33%, the funds release. If 33.33% or more maintain their veto, the funds remain locked. Up to 3 cure attempts are permitted before the milestone is permanently deemed failed.
4. **Strict Wallet Provenance for Voting:**
   Who is allowed to vote on milestones? **Only the exact wallet that funded that specific round.**
   Secondary market buyers who acquired shares on the Meteora DLMM pool do not have milestone voting rights. Why? Because secondary buyers purchased circulating stock from other market participants; they never put fresh capital into the milestone escrow. Voting rights are strictly bound to the wallet that created the `PrimaryBackerReceipt` PDA during the primary raise.
5. **Zero Founder Voting Power:**
   Shares locked by the founder or held in corporate treasury are completely excluded from the quorum base. The founder can never vote on their own milestones.

---

## 2.8 Cross-Round Protection and the Ragequit Right

### Why Multiple Rounds Break Naive Smart Contracts
Imagine Round 1 sells shares at $0.10, raising $10,000. Later, Round 2 sells shares at $1.00, raising $100,000.
Once unified, all shares in wallets look identical. If Round 2 fails, someone who bought cheap shares in Round 1 could try to claim a refund from Round 2's escrow, stealing money they never deposited.

### The Primary Backer Ledger
Ventrion prevents this with a dedicated on-chain record for every single primary backer:
$$\text{PrimaryBackerReceipt PDA} = \left[\text{b"primary\_backer"}, \text{FundingRound}, \text{InvestorWallet}\right]$$

This ledger records exactly which round you participated in, how much USDC you deposited, and how many shares you received. Only this exact wallet has any claim on that round's escrow.

### When Can You Ragequit? (The Breached Milestone Rule)
Token owners can ragequit at any time on goals that are **already breached or overdue**. But only when they are truly breached.
Specifically, you can ragequit on a milestone if:
1. It is officially `Vetoed` by 33.33% or more of primary backers, or
2. It is marked as `Disputed`, or
3. The target completion deadline has **passed without delivery** (`clock.unix_timestamp > target_completion_date`), or
4. The proposed review window has expired without release.

**Strict Timing Boundary:** You cannot ragequit on future milestones that are still within their valid execution deadline. If Milestone 1 was delivered and paid, and Milestone 2 has passed its deadline without delivery, you can ragequit your pro-rata share of Milestone 2 and all remaining unreleased escrow cash. But you cannot arbitrarily pull money out while a milestone is still actively on schedule.

### The Ragequit Refund
When a breached milestone qualifies for ragequit, the backer calls `ragequit_milestone_escrow`:
1. The contract validates the `PrimaryBackerReceipt` for that specific round and wallet.
2. You return your `$VTRN` shares for that tranche back to the corporate vault.
3. The escrow pays you your pro-rata share of the remaining unreleased USDC in cash, straight into your wallet.
4. Secondary market buyers without a primary backer record cannot touch the escrow.

---

## 2.9 General Shareholder DAO Governance

In addition to milestone escrow releases, a tokenized company requires corporate governance for broader, strategic decisions. Ventrion implements a distinct, dual-governance architecture that separates operational milestone checks from corporate shareholder resolutions.

### The Distinction Between the Two Systems

| Feature | Milestone Escrow Governance | General Shareholder DAO Governance |
| :--- | :--- | :--- |
| **Core Purpose** | Releasing or blocking escrowed USDC tranches | High-level corporate and treasury decisions |
| **Eligible Voters** | **Primary Backers only** (wallet bound via Receipt) | **All Common Shareholders** (including secondary buyers) |
| **Voting Method** | Optimistic 7-day veto (<33.33%) or fast approval (>50%) | Proposal voting with locked escrow ballots |
| **Token Mechanics** | Staked in `InvestorVault`, tracked via bitmasks | Deposited into `GovernanceVotingVault` during vote |
| **Founder Voting** | **Strictly 0 votes** (Founder cannot self-approve) | Proportional to circulating common shares |
| **Execution** | Automatic USDC disbursement to founder treasury | Automated on-chain action or binding legal mandate |

### Proposal Types in Corporate Governance
General shareholder proposals handle three major corporate actions:
1. **Strategic Direction:** Formal advisory votes or binding mandates regarding company pivots, acquisitions, or key executive decisions.
2. **Founder Unlock Request:** The CEO formally requests early release of a portion of their locked shares before the full maturity period has elapsed.
3. **Vault Funding Round:** The CEO proposes opening a new capital raise from unallocated treasury shares held in the `MasterLockVault`.

### Anti-Flash-Loan Escrow Ballots
To prevent malicious actors from borrowing millions in common shares via flash loans to sway a vote and returning the loan in the same slot, Ventrion requires voters to deposit their voting shares into an escrow account:
$$\text{GovernanceVotingVault PDA} = \left[\text{b"gov\_voting\_vault"}, \text{proposal\_pda}\right]$$
Tokens remain locked inside the voting vault until the proposal voting deadline expires. Once the deadline passes, voters call `reclaim_governance_tokens` to withdraw their full deposit back to their personal wallet.

---

## 2.10 Smart Contract Staking and Real Dividends

Why do standard wallets not receive dividends directly? Because if floating tokens earned dividends, an attacker could borrow millions via flash loans right before a snapshot, steal the dividend payout, and return the loan seconds later.

1. **Your Personal Vault:**
   To earn dividends, you deposit your common shares into your personal `InvestorVault` PDA:
   $$\text{InvestorVault PDA} = \left[\text{b"investor\_vault"}, \text{venture\_pda}, \text{investor\_wallet}\right]$$
2. **Rewarding Patient Capital:**
   Investors who commit their shares for longer horizons receive higher multipliers on all dividends:
   * **Flexible (0 days):** 1.0x baseline yield, withdrawable anytime.
   * **30 Days:** 1.2x yield (+20%).
   * **90 Days:** 1.5x yield (+50%).
   * **180 Days:** 1.75x yield (+75%).
   * **365 Days (1 Year):** **2.0x yield (Double dividends per share).**
   * **730 Days (>2 Years):** **3.0x yield (Triple dividends per share).**
3. **Constant Time Accounting in O(1):**
   Whenever a company deposits profits or trading fees are collected, a global accumulator updates using 18-decimal precision. Claiming dividends takes a fixed, tiny amount of compute units whether there are 5 stakers or 500,000 stakers.
4. **Real Revenues:**
   Dividends come from two real cashflow sources: company net operating profits deposited by the founder, plus 1% to 5% dynamic trading fees automatically harvested from the Meteora DLMM pool.

---

## 2.11 Honest Unstaking with Capped Slashing

Locking people's money with zero emergency exit is predatory. Life happens, and investors must always be able to access their capital if they need it.

1. **The 25% Slashing Cap:**
   If you must unstake before your chosen maturity date, you pay a fair, time-decaying penalty capped at a maximum of 25%:
   $$\text{Penalty Percentage} = \left(1 - \frac{T_{\text{passed}}}{T_{\text{target}}}\right) \times 25\%$$
   * Exit on Day 0: 25% penalty.
   * Exit halfway through: 12.5% penalty.
   * Exit on maturity day: 0% penalty.
2. **Immediate Cashout:**
   You immediately receive your remaining 75% to 100% of shares and 100% of all accrued USDC dividends into your wallet.
3. **Loyalty Bonus:**
   The slashed shares are not destroyed or taken by the team. They stay in the vault as a yield boost for the loyal stakers who stayed.

---

## 2.12 Future Growth Rounds

When an enterprise hits its milestones and needs growth capital, the founder initializes Round 1 (Series A) via `create_funding_round`:
* Shares come from unallocated treasury reserves in the `MasterLockVault`.
* New rounds are issued at higher valuations reflecting real company growth.
* Each new round adds another 25% liquidity injection into the Meteora DLMM pool, deepening market liquidity over time.
* Each round has its own independent escrow and backer ledger.

---

## 2.13 The Holding Company Platform Revenue Share

Every time an enterprise distributes net profits, a 0.5% protocol fee is routed to the Tier 1 parent protocol:
```rust
let protocol_fee = gross_amount.checked_mul(50).unwrap().checked_div(10000).unwrap(); // 0.5%
```
This fee is distributed permissionlessly to stakers of the parent Ventrion token ($VTRN), tying platform success directly to the performance of its tokenized businesses.

---

# 3. On-Chain Architecture and Data Layouts

### 3.1 PDA Seed Derivation Matrix

| Account Name | Seeds (Borsh Canonical) | Program Owner | Purpose |
| :--- | :--- | :--- | :--- |
| `GlobalConfig` | `[b"global_config"]` | Ventrion Core | Protocol parameters and emergency pause |
| `VentureState` | `[b"venture", mint_pubkey]` | Ventrion Core | Central company state machine |
| `MasterLockVault` | `[b"master_lock_vault", venture_key]` | SPL Token Program | Custody of all 1,000,000 common shares |
| `FounderLockPosition` | `[b"founder_lock", venture_key]` | Ventrion Core | Founder lock tranches and V-Score record |
| `FundingRound` | `[b"funding_round", venture_key, &[round_index]]` | Ventrion Core | Status and terms for round N |
| `RoundTokenEscrow` | `[b"round_token_escrow", funding_round_key]` | SPL Token Program | Holds shares for 1:1 receipt unification |
| `RoundUsdcEscrow` | `[b"round_usdc_escrow", funding_round_key]` | SPL Token Program | Holds raised USDC prior to escrow transfer |
| `PrimaryBackerReceipt`| `[b"primary_backer", funding_round_key, backer_key]` | Ventrion Core | Immutable primary contribution proof |
| `MilestoneEscrow` | `[b"milestone_escrow", funding_round_key]` | Ventrion Core | Milestone timeline and veto counter |
| `MilestoneUsdcVault`| `[b"milestone_usdc_vault", milestone_escrow_key]`| SPL Token Program | Escrowed milestone USDC funds |
| `InvestorVault` | `[b"investor_vault", venture_key, investor_key]` | Ventrion Core | Staking vault and dividend ledger |
| `DlmmCustody` | `[b"dlmm_custody", venture_key]` | Ventrion Core | Permanent locked LP position custody |
| `GovernanceProposal`| `[b"gov_proposal", venture_key, &proposal_id.to_le_bytes()]` | Ventrion Core | Corporate governance proposals |
| `ProposalBallot` | `[b"gov_ballot", proposal_key, voter_key]` | Ventrion Core | Individual shareholder ballot record |
| `GovernanceVotingVault`| `[b"gov_voting_vault", proposal_key]` | SPL Token Program | Escrow token account for active votes |

---

### 3.2 State Machine Progression

The enterprise progresses through strict on-chain states:
1. `Created`: Genesis initialized, shares vaulted, mint authority revoked.
2. `PrimaryRaiseLive`: Bonding curve open for primary backer deposits.
3. `Graduated`: Hard cap reached, receipts ready for unification.
4. `DLMMSecondaryLive`: Meteora pool live, permanent liquidity locked, milestones active.
5. `Matured`: All milestone tranches disbursed, company operating on ongoing profit dividends.
6. `Failed`: Round expired under cap or milestone disputed, ragequit refunds enabled.

---

### 3.3 Dual Voting Data Structures and Storage Layouts

Ventrion avoids dynamic Solana account reallocation and unbounded heap allocations. By employing fixed-size byte layouts, bitmasks, and lazy epoch invalidation, transactions consume under 20,000 Compute Units, well below Solana's 200,000 CU limit.

#### 1. Milestone Escrow Account Structure (`MilestoneEscrow`)
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum MilestoneStatus {
    #[default]
    Pending = 0,
    Proposed = 1,
    Approved = 2,
    Released = 3,
    Vetoed = 4,
    Disputed = 5,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct MilestoneItem {
    pub id: u8,                             // 1 byte: Milestone index (0..9)
    pub percentage_bps: u16,                // 2 bytes: Percentage of escrow (e.g. 2500 = 25%)
    pub amount_usdc: u64,                   // 8 bytes: USDC allocated to this tranche
    pub target_completion_date: i64,        // 8 bytes: Target unix timestamp
    pub proposed_at: i64,                   // 8 bytes: Timestamp when founder submitted proof
    pub veto_deadline: i64,                 // 8 bytes: proposed_at + 7 days
    pub votes_for: u64,                     // 8 bytes: Primary backer votes approving release
    pub votes_against: u64,                 // 8 bytes: Primary backer votes vetoing release
    pub status: MilestoneStatus,            // 1 byte: Current status enum
    pub amendment_count: u8,                // 1 byte: Cure cycle counter (0..3)
    pub _reserved: [u8; 6],                 // 6 bytes: Memory alignment padding
}

#[account]
#[derive(Default)]
pub struct MilestoneEscrow {
    pub venture: Pubkey,                    // 32 bytes: Parent VentureState
    pub funding_round: Pubkey,              // 32 bytes: Specific FundingRound PDA
    pub escrow_usdc_vault: Pubkey,          // 32 bytes: Vault holding escrowed USDC
    pub total_allocated_usdc: u64,          // 8 bytes: Initial escrow allocation
    pub total_released_usdc: u64,           // 8 bytes: Cumulative disbursed to treasury
    pub total_ragequit_usdc: u64,           // 8 bytes: Cumulative refunded via ragequit
    pub primary_tokens_quorum_base: u64,    // 8 bytes: Total shares sold initially in round
    pub primary_tokens_remaining: u64,      // 8 bytes: Active shares remaining (decrements on ragequit)
    pub current_milestone_index: u8,        // 1 byte: Active milestone index
    pub milestones_count: u8,               // 1 byte: Number of milestones (1..10)
    pub milestones: [MilestoneItem; 10],    // 590 bytes: Fixed array of 10 milestone items
    pub bump: u8,                           // 1 byte: PDA bump
    pub _reserved: [u8; 23],                // 23 bytes: Future upgrade padding
}
```

#### 2. Investor Staking and Governance Vault (`InvestorVault`)
```rust
#[account]
pub struct InvestorVault {
    pub venture: Pubkey,                    // 32 bytes: Parent VentureState
    pub investor: Pubkey,                   // 32 bytes: Investor wallet / owner
    pub staked_amount: u64,                 // 8 bytes: Staked common shares
    pub lock_start_timestamp: i64,          // 8 bytes: Deposit initialization timestamp
    pub lock_end_timestamp: i64,            // 8 bytes: Lock maturity timestamp
    pub lock_duration_seconds: i64,         // 8 bytes: Lock duration commitment
    pub multiplier_bps: u16,                // 2 bytes: Dividend multiplier (10,000 to 30,000)
    pub effective_weight: u128,             // 16 bytes: staked_amount * multiplier_bps
    pub last_acc_dividend_weight: u128,     // 16 bytes: O(1) dividend checkpoint
    pub total_claimed_usdc: u64,            // 8 bytes: Cumulative claimed dividends
    pub is_active: bool,                    // 1 byte: Active status flag
    pub bump: u8,                           // 1 byte: PDA bump
    pub milestone_vote_mask: u16,           // 2 bytes: Bitmask for approval votes (bits 0..9)
    pub milestone_veto_mask: u16,           // 2 bytes: Bitmask for veto votes (bits 0..9)
    pub milestone_ragequit_mask: u16,       // 2 bytes: Bitmask for ragequit exits (bits 0..9)
    pub last_voted_round_index: u8,         // 1 byte: Context round index
    pub amendment_seen: [u8; 10],           // 10 bytes: Lazy amendment revision tracking
    pub _reserved: [u8; 13],                // 13 bytes: Future upgrade padding
}
```

#### 3. How Lazy Amendment Invalidation Works in O(1)
When a milestone is vetoed and the founder calls `amend_milestone`, looping over hundreds of investor vaults to clear their vote flags would immediately exceed Solana's transaction size and compute budget.
Instead, Ventrion uses a constant-time, lazy-invalidation pattern:
1. `milestone.amendment_count` is incremented on the `MilestoneEscrow` account.
2. When an investor calls `vote_milestone` during the new review window, the program compares:
   ```rust
   if milestone.amendment_count > vault.amendment_seen[milestone_id as usize] {
       vault.amendment_seen[milestone_id as usize] = milestone.amendment_count;
       vault.milestone_vote_mask &= !(1u16 << milestone_id);
       vault.milestone_veto_mask &= !(1u16 << milestone_id);
   }
   ```
3. The investor's vote bits are lazily cleared in $O(1)$ time within their own transaction, costing zero global loops.

#### 4. Corporate Governance Account Structure (`GovernanceProposal`)
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum ProposalType {
    #[default]
    StrategicDirection = 0,
    FounderUnlockRequest = 1,
    VaultFundingRound = 2,
}

#[account]
pub struct GovernanceProposal {
    pub venture: Pubkey,                    // 32 bytes: Parent VentureState
    pub proposer_ceo: Pubkey,               // 32 bytes: Proposer wallet
    pub proposal_type: ProposalType,        // 1 byte: Proposal category
    pub target_tranche_mint: Pubkey,        // 32 bytes: Target mint (or default for all shares)
    pub proposal_id: u64,                   // 8 bytes: Sequential proposal ID
    pub requested_amount: u64,              // 8 bytes: Shares requested to unlock or sell
    pub target_cap_usdc: u64,               // 8 bytes: If new round, target USDC cap
    pub price_per_token_usdc: u64,          // 8 bytes: If new round, price per share
    pub voting_deadline: i64,               // 8 bytes: Timestamp deadline
    pub yes_votes: u64,                     // 8 bytes: Tally of YES votes
    pub no_votes: u64,                      // 8 bytes: Tally of NO votes
    pub quorum_required: u64,               // 8 bytes: Minimum votes required for validity
    pub status: ProposalStatus,             // 1 byte: Active, Passed, Rejected, Executed
    pub bump: u8,                           // 1 byte: PDA bump
    pub description_hash: [u8; 32],         // 32 bytes: IPFS multihash of proposal text
    pub _reserved: [u8; 32],                // 32 bytes: Future upgrades
}
```

---

### 3.4 Constant Time Accounting Data Structures

#### `VentureState` (416 Bytes)
```rust
#[account]
pub struct VentureState {
    pub global_config: Pubkey,
    pub founder: Pubkey,
    pub treasury_wallet: Pubkey,
    pub venture_token_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub master_lock_vault: Pubkey,
    pub local_dividend_vault: Pubkey,
    pub dlmm_custody: Pubkey,
    pub meteora_dlmm_lb_pair: Pubkey,
    pub total_supply: u64,                  // Always 1,000,000 * 10^6
    pub circulating_public_float: u64,
    pub total_locked_in_vault: u64,
    pub unlocked_treasury_tokens: u64,
    pub founder_locked_tokens: u64,
    pub total_dividend_weight_units: u128,  // Sum of (Shares * Multiplier)
    pub acc_dividend_per_weight_unit: u128, // 10^18 scaling
    pub total_dividends_distributed: u64,
    pub current_round_index: u8,
    pub dlmm_pool_initialized: bool,
    pub bump: u8,
    pub ceo_fee_bps: u16,
    pub protocol_fee_bps: u16,
    pub founder_v_score_bps: u16,
    pub status: VentureStatus,
    pub _reserved: [u8; 30],
}
```

---

# 4. Mathematical Formulas and Invariants

### 4.1 Supply Conservation Invariant
At every slot, total shares must balance to an exact zero sum:
$$\text{MasterLockVault} + \sum \text{Escrows} + \sum \text{InvestorVaults} + \text{CirculatingFloat} \equiv 1,000,000 \times 10^6$$

### 4.2 The 75/25 Sale and Liquidity Split
$$\text{Tokens For Sale} = \frac{\text{Allocated} \times 10,000}{10,000 + 2,500} = 0.75 \times \text{Allocated}$$
$$\text{Tokens For DLMM Seed} = 0.25 \times \text{Allocated}$$
$$\text{Target Cap USDC} = \frac{\text{Tokens For Sale} \times \text{Price Per Share}}{10^6}$$

### 4.3 V-Score and Pool Drain Protection Formula
$$V_{\text{final}} = \min\left(10,000, \, \left\lfloor V_{\text{commitment}} \times M_{\text{pool\_safety}} \times 10,000 \right\rfloor \right)$$

Where:
$$V_{\text{commitment}} = \sum_{i=1}^{N} \left( \frac{\min(T_i, 1095)}{1095} \times \frac{S_i}{1,000,000} \right)$$
$$M_{\text{pool\_safety}} = \frac{S_{\text{raised}}}{1,000,000 - S_{\text{locked}}} = \frac{S_{\text{raised}}}{S_{\text{raised}} + S_{\text{unlocked}}}$$
$$\text{Drain Exposure Ratio} = \frac{S_{\text{unlocked}}}{S_{\text{raised}}}$$

#### V-Score Rating Matrix

| Founder Lock ($S_{\text{locked}}$) | Lock Horizon | Round Raise ($S_{\text{raised}}$) | Unlocked Treasury ($S_{\text{unlocked}}$) | Pool Safety ($M$) | V-Score | Rating Tier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **990,000 (99%)** | 3 Years (1095d) | 10,000 (1%) | 0 (0%) | **1.0000** | **9,900 bps** | **AAA+ Prime** |
| **950,000 (95%)** | 3 Years (1095d) | 20,000 (2%) | 30,000 (3%) | **0.4000** | **3,800 bps** | **A Investment Grade** |
| **900,000 (90%)** | 3 Years (1095d) | 10,000 (1%) | 90,000 (9%) | **0.1000** | **900 bps** | **Junk (High Drain Risk)** |
| **800,000 (80%)** | 1 Year (365d) | 50,000 (5%) | 150,000 (15%) | **0.2500** | **666 bps** | **High Risk** |
| **0 (0%)** | None | 50,000 (5%) | 950,000 (95%) | **0.0500** | **0 bps** | **Unrated / Danger** |

### 4.4 Scaled Dividend Checkpointing in Constant Time
When new USDC dividends are deposited:
$$\Delta \text{acc} = \left\lfloor \frac{\text{Net USDC} \times 10^{18}}{\sum_{j} (S_j \times \mu_j)} \right\rfloor$$
$$\text{Claimable USDC}_i = \left\lfloor \frac{(S_i \times \mu_i) \times (\text{acc}_{\text{global}} - \text{acc}_{\text{last}, i})}{10^{18}} \right\rfloor$$

### 4.5 Linear Slashing Formula
$$P_{\text{slashing}} = \left(1 - \frac{\min(T_{\text{passed}}, T_{\text{target}})}{T_{\text{target}}}\right) \times 2,500 \text{ bps}$$
$$S_{\text{slashed}} = \left\lfloor \frac{S_{\text{staked}} \times P_{\text{slashing}}}{10,000} \right\rfloor$$
$$S_{\text{returned}} = S_{\text{staked}} - S_{\text{slashed}} \quad (\ge 75\%)$$

### 4.6 Milestone Pro-Rata Ragequit Settlement Formula
When a milestone is eligible for ragequit, the backer surrenders their proportional shares for that milestone and receives cash:
$$S_{\text{surrender}} = \left\lfloor \frac{S_{\text{staked}} \times \text{percentage\_bps}}{10,000} \right\rfloor$$
$$U_{\text{refund}} = \left\lfloor \frac{S_{\text{surrender}} \times \text{total\_allocated\_usdc}}{\text{primary\_tokens\_quorum\_base}} \right\rfloor$$

All surrendered shares return to `unlocked_treasury_tokens` in the company vault, preserving the global supply invariant.

### 4.7 Primary Backer Eligible Weight Invariant
To ensure secondary market buyers cannot game the escrow or vote on rounds they did not fund, voting and ragequit weight is strictly capped by primary contribution history:
$$W_{\text{eligible}} = \min\left( S_{\text{primary\_receipt}}, \, S_{\text{vault\_staked}} \right)$$

If an investor sells a portion of their unified shares on the Meteora DLMM pool, their eligible weight drops accordingly. If they buy additional shares on the secondary market, those secondary shares cannot be used to vote on or ragequit previous primary escrows.

---

# 5. Security and Error Reference

### 5.1 Defending Against Practical Exploits
* **Flash Loan Attacks:** Unstaked shares in market circulation receive zero dividends. Only shares locked in `InvestorVault` earn yield. DAO voting requires locking shares in `GovernanceVotingVault` for the duration of the proposal.
* **Frontrunning and Sandwich Bots:** The Meteora flat curve eliminates intraday price slippage, removing the profit incentive for MEV bots.
* **Sybil Attacks:** Staking weight and voting rights scale linearly with deposited common shares. Splitting tokens across multiple wallets provides zero advantage.
* **Treasury Dumps:** Unallocated treasury shares in `MasterLockVault` cannot be withdrawn directly to market. They can only be issued through new funding rounds with fresh milestones and liquidity seeding.
* **Secondary Market Escrow Plunder:** Calling `ragequit_milestone_escrow` requires a valid `PrimaryBackerReceipt` PDA for that specific funding round. Wallets without a primary deposit record cannot interact with the milestone escrow.
* **Endless Milestone Amendment Griefing:** A founder cannot keep an unfulfilled milestone in an endless loop of amendments. The protocol enforces a hard cap of 3 amendments (`amendment_count < 3`). Upon the third rejection, the milestone fails permanently and opens for unconditional ragequit refunds.

### 5.2 Program Error Codes

| Error Code | Identifier | Trigger Condition |
| :--- | :--- | :--- |
| **6000** | `InvalidUsdcMint` | Quote currency is not canonical USDC |
| **6002** | `LockDurationTooShort` | Lock commitment is less than 1 day |
| **6003** | `FounderLockNotExpired` | Attempted early unlock of founder shares |
| **6009** | `RoundNotActive` | Depositing into an inactive or closed round |
| **6011** | `RoundNotEligibleForRefund` | Ragequit attempted before milestone failure |
| **6019** | `NoTokensToSweep` | Attempted duplicate treasury sweep |
| **6025** | `MilestoneRequirementsNotMet`| Releasing funds before milestone approval or expiry |
| **6028** | `NoDividendsOwed` | Claim attempted with zero accrued yield |
| **6030** | `Unauthorized` | Caller lacks authority for this instruction |
| **6035** | `InvalidTrancheMint` | Receipt token does not match active round mint |
| **6042** | `MilestoneAlreadyRagequitted` | Attempted duplicate ragequit on the same milestone |
| **6045** | `MilestoneNotEligibleForRagequit` | Ragequit attempted on a healthy, on-schedule milestone |
| **6048** | `ProposalNotActive` | Voting on an expired or executed governance proposal |

---

# 6. Repository Structure and Release Roadmap

### 6.1 Clean GitHub Architecture
The Ventrion codebase is organized into modular packages to ensure separation of concerns:

```
ventrion/
├── anchor/
│   ├── programs/
│   │   └── ventrion_core/          # Core smart contracts (Tier 1 & Tier 2)
│   │       ├── src/
│   │       │   ├── instructions/   # Transaction instruction handlers
│   │       │   ├── state/          # Account structs and memory layouts
│   │       │   ├── utils/          # Math, CPI helpers, and token utilities
│   │       │   ├── constants.rs    # Canonical seeds, thresholds, and limits
│   │       │   └── errors.rs       # Comprehensive protocol error definitions
│   ├── tests/                      # Local integration and security test suites
│   └── scripts/                    # Devnet verification and deployment scripts
├── sdk/
│   ├── src/                        # TypeScript SDK (@ventrion/sdk)
│   └── tests/                      # SDK integration tests
├── Documentation/
│   ├── VENTRION_MAIN_MANIFEST.md   # The protocol Single Source of Truth (SSOT)
│   └── architecture/               # Technical specs and security audit reports
└── app/                            # Ventrion Founder & Investor Web Interface
```

### 6.2 Strict Verification Boundary
To protect protocol integrity and maintain institutional quality:
* **No Unverified Code on Main:** Code is never pushed to the primary GitHub branch until it has passed 100% of local unit tests, integration test suites, and cryptographic invariant verifications.
* **Deterministic Verification:** Every state transition (bonding curve graduation, 1:1 receipt unification, O(1) dividend distribution, and linear slashing) is verified via end-to-end simulation scripts prior to production tag releases.
* **Manifest as SSOT:** In any discrepancy between documentation and code, this Manifesto serves as the authoritative specification.

---

### 6.3 Developer Guide and TypeScript SDK

The `@ventrion/sdk` provides a clean, typed interface to interact with all on-chain programs:

```typescript
export interface LaunchVentureParams {
  name: string;
  symbol: string;
  manifest: {
    targetCapUsdc: number;
    upfrontUsdc: number;
    milestones: Array<{
      percentageBps: number;
      targetDays: number;
      deliverableHash: string;
    }>;
  };
  founderLockBps: number;
  lockDurationDays: number;
}
```

---

### 6.4 Complete End-to-End Code Example

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { VentrionClient } from "@ventrion/sdk";

// 1. Setup Connection and Founder Client
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const client = new VentrionClient(connection, founderKeypair);

// 2. Launch Enterprise (Genesis, Manifest, and 90% Founder Lock for 3 Years)
const { venturePda, tokenMint } = await client.launchVenture({
  name: "CleanEnergy Grid AG",
  symbol: "CENX",
  manifest: {
    targetCapUsdc: 25_000,
    upfrontUsdc: 5_000,
    milestones: [
      { percentageBps: 5000, targetDays: 90, deliverableHash: "prototype_v1" },
      { percentageBps: 5000, targetDays: 180, deliverableHash: "tuv_certification" },
    ],
  },
  founderLockBps: 9000,   // 900,000 shares locked
  lockDurationDays: 1095, // 3-year commitment (AAA rating)
});

// 3. Primary Backer Buys on the Meteora Flat Curve
const investorClient = new VentrionClient(connection, investorKeypair);
await investorClient.buyPrimaryTokens({
  venturePda,
  amountUsdc: 5_000,
});

// 4. Atomically Graduate to Meteora DLMM Once Cap is Hit
await client.graduateRound({ venturePda });

// 5. Unify Tranche Receipts for Real Common Shares
await investorClient.unifyReceipts({ venturePda });

// 6. Stake Shares in Personal Vault for 1 Year (2.0x Yield Multiplier)
await investorClient.stakeShares({
  venturePda,
  amountShares: 5_000,
  durationDays: 365,
});

// 7. Claim Accrued Dividends Anytime in O(1)
await investorClient.claimDividends({ venturePda });
```

---
*Ventrion Protocol ($VTRN): The Sovereign Decentralized Equity Operating System on Solana.*
