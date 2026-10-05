"use client";

import React from "react";
import { motion } from "framer-motion";
import { Truck, Landmark, UserCheck, Coins, ArrowDown } from "lucide-react";

interface WaterfallProps {
  priceUsdc: number;
  cogsUsdc: number;
  reserveRateBps?: number;
  ceoSalaryBps?: number;
}

export function WaterfallSplitVisualizer({
  priceUsdc = 60.0,
  cogsUsdc = 24.0,
  reserveRateBps = 1000,
  ceoSalaryBps = 500,
}: WaterfallProps) {
  const grossProfit = priceUsdc - cogsUsdc;
  const reserveAmount = (grossProfit * reserveRateBps) / 10000;
  const netProfit = grossProfit - reserveAmount;
  const ceoSalary = (netProfit * ceoSalaryBps) / 10000;
  const dividendAmount = netProfit - ceoSalary;

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-6 shadow-porcelain">
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
        <div>
          <h3 className="text-base font-bold text-obsidian tracking-tight">
            Programmable Revenue Waterfall
          </h3>
          <p className="text-xs text-slateText/70 mt-0.5">
            Non-custodial split executed atomically on the Solana smart contract
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-400 font-medium">Customer Checkout</div>
          <div className="text-xl font-extrabold text-obsidian font-mono">
            ${priceUsdc.toFixed(2)} USDC
          </div>
        </div>
      </div>

      {/* Arrow Down Indicator */}
      <div className="flex justify-center my-3 text-neutral-400">
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </div>

      {/* Waterfall Distribution Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: COGS */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/50 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-800">
              1. Supplier COGS
            </span>
            <Truck className="w-4 h-4 text-orange-600" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-orange-950 font-mono">
              ${cogsUsdc.toFixed(2)}
            </div>
            <div className="text-[11px] text-orange-700/80 mt-0.5">
              Direct to PrintWorks wallet
            </div>
          </div>
          <div className="text-[10px] text-orange-600/70 font-mono">
            Untouchable by Founder
          </div>
        </motion.div>

        {/* Step 2: Reserves */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/50 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
              2. Operating Reserves
            </span>
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-blue-950 font-mono">
              ${reserveAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">
              {(reserveRateBps / 100).toFixed(0)}% Tax & Ops PDA Vault
            </div>
          </div>
          <div className="text-[10px] text-blue-600/70 font-mono">
            Treasury Locked
          </div>
        </motion.div>

        {/* Step 3: CEO Salary */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/50 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-800">
              3. CEO Salary
            </span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-purple-950 font-mono">
              ${ceoSalary.toFixed(2)}
            </div>
            <div className="text-[11px] text-purple-700/80 mt-0.5">
              {(ceoSalaryBps / 100).toFixed(1)}% of Net Profit
            </div>
          </div>
          <div className="text-[10px] text-purple-600/70 font-mono">
            Governance Capped
          </div>
        </motion.div>

        {/* Step 4: Shareholder Dividends */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300/60 flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              4. Dividend Vault
            </span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-emerald-950 font-mono">
              ${dividendAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-700/90 mt-0.5">
              1,000,000 Shares Pool
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 font-mono font-medium">
            +${(dividendAmount / 1_000_000).toFixed(6)} / share
          </div>
        </motion.div>
      </div>
    </div>
  );
}
