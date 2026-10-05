"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDualWallet } from "./DualModeWalletContext";

export function DualModeWalletModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    connectEphemeral,
    ephemeralKeypair,
  } = useDualWallet();

  if (!isModalOpen) return null;

  const shortEphemeralKey = ephemeralKeypair
    ? `${ephemeralKeypair.publicKey.toBase58().slice(0, 4)}...${ephemeralKeypair.publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white border border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.18)] text-[#111113] z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-black/[0.06]">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#7A7672]">
                Solana Devnet
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111113] mt-0.5">
                Local Storage Wallet
              </h3>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-black hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Explanation Description Box */}
          <div className="mt-5 p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-2 text-xs leading-relaxed text-[#5A5652]">
            <p className="font-semibold text-[#111113]">
              What is the Local Wallet and how does it work?
            </p>
            <p>
              This wallet generates a full cryptographic Solana Ed25519 keypair,
              securely persisted in your browser&apos;s local storage (LocalStorage).
            </p>
            <p>
              It requires <strong>zero browser extensions</strong> like Phantom, is completely
              immune to network or insecure-context (HTTP) blockades, and signs transactions
              sub-second directly on the Solana Devnet cluster.
            </p>
          </div>

          {/* Saved Key Info */}
          {shortEphemeralKey && (
            <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between text-xs font-mono">
              <span className="text-[#7A7672]">Keypair:</span>
              <span className="font-semibold text-[#111113]">{shortEphemeralKey}</span>
            </div>
          )}

          {/* Connect Action Button */}
          <div className="mt-6">
            <button
              onClick={() => {
                connectEphemeral();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#111113] hover:bg-black text-white font-jakarta text-sm font-semibold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Connect Wallet</span>
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-5 pt-4 border-t border-black/[0.06] text-center">
            <p className="text-[11px] font-mono text-[#7A7672]">
              Private key can be exported anytime via the wallet menu.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
