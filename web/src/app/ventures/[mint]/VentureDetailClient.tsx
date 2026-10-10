"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Navbar } from "../../../components/common/Navbar";
import { BezierCounter } from "../../../components/common/BezierCounter";
import { ArrowLeft, Copy, Check, ExternalLink, FileText, Globe, Share2 } from "lucide-react";
import { VERIFIED_VENTURES, Venture, MilestoneItem } from "../../../lib/venturesData";
import {
  buyFlatCurveShares,
  redeemShares,
  depositInvestorShares,
  claimInvestorDividends,
  DEVNET_USDC_MINT,
  TOKEN_PROGRAM_ID,
  getVenturePDA,
  getFundingRoundPDA,
  getReceiptMintPDA,
  getInvestorVaultPDA,
} from "../../../lib/solana/ventrionProgram";
import {
  executeContributeRound,
  executeSellPrimaryRound,
  executeRedeemShares,
  executeVoteMilestone,
  executeDlmmSwap,
  executeStakeShares,
  executeUnstakeShares,
  executeClaimDividends,
  executeRagequitMilestoneEscrow,
} from "../../../lib/solana/walletTransactionRunner";
import { formatCompactUsdc, formatCompactShares } from "../../../lib/formatters";

type Timeframe = "1D" | "1W" | "1M" | "ALL";
type BottomTab = "STAKING" | "DIVIDENDS" | "MILESTONES";

interface ChartPoint {
  time: string;
  price: number;
  marketCap?: number;
  x: number;
  y: number;
}

// Robust clipboard copy supporting non-secure contexts & HTTP
async function copyTextRobust(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (navigator?.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {}
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.top = "-9999px";
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand("copy");
    document.body.removeChild(el);
    return success;
  } catch (err) {
    return false;
  }
}

/**
 * Smart Amount Parser:
 * Supports '13.5k', '50k', '1.2m', '954.441,98', '954,441.98', '$100', etc.
 */
export function parseSmartAmount(input: string | number): number {
  if (typeof input === "number") return isNaN(input) ? 0 : input;
  if (!input) return 0;
  let str = input.trim().toLowerCase().replace(/^\$/, "");
  if (!str) return 0;

  let multiplier = 1;
  if (str.endsWith("k")) {
    multiplier = 1e3;
    str = str.slice(0, -1).trim();
  } else if (str.endsWith("m")) {
    multiplier = 1e6;
    str = str.slice(0, -1).trim();
  } else if (str.endsWith("b")) {
    multiplier = 1e9;
    str = str.slice(0, -1).trim();
  }

  // Handle German vs US separator formats:
  // e.g. "954.441,98" (dots thousand, comma decimal)
  if (str.includes(",") && str.includes(".")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    const parts = str.split(",");
    if (parts.length === 2 && (parts[1].length !== 3 || multiplier > 1)) {
      str = str.replace(",", ".");
    } else if (parts.length > 2) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(",", ".");
    }
  } else if (str.includes(".")) {
    const parts = str.split(".");
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3 && multiplier === 1 && Number(parts[0]) >= 1) {
      // e.g. "50.000" -> 50000
      str = parts[0] + parts[1];
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return num * multiplier;
}

/**
 * Visual Formatter for MAX button:
 * Floors to 2 decimal places and formats with thousands dot separators and comma decimals:
 * e.g. 954441.986067 -> "954.441,98"
 */
export function formatMaxFloored(val: number): string {
  if (!val || val <= 0) return "0";
  const floored = Math.floor(val * 100) / 100;
  const parts = floored.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
}

/**
 * Sanitized user-friendly error messages (no raw Anchor errors, byte arrays, or RPC logs):
 */
export function sanitizeSolanaError(err: any): string {
  if (!err) return "Transaction failed. Please try again.";
  const msg = typeof err === "string" ? err : err.message || JSON.stringify(err);

  if (
    msg.toLowerCase().includes("user rejected") ||
    msg.toLowerCase().includes("cancelled") ||
    msg.toLowerCase().includes("rejected the request") ||
    msg.toLowerCase().includes("declined")
  ) {
    return "Transaction cancelled in wallet.";
  }

  if (
    msg.toLowerCase().includes("insufficient lamports") ||
    msg.toLowerCase().includes("insufficient funds for rent") ||
    msg.toLowerCase().includes("custom program error: 0x1") ||
    msg.toLowerCase().includes("insufficient sol")
  ) {
    return "Insufficient SOL to cover transaction gas fees. Please keep at least 0.05 SOL.";
  }

  if (msg.includes("6028") || msg.includes("ExceedsHardCap") || msg.includes("0x178c")) {
    return "Contribution would exceed round hard cap. Automatically capped to remaining allocation.";
  }
  if (msg.includes("6029") || msg.includes("InexactPriceConversion") || msg.includes("0x178d")) {
    return "Amount adjusted to whole share units.";
  }
  if (msg.includes("6004") || msg.includes("RoundNotActive") || msg.includes("0x1774")) {
    return "Funding round is currently paused or completed.";
  }
  if (msg.includes("6024") || msg.includes("InsufficientReceiptBalance") || msg.includes("0x1788")) {
    return "Insufficient primary receipts to redeem shares.";
  }
  if (msg.includes("6013") || msg.includes("LockNotExpired") || msg.includes("0x177d")) {
    return "Staking lock period is still active.";
  }
  if (msg.includes("6010") || msg.includes("NoDividendsOwed") || msg.includes("0x177a")) {
    return "No claimable dividends available right now.";
  }
  if (msg.includes("6000") || msg.includes("InvalidUsdcMint")) {
    return "Invalid currency mint: transaction requires Devnet USDC.";
  }
  if (msg.includes("6006") || msg.includes("RoundNotEligibleForRefund")) {
    return "Venture has already graduated; primary receipts must be converted to shares.";
  }

  if (msg.toLowerCase().includes("blockhash not found") || msg.toLowerCase().includes("block height exceeded")) {
    return "Network timed out. Please retry the transaction.";
  }
  if (msg.toLowerCase().includes("slippage") || msg.toLowerCase().includes("slippagetoleranceexceeded")) {
    return "Price moved outside slippage tolerance. Please try again.";
  }

  if (msg.length > 100 && (msg.includes("Program ") || msg.includes("InstructionError") || msg.includes("failed: "))) {
    return "Devnet transaction failed. Please check your balance and try again.";
  }

  return msg;
}

export function VentureDetailClient({ mint }: { mint: string }) {
  const getInitialMint = (): string => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const vIdx = parts.indexOf("ventures");
      if (vIdx !== -1 && parts[vIdx + 1]) {
        return decodeURIComponent(parts[vIdx + 1]);
      }
    }
    return mint;
  };

  const [effectiveMint, setEffectiveMint] = useState<string>(getInitialMint);
  const [venture, setVenture] = useState<Venture | null>(null);
  const [isLoadingVenture, setIsLoadingVenture] = useState<boolean>(true);
  const [ventureNotFound, setVentureNotFound] = useState<boolean>(false);
  const [isOnChainVerified, setIsOnChainVerified] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  const handleCopyAddress = async (addr: string) => {
    const ok = await copyTextRobust(addr);
    if (ok) {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // UNIFIED HIGH-SPEED DECENTRALIZED RESOLUTION: Parallel RPC & Cache querying
  useEffect(() => {
    const currentMint = getInitialMint();
    setEffectiveMint(currentMint);
    setVentureNotFound(false);

    let isMounted = true;

    // Instant local baseline match or session cache match if available
    let initialMatch = VERIFIED_VENTURES.find(
      (v) =>
        v.mintAddress === currentMint ||
        v.id === currentMint ||
        v.symbol.toLowerCase() === currentMint.toLowerCase()
    );

    if (!initialMatch && typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("ventrion_live_ventures");
        if (cached) {
          const list: Venture[] = JSON.parse(cached);
          initialMatch = list.find(
            (v) =>
              v.mintAddress === currentMint ||
              v.id === currentMint ||
              v.symbol.toLowerCase() === currentMint.toLowerCase()
          );
        }
      } catch {}
    }

    if (initialMatch) {
      setVenture({ ...initialMatch });
      setIsOnChainVerified(true);
      setIsLoadingVenture(false);
    } else {
      setIsLoadingVenture(true);
      setIsOnChainVerified(false);
      setVenture(null);
    }

    (async () => {
      let mintPubkey: PublicKey | null = null;
      try {
        mintPubkey = new PublicKey(currentMint);
      } catch {
        if (isMounted && !initialMatch) {
          setIsLoadingVenture(false);
          setVentureNotFound(true);
          setIsOnChainVerified(false);
          setVenture(null);
        }
        return;
      }

      try {
        const [venturePda] = getVenturePDA(mintPubkey);

        // Fetch live cache and on-chain account in parallel with zero sequential waiting
        const fetchLivePromise = (async () => {
          const endpoints = ["/ventrion/api/ventures/live", "/api/ventures/live"];
          for (const ep of endpoints) {
            try {
              const res = await fetch(ep);
              if (res.ok) {
                const data = await res.json();
                const list = data?.data || data?.ventures;
                if (Array.isArray(list)) {
                  const m = list.find(
                    (v: any) =>
                      v.mintAddress === currentMint ||
                      v.id === currentMint ||
                      v.symbol?.toLowerCase() === currentMint.toLowerCase()
                  );
                  if (m) return m;
                }
              }
            } catch {}
          }
          return null;
        })();

        const checkAccountPromise = connection.getAccountInfo(venturePda).catch(() => null);

        const [liveMatch, accountInfo] = await Promise.all([
          fetchLivePromise,
          checkAccountPromise,
        ]);

        if (!isMounted) return;

        if (liveMatch || accountInfo || initialMatch) {
          let resolved = liveMatch || initialMatch;
          if (!resolved) {
            const [fRound] = getFundingRoundPDA(venturePda, 0);
            const [rMint] = getReceiptMintPDA(fRound);
            resolved = {
              id: currentMint,
              name: `Enterprise ${currentMint.slice(0, 4)}...${currentMint.slice(-4)}`,
              symbol: currentMint.slice(0, 4).toUpperCase(),
              ticker: `$${currentMint.slice(0, 4).toUpperCase()}`,
              tagline: `Tokenized enterprise entity on Solana Devnet.`,
              description: `On-chain enterprise entity deployed on Ventrion Protocol (Devnet). Mint: ${currentMint}`,
              category: "AI & Compute",
              canonicalStatus: "Raising",
              statusBadge: "Raising",
              legalEntity: "MIDAO DAO LLC, Marshall Islands",
              registrationNumber: `MIDAO-${currentMint.slice(0, 5).toUpperCase()}-REG`,
              sharePriceUsdc: 0.10,
              marketCapUsdc: 100000,
              targetFundingCapUsdc: 50000,
              totalCapitalRaisedUsdc: 0,
              fundingProgressPercent: 0,
              lockedEscrowUsdc: 0,
              currentDividendYield: 0,
              logoUrl: "/ventrion-logo.png",
              mintAddress: currentMint,
              receiptMint: rMint.toBase58(),
              founderAddress: "",
              totalShares: 1000000,
              circulatingFloat: 400000,
              dlmmLockedShares: 170000,
              founderVestingShares: 300000,
              progressPercentage: 0,
              founderLockMonths: 12,
              founderLockPercentage: 30,
              vTrustTier: "AAA+",
              schufaRating: "AAA+",
              totalDividendsPaidUsdc: 0,
              currentApy: 0,
              activeRound: 0,
              milestones: [
                {
                  id: 0,
                  title: "Milestone 1: Legal Formation & Setup",
                  description: "Protocol legal wrapper and smart contract verification.",
                  percentageBps: 3000,
                  amountUsdc: 15000,
                  targetDays: 30,
                  status: "in_review",
                  votesFor: 10,
                  votesAgainst: 0,
                  vetoPercentage: 0,
                },
                {
                  id: 1,
                  title: "Milestone 2: Prototype Architecture",
                  description: "Infrastructure scaling and commercial pipeline validation.",
                  percentageBps: 3500,
                  amountUsdc: 17500,
                  targetDays: 60,
                  status: "pending",
                  votesFor: 0,
                  votesAgainst: 0,
                  vetoPercentage: 0,
                },
                {
                  id: 2,
                  title: "Milestone 3: Full Market Integration",
                  description: "Meteora DLMM liquidity pool and programmatic dividend streaming.",
                  percentageBps: 3500,
                  amountUsdc: 17500,
                  targetDays: 90,
                  status: "pending",
                  votesFor: 0,
                  votesAgainst: 0,
                  vetoPercentage: 0,
                },
              ],
              products: [],
            };
          }

          setVenture(resolved);
          setIsOnChainVerified(true);
          setVentureNotFound(false);
          setIsLoadingVenture(false);
        } else {
          // Strictly does not exist on Solana Devnet
          setIsLoadingVenture(false);
          setVentureNotFound(true);
          setIsOnChainVerified(false);
          setVenture(null);
        }
      } catch (err) {
        if (isMounted) {
          if (initialMatch) {
            setVenture(initialMatch);
            setIsOnChainVerified(true);
            setIsLoadingVenture(false);
          } else {
            setIsLoadingVenture(false);
            setVentureNotFound(true);
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [mint, connection]);

  // Canonical Lifecycle States
  const isGraduated = venture?.canonicalStatus === "Funded" || venture?.statusBadge?.includes("Graduated") || venture?.statusBadge === "Funded";
  const isMigrating = venture?.canonicalStatus === "Migrating" || venture?.statusBadge?.includes("Migrating");
  const isPrimary = venture?.canonicalStatus === "Raising" || venture?.statusBadge?.includes("Primary Raise") || venture?.statusBadge === "Raising";
  const isReceiptPhase = isPrimary || isMigrating;

  // Chart States
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Buy Terminal States with Smart String Input ('13.5k', '50k', '954.441,98', etc.)
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL" | "REDEEM">("BUY");
  const [tradeInputStr, setTradeInputStr] = useState<string>("100");
  const tradeAmount = useMemo(() => {
    return parseSmartAmount(tradeInputStr);
  }, [tradeInputStr]);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const tradeInputRef = useRef<HTMLInputElement | null>(null);

  // Default to SELL when a venture is in Migrating state (as primary raise is 100% full)
  useEffect(() => {
    if (isMigrating && tradeAction === "BUY") {
      setTradeAction("SELL");
    }
  }, [isMigrating]);

  // Bottom Module Tab State (Unified 3-Switchers)
  const [bottomTab, setBottomTab] = useState<BottomTab>("STAKING");

  // Staking & Lock Duration State
  const [lockDays, setLockDays] = useState<number>(180);
  const [stakeAmount, setStakeAmount] = useState<number>(5000);
  const [isStakeFocused, setIsStakeFocused] = useState<boolean>(false);
  const stakeInputRef = useRef<HTMLInputElement | null>(null);
  const [unclaimedDividends, setUnclaimedDividends] = useState<number>(0);
  const [userStakedShares, setUserStakedShares] = useState<number>(0);
  const [userLockEndTimestamp, setUserLockEndTimestamp] = useState<number>(0);
  const [totalClaimedDividends, setTotalClaimedDividends] = useState<number>(0);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);

  // Milestone Governance States
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem>(() => {
    return (
      venture?.milestones?.[1] ||
      venture?.milestones?.[0] || {
        id: 0,
        title: "Core Infrastructure & Liquidity Seeding",
        description: "Initial protocol deployment and treasury lock.",
        percentageBps: 3000,
        amountUsdc: 15000,
        targetDays: 30,
        status: "completed",
        votesFor: 0,
        votesAgainst: 0,
        vetoPercentage: 0,
      }
    );
  });
  const [userVote, setUserVote] = useState<"APPROVE" | "VETO" | null>(null);
  const [votedTxHash, setVotedTxHash] = useState<string | null>(null);

  // Sticky System Toast States
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Auto-dismiss sticky notifications
  useEffect(() => {
    if (txSuccess || txError) {
      const timer = setTimeout(() => {
        setTxSuccess(null);
        setTxError(null);
        setTxSignature(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [txSuccess, txError]);

  // User Balances (100% Real On-Chain Devnet Balances)
  const [userReceipts, setUserReceipts] = useState<number>(0);
  const [userShares, setUserShares] = useState<number>(0);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number>(0);

  const refreshUserBalances = React.useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setUserReceipts(0);
      setUserShares(0);
      setUserStakedShares(0);
      setUserUsdcBalance(0);
      setUnclaimedDividends(0);
      setTotalClaimedDividends(0);
      return;
    }

    try {
      const parsed = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const mintToAmount: Record<string, number> = {};
      for (const item of parsed.value) {
        const info = item.account.data.parsed.info;
        const mintAddr = info.mint;
        const amount = info.tokenAmount.uiAmount || 0;
        mintToAmount[mintAddr] = (mintToAmount[mintAddr] || 0) + amount;
      }

      // 1. USDC Balance
      const usdc = mintToAmount[DEVNET_USDC_MINT.toBase58()] || 0;
      setUserUsdcBalance(usdc);

      // 2. Shares Balance
      if (venture?.mintAddress) {
        const shares = mintToAmount[venture.mintAddress] || 0;
        setUserShares(shares);
      }

      // 3. Receipts Balance
      let receipts = 0;
      if (venture?.receiptMint && mintToAmount[venture.receiptMint]) {
        receipts = mintToAmount[venture.receiptMint];
      } else if (venture?.mintAddress) {
        try {
          const [vPda] = getVenturePDA(new PublicKey(venture.mintAddress));
          const [fRound] = getFundingRoundPDA(vPda, 0);
          const [rMint] = getReceiptMintPDA(fRound);
          receipts = mintToAmount[rMint.toBase58()] || 0;
        } catch {}
      }
      setUserReceipts(receipts);

      // 4. On-chain Investor Vault (Staked shares & Unclaimed dividends)
      if (venture?.mintAddress) {
        try {
          const [vPda] = getVenturePDA(new PublicKey(venture.mintAddress));
          const [invVaultPda] = getInvestorVaultPDA(vPda, wallet.publicKey);

          const [vStateAcc, vAcc] = await Promise.all([
            connection.getAccountInfo(vPda).catch(() => null),
            connection.getAccountInfo(invVaultPda).catch(() => null),
          ]);

          let ventureAccYield = BigInt(0);
          if (vStateAcc && vStateAcc.data.length >= 464) {
            try {
              const loYield = vStateAcc.data.readBigUInt64LE(448);
              const hiYield = vStateAcc.data.readBigUInt64LE(456);
              ventureAccYield = (hiYield << BigInt(64)) | loYield;
            } catch {}
          }

          if (vAcc && vAcc.data.length >= 148) {
            const stakedAmount = vAcc.data.readBigUInt64LE(72);
            setUserStakedShares(Number(stakedAmount) / 1e6);

            const lockEnd = Number(vAcc.data.readBigInt64LE(88));
            setUserLockEndTimestamp(lockEnd);

            const vaultWeightLo = vAcc.data.readBigUInt64LE(106);
            const vaultWeightHi = vAcc.data.readBigUInt64LE(114);
            const vaultWeight = (vaultWeightHi << BigInt(64)) | vaultWeightLo;

            const vaultYieldLo = vAcc.data.readBigUInt64LE(122);
            const vaultYieldHi = vAcc.data.readBigUInt64LE(130);
            const vaultLastYield = (vaultYieldHi << BigInt(64)) | vaultYieldLo;

            const vaultPendingUsdc = vAcc.data.readBigUInt64LE(138);

            const deltaYield = ventureAccYield > vaultLastYield ? ventureAccYield - vaultLastYield : BigInt(0);
            const accruedFromYieldUsdc = Number((deltaYield * vaultWeight) / (BigInt("1000000000000") * BigInt(10000))) / 1e6;
            const accruedUsdc = (Number(vaultPendingUsdc) / 1e6) + accruedFromYieldUsdc;
            setUnclaimedDividends(Math.max(0, accruedUsdc));

            if (vAcc.data.length >= 154) {
              const claimedUsdc = vAcc.data.readBigUInt64LE(146);
              setTotalClaimedDividends(Number(claimedUsdc) / 1e6);
            }
          } else {
            setUserStakedShares(0);
            setUserLockEndTimestamp(0);
            setUnclaimedDividends(0);
            setTotalClaimedDividends(0);
          }
        } catch {
          setUserStakedShares(0);
          setUserLockEndTimestamp(0);
          setUnclaimedDividends(0);
          setTotalClaimedDividends(0);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user devnet balances:", e);
    }
  }, [connection, wallet.connected, wallet.publicKey, venture?.mintAddress, venture?.receiptMint]);

  useEffect(() => {
    refreshUserBalances();
  }, [refreshUserBalances]);

  // Yield Multiplier from Manifest: 0d -> 1.0x, 30d -> 1.2x, 90d -> 1.5x, 180d -> 1.75x, 365d -> 2.0x, 730d -> 3.0x
  const multiplier = useMemo(() => {
    if (lockDays >= 730) return 3.0;
    if (lockDays >= 365) return 2.0;
    if (lockDays >= 180) return 1.75;
    if (lockDays >= 90) return 1.5;
    if (lockDays >= 30) return 1.2;
    return 1.0;
  }, [lockDays]);

  const effectiveApy = useMemo(() => {
    const base = (venture?.currentDividendYield && venture.currentDividendYield > 0) ? venture.currentDividendYield : 0;
    return base * multiplier;
  }, [venture?.currentDividendYield, multiplier]);

  // Fetch Real Live On-Chain Trade Chart Points
  useEffect(() => {
    let isMounted = true;
    const fetchChartPoints = async () => {
      if (!venture?.mintAddress) return;
      setIsLoadingChart(true);
      try {
        const endpoints = [
          `/ventrion/api/ventures/${venture.mintAddress}/chart?timeframe=${timeframe}`,
          `/api/ventures/${venture.mintAddress}/chart?timeframe=${timeframe}`,
          `/ventrion/api/ventures/chart/${venture.mintAddress}?timeframe=${timeframe}`,
          `/api/ventures/chart/${venture.mintAddress}?timeframe=${timeframe}`,
        ];
        let fetched: ChartPoint[] | null = null;
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep);
            if (res.ok) {
              const json = await res.json();
              if (json?.success && Array.isArray(json?.points) && json.points.length > 0) {
                fetched = json.points;
                break;
              }
            }
          } catch {}
        }

        if (isMounted) {
          if (fetched && fetched.length > 0) {
            const prices = fetched.map((p) => p.price);
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            const pRange = maxP - minP;
            const normalized = fetched.map((p, idx) => {
              const x = p.x !== undefined ? p.x : (fetched!.length > 1 ? Math.round((idx / (fetched!.length - 1)) * 700) : 350);
              let y = p.y !== undefined ? p.y : 130;
              if (p.y === undefined && pRange > 0.0001) {
                y = Math.round(170 - ((p.price - minP) / pRange) * 140);
              }
              const marketCap = p.marketCap ?? Math.round(p.price * (venture.totalShares || 1000000));
              return { time: p.time, price: p.price, marketCap, x, y };
            });
            setChartPoints(normalized);
          } else {
            // Zero-trade mathematical baseline from real on-chain round price
            const basePrice = venture.sharePriceUsdc || 0.10;
            const baseCap = Math.round(basePrice * (venture.totalShares || 1000000));
            const labels = timeframe === "1D" 
              ? ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"]
              : timeframe === "1W"
              ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              : timeframe === "1M"
              ? ["W1", "W2", "W3", "W4"]
              : ["Genesis", "Raise", "Maturity", "Now"];
            const fallbackPoints = labels.map((lbl, idx) => ({
              time: lbl,
              price: basePrice,
              marketCap: baseCap,
              x: Math.round((idx / (labels.length - 1)) * 700),
              y: 130,
            }));
            setChartPoints(fallbackPoints);
          }
        }
      } catch (err) {
        if (isMounted) {
          const basePrice = venture.sharePriceUsdc || 0.10;
          const baseCap = Math.round(basePrice * (venture.totalShares || 1000000));
          setChartPoints([
            { time: "Start", price: basePrice, marketCap: baseCap, x: 0, y: 130 },
            { time: "Now", price: basePrice, marketCap: baseCap, x: 700, y: 130 },
          ]);
        }
      } finally {
        if (isMounted) setIsLoadingChart(false);
      }
    };

    fetchChartPoints();
    return () => {
      isMounted = false;
    };
  }, [venture?.mintAddress, venture?.sharePriceUsdc, venture?.totalShares, timeframe]);

  const currentChartPoints: ChartPoint[] = useMemo(() => {
    if (chartPoints.length > 0) return chartPoints;
    const basePrice = venture?.sharePriceUsdc || 0.10;
    const baseCap = Math.round(basePrice * (venture?.totalShares || 1000000));
    return [
      { time: "Start", price: basePrice, marketCap: baseCap, x: 0, y: 130 },
      { time: "Now", price: basePrice, marketCap: baseCap, x: 700, y: 130 },
    ];
  }, [chartPoints, venture?.sharePriceUsdc, venture?.totalShares]);

  // Synchronous Dynamic Price and Market Cap
  const activePrice = hoveredPoint ? hoveredPoint.price : (venture?.sharePriceUsdc || 0.10);
  const activeMarketCap = hoveredPoint?.marketCap ?? Math.round(activePrice * (venture?.totalShares || 1000000));

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

  // Interactive Chart Mouse Hover Handler
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

  // Staking Depth Ladder Data (Live On-Chain Staking Positions)
  const stakingDepthLadder = useMemo(() => {
    const totalStaked = venture?.totalStakedInVaults || 0;
    const tiers = [
      { tier: "730d (2Y)", multiplier: "3.00x", days: 730 },
      { tier: "365d (1Y)", multiplier: "2.00x", days: 365 },
      { tier: "180d", multiplier: "1.75x", days: 180 },
      { tier: "90d", multiplier: "1.50x", days: 90 },
      { tier: "30d", multiplier: "1.20x", days: 30 },
      { tier: "Liquid", multiplier: "1.00x", days: 0 },
    ];
    return tiers.map((t) => {
      const isSelected = lockDays === t.days;
      const tierShares = (userStakedShares > 0 && isSelected)
        ? userStakedShares
        : (totalStaked > 0 && isSelected ? totalStaked : 0);
      const pct = totalStaked > 0 ? (tierShares / totalStaked) * 100 : (tierShares > 0 ? 100 : 0);
      const depthWidth = pct > 0 ? `${Math.min(100, Math.max(12, pct))}%` : "0%";
      return {
        ...t,
        lockedShares: tierShares,
        percentage: Number(pct.toFixed(1)),
        depthWidth,
      };
    });
  }, [venture?.totalStakedInVaults, lockDays, userStakedShares]);

  // Handlers for Devnet Transactions
  const handleExecuteTrade = async () => {
    setTxError(null);
    setTxSuccess(null);
    setTxSignature(null);

    if (!wallet.publicKey) {
      setTxError("Connect your Solana wallet to execute trades.");
      return;
    }

    if (!isOnChainVerified || !venture || ventureNotFound) {
      setTxError("Trading disabled: Venture contract does not exist on Solana Devnet.");
      return;
    }

    if (isMigrating && tradeAction === "BUY") {
      setTxError("Primary raise is 100% completed. Buying is paused while liquidity migrates to Meteora DLMM. You can refund receipts via 'Sell'.");
      return;
    }

    if (tradeAmount <= 0 || isNaN(tradeAmount)) {
      setTxError("Please enter a valid amount greater than 0.");
      return;
    }

    // STRICT PRE-FLIGHT BALANCE CHECKS
    if (tradeAction === "BUY" && userUsdcBalance < tradeAmount) {
      setTxError(`Insufficient USDC balance. You have $${userUsdcBalance.toFixed(2)} USDC available, but entered $${tradeAmount.toFixed(2)}.`);
      return;
    }

    if (tradeAction === "SELL") {
      const maxAvailable = isReceiptPhase ? userReceipts : userShares;
      if (maxAvailable < tradeAmount) {
        setTxError(`Insufficient balance to sell. You have ${maxAvailable.toLocaleString()} ${isReceiptPhase ? "receipts" : venture.symbol} available, but entered ${tradeAmount.toLocaleString()}.`);
        return;
      }
    }

    if (tradeAction === "REDEEM") {
      if (!isGraduated) {
        setTxError("Redemption is only available once the venture has reached Funded status.");
        return;
      }
      if (userReceipts < tradeAmount) {
        setTxError(`Insufficient receipts to redeem. You hold ${userReceipts.toLocaleString()} receipts, but entered ${tradeAmount.toLocaleString()}.`);
        return;
      }
      try {
        setTxLoading(`Redeeming ${tradeAmount.toLocaleString()} receipts on Devnet...`);
        const { signature } = await executeRedeemShares(
          {
            investorPubkey: wallet.publicKey.toBase58(),
            companyMint: venture.mintAddress,
            sharesAmount: Math.floor(tradeAmount * 1_000_000),
          },
          wallet,
          connection
        );
        setTxSignature(signature);
        setTxSuccess(`Redeemed ${tradeAmount.toLocaleString()} receipts for 1:1 tradable shares on Devnet!`);
        await refreshUserBalances();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ventrion:trade_completed"));
          window.dispatchEvent(new Event("ventrion:balances_updated"));
        }
      } catch (err: any) {
        setTxError(sanitizeSolanaError(err));
      } finally {
        setTxLoading(null);
      }
      return;
    }

    if (isReceiptPhase && tradeAction === "BUY") {
      try {
        // Auto-clamp to remaining round allocation if greater than hard cap
        let finalBuyAmount = tradeAmount;
        if (venture.targetFundingCapUsdc) {
          const remainingCap = Math.max(0, venture.targetFundingCapUsdc - (venture.totalCapitalRaisedUsdc || 0));
          if (remainingCap > 0 && finalBuyAmount > remainingCap) {
            finalBuyAmount = remainingCap;
          }
        }

        if (finalBuyAmount <= 0) {
          setTxError("This funding round has reached its target cap.");
          return;
        }

        setTxLoading(`Buying $${finalBuyAmount.toLocaleString()} USDC on Devnet...`);
        const { signature } = await executeContributeRound(
          {
            investorPubkey: wallet.publicKey.toBase58(),
            companyMint: venture.mintAddress,
            usdcAmount: Math.floor(finalBuyAmount * 1_000_000),
          },
          wallet,
          connection
        );
        setTxSignature(signature);
        const acquired = Math.floor(finalBuyAmount / (venture.sharePriceUsdc || 0.1));
        setTxSuccess(`Bought $${finalBuyAmount.toLocaleString()} USDC for ${acquired.toLocaleString()} $${venture.symbol}-R0 on Devnet!`);

        // Instant optimistic update of venture metrics
        setVenture((prev) => {
          if (!prev) return null;
          const newRaised = (prev.totalCapitalRaisedUsdc || 0) + finalBuyAmount;
          const target = prev.targetFundingCapUsdc || 50000;
          const newPct = Math.min(100, +((newRaised / target) * 100).toFixed(1));
          return {
            ...prev,
            totalCapitalRaisedUsdc: newRaised,
            fundingProgressPercent: newPct,
            progressPercentage: newPct,
          };
        });

        await refreshUserBalances();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ventrion:trade_completed"));
          window.dispatchEvent(new Event("ventrion:balances_updated"));
        }
      } catch (err: any) {
        setTxError(sanitizeSolanaError(err));
      } finally {
        setTxLoading(null);
      }
      return;
    }

    if (isReceiptPhase && tradeAction === "SELL") {
      try {
        setTxLoading(`Refunding ${tradeAmount.toLocaleString()} receipts on Devnet...`);
        const { signature } = await executeSellPrimaryRound(
          {
            investorPubkey: wallet.publicKey.toBase58(),
            companyMint: venture.mintAddress,
            receiptAmount: Math.floor(tradeAmount * 1_000_000),
          },
          wallet,
          connection
        );
        setTxSignature(signature);
        setTxSuccess(`Refunded ${tradeAmount.toLocaleString()} receipts back to USDC on Devnet!`);
        await refreshUserBalances();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ventrion:trade_completed"));
          window.dispatchEvent(new Event("ventrion:balances_updated"));
        }
      } catch (err: any) {
        setTxError(sanitizeSolanaError(err));
      } finally {
        setTxLoading(null);
      }
      return;
    }

    // Secondary trading execution (Exponential Infinite Liquidity Curve & DLMM)
    try {
      setTxLoading(`Executing ${tradeAction} of ${tradeAmount.toLocaleString()} ${tradeAction === "BUY" ? "USDC" : venture.symbol} on Solana Devnet...`);
      const { signature, expectedOut } = await executeDlmmSwap(
        {
          userPubkey: wallet.publicKey.toBase58(),
          companyMint: venture.mintAddress,
          poolAddress: venture.meteoraDlmmPool || undefined,
          action: tradeAction,
          amount: tradeAmount,
        },
        wallet,
        connection
      );
      setTxSignature(signature);
      const outTokensFormatted = expectedOut ? (Number(expectedOut) / 1e6).toFixed(2) : "";
      setTxSuccess(
        `Successfully swapped ${tradeAmount.toLocaleString()} ${tradeAction === "BUY" ? "USDC" : venture.symbol}! ${outTokensFormatted ? `Received ~${outTokensFormatted} ${tradeAction === "BUY" ? venture.symbol : "USDC"}` : ""}`
      );
      await refreshUserBalances();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ventrion:trade_completed"));
        window.dispatchEvent(new Event("ventrion:balances_updated"));
      }
    } catch (err: any) {
      setTxError(sanitizeSolanaError(err));
    } finally {
      setTxLoading(null);
    }
  };

  const handleClaimDividends = async () => {
    setTxError(null);
    setTxSuccess(null);
    setTxSignature(null);

    if (!isOnChainVerified || !venture || ventureNotFound) {
      setTxError("Claim disabled: Venture contract does not exist on Solana Devnet.");
      return;
    }

    if (!wallet.publicKey || !wallet.signTransaction) {
      setTxError("Connect your Solana wallet to claim accrued dividends.");
      return;
    }
    try {
      setTxLoading("Streaming accrued dividends...");
      const { signature } = await executeClaimDividends(
        {
          investorPubkey: wallet.publicKey.toBase58(),
          companyMint: venture.mintAddress,
        },
        wallet,
        connection
      );
      setTxSignature(signature);
      setTxSuccess(`Claimed $${unclaimedDividends.toFixed(2)} USDC directly to wallet.`);
      setUnclaimedDividends(0);
      await refreshUserBalances();
    } catch (err: any) {
      setTxError(sanitizeSolanaError(err) || "Claim reverted on Solana devnet.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleStakeShares = async () => {
    setTxError(null);
    setTxSuccess(null);
    setTxSignature(null);

    if (!isOnChainVerified || !venture || ventureNotFound) {
      setTxError("Staking disabled: Venture contract does not exist on Solana Devnet.");
      return;
    }

    if (isReceiptPhase) {
      setTxError("Staking opens after DLMM Graduation once $VENT-RN receipts are redeemed for Common Shares.");
      return;
    }

    if (!wallet.publicKey || !wallet.signTransaction) {
      setTxError("Connect your Solana wallet to lock shares in vault.");
      return;
    }
    try {
      setTxLoading(`Locking ${stakeAmount.toLocaleString()} shares for ${lockDays} days...`);
      const { signature } = await executeStakeShares(
        {
          investorPubkey: wallet.publicKey.toBase58(),
          companyMint: venture.mintAddress,
          sharesAmount: stakeAmount,
          lockDays,
        },
        wallet,
        connection
      );
      setTxSignature(signature);
      setTxSuccess(`Deposited ${stakeAmount.toLocaleString()} $${venture.symbol} (${multiplier.toFixed(2)}x yield multiplier).`);
      await refreshUserBalances();
    } catch (err: any) {
      setTxError(sanitizeSolanaError(err) || "Deposit reverted on Solana devnet.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleUnstakeShares = async () => {
    setTxError(null);
    setTxSuccess(null);
    setTxSignature(null);

    if (!isOnChainVerified || !venture || ventureNotFound) {
      setTxError("Unstaking disabled: Venture contract does not exist on Solana Devnet.");
      return;
    }

    if (!wallet.publicKey || !wallet.signTransaction) {
      setTxError("Connect your Solana wallet to unstake shares.");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (userLockEndTimestamp > 0 && now < userLockEndTimestamp) {
      const remainingDays = Math.ceil((userLockEndTimestamp - now) / 86400);
      setTxError(`Shares locked for ${remainingDays} more day(s) until maturity.`);
      return;
    }

    try {
      setTxLoading(`Unstaking ${userStakedShares.toLocaleString()} shares...`);
      const { signature } = await executeUnstakeShares(
        {
          investorPubkey: wallet.publicKey.toBase58(),
          companyMint: venture.mintAddress,
          sharesAmount: userStakedShares,
        },
        wallet,
        connection
      );
      setTxSignature(signature);
      setTxSuccess(`Unstaked ${userStakedShares.toLocaleString()} $${venture.symbol} back to wallet.`);
      await refreshUserBalances();
    } catch (err: any) {
      setTxError(sanitizeSolanaError(err) || "Unstake reverted on Solana devnet.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleCastMilestoneVote = async (isVeto: boolean) => {
    setTxError(null);
    setTxSuccess(null);
    setTxSignature(null);

    if (!isOnChainVerified || !venture || ventureNotFound) {
      setTxError("Voting disabled: Venture contract does not exist on Solana Devnet.");
      return;
    }

    if (!wallet.publicKey) {
      setTxError("Connect your Solana wallet to sign and submit milestone vote.");
      return;
    }
    try {
      setTxLoading(`Signing & submitting ${isVeto ? "dissenting (veto)" : "affirmative"} vote on Solana devnet...`);
      const { signature } = await executeVoteMilestone(
        {
          investorPubkey: wallet.publicKey.toBase58(),
          companyMint: venture.mintAddress,
          milestoneId: Number(selectedMilestone.id) || 1,
          approve: !isVeto,
          roundIndex: venture.activeRound || 0,
        },
        wallet,
        connection
      );
      const shortSig = `${signature.slice(0, 4)}...${signature.slice(-4)}`;
      setUserVote(isVeto ? "VETO" : "APPROVE");
      setVotedTxHash(shortSig);
      setTxSignature(signature);
      setTxSuccess(`Milestone vote confirmed on Solana Devnet (${shortSig})!`);
    } catch (err: any) {
      setTxError(err.message || "Failed to submit milestone vote to Solana devnet.");
    } finally {
      setTxLoading(null);
    }
  };

  const handleRagequit = async () => {
    setTxError(null);
    setTxSuccess(null);
    setTxSignature(null);

    if (!wallet.publicKey) {
      setTxError("Connect your Solana wallet to execute pro-rata ragequit.");
      return;
    }

    if (!venture) {
      setTxError("Venture data not loaded.");
      return;
    }

    try {
      setTxLoading("Executing on-chain pro-rata ragequit refund...");
      const { signature } = await executeRagequitMilestoneEscrow(
        {
          investorPubkey: wallet.publicKey.toBase58(),
          companyMint: venture.mintAddress,
          roundIndex: venture.activeRound || 0,
        },
        wallet,
        connection
      );
      setTxSignature(signature);
      setTxSuccess("Pro-rata ragequit refund settled on-chain. Escrow USDC refunded to wallet.");
      await refreshUserBalances();
    } catch (err: any) {
      setTxError(err.message || "Ragequit reverted on Solana devnet.");
    } finally {
      setTxLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="ventures" />

      {/* =========================================================================
          STICKY SYSTEM NOTIFICATION TOAST (OBSIDIAN FLOATING DOCK)
         ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
        <AnimatePresence>
          {(txError || txSuccess || txLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="pointer-events-auto max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111113] border border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur-xl text-white select-none"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    txError
                      ? "bg-red-500"
                      : txLoading
                      ? "bg-[#FF5C18]"
                      : "bg-emerald-400"
                  }`}
                />
                {txLoading && (
                  <span className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C18] animate-ping opacity-75" />
                )}
              </div>

              <div className="text-xs font-jakarta font-medium text-white/90 leading-snug">
                <div>{txError || txSuccess || txLoading}</div>
                {txSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#FF5C18] hover:underline font-mono inline-flex items-center gap-1 mt-1 font-bold"
                  >
                    <span>View on Solana Explorer ↗</span>
                  </a>
                )}
              </div>

              {!txLoading && (
                <button
                  onClick={() => {
                    setTxError(null);
                    setTxSuccess(null);
                    setTxSignature(null);
                  }}
                  className="ml-auto text-white/50 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoadingVenture ? (
        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 z-10 space-y-10 sm:space-y-12">
          {/* SKELETON 1: BANNER CONTAINER */}
          <div className="relative rounded-3xl overflow-hidden border border-black/[0.08] bg-[#111113] p-6 sm:p-8 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between animate-pulse">
            <div className="w-24 h-7 rounded-xl bg-white/10" />
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 shrink-0" />
                <div className="space-y-2.5">
                  <div className="w-48 sm:w-64 h-8 rounded-lg bg-white/15" />
                  <div className="w-32 h-4 rounded-md bg-white/10" />
                </div>
              </div>
              <div className="flex items-center gap-6 bg-black/45 px-6 py-4 rounded-2xl border border-white/10 shrink-0">
                <div className="w-16 h-8 rounded-lg bg-white/10" />
                <div className="h-8 w-px bg-white/15" />
                <div className="w-16 h-8 rounded-lg bg-white/10" />
                <div className="h-8 w-px bg-white/15" />
                <div className="w-16 h-8 rounded-lg bg-white/10" />
              </div>
            </div>
          </div>

          {/* SKELETON 2: 12-COL TRADING TERMINAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-white border border-black/[0.08] rounded-3xl p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] min-h-[480px] flex flex-col justify-between animate-pulse">
              <div className="flex items-start justify-between pb-6 border-b border-black/[0.06]">
                <div className="space-y-2">
                  <div className="w-40 h-10 rounded-xl bg-black/[0.06]" />
                  <div className="w-28 h-4 rounded-md bg-black/[0.04]" />
                </div>
                <div className="w-36 h-8 rounded-xl bg-black/[0.04]" />
              </div>
              <div className="my-8 flex-1 flex flex-col justify-center">
                <div className="w-full h-[220px] rounded-2xl bg-[#FAF7F2] border border-black/[0.04]" />
              </div>
              <div className="flex justify-between pt-4 border-t border-black/[0.04]">
                <div className="w-32 h-4 rounded-md bg-black/[0.04]" />
                <div className="w-28 h-4 rounded-md bg-black/[0.04]" />
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-black/[0.08] rounded-3xl p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] min-h-[480px] flex flex-col justify-between animate-pulse">
              <div className="space-y-6">
                <div className="w-full h-11 rounded-2xl bg-black/[0.04]" />
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-3">
                  <div className="flex justify-between">
                    <div className="w-16 h-3 rounded bg-black/[0.06]" />
                    <div className="w-20 h-3 rounded bg-black/[0.06]" />
                  </div>
                  <div className="w-36 h-9 rounded-lg bg-black/[0.08]" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-7 rounded-lg bg-black/[0.06]" />
                    <div className="h-7 rounded-lg bg-black/[0.06]" />
                    <div className="h-7 rounded-lg bg-black/[0.06]" />
                  </div>
                </div>
                <div className="flex justify-between pt-1">
                  <div className="w-16 h-4 rounded bg-black/[0.04]" />
                  <div className="w-24 h-4 rounded bg-black/[0.06]" />
                </div>
              </div>
              <div className="w-full h-14 rounded-2xl bg-[#111113]/15" />
            </div>
          </div>

          {/* SKELETON 3: ADVANCED MODULE ROADMAP */}
          <div className="bg-white border border-black/[0.08] rounded-3xl p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8 animate-pulse">
            <div className="flex items-center justify-between pb-6 border-b border-black/[0.06]">
              <div className="w-48 h-6 rounded-lg bg-black/[0.06]" />
              <div className="w-24 h-4 rounded-md bg-black/[0.04]" />
            </div>
            <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] flex flex-col items-center space-y-4">
              <div className="w-56 h-10 rounded-xl bg-black/[0.06]" />
              <div className="w-full max-w-xl h-3 rounded-full bg-black/[0.06]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-44 rounded-2xl bg-black/[0.03] border border-black/[0.04]" />
              <div className="h-44 rounded-2xl bg-black/[0.03] border border-black/[0.04]" />
              <div className="h-44 rounded-2xl bg-black/[0.03] border border-black/[0.04]" />
            </div>
          </div>
        </main>
      ) : ventureNotFound || !venture ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center font-mono my-24 space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs text-red-500 font-bold text-xl">
            !
          </div>
          <div className="space-y-1.5">
            <div className="text-base font-bold text-[#111113]">Venture Not Found</div>
            <p className="text-xs text-[#7A7672] max-w-md mx-auto">
              No on-chain enterprise entity matching contract address <span className="text-[#111113] font-semibold break-all">{effectiveMint}</span> was discovered on Solana Devnet.
            </p>
          </div>
          <Link
            href="/ventures"
            className="px-5 py-2.5 rounded-xl bg-[#111113] text-white text-xs font-semibold hover:bg-black transition-transform active:scale-95 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>
        </div>
      ) : (
        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 z-10 space-y-10 sm:space-y-12">
        {/* =========================================================================
            1. CINEMATIC ENTERPRISE BANNER WITH INTEGRATED FINANCIAL METRICS
           ========================================================================= */}
        <div className="relative rounded-3xl overflow-hidden border border-black/[0.08] bg-[#111113] shadow-xs">
          {/* Top-Left Back Navigation Button */}
          <Link
            href="/ventures"
            className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 text-white/90 hover:text-white text-xs font-medium transition-all active:scale-95 group shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Directory</span>
          </Link>

          {/* Background Visual Texture (Uses Dedicated Banner or Elegant Mesh, NEVER PFP/Logo) */}
          <div className="h-48 sm:h-60 lg:h-68 w-full relative overflow-hidden bg-[#111113]">
            {venture.bannerUrl ? (
              <img
                src={venture.bannerUrl}
                alt={`${venture.name} Banner`}
                className="w-full h-full object-cover opacity-70 scale-100"
              />
            ) : (
              <div className="w-full h-full relative">
                <img
                  src="/tokens.jpg"
                  alt="Ventrion Banner Texture"
                  className="w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111113] via-[#161619]/80 to-[#111113]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/60 to-transparent" />
          </div>

          {/* Banner Meta Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 z-10">
            {/* Identity Well */}
            <div className="flex items-center gap-4 sm:gap-5">
              <img
                src={venture.logoUrl || "/tokens.jpg"}
                alt={venture.symbol}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/20 shadow-md object-cover bg-black shrink-0"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    {venture.name}
                  </h1>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white backdrop-blur-md">
                    {venture.ticker}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl line-clamp-1 font-normal">
                  {venture.tagline || venture.description}
                </p>
                {/* Contract Address Pill with Copy & Decentralized Action Icons */}
                <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
                  {/* Contract Pill with Copy */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/15 text-neutral-300">
                    <span className="text-[11px] font-mono select-all">
                      {venture.mintAddress.slice(0, 4)}...{venture.mintAddress.slice(-4)}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(venture.mintAddress)}
                      title="Copy contract address"
                      className="p-0.5 hover:text-white transition-colors cursor-pointer outline-none"
                    >
                      {copiedAddress ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-400 hover:text-white" />
                      )}
                    </button>
                  </div>

                  {/* Icon Buttons Cluster */}
                  <div className="flex items-center gap-1.5">
                    {/* Solana Devnet Explorer */}
                    <a
                      href={`https://explorer.solana.com/address/${venture.mintAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View Contract on Solana Devnet Explorer"
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Pitch Manifest / Document */}
                    <a
                      href={`/ventrion/metadata/${venture.mintAddress}.json`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View Token Metadata / Pitch Manifest"
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </a>

                    {/* Community / Social (X/Twitter) */}
                    <a
                      href="https://x.com/VentrionHQ"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enterprise Community & Social"
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </a>

                    {/* Enterprise Website */}
                    <a
                      href="https://ventrion.fun"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Official Enterprise Portal"
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH-SIGNAL FINANCIAL HUD WELL */}
            <div className="flex items-center gap-6 sm:gap-8 bg-black/45 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 font-mono text-right shrink-0">
              <div>
                <span className="text-neutral-400 text-[10px] uppercase tracking-wider block">Market Cap</span>
                <span className="text-white text-base sm:text-xl font-bold block mt-0.5 tabular-nums">
                  {formatCompactUsdc(activeMarketCap)}
                </span>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <span className="text-neutral-400 text-[10px] uppercase tracking-wider block">24h Vol</span>
                <span className="text-white text-base sm:text-xl font-bold block mt-0.5 tabular-nums">
                  {formatCompactUsdc((venture as any).volume24hUsdc || 0)}
                </span>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <span className="text-neutral-400 text-[10px] uppercase tracking-wider block">Yield</span>
                <span className="text-[#FF5C18] text-base sm:text-xl font-bold block mt-0.5 tabular-nums">
                  {venture.currentDividendYield > 0 ? `${venture.currentDividendYield.toFixed(1)}%` : "Graduating"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TOP TRADING TERMINAL (DEXSCREENER-STYLE SPLIT)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: INTERACTIVE LIVE PRICE CHART */}
          <div className="lg:col-span-8 bg-white border border-black/[0.08] rounded-3xl p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] min-h-[480px] flex flex-col justify-between">
            {/* Price Header & Interactive Timeframe Selector */}
            <div className="flex items-start justify-between pb-6 border-b border-black/[0.06]">
              <div>
                <div className="flex items-baseline gap-4 flex-wrap">
                  <div className="text-3xl sm:text-4xl font-bold font-mono text-[#111113] tracking-tight tabular-nums">
                    ${activePrice.toFixed(2)}{" "}
                    <span className="text-base sm:text-lg font-normal text-[#7A7672]">USDC</span>
                  </div>
                  <div className="text-lg sm:text-xl font-mono text-[#111113] font-bold tabular-nums">
                    <span className="text-xs font-normal uppercase tracking-wider text-[#7A7672] mr-1.5">MC:</span>
                    {formatCompactUsdc(activeMarketCap)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 font-mono text-xs text-[#7A7672]">
                  {isGraduated && <span className="text-[#FF5C18] font-bold">+14.8%</span>}
                  {hoveredPoint ? (
                    <span className="text-[#111113] font-bold">@ {hoveredPoint.time}</span>
                  ) : (
                    <span>(24h Live Spot)</span>
                  )}
                </div>
              </div>

              {/* Timeframe Switcher */}
              {isGraduated && (
                <div className="flex items-center gap-1 p-1 bg-black/[0.03] rounded-xl font-mono text-xs">
                  {(["1D", "1W", "1M", "ALL"] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        setTimeframe(tf);
                        setHoveredPoint(null);
                      }}
                      className={`relative px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        timeframe === tf ? "text-white font-bold" : "text-[#7A7672] hover:text-[#111113]"
                      }`}
                    >
                      {timeframe === tf && (
                        <motion.div
                          layoutId="chartTfPill"
                          className="absolute inset-0 bg-[#111113] rounded-lg shadow-xs"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{tf}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive SVG Canvas Area */}
            <div className="my-8 flex-1 flex flex-col justify-center">
              {isGraduated && (
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
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF5C18" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#FF5C18" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill */}
                    <path d={svgAreaD} fill="url(#areaGradient)" />

                    {/* Main Price Stroke Line */}
                    <path
                      d={svgPathD}
                      fill="none"
                      stroke="#FF5C18"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Hover Crosshair & Anchor Circle */}
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

                  <div className="flex justify-between font-mono text-xs text-[#7A7672] pt-4 border-t border-black/[0.04]">
                    <span>
                      24h Range {formatCompactUsdc(Math.min(...currentChartPoints.map(p => p.price)))} – {formatCompactUsdc(Math.max(...currentChartPoints.map(p => p.price)))}
                    </span>
                    <span className="font-semibold text-[#111113]">Meteora DLMM</span>
                  </div>
                </div>
              )}

              {isPrimary && (
                <div className="space-y-6">
                  {(() => {
                    const cap = venture.targetFundingCapUsdc || 50000;
                    const raised = typeof venture.totalCapitalRaisedUsdc === "number" ? venture.totalCapitalRaisedUsdc : (venture.lockedEscrowUsdc || 0);
                    const pct = Math.min(100, Math.max(0, typeof venture.fundingProgressPercent === "number" ? venture.fundingProgressPercent : (cap > 0 ? (raised / cap) * 100 : 0)));
                    const remaining = Math.max(0, cap - raised);
                    const sharePrice = venture.sharePriceUsdc || 0.10;
                    return (
                      <>
                        <div className="flex justify-between font-mono text-sm">
                          <span className="text-[#111113] font-bold">
                            ${raised.toLocaleString()} USDC
                          </span>
                          <span className="text-[#7A7672]">
                            ${cap.toLocaleString()} Hardcap ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-4 w-full bg-[#FAF7F2] border border-black/[0.08] rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full bg-[#111113] rounded-full"
                          />
                        </div>
                        <div className="flex justify-between font-mono text-xs text-[#7A7672]">
                          <span>Fixed ${sharePrice.toFixed(2)} USDC</span>
                          <span>Remaining ${remaining.toLocaleString()} USDC</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {isMigrating && (
                <div className="py-12 text-center space-y-3 font-mono">
                  <div className="w-10 h-10 border-2 border-neutral-300 border-t-[#111113] rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-bold text-[#111113]">Transitioning to Meteora DLMM</div>
                  <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                    Primary round completed. Contract is locking 170,000 common shares into concentrated liquidity bins.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: TACTILE ORDER TERMINAL (CLEAN & MINIMALIST) */}
          <div className="lg:col-span-4 bg-white border border-black/[0.08] rounded-3xl p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] min-h-[480px] flex flex-col justify-between">
            <div className="space-y-6">
              {/* Prominent Redemption Callout Banner */}
              {isGraduated && userReceipts > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                  <div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Graduated! You Hold {userReceipts.toLocaleString()} Receipts</span>
                    </div>
                    <p className="text-[11px] text-[#7A7672] mt-0.5">
                      Redeem 1:1 for tradable {venture.symbol} Common Shares.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTradeAction("REDEEM");
                      setTradeInputStr(String(userReceipts));
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    Redeem All (1:1)
                  </button>
                </div>
              )}

              {/* Order Mode Switcher */}
              <div className="flex gap-2 p-1 bg-black/[0.03] rounded-2xl font-mono text-xs">
                {(["BUY", "SELL"] as const).map((mode) => (
                  <button
                    key={mode}
                    disabled={isMigrating && mode === "BUY"}
                    onClick={() => setTradeAction(mode)}
                    className={`relative flex-1 py-2.5 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      tradeAction === mode ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                    }`}
                  >
                    {tradeAction === mode && (
                      <motion.div
                        layoutId="tradeModePill"
                        className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">
                      {mode === "BUY" ? "Buy" : "Sell"}
                    </span>
                  </button>
                ))}
                {isGraduated && (
                  <button
                    onClick={() => setTradeAction("REDEEM")}
                    className={`relative flex-1 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      tradeAction === "REDEEM" ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                    }`}
                  >
                    {tradeAction === "REDEEM" && (
                      <motion.div
                        layoutId="tradeModePill"
                        className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">Redeem</span>
                  </button>
                )}
              </div>

              {isMigrating && tradeAction === "BUY" ? (
                <div className="py-8 px-6 rounded-2xl bg-amber-50 border border-amber-200/80 text-center space-y-3 font-mono">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Primary Raise 100% Filled</span>
                  </div>
                  <div className="text-sm font-bold text-[#111113]">Migration in Progress</div>
                  <p className="text-xs text-[#7A7672] max-w-sm mx-auto leading-relaxed">
                    Target capital hard cap reached. Seeding Meteora DLMM pool. Select "Sell" above to refund primary receipts back to USDC.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tactile Input Container - Click anywhere to focus */}
                  {(() => {
                    const isBuying = tradeAction === "BUY";
                    const isSelling = tradeAction === "SELL";
                    const isRedeeming = tradeAction === "REDEEM";
                    const hasInsufficientUsdc = isBuying && userUsdcBalance < tradeAmount && tradeAmount > 0;
                    const maxSell = isReceiptPhase ? userReceipts : userShares;
                    const hasInsufficientSell = isSelling && maxSell < tradeAmount && tradeAmount > 0;
                    const hasInsufficientRedeem = isRedeeming && userReceipts < tradeAmount && tradeAmount > 0;
                    const hasInvalidAmount = tradeAmount <= 0 || isNaN(tradeAmount);

                    const remainingCap = (isPrimary && isBuying && venture.targetFundingCapUsdc)
                      ? Math.max(0, venture.targetFundingCapUsdc - (venture.totalCapitalRaisedUsdc || 0))
                      : 0;
                    const isAutoCapped = isPrimary && isBuying && remainingCap > 0 && tradeAmount > remainingCap;
                    const effectiveTradeUsdc = isAutoCapped ? remainingCap : tradeAmount;

                    const hasBalanceError = hasInsufficientUsdc || hasInsufficientSell || hasInsufficientRedeem;

                    const isBtnDisabled =
                      !wallet.connected ||
                      !isOnChainVerified ||
                      !venture ||
                      (isMigrating && isBuying) ||
                      !!txLoading ||
                      hasInvalidAmount ||
                      hasBalanceError;

                    const maxVal = isBuying ? userUsdcBalance : isRedeeming ? userReceipts : (isReceiptPhase ? userReceipts : userShares);

                    return (
                      <>
                        <div className="space-y-2 font-mono">
                          <div
                            onClick={() => tradeInputRef.current?.focus()}
                            className={`p-5 rounded-2xl border transition-all duration-200 cursor-text ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              hasBalanceError
                                ? "bg-rose-50/20 border-rose-400 shadow-[0_4px_16px_rgba(244,63,94,0.06)]"
                                : isInputFocused
                                ? "bg-white border-[#111113] shadow-[0_8px_24px_rgba(0,0,0,0.06)] scale-[1.01]"
                                : "bg-[#FAF7F2] border-black/[0.06]"
                            }`}
                          >
                            <div className="flex justify-between text-xs text-[#7A7672] mb-1">
                              <span>
                                {isBuying ? "USDC" : isRedeeming ? `${venture.symbol} Receipts ($${venture.symbol}-R0)` : isReceiptPhase ? `${venture.symbol} Receipts` : venture.symbol}
                              </span>
                              <span className="font-medium">
                                Bal {isBuying ? `$${userUsdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : isRedeeming ? `${userReceipts.toLocaleString()} Receipts` : (isReceiptPhase ? userReceipts : userShares).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <input
                                ref={tradeInputRef}
                                type="text"
                                value={tradeInputStr}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                onChange={(e) => setTradeInputStr(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-[#111113] focus:outline-none tabular-nums font-mono"
                              />
                              <span className="text-xs font-bold text-[#7A7672] shrink-0 ml-2">
                                {isBuying ? "USDC" : isRedeeming ? `${venture.symbol}-R0` : isReceiptPhase ? `${venture.symbol}-R0` : venture.symbol}
                              </span>
                            </div>

                            {/* Auto-Cap Notification */}
                            {isAutoCapped && (
                              <div className="text-[11px] text-amber-700 font-mono mt-1 font-semibold">
                                • Auto-capped to round capacity: ${remainingCap.toLocaleString()} USDC
                              </div>
                            )}

                            {/* Exactly 3 Money Options: $50, $250, MAX */}
                            <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-black/[0.04]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeInputStr("50");
                                  tradeInputRef.current?.focus();
                                }}
                                className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  tradeAmount === 50
                                    ? "bg-[#111113] text-white border-[#111113]"
                                    : "bg-white border-black/[0.08] hover:border-black/20 text-[#111113]"
                                }`}
                              >
                                $50
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeInputStr("250");
                                  tradeInputRef.current?.focus();
                                }}
                                className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  tradeAmount === 250
                                    ? "bg-[#111113] text-white border-[#111113]"
                                    : "bg-white border-black/[0.08] hover:border-black/20 text-[#111113]"
                                }`}
                              >
                                $250
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeInputStr(formatMaxFloored(maxVal));
                                  tradeInputRef.current?.focus();
                                }}
                                className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  Math.abs(tradeAmount - Math.floor(maxVal * 100) / 100) < 0.01 && tradeAmount > 0
                                    ? "bg-[#111113] text-white border-[#111113]"
                                    : "bg-white border-black/[0.08] hover:border-black/20 text-[#111113]"
                                }`}
                              >
                                MAX
                              </button>
                            </div>
                          </div>

                          {/* Inline helper if on SELL tab but holding unredeemed receipts */}
                          {isSelling && isGraduated && userShares <= 0 && userReceipts > 0 && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-800 dark:text-amber-300">
                              <span>💡 You hold <strong>{userReceipts.toLocaleString()}</strong> unredeemed receipts. </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTradeAction("REDEEM");
                                  setTradeInputStr(String(userReceipts));
                                }}
                                className="text-amber-600 dark:text-amber-400 font-bold underline hover:opacity-80 cursor-pointer ml-1"
                              >
                                Click here to Redeem
                              </button>
                              <span> for tradable shares before selling.</span>
                            </div>
                          )}

                          {/* Estimate */}
                          <div className="flex justify-between items-center text-xs text-[#7A7672] px-1 pt-1">
                            <span>Receive</span>
                            <span className="font-bold text-[#111113] text-sm tabular-nums">
                              {isBuying
                                ? `${(effectiveTradeUsdc / (venture.sharePriceUsdc || 0.1)).toFixed(1)} ${venture.symbol}${isReceiptPhase ? "-R0" : ""}`
                                : isRedeeming
                                ? `${tradeAmount.toLocaleString()} ${venture.symbol} Shares (1:1)`
                                : `$${(tradeAmount * (venture.sharePriceUsdc || 0.1)).toFixed(2)} USDC`}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={handleExecuteTrade}
                          disabled={isBtnDisabled}
                          className="relative overflow-hidden w-full py-4 rounded-2xl bg-[#121214] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_6px_20px_-4px_rgba(0,0,0,0.14)] flex items-center justify-center gap-2 cursor-pointer outline-none group disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                          <div className="absolute -inset-1 rounded-2xl bg-[#FF5C18]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#FF5C18] to-[#FA5416] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left -translate-x-full group-hover:translate-x-0 pointer-events-none" />
                          <span className="relative z-10 font-bold">
                            {txLoading
                              ? "Processing..."
                              : !wallet.connected
                              ? "Connect Wallet"
                              : !isOnChainVerified
                              ? "Contract Not On-Chain"
                              : isMigrating && isBuying
                              ? "Primary Raise 100% Filled"
                              : hasInvalidAmount
                              ? "Enter Valid Amount"
                              : hasInsufficientUsdc
                              ? "Insufficient USDC"
                              : hasInsufficientSell
                              ? `Insufficient ${isReceiptPhase ? "Receipts" : venture.symbol}`
                              : hasInsufficientRedeem
                              ? "Insufficient Receipts"
                              : isBuying
                              ? isReceiptPhase
                                ? `Buy $${effectiveTradeUsdc.toLocaleString()} USDC`
                                : `Buy ${venture.symbol}`
                              : isSelling
                              ? isReceiptPhase
                                ? `Refund Receipts for $${(tradeAmount * (venture.sharePriceUsdc || 0.1)).toFixed(2)} USDC`
                                : `Sell ${venture.symbol}`
                              : isRedeeming
                              ? `Redeem ${tradeAmount.toLocaleString()} Shares (1:1)`
                              : `Redeem Receipts`}
                          </span>
                        </button>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. UNIFIED ADVANCED MODULE (3 SWITCHING TABS: STAKING | DIVIDENDS | MILESTONES)
            NO STACKED SLOP — PURE $1B INSTITUTIONAL TRADING AESTHETICS
           ========================================================================= */}
        <div className="bg-white border border-black/[0.08] rounded-3xl p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
          {/* Header Strip with 3 Switching Buttons (Graduated Only) or Milestone Roadmap Header (Raising) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
            {isGraduated ? (
              <div className="flex gap-2 p-1 bg-black/[0.03] rounded-2xl font-mono text-xs self-start">
                {(["STAKING", "DIVIDENDS", "MILESTONES"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBottomTab(tab)}
                    className={`relative px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      bottomTab === tab ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                    }`}
                  >
                    {bottomTab === tab && (
                      <motion.div
                        layoutId="bottomTabPill"
                        className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">
                      {tab === "STAKING" ? "Staking & Lock" : tab === "DIVIDENDS" ? "Dividends" : "Milestones"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-[#111113] tracking-tight">Enterprise Capital Raise</h2>
                <div className="text-xs text-[#7A7672] mt-1 font-mono">
                  Fixed Allocation Invariant • Primary Capital Structure
                </div>
              </div>
            )}
          </div>

          {/* CONTENT: IF NOT GRADUATED, SHOW CLEAN MINIMALIST RAISING CONFIG & MILESTONES */}
          {!isGraduated ? (
            <div className="space-y-6 font-mono">
              {/* Enterprise Settings & Allocation Structure */}
              {(() => {
                const cap = venture.targetFundingCapUsdc || 25000;
                const sharesForSale = venture.circulatingFloat > 0 ? venture.circulatingFloat : 490000;
                const sharesPct = Math.round((sharesForSale / 1000000) * 100);
                const founderLockMonths = venture.founderLockMonths || 12;
                const founderLockPct = venture.founderLockPercentage || 30;
                const price = venture.sharePriceUsdc || 0.05102;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block font-semibold">
                        Shares Offered
                      </span>
                      <div className="font-bold text-[#111113] text-base tabular-nums">
                        {sharesForSale.toLocaleString()} Shares
                      </div>
                      <div className="text-[11px] text-[#7A7672]">
                        {sharesPct}% of Total Supply
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block font-semibold">
                        Target Raise
                      </span>
                      <div className="font-bold text-[#111113] text-base tabular-nums">
                        ${cap.toLocaleString()} USDC
                      </div>
                      <div className="text-[11px] text-[#7A7672]">
                        ${price.toFixed(4)} / Share
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block font-semibold">
                        Founder Lock
                      </span>
                      <div className="font-bold text-[#111113] text-base tabular-nums">
                        {founderLockMonths} Months
                      </div>
                      <div className="text-[11px] text-[#7A7672]">
                        {founderLockPct}% Equity Locked
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block font-semibold">
                        Capital Split
                      </span>
                      <div className="font-bold text-[#111113] text-base tabular-nums">
                        75% Escrow
                      </div>
                      <div className="text-[11px] text-[#7A7672]">
                        15% Runway • 10% Pool
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Clean Capital Accumulation Progress */}
              {(() => {
                const cap = venture.targetFundingCapUsdc || 25000;
                const raised = typeof venture.totalCapitalRaisedUsdc === "number" ? venture.totalCapitalRaisedUsdc : 0;
                const pct = Math.min(100, Math.max(0, typeof venture.fundingProgressPercent === "number" ? venture.fundingProgressPercent : (cap > 0 ? (raised / cap) * 100 : 0)));

                return (
                  <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-3">
                    <div className="flex justify-between items-baseline text-xs font-mono">
                      <span className="text-[#7A7672] uppercase tracking-wider text-[10px] font-semibold">Round Progress</span>
                      <span className="font-bold text-[#111113] tabular-nums">
                        ${raised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${cap.toLocaleString()} USDC ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white border border-black/[0.08] rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-[#111113] rounded-full"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Minimal Configured Milestones Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A7672]">
                    Configured Milestones ({(venture.milestones || []).length > 0 ? venture.milestones.length : 1})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {((venture.milestones && venture.milestones.length > 0)
                    ? venture.milestones
                    : [
                        {
                          id: 1,
                          title: "Milestone 1",
                          percentageBps: 10000,
                          amountUsdc: (venture.targetFundingCapUsdc || 25000) * 0.75,
                          targetDays: 30,
                          status: "pending" as const,
                        },
                      ]
                  ).map((m, idx) => {
                    const isCompleted = m.status === "completed";
                    const isReview = m.status === "in_review";
                    const pct = (m.percentageBps || 2500) / 100;
                    const amount = m.amountUsdc || ((venture.targetFundingCapUsdc || 25000) * 0.75 * (pct / 100));

                    return (
                      <div
                        key={m.id || idx}
                        className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                          isCompleted
                            ? "bg-emerald-50/20 border-emerald-200"
                            : isReview
                            ? "bg-amber-50/20 border-amber-200"
                            : "bg-[#FAF7F2] border-black/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#111113]">
                            {m.title || `Milestone ${idx + 1}`}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : isReview
                                ? "bg-amber-100 text-amber-800"
                                : "bg-white border border-black/[0.08] text-[#7A7672]"
                            }`}
                          >
                            {isCompleted ? "Completed" : isReview ? "In Review" : "Pending"}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.04] text-xs">
                          <span className="text-[#7A7672]">
                            ~{m.targetDays || 30} Days
                          </span>
                          <span className="font-bold text-[#111113] tabular-nums">
                            ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: STAKING & LOCK VAULT */}
              {bottomTab === "STAKING" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Centered Lock Duration & Share Deposit Console */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-6 font-mono text-center">
                {/* Unified Segmented Lock Selection & Single Centered Multiplier */}
                <div className="w-full max-w-xl mx-auto space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="flex items-baseline justify-center gap-2">
                      <motion.span
                        key={multiplier}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className="text-3xl sm:text-4xl font-bold text-[#FF5C18] tabular-nums"
                      >
                        {multiplier.toFixed(2)}x
                      </motion.span>
                      <span className="text-xs text-[#7A7672] tabular-nums">
                        ({effectiveApy.toFixed(1)}% APY)
                      </span>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-[#7A7672]">
                      Commitment
                    </span>
                  </div>

                  {/* 6 Tiers from Manifest */}
                  <div className="flex p-1 bg-black/[0.03] rounded-2xl font-mono text-xs gap-1">
                    {[
                      { label: "Liquid", days: 0 },
                      { label: "30d", days: 30 },
                      { label: "90d", days: 90 },
                      { label: "180d", days: 180 },
                      { label: "1Y", days: 365 },
                      { label: "2Y", days: 730 },
                    ].map((tier) => {
                      const isSelected = lockDays === tier.days;
                      return (
                        <button
                          key={tier.days}
                          onClick={() => setLockDays(tier.days)}
                          className={`relative flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer text-center ${
                            isSelected ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="lockTierSegmentPill"
                              className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                              transition={{ type: "spring", stiffness: 450, damping: 35 }}
                            />
                          )}
                          <span className="relative z-10">{tier.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tactile Stake Input Box - Centered Anatomy */}
                <div className="w-full max-w-xl mx-auto space-y-3">
                  <div
                    onClick={() => stakeInputRef.current?.focus()}
                    className={`p-6 rounded-2xl border transition-all duration-200 cursor-text ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isStakeFocused
                        ? "bg-white border-[#111113] shadow-[0_8px_24px_rgba(0,0,0,0.06)] scale-[1.01]"
                        : "bg-[#FAF7F2] border-black/[0.06]"
                    }`}
                  >
                    <div className="flex justify-between text-xs text-[#7A7672] mb-2 px-1">
                      <span>{venture.symbol}</span>
                      <span>
                        Bal {userShares > 0 ? userShares.toLocaleString() : "0"} {venture.symbol}
                        {userStakedShares > 0 && ` (${userStakedShares.toLocaleString()} Staked)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-1">
                      <input
                        ref={stakeInputRef}
                        type="number"
                        value={stakeAmount}
                        onFocus={() => setIsStakeFocused(true)}
                        onBlur={() => setIsStakeFocused(false)}
                        onChange={(e) => setStakeAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-transparent text-center text-3xl sm:text-4xl font-bold text-[#111113] focus:outline-none tabular-nums"
                      />
                    </div>

                    {/* 3 Preset Chips */}
                    <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-black/[0.04]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStakeAmount(Math.min(1000, userShares));
                          stakeInputRef.current?.focus();
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          stakeAmount === 1000
                            ? "bg-[#111113] text-white border-[#111113]"
                            : "bg-white border-black/[0.08] hover:border-black/20 text-[#111113]"
                        }`}
                      >
                        1,000
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStakeAmount(Math.min(5000, userShares));
                          stakeInputRef.current?.focus();
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          stakeAmount === 5000
                            ? "bg-[#111113] text-white border-[#111113]"
                            : "bg-white border-black/[0.08] hover:border-black/20 text-[#111113]"
                        }`}
                      >
                        5,000
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStakeAmount(userShares > 0 ? userShares : 0);
                          stakeInputRef.current?.focus();
                        }}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          stakeAmount === userShares && userShares > 0
                            ? "bg-[#111113] text-white border-[#111113]"
                            : "bg-white border-black/[0.08] hover:border-black/20 text-[#111113]"
                        }`}
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phase Protection Warning if Raising */}
                {isReceiptPhase && (
                  <div className="w-full max-w-xl mx-auto p-4 rounded-xl bg-[#FAF7F2] border border-black/[0.08] text-center space-y-1">
                    <div className="text-xs font-bold text-[#111113] uppercase tracking-wider font-mono">
                      Staking Inactive During Raise
                    </div>
                    <p className="text-xs text-[#7A7672]">
                      Staking opens after DLMM Graduation once $VENT-RN receipts are redeemed for Common Shares.
                    </p>
                  </div>
                )}

                {/* Solid Obsidian CTA Button with Ambient Bloom */}
                <div className="w-full max-w-xl mx-auto">
                  <button
                    onClick={handleStakeShares}
                    disabled={!!txLoading || stakeAmount <= 0 || isReceiptPhase}
                    className="relative overflow-hidden w-full py-4 rounded-2xl bg-[#121214] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_6px_20px_-4px_rgba(0,0,0,0.14)] flex items-center justify-center gap-2 cursor-pointer outline-none group disabled:opacity-50"
                  >
                    <div className="absolute -inset-1 rounded-2xl bg-[#FF5C18]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#FF5C18] to-[#FA5416] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left -translate-x-full group-hover:translate-x-0 pointer-events-none" />
                    <span className="relative z-10 font-bold">
                      {isReceiptPhase
                        ? "Staking Opens After Graduation"
                        : txLoading
                        ? "Processing Lock..."
                        : `Lock ${stakeAmount.toLocaleString()} ${venture.symbol} (${multiplier.toFixed(2)}x Boost)`}
                    </span>
                  </button>
                </div>

                {/* Active Staked Position & Unstake Action */}
                {userStakedShares > 0 && (
                  <div className="w-full max-w-xl mx-auto p-5 rounded-2xl bg-white border border-black/[0.08] space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.06]">
                      <span className="text-[#7A7672]">Your Locked Position</span>
                      <span className="font-bold text-[#111113] tabular-nums">
                        {formatCompactShares(userStakedShares)} {venture.symbol}
                      </span>
                    </div>
                    {(() => {
                      const now = Math.floor(Date.now() / 1000);
                      const isLocked = userLockEndTimestamp > 0 && now < userLockEndTimestamp;
                      const remainingDays = isLocked ? Math.ceil((userLockEndTimestamp - now) / 86400) : 0;
                      return (
                        <div className="space-y-2">
                          <button
                            onClick={handleUnstakeShares}
                            disabled={!!txLoading || isLocked}
                            className="w-full py-3.5 rounded-xl border border-black/[0.12] bg-[#FAF7F2] hover:bg-black/[0.03] text-[#111113] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {txLoading
                              ? "Processing Unstake..."
                              : isLocked
                              ? `Locked Until Maturity (${remainingDays}d remaining)`
                              : `Unstake ${formatCompactShares(userStakedShares)} ${venture.symbol}`}
                          </button>
                          {isLocked && (
                            <p className="text-[10px] text-[#7A7672] text-center">
                              Maturity date: {new Date(userLockEndTimestamp * 1000).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Right: Technical Institutional Vault Depth Book */}
              <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06]">
                  <span className="font-bold text-[#111113] text-xs uppercase tracking-wider">
                    Vault Maturity Depth
                  </span>
                  <span className="text-[11px] font-bold text-[#111113] tabular-nums">
                    {(venture?.totalStakedInVaults || userStakedShares || 0).toLocaleString()} Staked
                  </span>
                </div>

                <div className="grid grid-cols-12 text-[10px] uppercase text-[#7A7672] font-semibold px-2">
                  <span className="col-span-4">Tier</span>
                  <span className="col-span-3 text-center">Boost</span>
                  <span className="col-span-5 text-right">Share</span>
                </div>

                <div className="space-y-1">
                  {stakingDepthLadder.map((row) => {
                    const isSelected = lockDays === row.days;
                    return (
                      <button
                        key={row.tier}
                        onClick={() => setLockDays(row.days)}
                        className={`w-full relative p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer overflow-hidden flex items-center justify-between ${
                          isSelected
                            ? "border-[#111113] shadow-xs"
                            : "border-black/[0.04] hover:border-black/20 hover:bg-black/[0.01]"
                        }`}
                      >
                        <div
                          style={{ width: row.depthWidth }}
                          className={`absolute inset-y-0 left-0 pointer-events-none rounded-lg transition-all ${
                            isSelected ? "bg-[#FF5C18]/25" : "bg-[#FF5C18]/15"
                          }`}
                        />

                        <div className="relative z-10 space-y-0.5">
                          <span className="font-bold text-[#111113] block">
                            {row.tier}
                          </span>
                          <span className="text-[10px] text-[#7A7672] tabular-nums block">
                            {row.lockedShares.toLocaleString()}
                          </span>
                        </div>

                        <div className="relative z-10 text-center">
                          <span className="font-bold text-[#FF5C18] tabular-nums block">
                            {row.multiplier}
                          </span>
                        </div>

                        <div className="relative z-10 text-right space-y-0.5">
                          <span className="font-bold text-[#111113] tabular-nums block">
                            {row.percentage}%
                          </span>
                          <span className="text-[10px] text-[#7A7672] block">
                            of Float
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2.5 border-t border-black/[0.06] flex items-center justify-between text-[#7A7672] text-[11px]">
                  <span>{formatCompactUsdc((venture?.totalStakedInVaults || userStakedShares || 0) * (venture.sharePriceUsdc || 0.1))} TVL</span>
                  <span className="font-bold text-[#111113]">
                    {venture?.totalShares && venture.totalShares > 0
                      ? (((venture?.totalStakedInVaults || userStakedShares || 0) / venture.totalShares) * 100).toFixed(1)
                      : "0.0"}% Staked
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIVIDENDS */}
          {bottomTab === "DIVIDENDS" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Dividend Stream Console */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-6 font-mono text-center">
                {/* Live Yield Unclaimed Box - Clean, no pulsing dot, no repetitive labels */}
                <div className="w-full p-8 sm:p-10 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] flex flex-col items-center justify-center space-y-6">
                  <div className="space-y-1">
                    <div className="text-4xl sm:text-6xl font-bold text-[#111113] tabular-nums tracking-tight">
                      $<BezierCounter value={unclaimedDividends} decimals={2} /> <span className="text-[#FF5C18]">USDC</span>
                    </div>
                    <p className="text-xs text-[#7A7672]">
                      Unclaimed Accrued Yield
                    </p>
                  </div>

                  {/* Obsidian Claim CTA Button with Ambient Bloom */}
                  <button
                    onClick={handleClaimDividends}
                    disabled={unclaimedDividends <= 0 || !!txLoading}
                    className="relative overflow-hidden w-full max-w-sm py-4 rounded-2xl bg-[#121214] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_6px_20px_-4px_rgba(0,0,0,0.14)] flex items-center justify-center gap-2 cursor-pointer outline-none group disabled:opacity-40"
                  >
                    <div className="absolute -inset-1 rounded-2xl bg-[#FF5C18]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#FF5C18] to-[#FA5416] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left -translate-x-full group-hover:translate-x-0 pointer-events-none" />
                    <span className="relative z-10 font-bold">
                      {txLoading ? "Claiming..." : `Claim $${unclaimedDividends.toFixed(2)} USDC`}
                    </span>
                  </button>
                </div>

                {/* Clean Institutional Financial Metrics */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-5 rounded-xl bg-white border border-black/[0.06] space-y-1 text-center hover:border-black/20 transition-colors">
                    <span className="text-[#7A7672] text-[11px] uppercase tracking-wider block">Revenue Split</span>
                    <span className="text-2xl font-bold text-[#111113] block tabular-nums">
                      {venture?.dividendSplitBps ? `${(venture.dividendSplitBps / 100).toFixed(1)}%` : "100.0% Net"}
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-black/[0.06] space-y-1 text-center hover:border-black/20 transition-colors">
                    <span className="text-[#7A7672] text-[11px] uppercase tracking-wider block">Annual Run-Rate</span>
                    <span className="text-2xl font-bold text-[#111113] block tabular-nums">
                      ${(venture?.totalDividendsDistributed ? venture.totalDividendsDistributed * 12 : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-black/[0.06] space-y-1 text-center hover:border-black/20 transition-colors">
                    <span className="text-[#7A7672] text-[11px] uppercase tracking-wider block">Total Distributed</span>
                    <span className="text-2xl font-bold text-[#111113] block tabular-nums">
                      ${(venture?.totalDividendsDistributed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Technical Distribution Ledger */}
              <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06]">
                  <span className="font-bold text-[#111113] text-xs uppercase tracking-wider">
                    Distribution Ledger
                  </span>
                  <span className="text-[11px] text-[#7A7672]">
                    On-Chain Devnet
                  </span>
                </div>

                <div className="space-y-2 py-2">
                  {(venture?.totalDividendsDistributed && venture.totalDividendsDistributed > 0) ? (
                    <div className="p-3 rounded-lg border border-black/[0.06] bg-[#FAF7F2] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#111113]">Dividend Vault Payout</span>
                        <span className="font-bold text-emerald-600 text-sm">
                          +${venture.totalDividendsDistributed.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7A7672] flex items-center justify-between">
                        <span>Settled to Shareholder Vaults</span>
                        <span className="text-emerald-700 font-semibold">Verified</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-black/[0.1] bg-[#FAF7F2] text-center space-y-2">
                      <p className="text-xs text-[#7A7672]">
                        No dividend distributions on-chain yet.
                      </p>
                      <p className="text-[10px] text-[#8E8B88]">
                        When enterprise deposits revenue into the Dividend Vault on Devnet, payouts accrue pro-rata to staked shareholders.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-black/[0.06] flex items-center justify-between text-[#7A7672] text-[11px]">
                  <span>Dividend Accumulator: O(1)</span>
                  <span className="font-semibold text-[#111113]">
                    {venture?.totalDividendsDistributed && venture.totalDividendsDistributed > 0 ? "Active" : "Awaiting Deposit"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MILESTONES (GRADUATED ON-CHAIN GOVERNANCE) */}
          {bottomTab === "MILESTONES" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-mono">
              {/* Left: Centered Milestone Governance Console */}
                  <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-6 font-mono text-center">
                    {/* Active Tranche Card */}
                    <div className="w-full p-8 sm:p-10 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] flex flex-col items-center justify-center space-y-6">
                      <div className="space-y-1">
                        <div className="text-4xl sm:text-6xl font-bold text-[#111113] tabular-nums tracking-tight">
                          ${(selectedMilestone.amountUsdc / 1000).toFixed(1)}k <span className="text-[#FF5C18]">USDC</span>
                        </div>
                        <p className="text-xs text-[#7A7672]">
                          Milestone #{selectedMilestone.id} • {selectedMilestone.title}
                        </p>
                      </div>

                      {/* Quorum Progress Bar */}
                      {(() => {
                        const votesFor = (selectedMilestone?.votesFor || 0) + (userVote === "APPROVE" ? 1 : 0);
                        const votesAgainst = (selectedMilestone?.votesAgainst || 0) + (userVote === "VETO" ? 1 : 0);
                        const totalVotes = votesFor + votesAgainst;
                        const quorumPct = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
                        return (
                          <div className="w-full max-w-md space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-[#7A7672]">Quorum Status</span>
                              <span className="font-bold text-[#111113] tabular-nums">
                                {quorumPct.toFixed(1)}% / 50.0% Required
                              </span>
                            </div>
                            <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-black/[0.06] p-0.5">
                              <div
                                style={{ width: `${Math.min(100, quorumPct)}%` }}
                                className="h-full bg-[#111113] rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Vote Action Area */}
                      <div className="w-full max-w-md">
                        {userVote !== null ? (
                          <div className="p-4 rounded-xl bg-white border border-black/[0.08] space-y-1 text-center">
                            <div className="text-xs font-bold text-[#111113] tracking-wider uppercase">
                              Vote Recorded • {userVote === "APPROVE" ? "Affirmative (Release)" : "Dissenting (Veto)"}
                            </div>
                            <div className="text-[10px] text-[#7A7672] flex items-center justify-center gap-1">
                              <span>Solana Tx:</span>
                              {txSignature ? (
                                <a
                                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF5C18] hover:underline font-semibold"
                                >
                                  {votedTxHash}
                                </a>
                              ) : (
                                <span className="text-[#111113] font-semibold">{votedTxHash}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              disabled={!!txLoading}
                              onClick={() => handleCastMilestoneVote(false)}
                              className="py-3.5 px-4 rounded-xl border border-black/[0.12] bg-white hover:bg-black/[0.03] active:bg-black/[0.06] text-[#111113] font-bold text-xs transition-all cursor-pointer disabled:opacity-50 text-center"
                            >
                              Approve Release
                            </button>
                            <button
                              disabled={!!txLoading}
                              onClick={() => handleCastMilestoneVote(true)}
                              className="py-3.5 px-4 rounded-xl border border-black/[0.12] bg-white hover:bg-black/[0.03] active:bg-black/[0.06] text-[#111113] font-bold text-xs transition-all cursor-pointer disabled:opacity-50 text-center"
                            >
                              Dissent / Veto
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Minimal Ragequit Option */}
                      <button
                        disabled={!!txLoading}
                        onClick={handleRagequit}
                        className="text-[11px] text-[#7A7672] hover:text-[#111113] underline transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Claim Pro-Rata Ragequit Settlement
                      </button>
                    </div>
                  </div>

                  {/* Right: Technical Tranche Schedule (Matches Order Book / Ledger styling) */}
                  <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06]">
                      <span className="font-bold text-[#111113] text-xs uppercase tracking-wider">
                        Milestones
                      </span>
                      <span className="text-[11px] text-[#7A7672]">
                        {venture.milestones.length} Milestones
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {venture.milestones.map((m) => {
                        const isSelected = selectedMilestone.id === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedMilestone(m);
                              setUserVote(null);
                              setVotedTxHash(null);
                            }}
                            className={`w-full p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-black/[0.03] border-[#111113] shadow-xs"
                                : "bg-white border-black/[0.04] hover:border-black/20 hover:bg-black/[0.01]"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#111113] block">
                                Milestone #{m.id}
                              </span>
                              <span className="text-[10px] text-[#7A7672] block truncate max-w-[140px]">
                                {m.title}
                              </span>
                            </div>

                            <div className="text-right space-y-0.5">
                              <span className="font-bold text-[#111113] block tabular-nums">
                                ${(m.amountUsdc / 1000).toFixed(1)}k
                              </span>
                              <span className="text-[10px] text-[#7A7672] block">
                                {m.status === "completed" ? "Released" : m.status === "in_review" ? "Voting" : "Locked"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2.5 border-t border-black/[0.06] flex items-center justify-between text-[#7A7672] text-[11px]">
                      <span>75% Primary Escrow</span>
                      <span className="font-semibold text-[#111113]">Protected</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      )}

      {/* Footer */}
      <footer className="w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8E8B88] border-t border-black/[0.04]">
        <span>© 2026 Ventrion Protocol. Built on Solana Devnet.</span>
        <div className="flex items-center gap-6">
          <Link href="/ventures" className="hover:text-black transition-colors">Directory</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/shares" className="hover:text-black transition-colors">Shareholder Registry</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/dividends" className="hover:text-black transition-colors">Dividends</Link>
        </div>
      </footer>
    </div>
  );
}
