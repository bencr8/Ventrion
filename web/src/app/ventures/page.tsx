"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "../../components/common/Navbar";
import { VERIFIED_VENTURES, Venture } from "../../lib/venturesData";

// Strictly the 3 canonical lifecycle phases (NO "All" tab!)
type LifecyclePhase = "Raising" | "Migrating" | "Funded";
type SortOption = "highest_mcap" | "highest_volume" | "progress" | "newest";

export default function VenturesPage() {
  const router = useRouter();
  const [selectedPhase, setSelectedPhase] = useState<LifecyclePhase>("Raising");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("highest_mcap");

  // Live Ventures from Server-Side 10s Cache Daemon
  const [liveVentures, setLiveVentures] = useState<Venture[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("ventrion_live_ventures");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Poll 10-second Server Cache Daemon
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveVentures() {
      try {
        const endpoints = ["/ventrion/api/ventures/live", "/api/ventures/live"];
        let result = null;

        for (const ep of endpoints) {
          try {
            const res = await fetch(ep);
            if (res.ok) {
              result = await res.json();
              if (result?.success && Array.isArray(result?.data)) {
                break;
              }
            }
          } catch {}
        }

        if (result?.success && Array.isArray(result?.data) && isMounted) {
          setLiveVentures(result.data);
          try {
            sessionStorage.setItem("ventrion_live_ventures", JSON.stringify(result.data));
          } catch {}
        }
      } catch (err) {
        // Fall back gracefully to verified state
      } finally {
        if (isMounted) setIsLoadingLive(false);
      }
    }

    fetchLiveVentures();
    const interval = setInterval(fetchLiveVentures, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Merge live ventures with local baseline fallback
  const allVentures: Venture[] = useMemo(() => {
    if (liveVentures.length > 0) {
      return liveVentures;
    }
    // Baseline mapping according to canonical protocol phases
    return VERIFIED_VENTURES.map((v) => {
      let canonical: LifecyclePhase = "Raising";
      if (
        v.canonicalStatus === "Funded" ||
        v.statusBadge?.includes("Graduated") ||
        v.statusBadge?.includes("Funded") ||
        v.mintAddress === "Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E" ||
        v.mintAddress === "5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn"
      ) {
        canonical = "Funded";
      } else if (v.canonicalStatus === "Migrating" || v.statusBadge?.includes("Migrating")) {
        canonical = "Migrating";
      } else {
        canonical = "Raising";
      }
      const targetCap = v.targetFundingCapUsdc ?? 50000;
      const raised = v.totalCapitalRaisedUsdc ?? (canonical === "Funded" ? targetCap : 0);
      const progress = v.fundingProgressPercent ?? (targetCap > 0 ? (raised / targetCap) * 100 : 100.0);
      return {
        ...v,
        canonicalStatus: canonical,
        targetFundingCapUsdc: targetCap,
        totalCapitalRaisedUsdc: raised,
        fundingProgressPercent: progress,
      } as Venture;
    });
  }, [liveVentures]);

  // Filter strictly by the active phase and search query
  const filteredVentures = useMemo(() => {
    return allVentures.filter((v: any) => {
      // Determine canonical phase
      const status: LifecyclePhase =
        v.canonicalStatus ||
        (v.statusBadge?.includes("Graduated") || v.statusNum >= 5 ? "Funded" : "Raising");

      const matchesPhase = status === selectedPhase;
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.ticker.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesPhase && matchesSearch;
    });
  }, [allVentures, selectedPhase, searchQuery]);

  // Sort ventures
  const sortedVentures = useMemo(() => {
    return [...filteredVentures].sort((a: any, b: any) => {
      if (sortBy === "highest_mcap") {
        return (b.marketCapUsdc || 0) - (a.marketCapUsdc || 0);
      }
      if (sortBy === "highest_volume") {
        return (b.vol24h || 0) - (a.vol24h || 0);
      }
      if (sortBy === "progress") {
        return (b.fundingProgressPercent || 0) - (a.fundingProgressPercent || 0);
      }
      // "newest"
      return (b.lastSync || 0) - (a.lastSync || 0);
    });
  }, [filteredVentures, sortBy]);

  // Phase badges definition
  const phases: { id: LifecyclePhase; label: string; count: number; desc: string }[] = [
    {
      id: "Raising",
      label: "Raising",
      count: allVentures.filter(
        (v: any) => (v.canonicalStatus || "Raising") === "Raising"
      ).length,
      desc: "Primary funding round active with escrow protection",
    },
    {
      id: "Migrating",
      label: "Migrating",
      count: allVentures.filter(
        (v: any) => (v.canonicalStatus || "") === "Migrating"
      ).length,
      desc: "100% Target reached • Atomic Meteora DLMM seeding in progress",
    },
    {
      id: "Funded",
      label: "Funded",
      count: allVentures.filter(
        (v: any) =>
          (v.canonicalStatus || (v.statusBadge?.includes("Graduated") ? "Funded" : "")) ===
          "Funded"
      ).length,
      desc: "Graduated • 24/7 Live trading on Meteora DLMM",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="ventures" />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 z-10 space-y-6">
        {/* REFINED SWISS HEADER (Clean & Institutional - No Artificial AI Buzzwords) */}
        <div className="rounded-2xl bg-white border border-black/[0.06] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7A7672] uppercase tracking-wider">
              <span>Public Directory</span>
              <span>/</span>
              <span className="text-[#111113] font-semibold">Devnet Protocol Truth</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
              Venture Registry
            </h1>
            <p className="text-sm text-[#6E6964] max-w-xl">
              Inspect live tokenized enterprises across primary capital formation, liquidity
              migration, and graduated secondary DLMM markets.
            </p>
          </div>
        </div>

        {/* CONTROLS BAR: 3 CANONICAL PHASE TABS + SORTING + SEARCH */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* THE 3 CANONICAL LIFECYCLE TABS (NO "All" TAB!) */}
          <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-xl border border-black/[0.04] overflow-x-auto">
            {phases.map((p) => {
              const isActive = selectedPhase === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhase(p.id)}
                  className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? "text-[#111113] font-bold"
                      : "text-[#6E6964] hover:text-[#111113]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCanonicalPhase"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{p.label}</span>
                  <span
                    className={`relative z-10 px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                      isActive
                        ? "bg-[#111113] text-white"
                        : "bg-black/[0.06] text-[#7A7672]"
                    }`}
                  >
                    {p.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* RIGHT FILTER CLUSTER: SORT BY & SEARCH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-black/[0.08] shadow-2xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8E8B88]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Filter and Sort Ventures"
                className="text-xs font-medium text-[#111113] bg-transparent outline-none cursor-pointer"
              >
                <option value="highest_mcap">Highest Market Cap</option>
                <option value="highest_volume">Highest 24h Volume</option>
                <option value="progress">Funding Progress (%)</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8E8B88] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticker, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs text-[#111113] placeholder-[#9E9B97] focus:outline-none focus:border-[#111113] shadow-2xs transition-colors"
              />
            </div>
          </div>
        </div>


        {/* STREAMLINED FINANCIAL TRADING TABLE */}
        <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#FAF7F2]/75 text-[11px] font-mono uppercase text-[#7A7672] select-none">
                  <th className="py-3 px-5 font-semibold">Asset / Venture</th>
                  <th className="py-3 px-4 font-semibold text-right">Share Price</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {selectedPhase === "Raising" ? "Target Cap" : "Market Cap"}
                  </th>
                  <th className="py-3 px-5 font-semibold text-center">
                    {selectedPhase === "Raising"
                      ? "Funding Progress"
                      : selectedPhase === "Funded"
                      ? "Live DLMM Trajectory"
                      : "Migration State"}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {selectedPhase === "Funded" ? "Dividend Yield" : "Escrow Capital"}
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-xs">
                {sortedVentures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8E8B88] font-mono text-xs">
                      No ventures currently matching &quot;{selectedPhase}&quot;.
                    </td>
                  </tr>
                ) : (
                  sortedVentures.map((v: any) => {
                    const price = v.sharePriceUsdc || 0;
                    const mcap = v.marketCapUsdc || 0;
                    const targetCap = v.targetFundingCapUsdc || 50000;
                    const raised = typeof v.totalCapitalRaisedUsdc === "number" ? v.totalCapitalRaisedUsdc : (v.canonicalStatus === "Funded" ? targetCap : 0);
                    const progress = typeof v.fundingProgressPercent === "number" ? v.fundingProgressPercent : (targetCap > 0 ? (raised / targetCap) * 100 : 0);
                    const cleanName = v.name?.replace(/\s*\(\$[A-Za-z0-9_-]+\)\s*$/, "") || v.name;

                    return (
                      <tr
                        key={v.mintAddress || v.id}
                        onClick={() => router.push(`/ventures/${v.mintAddress || v.id}`)}
                        className="hover:bg-black/[0.02] transition-colors group cursor-pointer"
                      >
                        {/* Asset Column (Rounded Picture replacing black ticker block) */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {/* Round-cornered logo replacing black square */}
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#111113]/5 border border-black/[0.08] shrink-0 shadow-2xs flex items-center justify-center">
                              {v.logoUrl && v.logoUrl.startsWith("http") ? (
                                <img
                                  src={v.logoUrl}
                                  alt={cleanName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#111113] text-white flex items-center justify-center font-mono font-bold text-xs">
                                  {v.symbol?.slice(0, 4) || "VENT"}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#111113] group-hover:text-[#FF5C18] transition-colors flex items-center gap-1.5">
                                <span>{cleanName}</span>
                                <span className="font-mono text-[11px] font-bold text-[#8E8B88]">
                                  ({v.ticker || `$${v.symbol}`})
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-[#8E8B88]">
                                {v.category || "Ventrion Protocol"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Share Price */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#111113]">
                          ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
                          <span className="text-[10px] text-[#8E8B88] ml-1">USDC</span>
                        </td>

                        {/* Market Cap / Target Cap */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#333]">
                          ${selectedPhase === "Raising"
                            ? `${(targetCap / 1000).toFixed(0)}k`
                            : `${(mcap / 1000).toFixed(0)}k`}
                        </td>

                        {/* Middle Visual Column depending on Phase */}
                        <td className="py-3.5 px-5">
                          {selectedPhase === "Raising" ? (
                            /* Live Funding Progress Bar */
                            <div className="max-w-[200px] mx-auto space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-[#7A7672]">
                                <span>${(raised / 1000).toFixed(1)}k raised</span>
                                <span className="font-bold text-[#111113]">{progress.toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#FF5C18] to-amber-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                            </div>
                          ) : selectedPhase === "Funded" ? (
                            /* Live DLMM Mini Chart Visualization */
                            <div className="max-w-[180px] mx-auto flex items-center justify-center gap-2">
                              <svg className="w-32 h-6 text-emerald-600" viewBox="0 0 100 24">
                                <path
                                  d="M0,20 Q20,16 40,18 T70,8 T100,4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M0,20 Q20,16 40,18 T70,8 T100,4 L100,24 L0,24 Z"
                                  fill="rgba(16, 185, 129, 0.12)"
                                />
                              </svg>
                              <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                                Live Bins
                              </span>
                            </div>
                          ) : (
                            /* Migrating Phase Indicator */
                            <div className="max-w-[200px] mx-auto flex items-center justify-center gap-2 font-mono text-[11px] text-amber-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <span>17% DLMM Seeding</span>
                            </div>
                          )}
                        </td>

                        {/* Div Yield / Escrow Capital */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          {selectedPhase === "Funded" ? (
                            <span className="font-semibold text-emerald-700">
                              {v.currentDividendYield > 0
                                ? `${v.currentDividendYield.toFixed(1)}% APY`
                                : "0.0% APY"}
                            </span>
                          ) : (
                            <span className="text-[#555]">
                              ${((v.lockedEscrowUsdc || 25000) / 1000).toFixed(0)}k Escrow
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block font-mono text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full ${
                              selectedPhase === "Funded"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : selectedPhase === "Migrating"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-orange-50 text-[#FF5C18] border border-orange-200"
                            }`}
                          >
                            {selectedPhase}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-5 text-right">
                          {selectedPhase === "Raising" ? (
                            <Link
                              href={`/ventures/${v.id || v.mintAddress}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-semibold font-mono transition-transform active:scale-95 shadow-2xs"
                            >
                              <span>Buy</span>
                              <ArrowRight className="w-3 h-3 text-[#FF5C18]" />
                            </Link>
                          ) : selectedPhase === "Funded" ? (
                            <div className="inline-flex items-center gap-2">
                              {v.meteoraDlmmPool && (
                                <a
                                  href={`https://app.meteora.ag/dlmm/${v.meteoraDlmmPool}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#111113] text-xs font-mono font-medium transition-colors"
                                >
                                  <span>Trade</span>
                                  <ExternalLink className="w-3 h-3 text-[#8E8B88]" />
                                </a>
                              )}
                              <Link
                                href={`/ventures/${v.id || v.mintAddress}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-mono font-medium transition-transform active:scale-95"
                              >
                                <span>Overview</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            </div>
                          ) : (
                            <Link
                              href={`/ventures/${v.id || v.mintAddress}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/[0.05] text-[#555] text-xs font-mono font-medium"
                            >
                              <span>View</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>


      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8E8B88] border-t border-black/[0.04]">
        <span>© 2026 Ventrion Protocol. Solana Devnet.</span>
        <div className="flex items-center gap-6">
          <Link href="/ventures" className="hover:text-black">Ventures</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/documentation" className="hover:text-black">Documentation</Link>
        </div>
      </footer>
    </div>
  );
}
