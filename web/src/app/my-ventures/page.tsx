"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { Navbar } from "../../components/common/Navbar";
import { BezierCounter } from "../../components/common/BezierCounter";
import { formatCompactUsdc, formatCompactShares } from "../../lib/formatters";

const USER_VENTURES_STORAGE_KEY = "ventrion_user_created_ventures_v1";

interface FounderVentureItem {
  id: string;
  name: string;
  symbol: string;
  ticker: string;
  mintAddress: string;
  sharePriceUsdc: number;
  founderLockedShares: number;
  impliedValuationUsdc: number;
  fundingTargetUsdc: number;
  status: string;
  isUserCreated?: boolean;
}

export default function MyVenturesPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [founderVentures, setFounderVentures] = useState<FounderVentureItem[]>([]);

  // Live DLMM Prices cache
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    qcmp: 10.0,
    pvent: 0.1,
    "vent-ai": 0.85,
    "alps-commerce": 0.85,
  });

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

  // Load custom-created ventures from LocalStorage
  const loadStoredVentures = useCallback(() => {
    try {
      const stored = localStorage.getItem(USER_VENTURES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: FounderVentureItem[] = parsed.map((item: any) => ({
            id: item.id || `custom-${item.mint || Date.now()}`,
            name: item.name || "Custom Venture",
            symbol: item.symbol || "VENT",
            ticker: `$${item.symbol || "VENT"}`,
            mintAddress: item.mint || "GENESIS_MINT",
            sharePriceUsdc: item.price || 1.0,
            founderLockedShares: item.founderLockedShares || 800000,
            impliedValuationUsdc: (item.founderLockedShares || 800000) * (item.price || 1.0),
            fundingTargetUsdc: item.fundingTargetUsdc || 16000,
            status: "Genesis Active",
            isUserCreated: true,
          }));

          setFounderVentures(mapped);
          return;
        }
      }
    } catch {}
    setFounderVentures([]);
  }, []);

  useEffect(() => {
    loadStoredVentures();
  }, [loadStoredVentures]);

  const totalFounderEquityValue = useMemo(() => {
    return founderVentures.reduce(
      (acc, v) => acc + (livePrices[v.id] || v.sharePriceUsdc) * v.founderLockedShares,
      0
    );
  }, [founderVentures, livePrices]);

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="my-ventures" />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 z-10 space-y-8">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-black/[0.06]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
              Founder Ventures &amp; Issuance Cockpit
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#7A7672]">
              On-chain corporate stock issuances and founder capitalization tables.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-[#7A7672]">
              {connected && publicKey ? (
                <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
              ) : (
                <span>Not Connected</span>
              )}
            </div>

            <Link
              href="/ventures/launch"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-semibold shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch New Venture</span>
            </Link>
          </div>
        </div>

        {/* FOUNDER PORTFOLIO SUMMARY CARD (NO LABELS SLOP, CLEAN WHITESPACE) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                Total Founder Locked Equity
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-[#111113] tabular-nums">
                ${connected ? <BezierCounter value={totalFounderEquityValue} decimals={2} /> : "0.00"} <span className="text-xs font-normal text-[#7A7672]">USDC</span>
              </div>
              <div className="text-xs text-[#7A7672]">
                {connected ? `${founderVentures.length} Issued Enterprises • Fixed 1,000,000 Share Invariant` : "Connect wallet to load founder issuances"}
              </div>
            </div>

            <div className="flex items-center gap-6 self-start sm:self-auto">
              <div className="space-y-0.5 sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                  Active Issuances
                </span>
                <span className="text-xl font-bold text-[#111113]">
                  {founderVentures.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PERSONAL ISSUED VENTURES ONLY (ZERO MARKET DIRECTORY SLOP) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111113]">
              Issued Corporate Entities
            </h2>
            <span className="font-mono text-xs text-[#7A7672]">
              {founderVentures.length} Issued
            </span>
          </div>

          {!connected ? (
            <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center shadow-xs space-y-4">
              <Building2 className="w-8 h-8 text-[#8E8B88] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#111113]">
                  Connect Wallet
                </h3>
                <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                  Connect your founder authority wallet to review your corporate stock positions.
                </p>
              </div>
              <button
                onClick={() => setVisible(true)}
                className="px-6 py-2.5 rounded-full bg-[#111113] hover:bg-black text-white font-semibold text-xs transition-transform active:scale-95 cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          ) : founderVentures.length === 0 ? (
            <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center shadow-xs space-y-4">
              <Building2 className="w-8 h-8 text-[#8E8B88] mx-auto opacity-40" />
              <div className="space-y-1">
                <div className="font-semibold text-sm text-[#111113]">
                  No issued ventures under this wallet
                </div>
                <p className="text-xs text-[#7A7672] max-w-sm mx-auto">
                  Launch a new tokenized enterprise to issue common stock and initiate milestone funding.
                </p>
              </div>
              <Link
                href="/ventures/launch"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111113] text-white text-xs font-semibold hover:bg-[#FF5C18] transition-colors"
              >
                <span>Launch Venture</span>
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
                      <th className="py-3 px-4 font-semibold text-right">Founder Lock</th>
                      <th className="py-3 px-4 font-semibold text-right">Share Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Implied Valuation</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {founderVentures.map((v) => {
                      const price = livePrices[v.id] || v.sharePriceUsdc || 1.0;
                      const founderShares = v.founderLockedShares || 800000;
                      const impliedValuation = founderShares * price;

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
                            {formatCompactShares(founderShares)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#111113]">
                            ${price.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#111113]">
                            {formatCompactUsdc(impliedValuation)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#111113] text-white">
                              Active
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/ventures/${v.id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#111113] hover:bg-black text-white text-xs transition-colors"
                            >
                              Manage
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
          <Link href="/my-ventures" className="hover:text-black font-semibold text-[#111113]">My Ventures</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/shares" className="hover:text-black">My Shares</Link>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <Link href="/dividends" className="hover:text-black">My Dividends</Link>
        </div>
      </footer>
    </div>
  );
}
