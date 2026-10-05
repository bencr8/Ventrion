"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  Check,
  Vote,
} from "lucide-react";

export function FundingRoundMachine() {
  const [totalRaised, setTotalRaised] = useState(105000);
  const targetRaise = 150000;
  const valuation = 1000000; // $1M pre-money
  const sharePrice = 1.0; // $1.00 per share (150,000 shares for $150k = 15% equity)

  // Interactive contribution state
  const [investAmount, setInvestAmount] = useState<number>(500);
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);
  const [backerCount, setBackerCount] = useState(42);

  // Milestone 2 Verification Vote State
  const [m2VotesFor, setM2VotesFor] = useState(420000);
  const quorumTarget = 510000; // 51% of 1,000,000
  const [hasVotedM2, setHasVotedM2] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [m2Released, setM2Released] = useState(false);

  // Handle contribution
  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (investAmount <= 0) return;
    setIsInvesting(true);

    setTimeout(() => {
      setIsInvesting(false);
      setInvestmentSuccess(true);
      setTotalRaised((prev) => Math.min(targetRaise, prev + investAmount));
      setBackerCount((prev) => prev + 1);

      setTimeout(() => {
        setInvestmentSuccess(false);
      }, 3000);
    }, 1200);
  };

  // Handle Milestone 2 Vote
  const handleVoteM2 = () => {
    if (hasVotedM2 || m2Released) return;
    setIsVoting(true);

    setTimeout(() => {
      setIsVoting(false);
      setHasVotedM2(true);
      const newVotes = m2VotesFor + 95000; // user casts their 95k shares
      setM2VotesFor(newVotes);

      if (newVotes >= quorumTarget) {
        setM2Released(true);
      }
    }, 1000);
  };

  const progressPct = Math.min(100, Math.round((totalRaised / targetRaise) * 100));

  return (
    <section className="w-full">
      {/* SECTION HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span>Institutional Capital Formation on Solana</span>
        </div>
        <h2 className="text-3xl font-extrabold text-obsidian tracking-tight mt-1">
          Milestone Escrow Funding Rounds
        </h2>
        <p className="text-sm text-slateText/80 mt-1 max-w-2xl">
          Startups raise seed capital without trusting a third party. Investor funds are locked in an on-chain
          milestone escrow PDA and released in tranches as milestone deliverables are verified by backer float approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ACTIVE ROUND & MILESTONE TRANCHES (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Campaign Card */}
          <div className="p-7 rounded-[28px] bg-white/65 backdrop-blur-xl border border-white/90 shadow-porcelain">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Seed Round
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">14 Days Remaining</span>
                </div>
                <h3 className="text-2xl font-extrabold text-obsidian mt-2 tracking-tight">
                  Nexus AI Logistics ($NXAI)
                </h3>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Autonomous supply chain robotics & predictive inventory on Solana
                </div>
              </div>

              <div className="text-right sm:text-right">
                <div className="text-xs text-neutral-400">Pre-Money Valuation</div>
                <div className="text-lg font-mono font-black text-obsidian">${(valuation / 1000).toFixed(0)}k USDC</div>
              </div>
            </div>

            {/* Raise Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold text-neutral-500">
                  Total Capital Pledged:
                </span>
                <span className="font-mono text-sm font-bold text-obsidian">
                  ${totalRaised.toLocaleString()} / ${targetRaise.toLocaleString()} USDC ({progressPct}%)
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-black/5 overflow-hidden p-0.5 border border-black/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-peach-500 to-emerald-500 shadow-sm"
                />
              </div>
            </div>

            {/* Key Round Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-black/[0.05] text-center">
              <div>
                <div className="text-[11px] text-neutral-400 font-medium">Backers</div>
                <div className="text-base font-bold text-obsidian font-mono mt-0.5">{backerCount} angels</div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-400 font-medium">Share Price</div>
                <div className="text-base font-bold text-obsidian font-mono mt-0.5">$1.00 USDC</div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-400 font-medium">Equity Allocated</div>
                <div className="text-base font-bold text-obsidian font-mono mt-0.5">150,000 (15%)</div>
              </div>
            </div>
          </div>

          {/* 3 Milestone Tranches Escrow Card */}
          <div className="p-7 rounded-[28px] bg-white/65 backdrop-blur-xl border border-white/90 shadow-porcelain">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-obsidian tracking-tight">
                  Milestone Escrow Tranches (3 x $50k)
                </h4>
                <div className="text-xs text-neutral-500">
                  Funds only leave escrow upon cryptographic verification of deliverables.
                </div>
              </div>
              <Lock className="w-5 h-5 text-neutral-400" />
            </div>

            <div className="space-y-3.5">
              {/* Tranche 1: Released */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Tranche 1: Architecture & Smart Contract Audit ($50,000)
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Audit passed with zero high-severity findings • Released to founder
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-200/70 text-emerald-900">
                  Released
                </span>
              </div>

              {/* Tranche 2: Under Review & Voting Active */}
              <div className={`p-4 rounded-2xl border transition-all ${
                m2Released
                  ? "bg-emerald-50/60 border-emerald-200/80"
                  : "bg-amber-50/70 border-amber-300/80"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      m2Released ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {m2Released ? <Check className="w-4 h-4" /> : "2"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-obsidian">
                        Tranche 2: Mainnet Beta & 1,000 Stores ($50,000)
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {m2Released
                          ? "Quorum achieved! $50k disbursed to founder development account."
                          : "Live on Solana Mainnet • Verification vote in progress"}
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    m2Released
                      ? "bg-emerald-200/70 text-emerald-900"
                      : "bg-amber-200/70 text-amber-900"
                  }`}>
                    {m2Released ? "Approved" : "Voting Active"}
                  </span>
                </div>

                {/* Quorum Progress for Tranche 2 */}
                {!m2Released && (
                  <div className="mt-3 pt-3 border-t border-amber-200/60">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-amber-950">Backer Quorum Approval:</span>
                      <span className="font-mono text-amber-900">
                        {m2VotesFor.toLocaleString()} / {quorumTarget.toLocaleString()} votes ({Math.round((m2VotesFor / quorumTarget) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-amber-200/50 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (m2VotesFor / quorumTarget) * 100)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleVoteM2}
                        disabled={hasVotedM2 || isVoting}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-obsidian text-white text-xs font-semibold hover:bg-black/90 transition-all disabled:opacity-50"
                      >
                        <Vote className="w-3.5 h-3.5 text-peach-400" />
                        <span>{hasVotedM2 ? "Voted (+95,000 Votes)" : "Vote to Verify Deliverables"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tranche 3: Locked */}
              <div className="p-4 rounded-2xl bg-neutral-100/50 border border-black/5 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-800">
                      Tranche 3: $1M GMV Scale & Global Fulfillment API ($50,000)
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Unlocks only after Tranche 2 is executed and verified.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-700">
                  Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE INVESTMENT WIDGET (5 COLS) */}
        <div className="lg:col-span-5 p-7 rounded-[28px] bg-white/75 backdrop-blur-xl border border-white/95 shadow-porcelain flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Angel Investment Portal
            </div>
            <h4 className="text-xl font-extrabold text-obsidian mt-1">
              Participate in Seed Round
            </h4>
            <p className="text-xs text-neutral-500 mt-1">
              Pledge USDC on Solana to receive programmatic equity shares held in a 12-month linear cliff PDA.
            </p>

            {/* Form */}
            <form onSubmit={handleContribute} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian mb-1.5">
                  Investment Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(Number(e.target.value))}
                    className="w-full pl-4 pr-16 py-3 rounded-2xl bg-white/90 border border-black/10 text-base font-mono font-bold text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                    required
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    USDC
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex gap-1.5 mt-2">
                  {[250, 500, 1000, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInvestAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        investAmount === amt
                          ? "bg-obsidian text-white"
                          : "bg-black/5 text-neutral-600 hover:bg-black/10"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share & Equity Allocation Summary */}
              <div className="p-4 rounded-2xl bg-porcelain-100 border border-black/[0.04] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Equity Shares Allocated:</span>
                  <span className="font-mono font-bold text-obsidian">
                    {Math.round(investAmount / sharePrice).toLocaleString()} $NXAI Shares
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ownership Stake:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {((investAmount / valuation) * 100).toFixed(4)}% Equity
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Smart Contract Custody:</span>
                  <span className="font-mono text-neutral-700">MilestoneEscrowVault (PDA)</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isInvesting || investmentSuccess}
                type="submit"
                className={`w-full py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                  investmentSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-obsidian text-white hover:bg-black/90"
                }`}
              >
                {isInvesting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing Solana Escrow Deposit...</span>
                  </>
                ) : investmentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Shares Minted & Allocated!</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-peach-400" />
                    <span>Contribute ${investAmount} USDC to Round</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.05] text-[11px] text-neutral-500 text-center">
            🔒 Investor protection: Unreleased milestone funds can be refunded if founder abandons roadmap.
          </div>
        </div>
      </div>
    </section>
  );
}
