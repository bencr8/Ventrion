"use client";

import React, { useState, useEffect, useRef } from "react";
import { PureGlassVToken } from "./PureGlassVToken";

interface Ventrion3DStudioProps {
  className?: string;
}

// Currencies
type CurrencyCode = "USD" | "EUR" | "SOL" | "GBP";

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number;
  format: (amount: number) => string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    rate: 1.0,
    format: (amt) => `$${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    rate: 0.92,
    format: (amt) => `€${(amt * 0.92).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  SOL: {
    code: "SOL",
    symbol: "◎",
    rate: 0.0074,
    format: (amt) => `${(amt * 0.0074).toFixed(2)} SOL`,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    rate: 0.79,
    format: (amt) => `£${(amt * 0.79).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
};

export function Ventrion3DStudio({ className = "" }: Ventrion3DStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const chartPathRef = useRef<SVGPathElement>(null);

  // Initial Loading & Skeleton State (~1.2s on initial load)
  const [isLoading, setIsLoading] = useState(true);

  // Mouse & 3D Parallax State
  const [mouse, setMouse] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [time, setTime] = useState(0);

  // Butter-Smooth Continuous Scrubber Physics State
  const [scrubberX, setScrubberX] = useState(220); // Default to peak (~$1,000)
  const [scrubberY, setScrubberY] = useState(22);

  const currentXRef = useRef(220);
  const targetXRef = useRef(220);
  const velocityRef = useRef(0);
  const idleDirRef = useRef(1); // 1 = right, -1 = left
  const isHoveringRef = useRef(false);
  const lastLeaveTimeRef = useRef(0);
  const freezeXRef = useRef(220);

  // Live Animated Price State (with Bezier / smooth lerp decimals)
  const [displayPrice, setDisplayPrice] = useState(1000.0);
  const targetPriceRef = useRef(1000.0);
  const displayPriceRef = useRef(1000.0);

  // Curve LUT (Look-Up Table) for 100% exact Y calculation from the rendered SVG path
  const curveLutRef = useRef<Float32Array | null>(null);

  // Currency Dropdown State
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Initial Skeleton Loader Timer (Runs for 1.25s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1250);
    return () => clearTimeout(timer);
  }, []);

  // 2. Build Precomputed Curve Lookup Table from Rendered SVG Path
  useEffect(() => {
    if (!chartPathRef.current) return;
    try {
      const path = chartPathRef.current;
      const totalLen = path.getTotalLength();
      const lut = new Float32Array(341);
      const samples = 1200;

      for (let i = 0; i <= samples; i++) {
        const pt = path.getPointAtLength((i / samples) * totalLen);
        const x = Math.round(pt.x);
        if (x >= 0 && x <= 340) {
          lut[x] = pt.y;
        }
      }

      for (let x = 1; x <= 340; x++) {
        if (lut[x] === 0 && x > 0 && x < 340) {
          lut[x] = lut[x - 1];
        }
      }

      curveLutRef.current = lut;
    } catch {
      // Fallback
    }
  }, []);

  // Helper to evaluate exact Y for any continuous X
  const getCurveY = (x: number): number => {
    const clampedX = Math.max(0, Math.min(340, x));
    if (curveLutRef.current) {
      const x0 = Math.floor(clampedX);
      const x1 = Math.min(340, Math.ceil(clampedX));
      const frac = clampedX - x0;
      return curveLutRef.current[x0] * (1 - frac) + curveLutRef.current[x1] * frac;
    }
    return 60 - Math.sin((clampedX / 340) * Math.PI) * 38;
  };

  // Helper to calculate target price in USD based on exact curve position
  const calculatePriceUsd = (x: number, y: number): number => {
    const base = 350;
    const heightBonus = (92 - y) * 7.8;
    const progressBonus = (x / 340) * 85;
    return base + heightBonus + progressBonus;
  };

  // 3. Mouse Tracking, 3D Tilt Lerp, Butter-Smooth Scrubber Physics & Deceleration Loop
  useEffect(() => {
    let animId: number;
    let t = 0;
    let lastTime = performance.now();

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const nx = (e.clientX - centerX) / (window.innerWidth / 2);
      const ny = (e.clientY - centerY) / (window.innerHeight / 2);
      setMouse((prev) => ({
        ...prev,
        targetX: Math.max(-1, Math.min(1, nx)),
        targetY: Math.max(-1, Math.min(1, ny)),
      }));
    };

    const onMouseLeave = () => {
      setMouse((prev) => ({ ...prev, targetX: 0, targetY: 0 }));
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const loop = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      t += 0.02;
      setTime(t);

      // Smooth mouse lerp
      setMouse((prev) => ({
        ...prev,
        x: prev.x + (prev.targetX - prev.x) * 0.06,
        y: prev.y + (prev.targetY - prev.y) * 0.06,
      }));

      // BUTTER-SMOOTH SCRUBBER PHYSICS (NEVER TELEPORTS, ALWAYS SMOOTH DECELERATION):
      if (isHoveringRef.current) {
        // Active Hovering: Smooth exponential spring tracking towards targetX
        const diff = targetXRef.current - currentXRef.current;
        const followRate = 1 - Math.exp(-22.0 * dt);
        const step = diff * followRate;
        currentXRef.current += step;
        
        // Soft-clamped velocity to avoid spikes on quick cursor flick:
        const rawVel = dt > 0 ? step / dt : 0;
        velocityRef.current = Math.max(-280, Math.min(280, rawVel));
        if (diff > 0.6) idleDirRef.current = 1;
        else if (diff < -0.6) idleDirRef.current = -1;
        freezeXRef.current = currentXRef.current;
      } else {
        const timeSinceLeave = currentTime - lastLeaveTimeRef.current;

        if (timeSinceLeave < 300) {
          // Phase 1: Smooth Deceleration ("smooth ENDEN / ausfaden")
          velocityRef.current *= Math.exp(-14.0 * dt);
          currentXRef.current += velocityRef.current * dt;
          currentXRef.current = Math.max(16, Math.min(324, currentXRef.current));
          freezeXRef.current = currentXRef.current;
        } else if (timeSinceLeave < 2000) {
          // Phase 2: Exact 2-Second Freeze strictly at that spot
          currentXRef.current = freezeXRef.current;
          velocityRef.current = 0;
        } else {
          // Phase 3: Smooth Idle Wandering resuming from the current spot!
          const resumeElapsed = (timeSinceLeave - 2000) / 1000;
          const ramp = Math.min(1.0, resumeElapsed / 0.8);
          const speed = 44 * ramp; // pixels per second
          let nextX = currentXRef.current + idleDirRef.current * speed * dt;

          if (nextX >= 322) {
            nextX = 322;
            idleDirRef.current = -1;
          } else if (nextX <= 18) {
            nextX = 18;
            idleDirRef.current = 1;
          }
          currentXRef.current = nextX;
          freezeXRef.current = nextX;
        }
      }

      // Update Scrubber Position & Curve Locking
      const currentY = getCurveY(currentXRef.current);
      setScrubberX(currentXRef.current);
      setScrubberY(currentY);
      targetPriceRef.current = calculatePriceUsd(currentXRef.current, currentY);

      // Smooth Bezier / Spring price count animation with live decimals
      const priceDiff = targetPriceRef.current - displayPriceRef.current;
      displayPriceRef.current += priceDiff * Math.min(1.0, 14.0 * dt);
      setDisplayPrice(displayPriceRef.current);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 4. Close currency dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Continuous Chart Hover / Scrubbing handler
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    isHoveringRef.current = true;

    const rect = chartSvgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 340;
    const svgX = Math.max(16, Math.min(324, rawX));
    targetXRef.current = svgX; // Sets target smoothly, NEVER snaps directly!
  };

  const handleChartMouseLeave = () => {
    if (isHoveringRef.current) {
      isHoveringRef.current = false;
      lastLeaveTimeRef.current = performance.now();
    }
  };

  // Base 3D rotation angles matching the reference mockup
  const baseRotX = 6;
  const baseRotY = -12;
  const baseRotZ = -1.5;

  const currentRotX = baseRotX - mouse.y * 10;
  const currentRotY = baseRotY + mouse.x * 12;
  const currentRotZ = baseRotZ + mouse.x * 1.5;

  // Floating offsets
  const cardFloatY = Math.sin(time * 0.8) * 3;
  const pill1FloatY = Math.sin(time * 1.3 + 1.2) * 3.5;
  const pill2FloatY = Math.cos(time * 1.1 + 2.0) * 3;
  const tokenFloatY = Math.sin(time * 1.2 + 0.6) * 4.5;

  const activeCurrencyConfig = CURRENCIES[currency];
  const formattedPrice = activeCurrencyConfig.format(displayPrice);

  // Dynamic light reflection coordinates based on 3D mouse rotation
  const reflectionX = (mouse.x + 1) * 50;
  const reflectionY = (mouse.y + 1) * 45;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
      style={{ perspective: "1400px" }}
    >
      {/* 3D SCENE ROOT */}
      <div
        className="relative transition-transform duration-75 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg) rotateZ(${currentRotZ}deg)`,
        }}
      >
        {/* WIDE DIFFUSE STUDIO DROP SHADOW BEHIND CARD */}
        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[520px] h-[170px] bg-[#3B2518]/12 blur-3xl rounded-full pointer-events-none"
          style={{ transform: "translateZ(-30px)" }}
        />

        {/* 1. TOP FLOATING GLASS PILL ("1,000 Shares • On-Chain Governance") */}
        <div
          className="absolute -top-7 right-8 sm:right-10 z-30 pointer-events-none"
          style={{
            transform: `translate3d(0, ${pill2FloatY}px, 45px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Soft shadow under top pill */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[85%] h-4 bg-black/10 blur-md rounded-full" />

          {/* Frosted Glass Body with 3D Light Sweep */}
          <div
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full flex items-center justify-center whitespace-nowrap relative overflow-hidden"
            style={{
              background: `linear-gradient(${135 + mouse.x * 25}deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.52) 100%)`,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1.5px solid rgba(255, 255, 255, 0.95)",
              boxShadow: `
                0 14px 28px -6px rgba(45, 30, 20, 0.10),
                0 4px 10px -2px rgba(0, 0, 0, 0.04),
                inset ${mouse.x * 3}px 1.5px 0 0 rgba(255, 255, 255, 1)
              `,
            }}
          >
            {/* 3D Light Sweep Beam */}
            <div className="absolute -inset-x-10 -inset-y-5 pointer-events-none overflow-hidden rounded-full">
              <div className="w-16 h-28 absolute top-[-20px] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-xs pointer-events-none animate-light-sweep-delayed" />
            </div>

            <span className="text-[11.5px] sm:text-[12px] font-semibold text-[#221F1E] tracking-tight font-jakarta relative z-10">
              1,000 Shares • On-Chain Governance
            </span>
          </div>
        </div>

        {/* 2. MAIN DASHBOARD CARD WITH FROSTED GLASS BEZEL TRAY */}
        <div
          className="relative w-[440px] sm:w-[485px] h-[300px] sm:h-[318px] rounded-[34px] p-2.5 sm:p-3 overflow-hidden"
          style={{
            transform: `translate3d(0, ${cardFloatY}px, 0px)`,
            transformStyle: "preserve-3d",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.40) 100%)",
            backdropFilter: "blur(26px)",
            WebkitBackdropFilter: "blur(26px)",
            border: "1.5px solid rgba(255, 255, 255, 0.92)",
            boxShadow: `
              0 35px 70px -15px rgba(50, 35, 25, 0.14),
              0 15px 30px -8px rgba(0, 0, 0, 0.06),
              inset ${mouse.x * 5}px ${mouse.y * 4 + 2}px 0 0 rgba(255, 255, 255, 1)
            `,
          }}
        >
          {/* 3D Light Sweep across bezel tray */}
          <div className="absolute -inset-x-20 -inset-y-20 pointer-events-none z-30 overflow-hidden rounded-[40px]">
            <div className="w-[160px] h-[550px] absolute top-[-80px] bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm pointer-events-none animate-light-sweep" />
          </div>

          {/* Dynamic Light Sweep on Bezel Tray */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[34px]"
            style={{
              background: `radial-gradient(circle at ${reflectionX}% ${reflectionY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 80%)`,
            }}
          />

          {/* INNER PURE WHITE CRISP UI CARD */}
          <div
            className="w-full h-full rounded-[24px] bg-[#FFFFFF] shadow-sm flex overflow-hidden border border-black/[0.04] relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Specular Sheen across inner white card */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-40"
              style={{
                background: `radial-gradient(ellipse at ${reflectionX}% ${reflectionY}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 65%)`,
              }}
            />

            {/* LEFT SIDEBAR PANEL (Buttons moved UP with rich hover micro-interactions) */}
            <div className="w-[64px] sm:w-[70px] bg-[#F7F5F0] border-r border-black/[0.05] flex flex-col items-center pt-3.5 pb-2 justify-start gap-2.5 shrink-0 relative z-20">
              {/* Brand "V" Mark */}
              <div className="w-7 h-7 rounded-lg bg-[#111113] flex items-center justify-center p-1 mb-0.5 shadow-2xs hover:scale-105 transition-transform">
                <img
                  src="/ventrion-logo.png"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.indexOf("/ventrion/ventrion-logo.png") === -1) {
                      target.src = "/ventrion/ventrion-logo.png";
                    }
                  }}
                  alt="V"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 1. Active Bar Chart Pill Button */}
              <div
                className="w-9 h-9 rounded-xl bg-[#111113] flex items-center justify-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group hover:bg-[#252528]"
                title="Active Portfolio Metrics"
              >
                <div className="w-[2.5px] h-3 bg-white rounded-full group-hover:h-4.5 transition-all" />
                <div className="w-[2.5px] h-5 bg-white rounded-full group-hover:h-3.5 transition-all" />
                <div className="w-[2.5px] h-3.5 bg-white rounded-full group-hover:h-5 transition-all" />
              </div>

              {/* 2. Document Outline Button with rich hover pill */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#787470] hover:text-[#111113] hover:bg-black/[0.07] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Smart Contract Charter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>

              {/* 3. Settings Cog Button with rotational hover */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#787470] hover:text-[#111113] hover:bg-black/[0.07] hover:rotate-45 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Milestone Escrow Governance"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden z-20">
              {/* SKELETON LOADER OVERLAY (Active during initial ~1.2s load) */}
              {isLoading && (
                <div className="absolute inset-0 bg-white z-40 p-5 sm:p-6 flex flex-col justify-between transition-opacity duration-500 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="w-28 h-4 rounded-md animate-shimmer" />
                    <div className="w-6 h-6 rounded-full animate-shimmer" />
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <div className="w-48 sm:w-56 h-9 rounded-xl animate-shimmer mb-2" />
                      <div className="w-16 h-3.5 rounded-md animate-shimmer" />
                    </div>
                    <div className="w-20 h-7 rounded-full animate-shimmer" />
                  </div>
                  {/* Chart Skeleton Wave Placeholder */}
                  <div className="w-full h-[95px] sm:h-[105px] mt-auto relative flex items-end">
                    <div className="w-full h-16 rounded-2xl animate-shimmer opacity-60" />
                  </div>
                </div>
              )}

              {/* LIVE DASHBOARD CONTENT */}
              {/* Header: Title & Simple Non-Bouncing Notification Bell */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-semibold text-[#55504C] tracking-tight font-jakarta">
                  Equity Distribution
                </span>

                {/* Simple Notification Bell: Subtle hover background, no jumping, no function */}
                <div
                  className="relative text-[#66605A] hover:text-[#111113] p-1.5 rounded-xl hover:bg-black/[0.04] transition-colors cursor-default"
                  title="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span className="w-2 h-2 rounded-full bg-[#FF5C18] absolute top-1 right-1 ring-2 ring-white" />
                </div>
              </div>

              {/* Balance & Sleek Interactive Currency Selector Row */}
              <div className="flex items-baseline justify-between mt-1 relative z-20">
                <div>
                  {/* Clean Animated Bezier Price with Full Decimals */}
                  <h3 className="text-3xl sm:text-[34px] font-extrabold text-[#111113] tracking-tight leading-none font-jakarta tabular-nums">
                    {formattedPrice}
                  </h3>
                  {/* Clean subtitle: ONLY "Shares" */}
                  <p className="text-[12px] font-medium text-[#787470] mt-1 tracking-tight font-jakarta">
                    Shares
                  </p>
                </div>

                {/* INTERACTIVE CURRENCY SELECTOR PILL (USD, EUR, SOL, GBP) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F2EE] hover:bg-[#EBE7E1] border border-black/[0.06] text-[12px] font-semibold text-[#111113] shadow-2xs hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer"
                  >
                    <span>{currency}</span>
                    <span className={`text-[10px] text-black/60 transition-transform ${isCurrencyDropdownOpen ? "rotate-180" : ""}`}>
                      ⌵
                    </span>
                  </button>

                  {/* Frosted Dropdown Menu */}
                  {isCurrencyDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-28 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_12px_28px_rgba(0,0,0,0.12)] py-1.5 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      {(["USD", "EUR", "SOL", "GBP"] as CurrencyCode[]).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => {
                            setCurrency(cur);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            currency === cur ? "bg-[#FF5C18]/10 text-[#FF5C18]" : "text-[#221F1E] hover:bg-black/[0.04]"
                          }`}
                        >
                          <span>{cur}</span>
                          <span className="text-[11px] font-medium opacity-60">
                            {CURRENCIES[cur].symbol}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* HORIZONTAL SUBTLE GRID LINES */}
              <div className="absolute inset-x-5 sm:inset-x-6 top-[155px] sm:top-[165px] flex flex-col gap-[28px] pointer-events-none opacity-40">
                <div className="w-full h-px bg-black/[0.08]" />
                <div className="w-full h-px bg-black/[0.08]" />
                <div className="w-full h-px bg-black/[0.08]" />
              </div>

              {/* BUTTER-SMOOTH INTERACTIVE PEACH WAVE CHART */}
              {/* Continuous physics interpolation, never teleports, smooth deceleration */}
              <div className="relative w-full h-[95px] sm:h-[105px] mt-auto">
                <svg
                  ref={chartSvgRef}
                  viewBox="0 0 340 100"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible cursor-crosshair"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                >
                  <defs>
                    {/* Saturated Warm Peach Gradient Fill */}
                    <linearGradient id="waveGradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.45" />
                      <stop offset="45%" stopColor="#FFA07A" stopOpacity="0.20" />
                      <stop offset="85%" stopColor="#FFC4A8" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#FFC4A8" stopOpacity="0.0" />
                    </linearGradient>

                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#FF5C18" floodOpacity="0.55" />
                    </filter>
                  </defs>

                  {/* Clean Hit Target Overlay for full bounding box coverage */}
                  <rect x="0" y="0" width="340" height="100" fill="transparent" className="cursor-crosshair" />

                  {/* Gradient Area Fill under wave */}
                  <path
                    d="M 0 85 Q 40 92, 80 82 T 160 76 T 220 22 T 270 54 T 340 60 L 340 100 L 0 100 Z"
                    fill="url(#waveGradientFill)"
                    className="pointer-events-none"
                  />

                  {/* Saturated Peach Wave Line */}
                  <path
                    ref={chartPathRef}
                    d="M 0 85 Q 40 92, 80 82 T 160 76 T 220 22 T 270 54 T 340 60"
                    fill="none"
                    stroke="#FF5C18"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  />

                  {/* CONTINUOUS SCRUBBER: VERTICAL DASHED LINE + POINT DIRECTLY ON CHART */}
                  <g transform={`translate(${scrubberX}, 0)`} className="pointer-events-none">
                    {/* Animated Marching Dashed Vertical Line */}
                    <line
                      x1="0"
                      y1="6"
                      x2="0"
                      y2="98"
                      stroke="#FF5C18"
                      strokeWidth="2.0"
                      strokeDasharray="4 3"
                      strokeOpacity="0.9"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-14"
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </line>

                    {/* Glowing Soft Aura Halo exactly at (0, scrubberY) */}
                    <circle
                      cx="0"
                      cy={scrubberY}
                      r="13"
                      fill="#FF5C18"
                      fillOpacity="0.18"
                    />

                    {/* Concentric Pulsing Ring */}
                    <circle
                      cx="0"
                      cy={scrubberY}
                      r="9"
                      fill="none"
                      stroke="#FF5C18"
                      strokeWidth="1.2"
                      strokeOpacity="0.5"
                    />

                    {/* Solid Intersection Dot 100% Directly On The Chart Curve */}
                    <circle
                      cx="0"
                      cy={scrubberY}
                      r="5.5"
                      fill="#FFFFFF"
                      stroke="#FF5C18"
                      strokeWidth="2.8"
                      filter="url(#nodeGlow)"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FOREGROUND FROSTED GLASS PILL ("Ventrion / Enterprise • Equity Token") */}
        <div
          className="absolute -bottom-3 sm:-bottom-4 -right-2 sm:-right-6 z-40"
          style={{
            transform: `translate3d(0, ${pill1FloatY}px, 65px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Subtle contact drop-shadow onto the card behind it */}
          <div className="absolute -bottom-3 left-4 w-[90%] h-8 bg-[#3B2518]/15 blur-lg rounded-2xl pointer-events-none" />

          {/* Frosted Glass Body with Real 3D Light Sweep */}
          <div
            className="w-[205px] sm:w-[225px] px-5 py-3.5 rounded-[20px] relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at ${50 + mouse.x * 40}% ${40 + mouse.y * 40}%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.38) 60%, rgba(255, 255, 255, 0.20) 100%)`,
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1.5px solid rgba(255, 255, 255, 0.95)",
              boxShadow: `
                0 22px 45px -10px rgba(50, 32, 22, 0.16),
                0 6px 16px -4px rgba(0, 0, 0, 0.06),
                inset ${mouse.x * 4}px 2px 0 0 rgba(255, 255, 255, 1)
              `,
            }}
          >
            {/* Real 3D Light Sweep Beam */}
            <div className="absolute -inset-x-10 -inset-y-5 pointer-events-none overflow-hidden rounded-[20px]">
              <div className="w-20 h-32 absolute top-[-10px] bg-gradient-to-r from-transparent via-white/70 to-transparent blur-xs pointer-events-none animate-light-sweep" />
            </div>

            <h4 className="text-[16px] sm:text-[17px] font-extrabold text-[#111113] tracking-tight leading-tight font-jakarta relative z-10">
              Ventrion
            </h4>
            <p className="text-[11.5px] sm:text-[12px] font-medium text-[#44403C] tracking-tight mt-1 font-jakarta relative z-10">
              Enterprise • Equity Token
            </p>
          </div>
        </div>

        {/* 4. 3D "V" TOKEN: REAL MILKY WHITE OPTICAL GLASS WITH INTERACTIVE DRAG */}
        <div
          className="absolute -bottom-10 -left-10 sm:-bottom-12 sm:-left-12 z-40 pointer-events-auto"
          style={{
            transform: `translate3d(0, ${tokenFloatY}px, 95px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Subtle soft contact shadow far underneath the 3D glass token */}
          <div className="absolute -bottom-8 -left-4 w-44 sm:w-50 h-10 rounded-[100%] bg-[#382418]/04 blur-2xl pointer-events-none transform -rotate-3" />
          {/* Subtle warm peach glow behind the "V" emblem */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#FF6B35]/06 blur-xl pointer-events-none" />

          {/* Three.js Real Optical Crystal Glass 3D Token with 3D Pop-Up Animation & Cursor Drag */}
          <PureGlassVToken />
        </div>
      </div>
    </div>
  );
}
