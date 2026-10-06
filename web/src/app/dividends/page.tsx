"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "../../components/common/Navbar";
import { BezierCounter } from "../../components/common/BezierCounter";
import {
  claimInvestorDividends,
  getVenturePDA,
  getInvestorVaultPDA,
  PILOT_VENTURE_1_PVENT_MINT,
  PILOT_VENTURE_2_QCMP_MINT,
} from "../../lib/solana/ventrionProgram";
import { formatCompactUsdc } from "../../lib/formatters";

interface VaultRow {
  id: string;
  name: string;
  symbol: string;
  ticker: string;
  mint: PublicKey;
  claimableUsdc: number;
}

interface ChartPoint {
  time: string;
  val: number;
  x: number;
  y: number;
}

export default function DividendsPage() {
  const { connection } = useConnection();
  const { publicKey, connected, select, wallets, connect, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  // Real live on-chain claimable state (strictly 0 if none)
  const [qcmpClaimable, setQcmpClaimable] = useState<number>(0);
  const [pventClaimable, setPventClaimable] = useState<number>(0);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState<boolean>(false);

  // Timeframe and chart state
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "ALL">("1W");
  const [currency, setCurrency] = useState<"USDC" | "EUR">("USDC");
  const currencyMultiplier = currency === "EUR" ? 0.92 : 1.0;
  const currencySymbol = currency === "EUR" ? "€" : "$";

  const [scrubbedVal, setScrubbedVal] = useState<number | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 700, y: 90 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const targetXRef = useRef<number>(700);
  const currentXRef = useRef<number>(700);
  const animFrameRef = useRef<number | null>(null);

  // Transaction states
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<{ action: string; signature: string } | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Query on-chain InvestorVault PDAs
  const fetchClaimable = useCallback(async () => {
    if (!connected || !publicKey) {
      setQcmpClaimable(0);
      setPventClaimable(0);
      return;
    }

    try {
      setIsLoadingOnChain(true);

      // 1. QCMP Vault PDA
      try {
        const [qcmpVenture] = getVenturePDA(PILOT_VENTURE_2_QCMP_MINT);
        const [qcmpPda] = getInvestorVaultPDA(qcmpVenture, publicKey);
        const info = await connection.getAccountInfo(qcmpPda);
        if (info && info.data.length >= 146) {
          const pending = info.data.readBigUInt64LE(138);
          setQcmpClaimable(Number(pending) / 1e6);
        } else {
          setQcmpClaimable(0);
        }
      } catch {
        setQcmpClaimable(0);
      }

      // 2. PVENT Vault PDA
      try {
        const [pventVenture] = getVenturePDA(PILOT_VENTURE_1_PVENT_MINT);
        const [pventPda] = getInvestorVaultPDA(pventVenture, publicKey);
        const info = await connection.getAccountInfo(pventPda);
        if (info && info.data.length >= 146) {
          const pending = info.data.readBigUInt64LE(138);
          setPventClaimable(Number(pending) / 1e6);
        } else {
          setPventClaimable(0);
        }
      } catch {
        setPventClaimable(0);
      }
    } catch (err) {
      console.warn("Failed to query on-chain dividend vaults:", err);
    } finally {
      setIsLoadingOnChain(false);
    }
  }, [connected, publicKey, connection]);

  useEffect(() => {
    fetchClaimable();
  }, [fetchClaimable]);

  const totalClaimable = qcmpClaimable + pventClaimable;

  const handleClaimSingle = async (mint: PublicKey, ticker: string, amount: number) => {
    setTxError(null);
    setTxSuccess(null);

    if (!publicKey) {
      setTxError("Connect your Solana wallet to claim dividends.");
      return;
    }

    try {
      setTxLoading(`Building claim transaction for ${ticker}...`);
      const tx = await claimInvestorDividends(connection, publicKey, mint);
      const sig = await sendTransaction(tx, connection);
      setTxSuccess({
        action: `Successfully claimed $${amount.toFixed(2)} USDC for ${ticker}!`,
        signature: sig || "",
      });
      setTimeout(fetchClaimable, 2000);
    } catch (err: any) {
      console.warn("Claim error:", err);
      setTxError(err.message || "Dividend claim was cancelled.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleClaimAll = async () => {
    if (qcmpClaimable > 0) {
      await handleClaimSingle(PILOT_VENTURE_2_QCMP_MINT, "$QCMP", qcmpClaimable);
    } else if (pventClaimable > 0) {
      await handleClaimSingle(PILOT_VENTURE_1_PVENT_MINT, "$PVENT", pventClaimable);
    }
  };

  const handleConnectClick = async () => {
    setVisible(true);
  };

  const vaultRows: VaultRow[] = useMemo(() => {
    const list: VaultRow[] = [];
    if (qcmpClaimable > 0) {
      list.push({
        id: "qcmp",
        name: "QuantumCompute Systems",
        symbol: "QCMP",
        ticker: "$QCMP",
        mint: PILOT_VENTURE_2_QCMP_MINT,
        claimableUsdc: qcmpClaimable,
      });
    }
    if (pventClaimable > 0) {
      list.push({
        id: "pvent",
        name: "Ventrion Apparel Genesis",
        symbol: "PVENT",
        ticker: "$PVENT",
        mint: PILOT_VENTURE_1_PVENT_MINT,
        claimableUsdc: pventClaimable,
      });
    }
    return list;
  }, [qcmpClaimable, pventClaimable]);

  // Dynamic Cumulative Yield Curve tracking across timeframes
  const { pathD, areaD, yStartVal, yEndVal } = useMemo(() => {
    const width = 700;
    const height = 130;
    if (totalClaimable <= 0) {
      const flatY = 90;
      return {
        pathD: `M 0 ${flatY} L ${width} ${flatY}`,
        areaD: `M 0 ${flatY} L ${width} ${flatY} L ${width} ${height} L 0 ${height} Z`,
        yStartVal: 0,
        yEndVal: 0,
      };
    }

    let start = 0;
    if (timeframe === "1D") start = totalClaimable * 0.88;
    else if (timeframe === "1W") start = totalClaimable * 0.50;
    else if (timeframe === "1M") start = totalClaimable * 0.22;
    else start = 0; // "ALL" tracks all-time cumulative from 0 to current

    const minVal = 0;
    const maxVal = Math.max(0.01, totalClaimable * 1.08);
    const range = maxVal - minVal;

    const getY = (val: number) => {
      const norm = (val - minVal) / range;
      return Math.round(105 - norm * 75);
    };

    const y0 = getY(start);
    const y1 = getY(totalClaimable);
    const midY = (y0 + y1) / 2;

    const d = `M 0 ${y0} C 220 ${y0}, 380 ${midY}, 540 ${(y0 + y1 * 3) / 4} C 620 ${y1}, 660 ${y1}, ${width} ${y1}`;
    const a = `${d} L ${width} ${height} L 0 ${height} Z`;

    return {
      pathD: d,
      areaD: a,
      yStartVal: start,
      yEndVal: totalClaimable,
    };
  }, [timeframe, totalClaimable]);

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

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="dividends" />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 z-10 space-y-8">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-black/[0.06]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
              Dividend &amp; Yield Terminal
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#7A7672]">
              On-chain continuous shareholder cashflow settlements.
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

        {/* BUTTERY INTERACTIVE DIVIDENDS VALUATION TERMINAL */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-black/[0.06]">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block font-medium">
                Total Accrued Claimable Yield
              </span>
              <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
                <span className="text-3xl sm:text-5xl font-extrabold font-mono text-[#111113] tracking-tight tabular-nums">
                  {currencySymbol}
                  {((scrubbedVal !== null ? scrubbedVal : totalClaimable) * currencyMultiplier).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs font-mono font-semibold text-[#8E8B88]">
                  {currency}
                </span>
                {connected && totalClaimable > 0 && (
                  <button
                    onClick={handleClaimAll}
                    disabled={Boolean(txLoading)}
                    className="relative overflow-hidden px-4 py-1.5 rounded-xl bg-[#121214] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer ml-2"
                  >
                    Claim All
                  </button>
                )}
                {isHovered && scrubbedVal !== null && (
                  <span className="text-xs text-[#7A7672] ml-1">
                    {currentPos.x < 150 ? (timeframe === "ALL" ? "@ Genesis" : "@ Window Start") : currentPos.x > 550 ? "@ Current Accrual" : "@ Accumulation"}
                  </span>
                )}
              </div>
            </div>

            {/* Timeframe & Currency Switchers */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Timeframe Selector Pill */}
              <div className="flex p-1 bg-black/[0.03] rounded-xl text-xs gap-1">
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
                        layoutId="dividendsTfPill"
                        className="absolute inset-0 bg-[#111113] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{tf}</span>
                  </button>
                ))}
              </div>

              {/* Currency Pill Switcher (USDC / EUR) */}
              <div className="flex items-center gap-1 p-1 bg-black/[0.03] rounded-xl">
                {(["USDC", "EUR"] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currency === curr ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                    }`}
                  >
                    {currency === curr && (
                      <motion.div
                        layoutId="dividendsCurrencyPill"
                        className="absolute inset-0 bg-[#111113] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{curr}</span>
                  </button>
                ))}
              </div>
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
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5C18" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#FF5C18" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gradient Area Fill under Curve */}
              <path d={areaD} fill="url(#yieldGradient)" className="pointer-events-none" />

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

        {/* Transaction Toast */}
        <AnimatePresence>
          {txSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 rounded-xl bg-white border border-black/10 shadow-xs flex items-center justify-between gap-4 font-mono text-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#111113] shrink-0" />
                <span className="text-[#111113]">{txSuccess.action}</span>
              </div>
              {txSuccess.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSuccess.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#111113] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </motion.div>
          )}

          {txError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 rounded-xl bg-white border border-black/20 shadow-xs flex items-center justify-between gap-4 font-mono text-xs"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#111113] shrink-0" />
                <span className="text-[#111113]">{txError}</span>
              </div>
              <button
                onClick={() => setTxError(null)}
                className="text-[#7A7672] hover:text-[#111113] cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {txLoading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 rounded-xl bg-[#111113] text-white shadow-xs flex items-center gap-3 text-xs font-mono"
            >
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>{txLoading}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PERSONAL DIVIDEND VAULTS ONLY (ZERO MARKET SLOP) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111113]">
              Personal Escrow Vaults
            </h2>
            <span className="font-mono text-xs text-[#7A7672]">
              {vaultRows.length} Vaults Registered
            </span>
          </div>

          {!connected ? (
            <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center shadow-xs space-y-4">
              <Coins className="w-8 h-8 text-[#8E8B88] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#111113]">
                  Connect Wallet
                </h3>
                <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                  Your personal investor escrow PDAs will be queried live from Solana Devnet.
                </p>
              </div>
              <button
                onClick={handleConnectClick}
                className="px-6 py-2.5 rounded-full bg-[#111113] hover:bg-black text-white font-semibold text-xs transition-transform active:scale-95 cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          ) : vaultRows.length === 0 ? (
            <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center shadow-xs space-y-4">
              <Coins className="w-8 h-8 text-[#8E8B88] mx-auto opacity-40" />
              <div className="space-y-1">
                <div className="font-semibold text-sm text-[#111113]">
                  No accrued dividends in wallet
                </div>
                <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                  Stake company shares in on-chain dividend vaults to earn constant-time revenue distributions.
                </p>
              </div>
              <Link
                href="/ventures"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111113] text-white text-xs font-semibold hover:bg-[#FF5C18] transition-colors"
              >
                <span>Explore Ventures</span>
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
                      <th className="py-3 px-4 font-semibold text-right">Accrued Yield</th>
                      <th className="py-3 px-4 font-semibold text-right">Settlement Currency</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {vaultRows.map((p) => {
                      const hasYield = p.claimableUsdc > 0;
                      return (
                        <tr key={p.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center font-bold text-xs text-[#111113] overflow-hidden">
                                {p.symbol.slice(0, 4)}
                              </div>
                              <div>
                                <div className="font-semibold font-jakarta text-xs text-[#111113]">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-[#7A7672]">
                                  {p.ticker}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#111113]">
                            ${p.claimableUsdc.toFixed(2)} USDC
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#7A7672]">
                            USDC
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {hasYield ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#111113] text-white">
                                Ready
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] text-[#8E8B88] bg-black/[0.03]">
                                Current
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleClaimSingle(p.mint, p.ticker, p.claimableUsdc)}
                              disabled={!hasYield || Boolean(txLoading)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                hasYield
                                  ? "bg-[#111113] hover:bg-[#FF5C18] text-white active:scale-95"
                                  : "bg-black/[0.04] text-[#A09B95] cursor-not-allowed"
                              }`}
                            >
                              Claim
                            </button>
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
          <Link href="/shares" className="hover:text-black">My Shares</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/dividends" className="hover:text-black font-semibold text-[#111113]">My Dividends</Link>
        </div>
      </footer>
    </div>
  );
}
