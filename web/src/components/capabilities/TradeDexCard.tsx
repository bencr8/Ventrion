"use client";

import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowLeftRight,
  Activity,
  Flame,
  Zap,
  BarChart2,
  Lock,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RefreshCw,
  Layers,
} from "lucide-react";

export interface TradeDexCardProps {
  isExpanded?: boolean;
  onActivate?: () => void;
  className?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  price: number;
  change: string;
  time: string;
  volume: string;
  depthUsdc: string;
}

const CHART_POINTS: ChartPoint[] = [
  { x: 0, y: 136, price: 0.198, change: "+0.0%", time: "12:00", volume: "$28K", depthUsdc: "$120K" },
  { x: 45, y: 130, price: 0.212, change: "+7.1%", time: "12:30", volume: "$42K", depthUsdc: "$145K" },
  { x: 90, y: 112, price: 0.245, change: "+23.7%", time: "13:00", volume: "$68K", depthUsdc: "$180K" },
  { x: 135, y: 120, price: 0.231, change: "+16.6%", time: "13:30", volume: "$54K", depthUsdc: "$165K" },
  { x: 180, y: 88, price: 0.292, change: "+47.4%", time: "14:00", volume: "$118K", depthUsdc: "$240K" },
  { x: 225, y: 96, price: 0.278, change: "+40.4%", time: "14:30", volume: "$92K", depthUsdc: "$210K" },
  { x: 270, y: 68, price: 0.335, change: "+69.1%", time: "15:00", volume: "$185K", depthUsdc: "$310K" },
  { x: 315, y: 56, price: 0.362, change: "+82.8%", time: "15:30", volume: "$225K", depthUsdc: "$360K" },
  { x: 360, y: 64, price: 0.348, change: "+75.7%", time: "16:00", volume: "$160K", depthUsdc: "$330K" },
  { x: 405, y: 36, price: 0.398, change: "+101.0%", time: "16:30", volume: "$320K", depthUsdc: "$390K" },
  { x: 450, y: 40, price: 0.391, change: "+97.4%", time: "17:00", volume: "$280K", depthUsdc: "$375K" },
  { x: 500, y: 18, price: 0.420, change: "+112.1%", time: "17:30", volume: "$420K", depthUsdc: "$450K" },
];

const CANDLESTICKS = [
  { x: 45, open: 134, close: 129, high: 126, low: 138, bullish: true },
  { x: 90, open: 128, close: 111, high: 108, low: 131, bullish: true },
  { x: 135, open: 114, close: 121, high: 110, low: 125, bullish: false },
  { x: 180, open: 119, close: 87, high: 84, low: 122, bullish: true },
  { x: 225, open: 89, close: 97, high: 86, low: 101, bullish: false },
  { x: 270, open: 95, close: 67, high: 64, low: 99, bullish: true },
  { x: 315, open: 69, close: 55, high: 52, low: 72, bullish: true },
  { x: 360, open: 57, close: 65, high: 54, low: 68, bullish: false },
  { x: 405, open: 63, close: 35, high: 32, low: 67, bullish: true },
  { x: 450, open: 37, close: 41, high: 34, low: 45, bullish: false },
  { x: 490, open: 39, close: 19, high: 15, low: 42, bullish: true },
];

function generateSplinePath(points: ChartPoint[]): string {
  if (points.length === 0) return "";
  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return path;
}

export function TradeDexCard({
  isExpanded = false,
  onActivate,
  className = "",
}: TradeDexCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const activeExpanded = isExpanded || internalExpanded;

  const [scrubberIndex, setScrubberIndex] = useState<number | null>(null);
  const [isHoveringChart, setIsHoveringChart] = useState(false);

  const [swapAmount, setSwapAmount] = useState<number>(1000);
  const [swapSide, setSwapSide] = useState<"buy" | "sell">("buy");
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);

  const filterId = useId();
  const gradientId = useId();
  const depthGradientId = useId();

  const splinePath = generateSplinePath(CHART_POINTS);
  const areaPath = `${splinePath} L 500,160 L 0,160 Z`;

  const activePoint =
    scrubberIndex !== null ? CHART_POINTS[scrubberIndex] : CHART_POINTS[CHART_POINTS.length - 1];

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 500;

    let closestIdx = 0;
    let minDiff = Infinity;
    CHART_POINTS.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setScrubberIndex(closestIdx);
    setIsHoveringChart(true);
  };

  const handleChartMouseLeave = () => {
    setIsHoveringChart(false);
    setScrubberIndex(null);
  };

  const executeSimulateSwap = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setHasSimulated(true);
      setTimeout(() => setHasSimulated(false), 2400);
    }, 450);
  };

  const currentPrice = activePoint.price;
  const protocolFeeUsdc = swapAmount * 0.005;
  const stakersFeeUsdc = swapAmount * 0.025;
  const totalTaxUsdc = swapAmount * 0.03;
  const netTokensReceived = ((swapAmount - totalTaxUsdc) / currentPrice).toFixed(1);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      onClick={() => {
        if (!activeExpanded) {
          setInternalExpanded(true);
          onActivate?.();
        }
      }}
      className={`relative w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-[32px] p-6 sm:p-8 shadow-cardFloat overflow-hidden font-jakarta select-none transition-shadow hover:shadow-[0_24px_48px_-12px_rgba(15,15,17,0.08)] ${className}`}
    >
      {/* Background Specular Sheen */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-peach-400/10 via-emerald-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-peach-500/8 via-transparent to-transparent rounded-full blur-2xl pointer-events-none -z-0" />

      {/* HEADER: Punchy Eyebrow & Status Pills */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.05] pb-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Eyebrow badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-peach-500/10 border border-peach-500/20 text-peach-600 text-[11px] font-bold tracking-wider uppercase">
            <Flame className="w-3.5 h-3.5 text-peach-500" />
            <span>TRADE ON AUTO-LIQUIDITY</span>
          </div>

          {/* Locked LP Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-semibold">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Permanently Locked LP</span>
          </div>
        </div>

        {/* Live AMM Routing Indicator */}
        <div className="flex items-center gap-2 text-xs text-[#5A5652]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#111113]" />
          <span className="font-medium text-[#111113]">Instant DEX Market</span>
          <span className="text-[#8E8B88] font-mono text-[11px]">SOL/USDC</span>
        </div>
      </div>

      {/* METRICS ROW: Live Price & Volatility Tracker */}
      <div className="relative z-10 mt-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#8E8B88] uppercase tracking-wider">
            Live Spot Price
          </div>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#111113] tracking-tight font-hanken">
              ${activePoint.price.toFixed(3)}
            </span>
            <span className="text-sm font-semibold text-[#5A5652]">USDC</span>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-600 text-xs font-bold shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{activePoint.change}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-[11px] font-medium text-[#8E8B88]">24h Volume</div>
            <div className="text-sm sm:text-base font-bold text-[#111113]">{activePoint.volume}</div>
          </div>
          <div className="h-7 w-[1px] bg-black/[0.06]" />
          <div>
            <div className="text-[11px] font-medium text-[#8E8B88]">Locked Depth</div>
            <div className="text-sm sm:text-base font-bold text-emerald-600">{activePoint.depthUsdc}</div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE VECTOR TRADING CANDLESTICK & LIQUIDITY DEPTH CURVE */}
      <div className="relative z-10 mt-6 w-full rounded-2xl bg-white/40 border border-white/70 p-3 sm:p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Subtle Depth Curve Header */}
        <div className="flex items-center justify-between text-[11px] text-[#8E8B88] px-1 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-peach-500" />
            <span className="font-semibold text-[#5A5652]">Real-Time Liquidity Depth</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>Tick: {activePoint.time}</span>
            <span className="text-emerald-600 font-semibold">Spread: 0.04%</span>
          </div>
        </div>

        {/* SVG Curve Container */}
        <div className="relative w-full h-[160px] sm:h-[180px] overflow-visible">
          <svg
            viewBox="0 0 500 160"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible cursor-crosshair"
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            <defs>
              {/* Peach Spline Gradient */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E58B6D" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#F8A882" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#F8A882" stopOpacity="0.0" />
              </linearGradient>

              {/* Depth Curve Subtle Background Fill */}
              <linearGradient id={depthGradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.04" />
                <stop offset="50%" stopColor="#E58B6D" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#E58B6D" stopOpacity="0.12" />
              </linearGradient>

              {/* Glowing Filter for Stroke */}
              <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Horizontal Guidelines */}
            <line x1="0" y1="40" x2="500" y2="40" stroke="#000000" strokeOpacity="0.04" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="#000000" strokeOpacity="0.04" strokeDasharray="3 3" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#000000" strokeOpacity="0.04" strokeDasharray="3 3" />

            {/* Stepped Liquidity Depth Wall (Background Layer) */}
            <path
              d="M 0,160 L 0,148 L 70,148 L 70,140 L 150,140 L 150,132 L 230,132 L 230,122 L 320,122 L 320,110 L 400,110 L 400,95 L 470,95 L 470,82 L 500,82 L 500,160 Z"
              fill={`url(#${depthGradientId})`}
            />

            {/* Vector Candlesticks */}
            {CANDLESTICKS.map((candle, i) => (
              <g key={`candle-${i}`} opacity={isHoveringChart ? 0.45 : 0.8} className="transition-opacity duration-200">
                {/* Wick */}
                <line
                  x1={candle.x}
                  y1={candle.high}
                  x2={candle.x}
                  y2={candle.low}
                  stroke={candle.bullish ? "#10B981" : "#E58B6D"}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={candle.x - 3}
                  y={Math.min(candle.open, candle.close)}
                  width={6}
                  height={Math.max(Math.abs(candle.close - candle.open), 3)}
                  rx={1.5}
                  fill={candle.bullish ? "#10B981" : "#E58B6D"}
                  opacity="0.85"
                />
              </g>
            ))}

            {/* Area fill under curve */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Glowing Peach Spline Curve */}
            <path
              d={splinePath}
              fill="none"
              stroke="#E58B6D"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${filterId})`}
            />

            {/* Pulsing Support & Resistance Inflection Ticks */}
            <g transform="translate(180, 88)">
              <circle r="6" fill="#E58B6D" opacity="0.25" className="animate-ping" />
              <circle r="3" fill="#FFFFFF" stroke="#E58B6D" strokeWidth="2" />
            </g>

            <g transform="translate(270, 68)">
              <circle r="6" fill="#10B981" opacity="0.25" className="animate-ping" />
              <circle r="3" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
            </g>

            <g transform="translate(405, 36)">
              <circle r="7" fill="#E58B6D" opacity="0.3" className="animate-ping" />
              <circle r="3.5" fill="#FFFFFF" stroke="#E58B6D" strokeWidth="2" />
            </g>

            {/* Interactive Hover Scrubber Line & Focal Node */}
            <g transform={`translate(${activePoint.x}, 0)`}>
              {/* Hairline guide */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={160}
                stroke="#E58B6D"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={isHoveringChart ? 0.9 : 0.4}
              />

              {/* Active Scrubber Node */}
              <g transform={`translate(0, ${activePoint.y})`}>
                <circle r="9" fill="#E58B6D" opacity="0.35" />
                <circle r="5" fill="#FAF6F0" stroke="#E58B6D" strokeWidth="2.5" />
                <circle r="2" fill="#E58B6D" />
              </g>
            </g>
          </svg>

          {/* Floating Hover Scrubber Tag */}
          <div
            className="absolute top-2 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `${Math.min(Math.max((activePoint.x / 500) * 100, 16), 84)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111113] text-white shadow-xl text-xs whitespace-nowrap">
              <span className="font-bold font-hanken">${activePoint.price.toFixed(3)}</span>
              <span className="text-emerald-400 font-semibold">{activePoint.change}</span>
              <span className="text-white/40 text-[10px]">| {activePoint.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AMM ROUTING & ANTI-RUGPOOL ESCROW SEAL */}
      <div className="relative z-10 mt-5 p-3.5 rounded-2xl bg-porcelain-100/80 border border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#111113]">Raydium & Meteora Automated Pool</div>
            <div className="text-[11px] text-[#8E8B88]">Zero Mint Authority • Burned LP Keys</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.06] text-[#5A5652] font-semibold flex items-center gap-1 shadow-sm">
            <Layers className="w-3 h-3 text-peach-500" />
            DLMM / CPMM
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 font-bold flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            100% Locked
          </span>
        </div>
      </div>

      {/* EXPANDED SECTION: REVEAL INTERACTIVE SCRUBBER CONTROLS & SWAP SIMULATOR */}
      <AnimatePresence>
        {activeExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="pt-6 mt-6 border-t border-black/[0.06] flex flex-col gap-5">
              {/* SIMULATED INTERACTIVE SWAP PILL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/60 border border-white/90 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-peach-600" />
                    <span className="text-xs font-bold text-[#111113] uppercase tracking-wider">
                      Simulated Instant Swap
                    </span>
                  </div>

                  {/* Buy / Sell direction toggle */}
                  <div className="flex items-center p-0.5 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                    <button
                      onClick={() => setSwapSide("buy")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        swapSide === "buy"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "text-[#5A5652] hover:text-[#111113]"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setSwapSide("sell")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        swapSide === "sell"
                          ? "bg-peach-600 text-white shadow-sm"
                          : "text-[#5A5652] hover:text-[#111113]"
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                {/* Amount selection presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[250, 500, 1000, 2500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setSwapAmount(amt)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        swapAmount === amt
                          ? "bg-[#111113] text-white border-[#111113] shadow-sm"
                          : "bg-white/80 text-[#5A5652] border-black/[0.06] hover:bg-white"
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Swap preview card */}
                <div className="p-3.5 rounded-xl bg-porcelain-50 border border-black/[0.04] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8E8B88]">You Pay</span>
                    <span className="font-bold text-[#111113] font-mono">
                      {swapAmount.toLocaleString()} USDC
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8E8B88]">You Receive</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">
                      ~{netTokensReceived} $VENT
                    </span>
                  </div>

                  {/* 3% Tax Breakdown Preview */}
                  <div className="pt-2 border-t border-black/[0.05] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#5A5652] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-peach-500" />
                        2.5% Holder Volume Tax
                      </span>
                      <span className="font-mono text-emerald-600 font-semibold">
                        +${stakersFeeUsdc.toFixed(2)} to Stakers
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#5A5652] flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-emerald-500" />
                        0.5% Protocol Auto-LP
                      </span>
                      <span className="font-mono text-[#5A5652] font-semibold">
                        ${protocolFeeUsdc.toFixed(2)} Permanently Locked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={executeSimulateSwap}
                  disabled={isSimulating}
                  className="mt-3 w-full py-3 rounded-xl bg-[#111113] text-white text-xs font-bold tracking-tight shadow-md flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-peach-400" />
                      <span>Routing via DLMM Pool...</span>
                    </>
                  ) : hasSimulated ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simulated Order Executed</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-peach-400" />
                      <span>Test Swap Execution</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Trader / Degen Protection Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/50 border border-black/[0.04] flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111113]">Zero Dev Dump Risk</div>
                    <div className="text-[11px] text-[#8E8B88] mt-0.5">
                      100% of seed LP tokens burned into verifiable null address.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/50 border border-black/[0.04] flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-peach-50 text-peach-600">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111113]">Passive Tax Yield</div>
                    <div className="text-[11px] text-[#8E8B88] mt-0.5">
                      Every buy and sell refills holder dividend vaults automatically.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand / Collapse Footer Trigger */}
      <div className="relative z-10 mt-5 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-[#8E8B88]">
        <span className="font-medium">
          {activeExpanded ? "Interactive DEX Inspector" : "Click to Test DEX Swap & Depth"}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setInternalExpanded(!activeExpanded);
            if (!activeExpanded) onActivate?.();
          }}
          className="flex items-center gap-1 font-semibold text-[#111113] hover:text-peach-600 transition-colors cursor-pointer"
        >
          <span>{activeExpanded ? "Minimize" : "Simulate Swap"}</span>
          {activeExpanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
