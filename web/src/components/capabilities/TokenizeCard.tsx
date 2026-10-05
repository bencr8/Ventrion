"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import {
  Layers,
  Cpu,
  Sparkles,
  Percent,
  Sliders,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  FileCode,
  Zap,
  Building2,
  CircleDollarSign,
  Scale,
  ChevronDown,
  ChevronUp,
  Check,
  PieChart,
  Boxes,
  Activity,
  Info,
} from "lucide-react";

export interface TokenizeCardProps {
  isExpanded?: boolean;
  onActivate?: () => void;
  className?: string;
}

const TOTAL_SHARES = 1_000_000;
const QUORUM_THRESHOLD_SHARES = 510_000; // 51% anti-rugpull quorum

const EQUITY_PRESETS = [
  { label: "10%", value: 10, tag: "Micro" },
  { label: "15%", value: 15, tag: "Angel" },
  { label: "20%", value: 20, tag: "Canonical" },
  { label: "25%", value: 25, tag: "Seed" },
  { label: "33%", value: 33, tag: "Syndicate" },
  { label: "40%", value: 40, tag: "Cap Max" },
];

const CAPITAL_PRESETS = [
  { label: "$100k", value: 100_000 },
  { label: "$200k", value: 200_000 },
  { label: "$350k", value: 350_000 },
  { label: "$500k", value: 500_000 },
];

export function TokenizeCard({
  isExpanded = false,
  onActivate,
  className = "",
}: TokenizeCardProps) {
  // Internal fallback expansion state
  const [internalExpanded, setInternalExpanded] = useState(false);
  const activeExpanded = isExpanded || internalExpanded;

  // Interactive Parameter State
  const [equityPct, setEquityPct] = useState<number>(20); // 10% to 40%
  const [targetRaise, setTargetRaise] = useState<number>(200_000); // $50k to $1M
  const [visualizerMode, setVisualizerMode] = useState<"ring" | "stack">("ring");
  const [hoveredSlice, setHoveredSlice] = useState<"founder" | "round" | null>(null);

  // Mint Simulation State
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<number>(0);
  const [mintComplete, setMintComplete] = useState(false);

  // 3D Parallax Tilt with Framer Motion Springs
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 22 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const tiltRotateX = useTransform(smoothMouseY, [-0.5, 0.5], [7, -7]);
  const tiltRotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);
  const badgeTranslateZ = useTransform(smoothMouseY, [-0.5, 0.5], [12, -12]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setHoveredSlice(null);
  }, [mouseX, mouseY]);

  // Derived Financials & Share Mechanics
  const roundShares = useMemo(
    () => Math.round((TOTAL_SHARES * equityPct) / 100),
    [equityPct]
  );
  const founderShares = useMemo(
    () => TOTAL_SHARES - roundShares,
    [roundShares]
  );
  const founderPct = 100 - equityPct;
  const impliedValuation = useMemo(
    () => Math.round(targetRaise / (equityPct / 100)),
    [targetRaise, equityPct]
  );
  const sharePrice = useMemo(
    () => targetRaise / roundShares,
    [targetRaise, roundShares]
  );
  const founderMarginOverQuorum = useMemo(
    () => founderShares - QUORUM_THRESHOLD_SHARES,
    [founderShares]
  );

  // Milestone Tranches
  const tranche1Usdc = useMemo(() => Math.round(targetRaise * 0.3), [targetRaise]);
  const tranche2Usdc = useMemo(() => Math.round(targetRaise * 0.35), [targetRaise]);
  const tranche3Usdc = useMemo(() => Math.round(targetRaise * 0.35), [targetRaise]);

  // Toggle Expansion Handler
  const handleToggleExpand = () => {
    if (onActivate) {
      onActivate();
    }
    setInternalExpanded((prev) => !prev);
  };

  // Simulated 60-Second SPL Token Mint Execution
  const triggerMintSimulation = () => {
    if (isMinting) return;
    setIsMinting(true);
    setMintStep(1);
    setMintComplete(false);

    const t1 = setTimeout(() => setMintStep(2), 700);
    const t2 = setTimeout(() => setMintStep(3), 1400);
    const t3 = setTimeout(() => setMintStep(4), 2100);
    const t4 = setTimeout(() => {
      setIsMinting(false);
      setMintComplete(true);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  // 3D Isometric Donut Geometry Calculation
  const donutPaths = useMemo(() => {
    const cx = 175;
    const cy = 110;
    const Rx = 112;
    const Ry = 54;
    const rx = 64;
    const ry = 31;
    const D = 22; // extrusion depth

    const startAngle = 0.22; // ~12.6 degrees (places round slice clearly on front right)
    const sweepAngle = (equityPct / 100) * Math.PI * 2;
    const endAngle = startAngle + sweepAngle;

    const ptOut = (a: number) => ({
      x: cx + Rx * Math.cos(a),
      y: cy + Ry * Math.sin(a),
    });
    const ptIn = (a: number) => ({
      x: cx + rx * Math.cos(a),
      y: cy + ry * Math.sin(a),
    });

    // 1. Round Slice Top Face
    const roundDelta = sweepAngle;
    const roundLarge = roundDelta > Math.PI ? 1 : 0;
    const p1Out = ptOut(startAngle);
    const p2Out = ptOut(endAngle);
    const p1In = ptIn(startAngle);
    const p2In = ptIn(endAngle);

    const roundTop = `M ${p1Out.x.toFixed(2)} ${p1Out.y.toFixed(2)} A ${Rx} ${Ry} 0 ${roundLarge} 1 ${p2Out.x.toFixed(2)} ${p2Out.y.toFixed(2)} L ${p2In.x.toFixed(2)} ${p2In.y.toFixed(2)} A ${rx} ${ry} 0 ${roundLarge} 0 ${p1In.x.toFixed(2)} ${p1In.y.toFixed(2)} Z`;

    // 2. Founder Slice Top Face
    const founderDelta = Math.PI * 2 - sweepAngle;
    const founderLarge = founderDelta > Math.PI ? 1 : 0;
    const founderTop = `M ${p2Out.x.toFixed(2)} ${p2Out.y.toFixed(2)} A ${Rx} ${Ry} 0 ${founderLarge} 1 ${p1Out.x.toFixed(2)} ${p1Out.y.toFixed(2)} L ${p1In.x.toFixed(2)} ${p1In.y.toFixed(2)} A ${rx} ${ry} 0 ${founderLarge} 0 ${p2In.x.toFixed(2)} ${p2In.y.toFixed(2)} Z`;

    // 3. Round Front Extruded Wall
    const roundWall = `M ${p1Out.x.toFixed(2)} ${p1Out.y.toFixed(2)} A ${Rx} ${Ry} 0 ${roundLarge} 1 ${p2Out.x.toFixed(2)} ${p2Out.y.toFixed(2)} L ${p2Out.x.toFixed(2)} ${(p2Out.y + D).toFixed(2)} A ${Rx} ${Ry} 0 ${roundLarge} 0 ${p1Out.x.toFixed(2)} ${(p1Out.y + D).toFixed(2)} Z`;

    // 4. Founder Front Left Wall (from endAngle to Math.PI)
    const pPiOut = ptOut(Math.PI);
    const leftDelta = Math.PI - endAngle;
    const leftWall =
      leftDelta > 0.02
        ? `M ${p2Out.x.toFixed(2)} ${p2Out.y.toFixed(2)} A ${Rx} ${Ry} 0 0 1 ${pPiOut.x.toFixed(2)} ${pPiOut.y.toFixed(2)} L ${pPiOut.x.toFixed(2)} ${(pPiOut.y + D).toFixed(2)} A ${Rx} ${Ry} 0 0 0 ${p2Out.x.toFixed(2)} ${(p2Out.y + D).toFixed(2)} Z`
        : "";

    // 5. Founder Front Right Wall (from 0 to startAngle)
    const p0Out = ptOut(0);
    const rightWall = `M ${p0Out.x.toFixed(2)} ${p0Out.y.toFixed(2)} A ${Rx} ${Ry} 0 0 1 ${p1Out.x.toFixed(2)} ${p1Out.y.toFixed(2)} L ${p1Out.x.toFixed(2)} ${(p1Out.y + D).toFixed(2)} A ${Rx} ${Ry} 0 0 0 ${p0Out.x.toFixed(2)} ${(p0Out.y + D).toFixed(2)} Z`;

    // 6. Radial Cut Face at endAngle (giving tactile step)
    const cutFace = `M ${p2In.x.toFixed(2)} ${p2In.y.toFixed(2)} L ${p2Out.x.toFixed(2)} ${p2Out.y.toFixed(2)} L ${p2Out.x.toFixed(2)} ${(p2Out.y + D).toFixed(2)} L ${p2In.x.toFixed(2)} ${(p2In.y + D).toFixed(2)} Z`;

    // Pin Anchors for Labels
    const roundMidAngle = startAngle + sweepAngle / 2;
    const founderMidAngle = (endAngle + startAngle + Math.PI * 2) / 2;
    const roundPin = ptOut(roundMidAngle);
    const founderPin = ptOut(founderMidAngle);

    return {
      cx,
      cy,
      Rx,
      Ry,
      rx,
      ry,
      D,
      roundTop,
      founderTop,
      roundWall,
      leftWall,
      rightWall,
      cutFace,
      roundPin,
      founderPin,
    };
  }, [equityPct]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-[32px] shadow-cardFloat p-6 sm:p-8 transition-all duration-300 font-jakarta selection:bg-[#E58B6D]/20 ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* Warm Ambient Studio Peach Back-Light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(229,139,109,0.14),transparent_70%)] pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,166,128,0.1),transparent_70%)] pointer-events-none -z-0" />

      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.05]">
        <div>
          {/* Punchy Technical Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E58B6D]/10 border border-[#E58B6D]/25 text-[#FF5C18] text-[11px] font-mono font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-[#E58B6D]" />
              TOKENIZE & LAUNCH
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] text-[#5A5652] text-[11px] font-mono">
              <Activity className="w-3 h-3 text-[#E58B6D]" />
              SPL-Token-2022
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111113] tracking-tight">
            Direct Equity Tokenization
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#5A5652] max-w-xl font-normal leading-relaxed">
            Mint 1,000,000 canonical founder shares on Solana in 60s. Lock investor capital into milestone escrow tranches with zero venture intermediaries.
          </p>
        </div>

        {/* View Switcher: 3D Ring vs Layered Ceramic Stack */}
        <div className="flex items-center bg-[#F4EFEA] p-1 rounded-2xl border border-black/[0.04] self-start sm:self-center">
          <button
            type="button"
            onClick={() => setVisualizerMode("ring")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              visualizerMode === "ring"
                ? "bg-white text-[#111113] shadow-sm"
                : "text-[#8E8B88] hover:text-[#111113]"
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-[#E58B6D]" />
            3D Ring
          </button>
          <button
            type="button"
            onClick={() => setVisualizerMode("stack")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              visualizerMode === "stack"
                ? "bg-white text-[#111113] shadow-sm"
                : "text-[#8E8B88] hover:text-[#111113]"
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-[#E58B6D]" />
            Ceramic Stack
          </button>
        </div>
      </div>

      {/* 3D / ISOMETRIC VECTOR VISUALIZER STAGE */}
      <div className="relative z-10 my-6 py-4 flex flex-col items-center justify-center">
        <motion.div
          style={{
            rotateX: tiltRotateX,
            rotateY: tiltRotateY,
            transformStyle: "preserve-3d",
          }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="relative w-full max-w-[440px] h-[240px] flex items-center justify-center select-none"
        >
          {/* MODE 1: TACTILE 3D ISOMETRIC RING / DONUT */}
          {visualizerMode === "ring" ? (
            <svg
              viewBox="0 0 350 220"
              className="w-full h-full overflow-visible drop-shadow-[0_22px_30px_rgba(30,20,15,0.08)]"
            >
              <defs>
                {/* Porcelain Ceramic Gradient for Founder Slice */}
                <linearGradient id="porcelainTop" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="45%" stopColor="#F9F8F5" />
                  <stop offset="85%" stopColor="#EFECE6" />
                  <stop offset="100%" stopColor="#E3DFD5" />
                </linearGradient>

                <linearGradient id="porcelainSide" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E5E0D5" />
                  <stop offset="60%" stopColor="#D4CDBE" />
                  <stop offset="100%" stopColor="#BDB4A1" />
                </linearGradient>

                {/* Radiant Peach Ceramic Gradient for Public Round Slice */}
                <linearGradient id="peachTop" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFBA99" />
                  <stop offset="35%" stopColor="#FFA680" />
                  <stop offset="75%" stopColor="#E58B6D" />
                  <stop offset="100%" stopColor="#FF5C18" />
                </linearGradient>

                <linearGradient id="peachSide" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E58B6D" />
                  <stop offset="50%" stopColor="#CF6541" />
                  <stop offset="100%" stopColor="#9E3C18" />
                </linearGradient>

                {/* Soft Contact Shadow Filter */}
                <radialGradient id="ringShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(35, 25, 20, 0.16)" />
                  <stop offset="65%" stopColor="rgba(35, 25, 20, 0.05)" />
                  <stop offset="100%" stopColor="rgba(35, 25, 20, 0)" />
                </radialGradient>

                {/* Subtle Inner Glow */}
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#E58B6D" floodOpacity="0.32" />
                </filter>
              </defs>

              {/* 1. Ground Contact Shadow */}
              <ellipse
                cx={donutPaths.cx}
                cy={donutPaths.cy + donutPaths.D + 16}
                rx={donutPaths.Rx + 8}
                ry={donutPaths.Ry + 4}
                fill="url(#ringShadow)"
              />

              {/* 2. Founder Slice (Top Face) */}
              <path
                d={donutPaths.founderTop}
                fill="url(#porcelainTop)"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSlice("founder")}
                opacity={hoveredSlice === "round" ? 0.75 : 1}
              />

              {/* 3. Founder Extruded Side Walls (Front Visible Portions) */}
              {donutPaths.leftWall && (
                <path
                  d={donutPaths.leftWall}
                  fill="url(#porcelainSide)"
                  stroke="#C7BFA8"
                  strokeWidth="0.5"
                />
              )}
              {donutPaths.rightWall && (
                <path
                  d={donutPaths.rightWall}
                  fill="url(#porcelainSide)"
                  stroke="#C7BFA8"
                  strokeWidth="0.5"
                />
              )}

              {/* 4. Radial Bevel Cut Face */}
              <path
                d={donutPaths.cutFace}
                fill="#CFC6B3"
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />

              {/* 5. Round Slice Extruded Side Wall */}
              <path
                d={donutPaths.roundWall}
                fill="url(#peachSide)"
                stroke="#FF7E47"
                strokeWidth="0.5"
              />

              {/* 6. Round Slice Top Face */}
              <path
                d={donutPaths.roundTop}
                fill="url(#peachTop)"
                stroke="#FFE0D1"
                strokeWidth="1.5"
                filter="url(#glowFilter)"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSlice("round")}
                opacity={hoveredSlice === "founder" ? 0.8 : 1}
              />

              {/* 7. Center Floating Porcelain Core Medallion */}
              <g transform={`translate(${donutPaths.cx}, ${donutPaths.cy + 4})`}>
                {/* Core Ambient Shadow */}
                <ellipse cx="0" cy="18" rx="42" ry="19" fill="rgba(25,20,15,0.09)" />
                {/* Core Body */}
                <ellipse cx="0" cy="0" rx="38" ry="18" fill="#FFFFFF" stroke="#EDE8DC" strokeWidth="1.2" />
                <ellipse cx="0" cy="-2" rx="34" ry="15" fill="#FAF8F3" />
                {/* Stamped Seal Text */}
                <text
                  x="0"
                  y="-1"
                  textAnchor="middle"
                  fill="#111113"
                  fontSize="8.5"
                  fontWeight="800"
                  fontFamily="monospace"
                  letterSpacing="0.08em"
                >
                  1,000,000
                </text>
                <text
                  x="0"
                  y="9"
                  textAnchor="middle"
                  fill="#8E8B88"
                  fontSize="6.5"
                  fontWeight="700"
                  fontFamily="sans-serif"
                  letterSpacing="0.06em"
                >
                  CANONICAL SHARES
                </text>
              </g>

              {/* Visual Annotations */}
              <g className="text-xs font-mono select-none">
                {/* Founder Label Pin */}
                <line
                  x1={donutPaths.founderPin.x}
                  y1={donutPaths.founderPin.y}
                  x2="55"
                  y2="38"
                  stroke="#8E8B88"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle cx={donutPaths.founderPin.x} cy={donutPaths.founderPin.y} r="2.5" fill="#111113" />
                <circle cx="55" cy="38" r="2" fill="#8E8B88" />

                {/* Round Label Pin */}
                <line
                  x1={donutPaths.roundPin.x}
                  y1={donutPaths.roundPin.y}
                  x2="295"
                  y2="175"
                  stroke="#FF5C18"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <circle cx={donutPaths.roundPin.x} cy={donutPaths.roundPin.y} r="3" fill="#FF5C18" />
                <circle cx="295" cy="175" r="2" fill="#FF5C18" />
              </g>
            </svg>
          ) : (
            /* MODE 2: TACTILE LAYERED CERAMIC SHARE STACK */
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {/* Stack Layer 3: Top Founder Majority Slab */}
              <motion.div
                animate={{
                  y: hoveredSlice === "founder" ? -12 : -6,
                  scale: hoveredSlice === "founder" ? 1.03 : 1,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-64 py-3 px-5 rounded-2xl bg-gradient-to-r from-white via-[#F8F6F2] to-[#ECE7DC] border border-white shadow-cardFloat text-center z-30 cursor-pointer"
                onMouseEnter={() => setHoveredSlice("founder")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#111113]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Founder Equity</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#111113]">
                    {founderShares.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5A5652] mt-0.5">
                  <span>Non-Dilutive Pool</span>
                  <span className="font-mono font-semibold text-[#111113]">{founderPct}%</span>
                </div>
              </motion.div>

              {/* Stack Layer 2: Middle Public Round Escrow Slab */}
              <motion.div
                animate={{
                  y: hoveredSlice === "round" ? -4 : 4,
                  scale: hoveredSlice === "round" ? 1.03 : 1,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-72 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FFBA99] via-[#E58B6D] to-[#FF5C18] border border-[#FFA680] shadow-[0_12px_24px_rgba(229,139,109,0.32)] text-white z-20 cursor-pointer"
                onMouseEnter={() => setHoveredSlice("round")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Public Milestone Round</span>
                  </div>
                  <span className="text-xs font-mono font-bold">
                    {roundShares.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/90 mt-0.5">
                  <span>Protected in 51% Escrow</span>
                  <span className="font-mono font-bold">{equityPct}%</span>
                </div>
              </motion.div>

              {/* Stack Layer 1: Base Community Treasury / Liquidity Slab */}
              <div className="w-80 py-2.5 px-5 rounded-2xl bg-[#EBE6DC] border border-[#DDD5C5] shadow-inner text-[#5A5652] z-10 mt-2 text-center opacity-85">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#8E8B88]" />
                    <span>Solana Protocol Settlement</span>
                  </span>
                  <span className="font-mono text-[11px]">SPL-2022</span>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Dynamic Pin Labels */}
          <div className="absolute top-2 left-2 px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-white/90 shadow-sm text-left select-none">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8E8B88]">
              Founder Core
            </span>
            <span className="text-xs font-mono font-bold text-[#111113]">
              {founderShares.toLocaleString()} ({founderPct}%)
            </span>
          </div>

          <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-[#FF5C18]/10 backdrop-blur-md border border-[#FF5C18]/25 shadow-sm text-right select-none">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#FF5C18]">
              Round Offering
            </span>
            <span className="text-xs font-mono font-bold text-[#111113]">
              {roundShares.toLocaleString()} ({equityPct}%)
            </span>
          </div>
        </motion.div>
      </div>

      {/* TACTILE EQUITY ALLOCATION SLIDER & PRESET DIAL */}
      <div className="relative z-10 bg-white/60 backdrop-blur-md border border-white/85 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#E58B6D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#111113]">
              Equity Allocation Dial
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#5A5652]">Round Share:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF5C18]/10 text-[#FF5C18] font-bold">
              {equityPct}% ({roundShares.toLocaleString()} shares)
            </span>
          </div>
        </div>

        {/* Range Slider Track */}
        <div className="relative flex items-center w-full my-2">
          <input
            type="range"
            min={10}
            max={40}
            step={1}
            value={equityPct}
            onChange={(e) => setEquityPct(Number(e.target.value))}
            className="w-full h-2.5 bg-[#EAE5DA] rounded-lg appearance-none cursor-pointer accent-[#FF5C18] focus:outline-none"
          />
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-6 gap-1.5 mt-3 pt-2 border-t border-black/[0.04]">
          {EQUITY_PRESETS.map((p) => {
            const isSelected = equityPct === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setEquityPct(p.value)}
                className={`flex flex-col items-center py-1.5 px-1 rounded-xl text-[11px] font-mono transition-all ${
                  isSelected
                    ? "bg-[#111113] text-white shadow-sm font-bold"
                    : "bg-white/80 hover:bg-white text-[#5A5652] hover:text-[#111113] border border-black/[0.03]"
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[9px] ${
                    isSelected ? "text-[#FFA680]" : "text-[#8E8B88]"
                  }`}
                >
                  {p.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* REAL-TIME DYNAMIC METRIC CARDS */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Metric 1: Implied Post-Money Valuation */}
        <div className="p-4 rounded-2xl bg-white/60 border border-white/90 shadow-sm">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8E8B88]">
            Implied Valuation
          </span>
          <span className="text-base sm:text-lg font-mono font-extrabold text-[#111113] mt-1 block">
            ${(impliedValuation / 1_000_000).toFixed(2)}M
          </span>
          <span className="text-[10px] text-[#5A5652] mt-0.5 block font-mono">
            Post-Money Total
          </span>
        </div>

        {/* Metric 2: Derived Share Price */}
        <div className="p-4 rounded-2xl bg-white/60 border border-white/90 shadow-sm">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8E8B88]">
            Share Price
          </span>
          <span className="text-base sm:text-lg font-mono font-extrabold text-[#111113] mt-1 block">
            ${sharePrice.toFixed(3)}
          </span>
          <span className="text-[10px] text-[#5A5652] mt-0.5 block font-mono">
            SPL Unit Cost
          </span>
        </div>

        {/* Metric 3: Founder Majority Block */}
        <div className="p-4 rounded-2xl bg-white/60 border border-white/90 shadow-sm">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8E8B88]">
            Founder Equity
          </span>
          <span className="text-base sm:text-lg font-mono font-extrabold text-[#111113] mt-1 block">
            {founderShares.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block font-mono font-semibold">
            {founderPct}% Majority
          </span>
        </div>

        {/* Metric 4: Anti-Rugpull Governance Quorum */}
        <div className="p-4 rounded-2xl bg-white/60 border border-white/90 shadow-sm">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8E8B88]">
            Quorum Safeguard
          </span>
          <span className="text-base sm:text-lg font-mono font-extrabold text-[#FF5C18] mt-1 block">
            510,000
          </span>
          <span className="text-[10px] text-[#5A5652] mt-0.5 block font-mono">
            +{(founderMarginOverQuorum / 1_000).toFixed(0)}k Safety Buffer
          </span>
        </div>
      </div>

      {/* EXPANDED ARCHITECTURE & PARAMETERS (Smooth Reveal with Framer Motion) */}
      <AnimatePresence>
        {activeExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 overflow-hidden pt-2 pb-4 space-y-5 border-t border-black/[0.05]"
          >
            {/* EXPANDED CONTROL 1: TARGET CAPITAL RAISE */}
            <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-black/[0.04]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-[#E58B6D]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111113]">
                    Target Capital Raise
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#5A5652]">Capital Target:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#111113] text-white font-bold">
                    ${targetRaise.toLocaleString()} USDC
                  </span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={50_000}
                max={1_000_000}
                step={25_000}
                value={targetRaise}
                onChange={(e) => setTargetRaise(Number(e.target.value))}
                className="w-full h-2 bg-[#DED7CA] rounded-lg appearance-none cursor-pointer accent-[#111113] focus:outline-none"
              />

              {/* Preset Chips */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {CAPITAL_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setTargetRaise(c.value)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-medium transition-all ${
                      targetRaise === c.value
                        ? "bg-[#111113] text-white shadow-sm"
                        : "bg-white text-[#5A5652] hover:text-[#111113] border border-black/[0.04]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* EXPANDED CONTROL 2: MILESTONE TRANCHE ESCROW ARCHITECTURE */}
            <div className="p-5 rounded-2xl bg-white/65 border border-white/90 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#E58B6D]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111113]">
                    Milestone Escrow Tranche Structure
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#5A5652]">
                  3 Programmatic Tranches
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tranche 1 */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>Tranche 1 (30%)</span>
                    <span className="font-mono">${tranche1Usdc.toLocaleString()}</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 block mt-1">
                    Immediate Seed Runway
                  </span>
                  <span className="text-[10px] text-emerald-600/90 block mt-0.5 font-mono">
                    Unlocked on round completion
                  </span>
                </div>

                {/* Tranche 2 */}
                <div className="p-3 rounded-xl bg-[#FFF6EE] border border-[#FFD9C2]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#9C3E1B]">
                    <span>Tranche 2 (35%)</span>
                    <span className="font-mono">${tranche2Usdc.toLocaleString()}</span>
                  </div>
                  <span className="text-[11px] text-[#A64A24] block mt-1">
                    Alpha Feature Delivery
                  </span>
                  <span className="text-[10px] text-[#A64A24]/90 block mt-0.5 font-mono">
                    Locked until 51% quorum vote
                  </span>
                </div>

                {/* Tranche 3 */}
                <div className="p-3 rounded-xl bg-[#FFF6EE] border border-[#FFD9C2]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#9C3E1B]">
                    <span>Tranche 3 (35%)</span>
                    <span className="font-mono">${tranche3Usdc.toLocaleString()}</span>
                  </div>
                  <span className="text-[11px] text-[#A64A24] block mt-1">
                    Revenue / Mainnet Scale
                  </span>
                  <span className="text-[10px] text-[#A64A24]/90 block mt-0.5 font-mono">
                    Locked until 51% quorum vote
                  </span>
                </div>
              </div>
            </div>

            {/* EXPANDED CONTROL 3: 60-SECOND SIMULATED TOKEN MINT TESTBED */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#111113] to-[#201F24] text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-[#FFA680]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFA680]">
                    Solana SPL-2022 Mint Terminal
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/50">
                  Cluster: Devnet / Mainnet
                </span>
              </div>

              {/* Terminal Pipeline Steps */}
              <div className="space-y-2 font-mono text-xs mb-4">
                <div
                  className={`flex items-center gap-2 transition-opacity ${
                    mintStep >= 1 ? "text-emerald-400 opacity-100" : "text-white/30"
                  }`}
                >
                  {mintStep >= 1 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/30" />
                  )}
                  <span>1. Generate Escrow PDA & Immutable Mint Authority</span>
                </div>

                <div
                  className={`flex items-center gap-2 transition-opacity ${
                    mintStep >= 2 ? "text-emerald-400 opacity-100" : "text-white/30"
                  }`}
                >
                  {mintStep >= 2 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/30" />
                  )}
                  <span>2. Hardcode 1,000,000 Total Supply (Zero Inflation)</span>
                </div>

                <div
                  className={`flex items-center gap-2 transition-opacity ${
                    mintStep >= 3 ? "text-emerald-400 opacity-100" : "text-white/30"
                  }`}
                >
                  {mintStep >= 3 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/30" />
                  )}
                  <span>3. Authorize 51% Multi-Sig Governance Escrow</span>
                </div>

                <div
                  className={`flex items-center gap-2 transition-opacity ${
                    mintStep >= 4 ? "text-emerald-400 opacity-100" : "text-white/30"
                  }`}
                >
                  {mintStep >= 4 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/30" />
                  )}
                  <span>4. Ready for Backer Capital Deposits</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={triggerMintSimulation}
                  disabled={isMinting}
                  className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    mintComplete
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-[#FF5C18] hover:bg-[#E58B6D] text-white shadow-lg shadow-[#FF5C18]/25"
                  }`}
                >
                  {isMinting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-white" />
                      <span>Minting On-Chain (60s)...</span>
                    </>
                  ) : mintComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Venture Deployed Successfully</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white" />
                      <span>Execute 60s SPL-2022 Deployment</span>
                    </>
                  )}
                </button>

                {mintComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMintStep(0);
                      setMintComplete(false);
                    }}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white/80 transition-all"
                  >
                    Reset Simulation
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER ACTIONS & EXPANSION TOGGLE */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-black/[0.05]">
        <div className="flex items-center gap-2 text-xs text-[#5A5652]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Non-dilutive founder core with programmatic investor safety.</span>
        </div>

        <button
          type="button"
          onClick={handleToggleExpand}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-xs font-semibold text-[#111113] transition-all"
        >
          <span>{activeExpanded ? "Collapse Details" : "Configure Architecture"}</span>
          {activeExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#5A5652]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#5A5652]" />
          )}
        </button>
      </div>
    </div>
  );
}

// Minimal Clean Helper Icon for Terminal
function TerminalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
export default TokenizeCard;
