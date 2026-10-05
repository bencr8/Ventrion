"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ShoppingBag, ArrowRightLeft, CheckCircle2, Coins, Truck, Landmark, UserCheck, Zap, Layers, Sparkles } from "lucide-react";

export function Phase04DemoShopCard() {
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [salesCount, setSalesCount] = useState<number>(37);
  const [tradingFeeYield, setTradingFeeYield] = useState<number>(142.80);
  const [userPendingDividends, setUserPendingDividends] = useState<number>(18.54);
  const [userClaimedDividends, setUserClaimedDividends] = useState<number>(64.20);
  const [lastSplitTx, setLastSplitTx] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimedSuccess, setClaimedSuccess] = useState<boolean>(false);

  // When customer simulates an optional commercial purchase
  const handleSimulatePurchase = () => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    setLastSplitTx(true);

    setTimeout(() => {
      setIsCheckingOut(false);
      setSalesCount((prev) => prev + 1);
      // 5% equity on $30.78 net profit = +$1.54 USDC
      setUserPendingDividends((prev) => prev + 1.54);

      setTimeout(() => {
        setLastSplitTx(false);
      }, 4000);
    }, 1100);
  };

  // When shareholder claims their USDC dividends
  const handleClaimDividends = () => {
    if (userPendingDividends <= 0 || isClaiming) return;
    setIsClaiming(true);

    setTimeout(() => {
      setIsClaiming(false);
      setUserClaimedDividends((prev) => prev + userPendingDividends);
      setUserPendingDividends(0);
      setClaimedSuccess(true);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FF5C18", "#FF8A50", "#10B981", "#111113"],
      });

      setTimeout(() => setClaimedSuccess(false), 3000);
    }, 850);
  };

  return (
    <div className="w-full rounded-[32px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-cardFloat p-6 sm:p-9 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_20%,rgba(255,92,24,0.08)_0%,transparent_70%)] pointer-events-none -z-0" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-black/[0.06] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-md">
            <Coins className="w-5 h-5 text-[#FF5C18]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C18] font-jakarta">
                Phase 4 • Cashflow Architecture
              </span>
              <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                1. Base Trading Yield + 2. Optional Commercial Flow
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#111113] tracking-tight font-jakarta mt-1">
              Automated Trading Fees & Optional Business Profit Streaming
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Real Yield • Dual Source</span>
        </div>
      </div>

      {/* Two Revenue Channels Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 relative z-10">
        {/* Channel 1: Automatic Base Yield */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#111113] text-white flex items-center justify-center shrink-0 mt-0.5">
            <ArrowRightLeft className="w-4 h-4 text-[#FF5C18]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111113] font-jakarta">1. Base Layer: Secondary Trading Fees</span>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200/60">Always Active</span>
            </div>
            <p className="text-[11.5px] text-[#5A5652] leading-relaxed">
              Every buy and sell in the Meteora DLMM pool generates dynamic protocol fees. These trading fees are automatically routed into the Master Dividend Vault, generating continuous non-custodial yield for shareholders by default.
            </p>
          </div>
        </div>

        {/* Channel 2: Optional Business Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/40 border border-orange-200/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111113] font-jakarta">2. Optional Layer: Commercial Profit Flow</span>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200/80">Founder Opt-In</span>
            </div>
            <p className="text-[11.5px] text-[#5A5652] leading-relaxed">
              Founders running real-world operations can optionally connect customer revenues (e.g. via Solana Pay, Stripe webhooks, or custom merchant APIs) to automatically distribute real product profits directly to shareholders.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Interactive Example Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-7 relative z-10">
        {/* Step 1: The Product Storefront Example (4 Cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-[#8E8B88] mb-3 font-mono">
              <span className="font-bold text-orange-900">Example Store Integration</span>
              <span className="font-bold text-[#111113]">{salesCount} Orders Settled</span>
            </div>

            {/* Product Card Visual */}
            <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-[#1E1E22] to-[#111113] p-4 flex flex-col justify-between text-white relative overflow-hidden shadow-sm">
              <div className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5C18] text-white">
                Optional D2C Setup
              </div>
              <div>
                <span className="text-[10.5px] text-white/60 uppercase font-mono tracking-wider">500 GSM French Terry</span>
                <div className="text-base font-bold font-jakarta mt-0.5">Genesis Heavyweight Hoodie</div>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-2xl font-extrabold font-mono text-[#FF8A50]">$60.00 USDC</span>
                <span className="text-[10px] text-white/70 font-mono">Solana Pay / Card / POS</span>
              </div>
            </div>

            <p className="text-[11.5px] text-[#5A5652] mt-3.5 leading-relaxed">
              When a customer buys this hoodie via an optional checkout integration (e.g. Solana Pay or credit card webhook), funds settle in ~400ms across the program&apos;s atomic revenue waterfall.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={isCheckingOut}
            onClick={handleSimulatePurchase}
            className="w-full mt-4 py-3.5 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-bold font-jakarta flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {isCheckingOut ? (
              <span className="animate-pulse">Splitting 60 USDC on Solana...</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-[#FF5C18]" />
                <span>Simulate Optional Sale ($60 USDC)</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Step 2: The 4-Way Programmatic Revenue Waterfall (4 Cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-white border border-black/[0.06] shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-[#111113] mb-3">
              <span>Configurable Profit Waterfall</span>
              <span className="font-mono text-[#8E8B88] text-[11px]">$60.00 Per Unit</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* 1. COGS */}
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <span className="font-bold text-orange-950 block text-[11.5px]">1. Factory COGS ($24.00)</span>
                    <span className="text-[10px] text-orange-700/90 font-mono">Whitelisted: Apex PrintWorks</span>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-bold text-orange-800">40.0%</span>
              </div>

              {/* 2. Reserves */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-blue-950 block text-[11.5px]">2. Tax & Reserves ($3.60)</span>
                    <span className="text-[10px] text-blue-700/90 font-mono">Segregated in Operating PDA</span>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-bold text-blue-800">6.0%</span>
              </div>

              {/* 3. CEO Salary */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-bold text-purple-950 block text-[11.5px]">3. CEO Salary ($1.62)</span>
                    <span className="text-[10px] text-purple-700/90 font-mono">Governance-Capped Margin</span>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-bold text-purple-800">2.7%</span>
              </div>

              {/* 4. Dividend Pool */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-300/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block text-[11.5px]">4. Dividend Vault ($30.78)</span>
                    <span className="text-[10px] text-emerald-700 font-medium">Distributed to Shareholders</span>
                  </div>
                </div>
                <span className="font-mono text-[10.5px] font-bold text-emerald-800">51.3% Net</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#8E8B88] font-mono text-center pt-2">
            Non-custodial: Founder cannot tamper with automated distributions.
          </div>
        </div>

        {/* Step 3: The Shareholder Experience (4 Cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#FFFFFF] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-[#111113]">Your Shareholder Portal</span>
              <span className="font-mono text-[11px] text-[#FF5C18] font-bold">50,000 Shares (5.0%)</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-black/[0.05] shadow-xs my-2 text-center relative overflow-hidden">
              {lastSplitTx && (
                <div className="absolute top-1 right-2 text-[10px] font-bold text-emerald-600 animate-bounce">
                  + $1.54 USDC Net Profit!
                </div>
              )}
              <span className="text-[11px] text-[#8E8B88] uppercase tracking-wider font-semibold block">
                Claimable Dividend Balance
              </span>
              <div className="flex items-baseline justify-center gap-1 my-1">
                <span className="text-3xl font-extrabold text-[#111113] font-jakarta tracking-tight">
                  ${userPendingDividends.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-[#FF5C18]">USDC</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#8E8B88] font-mono px-2 pt-1 border-t border-black/[0.04]">
                <span>Trading Fees: +${tradingFeeYield.toFixed(2)}</span>
                <span>Commercial: +${(salesCount * 1.54).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5A5652] leading-relaxed">
              Pull Architecture: Withdraw anytime in constant $O(1)$ compute complexity. Zero loop gas limit, no lockup required for basic payouts.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={userPendingDividends <= 0 || isClaiming}
            onClick={handleClaimDividends}
            className={`w-full mt-4 py-3.5 rounded-xl text-xs font-bold font-jakarta flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              claimedSuccess
                ? "bg-emerald-600 text-white"
                : userPendingDividends > 0
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-black/10 text-[#8E8B88] cursor-not-allowed"
            }`}
          >
            {isClaiming ? (
              <span>Pulling Claim from Vault...</span>
            ) : claimedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>USDC Claimed to Wallet!</span>
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 text-white" />
                <span>Claim ${userPendingDividends.toFixed(2)} USDC</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
