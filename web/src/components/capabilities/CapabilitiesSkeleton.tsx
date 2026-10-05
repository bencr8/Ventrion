"use client";

import React from "react";
import { PorcelainSkeleton } from "../common/PorcelainSkeleton";

export function CapabilitiesSkeleton() {
  return (
    <div className="w-full max-w-[1100px] mx-auto h-[480px] flex flex-col justify-center select-none animate-in fade-in duration-700 px-4">
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <PorcelainSkeleton className="h-10 w-72" rounded="xl" />
        <div className="flex gap-2">
          <PorcelainSkeleton className="h-9 w-20" rounded="full" />
          <PorcelainSkeleton className="h-9 w-20" rounded="full" />
          <PorcelainSkeleton className="h-9 w-20" rounded="full" />
          <PorcelainSkeleton className="h-9 w-20" rounded="full" />
        </div>
      </div>

      {/* CARD SKELETON */}
      <div className="w-full h-[440px] rounded-[36px] bg-white/70 backdrop-blur-xl border border-white/80 p-10 flex items-center justify-between shadow-cardFloat">
        <div className="flex flex-col gap-4 max-w-sm">
          <PorcelainSkeleton className="h-4 w-28" rounded="full" />
          <PorcelainSkeleton className="h-10 w-72" rounded="xl" />
          <PorcelainSkeleton className="h-4 w-80" rounded="lg" />
          <PorcelainSkeleton className="h-10 w-36 mt-4" rounded="full" />
        </div>
        <div className="flex items-center justify-center pr-8">
          <PorcelainSkeleton className="h-56 w-56 rounded-full" />
        </div>
      </div>
    </div>
  );
}
