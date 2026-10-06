"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Key,
  ExternalLink,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useDualWallet, encodeBase58 } from "../wallet/DualModeWalletContext";
import {
  DEVNET_USDC_MINT,
  DEVNET_VENT_MINT,
  PILOT_VENTURE_1_PVENT_MINT,
  PILOT_VENTURE_2_QCMP_MINT,
  SOLANA_DEVNET_RPC,
  TOKEN_PROGRAM_ID,
  getVenturePDA,
  getFundingRoundPDA,
  getReceiptMintPDA,
} from "../../lib/solana/ventrionProgram";
import { VERIFIED_VENTURES } from "../../lib/venturesData";
import { PublicKey } from "@solana/web3.js";

interface NavbarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

/**
 * Robust clipboard copy function supporting both standard Clipboard API
 * and fallback execCommand for non-secure HTTP contexts (e.g. direct IP servers).
 */
function copyTextRobust(text: string): boolean {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof window !== "undefined" && window.isSecureContext) {
    try {
      navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.top = "-9999px";
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand("copy");
    document.body.removeChild(el);
    return success;
  } catch (err) {
    console.warn("Fallback copy failed:", err);
    return false;
  }
}

/**
 * Compact Money Formatter for Navbar Button:
 * - >= 1M: "$1M" (when close to 1M or round), "$1.23M"
 * - >= 1k: "$1.23k", "$50k"
 * - < 1k: "$123.45"
 */
function formatNavbarMoney(val: number): string {
  if (!val || val <= 0) return "$0.00";
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    if (val >= 1_000_000 && val < 1_060_000) {
      return "$1M";
    }
    if (m % 1 === 0) {
      return `$${m.toFixed(0)}M`;
    }
    return `$${m.toFixed(2)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    if (k % 1 === 0) {
      return `$${k.toFixed(0)}k`;
    }
    return `$${k.toFixed(2)}k`;
  }
  return `$${val.toFixed(2)}`;
}

/**
 * Compact Money Formatter for small modal metrics container:
 */
function formatCompactModalMoney(val: number): string {
  if (!val || val <= 0) return "$0";
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    if (val >= 1_000_000 && val < 1_060_000) {
      return "$1M";
    }
    return `$${m.toFixed(2)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    if (k % 1 === 0) {
      return `$${k.toFixed(0)}k`;
    }
    return `$${k.toFixed(1)}k`;
  }
  return `$${val.toFixed(2)}`;
}

export function Navbar({ activeTab }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isActionsRevealed, setIsActionsRevealed] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivKey, setCopiedPrivKey] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Balances & True Business Equity
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [ventBalance, setVentBalance] = useState<number>(0);
  const [ventureEquityUsdc, setVentureEquityUsdc] = useState<number>(0);
  const [holdingsCount, setHoldingsCount] = useState<number>(0);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(true);

  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  // Solana Wallet Adapter & Local Wallet Context
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { exportPrivateKey, setIsModalOpen } = useDualWallet();

  const fullAddress = publicKey ? publicKey.toBase58() : null;
  const shortAddress = fullAddress
    ? `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`
    : "";

  // Valuation constants (Devnet)
  const SOL_PRICE_USD = 152.0;
  const VENT_PRICE_USD = 0.264;

  const totalPortfolioValueUsd = connected
    ? Number(
        (
          solBalance * SOL_PRICE_USD +
          usdcBalance +
          ventBalance * VENT_PRICE_USD +
          ventureEquityUsdc
        ).toFixed(2)
      )
    : 0;

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sequence the downward expansion animation when wallet opens
  useEffect(() => {
    if (isProfileOpen) {
      setIsActionsRevealed(false);
      const timer = setTimeout(() => {
        setIsActionsRevealed(true);
      }, 220);
      return () => clearTimeout(timer);
    } else {
      setIsActionsRevealed(false);
    }
  }, [isProfileOpen]);

  // Fetch live on-chain balances upon connection
  const fetchBalances = useCallback(async () => {
    if (!connected || !publicKey) {
      setSolBalance(0);
      setUsdcBalance(0);
      setVentBalance(0);
      setVentureEquityUsdc(0);
      setHoldingsCount(0);
      setIsLoadingBalances(false);
      return;
    }

    try {
      setIsLoadingBalances(true);
      const connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");

      // 1. Fetch live ventures catalog
      let allVentures: any[] = [...VERIFIED_VENTURES];
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

      // 2. Fetch SOL balance and parsed token accounts in parallel
      const [lamports, tokenAccounts] = await Promise.all([
        connection.getBalance(publicKey).catch(() => 0),
        connection
          .getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
          })
          .catch(() => ({ value: [] })),
      ]);

      setSolBalance(Number((lamports / LAMPORTS_PER_SOL).toFixed(4)));

      const mintToAmount: Record<string, number> = {};
      let foundUsdc = 0;
      let foundVent = 0;

      for (const item of tokenAccounts.value) {
        const info = item.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.uiAmount || 0;
        mintToAmount[mint] = (mintToAmount[mint] || 0) + amount;

        if (mint === DEVNET_USDC_MINT.toBase58()) {
          foundUsdc += amount;
        } else if (mint === DEVNET_VENT_MINT.toBase58()) {
          foundVent += amount;
        }
      }

      // 3. Calculate true business equity across all real on-chain venture tokens and receipts
      let totalVentureEquity = 0;
      let count = 0;

      for (const v of allVentures) {
        let shares = mintToAmount[v.mintAddress] || 0;
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

        const holdingAmount = shares + receipts;
        if (holdingAmount > 0) {
          count++;
          const price = Number(v.sharePriceUsdc || 0.10);
          totalVentureEquity += holdingAmount * price;
        }
      }

      setUsdcBalance(Number(foundUsdc.toFixed(2)));
      setVentBalance(Math.round(foundVent));
      setVentureEquityUsdc(Number(totalVentureEquity.toFixed(2)));
      setHoldingsCount(count);

      // Graceful delay for smooth visual feel without flickering (~800ms)
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.warn("Failed to fetch live balances:", err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Reactive listener for trade events to instantly update wallet balances
  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchBalances();
    };
    window.addEventListener("ventrion:trade_completed", handleRefreshEvent);
    window.addEventListener("ventrion:balances_updated", handleRefreshEvent);
    return () => {
      window.removeEventListener("ventrion:trade_completed", handleRefreshEvent);
      window.removeEventListener("ventrion:balances_updated", handleRefreshEvent);
    };
  }, [fetchBalances]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleConnectClick = () => {
    if (connected) {
      setIsProfileOpen((prev) => !prev);
      return;
    }
    setIsModalOpen(true);
  };

  const handleDisconnect = async () => {
    setIsProfileOpen(false);
    try {
      await disconnect();
    } catch {}
    setSolBalance(0);
    setUsdcBalance(0);
    setVentBalance(0);
    setVentureEquityUsdc(0);
    setHoldingsCount(0);
  };

  const copyAddress = () => {
    if (!fullAddress) return;
    copyTextRobust(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 1800);
  };

  const handleCopyPrivateKey = () => {
    let pk = exportPrivateKey();
    if (!pk && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ventrion_devnet_ephemeral_keypair_v1");
        if (stored) {
          const raw = JSON.parse(stored);
          if (Array.isArray(raw)) {
            pk = encodeBase58(Uint8Array.from(raw));
          }
        }
      } catch {}
    }
    if (!pk) return;
    copyTextRobust(pk);
    setCopiedPrivKey(true);
    setTimeout(() => setCopiedPrivKey(false), 1800);
  };

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await fetchBalances();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Main navigation items
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Ventures", href: "/ventures" },
    { label: "Documentation", href: "/documentation" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full select-none transition-all duration-300 ease-out ${
        isScrolled
          ? "bg-[#FAF7F2]/90 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] py-3 sm:py-3.5"
          : "bg-transparent border-b border-transparent py-4 sm:py-5"
      }`}
    >
      <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 flex items-center justify-between relative">
        {/* Subtle Ambient Lighting Line */}
        <div
          className={`absolute inset-x-10 -top-4 sm:-top-5 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none transition-opacity duration-300 ${
            isScrolled ? "opacity-30" : "opacity-100"
          }`}
        />

        {/* LEFT CLUSTER: LOGO & NAV */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-[10px] bg-[#111113] flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_3px_10px_rgba(253,107,59,0.18)] group-hover:scale-105 transition-all overflow-hidden p-1.5">
              <img
                src="/ventrion-logo.png"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.indexOf("/ventrion/ventrion-logo.png") === -1 && target.src.indexOf("/preview/ventrion-logo.png") === -1) {
                    target.src = "/ventrion/ventrion-logo.png";
                  }
                }}
                alt="Ventrion Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              />
            </div>
            <span className="font-jakarta text-[19px] font-bold text-[#111113] tracking-tight leading-none">
              Ventrion
            </span>
          </Link>

          {/* MAIN TOP NAVIGATION BAR */}
          <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] p-1 rounded-full border border-black/[0.04]">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/ventures"
                  ? pathname === "/ventures"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full font-jakarta text-[13px] font-medium transition-all duration-200 outline-none select-none ${
                    isActive
                      ? "bg-white text-[#111113] shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-black/[0.04]"
                      : "text-[#6E6964] hover:text-[#111113] hover:bg-white/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT CLUSTER: WALLET CONTROLLER (NO REFRESH BUTTON OUTSIDE) */}
        <div className="relative" ref={profileRef}>
          {/* WALLET BUTTON: PURE BLACK */}
          <button
            onClick={handleConnectClick}
            className={`font-jakarta text-[13px] font-semibold transition-all duration-200 outline-none cursor-pointer whitespace-nowrap select-none ${
              connected
                ? "pl-3 pr-3.5 py-1.5 rounded-full bg-[#111113] text-white hover:bg-black shadow-sm flex items-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
                : "px-5 py-2.5 rounded-full bg-[#111113] text-white hover:bg-black shadow-sm hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {connected ? (
              <>
                {/* Balance Bubble */}
                <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-white tracking-tight flex items-center justify-center font-mono min-w-[48px]">
                  {isLoadingBalances ? (
                    <div className="w-10 h-3 bg-white/20 rounded animate-pulse" />
                  ) : (
                    <span>{formatNavbarMoney(totalPortfolioValueUsd)}</span>
                  )}
                </div>

                {/* Short Address & Dropdown Indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-medium text-white/90">
                    {shortAddress}
                  </span>
                  <span
                    className={`text-[10px] text-white/70 transition-transform duration-200 inline-block ${
                      isProfileOpen ? "rotate-180 text-white" : ""
                    }`}
                  >
                    ▾
                  </span>
                </div>
              </>
            ) : (
              <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
            )}
          </button>

          {/* WALLET DRAWER: ANIMATES AND EXPANDS DOWNWARD */}
          <AnimatePresence>
            {connected && isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -4 }}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ transformOrigin: "top right" }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-[340px] rounded-2xl bg-white text-[#111113] border border-black/[0.08] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] p-4 sm:p-5 z-50 select-none overflow-hidden"
              >
                {/* STAGE 1: TOP CONTENT (HEADER & PORTFOLIO BALANCES) */}
                <div className="space-y-3.5">
                  {/* Header: Address & Functional Action Icons (Refresh, Copy, Key, Explorer) */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                    <span className="font-mono text-xs font-semibold text-[#111113]">
                      {shortAddress}
                    </span>

                    <div className="flex items-center gap-1 text-[#7A7672]">
                      {/* Refresh Balances (Inside Drawer) */}
                      <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111113] hover:bg-black/[0.04] transition-colors cursor-pointer"
                        title="Refresh Balances"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#111113]" : ""}`} />
                      </button>

                      {/* Copy Address */}
                      <button
                        onClick={copyAddress}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111113] hover:bg-black/[0.04] transition-colors cursor-pointer"
                        title={copiedAddress ? "Address Copied!" : "Copy Address"}
                      >
                        {copiedAddress ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Export Private Key */}
                      <button
                        onClick={handleCopyPrivateKey}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111113] hover:bg-black/[0.04] transition-colors cursor-pointer"
                        title={copiedPrivKey ? "Private Key Copied!" : "Export Private Key (Base58)"}
                      >
                        {copiedPrivKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Key className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Solana Explorer */}
                      <a
                        href={`https://explorer.solana.com/address/${fullAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111113] hover:bg-black/[0.04] transition-colors"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Net Portfolio Value */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A7672] tracking-wider block">
                      Net Portfolio Value
                    </span>
                    <div className="text-xl font-bold font-mono tracking-tight text-[#111113] mt-0.5 flex items-baseline gap-1.5">
                      {isLoadingBalances ? (
                        <div className="w-40 h-6 bg-black/[0.06] rounded animate-pulse my-0.5" />
                      ) : (
                        <>
                          <span>
                            ${totalPortfolioValueUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] font-normal text-[#7A7672]">USD</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 4 Metric Boxes (2x2 Grid) */}
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-black/[0.05]">
                      <div className="text-[10px] text-[#7A7672]">SOL</div>
                      <div className="font-bold text-xs text-[#111113] mt-0.5">
                        {isLoadingBalances ? (
                          <div className="w-12 h-3.5 bg-black/[0.06] rounded animate-pulse mt-0.5" />
                        ) : (
                          `${solBalance} SOL`
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-black/[0.05]">
                      <div className="text-[10px] text-[#7A7672]">USDC</div>
                      <div className="font-bold text-xs text-[#111113] mt-0.5">
                        {isLoadingBalances ? (
                          <div className="w-12 h-3.5 bg-black/[0.06] rounded animate-pulse mt-0.5" />
                        ) : (
                          formatCompactModalMoney(usdcBalance)
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-black/[0.05]">
                      <div className="text-[10px] text-[#7A7672]">VENTURE EQUITY</div>
                      <div className="font-bold text-xs text-[#111113] mt-0.5">
                        {isLoadingBalances ? (
                          <div className="w-12 h-3.5 bg-black/[0.06] rounded animate-pulse mt-0.5" />
                        ) : (
                          formatCompactModalMoney(ventureEquityUsdc)
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-black/[0.05]">
                      <div className="text-[10px] text-[#7A7672]">$VENT GOVERNANCE</div>
                      <div className="font-bold text-xs text-[#FF5C18] mt-0.5">
                        {isLoadingBalances ? (
                          <div className="w-12 h-3.5 bg-black/[0.06] rounded animate-pulse mt-0.5" />
                        ) : (
                          ventBalance.toLocaleString()
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STAGE 2: EXPANDS CONTAINER DOWNWARD AS AN ANIMATION */}
                <AnimatePresence>
                  {isActionsRevealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12, paddingTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }}
                      transition={{
                        height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                        marginTop: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                        paddingTop: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.22, delay: 0.08 },
                      }}
                      className="border-t border-black/[0.06] space-y-1.5 overflow-hidden"
                    >
                      {/* Link: My Ventures */}
                      <Link
                        href="/my-ventures"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0ECE3] border border-black/[0.04] transition-all text-[#111113] group"
                      >
                        <span className="text-xs font-semibold tracking-tight">My Ventures</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
                      </Link>

                      {/* Link: My Shares */}
                      <Link
                        href="/shares"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0ECE3] border border-black/[0.04] transition-all text-[#111113] group"
                      >
                        <span className="text-xs font-semibold tracking-tight">My Shares</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
                      </Link>

                      {/* Link: Dividends */}
                      <Link
                        href="/dividends"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0ECE3] border border-black/[0.04] transition-all text-[#111113] group"
                      >
                        <span className="text-xs font-semibold tracking-tight">Dividends</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
                      </Link>

                      {/* Disconnect Button */}
                      <button
                        onClick={handleDisconnect}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-black/[0.02] hover:bg-red-500/[0.08] text-[#7A7672] hover:text-red-600 border border-black/[0.04] text-[11px] font-mono font-medium transition-colors cursor-pointer text-center"
                      >
                        Disconnect Wallet
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
