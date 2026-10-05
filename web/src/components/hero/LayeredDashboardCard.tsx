"use client";

import React from "react";
import { motion, MotionValue } from "framer-motion";

interface LayeredDashboardCardProps {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  rotateZ?: MotionValue<number>;
  pillX?: MotionValue<number>;
  pillY?: MotionValue<number>;
  isLoading?: boolean;
  totalDividends?: number;
}

export function LayeredDashboardCard({
  rotateX,
  rotateY,
}: LayeredDashboardCardProps) {
  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="relative w-full h-full flex items-center justify-center select-none cursor-pointer group"
    >
      {/* Interactive 3D Hit Area with subtle glass refraction shine on hover */}
      <div className="w-full h-full rounded-[36px] transition-all duration-500 group-hover:bg-white/[0.04] group-hover:backdrop-brightness-[1.02]" />
    </motion.div>
  );
}
