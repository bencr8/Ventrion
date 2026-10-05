"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Twitter, ArrowDown } from "lucide-react";

export function TransitionNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToStayUpdated = () => {
    const el = document.getElementById("stay-updated");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full select-none transition-all duration-300 ease-out ${
        isScrolled
          ? "bg-[#FAF7F2]/90 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] py-3 sm:py-3.5"
          : "bg-transparent border-b border-transparent py-4 sm:py-5"
      }`}
    >
      <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 flex items-center justify-between relative">
        {/* Ambient Top Light Line */}
        <div
          className={`absolute inset-x-10 -top-4 sm:-top-5 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none transition-opacity duration-300 ${
            isScrolled ? "opacity-30" : "opacity-100"
          }`}
        />

        {/* LEFT CLUSTER: LOGO + STATUS BADGE */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-[10px] bg-[#111113] flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_3px_10px_rgba(253,107,59,0.18)] group-hover:scale-105 transition-all overflow-hidden p-1.5">
              <img
                src="/preview/ventrion-logo.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/ventrion-logo.png";
                }}
                alt="Ventrion Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              />
            </div>
            <span className="font-jakarta text-[20px] font-bold text-[#111113] tracking-tight leading-none">
              Ventrion
            </span>
          </Link>

          {/* STATUS PILL BADGE */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.05] text-[12px] font-medium text-[#6E6964]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C18]" />
            <span>Private Alpha In Development</span>
          </div>
        </div>

        {/* RIGHT CLUSTER: X LINK + STAY UPDATED CTA */}
        <div className="flex items-center gap-3">
          {/* TWITTER / X BUTTON */}
          <a
            href="https://x.com/VentrionLabs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full font-jakarta text-[13px] font-medium text-[#1A1817] hover:text-black hover:bg-white/90 bg-white/50 border border-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer outline-none"
          >
            <Twitter className="w-3.5 h-3.5 fill-[#111113]" />
            <span className="hidden xs:inline">Follow on X</span>
            <span className="text-xs text-[#8E8B88]">↗</span>
          </a>

          {/* STAY UPDATED SCROLL BUTTON */}
          <button
            onClick={scrollToStayUpdated}
            className="px-4 sm:px-5 py-2 rounded-full font-jakarta text-[13px] font-semibold text-white bg-[#111113] hover:bg-[#FF5C18] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer outline-none"
          >
            <span>Stay Updated</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
