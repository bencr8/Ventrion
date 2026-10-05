"use client";

import React from "react";
import { motion, MotionValue } from "framer-motion";

interface ChubbyVCoinProps {
  translateX?: MotionValue<number>;
  translateY?: MotionValue<number>;
  rotateZ?: MotionValue<number>;
  className?: string;
}

export function ChubbyVCoin({
  translateX,
  translateY,
  rotateZ,
  className = "",
}: ChubbyVCoinProps) {
  return (
    <motion.div
      style={{
        x: translateX,
        y: translateY,
        rotateZ: rotateZ,
      }}
      className={`relative select-none pointer-events-none ${className}`}
    >
      {/* 1. Diffuse Contact Ambient Drop Shadow */}
      <div className="absolute -bottom-7 -left-4 w-44 h-16 rounded-[100%] bg-[#402518]/15 blur-xl pointer-events-none transform -rotate-6 scale-95" />
      <div className="absolute -bottom-3 left-3 w-36 h-9 rounded-[100%] bg-black/20 blur-md pointer-events-none transform -rotate-3" />

      {/* 2. Outer Ceramic Coin Body (Thick Rounded Porcelain Bevel) */}
      <div
        className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F5 45%, #EBE5DC 100%)",
          boxShadow: `
            0 25px 45px -10px rgba(60, 40, 30, 0.18),
            0 10px 20px -5px rgba(0, 0, 0, 0.08),
            inset 0 3px 6px rgba(255, 255, 255, 1),
            inset 0 -4px 8px rgba(180, 165, 150, 0.35)
          `,
          border: "1px solid rgba(255, 255, 255, 0.9)",
          transform: "rotate(-8deg) rotateX(10deg)",
        }}
      >
        {/* 3. Recessed Inner Well (Dish Effect) */}
        <div
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #E6DFD5 0%, #F5F1EB 60%, #FFFFFF 100%)",
            boxShadow: `
              inset 0 4px 10px rgba(50, 35, 25, 0.16),
              inset 0 -2px 6px rgba(255, 255, 255, 0.9)
            `,
          }}
        >
          {/* Subtle warm ambient reflection on dish floor */}
          <div className="absolute inset-0 bg-radial from-peach-400/20 via-transparent to-transparent opacity-80" />

          {/* 4. Glowing 3D Chubby "V" Core */}
          <div className="relative flex items-center justify-center z-10 drop-shadow-[0_8px_16px_rgba(229,139,109,0.55)]">
            <svg
              width="52"
              height="58"
              viewBox="0 0 52 58"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transform translate-y-0.5"
            >
              <defs>
                {/* 3D Extruded Gradient for the V */}
                <linearGradient id="vPeachGlow" x1="26" y1="2" x2="26" y2="54" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFA680" />
                  <stop offset="60%" stopColor="#F48A63" />
                  <stop offset="100%" stopColor="#DD6E45" />
                </linearGradient>

                <linearGradient id="vHighlight" x1="12" y1="4" x2="38" y2="52" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FFAA85" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#B34C28" stopOpacity="0.5" />
                </linearGradient>

                {/* Drop shadow filter for V core */}
                <filter id="vSoftDrop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#8A3416" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Chubby, rounded V path with thick stroke and rounded caps */}
              <path
                d="M 12 10 L 26 46 L 40 10"
                stroke="url(#vPeachGlow)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#vSoftDrop)"
              />

              {/* Inner highlight ridge on the V */}
              <path
                d="M 12 10 L 26 46 L 40 10"
                stroke="url(#vHighlight)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Warm Peach Core Ambient Glow */}
          <div className="absolute w-16 h-16 rounded-full bg-peach-500/25 blur-lg pointer-events-none animate-pulseGlow" />
        </div>
      </div>
    </motion.div>
  );
}
