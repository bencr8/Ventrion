"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Navbar } from "../../../components/common/Navbar";
import { formatCompactUsdc, formatCompactShares } from "../../../lib/formatters";
import { TOTAL_SHARES } from "../../../lib/constants";
import { executeLaunchGenesis } from "../../../lib/solana/walletTransactionRunner";

interface TrancheItem {
  id: string;
  name: string;
  scope: string;
  percent: number;
}

export default function LaunchVenturePage() {
  const router = useRouter();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();

  // Navigation steps
  const [activeStep, setActiveStep] = useState<"identity" | "capital" | "milestones">("identity");

  // SECTION 1: Company Identity & Media (No prefilled data)
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");

  // Logo & Banner
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [metadataUri, setMetadataUri] = useState<string>("");

  // SECTION 2: Capital Formation (1% - 49% for Sale per Manifest)
  const [equitySalePercent, setEquitySalePercent] = useState<number>(20); // 20%
  const [fundingTargetUsdc, setFundingTargetUsdc] = useState<number>(50000); // $50k USDC
  const [upfrontRunwayPercent, setUpfrontRunwayPercent] = useState<number>(15); // 15% upfront
  const [vestingCliffMonths, setVestingCliffMonths] = useState<number>(6); // 6 months
  const [vestingDurationYears, setVestingDurationYears] = useState<number>(2); // 2 years

  // SECTION 3: Milestone Tranches (1 to 10 Tranches, fully customizable - no prefilled text)
  const [tranches, setTranches] = useState<TrancheItem[]>([
    {
      id: "1",
      name: "",
      scope: "",
      percent: 100,
    },
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

  // Milestone sum check
  const totalTranchePercent = useMemo(() => {
    return tranches.reduce((sum, t) => sum + (Number(t.percent) || 0), 0);
  }, [tranches]);

  // Refs for tactile clicking
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Sync to backend metadata API
  const syncMetadata = async (logoData?: string, bannerData?: string) => {
    if (!name.trim() && !symbol.trim()) return;
    setIsUploadingMedia(true);
    try {
      const res = await fetch("/ventrion/api/ventures/upload-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim() || "VENTURE",
          name: name.trim() || "Ventrion Enterprise",
          description: description.trim() || "",
          logoDataUrl: logoData || logoPreview || undefined,
          bannerDataUrl: bannerData || bannerPreview || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.uri) setMetadataUri(json.uri);
      } else {
        const fallbackSymbol = (symbol.trim() || "token").toLowerCase();
        setMetadataUri(`https://ventrion.fun/metadata/${fallbackSymbol}_metadata.json`);
      }
    } catch {
      const fallbackSymbol = (symbol.trim() || "token").toLowerCase();
      setMetadataUri(`https://ventrion.fun/metadata/${fallbackSymbol}_metadata.json`);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      syncMetadata(dataUrl, undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBannerPreview(dataUrl);
      syncMetadata(undefined, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Milestone modifications
  const handleAddTranche = () => {
    if (tranches.length >= 10) return;
    const remaining = Math.max(0, 100 - totalTranchePercent);
    const newTranche: TrancheItem = {
      id: String(Date.now()),
      name: "",
      scope: "",
      percent: remaining,
    };
    setTranches([...tranches, newTranche]);
  };

  const handleDeleteTranche = (idx: number) => {
    if (tranches.length <= 1) return;
    const updated = tranches.filter((_, i) => i !== idx);
    setTranches(updated);
  };

  const handleAllocateRemaining = (idx: number) => {
    const otherSum = tranches.reduce((sum, t, i) => (i === idx ? sum : sum + (Number(t.percent) || 0)), 0);
    const remaining = Math.max(0, 100 - otherSum);
    const updated = [...tranches];
    updated[idx].percent = remaining;
    setTranches(updated);
  };

  // Launch state
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStepIndex, setLaunchStepIndex] = useState(0);
  const [confirmedTx, setConfirmedTx] = useState<string | null>(null);

  const handleLaunchGenesis = async () => {
    if (!connected || !publicKey) {
      alert("Please connect your Solana wallet before launching a venture.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter a Company Legal Name in Step 1.");
      setActiveStep("identity");
      nameInputRef.current?.focus();
      return;
    }

    if (!symbol.trim()) {
      alert("Please enter a Ticker Symbol in Step 1.");
      setActiveStep("identity");
      symbolInputRef.current?.focus();
      return;
    }

    if (!description.trim()) {
      alert("Please enter an Enterprise Overview & Thesis in Step 1.");
      setActiveStep("identity");
      descInputRef.current?.focus();
      return;
    }

    if (totalTranchePercent !== 100) {
      alert(`Milestone percentages must sum up to exactly 100% (currently ${totalTranchePercent}%).`);
      return;
    }

    setIsLaunching(true);
    setConfirmedTx(null);

    try {
      setLaunchStepIndex(1); // Building transaction & deriving PDAs

      let effectiveUri = metadataUri;
      if (!effectiveUri) {
        try {
          const res = await fetch("/ventrion/api/ventures/upload-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              symbol: symbol.trim().toUpperCase(),
              name: name.trim(),
              description: description.trim(),
              logoDataUrl: logoPreview || undefined,
              bannerDataUrl: bannerPreview || undefined,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.uri) effectiveUri = json.uri;
          }
        } catch (e) {
          console.warn("Metadata sync warning:", e);
        }
      }
      if (!effectiveUri || effectiveUri.startsWith("/")) {
        effectiveUri = `https://ventrion.fun/metadata/${symbol.trim().toLowerCase()}_metadata.json`;
      }

      const formattedMilestones = tranches.map((t, idx) => ({
        percentageBps: Math.round((Number(t.percent) || 0) * 100),
        targetDays: (idx + 1) * 30,
      }));
      const totalBps = formattedMilestones.reduce((acc, m) => acc + m.percentageBps, 0);
      if (totalBps !== 10000 && formattedMilestones.length > 0) {
        formattedMilestones[formattedMilestones.length - 1].percentageBps += (10000 - totalBps);
      }

      setLaunchStepIndex(2); // Requesting wallet signature for company mint & fee payer
      const { signature, companyMint } = await executeLaunchGenesis(
        {
          founderPubkey: publicKey.toBase58(),
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          uri: effectiveUri,
          equitySalePercent,
          fundingTargetUsdc,
          upfrontRunwayPercent,
          vestingCliffMonths,
          vestingDurationYears,
          milestones: formattedMilestones,
        },
        wallet,
        connection
      );

      setLaunchStepIndex(3); // Broadcasted & confirmed on Solana Devnet
      setConfirmedTx(signature);
      setLaunchStepIndex(4); // Finalizing genesis

      // Redirect directly to the launched venture terminal by contract address
      const targetUrl = `/ventures/${companyMint}`;
      router.push(targetUrl);
    } catch (err: any) {
      console.error("Genesis launch failed:", err);
      setIsLaunching(false);
      alert(`Genesis Launch Failed: ${err?.message || "Transaction rejected or network error"}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#FF5C18]/15 font-jakarta antialiased">
      <Navbar activeTab="my-ventures" />

      {/* FULLSCREEN CINEMATIC GENESIS LOADING & REDIRECT SCREEN */}
      <AnimatePresence>
        {isLaunching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="w-full max-w-md space-y-8 font-mono">
              {/* Venture Icon */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-white border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-xl text-[#111113]">{(symbol || "VEN").slice(0, 3)}</span>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold font-jakarta text-[#111113] tracking-tight">
                  Launching {name || "Venture"}
                </h2>
                <div className="text-xs text-[#7A7672]">
                  ${symbol || "TOKEN"} Genesis Issuance on Solana Devnet
                </div>
              </div>

              {/* Progress Steps */}
              <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs text-xs space-y-3 text-left">
                {[
                  { step: 1, text: "Deriving on-chain PDAs & generating Company Mint" },
                  { step: 2, text: "Signing Anchor Genesis instruction with your wallet" },
                  { step: 3, text: "Broadcasting & confirming 1,000,000 shares on Devnet" },
                  { step: 4, text: "Genesis confirmed! Opening venture terminal..." },
                ].map((s) => {
                  const isDone = launchStepIndex > s.step;
                  const isCurrent = launchStepIndex === s.step;
                  return (
                    <div
                      key={s.step}
                      className={`flex items-center gap-3 transition-opacity ${
                        isDone
                          ? "text-[#111113]"
                          : isCurrent
                          ? "text-[#111113] font-bold"
                          : "text-[#7A7672]/40"
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isDone ? (
                          <div className="w-2 h-2 rounded-full bg-[#111113]" />
                        ) : isCurrent ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C18] animate-ping" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-black/15" />
                        )}
                      </div>
                      <span>{s.text}</span>
                    </div>
                  );
                })}

                {confirmedTx && (
                  <div className="pt-2 text-center border-t border-black/[0.04]">
                    <a
                      href={`https://explorer.solana.com/tx/${confirmedTx}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#FF5C18] hover:underline font-mono inline-flex items-center gap-1 font-bold"
                    >
                      <span>View on Solana Explorer ({confirmedTx.slice(0, 4)}...{confirmedTx.slice(-4)}) ↗</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="h-1.5 w-full bg-black/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#111113]"
                  initial={{ width: "15%" }}
                  animate={{
                    width:
                      launchStepIndex === 1
                        ? "35%"
                        : launchStepIndex === 2
                        ? "65%"
                        : launchStepIndex === 3
                        ? "90%"
                        : "100%",
                  }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 z-10 space-y-8">
        {/* Top Header */}
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

          {/* Stepper Tabs with sliding pill */}
          <div className="p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] inline-flex items-center gap-1">
            {[
              { id: "identity", label: "01 Identity & Media" },
              { id: "capital", label: "02 Capital Structure" },
              { id: "milestones", label: "03 Milestones" },
            ].map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id as any)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="launchStepPill"
                      className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 480, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN TERMINAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLUMNS: CONFIGURATION WORKSPACE */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: IDENTITY & MEDIA */}
            {activeStep === "identity" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6">
                  {/* Media Uploads Grid: Logo & Banner */}
                  <div className="space-y-4">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A7672] block">
                      Decentralized Media Assets (Metaplex Standard)
                    </span>

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerSelect}
                      className="hidden"
                    />

                    {/* Banner Upload Box */}
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="group relative w-full h-36 sm:h-44 rounded-2xl bg-[#F7F5F0]/60 border border-dashed border-black/[0.12] hover:border-black/[0.3] overflow-hidden transition-all duration-200 cursor-pointer flex items-center justify-center"
                    >
                      {bannerPreview ? (
                        <>
                          <img
                            src={bannerPreview}
                            alt="Banner Preview"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs">
                            Click to change Banner
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#7A7672]">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-xs font-semibold">Upload Enterprise Banner (Wide Header)</span>
                        </div>
                      )}
                    </div>

                    {/* Logo Upload Box */}
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-dashed border-black/[0.12] hover:border-black/[0.3] transition-all duration-200 cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-black/[0.08] shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-5 h-5 text-[#7A7672]" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-[#111113]">
                          {isUploadingMedia ? "Indexing metadata on server..." : "Upload Brand Avatar / Token Icon"}
                        </div>
                        <p className="text-[11px] text-[#7A7672]">
                          Permanent off-chain Metaplex metadata indexed for wallet displays.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Name & Symbol with Luminous Focus Effect */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => nameInputRef.current?.focus()}
                      className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:bg-white focus-within:border-[#111113] focus-within:shadow-[0_0_0_2px_rgba(17,17,19,0.08),0_4px_20px_rgba(255,92,24,0.06)] focus-within:scale-[1.01] transition-all duration-200 cursor-text space-y-1"
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
                      className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:bg-white focus-within:border-[#111113] focus-within:shadow-[0_0_0_2px_rgba(17,17,19,0.08),0_4px_20px_rgba(255,92,24,0.06)] focus-within:scale-[1.01] transition-all duration-200 cursor-text space-y-1"
                    >
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7672] block">
                        Ticker Symbol
                      </span>
                      <input
                        ref={symbolInputRef}
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="e.g. ACMX"
                        maxLength={6}
                        className="w-full bg-transparent font-mono font-bold text-sm text-[#111113] uppercase outline-none"
                      />
                    </div>
                  </div>

                  {/* Description with Luminous Focus Effect */}
                  <div
                    onClick={() => descInputRef.current?.focus()}
                    className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:bg-white focus-within:border-[#111113] focus-within:shadow-[0_0_0_2px_rgba(17,17,19,0.08),0_4px_20px_rgba(255,92,24,0.06)] focus-within:scale-[1.01] transition-all duration-200 cursor-text space-y-1"
                  >
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A7672] block">
                      Enterprise Overview &amp; Thesis
                    </span>
                    <textarea
                      ref={descInputRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter enterprise vision, product thesis, revenue model, and commercial roadmap..."
                      rows={3}
                      className="w-full bg-transparent text-xs text-[#111113] outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        if (!name.trim()) {
                          alert("Please enter a Company Legal Name.");
                          nameInputRef.current?.focus();
                          return;
                        }
                        if (!symbol.trim()) {
                          alert("Please enter a Ticker Symbol.");
                          symbolInputRef.current?.focus();
                          return;
                        }
                        if (!description.trim()) {
                          alert("Please enter an Enterprise Overview & Thesis.");
                          descInputRef.current?.focus();
                          return;
                        }
                        setActiveStep("capital");
                      }}
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
                      <div>
                        <span className="font-semibold text-[#111113] block">Equity Offered for Sale</span>
                        <span className="text-[11px] text-[#7A7672]">Strictly capped between 1% and 49% per Manifest</span>
                      </div>
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

                    {/* Presets in visual pill container with sliding effect */}
                    <div className="p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] inline-flex items-center gap-1">
                      {[10, 15, 20, 25, 30, 40].map((preset) => {
                        const isActive = equitySalePercent === preset;
                        return (
                          <button
                            key={preset}
                            onClick={() => setEquitySalePercent(preset)}
                            className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                              isActive ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="equityPresetPill"
                                className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                                transition={{ type: "spring", stiffness: 480, damping: 35 }}
                              />
                            )}
                            <span className="relative z-10">{preset}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Funding Target in USDC with Luminous Focus Effect */}
                  <div
                    onClick={() => targetInputRef.current?.focus()}
                    className="p-5 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:bg-white focus-within:border-[#111113] focus-within:shadow-[0_0_0_2px_rgba(17,17,19,0.08),0_4px_24px_rgba(255,92,24,0.06)] focus-within:scale-[1.01] transition-all duration-200 cursor-text space-y-3"
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

                    {/* Presets in visual pill container with sliding effect */}
                    <div className="p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] inline-flex items-center gap-1 font-jakarta">
                      {[25000, 50000, 100000, 250000].map((preset) => {
                        const isActive = fundingTargetUsdc === preset;
                        return (
                          <button
                            key={preset}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFundingTargetUsdc(preset);
                            }}
                            className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                              isActive ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="targetPresetPill"
                                className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                                transition={{ type: "spring", stiffness: 480, damping: 35 }}
                              />
                            )}
                            <span className="relative z-10">${preset / 1000}k</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upfront Runway Selection with sliding pill */}
                  <div className="p-4 rounded-2xl bg-[#F7F5F0]/40 border border-black/[0.04] space-y-2 font-jakarta">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#111113]">Upfront Working Capital Runway</span>
                      <span className="font-mono text-[#7A7672]">{upfrontRunwayPercent}% ({formatCompactUsdc(upfrontUsdc)})</span>
                    </div>

                    <div className="p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] grid grid-cols-4 gap-1">
                      {[10, 15, 20, 25].map((u) => {
                        const isActive = upfrontRunwayPercent === u;
                        return (
                          <button
                            key={u}
                            onClick={() => setUpfrontRunwayPercent(u)}
                            className={`relative py-2 text-center text-xs font-semibold transition-colors cursor-pointer ${
                              isActive ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="runwayPill"
                                className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                                transition={{ type: "spring", stiffness: 480, damping: 35 }}
                              />
                            )}
                            <span className="relative z-10">{u}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Founder Vesting Settings with sliding pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-jakarta">
                    {/* Cliff Period */}
                    <div className="p-4 rounded-2xl bg-[#F7F5F0]/40 border border-black/[0.04] space-y-2">
                      <span className="text-xs font-semibold text-[#111113] block">Cliff Period</span>
                      <div className="p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] grid grid-cols-2 gap-1">
                        {[6, 12].map((m) => {
                          const isActive = vestingCliffMonths === m;
                          return (
                            <button
                              key={m}
                              onClick={() => setVestingCliffMonths(m)}
                              className={`relative py-2 text-center text-xs font-semibold transition-colors cursor-pointer ${
                                isActive ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="cliffPill"
                                  className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                                  transition={{ type: "spring", stiffness: 480, damping: 35 }}
                                />
                              )}
                              <span className="relative z-10">{m} Months</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total Lock Duration */}
                    <div className="p-4 rounded-2xl bg-[#F7F5F0]/40 border border-black/[0.04] space-y-2">
                      <span className="text-xs font-semibold text-[#111113] block">Total Lock Duration</span>
                      <div className="p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] grid grid-cols-3 gap-1">
                        {[1, 2, 3].map((y) => {
                          const isActive = vestingDurationYears === y;
                          return (
                            <button
                              key={y}
                              onClick={() => setVestingDurationYears(y)}
                              className={`relative py-2 text-center text-xs font-semibold transition-colors cursor-pointer ${
                                isActive ? "text-white" : "text-[#7A7672] hover:text-[#111113]"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="lockDurationPill"
                                  className="absolute inset-0 bg-[#111113] rounded-xl shadow-xs"
                                  transition={{ type: "spring", stiffness: 480, damping: 35 }}
                                />
                              )}
                              <span className="relative z-10">{y} {y === 1 ? "Yr" : "Yrs"}</span>
                            </button>
                          );
                        })}
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

            {/* STEP 3: MILESTONE TRANCHES (UP TO 10, FULLY CUSTOMIZABLE, SCROLLABLE) */}
            {activeStep === "milestones" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-6 font-mono">
                  {/* Milestones Header with Allocation Sum Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/[0.06] font-jakarta">
                    <h2 className="text-base font-bold text-[#111113]">Milestones ({tranches.length}/10)</h2>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        totalTranchePercent === 100
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : totalTranchePercent < 100
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {totalTranchePercent}% / 100%
                      </div>

                      {tranches.length < 10 && (
                        <button
                          onClick={handleAddTranche}
                          className="px-3 py-1.5 rounded-xl bg-[#111113] text-white text-xs font-semibold hover:bg-black transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Milestone</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Milestones Container (Up to 10 Tranches) */}
                  <div className="max-h-[380px] overflow-y-auto pr-1.5 space-y-3">
                    {tranches.map((t, idx) => {
                      const trancheUsdc = (escrowVaultUsdc * (Number(t.percent) || 0)) / 100;
                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl bg-[#F7F5F0]/60 border border-black/[0.06] hover:border-black/[0.15] focus-within:bg-white focus-within:border-[#111113] focus-within:shadow-[0_0_0_2px_rgba(17,17,19,0.08),0_4px_20px_rgba(255,92,24,0.06)] transition-all duration-200 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#111113]">
                                Milestone #{idx + 1}
                              </span>
                              <span className="text-[11px] font-mono text-[#7A7672] tabular-nums">
                                · {formatCompactUsdc(trancheUsdc)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Percentage input */}
                              <div className="flex items-center gap-1 bg-black/[0.04] px-2.5 py-1 rounded-xl">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={t.percent}
                                  onChange={(e) => {
                                    const updated = [...tranches];
                                    updated[idx].percent = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    setTranches(updated);
                                  }}
                                  className="w-12 bg-transparent text-right font-bold text-xs text-[#111113] outline-none tabular-nums"
                                />
                                <span className="text-xs text-[#7A7672]">%</span>
                              </div>

                              {/* Allocate Remaining Button */}
                              <button
                                onClick={() => handleAllocateRemaining(idx)}
                                title="Assign all unallocated percentage to this milestone"
                                className="px-2 py-1 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[10px] font-semibold text-[#111113] transition-colors cursor-pointer"
                              >
                                Set Remaining
                              </button>

                              {/* Delete button */}
                              {tranches.length > 1 && (
                                <button
                                  onClick={() => handleDeleteTranche(idx)}
                                  className="p-1 text-[#7A7672] hover:text-red-600 transition-colors cursor-pointer"
                                  title="Remove milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Milestone Title Input */}
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={t.name}
                              onChange={(e) => {
                                const updated = [...tranches];
                                updated[idx].name = e.target.value;
                                setTranches(updated);
                              }}
                              placeholder={`Milestone #${idx + 1} Deliverable Title`}
                              className="w-full bg-transparent text-xs font-semibold text-[#111113] font-jakarta outline-none"
                            />
                          </div>

                          {/* Milestone Scope Textarea */}
                          <div className="space-y-1">
                            <textarea
                              value={t.scope}
                              onChange={(e) => {
                                const updated = [...tranches];
                                updated[idx].scope = e.target.value;
                                setTranches(updated);
                              }}
                              rows={2}
                              placeholder="Detailed scope, technical benchmarks, and verification deliverables..."
                              className="w-full bg-transparent text-[11px] text-[#7A7672] font-jakarta outline-none resize-none leading-relaxed"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action / Launch Button */}
                  <div className="pt-4 border-t border-black/[0.06] font-jakarta">
                    <button
                      onClick={handleLaunchGenesis}
                      disabled={isLaunching || totalTranchePercent !== 100}
                      className="w-full py-4 rounded-2xl bg-[#111113] hover:bg-black text-white text-sm font-semibold transition-all hover:scale-[1.005] active:scale-[0.995] shadow-md hover:shadow-black/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>
                        {isLaunching
                          ? "Broadcasting Genesis..."
                          : totalTranchePercent !== 100
                          ? `Allocate Exactly 100% (${totalTranchePercent}%)`
                          : "Launch Venture Genesis"}
                      </span>
                    </button>
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
