"use client";

import React from "react";

export function HeroSkeleton() {
  return (
    <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[520px] select-none pointer-events-none animate-in fade-in duration-300">
      {/* Left Column Skeleton */}
      <div className="lg:col-span-6 flex flex-col justify-center pr-0 lg:pr-6">

        {/* Title Line 1 Skeleton */}
        <div className="w-[88%] sm:w-[82%] h-11 sm:h-14 rounded-2xl animate-shimmer mb-3" />
        {/* Title Line 2 Skeleton */}
        <div className="w-[72%] sm:w-[68%] h-11 sm:h-14 rounded-2xl animate-shimmer mb-6" />

        {/* Paragraph Skeleton */}
        <div className="w-[95%] h-4 rounded-lg animate-shimmer mb-2.5" />
        <div className="w-[85%] h-4 rounded-lg animate-shimmer mb-2.5" />
        <div className="w-[60%] h-4 rounded-lg animate-shimmer mb-8" />

        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-44 h-12 rounded-full animate-shimmer" />
          <div className="w-36 h-12 rounded-full animate-shimmer" />
        </div>
      </div>

      {/* Right Column (3D Dashboard Card) Skeleton */}
      <div className="lg:col-span-6 flex items-center justify-center">
        <div className="w-[440px] sm:w-[485px] h-[300px] sm:h-[318px] rounded-[34px] p-3 bg-white/40 border border-white/60 backdrop-blur-md shadow-sm flex overflow-hidden">
          {/* Mini Sidebar Skeleton */}
          <div className="w-[64px] sm:w-[70px] bg-[#F7F5F0]/60 rounded-2xl flex flex-col items-center pt-4 gap-3">
            <div className="w-7 h-7 rounded-lg animate-shimmer" />
            <div className="w-8 h-8 rounded-xl animate-shimmer" />
            <div className="w-8 h-8 rounded-xl animate-shimmer" />
          </div>

          {/* Main Card Skeleton */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-32 h-4 rounded-md animate-shimmer" />
              <div className="w-6 h-6 rounded-full animate-shimmer" />
            </div>

            <div className="mt-2">
              <div className="w-40 h-8 rounded-xl animate-shimmer mb-2" />
              <div className="w-16 h-3 rounded-md animate-shimmer" />
            </div>

            {/* Wave Chart Skeleton */}
            <div className="w-full h-20 rounded-2xl animate-shimmer mt-auto opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
}
