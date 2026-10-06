"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { Navbar } from "../../components/common/Navbar";
import { BezierCounter } from "../../components/common/BezierCounter";
import { formatCompactUsdc, formatCompactShares } from "../../lib/formatters";

interface FounderVentureItem {
  id: string;
  name: string;
  symbol: string;
  ticker: string;
  mintAddress: string;
  sharePriceUsdc: number;
  founderLockedShares: number;
  totalCapitalRaisedUsdc: number;
  fundingTargetUsdc: number;
  fundingProgressPercent: number;
  status: string;
  isUserCreated?: boolean;
}

export default function MyVenturesPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [founderVentures, setFounderVentures] = useState<FounderVentureItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Live DLMM Prices cache
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    qcmp: 1.25,
    pvent: 0.10,
  });

  // Fetch live sub-second prices and founder ventures from Solana Devnet
  const fetchFounderVentures = useCallback(async () => {
    if (!connected || !publicKey) {
      setFounderVentures([]);
      return;
    }

    setIsLoading(true);
    try {
      const endpoints = ["/ventrion/api/ventures/live", "/api/ventures/live"];
      let allVentures: any[] = [];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const json = await res.json();
            const list = json.data || json.ventures;
            if (Array.isArray(list) && list.length > 0) {
              allVentures = list;
              break;
            }
          }
        } catch {}
      }

      if (allVentures.length > 0) {
        const priceMap: Record<string, number> = {};
        for (const v of allVentures) {
          if (v.id && v.sharePriceUsdc) {
            priceMap[v.id] = v.sharePriceUsdc;
          }
        }
        setLivePrices((prev) => ({ ...prev, ...priceMap }));
      }

      const walletPubkeyStr = publicKey.toBase58();
      let matched = allVentures.filter(
        (v) => v.founderAddress && v.founderAddress === walletPubkeyStr
      );

      // On-Chain RPC Direct Verification Fallback
      if (matched.length === 0) {
        try {
          const VENTRION_PROGRAM_ID = new PublicKey("37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8");
          const onChainAccounts = await connection.getProgramAccounts(VENTRION_PROGRAM_ID, {
            filters: [
              { memcmp: { offset: 0, bytes: "53zeaRLh9k6" } }, // VentureState discriminator
              { memcmp: { offset: 40, bytes: walletPubkeyStr } }, // Founder pubkey
            ],
          });

          if (onChainAccounts.length > 0) {
            matched = onChainAccounts.map((acc) => {
              const data = acc.account.data;
              let off = 8 + 32 + 32 + 32; // skip disc, config, founder, treasury
              const mint = new PublicKey(data.slice(off, off + 32)).toBase58();
              return {
                id: mint,
                name: `Enterprise ${mint.slice(0, 4)}...${mint.slice(-4)}`,
                symbol: mint.slice(0, 4).toUpperCase(),
                ticker: `$${mint.slice(0, 4).toUpperCase()}`,
                mintAddress: mint,
                sharePriceUsdc: 1.0,
                founderVestingShares: 800000,
                totalCapitalRaisedUsdc: 0,
                targetFundingCapUsdc: 50000,
                canonicalStatus: "Raising",
                founderAddress: walletPubkeyStr,
              };
            });
          }
        } catch (onChainErr) {
          console.warn("Direct on-chain check error:", onChainErr);
        }
      }

      const mapped: FounderVentureItem[] = matched.map((v) => {
        const lockedShares = v.founderVestingShares || 800000;
        const price = v.sharePriceUsdc || 1.0;
        const raised = v.totalCapitalRaisedUsdc || 0;
        const target = v.targetFundingCapUsdc || 50000;
        const pct = target > 0 ? (raised / target) * 100 : 0;
        return {
          id: v.id || v.mintAddress,
          name: v.name,
          symbol: v.symbol,
          ticker: v.ticker || `$${v.symbol}`,
          mintAddress: v.mintAddress,
          sharePriceUsdc: price,
          founderLockedShares: lockedShares,
          totalCapitalRaisedUsdc: raised,
          fundingTargetUsdc: target,
          fundingProgressPercent: pct,
          status: v.canonicalStatus === "Funded" ? "Graduated" : "Genesis Active",
          isUserCreated: true,
        };
      });

      setFounderVentures(mapped);
    } catch (err) {
      console.warn("Failed to load founder ventures from Devnet:", err);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, connection]);

  useEffect(() => {
    fetchFounderVentures();
    const interval = setInterval(fetchFounderVentures, 10000);
    return () => clearInterval(interval);
  }, [fetchFounderVentures]);

  const totalTreasuryCapitalRaised = useMemo(() => {
    return founderVentures.reduce(
      (acc, v) => acc + (v.totalCapitalRaisedUsdc || 0),
      0
    );
  }, [founderVentures]);

  const totalFounderLockedShares = useMemo(() => {
    return founderVentures.reduce(
      (acc, v) => acc + (v.founderLockedShares || 0),
      0
    );
  }, [founderVentures]);

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

        {/* FOUNDER PORTFOLIO SUMMARY CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                Treasury Capital Raised
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-[#111113] tabular-nums">
                ${connected ? <BezierCounter value={totalTreasuryCapitalRaised} decimals={2} /> : "0.00"} <span className="text-xs font-normal text-[#7A7672]">USDC</span>
              </div>
              <div className="text-xs text-[#7A7672]">
                {connected
                  ? `Actual On-Chain Primary Round Inflow across ${founderVentures.length} ${founderVentures.length === 1 ? "Venture" : "Ventures"}`
                  : "Connect founder authority wallet to load corporate data"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-10 border-t lg:border-t-0 pt-4 lg:pt-0 border-black/[0.04]">
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                  Founder Locked Equity
                </span>
                <div className="text-xl font-bold text-[#111113]">
                  {connected ? formatCompactShares(totalFounderLockedShares) : "0"} <span className="text-xs font-normal text-[#7A7672]">Shares</span>
                </div>
                <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full inline-block">
                  Vesting Vault (Non-Liquid)
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider text-[#7A7672] block">
                  Active Issuances
                </span>
                <span className="text-xl font-bold text-[#111113]">
                  {connected ? founderVentures.length : 0}
                </span>
                <span className="text-[10px] text-[#7A7672] block">
                  1,000,000 Invariant / Co.
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
                      <th className="py-3 px-4 font-semibold text-right">Treasury Raised</th>
                      <th className="py-3 px-4 font-semibold text-right">Founder Locked</th>
                      <th className="py-3 px-4 font-semibold text-right">Share Price</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {founderVentures.map((v) => {
                      const price = livePrices[v.id] || v.sharePriceUsdc || 1.0;
                      const founderShares = v.founderLockedShares || 800000;

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
                            ${v.totalCapitalRaisedUsdc.toLocaleString()} <span className="text-[#7A7672] font-normal text-[11px]">/ ${v.fundingTargetUsdc.toLocaleString()}</span>
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#111113]">
                            <div className="font-bold">{formatCompactShares(founderShares)}</div>
                            <div className="text-[10px] text-[#7A7672]">Locked (80%)</div>
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#111113]">
                            ${price.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              v.status === "Graduated" ? "bg-emerald-100 text-emerald-800" : "bg-[#111113] text-white"
                            }`}>
                              {v.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/ventures/${v.mintAddress || v.id}`}
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
