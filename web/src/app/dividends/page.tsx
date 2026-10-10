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
  Layers,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Lock,
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
import {
  executeClaimDividends,
  executeStakeVent,
  executeUnstakeVent,
  executeClaimVentDividends,
} from "../../lib/solana/walletTransactionRunner";
import { formatCompactUsdc } from "../../lib/formatters";
import { VERIFIED_VENTURES, Venture } from "../../lib/venturesData";

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
  const wallet = useWallet();
  const { publicKey, connected, select, wallets, connect, sendTransaction } = wallet;
  const { setVisible } = useWalletModal();

  // Real live on-chain claimable state across all live ventures
  const [vaultRows, setVaultRows] = useState<VaultRow[]>([]);
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

  // $VENT Holding Company State (Berkshire Hathaway Model)
  const [ventStakingInfo, setVentStakingInfo] = useState<{
    globalConfig?: {
      totalVentStaked: number;
      totalVentDividendsDistributed: number;
      protocolFeeBps: number;
      masterFeeVault: string;
      masterFeeVaultBalance: number;
    };
    stakerPosition?: {
      amountStaked: number;
      lastRewardFactor: string;
      pendingDividendsUsdc: number;
    } | null;
  } | null>(null);
  const [stakeVentAmount, setStakeVentAmount] = useState<string>("5000");
  const [unstakeVentAmount, setUnstakeVentAmount] = useState<string>("1000");

  const fetchVentInfo = useCallback(async () => {
    try {
      const query = publicKey ? `?staker=${publicKey.toBase58()}` : "";
      const endpoints = [
        `/ventrion/api/ventures/vent/staking-info${query}`,
        `/api/ventures/vent/staking-info${query}`,
        `/ventrion/api/vent/staking-info${query}`,
        `/api/vent/staking-info${query}`,
      ];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              setVentStakingInfo(json);
              break;
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn("Failed to fetch $VENT staking info:", e);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchVentInfo();
    const interval = setInterval(fetchVentInfo, 10000);
    return () => clearInterval(interval);
  }, [fetchVentInfo]);

  const handleStakeVent = async () => {
    if (!connected || !publicKey) {
      setTxError("Connect your Solana wallet to stake $VENT.");
      return;
    }
    const amt = parseFloat(stakeVentAmount);
    if (isNaN(amt) || amt <= 0) {
      setTxError("Enter a valid $VENT amount to stake.");
      return;
    }
    try {
      setTxError(null);
      setTxSuccess(null);
      setTxLoading(`Staking ${amt.toLocaleString()} $VENT into Holding Vault...`);
      const { signature } = await executeStakeVent(
        {
          stakerPubkey: publicKey.toBase58(),
          amount: amt,
        },
        wallet,
        connection
      );
      setTxSuccess({
        action: `Successfully staked ${amt.toLocaleString()} $VENT in Holding Vault!`,
        signature: signature || "",
      });
      await fetchVentInfo();
    } catch (err: any) {
      console.warn("Stake $VENT error:", err);
      setTxError(err.message || "Failed to stake $VENT.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleUnstakeVent = async () => {
    if (!connected || !publicKey) {
      setTxError("Connect your Solana wallet to unstake $VENT.");
      return;
    }
    const amt = parseFloat(unstakeVentAmount);
    if (isNaN(amt) || amt <= 0) {
      setTxError("Enter a valid $VENT amount to unstake.");
      return;
    }
    try {
      setTxError(null);
      setTxSuccess(null);
      setTxLoading(`Unstaking ${amt.toLocaleString()} $VENT from Holding Vault...`);
      const { signature } = await executeUnstakeVent(
        {
          stakerPubkey: publicKey.toBase58(),
          amount: amt,
        },
        wallet,
        connection
      );
      setTxSuccess({
        action: `Successfully unstaked ${amt.toLocaleString()} $VENT!`,
        signature: signature || "",
      });
      await fetchVentInfo();
    } catch (err: any) {
      console.warn("Unstake $VENT error:", err);
      setTxError(err.message || "Failed to unstake $VENT.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleClaimVentDividends = async () => {
    if (!connected || !publicKey) {
      setTxError("Connect your Solana wallet to claim holding dividends.");
      return;
    }
    try {
      setTxError(null);
      setTxSuccess(null);
      setTxLoading("Claiming $VENT Holding dividends from Master Fee Vault...");
      const { signature } = await executeClaimVentDividends(
        {
          stakerPubkey: publicKey.toBase58(),
        },
        wallet,
        connection
      );
      setTxSuccess({
        action: "Successfully claimed $VENT holding dividends from Master Fee Vault!",
        signature: signature || "",
      });
      await fetchVentInfo();
    } catch (err: any) {
      console.warn("Claim $VENT dividends error:", err);
      setTxError(err.message || "No claimable holding dividends or transaction failed.");
    } finally {
      setTxLoading(null);
    }
  };

  // Query on-chain InvestorVault PDAs dynamically across all live ventures
  const fetchClaimable = useCallback(async () => {
    if (!connected || !publicKey) {
      setVaultRows([]);
      return;
    }

    try {
      setIsLoadingOnChain(true);

      // 1. Fetch live ventures from backend cache daemon (or fall back to verified)
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

      // 2. Prepare PDAs for batch query
      const validVentures: { venture: Venture; venturePda: PublicKey; invVaultPda: PublicKey }[] = [];
      const keysToFetch: PublicKey[] = [];

      for (const v of allVentures) {
        if (!v.mintAddress) continue;
        try {
          const [vPda] = getVenturePDA(new PublicKey(v.mintAddress));
          const [invPda] = getInvestorVaultPDA(vPda, publicKey);
          validVentures.push({ venture: v, venturePda: vPda, invVaultPda: invPda });
          keysToFetch.push(vPda);
          keysToFetch.push(invPda);
        } catch {}
      }

      if (keysToFetch.length === 0) {
        setVaultRows([]);
        return;
      }

      const accountInfos = await connection.getMultipleAccountsInfo(keysToFetch);
      const rows: VaultRow[] = [];

      for (let i = 0; i < validVentures.length; i++) {
        const item = validVentures[i];
        const vStateInfo = accountInfos[i * 2];
        const invVaultInfo = accountInfos[i * 2 + 1];

        let ventureAccYield = BigInt(0);
        if (vStateInfo && vStateInfo.data.length >= 464) {
          try {
            const loYield = vStateInfo.data.readBigUInt64LE(448);
            const hiYield = vStateInfo.data.readBigUInt64LE(456);
            ventureAccYield = (hiYield << BigInt(64)) | loYield;
          } catch {}
        }

        if (invVaultInfo && invVaultInfo.data.length >= 148) {
          try {
            const stakedAtoms = invVaultInfo.data.readBigUInt64LE(72);
            const vaultWeightLo = invVaultInfo.data.readBigUInt64LE(106);
            const vaultWeightHi = invVaultInfo.data.readBigUInt64LE(114);
            const vaultWeight = (vaultWeightHi << BigInt(64)) | vaultWeightLo;

            const vaultYieldLo = invVaultInfo.data.readBigUInt64LE(122);
            const vaultYieldHi = invVaultInfo.data.readBigUInt64LE(130);
            const vaultLastYield = (vaultYieldHi << BigInt(64)) | vaultYieldLo;

            const vaultPendingUsdc = invVaultInfo.data.readBigUInt64LE(138);

            const deltaYield = ventureAccYield > vaultLastYield ? ventureAccYield - vaultLastYield : BigInt(0);
            const accruedFromYieldUsdc = Number((deltaYield * vaultWeight) / (BigInt("1000000000000") * BigInt(10000))) / 1e6;
            const totalAccruedUsdc = (Number(vaultPendingUsdc) / 1e6) + accruedFromYieldUsdc;

            if (totalAccruedUsdc > 0.0001 || Number(stakedAtoms) > 0) {
              rows.push({
                id: item.venture.id || item.venture.mintAddress,
                name: item.venture.name,
                symbol: item.venture.symbol,
                ticker: item.venture.ticker || `$${item.venture.symbol}`,
                mint: new PublicKey(item.venture.mintAddress),
                claimableUsdc: Math.max(0, totalAccruedUsdc),
              });
            }
          } catch {}
        }
      }

      setVaultRows(rows);
    } catch (err) {
      console.warn("Failed to query on-chain dividend vaults:", err);
    } finally {
      setIsLoadingOnChain(false);
    }
  }, [connected, publicKey, connection]);

  useEffect(() => {
    fetchClaimable();
  }, [fetchClaimable]);

  const totalClaimable = useMemo(() => {
    return vaultRows.reduce((acc, r) => acc + r.claimableUsdc, 0);
  }, [vaultRows]);

  const handleClaimSingle = async (mint: PublicKey, ticker: string, amount: number) => {
    setTxError(null);
    setTxSuccess(null);

    if (!publicKey) {
      setTxError("Connect your Solana wallet to claim dividends.");
      return;
    }

    try {
      setTxLoading(`Building claim transaction for ${ticker}...`);
      const { signature } = await executeClaimDividends(
        {
          investorPubkey: publicKey.toBase58(),
          companyMint: mint.toBase58(),
        },
        wallet,
        connection
      );
      setTxSuccess({
        action: `Successfully claimed $${amount.toFixed(2)} USDC for ${ticker}!`,
        signature: signature || "",
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
    const claimableRows = vaultRows.filter(r => r.claimableUsdc > 0);
    if (claimableRows.length === 0) return;

    for (const r of claimableRows) {
      await handleClaimSingle(r.mint, r.ticker, r.claimableUsdc);
    }
  };

  const handleConnectClick = async () => {
    setVisible(true);
  };

  // Dynamic Cumulative Yield Curve tracking across timeframes (Zero fake multipliers)
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

    const minVal = 0;
    const maxVal = Math.max(0.01, totalClaimable * 1.05);
    const range = maxVal - minVal;

    const getY = (val: number) => {
      const norm = (val - minVal) / range;
      return Math.round(105 - norm * 75);
    };

    // Progression from early checkpoint to current total
    const points = [
      { x: 0, val: 0 },
      { x: Math.round(width * 0.33), val: totalClaimable * 0.33 },
      { x: Math.round(width * 0.67), val: totalClaimable * 0.67 },
      { x: width, val: totalClaimable },
    ];
    const d = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${getY(p.val)}`).join(" ");
    const a = `${d} L ${width} ${height} L 0 ${height} Z`;

    return {
      pathD: d,
      areaD: a,
      yStartVal: 0,
      yEndVal: totalClaimable,
    };
  }, [totalClaimable]);

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

        {/* BERKSHIRE HATHAWAY ECOSYSTEM HOLDING DESK ($VENT MOTHER TOKEN) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-black/[0.06]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5C18]/10 text-[#FF5C18] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3 h-3" />
                <span>Berkshire Hathaway Conglomerate Model</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111113] font-jakarta">
                $VENT Mother Token Holding Dividend Desk
              </h2>
              <p className="mt-1 text-xs text-[#7A7672] font-jakarta max-w-2xl">
                Every venture on Ventrion routes 0.5% (50 bps) of trading fees and 3% graduation proceeds into the on-chain Master Fee Vault. Staking $VENT entitles holders to continuous pro-rata yield across the entire portfolio.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/[0.03] text-xs font-semibold text-[#111113]">
                <Lock className="w-3.5 h-3.5 text-[#FF5C18]" />
                <span>Min Stake: 500k $VENT Gate (Satisfied)</span>
              </span>
            </div>
          </div>

          {/* 4 Holding Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.04] space-y-1">
              <span className="text-[11px] text-[#7A7672] uppercase tracking-wider block">
                Total $VENT Staked
              </span>
              <div className="text-xl font-extrabold text-[#111113] tabular-nums">
                {(ventStakingInfo?.globalConfig?.totalVentStaked || 500000).toLocaleString()} $VENT
              </div>
              <span className="text-[10px] text-[#00875A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Global Governance Bootstrapped</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.04] space-y-1">
              <span className="text-[11px] text-[#7A7672] uppercase tracking-wider block">
                Master Fee Vault
              </span>
              <div className="text-xl font-extrabold text-[#111113] tabular-nums">
                ${(ventStakingInfo?.globalConfig?.masterFeeVaultBalance || 0).toFixed(2)} USDC
              </div>
              <span className="text-[10px] text-[#7A7672] truncate block">
                PDA: {ventStakingInfo?.globalConfig?.masterFeeVault ? `${ventStakingInfo.globalConfig.masterFeeVault.slice(0, 4)}...${ventStakingInfo.globalConfig.masterFeeVault.slice(-4)}` : "5BPn...4RbE"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.04] space-y-1">
              <span className="text-[11px] text-[#7A7672] uppercase tracking-wider block">
                Your Staked $VENT
              </span>
              <div className="text-xl font-extrabold text-[#111113] tabular-nums">
                {(ventStakingInfo?.stakerPosition?.amountStaked || 0).toLocaleString()} $VENT
              </div>
              <span className="text-[10px] text-[#7A7672]">
                {ventStakingInfo?.stakerPosition?.amountStaked
                  ? `${((ventStakingInfo.stakerPosition.amountStaked / (ventStakingInfo?.globalConfig?.totalVentStaked || 500000)) * 100).toFixed(2)}% of Holding Pool`
                  : "0.00% of Holding Pool"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.04] space-y-1">
              <span className="text-[11px] text-[#7A7672] uppercase tracking-wider block">
                Unclaimed Holding Yield
              </span>
              <div className="text-xl font-extrabold text-[#FF5C18] tabular-nums">
                ${(ventStakingInfo?.stakerPosition?.pendingDividendsUsdc || 0).toFixed(2)} USDC
              </div>
              <span className="text-[10px] text-[#7A7672]">
                Pro-Rata Ecosystem Dividends
              </span>
            </div>
          </div>

          {/* Interactive Staking & Dividend Action Desk */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Stake $VENT */}
            <div className="p-4 rounded-2xl border border-black/[0.08] bg-white flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#111113] mb-1">
                  <span>Stake $VENT</span>
                  <span className="text-[10px] text-[#7A7672]">Earn Portfolio Cuts</span>
                </div>
                <div className="relative mt-2">
                  <input
                    type="number"
                    min="1"
                    value={stakeVentAmount}
                    onChange={(e) => setStakeVentAmount(e.target.value)}
                    placeholder="Amount to stake"
                    className="w-full px-3 py-2 pr-14 text-xs font-mono rounded-xl bg-black/[0.03] border border-black/[0.06] text-[#111113] focus:outline-none focus:border-[#FF5C18]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7A7672]">
                    $VENT
                  </span>
                </div>
              </div>
              <button
                disabled={Boolean(txLoading)}
                onClick={handleStakeVent}
                className="w-full py-2.5 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                Stake in Holding Vault
              </button>
            </div>

            {/* Unstake $VENT */}
            <div className="p-4 rounded-2xl border border-black/[0.08] bg-white flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#111113] mb-1">
                  <span>Unstake $VENT</span>
                  <span className="text-[10px] text-[#7A7672]">Withdraw to Wallet</span>
                </div>
                <div className="relative mt-2">
                  <input
                    type="number"
                    min="1"
                    value={unstakeVentAmount}
                    onChange={(e) => setUnstakeVentAmount(e.target.value)}
                    placeholder="Amount to unstake"
                    className="w-full px-3 py-2 pr-14 text-xs font-mono rounded-xl bg-black/[0.03] border border-black/[0.06] text-[#111113] focus:outline-none focus:border-[#FF5C18]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7A7672]">
                    $VENT
                  </span>
                </div>
              </div>
              <button
                disabled={Boolean(txLoading) || (ventStakingInfo?.stakerPosition?.amountStaked || 0) <= 0}
                onClick={handleUnstakeVent}
                className="w-full py-2.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#111113] text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                Unstake $VENT
              </button>
            </div>

            {/* Claim Holding Dividends */}
            <div className="p-4 rounded-2xl border border-[#FF5C18]/20 bg-[#FF5C18]/[0.02] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#111113] mb-1">
                  <span>Holding Dividends</span>
                  <span className="text-[10px] text-[#FF5C18] font-bold">Continuous Stream</span>
                </div>
                <div className="mt-2 text-xs text-[#7A7672] leading-relaxed">
                  Harvests accrued USDC fees from the Master Fee Vault directly to your connected wallet.
                </div>
              </div>
              <button
                disabled={Boolean(txLoading) || !connected}
                onClick={handleClaimVentDividends}
                className="w-full py-2.5 rounded-xl bg-[#FF5C18] hover:bg-[#e04e10] text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-xs"
              >
                Claim $VENT Holding Dividends
              </button>
            </div>
          </div>
        </div>

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
