"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function WalletRejectionToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleRejection = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setToastMessage(
        customEvent.detail ||
          "Wallet-Verbindung abgebrochen. Bitte bestätige die Anfrage in Phantom."
      );
    };

    window.addEventListener("wallet-rejection", handleRejection);
    return () => window.removeEventListener("wallet-rejection", handleRejection);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 28,
            }}
            className="pointer-events-auto max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111113] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl text-white select-none"
          >
            {/* Amber-Orange Warning Dot */}
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C18]" />
              <span className="absolute w-2.5 h-2.5 rounded-full bg-[#FF5C18] animate-ping opacity-75" />
            </div>

            {/* Error Message */}
            <div className="text-xs font-jakarta font-medium text-white/90 leading-snug">
              {toastMessage}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setToastMessage(null)}
              className="ml-auto text-white/50 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function triggerWalletRejectionToast(customMsg?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("wallet-rejection", {
        detail:
          customMsg ||
          "Wallet-Verbindung abgebrochen. Bitte bestätige die Anfrage in Phantom.",
      })
    );
  }
}
