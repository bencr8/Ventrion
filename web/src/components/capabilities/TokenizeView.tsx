"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface TokenizeViewProps {
  isActive?: boolean;
}

export function TokenizeView({ isActive = true }: TokenizeViewProps) {
  const [allocation, setAllocation] = useState<number>(20);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  const founderPercent = 100 - allocation;

  return (
    <div className="w-full max-w-[420px] p-7 rounded-[26px] bg-white border border-black/[0.06] shadow-[0_12px_32px_-8px_rgba(20,15,10,0.06)] relative overflow-hidden">
      {/* Subtle ambient warmth glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(ellipse_at_top_right,rgba(255,92,24,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Allocation Display */}
      <div className="space-y-5 relative z-10">
        {/* Monolithic Bar with Rounded Public Float */}
        <div className="w-full h-4 rounded-full bg-[#FAF7F2] p-0.5 flex items-center gap-1 overflow-hidden border border-black/[0.06] shadow-inner">
          <motion.div
            style={{ width: `${founderPercent}%` }}
            className="h-full bg-[#111113] rounded-full"
            animate={{ width: `${founderPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <motion.div
            style={{ width: `${allocation}%` }}
            className="h-full bg-[#FF5C18] rounded-full"
            animate={{ width: `${allocation}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Dual Ratio Readout with subtle size increase and subtle hover color transitions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-black/[0.04] hover:border-black/[0.09] hover:bg-[#FAF5EE] transition-all duration-200 cursor-default">
            <span className="text-xs text-[#5A5652] font-medium block">
              Founder
            </span>
            <div className="text-3xl font-extrabold font-jakarta text-[#111113] mt-1">
              {founderPercent}%
            </div>
          </div>

          <motion.div
            animate={{ scale: isInteracting ? 1.03 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`p-4 rounded-xl transition-all duration-200 cursor-default ${
              isInteracting
                ? "bg-[#FFF4EE] border-[#FF5C18]/25 shadow-xs"
                : "bg-[#FAF7F2] border-black/[0.04] hover:border-[#FF5C18]/25 hover:bg-[#FFF8F4]"
            }`}
          >
            <span className="text-xs text-[#FF5C18] font-medium block">
              Public Float
            </span>
            <div className="text-3xl font-extrabold font-jakarta text-[#FF5C18] mt-1">
              {allocation}%
            </div>
          </motion.div>
        </div>

        {/* Minimal Tactile Slider */}
        <div className="pt-1">
          <input
            type="range"
            min={1}
            max={49}
            step={1}
            value={allocation}
            onMouseDown={() => setIsInteracting(true)}
            onMouseUp={() => setIsInteracting(false)}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            onChange={(e) => setAllocation(Number(e.target.value))}
            className="w-full h-2 bg-[#E6DFD5] rounded-lg appearance-none cursor-pointer accent-[#FF5C18] transition-all hover:bg-[#DDD6CB]"
          />
        </div>
      </div>
    </div>
  );
}
