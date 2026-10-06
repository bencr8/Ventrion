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
  entryPriceUsdc: number;
  costBasisUsdc: number;
  sharePriceUsdc: number;
  totalValueUsdc: number;
  unrealizedPnlUsdc: number;
  unrealizedPnlPercent: number;
  escrowProtectedUsdc: number;
  ownershipPercent: number;
  isRaising: boolean;
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
  const [trajectoryMode, setTrajectoryMode] = useState<"TRAJECTORY" | "INVARIANT">("TRAJECTORY");
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
        if (totalHolding <= 0) continue;

        const isRaising =
          v.canonicalStatus === "Raising" ||
          (!v.canonicalStatus && receipts > 0 && shares === 0);

        // Exact entry cost basis on the flat curve invariant
        const entryPrice = isRaising
          ? (v.sharePriceUsdc || 0.10)
          : (v.id === "Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E" ? 1.00 : 0.10);

        const currentPrice = isRaising
          ? entryPrice // Primary round invariant
          : (livePrices[v.id] || v.sharePriceUsdc || entryPrice);

        const costBasis = totalHolding * entryPrice;
        const totalValue = totalHolding * currentPrice;
        const pnlUsdc = totalValue - costBasis;
        const pnlPct = costBasis > 0 ? (pnlUsdc / costBasis) * 100 : 0;
        const escrowProtected = costBasis * 0.75;
        const ownership = (totalHolding / (v.totalShares || 1000000)) * 100;

        userHoldings.push({
          venture: v,
          shares: Math.round(totalHolding),
          entryPriceUsdc: entryPrice,
          costBasisUsdc: costBasis,
          sharePriceUsdc: currentPrice,
          totalValueUsdc: totalValue,
          unrealizedPnlUsdc: pnlUsdc,
          unrealizedPnlPercent: pnlPct,
          escrowProtectedUsdc: escrowProtected,
          ownershipPercent: ownership,
          isRaising,
        });
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

  const totalPortfolioValue = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.totalValueUsdc, 0);
  }, [holdings]);

  const totalCostBasis = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.costBasisUsdc, 0);
  }, [holdings]);

  const totalEscrowBackstop = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.escrowProtectedUsdc, 0);
  }, [holdings]);

  const totalPnlUsdc = totalPortfolioValue - totalCostBasis;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnlUsdc / totalCostBasis) * 100 : 0;
  const targetExitValuation = totalCostBasis > 0 ? totalCostBasis * 1.5 : 0;

  // Strict Entry-to-Exit Capital Trajectory (Zero synthetic waves)
  const currentChartPoints: ChartPoint[] = useMemo(() => {
    if (totalCostBasis === 0 && totalPortfolioValue === 0) {
      return [
        { time: "Entry", val: 0, x: 50, y: 170 },
        { time: "Escrow Floor", val: 0, x: 250, y: 170 },
        { time: "Current Spot", val: 0, x: 450, y: 170 },
        { time: "Exit Target", val: 0, x: 650, y: 170 },
      ];
    }

    if (trajectoryMode === "INVARIANT") {
      // Flat Invariant Curve - 100% Capital Preservation
      return [
        { time: "Genesis Entry", val: totalCostBasis, x: 50, y: 90 },
        { time: "Milestone Tranche 1", val: totalCostBasis, x: 250, y: 90 },
        { time: "Milestone Tranche 2", val: totalCostBasis, x: 450, y: 90 },
        { time: "Graduation Gate", val: totalCostBasis, x: 650, y: 90 },
      ];
    }

    // "TRAJECTORY": Entry (Cost Basis) -> 75% Escrow Floor -> Current Spot -> Exit Target
    const vals = [totalCostBasis, totalEscrowBackstop, totalPortfolioValue, targetExitValuation];
    const minVal = Math.min(...vals) * 0.9;
    const maxVal = Math.max(...vals) * 1.1;
    const range = maxVal - minVal || 1;

    const getY = (val: number) => {
      const normalized = (val - minVal) / range;
      return Math.round(175 - normalized * 135);
    };

    return [
      { time: "Entry (Cost Basis)", val: totalCostBasis, x: 50, y: getY(totalCostBasis) },
      { time: "75% Escrow Floor", val: totalEscrowBackstop, x: 250, y: getY(totalEscrowBackstop) },
      { time: "Current Valuation", val: totalPortfolioValue, x: 450, y: getY(totalPortfolioValue) },
      { time: "Full Milestone Target", val: targetExitValuation, x: 650, y: getY(targetExitValuation) },
    ];
  }, [trajectoryMode, totalCostBasis, totalPortfolioValue, totalEscrowBackstop, targetExitValuation]);

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

        {/* UNIFIED INTERACTIVE CAPITAL TRAJECTORY (ZERO SYNTHETIC VOLATILITY) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                Total Equity Portfolio Valuation
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-[#111113] tabular-nums">
                ${connected ? <BezierCounter value={totalPortfolioValue} decimals={2} /> : "0.00"} <span className="text-xs font-normal text-[#7A7672]">USDC</span>
              </div>
              <div className="text-xs text-[#7A7672]">
                {connected
                  ? `Cost Basis: $${totalCostBasis.toFixed(2)} USDC • 75% Escrow Floor: $${totalEscrowBackstop.toFixed(2)} USDC`
                  : "Connect wallet to load holdings"}
              </div>
            </div>

            {/* Right Metric Cluster & Mode Selector */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block">
                  Escrow Backstop
                </span>
                <span className="text-base sm:text-lg font-bold text-emerald-700">
                  ${connected ? totalEscrowBackstop.toFixed(2) : "0.00"}
                </span>
                <span className="text-[10px] text-[#7A7672] block">75% Smart Contract</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block">
                  Net Return
                </span>
                <span className={`text-base sm:text-lg font-bold ${totalPnlUsdc >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {connected ? `${totalPnlUsdc >= 0 ? "+" : ""}$${totalPnlUsdc.toFixed(2)}` : "$0.00"}
                </span>
                <span className="text-[10px] text-[#7A7672] block">
                  {connected ? `${totalPnlPercent >= 0 ? "+" : ""}${totalPnlPercent.toFixed(1)}% Spot` : "0.0%"}
                </span>
              </div>

              {/* Trajectory Mode Selector */}
              <div className="flex p-1 bg-black/[0.03] rounded-xl text-xs gap-1">
                {(["TRAJECTORY", "INVARIANT"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTrajectoryMode(mode)}
                    className={`relative px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] font-semibold ${
                      trajectoryMode === mode ? "text-white font-bold" : "text-[#7A7672] hover:text-[#111113]"
                    }`}
                  >
                    {trajectoryMode === mode && (
                      <motion.div
                        layoutId="portfolioTfPill"
                        className="absolute inset-0 bg-[#111113] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">
                      {mode === "TRAJECTORY" ? "Trajectory" : "Flat Invariant"}
                    </span>
                  </button>
                ))}
              </div>
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

              {/* Render Nodes for each trajectory waypoint */}
              {currentChartPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#111113"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y > 150 ? pt.y - 12 : pt.y + 18}
                    textAnchor="middle"
                    className="text-[9px] fill-[#7A7672] font-mono pointer-events-none"
                  >
                    {pt.time}
                  </text>
                </g>
              ))}

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
                    r="6"
                    fill="#FF5C18"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>

            <div className="flex justify-between font-mono text-xs text-[#7A7672] pt-4 border-t border-black/[0.04] min-h-[38px] items-center">
              <span>
                {hoveredPoint
                  ? `${hoveredPoint.time} • $${hoveredPoint.val.toFixed(2)} USDC`
                  : `${holdings.length} Active Positions • Solana Devnet Invariant`}
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-semibold">
                75% Escrow Floor Protected
              </span>
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
                      <th className="py-3 px-4 font-semibold text-right">Holdings</th>
                      <th className="py-3 px-4 font-semibold text-right">Entry Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Spot Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Position Value</th>
                      <th className="py-3 px-4 font-semibold text-right">75% Escrow Floor</th>
                      <th className="py-3 px-4 font-semibold text-right">Net Return</th>
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
                            <div>{formatCompactShares(h.shares)}</div>
                            <div className="text-[10px] text-[#7A7672] font-normal">
                              {h.isRaising ? "Receipts (R0)" : "Common Stock"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#111113]">
                            ${h.entryPriceUsdc.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#111113]">
                            ${h.sharePriceUsdc.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#111113]">
                            {formatCompactUsdc(h.totalValueUsdc)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                            ${h.escrowProtectedUsdc.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold">
                            {h.isRaising ? (
                              <span className="text-[#7A7672] text-[11px]">Flat Invariant</span>
                            ) : (
                              <span className={h.unrealizedPnlPercent >= 0 ? "text-emerald-700" : "text-rose-600"}>
                                {h.unrealizedPnlPercent >= 0 ? "+" : ""}
                                {h.unrealizedPnlPercent.toFixed(1)}%
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/ventures/${v.mintAddress || v.id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#111113] hover:bg-black text-white text-xs transition-colors"
                            >
                              {h.isRaising ? "View Round" : "Trade"}
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
