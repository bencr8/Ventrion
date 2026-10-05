"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Dynamic market curve with natural crypto waves, consolidation dips, and breakout rallies
const MARKET_PATH_D =
  "M 0 72 C 30 70, 45 48, 65 48 C 85 48, 95 62, 115 62 C 145 62, 160 34, 185 34 C 205 34, 215 44, 235 44 C 265 44, 275 18, 295 18 C 315 18, 325 12, 340 12";

// Fixed-width character cell with identical vertical centering & locked baseline
function PriceCharCell({ char, isMoving }: { char: string; isMoving: boolean }) {
  const isDot = char === ".";

  return (
    <span
      className={`${
        isDot ? "w-[10px] sm:w-[12px]" : "w-[20px] sm:w-[24px]"
      } h-[36px] sm:h-[44px] flex items-center justify-center font-jakarta font-extrabold text-[#111113] select-none text-center tabular-nums transition-[filter] duration-150`}
      style={{
        filter: isMoving ? "blur(0.3px)" : "none",
      }}
    >
      {char}
    </span>
  );
}

interface TradeDexViewProps {
  isActive?: boolean;
}

export function TradeDexView({ isActive = true }: TradeDexViewProps) {
  const targetDefaultX = 295;

  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 0, y: 72 });
  const [displayPrice, setDisplayPrice] = useState<string>("0.00");
  const [displayGain, setDisplayGain] = useState<string>("+0.0%");
  const [isMoving, setIsMoving] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const targetXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isScrubbingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Exact point resolution on path using binary search
  const findPointAtX = useCallback((targetX: number): { x: number; y: number } => {
    const path = pathRef.current;
    if (!path) return { x: targetX, y: 30 };

    const totalLen = path.getTotalLength();
    let low = 0;
    let high = totalLen;
    let best = path.getPointAtLength(totalLen);

    for (let i = 0; i < 22; i++) {
      const mid = (low + high) / 2;
      const pt = path.getPointAtLength(mid);
      if (Math.abs(pt.x - targetX) < 0.25) {
        return { x: pt.x, y: pt.y };
      }
      if (pt.x < targetX) {
        low = mid;
      } else {
        high = mid;
      }
      best = pt;
    }

    return { x: best.x, y: best.y };
  }, []);

  // Guaranteed Opening Count-Up Animation (Runs over 900ms)
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 900;
    let frameId: number;

    const runCountUp = (timestamp: number) => {
      if (isScrubbingRef.current) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentX = ease * targetDefaultX;
      currentXRef.current = currentX;
      targetXRef.current = targetDefaultX;

      const pt = findPointAtX(currentX);
      setCurrentPos(pt);

      const targetPrice = 0.42;
      const currentPriceNum = ease * targetPrice;
      setDisplayPrice(currentPriceNum.toFixed(2));
      setDisplayGain(`+${(ease * 112.4).toFixed(1)}%`);
      setIsMoving(progress < 1);

      if (progress < 1) {
        frameId = requestAnimationFrame(runCountUp);
      } else {
        setIsMoving(false);
      }
    };

    frameId = requestAnimationFrame(runCountUp);
    return () => cancelAnimationFrame(frameId);
  }, [findPointAtX, isActive]);

  // Delayed magnetic follower loop for user scrubbing
  const updateScrubberLoop = useCallback(() => {
    const diff = targetXRef.current - currentXRef.current;
    if (Math.abs(diff) > 0.15) {
      currentXRef.current += diff * 0.12;
      const pt = findPointAtX(currentXRef.current);
      setCurrentPos(pt);

      const ratio = Math.max(0, Math.min(1, (72 - pt.y) / 60));
      const price = (0.2 + ratio * 0.22).toFixed(2);
      const gain = (ratio * 112.4).toFixed(1);

      setDisplayPrice(price);
      setDisplayGain(`+${gain}%`);

      animFrameRef.current = requestAnimationFrame(updateScrubberLoop);
    } else {
      currentXRef.current = targetXRef.current;
      const pt = findPointAtX(targetXRef.current);
      setCurrentPos(pt);
      setIsMoving(false);
      animFrameRef.current = null;
    }
  }, [findPointAtX]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    isScrubbingRef.current = true;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(340, (rawX / rect.width) * 340));

    targetXRef.current = clampedX;
    setIsHovered(true);
    setIsMoving(true);

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateScrubberLoop);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    targetXRef.current = targetDefaultX;
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateScrubberLoop);
    }
  };

  return (
    <div className="w-full max-w-[420px] p-7 rounded-[26px] bg-[#FFFFFF] border border-black/[0.06] shadow-[0_12px_32px_-8px_rgba(20,15,10,0.06)] relative overflow-hidden">
      {/* Subtle ambient warmth glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(ellipse_at_top_right,rgba(255,92,24,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Price & Scrubber Telemetry */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Price container: Identical baseline and locked widths across $, digits, and period */}
          <div className="flex items-center text-3xl sm:text-4xl font-extrabold font-jakarta text-[#111113] tracking-tight h-[36px] sm:h-[44px]">
            <span className="w-[18px] sm:w-[22px] h-[36px] sm:h-[44px] flex items-center justify-center font-extrabold text-[#111113]">
              $
            </span>
            <div className="flex items-center h-[36px] sm:h-[44px]">
              {displayPrice.split("").map((ch, idx) => (
                <PriceCharCell key={idx} char={ch} isMoving={isMoving} />
              ))}
            </div>
            <span className="text-xs font-mono text-[#8E8B88] ml-2 font-normal self-center">
              USDC
            </span>
          </div>

          <span className="text-xs font-bold text-[#FF5C18] bg-[#FF5C18]/10 hover:bg-[#FF5C18]/18 hover:scale-[1.04] transition-all duration-200 px-2.5 py-1 rounded-full font-mono flex items-center cursor-default">
            {displayGain}
          </span>
        </div>

        {/* Dynamic Multi-Wave Vector Chart */}
        <div className="relative w-full h-36 cursor-crosshair">
          <svg
            ref={svgRef}
            className="w-full h-full overflow-visible"
            viewBox="0 0 340 90"
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="cleanDexGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C18" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#FF5C18" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Area Fill under Multi-Wave Curve */}
            <path
              d={`${MARKET_PATH_D} L 340 90 L 0 90 Z`}
              fill="url(#cleanDexGradient)"
              className="pointer-events-none"
            />

            {/* Price Line with Peaks, Dips, and Breakouts */}
            <path
              ref={pathRef}
              d={MARKET_PATH_D}
              fill="none"
              stroke="#FF5C18"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />

            {/* Scrubber Vertical Line in SVG */}
            <g transform={`translate(${currentPos.x}, 0)`} className="pointer-events-none">
              <line
                x1="0"
                y1="6"
                x2="0"
                y2="88"
                stroke="#FF5C18"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                strokeOpacity={isHovered ? 0.75 : 0.3}
              />
            </g>
          </svg>

          {/* Scrubber Circle: Rendered as HTML element with guaranteed 1:1 aspect ratio (NEVER an ellipse!) */}
          <div
            style={{
              left: `${(currentPos.x / 340) * 100}%`,
              top: `${(currentPos.y / 90) * 100}%`,
            }}
            className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[2.5px] border-[#FF5C18] shadow-[0_0_10px_rgba(255,92,24,0.45)] pointer-events-none z-20"
          />
        </div>
      </div>
    </div>
  );
}
