"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";

export function WhyVentrionVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Audio starts unmuted so the first click mutes (makes it quiet)
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = 0.85;
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play();
        }
      });
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <section className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-20 select-none">
      {/* Clean Header: Confident title with short description */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#111113] font-jakarta leading-[1.14]">
          Why Solana Needs Ventrion
        </h2>
        <p className="font-jakarta text-base text-[#5A5652] mt-3 font-normal leading-relaxed">
          The transition from speculative volatility to real cashflow and programmatic equity.
        </p>
      </div>

      {/* Outer Theater Stage Container (Light Gray Porcelain/Stone with Continuous Skeleton Loading Shimmer) */}
      <div className="relative w-full max-w-[1080px] mx-auto aspect-video rounded-[32px] sm:rounded-[40px] bg-[#EAE5DD] border border-black/[0.06] shadow-[0_20px_50px_-15px_rgba(20,15,10,0.06)] overflow-hidden flex items-center justify-center p-0">
        
        {/* Continuous Sleek Skeleton Shimmer Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer" />
        </div>

        {/* Dynamic Video Frame: Initially centered and smaller (~72%), expands to 100% on play with cubic-bezier ease */}
        <motion.div
          layout
          initial={false}
          animate={{
            width: isPlaying ? "100%" : "72%",
            height: isPlaying ? "100%" : "72%",
            borderRadius: isPlaying ? "32px" : "24px",
          }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_24px_50px_rgba(0,0,0,0.35)] group border border-black/[0.08]"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src="/videos/VentrionAnnounce.mp4"
            className="w-full h-full object-cover"
            playsInline
            loop
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Overlay Play Button: Disappears on play with satisfying cubic bezier fade-out */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.82,
                  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all pointer-events-none"
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#111113] shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio volume control */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 shadow-md cursor-pointer outline-none active:scale-95 hover:scale-105 transition-all duration-200"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              title={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
