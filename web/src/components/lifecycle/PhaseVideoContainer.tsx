"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

export interface PhaseVideoContainerProps {
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
  phaseNumber?: string;
  phaseId?: string;
  phaseTitle?: string;
}

export function PhaseVideoContainer({
  videoSrc,
  posterSrc,
  className = "",
}: PhaseVideoContainerProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className={`w-full relative ${className}`}>
      {/* Subtle ambient warmth glow */}
      <div className="absolute -inset-1 rounded-[34px] bg-[radial-gradient(ellipse_at_center,rgba(255,92,24,0.04)_0%,transparent_70%)] blur-xl pointer-events-none" />

      {/* Main Light Video Stage */}
      <div className="relative w-full aspect-video min-h-[300px] sm:min-h-[360px] lg:min-h-[420px] rounded-[28px] sm:rounded-[34px] bg-[#FAF7F2] border border-black/[0.06] shadow-[0_16px_40px_-12px_rgba(20,15,10,0.06)] overflow-hidden flex items-center justify-center select-none">
        
        {/* 100% Raw Video (When videoSrc is provided and loaded) */}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 pointer-events-none relative z-20 ${
              isVideoLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Clean, Very Light & Satisfying Skeleton Loader (When no video is provided or loading) */}
        {(!videoSrc || !isVideoLoaded) && (
          <div className="absolute inset-0 z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden bg-[#FAF7F2]">
            
            {/* Buttery Smooth Light Shimmer Sweep across porcelain surface */}
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none skew-x-12"
            />

            {/* Top Bar Skeleton Geometry */}
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-24 sm:w-32 rounded-full bg-black/[0.04]" />
                <div className="hidden sm:block h-3.5 w-16 rounded-full bg-black/[0.025]" />
              </div>
              <div className="h-3.5 w-12 rounded-full bg-black/[0.035]" />
            </div>

            {/* Center: Minimalist Light Porcelain Disc with Subtle Amber Touch */}
            <div className="relative my-auto flex items-center justify-center z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 border border-black/[0.05] shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-md flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [0.95, 1.1, 0.95],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-[#FF5C18]"
                />
              </div>
            </div>

            {/* Bottom Bar: Elegant Horizontal Progress Line */}
            <div className="w-full space-y-3 relative z-10">
              <div className="relative h-1.5 w-full bg-black/[0.04] rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FF5C18]/60 to-transparent rounded-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-20 rounded-full bg-black/[0.03]" />
                <div className="h-2.5 w-12 rounded-full bg-black/[0.025]" />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
