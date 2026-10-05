"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface BackRiskViewProps {
  isActive?: boolean;
}

export function BackRiskView({ isActive = true }: BackRiskViewProps) {
  const target = 50_000;
  const [raised, setRaised] = useState<number>(38_400);

  const progress = Math.min(100, Math.round((raised / target) * 100));
  const isTargetMet = raised >= target;

  const handleDeposit = () => {
    if (isTargetMet) return;
    setRaised((p) => Math.min(target, p + 2500));
  };

  const handleExit = () => {
    if (isTargetMet) return;
    setRaised((p) => Math.max(10_000, p - 2500));
  };

  return (
    <div className="w-full max-w-[420px] p-7 rounded-[26px] bg-white border border-black/[0.06] shadow-[0_12px_32px_-8px_rgba(20,15,10,0.06)] relative overflow-hidden">
      {/* Subtle ambient warmth glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(ellipse_at_top_right,rgba(255,92,24,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Escrow Capital Display */}
      <div className="space-y-5 relative z-10">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-[#8E8B88] font-medium block">
              Escrowed Capital
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              {/* Capital amount with clipping shimmer sweep */}
              <div className="relative inline-block overflow-hidden rounded-md pr-1">
                <motion.span
                  key={raised}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="text-3xl sm:text-4xl font-extrabold font-jakarta text-[#111113] tracking-tight inline-block"
                >
                  ${raised.toLocaleString()}
                </motion.span>
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF5C18]/25 to-transparent pointer-events-none skew-x-12"
                />
              </div>
              <span className="text-xs text-[#8E8B88] font-medium">
                / ${target.toLocaleString()} USDC
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold font-jakarta text-[#FF5C18] block">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar with Continuous Shimmer */}
        <div className="w-full h-3 bg-[#FAF7F2] rounded-full overflow-hidden p-0.5 border border-black/[0.06] shadow-inner">
          <motion.div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#FF5C18] to-[#FF7A3D] rounded-full relative overflow-hidden"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
          </motion.div>
        </div>

        {/* Tactile Interactive Action Controls */}
        <div className="pt-2 flex items-center gap-2.5">
          {isTargetMet ? (
            <div className="relative w-full py-3.5 px-4 rounded-xl bg-[#111113] overflow-hidden text-center shadow-md">
              {/* Stronger, ultra-sleek dark skeleton shimmer */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 w-3/4 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none skew-x-12"
              />
              <span className="relative z-10 font-jakarta text-xs font-semibold text-white tracking-wider uppercase">
                Round Funded
              </span>
            </div>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleDeposit}
                className="flex-1 py-3 px-4 rounded-xl bg-[#111113] text-white font-jakarta text-xs font-semibold hover:bg-black transition-colors cursor-pointer shadow-sm text-center"
              >
                Simulate +$2,500
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleExit}
                disabled={raised <= 10_000}
                className="py-3 px-4 rounded-xl bg-[#FAF7F2] border border-black/10 text-[#111113] font-jakarta text-xs font-semibold hover:bg-[#FFF4EE] hover:text-[#FF5C18] hover:border-[#FF5C18]/30 transition-all duration-200 cursor-pointer disabled:opacity-40"
              >
                Withdraw
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
