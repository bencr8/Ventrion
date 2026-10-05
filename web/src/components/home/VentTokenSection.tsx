"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";

const VENT_TABS = [
  { id: 0, number: "01", label: "0.5% Protocol Fee" },
  { id: 1, number: "02", label: "Yield Calculator" },
  { id: 2, number: "03", label: "Governance" },
];

/**
 * Satisfying Bezier Animated Counter for Yield USDC
 * Interpolates smoothly to the target value with a tactile cubic-bezier settle ("Nachklang")
 */
function BezierCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display.toFixed(2)}</>;
}

export function VentTokenSection() {
  const [activeTab, setActiveTab] = useState(1); // Default to Yield Calculator

  // Cursor Parallax Movement Tracking
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleSectionMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMousePos({ x, y });
  };

  const handleSectionMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Single lock duration slider (0 to 365 days)
  const [lockDays, setLockDays] = useState<number>(180);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);

  // Governance vote state (monochrome)
  const [voteCasted, setVoteCasted] = useState<"yes" | "no" | null>(null);

  // Base path for public assets
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";

  // Multiplier scales smoothly from 1.0x (0 days) to 2.0x (365 days)
  const multiplier = 1.0 + (lockDays / 365) * 1.0;
  // Fixed standard base reference: 25,000 $VENT
  const baseStake = 25000;
  const effectiveWeight = baseStake * multiplier;
  const totalPoolWeight = 7500000;
  const monthlyRoyaltyPoolUsdc = 25000; // $5M volume * 0.5%
  const userMonthlyUsdc = Math.max(
    1,
    Number(((effectiveWeight / totalPoolWeight) * monthlyRoyaltyPoolUsdc).toFixed(2))
  );

  return (
    <section
      id="vent-section"
      onMouseMove={handleSectionMouseMove}
      onMouseLeave={handleSectionMouseLeave}
      className="w-full bg-[#0A0A0D] py-32 sm:py-40 select-none relative overflow-hidden border-t border-b border-white/[0.08]"
    >
      {/* Background Graphic: tokens.jpg covering the entire section with subtle cursor parallax */}
      <motion.div
        animate={{
          x: mousePos.x * 20,
          y: mousePos.y * 14,
        }}
        transition={{
          type: "spring",
          stiffness: 90,
          damping: 24,
          mass: 0.8,
        }}
        className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] flex items-center justify-center pointer-events-none overflow-hidden select-none z-0"
      >
        <img
          src={`${basePath}/tokens.jpg`}
          alt=""
          className="w-full h-full object-cover select-none pointer-events-none opacity-100"
        />
      </motion.div>

      <div className="relative w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 z-10">
        
        {/* Section Header: Subtitle deliberately removed */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#FF5C18] block mb-3">
            Protocol Economics
          </span>

          <h2 className="font-jakarta text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.14]">
            The $VENT Token.
          </h2>
        </div>

        {/* Architectural Showcase Container */}
        <div className="w-full max-w-[1100px] mx-auto relative">
          
          {/* Floating Dark HUD Tab Switcher */}
          <div className="absolute top-8 sm:top-9 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="inline-flex items-center p-1 sm:p-1.5 rounded-full bg-[#18181D]/90 backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.6)] gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap select-none">
              {VENT_TABS.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`group relative px-4 sm:px-5 py-2 rounded-full font-jakarta text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.01] active:scale-[0.99] ${
                      isActive ? "text-white" : "text-[#8E8B88] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeVentTab"
                        className="absolute inset-0 rounded-full bg-[#272730] border border-white/[0.1] shadow-sm"
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold transition-colors duration-150 ${
                          isActive ? "text-[#FF5C18]" : "text-[#787470] group-hover:text-[#FF5C18]"
                        }`}
                      >
                        {tab.number}
                      </span>
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Obsidian Card Container */}
          <div className="relative w-full min-h-[560px] lg:h-[530px] rounded-[32px] sm:rounded-[36px] bg-[#121216]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] px-8 sm:px-12 lg:px-14 py-12 sm:py-16 overflow-hidden flex items-center justify-center">
            
            {/* Two Column Content */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">
              
              {/* Left Column: Descriptive Narrative */}
              <div className="lg:col-span-6 flex flex-col justify-center max-w-lg min-h-[220px]">
                <AnimatePresence mode="wait">
                  {activeTab === 0 && (
                    <motion.div
                      key="vent-text-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#FF5C18] block mb-3">
                        01 / Protocol Fee
                      </span>
                      <h3 className="font-jakarta text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-[1.18]">
                        Global Ecosystem Cashflow.
                        <br />
                        Programmatic Real Yield.
                      </h3>
                      <p className="font-jakarta text-base text-[#8E8B88] mt-4 font-normal leading-relaxed">
                        Every company launched on Ventrion routes a continuous 0.5% protocol royalty on all gross profit distributions directly to $VENT stakers in canonical USDC.
                      </p>
                    </motion.div>
                  )}

                  {activeTab === 1 && (
                    <motion.div
                      key="vent-text-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#FF5C18] block mb-3">
                        02 / Staking Yield
                      </span>
                      <h3 className="font-jakarta text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-[1.18]">
                        Align With Time.
                        <br />
                        Scale Yield Up to 3.0x.
                      </h3>
                      <p className="font-jakarta text-base text-[#8E8B88] mt-4 font-normal leading-relaxed">
                        Stake $VENT into the global dividend pool. Lock your tokens up to 2 years to triple your share of all ongoing USDC protocol distributions.
                      </p>
                    </motion.div>
                  )}

                  {activeTab === 2 && (
                    <motion.div
                      key="vent-text-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#FF5C18] block mb-3">
                        03 / Protocol Governance
                      </span>
                      <h3 className="font-jakarta text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-[1.18]">
                        Sovereign Community Control.
                        <br />
                        1 $VENT = 1 Vote.
                      </h3>
                      <p className="font-jakarta text-base text-[#8E8B88] mt-4 font-normal leading-relaxed">
                        Vote directly on protocol upgrades, fee allocations, and venture verification escalations on Solana.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Restrained Tactical Widget */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <div className="w-full max-w-[440px] flex items-center justify-center relative min-h-[320px]">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB 0: Protocol Fee Split Bar (With Shimmer in Grey Bar) */}
                    {activeTab === 0 && (
                      <motion.div
                        key="vent-widget-0"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full p-7 rounded-[26px] bg-[#18181D] border border-white/[0.08] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] space-y-6"
                      >
                        {/* Split Bar with subtle skeleton shimmer in the grey founder bar */}
                        <div className="w-full h-4 rounded-full bg-[#111114] p-0.5 flex items-center gap-1 overflow-hidden border border-white/[0.06]">
                          {/* Grey bar with subtle shimmer */}
                          <div
                            className="h-full rounded-full relative overflow-hidden bg-white/[0.14] transition-all duration-300"
                            style={{ width: "99.5%" }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.18] to-transparent animate-shimmer" />
                          </div>
                          {/* Protocol fee bar */}
                          <div
                            className="h-full bg-[#FF5C18] rounded-full transition-all duration-300 shadow-[0_0_8px_#FF5C18]"
                            style={{ width: "0.5%" }}
                          />
                        </div>

                        {/* Ratio Readouts with ultra-subtle hover states */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] hover:scale-[1.008] border border-white/[0.05] transition-all duration-200">
                            <span className="text-xs text-[#8E8B88] font-medium block">Founder Retains</span>
                            <div className="text-2xl sm:text-3xl font-extrabold font-jakarta text-white mt-1">
                              99.5%
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-[#FF5C18]/10 hover:bg-[#FF5C18]/14 hover:scale-[1.008] border border-[#FF5C18]/20 transition-all duration-200">
                            <span className="text-xs text-[#FF5C18] font-medium block">Protocol Stakers</span>
                            <div className="text-2xl sm:text-3xl font-extrabold font-jakarta text-[#FF5C18] mt-1">
                              0.5%
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#8E8B88] leading-relaxed pt-1">
                          Hardcoded on Solana. Every commercial sale instantly routes the 0.5% royalty into the global dividend vault in canonical USDC.
                        </p>
                      </motion.div>
                    )}

                    {/* TAB 1: Yield Calculator With Smooth Bezier Resonance ("Nachklang") */}
                    {activeTab === 1 && (
                      <motion.div
                        key="vent-widget-1"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full p-7 rounded-[26px] bg-[#18181D] border border-white/[0.08] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] space-y-6"
                      >
                        {/* Lock Duration Time Slider (Manifest Section 4.2: 0 to 730 Days / 1.0x to 3.0x) */}
                        <div>
                          <div className="flex justify-between text-xs text-[#8E8B88] mb-2 font-medium">
                            <span>Sperrfrist</span>
                            <span className="text-white font-mono font-semibold">
                              {lockDays === 0
                                ? "Liquid (1.0x)"
                                : lockDays === 365
                                ? "1 Jahr (2.0x)"
                                : lockDays === 730
                                ? "2 Jahre (3.0x)"
                                : lockDays > 365
                                ? `${lockDays} Tage (~${(lockDays / 365).toFixed(1)}J • ${multiplier.toFixed(2)}x)`
                                : `${lockDays} Tage (${multiplier.toFixed(2)}x)`}
                            </span>
                          </div>

                          {/* Pure solid visual track without gradients */}
                          <div className="relative pt-2 pb-2">
                            <div className="relative w-full h-2 rounded-full bg-[#25252A] overflow-hidden">
                              <div
                                className="h-full bg-[#FF5C18] rounded-full will-change-transform"
                                style={{
                                  width: `${(lockDays / 730) * 100}%`,
                                  transition: isDragging
                                    ? "none"
                                    : "width 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                              />
                            </div>

                            {/* Solid Tactile Thumb Indicator without gradients or glow */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#FF5C18] pointer-events-none transition-transform duration-150"
                              style={{
                                left: `${(lockDays / 730) * 100}%`,
                                transform: `translate(-50%, -50%) scale(${isDragging ? 1.25 : 1})`,
                              }}
                            />

                            <input
                              type="range"
                              min={0}
                              max={730}
                              step={1}
                              value={lockDays}
                              onMouseDown={() => setIsDragging(true)}
                              onMouseUp={() => setIsDragging(false)}
                              onTouchStart={() => setIsDragging(true)}
                              onTouchEnd={() => setIsDragging(false)}
                              onChange={(e) => {
                                setLockDays(Number(e.target.value));
                                setHasClaimed(false);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>

                          {/* Minimalist scale tick labels without preset buttons */}
                          <div className="flex justify-between text-[11px] font-mono text-[#787470] mt-1.5 select-none">
                            <span>Liquid (1.0x)</span>
                            <span>1 Jahr (2.0x)</span>
                            <span>2 Jahre (3.0x)</span>
                          </div>
                        </div>

                        {/* Estimated Yield Result Box with satisfying Bezier resonance */}
                        <motion.div
                          animate={{
                            scale: isDragging ? 1.01 : 1,
                          }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] flex items-center justify-between transition-all duration-200"
                        >
                          <div>
                            <span className="text-xs text-[#8E8B88] font-medium block">
                              Estimated Monthly Yield
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-2xl font-extrabold font-jakarta text-white tracking-tight tabular-nums">
                                $<BezierCounter value={userMonthlyUsdc} />
                              </span>
                              <span className="text-xs text-[#8E8B88] font-mono">USDC</span>
                            </div>
                          </div>

                          {/* Clean, icon-free tactile button */}
                          <button
                            type="button"
                            onClick={() => setHasClaimed(!hasClaimed)}
                            className={`px-4 py-2.5 rounded-xl font-jakarta text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] ${
                              hasClaimed
                                ? "bg-white/[0.1] text-white border border-white/20"
                                : "bg-[#111113] text-white hover:bg-black border border-white/20 shadow-xs"
                            }`}
                          >
                            {hasClaimed ? "Claimed" : "Claim Yield"}
                          </button>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* TAB 2: Clean Monochrome Governance Card (No false devnet claim, no icons) */}
                    {activeTab === 2 && (
                      <motion.div
                        key="vent-widget-2"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full p-7 rounded-[26px] bg-[#18181D] border border-white/[0.08] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] space-y-5"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-[#FF5C18] uppercase tracking-wider block mb-1">
                              Proposal #01
                            </span>
                            <h4 className="text-base font-bold text-white leading-snug">
                              Protocol Fee Distribution
                            </h4>
                          </div>

                          <span className="text-[11px] font-mono text-[#8E8B88] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                            Active
                          </span>
                        </div>

                        <p className="text-xs text-[#8E8B88] leading-relaxed">
                          Direct 100% of accumulated $VENT fees into continuous USDC distributions to verified stakers on Solana.
                        </p>

                        {/* Monochrome Quorum Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-[#8E8B88] font-medium">
                            <span>Quorum (51% required)</span>
                            <span className="text-white font-mono font-semibold transition-all duration-300">
                              {voteCasted === "yes" ? "95.2%" : "94.8%"}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden flex p-0.5">
                            <div
                              className="h-full bg-white rounded-full will-change-transform"
                              style={{
                                width: voteCasted === "yes" ? "95.2%" : "94.8%",
                                transition: "width 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Vote Buttons (Monochrome / Ventrion Signature with Haptic Toggle) */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => setVoteCasted(voteCasted === "yes" ? null : "yes")}
                            className={`py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer text-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.015] active:scale-[0.985] ${
                              voteCasted === "yes"
                                ? "bg-[#FF5C18] text-white shadow-sm"
                                : "bg-white/[0.05] text-white hover:bg-white/[0.08] border border-white/[0.06]"
                            }`}
                          >
                            <span>{voteCasted === "yes" ? "Voted Yes" : "Vote Yes"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setVoteCasted(voteCasted === "no" ? null : "no")}
                            className={`py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer text-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.015] active:scale-[0.985] ${
                              voteCasted === "no"
                                ? "bg-white/20 text-white shadow-sm"
                                : "bg-white/[0.05] text-white hover:bg-white/[0.08] border border-white/[0.06]"
                            }`}
                          >
                            <span>{voteCasted === "no" ? "Voted No" : "Vote No"}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
