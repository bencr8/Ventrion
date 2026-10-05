"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  TrendingUp,
  Share2,
  Twitter,
  Coins,
  ShieldCheck,
  FileText,
  Download,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ExternalLink,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface VentureItem {
  id: string;
  name: string;
  symbol: string;
  archetype: string;
  yieldApy: number;
  dailyRevenueUsdc: number;
  backersCount: number;
  raisedUsdc: number;
  targetUsdc: number;
  safeHarborProtected: boolean;
  dnsSecured: boolean;
}

const DISCOVERY_VENTURES: VentureItem[] = [
  {
    id: "vent-apparel",
    name: "Ventrion Genesis Apparel",
    symbol: "VENT-APP",
    archetype: "Physical D2C",
    yieldApy: 18.4,
    dailyRevenueUsdc: 4200,
    backersCount: 142,
    raisedUsdc: 105000,
    targetUsdc: 150000,
    safeHarborProtected: true,
    dnsSecured: true,
  },
  {
    id: "nexus-ai",
    name: "Nexus Compute & AI",
    symbol: "NXAI",
    archetype: "Growth SaaS",
    yieldApy: 24.2,
    dailyRevenueUsdc: 8900,
    backersCount: 280,
    raisedUsdc: 250000,
    targetUsdc: 300000,
    safeHarborProtected: true,
    dnsSecured: true,
  },
  {
    id: "solroll",
    name: "SolRoll Provable Casino",
    symbol: "ROLL",
    archetype: "Gaming / Casino",
    yieldApy: 31.8,
    dailyRevenueUsdc: 14200,
    backersCount: 512,
    raisedUsdc: 400000,
    targetUsdc: 400000,
    safeHarborProtected: true,
    dnsSecured: true,
  },
  {
    id: "solhaven",
    name: "SolHaven Fractional Villas",
    symbol: "HAVEN",
    archetype: "Real Estate RWA",
    yieldApy: 12.6,
    dailyRevenueUsdc: 3100,
    backersCount: 94,
    raisedUsdc: 500000,
    targetUsdc: 600000,
    safeHarborProtected: true,
    dnsSecured: true,
  },
];

export function DiscoveryRadar() {
  const [selectedVenture, setSelectedVenture] = useState<VentureItem>(DISCOVERY_VENTURES[0]);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState<"yield" | "revenue" | "backers">("yield");

  // Solana Blink Interactive Simulation State
  const [blinkSigned, setBlinkSigned] = useState(false);
  const [blinkLoading, setBlinkLoading] = useState(false);

  // Curate-to-Earn Staking State
  const [scoutStakeAmount, setScoutStakeAmount] = useState(250);
  const [scoutStaked, setScoutStaked] = useState(false);

  // Tax Export State
  const [exportingTax, setExportingTax] = useState(false);
  const [taxExportSuccess, setTaxExportSuccess] = useState(false);

  // Filter & Sort
  const filteredVentures = DISCOVERY_VENTURES.filter(
    (v) =>
      v.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      v.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      v.archetype.toLowerCase().includes(filterQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "yield") return b.yieldApy - a.yieldApy;
    if (sortBy === "revenue") return b.dailyRevenueUsdc - a.dailyRevenueUsdc;
    return b.backersCount - a.backersCount;
  });

  // Handle Blink Action
  const handleBlinkInvest = () => {
    setBlinkLoading(true);
    setTimeout(() => {
      setBlinkLoading(false);
      setBlinkSigned(true);
      setTimeout(() => setBlinkSigned(false), 3000);
    }, 900);
  };

  // Handle Tax Export
  const handleTaxExport = () => {
    setExportingTax(true);
    setTimeout(() => {
      setExportingTax(false);
      setTaxExportSuccess(true);
      // Trigger instant JSON ledger download
      const data = {
        protocol: "Ventrion Protocol ($VENT)",
        venture: selectedVenture.name,
        tax_year: 2026,
        jurisdiction: "IRS Form 1099-DIV / EU DAC8 / German Finanzamt §20 EStG",
        total_revenue_processed_usdc: selectedVenture.dailyRevenueUsdc * 365,
        withheld_tax_vault_usdc: (selectedVenture.dailyRevenueUsdc * 365 * 0.15).toFixed(2),
        distributions_to_shareholders_usdc: (selectedVenture.dailyRevenueUsdc * 365 * 0.65).toFixed(2),
        cryptographic_merkle_root: "0x9f82c4e1a6b834927f819a64e10b997fe3b13279",
        timestamp: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ventrion_Tax_Report_${selectedVenture.symbol}_2026.json`;
      a.click();
      setTimeout(() => setTaxExportSuccess(false), 3000);
    }, 1100);
  };

  return (
    <section className="w-full">
      {/* SECTION HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <Compass className="w-4 h-4" />
          <span>Algorithmic Discovery, Solana Blinks & Compliance Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-obsidian tracking-tight mt-1">
          Ventrion Discovery Radar & Terminal
        </h2>
        <p className="text-sm text-slateText/85 mt-2 max-w-3xl leading-relaxed">
          How do people actually discover new on-chain companies? Ventrion replaces obscurity with{" "}
          <strong>Solana Blinks</strong> (1-click social commerce in X/Twitter feeds), a real-time{" "}
          <strong>Cash-Flow APY Leaderboard</strong>, and a decentralized <strong>Curate-to-Earn</strong> scout network.
        </p>
      </div>

      {/* TOP RADAR CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, symbol, or archetype..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 border border-black/10 text-xs font-medium text-obsidian placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm"
          />
        </div>

        {/* Sort Chips */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sort:
          </span>
          <button
            onClick={() => setSortBy("yield")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sortBy === "yield"
                ? "bg-obsidian text-white shadow-sm"
                : "bg-white/60 text-neutral-600 hover:bg-white"
            }`}
          >
            Highest APY
          </button>
          <button
            onClick={() => setSortBy("revenue")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sortBy === "revenue"
                ? "bg-obsidian text-white shadow-sm"
                : "bg-white/60 text-neutral-600 hover:bg-white"
            }`}
          >
            24h Revenue
          </button>
          <button
            onClick={() => setSortBy("backers")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sortBy === "backers"
                ? "bg-obsidian text-white shadow-sm"
                : "bg-white/60 text-neutral-600 hover:bg-white"
            }`}
          >
            Backer Count
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN RADAR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: LEADERBOARD DIRECTORY (7 COLS) */}
        <div className="lg:col-span-7 space-y-3.5">
          {filteredVentures.map((venture) => {
            const isSelected = venture.id === selectedVenture.id;
            return (
              <div
                key={venture.id}
                onClick={() => setSelectedVenture(venture)}
                className={`p-5 rounded-[24px] border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white border-indigo-500/80 shadow-md ring-2 ring-indigo-500/10"
                    : "bg-white/65 border-white/90 hover:bg-white/90 hover:border-black/10 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-obsidian text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {venture.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-obsidian">{venture.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-bold">
                          ${venture.symbol}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {venture.archetype}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {venture.backersCount} Backers • ${(venture.raisedUsdc / 1000).toFixed(0)}k raised
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-mono font-black text-emerald-700">
                      +{venture.yieldApy}% APY
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      ${venture.dailyRevenueUsdc.toLocaleString()}/day cash flow
                    </div>
                  </div>
                </div>

                {/* Progress Mini-Bar */}
                <div className="mt-3.5 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
                  <div className="w-48 h-1.5 rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (venture.raisedUsdc / venture.targetUsdc) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">
                    ${(venture.raisedUsdc / 1000).toFixed(0)}k / ${(venture.targetUsdc / 1000).toFixed(0)}k USDC ({Math.round((venture.raisedUsdc / venture.targetUsdc) * 100)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: LIVE SOLANA BLINK & HARDENING MODULE (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. SOLANA BLINKS / ACTIONS LIVE PREVIEW CARD */}
          <div className="p-6 rounded-[28px] bg-white/75 backdrop-blur-xl border border-white/95 shadow-porcelain">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600">
                <Twitter className="w-4 h-4 fill-sky-500 text-sky-500" />
                <span>Live Solana Blink Preview (X / Twitter)</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                dial.to Action
              </span>
            </div>

            {/* Mock Tweet Frame */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-obsidian text-white flex items-center justify-center text-xs font-bold">
                  V
                </div>
                <div>
                  <div className="text-xs font-bold text-obsidian flex items-center gap-1">
                    <span>{selectedVenture.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                  <div className="text-[10px] text-neutral-400">@{selectedVenture.symbol.toLowerCase()} • 2m</div>
                </div>
              </div>

              <p className="text-xs text-neutral-800 leading-relaxed">
                🚀 Just deployed our on-chain equity & dividend stream on @VentrionProtocol!
                Current Yield: <strong>+{selectedVenture.yieldApy}% APY</strong> backed by ${selectedVenture.dailyRevenueUsdc.toLocaleString()}/day revenue.
              </p>

              {/* Action Preview Embed */}
              <div className="p-3.5 rounded-xl bg-white border border-black/10 shadow-sm space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-obsidian">{selectedVenture.name} ($VENT-Share)</span>
                  <span className="font-mono text-emerald-700 font-bold">+{selectedVenture.yieldApy}% Cash Yield</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleBlinkInvest}
                    disabled={blinkLoading || blinkSigned}
                    className="py-2.5 px-3 rounded-xl bg-obsidian text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black/90 transition-all"
                  >
                    {blinkLoading ? (
                      <span>Signing Blink...</span>
                    ) : blinkSigned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pledged $50!</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-peach-400" />
                        <span>Buy Shares ($50)</span>
                      </>
                    )}
                  </button>

                  <button className="py-2.5 px-3 rounded-xl bg-black/5 text-obsidian text-xs font-bold hover:bg-black/10 transition-all flex items-center justify-center gap-1">
                    <span>Buy Product ($60)</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 text-center">
                ✨ Zero dApp visits required. Users transact directly inside social feeds.
              </div>
            </div>
          </div>

          {/* 2. THE ROGUE FOUNDER IP SHIELD & TAX AUDIT MODULE */}
          <div className="p-6 rounded-[28px] bg-white/75 backdrop-blur-xl border border-white/95 shadow-porcelain space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-obsidian">
                  Institutional Security & Tax Shields
                </h4>
                <div className="text-[11px] text-neutral-500">
                  Defenses against the "Vampire Walkaway" & Tax Authorities.
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Defense 1: MIDAO DAO LLC & Swiss Clearing Hub */}
            <div className="p-3 rounded-2xl bg-white/80 border border-black/5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="font-bold text-obsidian">MIDAO DAO LLC & Swiss Clearing Hub</div>
                  <div className="text-[10px] text-neutral-400">Hostile Takeover Immunity & Safe Harbor Protection</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Protected
              </span>
            </div>

            {/* Defense 2: TaxVault & 1-Click Export */}
            <div className="p-3.5 rounded-2xl bg-porcelain-100 border border-black/[0.04] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-obsidian">On-Chain TaxVault (15% Withheld)</span>
                <span className="font-mono text-indigo-700 font-bold">
                  ${(selectedVenture.dailyRevenueUsdc * 30 * 0.15).toFixed(0)} USDC/mo
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Taxes are segregated block-by-block into yield-bearing vaults. Founders export audit-ready reports
                for IRS 1099, EU DAC8, and German Finanzamt in 1 click.
              </p>

              <button
                onClick={handleTaxExport}
                disabled={exportingTax || taxExportSuccess}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  taxExportSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-obsidian text-white hover:bg-black/90"
                }`}
              >
                {exportingTax ? (
                  <span>Generating Merkle Tax Ledger...</span>
                ) : taxExportSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Downloaded Tax Ledger (.json)!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-peach-400" />
                    <span>1-Click Tax Export (IRS / Finanzamt)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
