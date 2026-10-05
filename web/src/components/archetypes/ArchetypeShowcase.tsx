"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Cpu,
  Sparkles,
  Gamepad2,
  Building2,
  Server,
  Store,
  Music,
  Dna,
  Bot,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Flame,
  Coins,
  Lock,
  Percent,
} from "lucide-react";

export type ArchetypeId =
  | "commerce"
  | "saas"
  | "creator"
  | "casino"
  | "realestate"
  | "depin"
  | "franchise"
  | "media"
  | "desci"
  | "aiagent";

interface ArchetypeMeta {
  id: ArchetypeId;
  name: string;
  category: "Commerce & Consumer" | "Tech & AI" | "RWA & Physical" | "Next-Gen";
  icon: React.ElementType;
  tagline: string;
}

export const ARCHETYPES: ArchetypeMeta[] = [
  { id: "commerce", name: "Physical Commerce", category: "Commerce & Consumer", icon: Package, tagline: "14-Day Escrow Buffer & COGS Whitelist" },
  { id: "saas", name: "Growth SaaS & AI", category: "Tech & AI", icon: Cpu, tagline: "100% Reinvestment Mode & Buyback Burn" },
  { id: "creator", name: "Creator & Brands", category: "Commerce & Consumer", icon: Sparkles, tagline: "Utility Passes & Token-Gated Perks" },
  { id: "casino", name: "Gaming & Casino", category: "Commerce & Consumer", icon: Gamepad2, tagline: "Sub-Second House Edge Rake Stream" },
  { id: "realestate", name: "Real Estate RWAs", category: "RWA & Physical", icon: Building2, tagline: "Daily Rental Yield & Maintenance Escrow" },
  { id: "depin", name: "DePIN Compute", category: "Tech & AI", icon: Server, tagline: "GPU Cluster Leases & Operator Staking" },
  { id: "franchise", name: "Local Franchises", category: "RWA & Physical", icon: Store, tagline: "Solana Pay POS Splits & Local Patron Yield" },
  { id: "media", name: "Media & Music IP", category: "Commerce & Consumer", icon: Music, tagline: "Streaming API Royalty Waterfall" },
  { id: "desci", name: "DeSci Biomedical", category: "Next-Gen", icon: Dna, tagline: "Milestone Clinical Trial Tranches & Patent Waterfalls" },
  { id: "aiagent", name: "Autonomous AI Agents", category: "Next-Gen", icon: Bot, tagline: "Self-Sovereign AI Treasuries & Human Angel Yield" },
];

export function ArchetypeShowcase() {
  const [activeId, setActiveId] = useState<ArchetypeId>("commerce");

  // Interactive state variables
  const [isReinvestmentMode, setIsReinvestmentMode] = useState(true);
  const [mrr, setMrr] = useState(65000);
  const [computeCosts, setComputeCosts] = useState(22000);

  // Casino state
  const [simulatedBets, setSimulatedBets] = useState(1280);
  const [totalCasinoVolume, setTotalCasinoVolume] = useState(128000);
  const [totalRakeStreamed, setTotalRakeStreamed] = useState(3200);
  const [isSpinning, setIsSpinning] = useState(false);

  // Real Estate state
  const [unitsRented, setUnitsRented] = useState(24);
  const [dailyRentUsdc, setDailyRentUsdc] = useState(1440);

  // AI Agent state
  const [aiComputeTreasury, setAiComputeTreasury] = useState(18500);
  const [aiGrossRevenue, setAiGrossRevenue] = useState(42000);
  const [isSimulatingAgent, setIsSimulatingAgent] = useState(false);

  const activeMeta = ARCHETYPES.find((a) => a.id === activeId)!;

  const handleCasinoSpin = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      const bet = 100;
      const rake = bet * 0.025;
      setSimulatedBets((p) => p + 1);
      setTotalCasinoVolume((p) => p + bet);
      setTotalRakeStreamed((p) => p + rake);
    }, 500);
  };

  const handleAgentCycle = () => {
    setIsSimulatingAgent(true);
    setTimeout(() => {
      setIsSimulatingAgent(false);
      setAiGrossRevenue((p) => p + 1250);
      setAiComputeTreasury((p) => p + 250);
    }, 600);
  };

  return (
    <section className="w-full">
      {/* SECTION HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-peach-600">
          <Sparkles className="w-4 h-4" />
          <span>Universal Corporate Taxonomy on Solana</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-obsidian tracking-tight mt-1">
          The 10 Sovereign Corporate Archetypes
        </h2>
        <p className="text-sm text-slateText/85 mt-2 max-w-3xl leading-relaxed">
          The Delaware C-Corp is an analog relic. Ventrion provides tailored smart contract engines for every cash-flow
          reality—from physical retail supply chains and DePIN GPU clusters to autonomous on-chain AI corporations.
        </p>
      </div>

      {/* 10-ARCHETYPE SELECTOR CHIPS */}
      <div className="flex flex-wrap gap-2 mb-8 p-2 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/85 shadow-sm">
        {ARCHETYPES.map((arch) => {
          const Icon = arch.icon;
          const isActive = arch.id === activeId;
          return (
            <button
              key={arch.id}
              onClick={() => setActiveId(arch.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-obsidian text-white shadow-md scale-100"
                  : "bg-white/40 text-neutral-600 hover:text-obsidian hover:bg-white/80"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-peach-400" : "text-neutral-500"}`} />
              <span>{arch.name}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE ARCHETYPE DISPLAY */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* LEFT: ARCHITECTURAL DEEP DIVE (7 COLS) */}
          <div className="lg:col-span-7 p-7 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/90 shadow-porcelain flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-peach-700 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{activeMeta.category} • {activeMeta.tagline}</span>
              </div>
              <h3 className="text-2xl font-black text-obsidian mt-2 tracking-tight">
                {activeMeta.name}
              </h3>

              {/* Archetype Description */}
              <div className="mt-3 text-sm text-slateText/85 leading-relaxed space-y-3">
                {activeId === "commerce" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Physical brands suffer from inventory cash traps, delayed supplier wire transfers, and customer chargebacks.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Automated <strong>14-Day Return Escrow Buffer</strong>. Customer checkout funds are held in order escrow; COGS is strictly protected and payable only to governance-whitelisted factory addresses (e.g. Printful / OEM). Dividends trigger only upon verified delivery.
                    </p>
                  </>
                )}

                {activeId === "saas" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Early tech startups cannot bleed dividends—every dollar is needed for GPU compute, OpenAI API credits, and engineers.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> <strong>Growth Reinvestment Mode</strong> (<code>is_reinvestment_mode: true</code>). 100% of profit remains in the corporate treasury. Shareholder value compounds through secondary market liquidity (Raydium / Meteora) and automated on-chain <strong>Buyback & Burn</strong>.
                    </p>
                  </>
                )}

                {activeId === "creator" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Promising financial profit dividends to fans creates severe SEC/Howey-test securities liabilities.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Fan equity as <strong>Programmable Patronage Utility Passes</strong>. Value is delivered through token-gated access (VIP Discord, exclusive merch drops, content roadmap governance) with perpetual secondary trading royalties. Zero dividend liability.
                    </p>
                  </>
                )}

                {activeId === "casino" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Opaque house edge calculation and slow fiat casino payout processing.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Sub-second house edge rake streaming (e.g., 2.5% GGR). Every wager settled via Pyth/Switchboard VRF instantly routes a mathematical slice to the dividend pool. Staked shareholders back the segregated <strong>Bankroll Reserve Vault</strong> and earn real-time yield.
                    </p>
                  </>
                )}

                {activeId === "realestate" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Illiquidity, opaque property management fees, and manual monthly rent collection.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Fractional deed tokenization. Tenant rent paid in USDC streams daily dividends to token holders. Programmatic sweeps into a <strong>Maintenance Reserve Escrow</strong> and <strong>Seasonal Vacancy Buffer</strong> precede all payout waterfalls.
                    </p>
                  </>
                )}

                {activeId === "depin" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Capital-intensive GPU hardware acquisitions creating centralized hyperscaler monopolies.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> GPU Cluster Tokenization. AI researchers lease compute on an hourly waterfall; node operators post slashed staking bonds guaranteeing 99.9% uptime. Revenue streams block-by-block to hardware backers.
                    </p>
                  </>
                )}

                {activeId === "franchise" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> High centralized franchisor cuts and zero alignment with neighborhood customers.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Solana Pay Point-of-Sale (POS) Terminal Splits. On every coffee or meal sold, the transaction is atomically split: franchisor royalty fee slice, local operator operational funds, and a <strong>Local Patron Profit-Sharing Dividend</strong> paid to community holders.
                    </p>
                  </>
                )}

                {activeId === "media" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> Black-box label accounting, unpaid streaming royalties, and multi-year payout delays.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Intellectual property rights anchored into SPL equity tokens. Streaming API oracle feeds trigger immediate automated payouts across writers, producers, and financiers via the <strong>Rights-Holder Split Waterfall</strong>.
                    </p>
                  </>
                )}

                {activeId === "desci" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> The "Valley of Death"—the funding gap between academic laboratory breakthroughs and clinical trials.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Milestone IP-NFT licensing. Investors fund clinical trial tranches in escrow. Upon FDA/EMA milestone clearance, pharmaceutical licensing royalties stream directly to token holders.
                    </p>
                  </>
                )}

                {activeId === "aiagent" && (
                  <>
                    <p>
                      <strong>The Problem:</strong> AI agents have no legal personhood, no bank accounts, and cannot pay for their own infrastructure.
                    </p>
                    <p>
                      <strong>The Ventrion Engine:</strong> Self-owning on-chain AI corporations. The AI agent operates a Solana treasury, generates revenue (arbitrage, code generation, media creation), pays its own OpenAI/Anthropic/AWS bills, and streams excess profits as dividends to human angel backers.
                    </p>
                  </>
                )}
              </div>

              {/* Key Architecture Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-black/[0.05] text-center">
                <div className="p-2.5 rounded-xl bg-white/80 border border-black/[0.03]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Standard Mint</div>
                  <div className="text-xs font-mono font-bold text-obsidian mt-0.5">1,000,000 SPL</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-black/[0.03]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Anti-Rug Quorum</div>
                  <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">510,000 (51%)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-black/[0.03]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Settlement Speed</div>
                  <div className="text-xs font-mono font-bold text-indigo-700 mt-0.5">~400 ms</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-black/[0.03]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Base Protocol Fee</div>
                  <div className="text-xs font-mono font-bold text-peach-600 mt-0.5">75 BPS (0.75%)</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.04] flex items-center justify-between text-xs text-neutral-500">
              <span>Legal Layer: <code className="font-mono text-obsidian">Wyoming DUNA / Swiss Verein Wrapper</code></span>
              <span className="font-semibold text-emerald-700">Anchor Validated</span>
            </div>
          </div>

          {/* RIGHT: DYNAMIC SIMULATOR WIDGET (5 COLS) */}
          <div className="lg:col-span-5 p-7 rounded-[32px] bg-white/80 backdrop-blur-xl border border-white/95 shadow-porcelain flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Interactive On-Chain Sandbox
              </div>
              <h4 className="text-lg font-bold text-obsidian mt-1">
                {activeId === "commerce" && "14-Day Dispute & Delivery Escrow"}
                {activeId === "saas" && "Growth Reinvestment vs Dividend Bleed"}
                {activeId === "creator" && "Fan Utility Pass Perks & Tier Gating"}
                {activeId === "casino" && "Sub-Second House Edge Rake Simulator"}
                {activeId === "realestate" && "Daily Rental Yield & Maintenance Vault"}
                {activeId === "depin" && "GPU Compute Lease & Node Slashing"}
                {activeId === "franchise" && "Point-of-Sale Real-Time Splitting"}
                {activeId === "media" && "Streaming API Royalty Waterfall"}
                {activeId === "desci" && "Milestone Clinical Trial Tranches"}
                {activeId === "aiagent" && "Autonomous AI Agent Treasury Cycle"}
              </h4>

              {/* Dynamic Interactive Panel */}
              <div className="mt-5">
                {/* SAAS CONTROLS */}
                {activeId === "saas" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-2xl bg-white/90 border border-black/5">
                      <span className="text-xs font-bold text-obsidian">Mode</span>
                      <button
                        onClick={() => setIsReinvestmentMode(!isReinvestmentMode)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          isReinvestmentMode ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isReinvestmentMode ? "Growth (0% Div)" : "Dividends Active"}
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-600 mb-1">
                        <span>MRR</span>
                        <span className="font-bold font-mono text-obsidian">${mrr.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="20000"
                        max="200000"
                        step="5000"
                        value={mrr}
                        onChange={(e) => setMrr(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-porcelain-100 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Compute Treasury:</span>
                        <span className="font-bold text-indigo-700">${isReinvestmentMode ? (mrr - computeCosts).toLocaleString() : 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Secondary Buyback:</span>
                        <span className="font-bold text-peach-600">${isReinvestmentMode ? ((mrr - computeCosts) * 0.25).toFixed(0) : 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASINO CONTROLS */}
                {activeId === "casino" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                      <div className="flex justify-between">
                        <span className="text-amber-800">Total Wager Volume:</span>
                        <span className="font-bold font-mono text-amber-950">${totalCasinoVolume.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-amber-800">Rake to Dividend Vault (2.5%):</span>
                        <span className="font-black font-mono text-amber-900">${totalRakeStreamed.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      disabled={isSpinning}
                      onClick={handleCasinoSpin}
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-obsidian font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>{isSpinning ? "Settling VRF Spin..." : "Simulate $100 Bet (Stream +$2.50 Rake)"}</span>
                    </button>
                  </div>
                )}

                {/* AI AGENT CONTROLS */}
                {activeId === "aiagent" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-indigo-800">Agent Sovereign Treasury:</span>
                        <span className="font-bold font-mono text-indigo-950">${aiComputeTreasury.toLocaleString()} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-800">Cumulative Revenue:</span>
                        <span className="font-bold font-mono text-emerald-800">${aiGrossRevenue.toLocaleString()} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-800">Human Angel Dividend Pool:</span>
                        <span className="font-bold font-mono text-peach-600">${(aiGrossRevenue * 0.4).toFixed(0)} USDC</span>
                      </div>
                    </div>

                    <button
                      disabled={isSimulatingAgent}
                      onClick={handleAgentCycle}
                      className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Bot className="w-4 h-4 text-peach-400" />
                      <span>{isSimulatingAgent ? "Executing AI Tasks..." : "Simulate Agent Task (+ $1,250 Revenue)"}</span>
                    </button>
                  </div>
                )}

                {/* REAL ESTATE CONTROLS */}
                {activeId === "realestate" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-emerald-800">Active Tenant Leases:</span>
                        <span className="font-bold font-mono text-emerald-950">{unitsRented} Units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-800">Daily Rental Stream:</span>
                        <span className="font-bold font-mono text-emerald-950">${dailyRentUsdc} USDC/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-800">Maintenance Escrow (15%):</span>
                        <span className="font-bold font-mono text-neutral-700">${(dailyRentUsdc * 0.15).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-800">Net Daily Payout to 1M Shares:</span>
                        <span className="font-black font-mono text-emerald-900">${(dailyRentUsdc * 0.85).toFixed(2)} USDC</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DEFAULT GENERIC ARCHETYPE METRICS FOR OTHERS */}
                {["commerce", "creator", "depin", "franchise", "media", "desci"].includes(activeId) && (
                  <div className="p-4 rounded-2xl bg-porcelain-100 text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Contract State:</span>
                      <span className="font-mono font-bold text-emerald-700">Initialized (PDA)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Waterfall Latency:</span>
                      <span className="font-mono font-bold text-obsidian">~400ms (1 Slot)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Accounting Precision:</span>
                      <span className="font-mono font-bold text-indigo-700">10^12 Scaled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Governance Threshold:</span>
                      <span className="font-mono font-bold text-obsidian">510,000 / 1,000,000</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  const elem = document.getElementById("funding");
                  if (elem) elem.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-3 rounded-2xl bg-obsidian text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black/90 transition-all shadow-md"
              >
                <span>Launch Venture in this Archetype</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
