"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Coins, CheckCircle, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

interface ClaimDividendsProps {
  userShares: number;
  totalShares: number;
  pendingDividendsUsdc: number;
  claimedDividendsUsdc: number;
  onClaim: () => void;
}

export function ClaimDividendsCard({
  userShares = 50_000,
  totalShares = 1_000_000,
  pendingDividendsUsdc = 15.0,
  claimedDividendsUsdc = 35.0,
  onClaim,
}: ClaimDividendsProps) {
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const ownershipPercent = ((userShares / totalShares) * 100).toFixed(2);

  const handleClaim = () => {
    if (pendingDividendsUsdc <= 0) return;
    setClaiming(true);

    setTimeout(() => {
      setClaiming(false);
      setJustClaimed(true);
      onClaim();

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E58B6D", "#F8A882", "#10B981", "#0F0F11"],
      });

      setTimeout(() => setJustClaimed(false), 3000);
    }, 1000);
  };

  return (
    <div className="w-full bg-white/60 backdrop-blur-2xl border border-white/85 rounded-[28px] p-7 shadow-porcelain">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold">
              Shareholder Portal
            </span>
            <span className="text-xs text-neutral-400">
              Accumulated-Share Accounting (Pull Principle)
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-obsidian tracking-tight mt-1.5">
            Your Dividend Payouts
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/80 border border-white/95 text-right shadow-sm">
            <div className="text-[11px] text-neutral-400 font-medium">Your Equity</div>
            <div className="text-sm font-extrabold text-obsidian font-mono">
              {userShares.toLocaleString()} Shares ({ownershipPercent}%)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {/* Unclaimed Pending */}
        <div className="p-5 rounded-2xl bg-white/75 border border-white/95 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slateText/70 font-medium">
            <span>Pending to Claim</span>
            <Sparkles className="w-4 h-4 text-peach-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-obsidian font-mono">
              ${pendingDividendsUsdc.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-0.5">
              Accumulated from store sales
            </div>
          </div>
          <div className="text-[11px] text-neutral-400">
            No Gas Push Limit
          </div>
        </div>

        {/* Claimed to date */}
        <div className="p-5 rounded-2xl bg-white/75 border border-white/95 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slateText/70 font-medium">
            <span>Total Claimed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-obsidian font-mono">
              ${claimedDividendsUsdc.toFixed(2)}
            </div>
            <div className="text-xs text-slateText/70 mt-0.5">
              USDC deposited in wallet
            </div>
          </div>
          <div className="text-[11px] text-neutral-400">
            Fully settled on Solana
          </div>
        </div>

        {/* Action Button Card */}
        <div className="p-5 rounded-2xl bg-peach-50/50 border border-peach-200/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-peach-900 font-semibold">
            <span>Claim Instruction</span>
            <Coins className="w-4 h-4 text-peach-600" />
          </div>
          <p className="text-xs text-peach-800/80 my-2">
            Pulls all accrued profit share directly from the DividendVault PDA into your wallet.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={claiming || pendingDividendsUsdc <= 0}
            onClick={handleClaim}
            className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
              justClaimed
                ? "bg-emerald-600 text-white"
                : pendingDividendsUsdc > 0
                ? "bg-obsidian text-white hover:bg-black/90 cursor-pointer"
                : "bg-black/10 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {claiming ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Pulling Claim...</span>
              </>
            ) : justClaimed ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Claimed Successfully!</span>
              </>
            ) : (
              <>
                <span>Claim ${pendingDividendsUsdc.toFixed(2)} USDC</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slateText/70 pt-2 border-t border-black/[0.05]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Constant Compute Budget: O(1) withdrawal complexity independent of holder count</span>
        </div>
        <span className="font-mono text-neutral-400">Anchor PDA: claim_dividends</span>
      </div>
    </div>
  );
}
