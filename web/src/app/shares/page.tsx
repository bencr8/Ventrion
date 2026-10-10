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
  // Currency Pill State
  const [currency, setCurrency] = useState<"USDC" | "EUR">("USDC");
  const eurRate = 0.92;
  const currencySymbol = currency === "USDC" ? "$" : "€";
  const currencyMultiplier = currency === "USDC" ? 1.0 : eurRate;

  // Buttery Lerp Scrubber State (adapted from TradeDexView)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 700, y: 160 });
  const [scrubbedVal, setScrubbedVal] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const targetXRef = useRef<number>(700);
  const currentXRef = useRef<number>(700);
  const animFrameRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  // Live DLMM Prices cache (zero hardcoded mock fallbacks)
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

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

        const entryPrice = v.sharePriceUsdc || 0.10;
        const currentPrice = livePrices[v.id] || livePrices[v.mintAddress] || v.sharePriceUsdc || entryPrice;

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

  // Smooth Vector Curve & Gradient Area from Acquisition (BUY) to Current Spot (NOW)
  const { pathD, areaD, yStartVal, yEndVal } = useMemo(() => {
    const width = 700;
    const height = 130;
    if (totalCostBasis <= 0 && totalPortfolioValue <= 0) {
      const flatY = 90;
      return {
        pathD: `M 0 ${flatY} L ${width} ${flatY}`,
        areaD: `M 0 ${flatY} L ${width} ${flatY} L ${width} ${height} L 0 ${height} Z`,
        yStartVal: 0,
        yEndVal: 0,
      };
    }

    const minVal = Math.min(totalCostBasis, totalPortfolioValue) * 0.9;
    const maxVal = Math.max(totalCostBasis, totalPortfolioValue) * 1.1;
    const range = maxVal - minVal || 1;

    const getY = (val: number) => {
      const norm = (val - minVal) / range;
      return Math.round(100 - norm * 75);
    };

    const y0 = getY(totalCostBasis);
    const y1 = getY(totalPortfolioValue);

    // Multi-point dynamic equity line from cost basis to current spot valuation
    const points = [
      { x: 0, val: totalCostBasis },
      { x: Math.round(width * 0.33), val: totalCostBasis + (totalPortfolioValue - totalCostBasis) * 0.33 },
      { x: Math.round(width * 0.67), val: totalCostBasis + (totalPortfolioValue - totalCostBasis) * 0.67 },
      { x: width, val: totalPortfolioValue },
    ];
    const d = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${getY(p.val)}`).join(" ");
    const a = `${d} L ${width} ${height} L 0 ${height} Z`;

    return {
      pathD: d,
      areaD: a,
      yStartVal: totalCostBasis,
      yEndVal: totalPortfolioValue,
    };
  }, [totalCostBasis, totalPortfolioValue]);

  // Exact point on path via binary search
  const findPointAtX = useCallback((targetX: number): { x: number; y: number } => {
    const path = pathRef.current;
    if (!path) return { x: targetX, y: 90 };

    const totalLen = path.getTotalLength();
    let low = 0;
    let high = totalLen;
    let best = path.getPointAtLength(totalLen);

    for (let i = 0; i < 22; i++) {
      const mid = (low + high) / 2;
      const pt = path.getPointAtLength(mid);
      if (Math.abs(pt.x - targetX) < 0.25) {
        return { x: pt.x, y: pt.y };
      }
      if (pt.x < targetX) {
        low = mid;
      } else {
        high = mid;
      }
      best = pt;
    }

    return { x: best.x, y: best.y };
  }, []);

  // Delayed magnetic follower loop for buttery scrubbing
  const updateScrubberLoop = useCallback(() => {
    const diff = targetXRef.current - currentXRef.current;
    if (Math.abs(diff) > 0.15) {
      currentXRef.current += diff * 0.14;
      const pt = findPointAtX(currentXRef.current);
      setCurrentPos(pt);

      const ratio = Math.max(0, Math.min(1, currentXRef.current / 700));
      const val = yStartVal + ratio * (yEndVal - yStartVal);
      setScrubbedVal(val);
      setIsMoving(true);

      animFrameRef.current = requestAnimationFrame(updateScrubberLoop);
    } else {
      currentXRef.current = targetXRef.current;
      const pt = findPointAtX(targetXRef.current);
      setCurrentPos(pt);
      const ratio = Math.max(0, Math.min(1, targetXRef.current / 700));
      setScrubbedVal(targetXRef.current === 700 && !isHovered ? null : yStartVal + ratio * (yEndVal - yStartVal));
      setIsMoving(false);
      animFrameRef.current = null;
    }
  }, [findPointAtX, yStartVal, yEndVal, isHovered]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(700, (rawX / rect.width) * 700));

    targetXRef.current = clampedX;
    setIsHovered(true);

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateScrubberLoop);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    targetXRef.current = 700;
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateScrubberLoop);
    }
  };

  useEffect(() => {
    targetXRef.current = 700;
    currentXRef.current = 700;
    const pt = findPointAtX(700);
    setCurrentPos(pt);
  }, [pathD, findPointAtX]);

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

        {/* BUTTERY INTERACTIVE PORTFOLIO VALUATION TERMINAL */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-black/[0.06]">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block font-medium">
                Total Equity Portfolio Valuation
              </span>
              <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
                <span className="text-3xl sm:text-5xl font-extrabold font-mono text-[#111113] tracking-tight tabular-nums">
                  {currencySymbol}
                  {((scrubbedVal !== null ? scrubbedVal : totalPortfolioValue) * currencyMultiplier).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs font-mono font-semibold text-[#8E8B88]">
                  {currency}
                </span>
                {totalCostBasis > 0 && (
                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                      totalPnlPercent >= 0
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                        : "text-rose-600 bg-rose-50 border border-rose-200/60"
                    }`}
                  >
                    {totalPnlPercent >= 0 ? "+" : ""}{totalPnlPercent.toFixed(1)}%
                  </span>
                )}
                {isHovered && scrubbedVal !== null && (
                  <span className="text-xs text-[#7A7672] ml-1">
                    {currentPos.x < 150 ? "@ Buy Entry" : currentPos.x > 550 ? "@ Current Spot" : "@ Holding"}
                  </span>
                )}
              </div>
            </div>

            {/* Currency Pill Switcher (USDC / EUR) */}
            <div className="flex items-center gap-1 p-1 bg-black/[0.03] rounded-xl self-start sm:self-auto">
              {(["USDC", "EUR"] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currency === curr ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                  }`}
                >
                  {currency === curr && (
                    <motion.div
                      layoutId="sharesCurrencyPill"
                      className="absolute inset-0 bg-[#111113] rounded-lg shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{curr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spacious Buttery Interactive SVG Canvas - Compact Institutional Height */}
          <div className="relative w-full h-[140px] sm:h-[180px]">
            <svg
              ref={svgRef}
              viewBox="0 0 700 130"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible cursor-crosshair select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5C18" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#FF5C18" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gradient Area Fill under Curve */}
              <path d={areaD} fill="url(#equityGradient)" className="pointer-events-none" />

              {/* Main Crisp Vector Line */}
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke="#FF5C18"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none"
              />

              {/* Vertical Guideline */}
              <g transform={`translate(${currentPos.x}, 0)`} className="pointer-events-none">
                <line
                  x1="0"
                  y1="5"
                  x2="0"
                  y2="125"
                  stroke="#FF5C18"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  strokeOpacity={isHovered ? 0.75 : 0.3}
                />
              </g>
            </svg>

            {/* Glowing Scrubber Point */}
            <div
              style={{
                left: `${(currentPos.x / 700) * 100}%`,
                top: `${(currentPos.y / 130) * 100}%`,
              }}
              className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[2.5px] border-[#FF5C18] shadow-[0_0_12px_rgba(255,92,24,0.5)] pointer-events-none z-20"
            />
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
