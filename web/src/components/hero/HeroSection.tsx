"use client";

import React from "react";
import { Ventrion3DStudio } from "./Ventrion3DStudio";
import { AnimatedRotatingWord } from "./AnimatedRotatingWord";

interface HeroSectionProps {
  onLaunchClick?: () => void;
  onExploreClick?: () => void;
  singleButtonText?: string;
  onSingleButtonClick?: () => void;
  isLoading?: boolean;
  totalDividends?: number;
}

export function HeroSection({
  onLaunchClick,
  onExploreClick,
  singleButtonText,
  onSingleButtonClick,
}: HeroSectionProps) {
  return (
    <section className="relative w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center select-none py-2 sm:py-4 lg:py-0">
      {/* LEFT COLUMN: Sleek Modern Typographic Content */}
      <div className="lg:col-span-6 flex flex-col justify-center z-10 pr-0 lg:pr-4">
        {/* Animated Rotating Headline */}
        <h1 className="font-jakarta text-3xl sm:text-5xl lg:text-[48px] xl:text-[54px] font-bold text-[#111113] leading-[1.15] tracking-[-0.035em] antialiased">
          <span className="inline-flex items-baseline flex-wrap">
            <span>Tokenize&nbsp;</span>
            <AnimatedRotatingWord
              words={["Companies.", "Startups.", "Creators.", "Webshops.", "Ventures."]}
              intervalMs={5200}
            />
          </span>
          <br />
          <span className="text-[#111113]">Stream Dividends.</span>
        </h1>

        <p className="font-jakarta text-base sm:text-lg lg:text-[18px] text-[#44403C] leading-relaxed max-w-lg mt-5 sm:mt-6 font-normal antialiased">
          The Solana protocol turning commercial revenue into programmatic equity and continuous shareholder USDC distributions.
        </p>

        {/* Action Buttons with rich micro-animations */}
        <div className="mt-8 sm:mt-9 flex flex-wrap items-center gap-4 sm:gap-5 select-none">
          {singleButtonText ? (
            <button
              id="hero-stay-updated-button"
              onClick={onSingleButtonClick}
              className="relative overflow-hidden px-8 py-3.5 rounded-full bg-[#121214] text-white font-jakarta text-[15px] font-medium tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_10px_24px_-4px_rgba(0,0,0,0.16)] flex items-center gap-2.5 cursor-pointer outline-none group"
            >
              {/* Ambient Orange Bloom on hover */}
              <div className="absolute -inset-1 rounded-full bg-[#FF5C18]/35 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

              {/* ORANGE OVERLAY: Sweeps smoothly from LEFT to RIGHT over the black background, underneath text */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B35] via-[#FF5C18] to-[#FA5416] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left -translate-x-full group-hover:translate-x-0 pointer-events-none" />

              {/* Text & Arrow on top */}
              <span className="relative z-10 font-semibold tracking-tight">{singleButtonText}</span>
              <span className="relative z-10 text-base font-normal leading-none inline-block transition-transform duration-200 group-hover:translate-y-1">
                ↓
              </span>
            </button>
          ) : (
            <>
              <button
                id="hero-launch-button"
                onClick={onLaunchClick}
                className="relative overflow-hidden px-6 py-3 rounded-full bg-[#121214] text-white font-jakarta text-[14.5px] font-medium tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_6px_20px_-4px_rgba(0,0,0,0.14)] flex items-center gap-2 cursor-pointer outline-none group"
              >
                {/* Ambient Orange Bloom on hover */}
                <div className="absolute -inset-1 rounded-full bg-[#FF5C18]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* ORANGE OVERLAY: Sweeps smoothly from LEFT to RIGHT over the black background, underneath text */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B35] via-[#FF5C18] to-[#FA5416] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left -translate-x-full group-hover:translate-x-0 pointer-events-none" />

                {/* Text & Arrow on top */}
                <span className="relative z-10 font-semibold tracking-tight">Launch a Venture</span>
                <span className="relative z-10 text-base font-normal leading-none inline-block transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>

              <button
                onClick={onExploreClick}
                className="px-5 py-3 rounded-full font-jakarta text-[14.5px] font-medium text-[#1A1817] hover:text-black hover:bg-white/80 bg-white/40 border border-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer outline-none"
              >
                How It Works
              </button>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: 100% Procedural 3D WebGL Studio */}
      <div className="lg:col-span-6 relative w-full h-[400px] sm:h-[460px] lg:h-[500px] xl:h-[520px] flex items-center justify-center z-10 overflow-visible">
        {/* Subtle ground reflection & ambient spotlight behind 3D stage */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_52%_48%,rgba(255,255,255,0.70)_0%,rgba(250,246,240,0.20)_60%,transparent_100%)] pointer-events-none -z-10" />
        <Ventrion3DStudio className="w-full h-full" />
      </div>
    </section>
  );
}
