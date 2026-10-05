"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  rotation: number;
}

interface StreamYieldViewProps {
  isActive?: boolean;
}

export function StreamYieldView({ isActive = true }: StreamYieldViewProps) {
  const [balance, setBalance] = useState<number>(0);
  const [claimStatus, setClaimStatus] = useState<"idle" | "claimed">("idle");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPopping, setIsPopping] = useState<boolean>(true);

  // Opening Count-Up & Pop Animation from 0.00 to 142.85
  useEffect(() => {
    let startVal = 0;
    const targetVal = 142.85;
    const duration = 750;
    const startTime = performance.now();
    let frameId: number;

    setIsPopping(true);

    const animateCountUp = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = ease * targetVal;
      setBalance(Number(current.toFixed(2)));

      if (progress < 1) {
        frameId = requestAnimationFrame(animateCountUp);
      } else {
        setBalance(targetVal);
        setIsPopping(false);
      }
    };

    frameId = requestAnimationFrame(animateCountUp);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  // Gentle real-time dividend trickle
  useEffect(() => {
    const timer = setInterval(() => {
      setBalance((b) => {
        if (b > 0) {
          return Number((b + 0.04).toFixed(2));
        }
        return b;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const handleClaim = () => {
    if (claimStatus !== "idle" || balance <= 0) return;

    const currentBal = balance;

    // Generate 14 delicate, minimalist micro-confetti particles (gold, warm orange, and crisp white)
    const colors = ["#FF5C18", "#FF8A4C", "#FFD285", "#FFFFFF", "#FF5C18"];
    const newParticles: Particle[] = Array.from({ length: 14 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
      const distance = 40 + Math.random() * 45;
      return {
        id: Date.now() + i,
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance - 25, // Slight upward bias
        color: colors[i % colors.length],
        size: Math.random() > 0.5 ? 4 : 3,
        rotation: (Math.random() - 0.5) * 180,
      };
    });

    setParticles(newParticles);
    setClaimStatus("claimed");
    setIsPopping(true);

    // Smooth countdown to 0.00
    const steps = 15;
    const intervalTime = 300 / steps;
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      setBalance(Number((currentBal * (1 - progress)).toFixed(2)));
      if (stepCount >= steps) {
        clearInterval(interval);
        setBalance(0.0);
        setIsPopping(false);
      }
    }, intervalTime);

    // Reset after 2.8 seconds with fresh streaming balance and count-up pop
    setTimeout(() => {
      setClaimStatus("idle");
      setParticles([]);
      setIsPopping(true);

      let reloadFrame: number;
      const reloadDuration = 500;
      const reloadStart = performance.now();
      const targetReload = 24.5;
      const reloadAnim = (now: number) => {
        const elapsed = now - reloadStart;
        const progress = Math.min(1, elapsed / reloadDuration);
        const ease = 1 - Math.pow(1 - progress, 3);
        setBalance(Number((ease * targetReload).toFixed(2)));
        if (progress < 1) {
          reloadFrame = requestAnimationFrame(reloadAnim);
        } else {
          setBalance(targetReload);
          setIsPopping(false);
        }
      };
      reloadFrame = requestAnimationFrame(reloadAnim);
    }, 2800);
  };

  return (
    <div className="w-full max-w-[420px] p-7 rounded-[26px] bg-white border border-black/[0.06] shadow-[0_12px_32px_-8px_rgba(20,15,10,0.06)] relative overflow-hidden">
      {/* Subtle ambient warmth glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(ellipse_at_top_right,rgba(255,92,24,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Balance Display */}
      <div className="py-4 text-center space-y-6 relative z-10">
        <div>
          <span className="text-xs font-mono text-[#8E8B88] uppercase tracking-wider block">
            Accrued Yield
          </span>
          <div className="flex items-baseline justify-center gap-1.5 mt-1.5">
            <motion.span
              key={`bal-${claimStatus}`}
              animate={{
                scale: isPopping ? [0.94, 1.08, 1] : [1.02, 1],
              }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl font-extrabold font-jakarta text-[#111113] tracking-tight inline-block tabular-nums"
            >
              ${balance.toFixed(2)}
            </motion.span>
            <span className="text-sm font-bold text-[#FF5C18]">USDC</span>
          </div>
        </div>

        {/* Claim Action Button with Attributes of Simulate Button */}
        <div className="flex justify-center relative">
          {/* Subtle Minimalist Micro-Confetti Burst */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: p.targetX,
                  y: p.targetY,
                  scale: [0, 1.2, 0.4],
                  opacity: [1, 1, 0],
                  rotate: p.rotation,
                }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.size > 3 ? "2px" : "50%",
                }}
                className="absolute shadow-sm"
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClaim}
            disabled={claimStatus !== "idle"}
            className="py-3 px-8 rounded-xl bg-[#111113] text-white font-jakarta text-xs font-semibold hover:bg-black transition-colors cursor-pointer shadow-sm text-center"
          >
            <AnimatePresence mode="wait">
              {claimStatus === "idle" ? (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  Claim USDC
                </motion.span>
              ) : (
                <motion.span
                  key="claimed"
                  initial={{ opacity: 0, y: 3, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="block tracking-wider font-bold text-white"
                >
                  Claimed
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
