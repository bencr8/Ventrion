"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Layers, Lock, ShieldCheck, ArrowRight, Zap, Check, AlertTriangle, Sparkles } from "lucide-react";

export function Phase06ReraiseCard() {
  const [activeTab, setActiveTab] = useState<"funding" | "staking">("funding");
  const [selectedRound, setSelectedRound] = useState<"seed" | "seriesA">("seriesA");
  const [lockDurationIndex, setLockDurationIndex] = useState<number>(4); // Default: 365 Days (2.0x)

  const lockTiers = [
    { label: "Flexible Staker", days: "0 Days", multiplier: 1.0, payout: 100, desc: "Staked in your smart-contract InvestorVault PDA with zero lockup. Free to unstake anytime with 0% penalty." },
    { label: "14-Day Supporter", days: "14 Days", multiplier: 1.1, payout: 110, desc: "Commit for 2 weeks in InvestorVault. Earn 1.1x baseline dividend share (+10% boost) from corporate cashflows." },
    { label: "Quarterly Believer", days: "90 Days", multiplier: 1.25, payout: 125, desc: "Commit for 3 months in InvestorVault. Earn 1.25x dividend share (+25% boost) from all company revenues." },
    { label: "Half-Year Partner", days: "180 Days", multiplier: 1.5, payout: 150, desc: "Lock for 6 months. Earn 1.5x higher dividend share (+50% boost) from company dividends." },
    { label: "Conviction Partner", days: "365 Days (1 Yr)", multiplier: 2.0, payout: 200, desc: "Maximum long-term alignment. Capture 2.0x dividend yield (+100% boost). Early-exit slashing redistributes to loyal stakers." },
  ];

  const currentTier = lockTiers[lockDurationIndex];

  return (
    <div className="w-full rounded-[32px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-cardFloat p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.08)_0%,transparent_70%)] pointer-events-none -z-0" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-black/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-[#FF5C18]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C18] font-jakarta">
                Phase 6 • Long-Term Scaling & Value Capture
              </span>
              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 font-bold border border-purple-200/60">
                Non-Dilutive Reraises + Up to 2.0x Conviction Yield
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#111113] tracking-tight font-jakarta mt-1">
              Scale Your Company Cleanly & Reward Long-Term Believers
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200/70 text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Zero Token Fragmentation</span>
        </div>
      </div>

      {/* Two Clear Pillars Navigation */}
      <div className="flex items-center gap-2 mt-6 p-1.5 bg-[#FAF7F2] rounded-2xl border border-black/[0.05] relative z-10 max-w-fit">
        <button
          onClick={() => setActiveTab("funding")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "funding"
              ? "bg-[#111113] text-white shadow-xs"
              : "text-[#5A5652] hover:text-[#111113]"
          }`}
        >
          <Layers className="w-4 h-4 text-[#FF5C18]" />
          <span>Pillar 1: How Follow-on Raises Work (Series A / B)</span>
        </button>
        <button
          onClick={() => setActiveTab("staking")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "staking"
              ? "bg-[#111113] text-white shadow-xs"
              : "text-[#5A5652] hover:text-[#111113]"
          }`}
        >
          <Lock className="w-4 h-4 text-[#FF5C18]" />
          <span>Pillar 2: Conviction Locking (Up to 7.0x Dividends)</span>
        </button>
      </div>

      {/* PILLAR 1: HOW FOLLOW-ON ROUNDS WORK */}
      {activeTab === "funding" && (
        <div className="mt-6 space-y-6 relative z-10">
          {/* Comparison Cards: Legacy Broken vs Ventrion Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Broken Web3 Way */}
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>The Traditional Problem (Dumping & V2 Tokens)</span>
              </div>
              <p className="text-[11.5px] text-rose-950/80 leading-relaxed">
                When ordinary crypto projects need more capital, they either <strong>dump reserved tokens on open DEX markets</strong> (crashing the price for community holders) or launch a <strong>&ldquo;Token V2&rdquo;</strong> (which fragments community liquidity across dead pools).
              </p>
            </div>

            {/* The Ventrion Way */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>The Ventrion Solution (Single Unified Pool)</span>
              </div>
              <p className="text-[11.5px] text-emerald-950/80 leading-relaxed">
                Companies issue authorized follow-on tranches pegged to the fair <strong>24-hour market TWAP price</strong>. New Series A capital is injected <strong>directly into the existing Meteora pool</strong>. No new token, zero market dumps, and existing holders see deeper liquidity.
              </p>
            </div>
          </div>

          {/* Interactive Seed vs Series A Financials */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#111113] uppercase tracking-wider font-jakarta block mb-2">
                  Follow-On Capital Injection Mechanics
                </span>
                <p className="text-xs text-[#5A5652] leading-relaxed mb-4">
                  Imagine your company tokenized at a <strong>$1.00 seed valuation</strong>. After 12 months of profitable operations and customer revenue, you raise a $750,000 Series A at a <strong>$5.00 fair market price</strong>:
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-black/[0.04] flex items-center justify-between">
                    <span className="text-[#5A5652]">1. Pricing Rule:</span>
                    <span className="font-bold text-[#111113] font-mono">Pegged to 24h DLMM TWAP ($5.00 USDC)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-black/[0.04] flex items-center justify-between">
                    <span className="text-[#5A5652]">2. Liquidity Placement:</span>
                    <span className="font-bold text-purple-900 font-mono">Deposited into Active DLMM Price Bins</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-black/[0.04] flex items-center justify-between">
                    <span className="text-[#5A5652]">3. Impact on Seed Backers:</span>
                    <span className="font-bold text-emerald-700 font-mono">+400% Asset Value &amp; 5x Deeper Pool</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.05] text-[11px] text-[#8E8B88]">
                Institutional angels deposit USDC directly into corporate reserves; no secondary sell pressure is created.
              </div>
            </div>

            {/* Interactive Round Switcher */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-white to-[#FAF8F5] border border-black/[0.07] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs mb-3.5">
                  <span className="font-bold text-[#111113]">Round Comparison</span>
                  <div className="flex gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-black/[0.04]">
                    <button
                      onClick={() => setSelectedRound("seed")}
                      className={`px-3 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        selectedRound === "seed" ? "bg-[#111113] text-white shadow-xs" : "text-[#8E8B88] hover:text-[#111113]"
                      }`}
                    >
                      Round 1 (Seed)
                    </button>
                    <button
                      onClick={() => setSelectedRound("seriesA")}
                      className={`px-3 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        selectedRound === "seriesA" ? "bg-[#FF5C18] text-white shadow-xs" : "text-[#8E8B88] hover:text-[#111113]"
                      }`}
                    >
                      Round 2 (Series A)
                    </button>
                  </div>
                </div>

                {selectedRound === "seed" ? (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-black/[0.05] space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#8E8B88]">Company Valuation:</span>
                      <span className="font-bold text-[#111113]">$1,000,000 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8B88]">Share Price:</span>
                      <span className="font-bold text-[#111113]">$1.00 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8B88]">Capital Raised:</span>
                      <span className="font-bold text-emerald-700">$150,000 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8B88]">Secondary Pool:</span>
                      <span className="font-bold text-blue-700">Initial $37,500 Liquidity</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/70 space-y-2.5 text-xs font-mono shadow-xs">
                    <div className="flex justify-between">
                      <span className="text-purple-800">Series A Valuation:</span>
                      <span className="font-bold text-purple-950">$5,000,000 USDC (+400%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800">TWAP Share Price:</span>
                      <span className="font-bold text-purple-950">$5.00 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800">New Growth Capital:</span>
                      <span className="font-bold text-emerald-700">$750,000 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800">Meteora DLMM Pool:</span>
                      <span className="font-bold text-purple-950">Deeper Existing Pool</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.05] text-[11px] text-center text-[#8E8B88] font-jakarta">
                {selectedRound === "seed" ? "Initial launch phase." : "Series A strengthens the exact same contract address."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 2: UNIVERSAL CONVICTION LOCKING (UP TO 7X DIVIDENDS) */}
      {activeTab === "staking" && (
        <div className="mt-6 space-y-6 relative z-10">
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06]">
            <span className="text-xs font-bold text-[#111113] uppercase tracking-wider font-jakarta block mb-1">
              Why Conviction Locking Changes Everything
            </span>
            <p className="text-xs text-[#5A5652] leading-relaxed">
              In Ventrion, circulating float tokens in wallets do not earn dividends to protect against flash loans and MEV exploits. Holders deposit into their smart-contract-hosted <strong>InvestorVault PDA</strong> to activate $O(1)$ checkpointed dividends. Longer voluntary locks earn up to a <strong>2.0x dividend quote boost</strong>.
            </p>
          </div>

          {/* Interactive Lock Duration Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#111113] mb-3 block">
                  Select Your Voluntary Lock Duration:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                  {lockTiers.map((tier, idx) => (
                    <button
                      key={tier.label}
                      onClick={() => setLockDurationIndex(idx)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        lockDurationIndex === idx
                          ? "bg-[#111113] text-white border-[#111113] shadow-sm"
                          : "bg-[#FAF7F2] text-[#5A5652] border-black/[0.06] hover:bg-neutral-100"
                      }`}
                    >
                      <span className="block text-[11px] font-bold font-jakarta">{tier.days}</span>
                      <span className={`block text-xs font-mono font-extrabold mt-1 ${
                        lockDurationIndex === idx ? "text-[#FF8A50]" : "text-emerald-700"
                      }`}>
                        {tier.multiplier.toFixed(1)}x Yield
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#FF5C18]" />
                    <span className="text-xs font-bold text-orange-950 font-jakarta">
                      {currentTier.label} ({currentTier.days})
                    </span>
                  </div>
                  <p className="text-[11.5px] text-orange-950/80 leading-relaxed">
                    {currentTier.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.05] text-[11px] text-[#8E8B88] font-mono">
                Formula: Payout = Staked Shares &times; Multiplier &times; &Delta;AccWeight ($10^{18}$ precision scalar)
              </div>
            </div>

            {/* Dividend Yield Comparison Visual */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-black/[0.07] shadow-inner flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#111113] mb-3 block">
                  Example Dividend Payout Comparison
                </span>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-black/[0.04] flex justify-between items-center">
                    <span className="text-[#8E8B88]">Flexible Staker (0 Days):</span>
                    <span className="font-bold text-[#111113]">$100.00 USDC (1.0x)</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300/80 flex justify-between items-center shadow-xs">
                    <div>
                      <span className="text-emerald-950 font-bold block text-xs">Your Locked Payout:</span>
                      <span className="text-[10.5px] text-emerald-700">{currentTier.days} lockup</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-emerald-900 font-jakarta block">
                        ${currentTier.payout.toFixed(2)} USDC
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        +{((currentTier.multiplier - 1) * 100).toFixed(0)}% Boost
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#5A5652] mt-3.5 leading-relaxed">
                  Notice how a 365-day conviction partner receives <strong>$200.00 USDC</strong> for the same share count that earns a flexible staker $100.00, while un-staked float earns zero.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.05] text-[11px] text-center text-[#8E8B88]">
                Aligning capital with company longevity over speculative churn.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
