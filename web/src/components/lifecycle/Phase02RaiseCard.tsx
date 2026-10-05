"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Coins, CheckCircle2, ShieldCheck, ArrowRight, TrendingUp, AlertCircle, RefreshCw, KeyRound } from "lucide-react";

export function Phase02RaiseCard() {
  const [pledgeAmount, setPledgeAmount] = useState<number>(500);
  const [isPledging, setIsPledging] = useState<boolean>(false);
  const [hasPledged, setHasPledged] = useState<boolean>(false);

  const targetHardcap = 150000;
  const currentRaised = 112500;
  const sharePrice = 1.0; // $1.00 USDC constant

  const sharesReceived = Math.round(pledgeAmount / sharePrice);
  const equityPct = ((sharesReceived / 1000000) * 100).toFixed(3);

  const handlePledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (pledgeAmount <= 0) return;
    setIsPledging(true);

    setTimeout(() => {
      setIsPledging(false);
      setHasPledged(true);
      setTimeout(() => setHasPledged(false), 3500);
    }, 900);
  };

  return (
    <div className="w-full rounded-[32px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-cardFloat p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.07)_0%,transparent_70%)] pointer-events-none -z-0" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-black/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-md">
            <Coins className="w-5 h-5 text-[#FF5C18]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C18] font-jakarta">
                Primary Raise • Meteora Dynamic Bonding Curve (DBC)
              </span>
              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                Flat-Curve Mode (Constant Price)
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#111113] tracking-tight font-jakarta mt-1">
              Zero-FOMO Capital Formation & Soulbound Backer Receipts
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/70 text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span>100% Money-Back Escrow</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-7 relative z-10">
        {/* Left: Raise Progress & Mechanics (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-3.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-[#111113] font-jakarta">Seed Round Progress ($1.0M Pre-Money Valuation)</span>
              <span className="font-mono font-bold text-[#111113]">
                ${currentRaised.toLocaleString()} / ${targetHardcap.toLocaleString()} USDC (75.0%)
              </span>
            </div>

            {/* Flat Curve Progress Bar */}
            <div className="w-full h-3.5 rounded-full bg-[#EBE5DC] overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF5C18] shadow-sm transition-all duration-500"
                style={{ width: "75%" }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-[#5A5652] font-mono pt-1">
              <span>Token Price: <strong>$1.00 USDC (Constant)</strong></span>
              <span>150,000 Shares Allocated (15.0%)</span>
              <span>Quote Mint: Circle USDC</span>
            </div>
          </div>

          {/* Institutional Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/60 text-[#5A5652] space-y-1.5">
              <span className="font-bold text-red-950 block text-xs">❌ Predatory Bonding Curves (Pump.fun)</span>
              <p className="text-[11.5px] leading-relaxed">
                Exponential pricing rewards block-0 MEV bots and insider snipers while brutally penalizing latecomers. Dumps destroy retail capital within minutes.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-[#5A5652] space-y-1.5">
              <span className="font-bold text-emerald-950 block text-xs">✅ Ventrion Flat Curve (Meteora DBC)</span>
              <p className="text-[11.5px] leading-relaxed">
                Constant token valuation $P$ with Meteora native 0.1% spread Dynamic Bonding Curve. Zero sandwich attacks. Isolated tranche tokens ($VENT-Rk) strictly prevent liquidity snacking.
              </p>
            </div>
          </div>

          {/* Strict No-Burn Invariant Rule */}
          <div className="p-3.5 rounded-xl bg-white border border-black/[0.05] text-[11.5px] text-[#5A5652] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Strict Axiom 5:</strong> Backers trade with zero slippage on Meteora DBC. Upon graduation, tranche tokens unify 1:1 with canonical enterprise shares into their Smart Contract Hosted Staking Wallet (<code>InvestorVault</code> PDA).
            </span>
          </div>
        </div>

        {/* Right: Interactive Pledge Simulator (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-black/[0.07] shadow-inner flex flex-col justify-between">
          <form onSubmit={handlePledge} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#111113] font-jakarta">
                  Simulate Backer Contribution
                </label>
                <span className="text-[10.5px] font-mono text-emerald-700 font-semibold">Instant Quote</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-black/10 text-lg font-mono font-bold text-[#111113] focus:outline-none focus:ring-2 focus:ring-[#FF5C18]/30 shadow-xs"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8B88]">
                  USDC
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-1.5 mt-2.5">
                {[100, 500, 1000, 2500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPledgeAmount(amt)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                      pledgeAmount === amt
                        ? "bg-[#111113] text-white shadow-xs"
                        : "bg-[#F7F5F0] text-[#5A5652] hover:bg-black/5"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Allocation */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-black/[0.05] text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-[#8E8B88]">Shares Allocated:</span>
                <span className="font-bold text-[#111113]">{sharesReceived.toLocaleString()} Shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8B88]">Equity Ownership:</span>
                <span className="font-bold text-emerald-700">{equityPct}% Enterprise Stake</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8B88]">Custody Contract:</span>
                <span className="text-[#5A5652]">RoundUsdcEscrow (PDA)</span>
              </div>
              <div className="flex justify-between text-[10.5px] pt-1.5 border-t border-black/[0.04]">
                <span className="text-[#8E8B88]">Staking Vault:</span>
                <span className="text-emerald-800 font-bold">InvestorVault PDA (O(1) Dividends)</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isPledging || hasPledged}
              type="submit"
              className={`w-full py-3.5 rounded-full text-xs font-bold font-jakarta flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                hasPledged
                  ? "bg-emerald-600 text-white"
                  : "bg-[#111113] text-white hover:bg-black"
              }`}
            >
              {isPledging ? (
                <span>Executing Meteora Flat Curve Swap...</span>
              ) : hasPledged ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Tranche Tokens &amp; Staking Vault Issued!</span>
                </>
              ) : (
                <>
                  <span>Pledge ${pledgeAmount} USDC to Seed Round</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF5C18]" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
