"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhaseVideoContainer } from "./PhaseVideoContainer";

interface PhaseItem {
  id: string;
  number: string;
  shortLabel: string;
  title: string;
  headline: string;
  videoSrc?: string;
}

const PHASES: PhaseItem[] = [
  {
    id: "phase-genesis",
    number: "01",
    shortLabel: "Genesis",
    title: "Genesis & Minting",
    headline: "Mint 1,000,000 canonical shares with locked founder equity.",
  },
  {
    id: "phase-raise",
    number: "02",
    shortLabel: "Raise",
    title: "The Primary Raise",
    headline: "Flat-price capital formation with 100% money-back escrow.",
  },
  {
    id: "phase-trade",
    number: "03",
    shortLabel: "Liquidity",
    title: "Graduation & Liquidity",
    headline: "Single-block automated migration into Meteora DLMM.",
  },
  {
    id: "phase-cashflow",
    number: "04",
    shortLabel: "Dividends",
    title: "Revenue & Dividends",
    headline: "Stream commercial checkout profits straight to shareholders.",
  },
  {
    id: "phase-milestones",
    number: "05",
    shortLabel: "Milestones",
    title: "Milestone Escrow",
    headline: "Institutional credibility through tranche-gated releases.",
  },
  {
    id: "phase-scale",
    number: "06",
    shortLabel: "Scale",
    title: "Follow-On & Staking",
    headline: "Dilution-free follow-on raises and up to 7.0x yield boost.",
  },
];

// Ventrion custom spring ease
const EASE_VENTRION = [0.16, 1, 0.3, 1];

export function VentureLifecycleSection() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const touchStartX = useRef<number>(0);

  const goToPhase = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    },
    [activeIndex]
  );

  const nextPhase = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev < PHASES.length - 1 ? prev + 1 : 0));
  }, []);

  const prevPhase = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : PHASES.length - 1));
  }, []);

  // Touch Swipe navigation for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        // Swiped left -> Next
        nextPhase();
      } else {
        // Swiped right -> Prev
        prevPhase();
      }
    }
  };

  // Keyboard navigation (ArrowLeft / ArrowRight) when section is visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const section = document.getElementById("lifecycle-section");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === "ArrowRight") {
        nextPhase();
      } else if (e.key === "ArrowLeft") {
        prevPhase();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPhase, prevPhase]);

  const currentPhase = PHASES[activeIndex];

  // Motion variants for directional sliding
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 32 : -32,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.38,
        ease: EASE_VENTRION,
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : 32,
      opacity: 0,
      scale: 0.985,
      transition: {
        duration: 0.28,
        ease: EASE_VENTRION,
      },
    }),
  };

  return (
    <section
      id="lifecycle-section"
      className="w-full relative py-20 sm:py-28 select-none overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1100px] h-[550px] bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(255,92,24,0.035)_0%,transparent_75%)] blur-3xl pointer-events-none -z-10" />

      {/* SECTION HEADER: Clean, confident typography with ZERO fluff */}
      <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 mb-10 sm:mb-12 text-center">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8E8B88] font-jakarta block mb-2.5">
          The Corporate Lifecycle
        </span>
        <h2 className="font-jakarta text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111113] tracking-tight leading-[1.14]">
          How Ventrion Works.
        </h2>
        <p className="font-jakarta text-base sm:text-lg text-[#5A5652] max-w-2xl mx-auto mt-2.5 font-normal leading-relaxed">
          From sovereign genesis to secondary liquidity and continuous shareholder payouts. Six cryptographic phases that replace paper bureaucracy with immutable code.
        </p>

        {/* INTELLIGENT STEPPER CONTROLLER: 6 PHASES */}
        <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-white/85 border border-black/[0.06] shadow-sm backdrop-blur-md max-w-full overflow-x-auto no-scrollbar">
          {PHASES.map((phase, idx) => {
            const isActive = activeIndex === idx;

            return (
              <button
                key={phase.id}
                onClick={() => goToPhase(idx)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-full font-jakarta text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive ? "text-white" : "text-[#5A5652] hover:text-[#111113]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeLifecyclePill"
                    className="absolute inset-0 rounded-full bg-[#111113] shadow-md"
                    transition={{ duration: 0.28, ease: EASE_VENTRION }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isActive ? "text-[#FF5C18]" : "text-[#8E8B88]"
                    }`}
                  >
                    {phase.number}
                  </span>
                  <span>{phase.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN COMPACT SHOWCASE STAGE */}
      <div className="w-full max-w-[1100px] mx-auto px-6 sm:px-10 lg:px-14">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full rounded-[32px] sm:rounded-[36px] bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_20px_50px_-15px_rgba(20,15,10,0.06)] p-6 sm:p-9 lg:p-11 overflow-hidden"
        >
          {/* Phase Header Info: Punchy Headline Only - ZERO Explanatory Paragraphs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.05]">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#FF5C18] uppercase">
                {currentPhase.number} &mdash; {currentPhase.title}
              </span>
              <h3 className="font-jakarta text-xl sm:text-2xl font-bold text-[#111113] tracking-tight leading-tight">
                {currentPhase.headline}
              </h3>
            </div>

            {/* Stepper Navigation Buttons with Tactile Size and Keyboard Hint */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevPhase}
                className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-black/[0.06] text-[#111113] flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-xs"
                aria-label="Previous Phase"
              >
                ←
              </motion.button>

              <span className="text-xs font-mono font-medium text-[#8E8B88] px-1">
                {currentPhase.number} / 06
              </span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextPhase}
                className="w-9 h-9 rounded-full bg-[#111113] text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer shadow-xs"
                aria-label="Next Phase"
              >
                →
              </motion.button>
            </div>
          </div>

          {/* Centerpiece: Hypnotic Motion Canvas / Raw Video Stage */}
          <div className="pt-6 relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPhase.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                <PhaseVideoContainer
                  videoSrc={currentPhase.videoSrc}
                  phaseNumber={currentPhase.number}
                  phaseId={currentPhase.id}
                  phaseTitle={currentPhase.title}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Timeline Step Progress Bar */}
          <div className="mt-6 pt-5 border-t border-black/[0.05] flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-1.5">
              {PHASES.map((phase, idx) => (
                <button
                  key={phase.id}
                  onClick={() => goToPhase(idx)}
                  className="flex-1 h-1.5 rounded-full overflow-hidden bg-black/[0.06] group cursor-pointer py-1"
                  aria-label={`Jump to phase ${phase.number}`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? "bg-[#FF5C18]"
                        : idx < activeIndex
                        ? "bg-[#111113]"
                        : "bg-transparent group-hover:bg-black/15"
                    }`}
                  />
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={nextPhase}
              className="text-xs font-jakarta font-semibold text-[#FF5C18] hover:text-[#e04f12] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>{activeIndex === PHASES.length - 1 ? "Replay Genesis" : "Next Phase"}</span>
              <span>→</span>
            </motion.button>
          </div>

        </div>
      </div>
    </section>
  );
}
