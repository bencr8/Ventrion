"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "../components/common/Navbar";
import { HeroSection } from "../components/hero/HeroSection";
import { WithVentrionSection } from "../components/capabilities/WithVentrionSection";
import { WhyVentrionVideo } from "../components/home/WhyVentrionVideo";
import { VentTokenSection } from "../components/home/VentTokenSection";
import { SocialsSection } from "../components/home/SocialsSection";
import { StayUpdatedSection } from "../components/home/StayUpdatedSection";
import { SolanaPayModal } from "../components/checkout/SolanaPayModal";
import { INITIAL_VENTRION_STATE, VentrionState } from "../lib/ventrionClient";

export default function Home() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const state = INITIAL_VENTRION_STATE;

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] relative overflow-x-clip flex flex-col justify-between selection:bg-[#F68D66]/20 font-jakarta">
      {/* Studio Overhead Lighting Effects */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-[1700px] h-[950px] bg-[radial-gradient(ellipse_85%_60%_at_62%_-5%,rgba(255,255,255,1)_0%,rgba(255,251,245,0.75)_35%,rgba(252,246,238,0.28)_65%,transparent_100%)] pointer-events-none -z-0" />
      <div className="absolute -top-20 right-[10%] w-[900px] h-[900px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95)_0%,rgba(255,248,238,0.45)_40%,transparent_75%)] blur-2xl pointer-events-none -z-0" />
      <div className="absolute top-1/4 -left-36 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#F4ECE2]/50 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* 1. NAVBAR WITH REAL SOLANA WALLET */}
      <Navbar />

      {/* 2. MAIN CONTENT STACK */}
      <main className="flex-1 flex flex-col items-center w-full z-10 relative">
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500 relative">
          
          {/* HERO SECTION */}
          <section className="w-full min-h-[600px] lg:min-h-[calc(100vh-80px)] lg:max-h-[820px] flex items-center justify-center py-4 sm:py-6 relative">
            <HeroSection
              onLaunchClick={() => {
                const el = document.getElementById("capabilities-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              onExploreClick={() => {
                const el = document.getElementById("capabilities-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              totalDividends={INITIAL_VENTRION_STATE.totalDividendsDistributedUsdc}
            />
          </section>

          {/* 4 CAPABILITY PILLARS */}
          <section id="capabilities-section" className="w-full relative">
            <WithVentrionSection />
          </section>

          {/* Official announcement video */}
          <WhyVentrionVideo />

          {/* $VENT mother token staking & fee calculation section */}
          <VentTokenSection />

          {/* SOCIALS & ECOSYSTEM COMMUNITY */}
          <SocialsSection />

          {/* STAY UPDATED / WAITLIST SECTION */}
          <StayUpdatedSection />

        </div>
      </main>

      {/* 3. MINIMAL CLEAN PROTOCOL FOOTER */}
      <footer className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8E8B88] font-jakarta border-t border-black/[0.04] z-10 select-none">
        <div className="flex items-center gap-2">
          <span>© 2026 Ventrion Protocol. Built on Solana.</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Programmatic Dividends</span>
          <span className="inline-block w-1 h-1 rounded-full bg-black/20" />
          <span>Milestone Escrow Protection</span>
          <span className="inline-block w-1 h-1 rounded-full bg-black/20" />
          <span>Instant Shareholder Payouts</span>
        </div>
      </footer>

      {/* MODALS */}
      <SolanaPayModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={() => {}}
        priceUsdc={state.productPriceUsdc}
        cogsUsdc={state.productCogsUsdc}
      />
    </div>
  );
}
