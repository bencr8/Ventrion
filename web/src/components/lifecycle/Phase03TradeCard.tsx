"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, ArrowRightLeft, Sparkles, Activity, Layers, Coins } from "lucide-react";

export function Phase03TradeCard() {
  const [activeBinIndex, setActiveBinIndex] = useState<number>(2); // middle bin $1.00

  const bins = [
    { price: "$0.92", height: "45%", label: "Deep Bid Bin", liquidity: "$18,500 USDC" },
    { price: "$0.96", height: "75%", label: "Immediate Bid", liquidity: "$32,000 USDC" },
    { price: "$1.00", height: "100%", label: "Active Price Bin (Pegged)", liquidity: "$50,000 Seed" },
    { price: "$1.04", height: "70%", label: "Immediate Ask", liquidity: "32,000 Shares" },
    { price: "$1.08", height: "40%", label: "Deep Ask Bin", liquidity: "18,500 Shares" },
  ];

  return (
    <div className="w-full rounded-[32px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-cardFloat p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.07)_0%,transparent_70%)] pointer-events-none -z-0" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-black/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-md">
            <ArrowRightLeft className="w-5 h-5 text-[#FF5C18]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C18] font-jakarta">
                Automated Graduation • Meteora DLMM Concentrated Liquidity
              </span>
              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200/60">
                Single-Block Execution (Axiom 4)
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#111113] tracking-tight font-jakarta mt-1">
              Concentrated Liquidity & Permanent LP NFT Lockup
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <Lock className="w-4 h-4 text-amber-600" />
          <span>Permanently Locked LP NFT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-7 relative z-10">
        {/* Left: The Automated Triple-Split Architecture (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-bold text-[#111113] uppercase tracking-wider font-jakarta">
            Hardcap Settlement Architecture:
          </div>

          <div className="space-y-3">
            {/* Split 1: DLMM Seed */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-xs">
                  25%
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111113]">
                    Meteora DLMM Liquidity ($37,500 USDC + 37,500 Shares)
                  </div>
                  <div className="text-[11.5px] text-[#5A5652] mt-0.5">
                    Seeded at $1.00 entry price. LP NFT transferred to program custody PDA.
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-mono px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold shrink-0">
                Instant DLMM
              </span>
            </div>

            {/* Split 2: Milestone Escrow */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs">
                  75%
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111113]">
                    Milestone Escrow Vault ($112,500 USDC)
                  </div>
                  <div className="text-[11.5px] text-[#5A5652] mt-0.5">
                    Non-custodial. Unlocked strictly in deliverable tranches with 51% quorum.
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-mono px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                51% Protected
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-black/[0.05] text-xs text-[#5A5652] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-[#111113]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Liquidity-Drain Exploit Vector</span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              The Anchor smart contract stores the LP Position NFT in the <code>dlmm_custody</code> PDA.
              The program code strictly contains <strong>zero instructions</strong> allowing founders or admins
              to withdraw underlying LP liquidity.
            </p>
          </div>
        </div>

        {/* Right: Visual DLMM Bin Distribution (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-black/[0.07] shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-bold text-[#111113] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Meteora Concentrated Liquidity Bins
              </span>
              <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                lb_pair: Active
              </span>
            </div>

            {/* Interactive Bins Graph */}
            <div className="h-40 w-full flex items-end justify-between gap-2 pt-4 pb-2 px-3 bg-[#FAF7F2] rounded-xl border border-black/[0.04]">
              {bins.map((b, i) => (
                <div
                  key={i}
                  onClick={() => setActiveBinIndex(i)}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                >
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 relative ${
                      i === activeBinIndex
                        ? "bg-[#FF5C18] shadow-sm"
                        : i < 2
                        ? "bg-blue-400/80 group-hover:bg-blue-500"
                        : "bg-emerald-400/80 group-hover:bg-emerald-500"
                    }`}
                    style={{ height: b.height }}
                  />
                  <span className="text-[10px] font-mono text-[#8E8B88] mt-1.5 font-bold">
                    {b.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Selected Bin Telemetry */}
            <div className="mt-3 p-3 rounded-xl bg-white border border-black/[0.05] text-xs font-mono flex justify-between items-center">
              <span className="text-[#8E8B88]">{bins[activeBinIndex].label}:</span>
              <span className="font-bold text-[#111113]">{bins[activeBinIndex].liquidity}</span>
              <span className="text-[10.5px] text-[#FF5C18] font-bold">2.5% Swap Fee</span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#5A5652] font-mono mt-2 px-1">
              <span className="text-blue-700">← Bids (USDC Capital)</span>
              <span className="text-[#FF5C18] font-bold">Center: $1.00</span>
              <span className="text-emerald-700">Asks (Shares) →</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/[0.05] text-[11px] text-[#8E8B88] text-center font-jakarta">
            Secondary float is 100% liquid from block 1. All secondary trading fees auto-harvest into the child dividend vault.
          </div>
        </div>
      </div>
    </div>
  );
}
