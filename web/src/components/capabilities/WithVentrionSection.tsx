"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TokenizeView } from "./TokenizeView";
import { BackRiskView } from "./BackRiskView";
import { TradeDexView } from "./TradeDexView";
import { StreamYieldView } from "./StreamYieldView";
import { GlassWavesCanvas } from "./GlassWavesCanvas";

const CARDS = [
  {
    id: 0,
    number: "01",
    shortLabel: "Tokenize",
    tag: "01 / Tokenize & Launch",
    headline1: "Issue Shares.",
    headline2: "Define Your Cap Table.",
    description:
      "Mint 1,000,000 immutable canonical shares on Solana. Retain founder control in a locked custody vault while offering liquid ownership to early backers.",
    component: TokenizeView,
  },
  {
    id: 1,
    number: "02",
    shortLabel: "Escrow",
    tag: "02 / Protected Escrow",
    headline1: "Capital Protected.",
    headline2: "Exit Anytime.",
    description:
      "Primary raise funds remain safely locked in an on-chain program escrow. Backers hold 100% redemption rights until the round target is met. If the round falls short, capital is fully returned.",
    component: BackRiskView,
  },
  {
    id: 2,
    number: "03",
    shortLabel: "Liquidity",
    tag: "03 / Instant Liquidity",
    headline1: "Instant Liquidity.",
    headline2: "Trading in One Block.",
    description:
      "Filling the primary raise triggers autonomous migration into a Meteora DLMM pool. Liquidity is permanently locked on-chain—enabling immediate secondary trading without manual market making.",
    component: TradeDexView,
  },
  {
    id: 3,
    number: "04",
    shortLabel: "Dividends",
    tag: "04 / Programmatic Dividends",
    headline1: "Earn Real Yield.",
    headline2: "Direct to Your Wallet.",
    description:
      "Every commercial purchase and secondary trade automatically routes revenue into the on-chain dividend vault. Shareholders claim USDC continuously in real time.",
    component: StreamYieldView,
  },
];

export function WithVentrionSection() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerBounds, setContainerBounds] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 530,
  });
  const [isHoveringContainer, setIsHoveringContainer] = useState<boolean>(false);

  const prevPrimitive = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : CARDS.length - 1));
  }, []);

  const nextPrimitive = useCallback(() => {
    setActiveIndex((prev) => (prev < CARDS.length - 1 ? prev + 1 : 0));
  }, []);

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setContainerBounds({
      width: rect.width,
      height: rect.height,
    });
    setIsHoveringContainer(true);
  };

  const handleContainerMouseLeave = () => {
    setIsHoveringContainer(false);
  };

  const currentCard = CARDS[activeIndex];
  const ActiveVisual = currentCard.component;

  return (
    <section
      id="capabilities-section"
      className="relative w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-24 sm:py-32 select-none"
    >
      {/* Subtle warm ambient glow centered behind stage */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[480px] bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(255,92,24,0.04)_0%,transparent_75%)] blur-3xl pointer-events-none -z-10" />

      {/* 1. SECTION HEADER: Crisp, confident typography */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <h2 className="font-jakarta text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111113] tracking-tight leading-[1.14]">
          Engineered for Real Commerce.
        </h2>

        <p className="font-jakarta text-base sm:text-[17px] text-[#5A5652] mt-3 font-normal leading-relaxed">
          Four native building blocks that turn enterprise revenue into liquid equity and continuous shareholder USDC distributions.
        </p>
      </div>

      {/* 2. GROUNDED ARCHITECTURAL SHOWCASE SURFACE: TALLER WITH FLOATING Z-PLANE HUD OVERLAY */}
      <div className="w-full max-w-[1100px] mx-auto relative">
        {/* FLOATING HUD ON HIGHER Z-INDEX: OVERLAYS CONTAINER ON Z-PLANE (ZERO IN-FLOW PUSH) */}
        <div className="absolute top-8 sm:top-9 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="inline-flex items-center p-1 sm:p-1.5 rounded-full bg-[#FFFFFF] border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(20,15,10,0.08)] gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap overflow-visible select-none">
            {/* Left Chevron */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={prevPrimitive}
              className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#111113] hover:text-[#FF5C18] hover:bg-[#FFF4EE] hover:border-[#FF5C18]/30 transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 border border-black/[0.04] shadow-xs"
              aria-label="Previous Primitive"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </motion.button>

            {/* 4 Floating Tabs: Naturally wide, zero overflow-x, ZERO scrollbar with subtle hover micro-interactions */}
            <div className="flex items-center gap-1 shrink-0 overflow-visible">
              {CARDS.map((card, idx) => {
                const isActive = activeIndex === idx;

                return (
                  <button
                    key={card.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`group relative px-4 sm:px-5 py-2 rounded-full font-jakarta text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive ? "text-white" : "text-[#5A5652] hover:text-[#111113] hover:bg-black/[0.035]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePrimitiveTab"
                        className="absolute inset-0 rounded-full bg-[#111113] shadow-sm"
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold transition-colors duration-200 ${
                          isActive ? "text-[#FF5C18]" : "text-[#8E8B88] group-hover:text-[#FF5C18]"
                        }`}
                      >
                        {card.number}
                      </span>
                      <span>{card.shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Chevron */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={nextPrimitive}
              className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#111113] hover:text-[#FF5C18] hover:bg-[#FFF4EE] hover:border-[#FF5C18]/30 transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 border border-black/[0.04] shadow-xs"
              aria-label="Next Primitive"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          </div>
        </div>

        {/* THE SHOWCASE CONTAINER: TALLER WITH BALANCED PADDING FOR PERFECT VERTICAL CENTERING */}
        <div
          onMouseMove={handleContainerMouseMove}
          onMouseLeave={handleContainerMouseLeave}
          className="relative w-full min-h-[560px] lg:h-[530px] rounded-[32px] sm:rounded-[36px] bg-[#FF5C18] border border-black/[0.06] shadow-[0_24px_64px_-16px_rgba(20,15,10,0.06)] px-8 sm:px-12 lg:px-14 py-12 sm:py-16 overflow-hidden flex items-center justify-center transition-colors duration-500"
        >
          {/* 3D Architectural Crystal Glass Waves Canvas */}
          <GlassWavesCanvas
            activeIndex={activeIndex}
            mousePos={mousePos}
            containerBounds={containerBounds}
            isHovering={isHoveringContainer}
          />

          {/* TWO COLUMN GRID CONTENT: SYNCHRONIZED SIMULTANEOUS TRANSITIONS */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">
            
            {/* LEFT COLUMN: Clean, Elegant Typography with Synchronous Motion & Zero Overlap */}
            <div className="lg:col-span-6 flex flex-col justify-center max-w-lg min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-${activeIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-white block mb-3 cursor-default">
                    {currentCard.tag}
                  </span>

                  <h3 className="font-jakarta text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight leading-[1.18] group cursor-default">
                    <span className="block text-white">
                      {currentCard.headline1}
                    </span>
                    <span className="block text-white">
                      {currentCard.headline2}
                    </span>
                  </h3>

                  <p className="font-jakarta text-base text-white mt-4 font-normal leading-relaxed cursor-default">
                    {currentCard.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* RIGHT COLUMN: Synchronous Motion with Left Side */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full flex items-center justify-center relative min-h-[340px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`visual-${activeIndex}`}
                    initial={{ opacity: 0, y: 10, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.985 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex items-center justify-center"
                  >
                    <ActiveVisual isActive={true} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
