"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  Lock,
  RefreshCcw,
  CheckCircle2,
  DollarSign,
  ArrowDown,
  RotateCcw,
  Unlock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Key,
} from "lucide-react";

export type EscrowLockStatus = "LOCKED" | "CONDITIONAL" | "REFUNDABLE";

export interface BackZeroRiskCardProps {
  isExpanded?: boolean;
  onActivate?: () => void;
  className?: string;
}

const TARGET_AMOUNT = 50_000;
const INITIAL_AMOUNT = 38_400;

export function BackZeroRiskCard({
  isExpanded,
  onActivate,
  className = "",
}: BackZeroRiskCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<number>(INITIAL_AMOUNT);
  const [userContribution, setUserContribution] = useState<number>(0);
  const [lockStatus, setLockStatus] = useState<EscrowLockStatus>("LOCKED");
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  // Controlled or uncontrolled expansion state
  const isCardExpanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  const handleToggleExpand = () => {
    onActivate?.();
    if (isExpanded === undefined) {
      setInternalExpanded((prev) => !prev);
    }
  };

  const isGoalReached = currentAmount >= TARGET_AMOUNT;
  const progressRatio = Math.min(1, currentAmount / TARGET_AMOUNT);
  const progressPct = Math.min(100, (currentAmount / TARGET_AMOUNT) * 100);

  // Lock dial angle calculations
  const dialAngle = isGoalReached
    ? 180
    : lockStatus === "LOCKED"
    ? 0
    : lockStatus === "CONDITIONAL"
    ? 60
    : 120;

  const handleAddContribution = (amount: number) => {
    const nextAmount = Math.min(TARGET_AMOUNT, currentAmount + amount);
    setCurrentAmount(nextAmount);
    setUserContribution((prev) => prev + amount);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 400);

    if (nextAmount >= TARGET_AMOUNT && currentAmount < TARGET_AMOUNT) {
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#10B981", "#E58B6D", "#F8A882", "#111113"],
        });
      } catch {
        // Fallback gracefully
      }
    }
  };

  const handleResetContribution = () => {
    setCurrentAmount(INITIAL_AMOUNT);
    setUserContribution(0);
    setLockStatus("LOCKED");
  };

  const cycleLockStatus = () => {
    if (isGoalReached) return;
    setLockStatus((prev) => {
      if (prev === "LOCKED") return "CONDITIONAL";
      if (prev === "CONDITIONAL") return "REFUNDABLE";
      return "LOCKED";
    });
  };

  // Cylinder dynamic values (viewBox: 0 0 140 210)
  // Base Cy is 186, Top Cy is 30. Total fluid column height = 156.
  const fluidHeight = progressRatio * 150;
  const liquidTopY = Math.max(34, 186 - fluidHeight);

  return (
    <div
      className={`relative w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-[32px] shadow-cardFloat transition-all duration-300 overflow-hidden font-jakarta select-none ${className}`}
    >
      {/* Top Porcelain Edge Glaze Sheen */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Main Container Padding */}
      <div className="p-6 sm:p-8">
        {/* CARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.05] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Counterparty Risk</span>
              </span>
              <span className="text-xs text-[#8E8B88] font-medium hidden md:inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#8E8B88]" />
                All-or-Nothing Escrow
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111113] tracking-tight mt-2">
              BACK WITH ZERO RISK
            </h2>
            <p className="text-xs sm:text-sm text-[#5A5652] mt-1 max-w-xl">
              100% Refund Guarantee. Non-custodial Solana PDA escrow isolates backer funds. If the milestone is unmet by the deadline, capital returns autonomously.
            </p>
          </div>

          {/* Toggle / Quick Status Indicator */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 border border-white/95 shadow-sm text-right">
              <div className="text-[10px] uppercase font-bold text-[#8E8B88] tracking-wider">
                Target Cap
              </div>
              <div className="text-sm font-extrabold text-[#111113] font-mono">
                ${TARGET_AMOUNT.toLocaleString()} USDC
              </div>
            </div>

            <button
              onClick={handleToggleExpand}
              type="button"
              className="p-2.5 rounded-2xl bg-white/90 hover:bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-200 shadow-sm text-[#111113] group flex items-center gap-1 text-xs font-semibold"
              aria-label={isCardExpanded ? "Collapse capability card" : "Expand capability card"}
            >
              <span className="text-xs text-[#5A5652] hidden sm:inline">
                {isCardExpanded ? "Compact" : "Interact"}
              </span>
              {isCardExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#111113] transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#111113] group-hover:translate-x-0.5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* COLLAPSED PREVIEW MODE */}
        {!isCardExpanded && (
          <div
            onClick={handleToggleExpand}
            className="mt-6 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggleExpand();
              }
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/50 border border-white/80 group-hover:bg-white/80 transition-all duration-200">
              {/* Metric 1 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#8E8B88] font-medium">Refund Security</div>
                  <div className="text-sm font-bold text-[#111113]">100% Guaranteed</div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#8E8B88] font-medium">Escrow State</div>
                  <div className="text-sm font-bold text-[#111113]">Locked in PDA</div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#8E8B88] font-medium">Milestone Progress</div>
                  <div className="text-sm font-bold text-[#111113] font-mono">
                    ${currentAmount.toLocaleString()} ({progressPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Click to expand prompt */}
            <div className="mt-3 flex items-center justify-between text-xs text-[#8E8B88]">
              <span>Click to test interactive 3D Escrow Vault & Dial</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1 group-hover:underline">
                Explore Escrow Mechanics
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* EXPANDED INTERACTIVE MODE */}
        <AnimatePresence>
          {isCardExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="mt-6 space-y-6"
            >
              {/* MAIN INTERACTIVE STAGE: 3D CYLINDER + ROTATING DIAL + CONTROLS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* 1. 3D / VECTOR ESCROW VAULT CYLINDER (5 COLS) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-[28px] bg-gradient-to-b from-white/90 via-white/60 to-[#F6F4EE]/70 border border-white/90 shadow-sm relative overflow-hidden">
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

                  {/* Cylinder Header Label */}
                  <div className="w-full flex items-center justify-between text-xs font-semibold text-[#5A5652] mb-3 px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111113]" />
                      Escrow Vault Cylinder
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {progressPct.toFixed(1)}% Full
                    </span>
                  </div>

                  {/* Tactile 3D / Vector Escrow Cylinder SVG */}
                  <div className="relative w-[180px] h-[230px] flex items-center justify-center">
                    <svg
                      viewBox="0 0 140 210"
                      className="w-full h-full drop-shadow-md overflow-visible select-none"
                    >
                      <defs>
                        {/* Porcelain & Metallic Glaze */}
                        <linearGradient id="porcelain-body" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EDE8E1" stopOpacity="0.85" />
                          <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.95" />
                          <stop offset="50%" stopColor="#F7F5F0" stopOpacity="0.75" />
                          <stop offset="75%" stopColor="#E2DBD1" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#D3CDC0" stopOpacity="0.95" />
                        </linearGradient>

                        {/* Liquid Emerald Core Gradient */}
                        <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="35%" stopColor="#10B981" />
                          <stop offset="70%" stopColor="#34D399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>

                        {/* Liquid Surface Meniscus Gradient */}
                        <linearGradient id="meniscus-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6EE7B7" />
                          <stop offset="50%" stopColor="#A7F3D0" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>

                        {/* Glass Reflections and Sheen */}
                        <linearGradient id="glass-glare" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                          <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.1" />
                          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.8" />
                          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
                        </linearGradient>

                        {/* Cylinder Fluid Clip */}
                        <clipPath id="cylinder-inner-clip">
                          <path d="M 24 30 L 24 186 A 46 14 0 0 0 116 186 L 116 30 Z" />
                        </clipPath>
                      </defs>

                      {/* Pedestal Shadow */}
                      <ellipse cx="70" cy="198" rx="54" ry="8" fill="rgba(17,17,19,0.12)" />

                      {/* Base Pedestal Ring */}
                      <ellipse cx="70" cy="190" rx="49" ry="15" fill="#D3CDC0" />
                      <ellipse cx="70" cy="188" rx="48" ry="14" fill="#F1ECE4" />

                      {/* Outer Glass Casing Back Chamber */}
                      <path
                        d="M 24 30 L 24 186 A 46 14 0 0 0 116 186 L 116 30 A 46 14 0 0 0 24 30 Z"
                        fill="rgba(240, 237, 230, 0.45)"
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth="1.5"
                      />

                      {/* DYNAMIC LIQUID FLUID VOLUME (Clipped inside cylinder) */}
                      <g clipPath="url(#cylinder-inner-clip)">
                        {/* Fluid Body */}
                        <rect
                          x="24"
                          y={liquidTopY}
                          width="92"
                          height={190 - liquidTopY}
                          fill="url(#liquid-gradient)"
                          className="transition-all duration-300"
                        />

                        {/* Meniscus Top Ellipse of Fluid */}
                        <ellipse
                          cx="70"
                          cy={liquidTopY}
                          rx="46"
                          ry="14"
                          fill="url(#meniscus-gradient)"
                          stroke="rgba(255, 255, 255, 0.5)"
                          strokeWidth="1"
                          className="transition-all duration-300"
                        />

                        {/* Subtle Rising Micro-Bubbles */}
                        <circle cx="50" cy={Math.min(180, liquidTopY + 30)} r="2" fill="white" opacity="0.6" />
                        <circle cx="85" cy={Math.min(180, liquidTopY + 50)} r="1.5" fill="white" opacity="0.5" />
                        <circle cx="68" cy={Math.min(180, liquidTopY + 75)} r="2.5" fill="white" opacity="0.4" />
                      </g>

                      {/* Etched Milestone Tick Marks on Glass */}
                      {/* 100% Mark ($50k) */}
                      <line x1="22" y1="36" x2="34" y2="36" stroke="#5A5652" strokeWidth="1.5" opacity="0.7" />
                      <text x="12" y="39" fontSize="6" fontWeight="700" fill="#5A5652" textAnchor="end">50K</text>

                      {/* 75% Mark ($37.5k) */}
                      <line x1="22" y1="73" x2="30" y2="73" stroke="#8E8B88" strokeWidth="1" opacity="0.6" />
                      <text x="14" y="76" fontSize="5" fontWeight="600" fill="#8E8B88" textAnchor="end">37.5K</text>

                      {/* 50% Mark ($25k) */}
                      <line x1="22" y1="111" x2="32" y2="111" stroke="#8E8B88" strokeWidth="1.2" opacity="0.6" />
                      <text x="14" y="113" fontSize="5" fontWeight="600" fill="#8E8B88" textAnchor="end">25K</text>

                      {/* 25% Mark ($12.5k) */}
                      <line x1="22" y1="148" x2="30" y2="148" stroke="#8E8B88" strokeWidth="1" opacity="0.6" />
                      <text x="14" y="150" fontSize="5" fontWeight="600" fill="#8E8B88" textAnchor="end">12.5K</text>

                      {/* Glass Glare and Reflection Overlay */}
                      <path
                        d="M 24 30 L 24 186 A 46 14 0 0 0 116 186 L 116 30 Z"
                        fill="url(#glass-glare)"
                        pointerEvents="none"
                      />

                      {/* Top Porcelain Ceramic Cap */}
                      <ellipse cx="70" cy="30" rx="46" ry="14" fill="#D3CDC0" />
                      <ellipse cx="70" cy="28" rx="45" ry="13" fill="url(#porcelain-body)" />
                      <ellipse cx="70" cy="27" rx="38" ry="10" fill="#FFFFFF" opacity="0.8" />
                      <circle cx="70" cy="27" r="4" fill="#E58B6D" />
                    </svg>

                    {/* Milestone Target Badge Floating next to cylinder */}
                    <div className="absolute top-2 -right-3 bg-white/95 border border-black/[0.08] shadow-sm rounded-xl px-2.5 py-1 text-center">
                      <div className="text-[9px] uppercase font-bold text-[#8E8B88]">Cap</div>
                      <div className="text-xs font-extrabold text-[#111113] font-mono">$50K</div>
                    </div>
                  </div>

                  {/* Fluid Level Label */}
                  <div className="mt-2 text-center">
                    <div className="text-sm font-extrabold text-[#111113] font-mono">
                      ${currentAmount.toLocaleString()} USDC
                    </div>
                    <div className="text-[11px] text-[#8E8B88] font-medium">
                      Locked in Non-Custodial PDA
                    </div>
                  </div>
                </div>

                {/* 2. ROTATING CERAMIC-BRASS LOCK DIAL & STATUS (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6 p-6 rounded-[28px] bg-white/80 border border-white/90 shadow-sm">
                  {/* DIAL + STATUS TOP BAR */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* ROTATING 3D BRASS-CERAMIC LOCK DIAL */}
                    <div className="flex items-center gap-4">
                      <div
                        onClick={cycleLockStatus}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full cursor-pointer group flex items-center justify-center shadow-cardFloat"
                        title="Click to cycle lock dial status"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            cycleLockStatus();
                          }
                        }}
                      >
                        {/* Outer Porcelain Beveled Rim */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white via-[#F7F5F0] to-[#DDD7CC] border border-white/95 shadow-inner" />

                        {/* Warm Brushed Brass Calibrated Dial Ring */}
                        <motion.div
                          animate={{ rotate: dialAngle }}
                          transition={{ type: "spring", stiffness: 280, damping: 22 }}
                          className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#F5D6B8] via-[#E58B6D] to-[#AA6E4C] p-1 shadow-sm flex items-center justify-center"
                        >
                          {/* Dial Graduation Tick Marks */}
                          <div className="absolute inset-0.5 rounded-full border border-black/15 pointer-events-none" />
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-[#111113] rounded-full" />
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-black/30 rounded-full" />
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1 bg-black/30 rounded-full" />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1 bg-black/30 rounded-full" />

                          {/* Center Porcelain Knob */}
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-white to-[#EDE8E1] border border-white shadow-md flex items-center justify-center">
                            {isGoalReached ? (
                              <Unlock className="w-5 h-5 text-emerald-600" />
                            ) : lockStatus === "LOCKED" ? (
                              <Lock className="w-5 h-5 text-[#111113]" />
                            ) : lockStatus === "CONDITIONAL" ? (
                              <Key className="w-5 h-5 text-[#E58B6D]" />
                            ) : (
                              <RefreshCcw className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                        </motion.div>
                      </div>

                      {/* Dial Explanation & Click Hint */}
                      <div>
                        <div className="text-xs uppercase font-bold text-[#8E8B88] tracking-wider">
                          Vault Security Dial
                        </div>
                        <div className="text-base font-extrabold text-[#111113]">
                          {isGoalReached
                            ? "RELEASE READY"
                            : lockStatus === "LOCKED"
                            ? "PDA LOCKED"
                            : lockStatus === "CONDITIONAL"
                            ? "CONDITIONAL HOLD"
                            : "REFUND UNLOCKED"}
                        </div>
                        <button
                          onClick={cycleLockStatus}
                          type="button"
                          className="text-[11px] text-[#E58B6D] hover:underline font-semibold mt-0.5 inline-flex items-center gap-1"
                        >
                          Click dial to cycle preview
                        </button>
                      </div>
                    </div>

                    {/* Current Lock Status Selector Pills */}
                    <div className="flex flex-row sm:flex-col gap-1.5 w-full sm:w-auto">
                      {(["LOCKED", "CONDITIONAL", "REFUNDABLE"] as EscrowLockStatus[]).map((status) => {
                        const isActive = lockStatus === status && !isGoalReached;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setLockStatus(status)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 border text-center flex items-center justify-center gap-1.5 ${
                              isActive
                                ? status === "LOCKED"
                                  ? "bg-[#111113] text-white border-[#111113]"
                                  : status === "CONDITIONAL"
                                  ? "bg-[#E58B6D] text-white border-[#E58B6D]"
                                  : "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white/80 text-[#5A5652] border-black/[0.06] hover:bg-white"
                            }`}
                          >
                            {status === "LOCKED" && <Lock className="w-3 h-3" />}
                            {status === "CONDITIONAL" && <Key className="w-3 h-3" />}
                            {status === "REFUNDABLE" && <RefreshCcw className="w-3 h-3" />}
                            <span>{status}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DYNAMIC PROGRESS BAR */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A5652] font-semibold">Milestone Funding Level</span>
                      <span className="font-mono font-extrabold text-[#111113]">
                        ${currentAmount.toLocaleString()} / ${TARGET_AMOUNT.toLocaleString()} USDC
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-black/[0.06] p-0.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#E58B6D]"
                        style={{ width: `${progressPct}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8E8B88]">
                      <span>Starting Baseline: $38,400</span>
                      {userContribution > 0 && (
                        <span className="font-semibold text-emerald-700 font-mono">
                          Your Stake: +${userContribution.toLocaleString()} USDC
                        </span>
                      )}
                      <span>Goal: $50,000</span>
                    </div>
                  </div>

                  {/* INTERACTIVE CONTRIBUTION BUTTONS */}
                  <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddContribution(100)}
                      disabled={isGoalReached}
                      className="px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50/60 active:scale-95 border border-black/[0.08] hover:border-emerald-300 text-xs font-bold text-[#111113] transition-all duration-150 shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+100 USDC</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddContribution(500)}
                      disabled={isGoalReached}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white text-xs font-bold transition-all duration-150 shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>+500 USDC</span>
                    </button>

                    {userContribution > 0 && (
                      <button
                        type="button"
                        onClick={handleResetContribution}
                        className="p-2.5 rounded-2xl bg-white hover:bg-[#F6F4EE] border border-black/[0.08] text-[#5A5652] hover:text-[#111113] transition-all duration-150 shadow-sm"
                        title="Reset simulation"
                        aria-label="Reset contribution"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    {isGoalReached && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Target Achieved: Liquidity Pool Unlocked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3-PILLAR SAFETY MATRIX */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Pillar 1 */}
                <div className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111113]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>All-or-Nothing Escrow</span>
                  </div>
                  <p className="text-xs text-[#5A5652] mt-1.5 leading-relaxed">
                    Zero creator access during raise. Funds are sealed in an immutable Solana Program Derived Address (PDA).
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111113]">
                    <RefreshCcw className="w-4 h-4 text-emerald-600" />
                    <span>100% Refund Guarantee</span>
                  </div>
                  <p className="text-xs text-[#5A5652] mt-1.5 leading-relaxed">
                    If deadline passes without reaching the full $50,000 threshold, 100% of capital returns automatically.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111113]">
                    <Lock className="w-4 h-4 text-[#E58B6D]" />
                    <span>Auto-Locked Liquidity</span>
                  </div>
                  <p className="text-xs text-[#5A5652] mt-1.5 leading-relaxed">
                    Upon goal completion, DEX LP is created and LP tokens are burned or permanently locked. Zero rugpull possible.
                  </p>
                </div>
              </div>

              {/* VISUAL SMART CONTRACT SAFETY BADGE */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white/80 to-[#E58B6D]/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#111113] uppercase tracking-wider">
                      Smart Contract Protected
                    </div>
                    <div className="text-xs text-[#5A5652]">
                      100% Refundable if goal unmet by deadline &bull; Non-custodial PDA escrow logic
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-emerald-800 font-semibold px-3 py-1 rounded-lg bg-emerald-100/60 border border-emerald-200/50 self-start sm:self-center">
                  PDA: ventrion_escrow_v1
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BackZeroRiskCard;
