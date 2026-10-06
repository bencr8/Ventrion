"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Check, ArrowRight, Twitter, AtSign } from "lucide-react";
import confetti from "canvas-confetti";

const ROLES = [
  { id: "Founder", label: "Founder" },
  { id: "Investor", label: "Investor" },
  { id: "Builder", label: "Builder" },
  { id: "Community", label: "Community" },
];

export function StayUpdatedSection() {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("Founder");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ventrion_waitlist_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          setEmail(parsed.email);
          if (parsed.role) setSelectedRole(parsed.role);
          if (parsed.twitterHandle) setTwitterHandle(parsed.twitterHandle);
          setIsSubmitted(true);
        }
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    const LEGAL_CONSENT_TEXT =
      "By clicking Stay Updated, I agree to receive email updates and alpha invites regarding Ventrion. I can unsubscribe at any time.";

    try {
      const payload = {
        email: email.trim(),
        role: selectedRole,
        twitterHandle: twitterHandle.trim(),
        consent: true,
        consentText: LEGAL_CONSENT_TEXT,
        submittedAt: new Date().toISOString(),
      };

      // 1. Save locally in visitor's browser immediately
      try {
        localStorage.setItem("ventrion_waitlist_data", JSON.stringify(payload));
      } catch {}

      // 2. Optimistic UI update: Instantly show success state with zero white flash
      setIsSubmitted(true);

      // 3. Visual celebration
      try {
        if (typeof window !== "undefined") {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#FF5C18", "#FFA16C", "#111113", "#FFFFFF"],
          });
        }
      } catch {}

      // 4. Background Server Sync (reliable async)
      (async () => {
        try {
          const res = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            console.warn("Waitlist sync returned non-200 status:", res.status);
          }
        } catch (err) {
          console.warn("Backend waitlist sync error:", err);
        }
      })();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tweetShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    "Just joined the early waitlist for @VentrionLabs — tokenizing real-world revenue and streaming programmatic dividends on Solana.\n\nCheck it out: https://ventrion.fun"
  )}`;

  return (
    <section
      id="stay-updated"
      className="relative w-full max-w-[1100px] mx-auto px-6 sm:px-10 py-20 sm:py-28 select-none"
    >
      {/* Centered Ambient Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(255,92,24,0.06)_0%,transparent_75%)] blur-3xl pointer-events-none -z-10" />

      {/* MINIMAL SECTION HEADER */}
      <div className="text-center max-w-lg mx-auto mb-10 sm:mb-12">
        <h2 className="font-jakarta text-3xl sm:text-4xl font-bold text-[#111113] tracking-tight">
          Stay Updated
        </h2>
        <p className="font-jakarta text-sm sm:text-base text-[#6E6964] mt-2.5 font-normal leading-relaxed">
          Be the first to tokenize, invest, and stream dividends on Solana.
        </p>
      </div>

      {/* THE CLEAN FORM CONTAINER */}
      <div className="w-full max-w-[560px] mx-auto">
        <div
          className={`relative bg-white/80 backdrop-blur-xl border rounded-[32px] p-6 sm:p-9 shadow-[0_20px_50px_-12px_rgba(20,15,10,0.05)] transition-all duration-300 ${
            inputFocused
              ? "border-[#FF5C18]/40 shadow-[0_20px_50px_-12px_rgba(255,92,24,0.1)]"
              : "border-black/[0.06]"
          }`}
        >
          {isSubmitted ? (
            /* CLEAN SUCCESS STATE - INSTANTLY MOUNTED */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF5C18]/10 text-[#FF5C18] flex items-center justify-center mb-4">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] text-[11px] font-mono font-bold text-[#111113] uppercase tracking-wider mb-2">
                <span>{selectedRole} Whitelist</span>
              </div>

              <h3 className="font-jakarta text-2xl font-bold text-[#111113] tracking-tight">
                You’re on the list.
              </h3>
              <p className="text-sm text-[#6E6964] mt-1.5 max-w-sm">
                We’ll notify <strong className="text-[#111113]">{email}</strong> as soon as private alpha opens.
              </p>

              <div className="mt-7 flex items-center gap-3 w-full">
                <a
                  href={tweetShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-5 rounded-full bg-[#111113] hover:bg-[#FF5C18] text-white text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Twitter className="w-3.5 h-3.5 fill-white" />
                  <span>Share on X</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="py-3 px-5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-xs font-medium text-[#6E6964] hover:text-[#111113] transition-colors"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          ) : (
            /* THE MINIMAL FORM */
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
                {/* ROLE SELECTOR: SLEEK PILL CHIPS */}
                <div className="flex items-center justify-between p-1 bg-black/[0.035] rounded-full border border-black/[0.04]">
                  {ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        className={`relative flex-1 py-2 rounded-full font-jakarta text-xs sm:text-[13px] font-semibold transition-colors duration-200 outline-none select-none text-center cursor-pointer ${
                          isSelected ? "text-white" : "text-[#6E6964] hover:text-[#111113]"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activeRolePill"
                            className="absolute inset-0 rounded-full bg-[#111113] shadow-sm"
                            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                          />
                        )}
                        <span className="relative z-10">{r.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* EMAIL INPUT */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8E8B88]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] text-[#111113] placeholder-[#A49F99] text-sm font-jakarta focus:outline-none focus:bg-white focus:border-[#FF5C18] transition-all"
                    required
                  />
                </div>

                {/* OPTIONAL X HANDLE (MINIMAL INLINE) */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8E8B88]">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ""))}
                    placeholder="X handle (optional)"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] text-[#111113] placeholder-[#A49F99] text-sm font-jakarta focus:outline-none focus:bg-white focus:border-[#FF5C18] transition-all"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 font-medium font-jakarta -mt-1">{error}</p>
                )}

                {/* SLEEK SUBMIT BUTTON (Minimalist, Tactile) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 sm:py-4 rounded-full bg-[#121214] hover:bg-[#FF5C18] text-white font-jakarta text-[14px] sm:text-[14.5px] font-semibold tracking-tight transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_8px_20px_-4px_rgba(0,0,0,0.18)] flex items-center justify-center gap-2 cursor-pointer outline-none hover:scale-[1.015] active:scale-[0.985] group mt-1"
                >
                  <span>
                    {isSubmitting ? "Saving..." : "Stay Updated"}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                </button>

                {/* LEGAL CONSENT NOTICE (ENGLISH) */}
                <p className="text-[11.5px] text-[#8E8B88] text-center mt-1 leading-relaxed font-jakarta">
                  By clicking Stay Updated, you agree to receive protocol launch announcements and alpha invitations from Ventrion. You can unsubscribe at any time.
                </p>
              </form>
            )}
        </div>

        {/* MINIMAL X PROFILE COMPANION STRIP */}
        <div className="mt-6 flex items-center justify-between px-6 py-4 rounded-2xl bg-white/50 backdrop-blur-md border border-black/[0.05] transition-all hover:bg-white/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111113] p-1.5 flex items-center justify-center shadow-xs">
              <img
                src="/ventrion-logo.png"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.indexOf("/ventrion/ventrion-logo.png") === -1 && target.src.indexOf("/preview/ventrion-logo.png") === -1) {
                    target.src = "/ventrion/ventrion-logo.png";
                  }
                }}
                alt="Ventrion Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-jakarta text-xs font-bold text-[#111113]">Ventrion</span>
                <span className="text-[10px] text-[#FF5C18] font-mono font-semibold">@VentrionLabs</span>
              </div>
              <p className="text-[11px] text-[#6E6964]">Official announcements & alpha</p>
            </div>
          </div>

          <a
            href="https://x.com/VentrionLabs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-full bg-[#111113] hover:bg-[#FF5C18] text-white font-jakarta text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 shadow-xs hover:scale-[1.03] active:scale-[0.97]"
          >
            <Twitter className="w-3 h-3 fill-white" />
            <span>Follow</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
