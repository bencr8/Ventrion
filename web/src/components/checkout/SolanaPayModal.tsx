"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Check, ShoppingBag, Zap, ShieldCheck } from "lucide-react";
import { WaterfallSplitVisualizer } from "./WaterfallSplitVisualizer";

interface SolanaPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  priceUsdc: number;
  cogsUsdc: number;
}

export function SolanaPayModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  priceUsdc = 60.0,
  cogsUsdc = 24.0,
}: SolanaPayModalProps) {
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Real Solana Pay specification URI
  const recipient = "9xQeWvG816bUx9EPjHmaT23yvVM2VXmzLsDaA88Wv";
  const solanaPayUri = `solana:${recipient}?amount=${priceUsdc}&label=Ventrion%20Genesis%20Hoodie&message=Order%20%23VENT-1092&memo=VentrionProtocol`;

  const handleSimulatedPay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
        setSuccess(false);
        onClose();
      }, 1400);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-porcelain-100 rounded-[28px] border border-white/90 shadow-2xl p-7 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/60 border border-black/10 flex items-center justify-center text-neutral-500 hover:text-obsidian hover:bg-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian text-white flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                Solana Pay E-Commerce Checkout
              </div>
              <h2 className="text-xl font-extrabold text-obsidian">
                Genesis Heavyweight Hoodie
              </h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Solana Pay QR Code */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-black/[0.06]">
                <QRCodeSVG
                  value={solanaPayUri}
                  size={170}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-slateText/80 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Scan with Phantom or Backpack</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Instant On-Chain Settlement
              </div>
            </div>

            {/* Right: Order Summary & Action */}
            <div className="flex flex-col justify-between h-full py-1">
              <div>
                <div className="text-sm font-semibold text-obsidian">
                  Order Breakdown
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slateText">
                    <span>1x Ventrion Physical Hoodie (L)</span>
                    <span className="font-mono font-medium">${priceUsdc.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Solana Network Fee</span>
                    <span className="font-mono text-emerald-600">&lt; $0.0005</span>
                  </div>
                  <div className="pt-2 border-t border-black/10 flex justify-between text-base font-extrabold text-obsidian">
                    <span>Total</span>
                    <span className="font-mono text-obsidian">${priceUsdc.toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={paying || success}
                  onClick={handleSimulatedPay}
                  className={`w-full py-3.5 px-5 rounded-full font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                    success
                      ? "bg-emerald-600 text-white"
                      : "bg-obsidian text-white hover:bg-black/90"
                  }`}
                >
                  {paying ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Executing Smart Contract Waterfall...</span>
                    </>
                  ) : success ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Order Confirmed & Split!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-peach-400" />
                      <span>Sign & Pay ${priceUsdc.toFixed(2)} USDC</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Embedded Waterfall Breakdown */}
          <div className="mt-6">
            <WaterfallSplitVisualizer
              priceUsdc={priceUsdc}
              cogsUsdc={cogsUsdc}
              reserveRateBps={1000}
              ceoSalaryBps={500}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
