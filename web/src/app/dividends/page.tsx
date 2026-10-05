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
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

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
        const [qcmpPda] = getInvestorVaultPDA(PILOT_VENTURE_2_QCMP_MINT, publicKey);
        const info = await connection.getAccountInfo(qcmpPda);
        if (info && info.data.length >= 130) {
          const pending = info.data.readBigUInt64LE(88);
          setQcmpClaimable(Number(pending) / 1e6);
        } else {
          setQcmpClaimable(0);
        }
      } catch {
        setQcmpClaimable(0);
      }

      // 2. PVENT Vault PDA
      try {
        const [pventPda] = getInvestorVaultPDA(PILOT_VENTURE_1_PVENT_MINT, publicKey);
        const info = await connection.getAccountInfo(pventPda);
        if (info && info.data.length >= 130) {
          const pending = info.data.readBigUInt64LE(88);
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

  // Dynamic Cumulative Yield Curve based on totalClaimable
  const currentChartPoints: ChartPoint[] = useMemo(() => {
    const baseVal = totalClaimable > 0 ? totalClaimable : 0;
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
        { time: "00:00", val: baseVal * 0.82, x: 0, y: 160 },
        { time: "06:00", val: baseVal * 0.88, x: 175, y: 140 },
        { time: "12:00", val: baseVal * 0.93, x: 350, y: 115 },
        { time: "18:00", val: baseVal * 0.97, x: 525, y: 75 },
        { time: "Now", val: baseVal, x: 700, y: 35 },
      ];
    }
    if (timeframe === "1W") {
      return [
        { time: "Mon", val: baseVal * 0.45, x: 0, y: 180 },
        { time: "Tue", val: baseVal * 0.58, x: 140, y: 155 },
        { time: "Wed", val: baseVal * 0.70, x: 280, y: 130 },
        { time: "Thu", val: baseVal * 0.82, x: 420, y: 100 },
        { time: "Fri", val: baseVal * 0.94, x: 560, y: 65 },
        { time: "Today", val: baseVal, x: 700, y: 35 },
      ];
    }
    if (timeframe === "1M") {
      return [
        { time: "W1", val: baseVal * 0.25, x: 0, y: 185 },
        { time: "W2", val: baseVal * 0.52, x: 233, y: 145 },
        { time: "W3", val: baseVal * 0.78, x: 466, y: 95 },
        { time: "W4", val: baseVal, x: 700, y: 35 },
      ];
    }
    // "ALL"
    return [
      { time: "Genesis", val: 0, x: 0, y: 190 },
      { time: "Launch", val: baseVal * 0.3, x: 233, y: 150 },
      { time: "Growth", val: baseVal * 0.7, x: 466, y: 95 },
      { time: "Current", val: baseVal, x: 700, y: 35 },
    ];
  }, [timeframe, totalClaimable]);

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

        {/* UNIFIED INTERACTIVE YIELD ACCUMULATION CHART (REPLACING OLD 3 AGGREGATE CONTAINERS) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                Total Accrued Claimable Yield
              </span>
              <div className="flex items-baseline gap-4">
                <div className="text-3xl sm:text-4xl font-bold text-[#111113] tabular-nums">
                  ${connected ? <BezierCounter value={totalClaimable} decimals={2} /> : "0.00"} <span className="text-xs font-normal text-[#7A7672]">USDC</span>
                </div>
                {connected && totalClaimable > 0 && (
                  <button
                    onClick={handleClaimAll}
                    disabled={Boolean(txLoading)}
                    className="relative overflow-hidden px-4 py-2 rounded-xl bg-[#121214] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer"
                  >
                    Claim All
                  </button>
                )}
              </div>
              <div className="text-xs text-[#7A7672]">
                {connected ? "Continuous on-chain escrow accumulation" : "Connect wallet to load dividend escrows"}
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
                      layoutId="dividendsTfPill"
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
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5C18" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#FF5C18" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={svgAreaD} fill="url(#yieldGradient)" />
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
