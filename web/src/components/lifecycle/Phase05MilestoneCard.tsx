"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, Lock, Vote, Clock, Check, ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";

export function Phase05MilestoneCard() {
  const [activeMode, setActiveMode] = useState<"escrow" | "immediate">("escrow");
  const [votesFor, setVotesFor] = useState<number>(440000);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [trancheReleased, setTrancheReleased] = useState<boolean>(false);

  const quorumTarget = 510000; // 51% of 1,000,000 shares
  const votesPct = Math.min(100, (votesFor / 1000000) * 100);

  const handleVote = () => {
    if (hasVoted || trancheReleased) return;
    setIsVoting(true);

    setTimeout(() => {
      setIsVoting(false);
      setHasVoted(true);
      const updated = votesFor + 95000;
      setVotesFor(updated);

      if (updated >= quorumTarget) {
        setTrancheReleased(true);
      }
    }, 800);
  };

  return (
    <div className="w-full rounded-[32px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-cardFloat p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_20%,rgba(245,158,11,0.07)_0%,transparent_70%)] pointer-events-none -z-0" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-black/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-[#FF5C18]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C18] font-jakarta">
                Phase 5 • Milestone Escrow (100% Optional)
              </span>
              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-200/60">
                Founder Discretion • Maximum Credibility
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#111113] tracking-tight font-jakarta mt-1">
              Optional Milestone Vesting to Maximize Investor Trust
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <HeartHandshake className="w-4 h-4 text-amber-600" />
          <span>Voluntary Founder Commitment</span>
        </div>
      </div>

      {/* Important Notice Banner: Completely Voluntary */}
      <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] relative z-10 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#111113] uppercase tracking-wider font-jakarta">
              Founder Capital Control:
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#111113] font-bold border border-black/[0.08] shadow-2xs font-mono">
              Not Mandatory
            </span>
          </div>

          {/* Toggle between Immediate vs Voluntary Milestone */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-black/[0.06] shadow-2xs">
            <button
              onClick={() => setActiveMode("immediate")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === "immediate"
                  ? "bg-[#111113] text-white shadow-xs"
                  : "text-[#8E8B88] hover:text-[#111113]"
              }`}
            >
              Option A: Full Immediate Unlock
            </button>
            <button
              onClick={() => setActiveMode("escrow")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === "escrow"
                  ? "bg-[#FF5C18] text-white shadow-xs"
                  : "text-[#8E8B88] hover:text-[#111113]"
              }`}
            >
              Option B: Milestone Escrow (High Trust)
            </button>
          </div>
        </div>

        <p className="text-xs text-[#5A5652] leading-relaxed">
          {activeMode === "immediate" ? (
            <span>
              <strong>Immediate Unlock Mode:</strong> Founders receive 100% of primary raise capital immediately upon graduation into secondary trading. No milestone votes or escrow lockups are imposed. Suitable for capital-intensive, fast-moving agile operations.
            </span>
          ) : (
            <span>
              <strong>Voluntary Milestone Escrow Mode (Recommended for Trust):</strong> Founders voluntarily place their raise capital into non-custodial milestone tranches. By proving concrete deliverables before capital is released, serious teams stand out from speculative projects and attract large-scale institutional backers.
            </span>
          )}
        </p>
      </div>

      {/* Interactive Demonstration of Milestone Escrow when opted in */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-7 relative z-10">
        {/* Left: 3 Tranches status (6 Cols) */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex justify-between items-center text-xs font-bold text-[#111113] uppercase tracking-wider font-jakarta">
            <span>Voluntary Tranche Vesting ($112,500 USDC):</span>
            <span className="font-mono text-[#FF5C18] text-[11px]">3 Structured Tranches</span>
          </div>

          {/* Tranche 1: Done */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Tranche 1 ($37,500) • Architecture & Smart Contract Audit</span>
                <span className="text-[11px] text-emerald-700">Audit verified with zero critical findings • Disbursed to company</span>
              </div>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-emerald-800 shrink-0">Released</span>
          </div>

          {/* Tranche 2: Under Review */}
          <div className={`p-4 rounded-2xl border transition-all ${
            trancheReleased
              ? "bg-emerald-50/70 border-emerald-200/70"
              : "bg-amber-50/80 border-amber-300/80 shadow-xs"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  trancheReleased ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {trancheReleased ? <Check className="w-4 h-4" /> : "2"}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#111113] block">Tranche 2 ($37,500) • Mainnet Beta & First 1,000 Stores</span>
                  <span className="text-[11px] text-[#5A5652]">
                    {trancheReleased ? "51% Quorum reached! Disbursed to operational treasury." : "Active challenge window (4 days remaining)"}
                  </span>
                </div>
              </div>
              <span className={`text-[10.5px] font-mono font-bold shrink-0 ${
                trancheReleased ? "text-emerald-800" : "text-amber-900"
              }`}>
                {trancheReleased ? "Approved" : "Voting Live"}
              </span>
            </div>
          </div>

          {/* Tranche 3: Locked */}
          <div className="p-4 rounded-2xl bg-neutral-100/60 border border-black/5 flex items-center justify-between opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-800 block">Tranche 3 ($37,500) • Global Scale & OEM Fulfillment API</span>
                <span className="text-[11px] text-neutral-500">Unlocks strictly upon Tranche 2 completion and verification</span>
              </div>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-neutral-500 shrink-0">Locked</span>
          </div>
        </div>

        {/* Right: Live Voting & 51% Needle Bar (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-black/[0.07] shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-[#111113] mb-2.5">
              <span>Backer Voting Safeguard (Dual Trigger)</span>
              <span className="font-mono text-emerald-700">Target: 51.0% (510,000 Shares)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-black/[0.04] space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8E8B88]">Current Votes FOR:</span>
                <span className="font-bold text-[#111113]">
                  {votesFor.toLocaleString()} / 1,000,000 ({votesPct.toFixed(1)}%)
                </span>
              </div>

              {/* Progress track with 51% threshold needle */}
              <div className="relative h-4 w-full bg-black/5 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-700 ${
                    trancheReleased ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${votesPct}%` }}
                />
                {/* 51% Needle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-black z-10"
                  style={{ left: "51%" }}
                />
              </div>

              <div className="flex justify-between text-[10.5px] text-[#8E8B88] font-mono">
                <span>0 Shares</span>
                <span className="text-black font-bold">▲ 51% Quorum Threshold</span>
                <span>1,000,000 Shares</span>
              </div>
            </div>

            <p className="text-[11.5px] text-[#5A5652] mt-3.5 leading-relaxed">
              When escrow is activated, tranches release through a <strong>Dual-Trigger</strong>: either active backer vote (&gt;50%) or an optimistic 7-day challenge window without community veto.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-black/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#8E8B88] font-mono">
              {trancheReleased ? "Tranche #2 unlocked!" : "Simulate backer vote (+95,000 shares)"}
            </span>

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={hasVoted || trancheReleased || isVoting}
              onClick={handleVote}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold font-jakarta flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                trancheReleased
                  ? "bg-emerald-600 text-white cursor-default"
                  : hasVoted
                  ? "bg-neutral-200 text-neutral-600 cursor-not-allowed"
                  : "bg-[#111113] hover:bg-black text-white"
              }`}
            >
              {isVoting ? (
                <span>Casting Signature...</span>
              ) : trancheReleased ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Tranche 2 Disbursed</span>
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4 text-[#FF5C18]" />
                  <span>Vote to Release Tranche #2</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
