"use client";

import React from "react";
import { motion } from "framer-motion";

export function WaveChart({ className }: { className?: string }) {
  // SVG path matching the smooth peach wave in the design
  const pathD = "M 0 65 Q 40 75, 80 62 T 160 58 T 240 25 T 320 50 T 400 45";
  const areaD = `${pathD} L 400 90 L 0 90 Z`;

  return (
    <div className={`relative w-full h-[90px] overflow-hidden ${className || ""}`}>
      <svg
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Peach gradient fill below the wave */}
          <linearGradient id="peachGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E58B6D" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#F8A882" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#F8A882" stopOpacity="0.0" />
          </linearGradient>

          {/* Glow filter for the active point */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Gradient Fill under curve */}
        <motion.path
          d={areaD}
          fill="url(#peachGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* The Peach Wave Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#E58B6D"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Highlighted Glowing Data Node at the peak (x: 240, y: 25) */}
        <g transform="translate(240, 25)">
          {/* Outer soft aura */}
          <circle
            r="8"
            fill="#E58B6D"
            opacity="0.25"
            className="animate-ping"
          />
          {/* Middle peach ring */}
          <circle
            r="5"
            fill="#F6F4EE"
            stroke="#E58B6D"
            strokeWidth="2.5"
            filter="url(#nodeGlow)"
          />
          {/* Core dot */}
          <circle r="2" fill="#E58B6D" />
        </g>
      </svg>
    </div>
  );
}
