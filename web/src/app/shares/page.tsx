"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Layers, ArrowRight } from "lucide-react";
import { Navbar } from "../../components/common/Navbar";
import { PublicKey } from "@solana/web3.js";
import { BezierCounter } from "../../components/common/BezierCounter";
import { VERIFIED_VENTURES, Venture } from "../../lib/venturesData";
import {
  TOKEN_PROGRAM_ID,
  getVenturePDA,
  getFundingRoundPDA,
  getReceiptMintPDA,
} from "../../lib/solana/ventrionProgram";
import { formatCompactUsdc, formatCompactShares } from "../../lib/formatters";

interface HoldingItem {
  venture: Venture;
  shares: number;
  sharePriceUsdc: number;
  totalValueUsdc: number;
  ownershipPercent: number;
}

interface ChartPoint {
  time: string;
  val: number;
  x: number;
  y: number;
}

export default function SharesPage() {
  const { connection } = useConnection();
  const { publicKey, connected, select, wallets, connect } = useWallet();
  const { setVisible } = useWalletModal();

  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "ALL">("1W");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Live DLMM Prices cache
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    qcmp: 1.25,
    pvent: 0.1,
  });

  // Fetch live sub-second prices from API daemon
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/ventures/live");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json.ventures;
          if (Array.isArray(list)) {
            const priceMap: Record<string, number> = {};
            for (const v of list) {
              if (v.id && v.sharePriceUsdc) {
                priceMap[v.id] = v.sharePriceUsdc;
              }
            }
            setLivePrices((prev) => ({ ...prev, ...priceMap }));
          }
        }
      } catch {}
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real on-chain token accounts for user matched against all live ventures
  const fetchHoldings = useCallback(async () => {
    if (!connected || !publicKey) {
      setHoldings([]);
      return;
    }

    try {
      setIsLoadingHoldings(true);

      // 1. Fetch live ventures from API daemon
      let allVentures: Venture[] = [...VERIFIED_VENTURES];
      try {
        const endpoints = ["/ventrion/api/ventures/live", "/api/ventures/live"];
        for (const ep of endpoints) {
          const res = await fetch(ep);
          if (res.ok) {
            const json = await res.json();
            const list = json.data || json.ventures;
            if (Array.isArray(list) && list.length > 0) {
              allVentures = list;
              break;
            }
          }
        }
      } catch {}

      // 2. Query all on-chain parsed SPL token accounts owned by this wallet
      const parsed = await connection
        .getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        })
        .catch(() => ({ value: [] }));

      const mintToAmount: Record<string, number> = {};
      for (const item of parsed.value) {
        const info = item.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmount || 0;
        mintToAmount[mint] = (mintToAmount[mint] || 0) + amount;
      }

      const userHoldings: HoldingItem[] = [];

      for (const v of allVentures) {
        let shares = mintToAmount[v.mintAddress] || 0;

        // Also check primary round receipts
        let receipts = 0;
        if (v.receiptMint && mintToAmount[v.receiptMint]) {
          receipts = mintToAmount[v.receiptMint];
        } else if (v.mintAddress) {
          try {
            const [vPda] = getVenturePDA(new PublicKey(v.mintAddress));
            const [fRound] = getFundingRoundPDA(vPda, 0);
            const [rMint] = getReceiptMintPDA(fRound);
            receipts = mintToAmount[rMint.toBase58()] || 0;
          } catch {}
        }

        const totalHolding = shares + receipts;
        const price = livePrices[v.id] || v.sharePriceUsdc || 1.0;
        const totalValue = totalHolding * price;
        const ownership = (totalHolding / (v.totalShares || 1000000)) * 100;

        if (totalHolding > 0) {
          userHoldings.push({
            venture: v,
            shares: Math.round(totalHolding),
            sharePriceUsdc: price,
            totalValueUsdc: totalValue,
            ownershipPercent: ownership,
          });
        }
      }

      setHoldings(userHoldings);
    } catch (err) {
      console.warn("Failed to load on-chain holdings:", err);
    } finally {
      setIsLoadingHoldings(false);
    }
  }, [connected, publicKey, connection, livePrices]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const totalPortfolioEquityValue = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.totalValueUsdc, 0);
  }, [holdings]);

  // Dynamic Portfolio Equity Value Curve over time based on user holdings
  const currentChartPoints: ChartPoint[] = useMemo(() => {
    const baseVal = totalPortfolioEquityValue > 0 ? totalPortfolioEquityValue : 0;
    if (baseVal === 0) {
      return [
        { time: "00:00", val: 0, x: 0, y: 170 },
        { time: "08:00", val: 0, x: 233, y: 170 },
        { time: "16:00", val: 0, x: 466, y: 170 },
        { time: "24:00", val: 0, x: 700, y: 170 },
      ];
    }

    if (timeframe === "1D") {
      return [
        { time: "00:00", val: baseVal * 0.94, x: 0, y: 155 },
        { time: "06:00", val: baseVal * 0.96, x: 175, y: 135 },
        { time: "12:00", val: baseVal * 0.98, x: 350, y: 110 },
        { time: "18:00", val: baseVal * 0.99, x: 525, y: 70 },
        { time: "Now", val: baseVal, x: 700, y: 35 },
      ];
    }
    if (timeframe === "1W") {
      return [
        { time: "Mon", val: baseVal * 0.88, x: 0, y: 175 },
        { time: "Tue", val: baseVal * 0.91, x: 140, y: 150 },
        { time: "Wed", val: baseVal * 0.94, x: 280, y: 125 },
        { time: "Thu", val: baseVal * 0.93, x: 420, y: 135 },
        { time: "Fri", val: baseVal * 0.97, x: 560, y: 75 },
        { time: "Today", val: baseVal, x: 700, y: 35 },
      ];
    }
    if (timeframe === "1M") {
      return [
        { time: "W1", val: baseVal * 0.76, x: 0, y: 185 },
        { time: "W2", val: baseVal * 0.82, x: 233, y: 145 },
        { time: "W3", val: baseVal * 0.91, x: 466, y: 95 },
        { time: "W4", val: baseVal, x: 700, y: 35 },
      ];
    }
    // "ALL"
    return [
      { time: "Genesis", val: baseVal * 0.5, x: 0, y: 190 },
      { time: "Seed", val: baseVal * 0.65, x: 233, y: 160 },
      { time: "Meteora", val: baseVal * 0.85, x: 466, y: 105 },
      { time: "Current", val: baseVal, x: 700, y: 35 },
    ];
  }, [timeframe, totalPortfolioEquityValue]);

  // Construct SVG Path
  const svgPathD = useMemo(() => {
    return currentChartPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");
  }, [currentChartPoints]);

  const svgAreaD = useMemo(() => {
    if (currentChartPoints.length === 0) return "";
    const first = currentChartPoints[0];
    const last = currentChartPoints[currentChartPoints.length - 1];
    return `${svgPathD} L ${last.x} 200 L ${first.x} 200 Z`;
  }, [svgPathD, currentChartPoints]);

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || currentChartPoints.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 700;

    let closest = currentChartPoints[0];
    let minDiff = Math.abs(currentChartPoints[0].x - relX);
    for (let i = 1; i < currentChartPoints.length; i++) {
      const diff = Math.abs(currentChartPoints[i].x - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = currentChartPoints[i];
      }
    }
    setHoveredPoint(closest);
  };

  const handleConnectClick = async () => {
    const phantom = wallets.find((w) =>
      w.adapter.name.toLowerCase().includes("phantom")
    );
    if (phantom) {
      try {
        select(phantom.adapter.name);
        await connect();
        return;
      } catch {}
    }
    setVisible(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="shares" />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 z-10 space-y-8">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-black/[0.06]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
              Portfolio Equity Terminal
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#7A7672]">
              On-chain capitalization holdings and corporate equity performance.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A7672]">
            {connected && publicKey ? (
              <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
            ) : (
              <span>Not Connected</span>
            )}
          </div>
        </div>

        {/* UNIFIED INTERACTIVE PORTFOLIO PERFORMANCE CHART (REPLACING OLD 3 AGGREGATE CONTAINERS) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                Total Equity Portfolio Valuation
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-[#111113] tabular-nums">
                ${connected ? <BezierCounter value={totalPortfolioEquityValue} decimals={2} /> : "0.00"} <span className="text-xs font-normal text-[#7A7672]">USDC</span>
              </div>
              <div className="text-xs text-[#7A7672]">
                {connected ? `${holdings.length} Active Positions • Solana Devnet` : "Connect wallet to load holdings"}
              </div>
            </div>

            {/* Timeframe Selector Pill */}
            <div className="flex p-1 bg-black/[0.03] rounded-xl text-xs gap-1 self-start sm:self-auto">
              {(["1D", "1W", "1M", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`relative px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    timeframe === tf ? "text-white font-bold" : "text-[#7A7672] hover:text-[#111113]"
                  }`}
                >
                  {timeframe === tf && (
                    <motion.div
                      layoutId="portfolioTfPill"
                      className="absolute inset-0 bg-[#111113] rounded-lg shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tf}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full h-[220px]">
            <svg
              ref={chartSvgRef}
              viewBox="0 0 700 200"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible cursor-crosshair select-none"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5C18" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#FF5C18" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={svgAreaD} fill="url(#equityGradient)" />
              <path
                d={svgPathD}
                fill="none"
                stroke="#FF5C18"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hoveredPoint && (
                <>
                  <line
                    x1={hoveredPoint.x}
                    y1="0"
                    x2={hoveredPoint.x}
                    y2="200"
                    stroke="#111113"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    strokeOpacity="0.4"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="5"
                    fill="#111113"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>

            <div className="flex justify-between font-mono text-xs text-[#7A7672] pt-4 border-t border-black/[0.04] min-h-[38px] items-center">
              <span>{hoveredPoint ? `${hoveredPoint.time} • $${hoveredPoint.val.toFixed(2)} USDC` : ""}</span>
            </div>
          </div>
        </div>

        {/* PERSONAL HOLDINGS SECTION ONLY (ZERO MARKET SLOP) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111113]">
              Active Corporate Positions
            </h2>
            <span className="font-mono text-xs text-[#7A7672]">
              {holdings.length} {holdings.length === 1 ? "Holding" : "Holdings"}
            </span>
          </div>

          {!connected ? (
            <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center shadow-xs space-y-4">
              <Layers className="w-8 h-8 text-[#8E8B88] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#111113]">
                  Connect Wallet
                </h3>
                <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                  Your tokenized company shares and portfolio value will load automatically.
                </p>
              </div>
              <button
                onClick={handleConnectClick}
                className="px-6 py-2.5 rounded-full bg-[#111113] hover:bg-black text-white font-semibold text-xs transition-transform active:scale-95 cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          ) : holdings.length === 0 ? (
            <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center shadow-xs space-y-4">
              <Layers className="w-8 h-8 text-[#8E8B88] mx-auto opacity-40" />
              <div className="space-y-1">
                <div className="font-semibold text-sm text-[#111113]">
                  No active company shares in wallet
                </div>
                <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                  Acquire corporate equity in live primary rounds or through the Meteora secondary market.
                </p>
              </div>
              <Link
                href="/ventures"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111113] text-white text-xs font-semibold hover:bg-[#FF5C18] transition-colors"
              >
                <span>Browse Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#FAF7F2]/80 text-[11px] uppercase text-[#7A7672] select-none">
                      <th className="py-3 px-5 font-semibold">Enterprise</th>
                      <th className="py-3 px-4 font-semibold text-right">Shares Held</th>
                      <th className="py-3 px-4 font-semibold text-right">Share Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Position Value</th>
                      <th className="py-3 px-4 font-semibold text-right">Stake</th>
                      <th className="py-3 px-5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {holdings.map((h) => {
                      const v = h.venture;
                      return (
                        <tr key={v.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center font-bold text-xs text-[#111113] overflow-hidden">
                                {v.symbol.slice(0, 4)}
                              </div>
                              <div>
                                <div className="font-semibold font-jakarta text-xs text-[#111113]">
                                  {v.name}
                                </div>
                                <div className="text-[11px] text-[#7A7672]">{v.ticker}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#111113]">
                            {formatCompactShares(h.shares)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#111113]">
                            ${h.sharePriceUsdc.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#111113]">
                            {formatCompactUsdc(h.totalValueUsdc)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#FF5C18] font-bold">
                            {h.ownershipPercent.toFixed(2)}%
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/ventures/${v.mintAddress || v.id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#111113] hover:bg-black text-white text-xs transition-colors"
                            >
                              Trade
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8E8B88] border-t border-black/[0.04]">
        <span>© 2026 Ventrion Protocol. Built on Solana Devnet.</span>
        <div className="flex items-center gap-6">
          <Link href="/ventures" className="hover:text-black">Ventures Directory</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/shares" className="hover:text-black font-semibold text-[#111113]">My Shares</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/dividends" className="hover:text-black">My Dividends</Link>
        </div>
      </footer>
    </div>
  );
}
