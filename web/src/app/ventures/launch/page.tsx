"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Check,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "../../../components/common/Navbar";
import { formatCompactUsdc, formatCompactShares } from "../../../lib/formatters";
import { TOTAL_SHARES } from "../../../lib/constants";

const USER_VENTURES_STORAGE_KEY = "ventrion_user_created_ventures_v1";

interface TrancheItem {
  id: string;
  name: string;
  percent: number;
}

export default function LaunchVenturePage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();

  // Navigation steps
  const [activeStep, setActiveStep] = useState<"identity" | "capital" | "milestones">("identity");

  // SECTION 1: Company Identity
  const [name, setName] = useState("Aura Dynamics Labs");
  const [symbol, setSymbol] = useState("AURA");
  const [description, setDescription] = useState(
    "Next-generation decentralized compute & inference infrastructure with commercial revenue distribution."
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80"
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [metadataUri, setMetadataUri] = useState<string>("/ventrion/metadata/aura_metadata.json");

  // SECTION 2: Capital Formation (Strictly 1% - 49% for Sale per Manifest)
  const [equitySalePercent, setEquitySalePercent] = useState<number>(20); // 20%
  const [fundingTargetUsdc, setFundingTargetUsdc] = useState<number>(50000); // $50k USDC
  const [upfrontRunwayPercent, setUpfrontRunwayPercent] = useState<number>(15); // 15% upfront
  const [vestingCliffMonths, setVestingCliffMonths] = useState<number>(6); // 6 months
  const [vestingDurationYears, setVestingDurationYears] = useState<number>(2); // 2 years

  // SECTION 3: Milestone Tranches
  const [tranches, setTranches] = useState<TrancheItem[]>([
    { id: "1", name: "Core Autonomous Protocol Engine & Devnet Sandbox", percent: 40 },
    { id: "2", name: "Security Verification & Multi-Sig Escrow Infrastructure", percent: 35 },
    { id: "3", name: "Commercial Revenue Feed & Meteora DLMM Integration", percent: 25 },
  ]);

  // Derived Token & Financial Metrics
  const offeredShares = useMemo(() => {
    return Math.round(TOTAL_SHARES * (equitySalePercent / 100));
  }, [equitySalePercent]);

  const founderShares = useMemo(() => {
    return TOTAL_SHARES - offeredShares;
  }, [offeredShares]);

  const founderPercent = useMemo(() => {
    return (100 - equitySalePercent).toFixed(1);
  }, [equitySalePercent]);

  // DLMM Seeding: Exactly 17% of offered shares and 17% of raised USDC
  const dlmmSeedShares = useMemo(() => {
    return Math.round(offeredShares * 0.17);
  }, [offeredShares]);

  const dlmmSeedUsdc = useMemo(() => {
    return fundingTargetUsdc * 0.17;
  }, [fundingTargetUsdc]);

  const publicBackerShares = useMemo(() => {
    return offeredShares - dlmmSeedShares;
  }, [offeredShares, dlmmSeedShares]);

  const sharePriceUsdc = useMemo(() => {
    if (offeredShares <= 0) return 0;
    return fundingTargetUsdc / offeredShares;
  }, [fundingTargetUsdc, offeredShares]);

  const impliedValuationUsdc = useMemo(() => {
    return TOTAL_SHARES * sharePriceUsdc;
  }, [sharePriceUsdc]);

  // Capital Distribution upon Graduation
  const legalFeeUsdc = useMemo(() => {
    return Math.max(3000, fundingTargetUsdc * 0.03);
  }, [fundingTargetUsdc]);

  const upfrontUsdc = useMemo(() => {
    return fundingTargetUsdc * (upfrontRunwayPercent / 100);
  }, [fundingTargetUsdc, upfrontRunwayPercent]);

  const escrowVaultUsdc = useMemo(() => {
    return Math.max(0, fundingTargetUsdc - dlmmSeedUsdc - legalFeeUsdc - upfrontUsdc);
  }, [fundingTargetUsdc, dlmmSeedUsdc, legalFeeUsdc, upfrontUsdc]);

  // Refs for tactile container clicking
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // In-Browser Logo Upload & Metadata Generation
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);

      // Attempt to push to server upload endpoint if available
      try {
        const res = await fetch("/ventrion/api/ventures/upload-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol,
            name,
            description,
            logoDataUrl: dataUrl,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.uri) {
            setMetadataUri(json.uri);
          }
        } else {
          setMetadataUri(`/ventrion/metadata/${symbol.toLowerCase()}_metadata.json`);
        }
      } catch {
        setMetadataUri(`/ventrion/metadata/${symbol.toLowerCase()}_metadata.json`);
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Launch State
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState<string | null>(null);
  const [confirmedTx, setConfirmedTx] = useState<string | null>(null);

  const handleLaunchGenesis = async () => {
    setIsLaunching(true);
    setLaunchProgress("MINTING 1,000,000 SHARES & REVOKING MINT AUTHORITY");
    await new Promise((r) => setTimeout(r, 800));

    setLaunchProgress("CREATING MIDAO DAO LLC JURISDICTIONAL REGISTRATION");
    await new Promise((r) => setTimeout(r, 800));

    setLaunchProgress("INITIALIZING FLAT METEORA BONDING CURVE");
    await new Promise((r) => setTimeout(r, 900));

    const fakeChars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let mockTx = "";
    let mockMint = "";
    for (let i = 0; i < 64; i++) mockTx += fakeChars.charAt(Math.floor(Math.random() * fakeChars.length));
    for (let i = 0; i < 44; i++) mockMint += fakeChars.charAt(Math.floor(Math.random() * fakeChars.length));

    // Save to user created ventures
    try {
      const newVenture = {
        id: symbol.toLowerCase(),
        name,
        symbol,
        ticker: `$${symbol}`,
        mint: mockMint,
        price: sharePriceUsdc,
        founderLockedShares: founderShares,
        fundingTargetUsdc,
        status: "Genesis Active",
        tx: mockTx,
        createdAt: new Date().toISOString(),
      };

      const existing = localStorage.getItem(USER_VENTURES_STORAGE_KEY);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newVenture);
      localStorage.setItem(USER_VENTURES_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    setConfirmedTx(mockTx);
    setIsLaunching(false);
    setLaunchProgress(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="my-ventures" />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 z-10 space-y-8">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-black/[0.06]">
          <div className="space-y-1">
            <Link
              href="/my-ventures"
              className="inline-flex items-center gap-1.5 text-xs text-[#7A7672] hover:text-[#111113] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Founder Cockpit</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113]">
              Create Venture
            </h1>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/[0.04] rounded-2xl border border-black/[0.04]">
            {[
              { id: "identity", label: "Identity" },
              { id: "capital", label: "Capital Structure" },
              { id: "milestones", label: "Milestones" },
            ].map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id as any)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#111113] shadow-sm border border-black/[0.04]"
                      : "text-[#7A7672] hover:text-[#111113]"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN TERMINAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLUMNS: CONFIGURATION WORKSPACE */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: IDENTITY & METAPLEX */}
            {activeStep === "identity" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6">
                  {/* Logo Upload Box */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7672] block">
                      Enterprise Logo
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileSelect}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-2xl bg-[#F7F5F0]/60 border border-dashed border-black/[0.12] hover:border-black/[0.3] transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-6"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white border border-black/[0.08] shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-6 h-6 text-[#7A7672]" />
                        )}
                      </div>

                      <div className="space-y-1 text-center sm:text-left">
                        <div className="text-xs font-semibold text-[#111113]">
                          {isUploadingLogo ? "Uploading and generating metadata..." : "Click to upload SVG, PNG, or JPG"}
                        </div>
                        <p className="text-[11px] text-[#7A7672]">
                          Saved and indexed on-chain via Metaplex Token Metadata Standard.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Name & Symbol */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => nameInputRef.current?.focus()}
                      className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:border-black focus-within:scale-[1.01] transition-all cursor-text space-y-1"
                    >
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7672] block">
                        Company Legal Name
                      </span>
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Apex Compute Inc."
                        className="w-full bg-transparent font-medium text-sm text-[#111113] outline-none"
                      />
                    </div>

                    <div
                      onClick={() => symbolInputRef.current?.focus()}
                      className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:border-black focus-within:scale-[1.01] transition-all cursor-text space-y-1"
                    >
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7672] block">
                        Ticker Symbol
                      </span>
                      <input
                        ref={symbolInputRef}
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="APEX"
                        maxLength={6}
                        className="w-full bg-transparent font-mono font-bold text-sm text-[#111113] uppercase outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div
                    onClick={() => descInputRef.current?.focus()}
                    className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:border-black focus-within:scale-[1.01] transition-all cursor-text space-y-1"
                  >
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7672] block">
                      Enterprise Overview &amp; Thesis
                    </span>
                    <textarea
                      ref={descInputRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-xs text-[#111113] outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveStep("capital")}
                      className="px-5 py-2.5 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-semibold transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Continue to Capital Structure</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CAPITAL STRUCTURE */}
            {activeStep === "capital" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
                  {/* Equity for Sale Slider (1% - 49%) */}
                  <div className="p-5 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] space-y-4">
                    <div className="flex items-center justify-between text-xs font-jakarta">
                      <span className="font-semibold text-[#111113]">Equity Offered for Sale</span>
                      <span className="font-mono font-bold text-base text-[#111113] tabular-nums">
                        {equitySalePercent}% ({formatCompactShares(offeredShares)} shares)
                      </span>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={49}
                      step={1}
                      value={equitySalePercent}
                      onChange={(e) => setEquitySalePercent(Number(e.target.value))}
                      className="w-full accent-[#111113] cursor-pointer"
                    />

                    {/* Presets */}
                    <div className="flex items-center gap-2 font-jakarta">
                      {[10, 15, 20, 25, 30, 40].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setEquitySalePercent(preset)}
                          className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            equitySalePercent === preset
                              ? "bg-[#111113] text-white"
                              : "bg-black/[0.04] text-[#7A7672] hover:text-[#111113]"
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Funding Target in USDC */}
                  <div
                    onClick={() => targetInputRef.current?.focus()}
                    className="p-5 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:border-black focus-within:scale-[1.01] transition-all cursor-text space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-[#7A7672]">
                      <span>Primary Funding Target</span>
                      <span>Implied Valuation: {formatCompactUsdc(impliedValuationUsdc)}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-[#111113]">$</span>
                      <input
                        ref={targetInputRef}
                        type="number"
                        min={5000}
                        max={1000000}
                        step={5000}
                        value={fundingTargetUsdc}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val > 0) setFundingTargetUsdc(val);
                        }}
                        className="w-full bg-transparent font-bold text-2xl sm:text-3xl text-[#111113] outline-none tabular-nums"
                      />
                      <span className="text-xs text-[#7A7672] font-normal">USDC</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 font-jakarta">
                      {[25000, 50000, 100000, 250000].map((preset) => (
                        <button
                          key={preset}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFundingTargetUsdc(preset);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                            fundingTargetUsdc === preset
                              ? "bg-[#111113] text-white"
                              : "bg-black/[0.04] text-[#7A7672] hover:text-[#111113]"
                          }`}
                        >
                          ${preset / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upfront Runway Selection */}
                  <div className="space-y-2 font-jakarta">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#111113]">Upfront Working Capital Runway</span>
                      <span className="font-mono text-[#7A7672]">{upfrontRunwayPercent}% ({formatCompactUsdc(upfrontUsdc)})</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 15, 20, 25].map((u) => (
                        <button
                          key={u}
                          onClick={() => setUpfrontRunwayPercent(u)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            upfrontRunwayPercent === u
                              ? "bg-[#111113] text-white shadow-xs"
                              : "bg-[#F7F5F0] text-[#7A7672] hover:text-[#111113]"
                          }`}
                        >
                          {u}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Founder Vesting Settings */}
                  <div className="space-y-3 pt-2 font-jakarta">
                    <span className="text-xs font-semibold text-[#111113] block">
                      Founder Lock Duration &amp; Cliff
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#7A7672]">Cliff Period</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[6, 12].map((m) => (
                            <button
                              key={m}
                              onClick={() => setVestingCliffMonths(m)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                vestingCliffMonths === m
                                  ? "bg-[#111113] text-white shadow-xs"
                                  : "bg-[#F7F5F0] text-[#7A7672] hover:text-[#111113]"
                              }`}
                            >
                              {m} Months
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#7A7672]">Total Lock Duration</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((y) => (
                            <button
                              key={y}
                              onClick={() => setVestingDurationYears(y)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                vestingDurationYears === y
                                  ? "bg-[#111113] text-white shadow-xs"
                                  : "bg-[#F7F5F0] text-[#7A7672] hover:text-[#111113]"
                              }`}
                            >
                              {y} {y === 1 ? "Year" : "Years"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 font-jakarta">
                    <button
                      onClick={() => setActiveStep("identity")}
                      className="text-xs text-[#7A7672] hover:text-[#111113] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setActiveStep("milestones")}
                      className="px-5 py-2.5 rounded-xl bg-[#111113] hover:bg-black text-white text-xs font-semibold transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Continue to Milestones</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: MILESTONE TRANCHES */}
            {activeStep === "milestones" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
                  <div className="flex items-center justify-between font-jakarta">
                    <div>
                      <h2 className="text-base font-bold text-[#111113]">Milestone Tranches</h2>
                      <p className="text-xs text-[#7A7672]">
                        Capital released upon primary backer affirmative consensus.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#7A7672]">
                      {formatCompactUsdc(escrowVaultUsdc)} Escrow Total
                    </span>
                  </div>

                  {/* Tranches List */}
                  <div className="space-y-3">
                    {tranches.map((t, idx) => {
                      const trancheUsdc = (escrowVaultUsdc * t.percent) / 100;
                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl bg-[#F7F5F0]/50 border border-black/[0.04] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#111113]">Tranche #{idx + 1} ({t.percent}%)</span>
                            <span className="tabular-nums font-semibold text-[#111113]">
                              {formatCompactUsdc(trancheUsdc)}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => {
                              const updated = [...tranches];
                              updated[idx].name = e.target.value;
                              setTranches(updated);
                            }}
                            className="w-full bg-transparent text-xs text-[#111113] font-jakarta outline-none border-b border-black/[0.06] pb-1"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Action / Launch Button */}
                  <div className="pt-4 border-t border-black/[0.06] space-y-4 font-jakarta">
                    {confirmedTx ? (
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 font-mono">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Venture Genesis Broadcast Confirmed</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 break-all space-y-1">
                          <div>Tx Signature: {confirmedTx}</div>
                        </div>
                        <div className="pt-2 flex items-center gap-3">
                          <Link
                            href={`/ventures/${symbol.toLowerCase()}`}
                            className="px-4 py-2 rounded-xl bg-[#111113] text-white text-xs font-semibold hover:bg-black inline-flex items-center gap-1.5"
                          >
                            <span>Open Trading Terminal</span>
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </Link>
                          <Link
                            href="/my-ventures"
                            className="text-xs text-[#111113] hover:underline"
                          >
                            View in Founder Cockpit
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {isLaunching && (
                          <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-black/[0.04] space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-2 text-[#111113]">
                              <div className="w-2 h-2 rounded-full bg-[#FF5C18] animate-ping" />
                              <span>{launchProgress}</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleLaunchGenesis}
                          disabled={isLaunching}
                          className="w-full py-4 rounded-2xl bg-[#111113] hover:bg-black text-white text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-black/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          <span>{isLaunching ? "Broadcasting Genesis..." : "Launch Venture Genesis"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-start pt-2 font-jakarta">
                    <button
                      onClick={() => setActiveStep("capital")}
                      className="text-xs text-[#7A7672] hover:text-[#111113] cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT 5 COLUMNS: LIVE CAPITAL TERMINAL SUMMARY */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
              <div className="pb-4 border-b border-black/[0.06]">
                <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block">
                  Implied Valuation
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-[#111113] tabular-nums mt-1">
                  {formatCompactUsdc(impliedValuationUsdc)}{" "}
                  <span className="text-xs font-normal text-[#7A7672]">USDC</span>
                </div>
              </div>

              {/* Share Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.04] space-y-1">
                  <span className="text-[10px] text-[#7A7672] block">Target Raise</span>
                  <span className="text-sm font-bold text-[#111113] tabular-nums">
                    {formatCompactUsdc(fundingTargetUsdc)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.04] space-y-1">
                  <span className="text-[10px] text-[#7A7672] block">Share Price</span>
                  <span className="text-sm font-bold text-[#111113] tabular-nums">
                    ${sharePriceUsdc.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Cap Table Split Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-jakarta">
                  <span className="font-semibold text-[#111113]">Cap Table Structure</span>
                  <span className="text-[#7A7672]">1,000,000 Shares</span>
                </div>

                {/* The Proportional Bar */}
                <div className="h-3 w-full rounded-full bg-black/[0.05] overflow-hidden flex">
                  {/* Founder */}
                  <div
                    style={{ width: `${founderPercent}%` }}
                    className="h-full bg-[#111113] transition-all duration-300"
                  />
                  {/* DLMM */}
                  <div
                    style={{ width: `${(equitySalePercent * 0.17).toFixed(1)}%` }}
                    className="h-full bg-[#FF5C18] transition-all duration-300"
                  />
                  {/* Backers */}
                  <div
                    style={{ width: `${(equitySalePercent * 0.83).toFixed(1)}%` }}
                    className="h-full bg-black/25 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7672]">Founder Retained</span>
                    <span className="font-bold text-[#111113] tabular-nums">
                      {founderPercent}% ({formatCompactShares(founderShares)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7672]">DLMM Liquidity (17% of Offer)</span>
                    <span className="font-bold text-[#FF5C18] tabular-nums">
                      {formatCompactShares(dlmmSeedShares)} shares
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7672]">Public Primary Backers</span>
                    <span className="font-bold text-[#111113] tabular-nums">
                      {formatCompactShares(publicBackerShares)} shares
                    </span>
                  </div>
                </div>
              </div>

              {/* Capital Allocation on Graduation */}
              <div className="space-y-2 pt-4 border-t border-black/[0.06] text-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#7A7672] block">
                  Capital Allocation Upon Graduation
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A7672]">Upfront Runway ({upfrontRunwayPercent}%)</span>
                  <span className="font-bold text-[#111113] tabular-nums">
                    {formatCompactUsdc(upfrontUsdc)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A7672]">Meteora DLMM Seeding (17%)</span>
                  <span className="font-bold text-[#FF5C18] tabular-nums">
                    {formatCompactUsdc(dlmmSeedUsdc)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A7672]">Corporate MIDAO DAO LLC Fee</span>
                  <span className="font-bold text-[#111113] tabular-nums">
                    {formatCompactUsdc(legalFeeUsdc)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A7672]">Milestone Escrow Vault</span>
                  <span className="font-bold text-[#111113] tabular-nums">
                    {formatCompactUsdc(escrowVaultUsdc)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
