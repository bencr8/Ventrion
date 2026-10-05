"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/common/Navbar";
import { SolanaPayModal } from "../../components/checkout/SolanaPayModal";
import { WaterfallSplitVisualizer } from "../../components/checkout/WaterfallSplitVisualizer";
import { VERIFIED_VENTURES, VentureProduct } from "../../lib/venturesData";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Cpu,
  Zap,
  RotateCcw
} from "lucide-react";

export default function DemoShopPage() {
  const allProducts = VERIFIED_VENTURES.flatMap((v) =>
    v.products.map((p) => ({ ...p, ventureName: v.name, ventureSymbol: v.symbol }))
  );

  const [selectedProduct, setSelectedProduct] = useState<any>(allProducts[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    product: any;
    grossUsdc: number;
    operatingUsdc: number;
    dividendUsdc: number;
    txSignature: string;
    timestamp: Date;
  } | null>(null);

  const handleBuyClick = (prod: any) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    const gross = selectedProduct.priceUsdc;
    const div = Number((gross * (selectedProduct.dividendSplitPercentage / 100)).toFixed(2));
    const op = Number((gross - div).toFixed(2));
    
    // Simulate real devnet-style tx signature
    const sampleSig = "4vWp" + Math.random().toString(36).substring(2, 10) + "7Yt4xXiyTJD1gN2Bz2c3FoyTWWqFZMsWApoe";

    setLastPayment({
      product: selectedProduct,
      grossUsdc: gross,
      operatingUsdc: op,
      dividendUsdc: div,
      txSignature: sampleSig,
      timestamp: new Date(),
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] relative overflow-x-clip flex flex-col justify-between selection:bg-[#F68D66]/20 font-jakarta">
      {/* Studio Lighting */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-[1700px] h-[750px] bg-[radial-gradient(ellipse_85%_60%_at_50%_-5%,rgba(255,255,255,1)_0%,rgba(255,251,245,0.75)_35%,rgba(252,246,238,0.28)_65%,transparent_100%)] pointer-events-none -z-0" />

      <Navbar activeTab="demo-shop" />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-8 sm:py-12 z-10 relative">
        {/* Banner */}
        <div className="mb-10 pb-8 border-b border-black/[0.06]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF5C18]/10 text-[#FF5C18] border border-[#FF5C18]/20 mb-3">
            <Zap className="w-3.5 h-3.5" />
            Live Commercial Revenue Demonstration
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111113]">
            Commercial Demo Shop
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[#666360] max-w-2xl leading-relaxed">
            Unlike speculative meme tokens, Ventrion startups sell physical hardware, API access, and enterprise software. 
            Experience how real customer payments trigger instant 20% programmatic dividend waterfalls to shareholders on Solana!
          </p>
        </div>

        {/* Live Transaction / Waterfall Alert if payment made */}
        {lastPayment && (
          <div className="mb-10 p-6 sm:p-8 rounded-[32px] bg-white border border-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.08)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111113]">
                    Payment Confirmed: ${lastPayment.grossUsdc.toFixed(2)} USDC Received!
                  </h3>
                  <p className="text-xs text-[#666]">
                    Purchased <span className="font-semibold text-[#111113]">{lastPayment.product.name}</span> from {lastPayment.product.ventureName}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#8E8B88]">
                <span>Tx Hash: <span className="font-mono text-[#333]">{lastPayment.txSignature.slice(0, 14)}...</span></span>
              </div>
            </div>

            {/* Waterfall Split Component */}
            <WaterfallSplitVisualizer
              priceUsdc={lastPayment.grossUsdc}
              cogsUsdc={lastPayment.product.cogsUsdc}
            />

            <div className="mt-4 pt-4 border-t border-black/[0.04] flex items-center justify-between text-xs text-[#777]">
              <span>Dividend Vault: <span className="font-semibold text-emerald-600">+$ {lastPayment.dividendUsdc.toFixed(2)} USDC added to acc_dividend</span></span>
              <button
                onClick={() => setLastPayment(null)}
                className="text-xs text-[#8E8B88] hover:text-[#111113] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {allProducts.map((prod) => (
            <div
              key={prod.id}
              className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/95 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-[#FF5C18]">{prod.ventureSymbol}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold text-[11px]">
                    20% Dividend Stream
                  </span>
                </div>

                <div className="h-40 rounded-2xl bg-[#F6F3EE] flex items-center justify-center p-6 mb-4 relative overflow-hidden">
                  <Cpu className="w-16 h-16 text-[#8E8B88]/40" />
                  <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-[#555] bg-white/80 px-2.5 py-1 rounded-full backdrop-blur-md">
                    Gross Margin: {prod.grossMarginPercentage}%
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#111113] mb-1">
                  {prod.name}
                </h3>
                <p className="text-xs text-[#666] line-clamp-3 mb-4 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between pt-4 border-t border-black/[0.04] mb-4">
                  <div>
                    <span className="text-xs text-[#777]">Price</span>
                    <div className="text-2xl font-extrabold text-[#111113]">
                      ${prod.priceUsdc.toFixed(2)} <span className="text-xs font-semibold text-[#777]">USDC</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-emerald-600 font-semibold">
                    +${(prod.priceUsdc * 0.2).toFixed(2)} to Shareholders
                  </div>
                </div>

                <button
                  onClick={() => handleBuyClick(prod)}
                  className="w-full py-3 rounded-full bg-[#111113] hover:bg-black text-white font-semibold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy with Solana Pay
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Informational Callout */}
        <div className="p-8 rounded-[32px] bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent border border-[#FF5C18]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-[#111113] mb-1">
              Want to see the shareholder side of these dividends?
            </h4>
            <p className="text-sm text-[#666] max-w-xl">
              Inspect the Cap Table and lock your tokens into Pool B to amplify your dividend distribution weight!
            </p>
          </div>
          <Link
            href="/startups"
            className="px-6 py-3 rounded-full bg-white text-[#111113] font-semibold text-xs border border-black/10 shadow-sm hover:bg-[#111113] hover:text-white transition-all whitespace-nowrap"
          >
            Explore Startups & Cap Tables →
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8E8B88] border-t border-black/[0.04]">
        <span>© 2026 Ventrion Protocol. Built on Solana Devnet & Meteora DBC.</span>
        <div className="flex items-center gap-4">
          <Link href="/startups" className="hover:text-black">Startups</Link>
          <Link href="/governance" className="hover:text-black">Governance</Link>
        </div>
      </footer>

      {/* Solana Pay Modal */}
      {selectedProduct && (
        <SolanaPayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          priceUsdc={selectedProduct.priceUsdc}
          cogsUsdc={selectedProduct.cogsUsdc}
        />
      )}
    </div>
  );
}
