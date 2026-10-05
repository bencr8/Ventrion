"use client";

import React from "react";
import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  rounded?: "full" | "lg" | "xl" | "2xl" | "3xl";
}

/**
 * Porcelain Skeleton Base with Milky Shimmer
 * Uses bg-black/[0.04] with a warm translucent white shimmer sweep
 */
export function PorcelainSkeleton({ className, rounded = "lg" }: SkeletonProps) {
  const roundedClass = {
    full: "rounded-full",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-[28px]",
  }[rounded];

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-black/[0.04] backdrop-blur-sm",
        roundedClass,
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/**
 * 1. Metric Skeleton: $1,000.00 Block
 */
export function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <PorcelainSkeleton className="h-9 w-36" rounded="lg" />
      <PorcelainSkeleton className="h-4 w-16" rounded="full" />
    </div>
  );
}

/**
 * 2. Chart Skeleton: Pulsing placeholder line matching wave chart geometry
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("relative h-24 w-full flex items-end justify-between px-2 pt-4", className)}>
      <div className="absolute inset-x-0 bottom-6 h-0.5 bg-peach-500/20" />
      <div className="h-10 w-1/5 rounded-t-lg bg-black/[0.03] animate-pulse" />
      <div className="h-16 w-1/4 rounded-t-lg bg-peach-400/20 animate-pulse" />
      <div className="h-12 w-1/5 rounded-t-lg bg-black/[0.03] animate-pulse" />
      <div className="h-20 w-1/4 rounded-t-lg bg-peach-400/25 animate-pulse" />
    </div>
  );
}

/**
 * 3. Wallet Button Skeleton: Pulsing pill
 */
export function WalletButtonSkeleton({ className }: { className?: string }) {
  return <PorcelainSkeleton className={clsx("h-9 w-32", className)} rounded="full" />;
}

/**
 * 4. Governance Proposal Skeleton
 */
export function GovernanceProposalSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/50 border border-white/80 backdrop-blur-xl shadow-porcelain flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <PorcelainSkeleton className="h-5 w-44" rounded="full" />
        <PorcelainSkeleton className="h-6 w-20" rounded="full" />
      </div>
      <PorcelainSkeleton className="h-4 w-full" rounded="lg" />
      <PorcelainSkeleton className="h-4 w-3/4" rounded="lg" />
      <div className="mt-2 flex flex-col gap-1">
        <PorcelainSkeleton className="h-2.5 w-full" rounded="full" />
        <div className="flex justify-between">
          <PorcelainSkeleton className="h-3 w-28" rounded="full" />
          <PorcelainSkeleton className="h-3 w-20" rounded="full" />
        </div>
      </div>
    </div>
  );
}
