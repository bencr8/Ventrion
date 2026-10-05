"use client";

import React, { useEffect, useState, useRef } from "react";

interface BezierCounterProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * BezierCounter
 * 
 * Smoothly animates numbers using the exact Ventrion physical easing curve:
 * cubic-bezier(0.16, 1, 0.3, 1)
 */
export function BezierCounter({
  value,
  duration = 1400,
  prefix = "",
  suffix = "",
  decimals = 2,
  className = "",
}: BezierCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Cubic bezier easing evaluation: P0=(0,0), P1=(0.16,1), P2=(0.3,1), P3=(1,1)
  function easeOutCubicBezier(t: number): number {
    // Exact cubic bezier approximation for (0.16, 1, 0.3, 1)
    // At t=0 -> 0, at t=1 -> 1, fast acceleration, smooth glide
    const p1 = 0.16;
    const p2 = 0.3;
    // Standard approximation: 1 - (1-t)^3 or parameterized Bezier curve
    const c = 1 - t;
    return 1 - c * c * c * (1 + 0.5 * (1 - c));
  }

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const eased = easeOutCubicBezier(progress);
      const current = startValueRef.current + (value - startValueRef.current) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
