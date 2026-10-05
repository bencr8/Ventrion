"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../../components/common/Navbar";
import {
  VENTRION_PROGRAM_ID,
  DEVNET_VENT_MINT,
  DEVNET_USDC_MINT,
  PILOT_VENTURE_1_PVENT_MINT,
  PILOT_VENTURE_2_QCMP_MINT,
  QCMP_METAPLEX_METADATA_PDA,
  QCMP_METEORA_DLMM_POOL,
} from "../../lib/solana/ventrionProgram";

interface SectionItem {
  id: string;
  num: string;
  title: string;
}

const SECTIONS: SectionItem[] = [
  { id: "chapter-01", num: "01", title: "Flat Curve Doctrine & Sovereign Share Architecture" },
  { id: "chapter-02", num: "02", title: "17.0% Meteora DLMM Liquidity Invariant" },
  { id: "chapter-03", num: "03", title: "Constant-Time O(1) Yield Math & Staking" },
  { id: "chapter-04", num: "04", title: "Tranche-Specific Escrow & Dual-Path Governance" },
  { id: "chapter-05", num: "05", title: "Institutional Architecture & Devnet Ledger" },
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>("chapter-01");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#111113] flex flex-col justify-between selection:bg-[#FF5C18]/20 font-jakarta">
      <Navbar activeTab="documentation" />

      {/* EDITORIAL WHITEPAPER CONTAINER */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 sm:px-10 py-12 sm:py-20">
        
        {/* Header */}
        <div className="mb-14 pb-8 border-b border-black/[0.06]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111113] leading-tight">
            Ventrion Architecture Specification
          </h1>
          <p className="mt-3 text-base text-[#6E6964] leading-relaxed max-w-2xl">
            Mathematical proofs, program derived addresses, tranche-governed escrows, and verified Devnet ledger deployments grounded in the Ventrion Main Manifest.
          </p>
        </div>

        {/* 2-Column Swiss Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: INDEX SIDEBAR (4 Cols) */}
          <aside className="lg:col-span-4 sticky top-24 hidden lg:block space-y-8 select-none">
            <div className="border-l border-black/[0.08] pl-2 space-y-1">
              <nav className="space-y-2">
                {SECTIONS.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className={`block py-2 text-xs leading-relaxed transition-all ${
                        isActive
                          ? "border-l-2 border-[#111113] pl-3 -ml-[9px] text-[#111113] font-bold"
                          : "pl-3 text-[#6E6964] hover:text-[#111113] font-medium"
                      }`}
                    >
                      <span className="font-mono text-[#8E8B88] mr-2">{sec.num}</span>
                      <span>{sec.title}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Program Quick Copy */}
            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-black/[0.06] font-mono text-xs space-y-2">
              <div className="text-[11px] break-all text-[#111113]">
                {VENTRION_PROGRAM_ID.toBase58()}
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-black/[0.04]">
                <button
                  onClick={() => handleCopy(VENTRION_PROGRAM_ID.toBase58(), "prog-id")}
                  className="text-[#FF5C18] hover:underline cursor-pointer"
                >
                  {copiedKey === "prog-id" ? "Copied" : "Copy Program ID"}
                </button>
                <a
                  href={`https://explorer.solana.com/address/${VENTRION_PROGRAM_ID.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8E8B88] hover:text-[#111113]"
                >
                  Explorer
                </a>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: WHITEPAPER DOCUMENT (8 Cols, max-w-[820px]) */}
          <div className="lg:col-span-8 max-w-[820px] space-y-16">

            {/* 01 */}
            <section id="chapter-01" className="scroll-mt-28 space-y-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#8E8B88]">01</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
                  Flat Curve Doctrine &amp; Sovereign Share Architecture
                </h2>
              </div>

              <div className="text-[#6E6964] text-sm leading-relaxed space-y-4">
                <p>
                  Standard bonding curves are predatory instruments. Automated MEV sniper bots acquire majority token supply within millisecond zero and dump on organic community participants. Concurrently, 100% of collected capital drains uncontrolled into founder wallets, typically in volatile SOL without milestone roadmaps or fiduciary safeguards.
                </p>

                <div className="border-l-2 border-[#111113] bg-[#F9F8F6] p-4 font-mono text-xs text-[#111113] leading-relaxed">
                  Every enterprise issued on Ventrion possesses exactly 1,000,000 common shares. The SPL token mint authority is irrevocably destroyed at genesis. Subsequent dilution is mathematically impossible.
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-[#111113]">
                      Linear Flat Pricing &amp; Round Receipt Tokens ($VENT-RN)
                    </div>
                    <p>
                      Primary funding rounds execute on Meteora Dynamic Bonding Curves (DBC) with flat pricing. Early and late contributors pay identical prices per share. Contributors hold round-specific escrow receipt tokens ($VENT-RN) that convert 1:1 into canonical common shares upon round completion.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-[#111113]">
                      Full Two-Way Curve Liquidity
                    </div>
                    <p>
                      While a primary raise is active, contributors can sell receipt tokens back to the bonding curve at any time without slippage. No forced lock-in exists prior to reaching target capital.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-[#111113]">
                      Canonical USDC &amp; Decentralized Verification Gate
                    </div>
                    <p>
                      All raises, escrows, fees, and dividends denominate exclusively in canonical USDC, eliminating cryptocurrency volatility for operational budgets. Prior to activation, stakers of the Mother Token ($VENT) evaluate the MIDAO DAO LLC structure and milestone roadmap, requiring an absolute majority (&gt;50%) to approve launch.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 02 */}
            <section id="chapter-02" className="scroll-mt-28 space-y-5 pt-8 border-t border-black/[0.06]">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#8E8B88]">02</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
                  17.0% Meteora DLMM Liquidity Invariant
                </h2>
              </div>

              <div className="text-[#6E6964] text-sm leading-relaxed space-y-4">
                <p>
                  Upon reaching target funding and securing staker approval, the protocol initiates atomic graduation (<code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">execute_atomic_graduation</code>) in a single permissionless Solana transaction.
                </p>

                <div className="border-l-2 border-[#111113] bg-[#F9F8F6] p-4 font-mono text-xs text-[#111113] leading-relaxed">
                  Exactly 17.0% of raised USDC and exactly 170,000 common shares (17.0%) are permanently deposited into the Meteora DLMM Pool (LB-Pair).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                    <div className="text-base font-bold text-[#111113]">17.0% DLMM Liquidity</div>
                    <div className="text-[#8E8B88] mt-1">170,000 shares + 17% USDC locked irrevocably in DlmmCustody PDA.</div>
                  </div>
                  <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                    <div className="text-base font-bold text-[#111113]">max($3,000, 3%) Fee</div>
                    <div className="text-[#8E8B88] mt-1">MIDAO DAO LLC incorporation, filing fees, and registered agent.</div>
                  </div>
                  <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                    <div className="text-base font-bold text-[#111113]">10% – 25% Runway</div>
                    <div className="text-[#8E8B88] mt-1">Immediate upfront working capital transferred to OpCo treasury.</div>
                  </div>
                  <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                    <div className="text-base font-bold text-[#111113]">60% – 73% Escrow</div>
                    <div className="text-[#8E8B88] mt-1">Safely locked in tranche-governed MilestoneEscrow.</div>
                  </div>
                </div>

                <p>
                  The resulting Meteora LP position account (LP Position NFT) is held permanently in the program account <code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">DlmmCustody</code>. Liquidity can never be extracted or rugged.
                </p>

                <p>
                  100% of dynamic trading fees generated across Meteora bins (0.15% to 2.0%) stream directly to shareholders in the staking pool (<code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">InvestorVault</code>).
                </p>
              </div>
            </section>

            {/* 03 */}
            <section id="chapter-03" className="scroll-mt-28 space-y-5 pt-8 border-t border-black/[0.06]">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#8E8B88]">03</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
                  Constant-Time O(1) Yield Math &amp; Staking
                </h2>
              </div>

              <div className="text-[#6E6964] text-sm leading-relaxed space-y-4">
                <p>
                  Conventional smart contract dividend distribution requires unbounded loops across shareholder accounts, inevitably precipitating compute-unit exhaustion. Ventrion implements a zero-loop architecture executing in constant O(1) time via scaled global dividend points (<code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">total_dividend_points</code>) with 10¹² scaling in 256-bit unsigned math. Claim footprint: ~8,380 Compute Units (95.8% headroom below the 200,000 CU limit).
                </p>

                {/* Clean Centered Formulas */}
                <div className="space-y-3 py-2 font-mono text-xs text-[#111113]">
                  <div className="p-4 bg-white border border-black/[0.06] rounded-xl text-center overflow-x-auto">
                    ΔAcc = floor( (USDC_inflow × 10¹² × 10,000) / Σ W_j )
                    <br />
                    Acc_global ← Acc_global + ΔAcc
                  </div>

                  <div className="p-4 bg-white border border-black/[0.06] rounded-xl text-center overflow-x-auto">
                    Claimable_USDC_i = floor( (W_i × (Acc_global - Acc_user,i)) / (10¹² × 10,000) )
                    <br />
                    Acc_user,i ← Acc_global
                  </div>
                </div>

                {/* Staking Multipliers */}
                <div className="pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
                    <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                      <div className="text-base font-bold text-[#111113]">1.0x</div>
                      <div className="text-[#8E8B88] mt-0.5">0 Days (Liquid)</div>
                    </div>
                    <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                      <div className="text-base font-bold text-[#111113]">1.25x</div>
                      <div className="text-[#8E8B88] mt-0.5">90 Days</div>
                    </div>
                    <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                      <div className="text-base font-bold text-[#111113]">1.50x</div>
                      <div className="text-[#8E8B88] mt-0.5">180 Days</div>
                    </div>
                    <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                      <div className="text-base font-bold text-[#111113]">2.00x</div>
                      <div className="text-[#8E8B88] mt-0.5">365 Days</div>
                    </div>
                    <div className="p-3 bg-white border border-black/[0.06] rounded-xl">
                      <div className="text-base font-bold text-[#FF5C18]">3.00x</div>
                      <div className="text-[#FF5C18] mt-0.5">730 Days</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 04 */}
            <section id="chapter-04" className="scroll-mt-28 space-y-5 pt-8 border-t border-black/[0.06]">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#8E8B88]">04</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
                  Tranche-Specific Escrow &amp; Dual-Path Governance
                </h2>
              </div>

              <div className="text-[#6E6964] text-sm leading-relaxed space-y-4">
                <p>
                  Capital remains secured in the on-chain <code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">MilestoneEscrow</code> and releases sequentially across 1 to 10 milestone tranches upon verified deliverables. Voting and veto rights belong strictly to wallets possessing primary receipt tokens (<code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">PrimaryBackerReceipt</code>) of that specific round. Secondary DEX purchasers and locked founder shares hold zero escrow votes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-xs">
                  <div className="p-4 bg-white border border-black/[0.06] rounded-xl space-y-1">
                    <div className="font-bold text-[#111113]">Path A: Fast Track (&gt;50.00% YES)</div>
                    <p className="text-[#6E6964] leading-relaxed">
                      If more than 50.00% of eligible primary backer shares vote approval, the tranche releases immediately to company treasury without delay.
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-black/[0.06] rounded-xl space-y-1">
                    <div className="font-bold text-[#111113]">Path B: 7-Day Window (≤33.33% Veto)</div>
                    <p className="text-[#6E6964] leading-relaxed">
                      Lacking a fast-track majority, a 7-day review window applies. If the veto quota remains ≤33.33%, funds unlock automatically against voter apathy.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="font-mono text-xs font-bold text-[#111113]">
                    Cure Cycle, Ragequit &amp; Hostile Takeover Immunity
                  </div>
                  <p>
                    If vetoed, the founder has up to 3 revision cycles (<code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">amend_milestone</code>) to rectify deliverables. If a milestone permanently fails across 3 attempts, primary backers invoke <code className="font-mono text-xs bg-black/[0.04] px-1 py-0.5 text-[#111113]">ragequit_milestone_escrow</code> for a 100% pro-rata refund of unspent escrow capital. Secondary token accumulation on open DEXs carries no authority to liquidate the physical company or terminate management.
                  </p>
                </div>
              </div>
            </section>

            {/* 05 */}
            <section id="chapter-05" className="scroll-mt-28 space-y-5 pt-8 border-t border-black/[0.06]">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#8E8B88]">05</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
                  Institutional Architecture &amp; Devnet Ledger
                </h2>
              </div>

              <div className="text-[#6E6964] text-sm leading-relaxed space-y-4">
                <p>
                  Every venture is incorporated as a legal MIDAO DAO LLC (Marshall Islands) with a binding Operating Agreement. European operating companies route ecosystem performance fees (2.5% GMV via Solana Pay) through the Swiss Association (Zug, Art. 60 ff. ZGB): 100% tax-deductible marketing expense (SKR03: 4600 / §13b UStG Reverse Charge), 0% §50a EStG withholding tax, and compliant with German §160 AO and §9 StAbwG.
                </p>

                {/* Account Memory Layout Matrix */}
                <div className="pt-2">
                  <div className="w-full bg-white border border-black/[0.06] rounded-xl overflow-hidden font-mono text-xs divide-y divide-black/[0.04]">
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#FF5C18]">GlobalConfig</span>
                      <span className="text-[#8E8B88]">[b&quot;global_config&quot;]</span>
                      <span className="font-bold">120 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">VentureState</span>
                      <span className="text-[#8E8B88]">[b&quot;venture&quot;, mint]</span>
                      <span className="font-bold">368 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">FundingRound</span>
                      <span className="text-[#8E8B88]">[b&quot;funding_round&quot;, venture, &[round]]</span>
                      <span className="font-bold">184 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">MilestoneEscrow</span>
                      <span className="text-[#8E8B88]">[b&quot;milestone_escrow&quot;, round]</span>
                      <span className="font-bold">808 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">InvestorVault</span>
                      <span className="text-[#8E8B88]">[b&quot;investor_vault&quot;, venture, user]</span>
                      <span className="font-bold">184 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">FounderVesting</span>
                      <span className="text-[#8E8B88]">[b&quot;founder_vesting&quot;, venture, founder]</span>
                      <span className="font-bold">168 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">RoundInvestorRecord</span>
                      <span className="text-[#8E8B88]">[b&quot;investor_record&quot;, round, user]</span>
                      <span className="font-bold">96 Bytes</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[#111113]">DlmmCustody</span>
                      <span className="text-[#8E8B88]">[b&quot;dlmm_custody&quot;, venture]</span>
                      <span className="font-bold">SPL Token Account</span>
                    </div>
                  </div>
                </div>

                {/* Devnet Constants */}
                <div className="pt-3 space-y-2 font-mono text-xs">
                  {[
                    { name: "Program ID", value: VENTRION_PROGRAM_ID.toBase58() },
                    { name: "Mother Token ($VENT)", value: DEVNET_VENT_MINT.toBase58() },
                    { name: "Canonical USDC", value: DEVNET_USDC_MINT.toBase58() },
                    { name: "Pilot 2 ($QCMP)", value: PILOT_VENTURE_2_QCMP_MINT.toBase58() },
                    { name: "Meteora DLMM Pool ($QCMP/USDC)", value: QCMP_METEORA_DLMM_POOL.toBase58() },
                    { name: "Pilot 1 ($PVENT)", value: PILOT_VENTURE_1_PVENT_MINT.toBase58() },
                    { name: "QCMP Metaplex Metadata", value: QCMP_METAPLEX_METADATA_PDA.toBase58() },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-black/[0.06] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="font-bold text-[#111113]">{item.name}</div>
                        <div className="text-[11px] text-[#FF5C18] truncate mt-0.5 select-all">
                          {item.value}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] shrink-0">
                        <button
                          onClick={() => handleCopy(item.value, `const-${idx}`)}
                          className="text-[#6E6964] hover:text-[#111113] cursor-pointer"
                        >
                          {copiedKey === `const-${idx}` ? "Copied" : "Copy"}
                        </button>
                        <a
                          href={`https://explorer.solana.com/address/${item.value}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8E8B88] hover:text-[#111113]"
                        >
                          Explorer
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

          </div>
        </div>
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 py-6 flex items-center justify-between text-xs text-[#8E8B88] font-mono border-t border-black/[0.06] select-none">
        <span>Ventrion Protocol</span>
        <div className="flex items-center gap-6">
          <Link href="/ventures" className="hover:text-black">Ventures</Link>
          <Link href="/documentation" className="hover:text-black">Documentation</Link>
        </div>
      </footer>
    </div>
  );
}
