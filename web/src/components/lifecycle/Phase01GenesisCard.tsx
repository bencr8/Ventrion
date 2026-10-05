"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Sparkles, Layers, KeyRound, Terminal, CheckCircle2 } from "lucide-react";

export function Phase01GenesisCard() {
  const [founderLockPct, setFounderLockPct] = useState<number>(80);
  const [lockMonths, setLockMonths] = useState<number>(24);

  const publicFloatPct = 100 - founderLockPct;
  const yieldMultiplier = (100 / publicFloatPct).toFixed(2);
  const founderShares = (founderLockPct * 10000).toLocaleString();
  const publicShares = ((100 - founderLockPct) * 10000).toLocaleString();

  return (
    <div className="w-full rounded-[32px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-cardFloat p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_20%,rgba(255,92,24,0.08)_0%,transparent_70%)] pointer-events-none -z-0" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-[radial-gradient(circle_at_30%_80%,rgba(16,185,129,0.04)_0%,transparent_70%)] pointer-events-none -z-0" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-black/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-md">
            <Layers className="w-5 h-5 text-[#FF5C18]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C18] font-jakarta">
                Axiom 1 & 2 • Sovereign SPL Genesis
              </span>
              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-black/5 text-[#5A5652] font-bold">
                1,000,000 Canonical Shares ($10^6$)
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#111113] tracking-tight font-jakarta mt-1">
              Cap Table Partitioning & MasterLockVault Instantiation
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Strict No-Burn Invariant</span>
        </div>
      </div>

      {/* Interactive Cap Table Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-7 relative z-10">
        {/* Left: Sliders, Controls & Architecture (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold font-jakarta text-[#5A5652]">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FF5C18]" />
                <span>Founder Supply Lockup (Pool A Custody)</span>
              </span>
              <span className="text-sm font-bold font-mono text-[#111113]">
                {founderLockPct}% ({founderShares} Shares)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={founderLockPct}
              onChange={(e) => setFounderLockPct(Number(e.target.value))}
              className="w-full h-2.5 bg-[#EBE5DC] rounded-lg appearance-none cursor-pointer accent-[#FF5C18]"
            />
            <div className="flex justify-between text-[11px] text-[#8E8B88] font-mono">
              <span>50% Minimum Institutional Lock</span>
              <span className="text-[#FF5C18] font-bold">80% Optimal Alignment</span>
              <span>90% Maximum</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold font-jakarta text-[#5A5652]">
              <span>Programmatic Vesting Duration (Linear Cliff)</span>
              <span className="text-sm font-bold font-mono text-[#111113]">
                {lockMonths} Months ({lockMonths / 12} Years)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[12, 24, 36].map((m) => (
                <button
                  key={m}
                  onClick={() => setLockMonths(m)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold font-jakarta transition-all cursor-pointer ${
                    lockMonths === m
                      ? "bg-[#111113] text-white shadow-sm ring-1 ring-white/20"
                      : "bg-[#F7F5F0] text-[#5A5652] hover:bg-black/5"
                  }`}
                >
                  {m} Months ({m / 12} Yr)
                </button>
              ))}
            </div>
          </div>

          {/* Cryptographic Guarantees Box */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] text-xs text-[#5A5652] space-y-2">
            <div className="font-bold text-[#111113] flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C18]" />
              <span>Dynamic Governance Neutralization & Zero Conflict of Interest</span>
            </div>
            <p className="text-[12px] leading-relaxed">
              While locked in the program custody PDA, founder tokens have <strong>strictly 0 votes</strong> and <strong>0 dividend entitlement</strong>. The public float holds 100% effective governance control over capital disbursements, preventing founders from out-voting investors.
            </p>
            <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] font-mono text-[#8E8B88]">
              <span>Anchor PDA: <code>[b"founder_lock", venture.key()]</code></span>
              <span className="text-emerald-700 font-bold">100% On-Chain Verifiable</span>
            </div>
          </div>
        </div>

        {/* Right: Mathematical Multiplier & Cap Table Distribution (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5] border border-black/[0.07] shadow-inner flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8B88] font-jakarta">
              Mathematical Super-Yield Multiplier
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#111113] font-jakarta tracking-tight">
                {yieldMultiplier}x
              </span>
              <span className="text-xs font-bold text-[#FF5C18] uppercase tracking-wide">
                Cashflow Boost
              </span>
            </div>

            {/* Invariant Equation */}
            <div className="my-3 p-3 rounded-xl bg-black/[0.03] font-mono text-[11px] text-[#33302E] leading-relaxed border border-black/[0.04]">
              Δacc_per_share = (USDC_Deposit × 10¹²) / Eligible_Float
            </div>

            <p className="text-[11.5px] text-[#5A5652] leading-relaxed">
              Because founder tokens forfeit dividends during lockup, 100% of distributed operating profits flow exclusively to the {publicFloatPct}% public float.
            </p>
          </div>

          {/* Visual Cap Table Ratio */}
          <div className="mt-5 pt-4 border-t border-black/[0.06] space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E8B88]">Public Float (Backers):</span>
              <span className="font-bold text-emerald-700">{publicFloatPct}% ({publicShares} Shares)</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E8B88]">Founder Locked (Pool A):</span>
              <span className="font-bold text-[#FF5C18]">{founderLockPct}% ({founderShares} Shares)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#EBE5DC] overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${publicFloatPct}%` }}
              />
              <div
                className="h-full bg-[#FF5C18] transition-all duration-300"
                style={{ width: `${founderLockPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10.5px] font-mono text-[#8E8B88]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 100% Voting Power
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF5C18] inline-block" /> 0 Votes (Neutralized)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
