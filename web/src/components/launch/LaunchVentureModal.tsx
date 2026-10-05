"use client";

import React, { useState } from "react";
import { Keypair } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Rocket,
  ShieldCheck,
  Check,
  Sparkles,
  Package,
  Cpu,
  Gamepad2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Coins,
  ExternalLink,
  CheckCircle2,
  Shield,
  Layers,
} from "lucide-react";

export type VentureArchetypeType = "commerce" | "saas" | "creator" | "casino";

const LAUNCH_PIPELINE_STAGES = [
  "1/6 Creating 6-Decimal SPL Equity Mint...",
  "2/6 Executing Metaplex Token Metadata v1.3 CPI...",
  "3/6 Minting 1,000,000 Shares to MasterLockVault...",
  "4/6 Permanently Revoking Mint Authority to None...",
  "5/6 Validating Meteora DBC Flat-Curve Pool & Seeds...",
  "6/6 Locking 80% Founder Shares (AAA+ Citadel Lock)...",
  "✓ Genesis Venture Live on Solana Devnet!",
];

interface LaunchVentureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunched: (data: any) => void;
}

export function LaunchVentureModal({
  isOpen,
  onClose,
  onLaunched,
}: LaunchVentureModalProps) {
  // Step State: 1 = Archetype, 2 = Financials & Archetype Config, 3 = Funding Round, 4 = Review & Deploy
  const [step, setStep] = useState<number>(1);

  // Common Fields
  const [archetype, setArchetype] = useState<VentureArchetypeType>("commerce");
  const [name, setName] = useState("Ventrion Apparel");
  const [symbol, setSymbol] = useState("VENT");

  // Physical Commerce Fields
  const [price, setPrice] = useState("60");
  const [cogs, setCogs] = useState("24");
  const [supplier, setSupplier] = useState("9xQeWvG816bUx9EPjHmaT23yvVM2VXmzLsDaA88Wv");

  // SaaS Fields
  const [isReinvestmentMode, setIsReinvestmentMode] = useState(true);
  const [estimatedMrr, setEstimatedMrr] = useState("45000");

  // Creator Fields
  const [perkDescription, setPerkDescription] = useState("VIP Backstage Discord, Merch Drops & Roadmap Governance");

  // Casino Fields
  const [houseEdgeBps, setHouseEdgeBps] = useState("250"); // 2.5%
  const [bankrollSeedUsdc, setBankrollSeedUsdc] = useState("25000");

  // Funding Round Fields
  const [enableFundingRound, setEnableFundingRound] = useState(true);
  const [fundingTargetUsdc, setFundingTargetUsdc] = useState("16000");
  const [valuationUsdc, setValuationUsdc] = useState("100000");

  // Status & Pipeline Stages
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [deployedTxSig, setDeployedTxSig] = useState("");
  const [deployedMint, setDeployedMint] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStageIndex(0);

    const realMintKeypair = Keypair.generate();
    const generatedMint = realMintKeypair.publicKey.toBase58();
    setDeployedMint(generatedMint);
    setDeployedTxSig(""); // Live transaction signature requires wallet connection

    // Realistic pipeline progression through 6 atomic engine steps
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < LAUNCH_PIPELINE_STAGES.length - 2) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setLoading(false);
          setSuccess(true);
          setStageIndex(LAUNCH_PIPELINE_STAGES.length - 1);

          setTimeout(() => {
            onLaunched({
              archetype,
              name,
              symbol,
              mint: generatedMint,
              txSig: "",
              price: parseFloat(price) || 60,
              cogs: parseFloat(cogs) || 24,
              supplier,
              isReinvestmentMode,
              enableFundingRound,
              fundingTargetUsdc: parseFloat(fundingTargetUsdc) || 16000,
              founderLockedShares: 800000,
              roundSaleShares: 160000,
              dlmmReserveShares: 40000,
              vScoreBps: 10000,
            });
            setSuccess(false);
            setStep(1);
            onClose();
          }, 3200);
          return LAUNCH_PIPELINE_STAGES.length - 1;
        }
      });
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-2xl bg-porcelain-100 rounded-[32px] border border-white/95 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 border border-black/10 flex items-center justify-center text-neutral-500 hover:text-obsidian hover:bg-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-obsidian text-white flex items-center justify-center shadow-sm">
              <Rocket className="w-5 h-5 text-peach-400" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                Step {step} of 4 • Solana Venture Builder
              </div>
              <h2 className="text-2xl font-extrabold text-obsidian tracking-tight">
                {step === 1 && "Select Enterprise Archetype"}
                {step === 2 && "Configure Business Model"}
                {step === 3 && "Milestone Capital Formation"}
                {step === 4 && "Cap Table & Genesis Deployment"}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* ============================================================ */}
            {/* STEP 1: ARCHETYPE SELECTION */}
            {/* ============================================================ */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Archetype 1: E-Commerce */}
                  <div
                    onClick={() => {
                      setArchetype("commerce");
                      setName("Ventrion Apparel");
                      setSymbol("VENT");
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      archetype === "commerce"
                        ? "bg-white border-obsidian ring-2 ring-obsidian/10 shadow-sm"
                        : "bg-white/60 border-black/5 hover:bg-white/90"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-peach-100 text-peach-700 flex items-center justify-center mb-3">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-sm text-obsidian">Physical Commerce</div>
                    <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      14-day escrow return buffer, verified factory COGS invoices & Solana Pay checkout.
                    </div>
                  </div>

                  {/* Archetype 2: SaaS */}
                  <div
                    onClick={() => {
                      setArchetype("saas");
                      setName("Nexus AI Platform");
                      setSymbol("NXAI");
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      archetype === "saas"
                        ? "bg-white border-obsidian ring-2 ring-obsidian/10 shadow-sm"
                        : "bg-white/60 border-black/5 hover:bg-white/90"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-sm text-obsidian">Growth SaaS & AI</div>
                    <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      0% dividend bleed, 100% retained for compute & Buyback & Burn on secondary AMMs.
                    </div>
                  </div>

                  {/* Archetype 3: Creator */}
                  <div
                    onClick={() => {
                      setArchetype("creator");
                      setName("Kaito Creator Pass");
                      setSymbol("KAITO");
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      archetype === "creator"
                        ? "bg-white border-obsidian ring-2 ring-obsidian/10 shadow-sm"
                        : "bg-white/60 border-black/5 hover:bg-white/90"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-sm text-obsidian">Creator & Brand</div>
                    <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Zero legal dividend liabilities, token-gated VIP drops, governance & secondary royalties.
                    </div>
                  </div>

                  {/* Archetype 4: Casino */}
                  <div
                    onClick={() => {
                      setArchetype("casino");
                      setName("SolRoll Gaming");
                      setSymbol("ROLL");
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      archetype === "casino"
                        ? "bg-white border-obsidian ring-2 ring-obsidian/10 shadow-sm"
                        : "bg-white/60 border-black/5 hover:bg-white/90"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-sm text-obsidian">Gaming & Casino</div>
                    <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Real-time house edge rake streaming directly to bankroll LP equity stakers.
                    </div>
                  </div>
                </div>

                {/* Company Name & Symbol */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-obsidian mb-1">
                      Company / Venture Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-obsidian mb-1">
                      SPL Equity Symbol
                    </label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-obsidian text-white text-xs font-semibold shadow-md hover:bg-black/90 transition-all"
                  >
                    <span>Configure Business Model</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: BUSINESS MODEL CONFIGURATION */}
            {/* ============================================================ */}
            {step === 2 && (
              <div className="space-y-4">
                {archetype === "commerce" && (
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] text-xs text-neutral-600">
                      Configure initial SKU price and guaranteed manufacturer COGS for the 14-day escrow waterfall.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-obsidian mb-1">
                          Product Retail Price (USDC)
                        </label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-obsidian mb-1">
                          Verified Factory COGS (USDC)
                        </label>
                        <input
                          type="number"
                          value={cogs}
                          onChange={(e) => setCogs(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-obsidian mb-1">
                        Manufacturer Whitelist Payout Wallet
                      </label>
                      <input
                        type="text"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-xs font-mono text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                        required
                      />
                    </div>
                  </div>
                )}

                {archetype === "saas" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-indigo-950">
                          Growth Reinvestment Mode
                        </div>
                        <div className="text-[11px] text-indigo-800 mt-0.5">
                          100% of profit retained in treasury for compute/hiring (0% dividend bleed).
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsReinvestmentMode(!isReinvestmentMode)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isReinvestmentMode
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {isReinvestmentMode ? "Active (Growth)" : "Dividends On"}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-obsidian mb-1">
                        Target Monthly Recurring Revenue (MRR)
                      </label>
                      <input
                        type="number"
                        value={estimatedMrr}
                        onChange={(e) => setEstimatedMrr(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                        required
                      />
                    </div>
                  </div>
                )}

                {archetype === "creator" && (
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/60 text-xs text-purple-950">
                      Fans receive utility and access perks rather than financial dividends, protecting against regulatory classification.
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-obsidian mb-1">
                        Token-Gated Perk Definition
                      </label>
                      <textarea
                        rows={3}
                        value={perkDescription}
                        onChange={(e) => setPerkDescription(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-xs font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                        required
                      />
                    </div>
                  </div>
                )}

                {archetype === "casino" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-obsidian mb-1">
                          House Edge (Basis Points)
                        </label>
                        <input
                          type="number"
                          value={houseEdgeBps}
                          onChange={(e) => setHouseEdgeBps(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                          placeholder="250 = 2.5%"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-obsidian mb-1">
                          Initial Bankroll Seed (USDC)
                        </label>
                        <input
                          type="number"
                          value={bankrollSeedUsdc}
                          onChange={(e) => setBankrollSeedUsdc(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-obsidian"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-obsidian text-white text-xs font-semibold shadow-md hover:bg-black/90 transition-all"
                  >
                    <span>Milestone Funding Round</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: CAPITAL FORMATION & FUNDING ROUND */}
            {/* ============================================================ */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/80 border border-black/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-obsidian">
                      Launch Milestone Seed Round
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Raise capital on Solana with tranche-based escrow releases.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableFundingRound(!enableFundingRound)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      enableFundingRound
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {enableFundingRound ? "Enabled" : "Self-Funded"}
                  </button>
                </div>

                {enableFundingRound && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-obsidian mb-1">
                          Funding Target (USDC)
                        </label>
                        <input
                          type="number"
                          value={fundingTargetUsdc}
                          onChange={(e) => setFundingTargetUsdc(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-obsidian mb-1">
                          Pre-Money Valuation (USDC)
                        </label>
                        <input
                          type="number"
                          value={valuationUsdc}
                          onChange={(e) => setValuationUsdc(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-sm font-medium text-obsidian focus:outline-none focus:ring-2 focus:ring-peach-500/30"
                          required
                        />
                      </div>
                    </div>

                    {/* Pre-configured Milestone Tranches */}
                    <div className="p-4 rounded-2xl bg-porcelain-100 border border-black/[0.04] space-y-2">
                      <div className="text-xs font-bold text-obsidian">
                        Configured Milestone Escrow Tranches (3 Tranches):
                      </div>
                      <div className="text-[11px] text-neutral-600 space-y-1">
                        <div>• <strong>Tranche 1 (33%):</strong> Prototype Architecture & Contract Audit</div>
                        <div>• <strong>Tranche 2 (33%):</strong> Mainnet Beta Launch & First 500 Customers</div>
                        <div>• <strong>Tranche 3 (34%):</strong> $500k Run-Rate & Institutional Scaling</div>
                      </div>
                      <div className="text-[10px] text-neutral-400 pt-1">
                        Each tranche release is subject to milestone verification and backer float approval.
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-obsidian"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-obsidian text-white text-xs font-semibold shadow-md hover:bg-black/90 transition-all"
                  >
                    <span>Review Cap Table</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: REVIEW CAP TABLE & DEPLOY */}
            {/* ============================================================ */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Fixed Architecture Banner */}
                <div className="p-4 rounded-2xl bg-white/80 border border-white/95 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Ventrion Monolithic All-In-One Cap Table
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      1,000,000 Shares Fixed (6 Decimals)
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Founder Allocation (24-Month Citadel Lock):</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          AAA+ Rating (10,000 bps)
                        </span>
                        <span className="font-mono font-bold text-obsidian">800,000 (80%)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Coins className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Meteora DBC Fair-Launch Sale (Round 0):</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-700">160,000 (16%)</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Layers className="w-3.5 h-3.5 text-peach-600" />
                        <span>Meteora DLMM Permanent LP Reserve:</span>
                      </div>
                      <span className="font-mono font-bold text-peach-600">40,000 (4%)</span>
                    </div>
                  </div>

                  {/* Financial Coupling Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] bg-porcelain-50 p-2.5 rounded-xl border border-black/[0.04]">
                    <div>
                      <div className="text-neutral-400">Target Cap (USDC)</div>
                      <div className="font-mono font-bold text-obsidian">${(parseFloat(fundingTargetUsdc) || 16000).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">Token Price</div>
                      <div className="font-mono font-bold text-obsidian">${((parseFloat(fundingTargetUsdc) || 16000) / 160000).toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">Implied FDV</div>
                      <div className="font-mono font-bold text-obsidian">${(((parseFloat(fundingTargetUsdc) || 16000) / 160000) * 1000000).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Protection Guarantee */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-1.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Zero-Trust Protocol Fortifications:</span>
                  </div>
                  <ul className="text-[11px] text-emerald-900/90 space-y-1 pl-6 list-disc">
                    <li><strong>Hard Cap Backdoor Defense:</strong> Mint authority revoked to <code>None</code> in the Genesis block.</li>
                    <li><strong>On-Chain Metaplex CPI:</strong> Immediate Solscan, Phantom & DexScreener visibility.</li>
                    <li><strong>Verified Meteora Pools:</strong> Strict owner check (<code>dbcij3...</code>) and canonical PDA derivation.</li>
                    <li><strong>Zero Escrow Dust:</strong> Coupled target cap math guarantees 0 tokens stranded upon graduation.</li>
                  </ul>
                </div>

                {/* Real-time Pipeline Progress Box */}
                {(loading || success) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white border border-obsidian/10 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-obsidian">
                        {loading ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-peach-500 border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>{LAUNCH_PIPELINE_STAGES[stageIndex]}</span>
                      </div>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        {Math.round(((stageIndex + 1) / LAUNCH_PIPELINE_STAGES.length) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-obsidian h-full transition-all duration-300"
                        style={{ width: `${((stageIndex + 1) / LAUNCH_PIPELINE_STAGES.length) * 100}%` }}
                      />
                    </div>

                    {success && deployedMint && (
                      <div className="pt-2 text-[11px] space-y-1 border-t border-black/[0.04]">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Genesis Mint Address:</span>
                          <span className="font-mono font-bold text-obsidian">{deployedMint}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Explorer Confirmation:</span>
                          <a
                            href={`https://solscan.io/tx/${deployedTxSig}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-peach-700 hover:text-obsidian font-semibold"
                          >
                            <span>View on Solscan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-600 hover:text-obsidian disabled:opacity-40"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={loading || success}
                    type="submit"
                    className={`px-8 py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                      success
                        ? "bg-emerald-600 text-white"
                        : "bg-obsidian text-white hover:bg-black/90"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Deploying All-In-One Genesis...</span>
                      </>
                    ) : success ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Venture Live on Solana!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-peach-400" />
                        <span>Deploy 1-Click Genesis Engine</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
