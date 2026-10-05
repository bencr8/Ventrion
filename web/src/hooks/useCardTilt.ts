"use client";

import { useMotionValue, useSpring, useTransform } from "framer-motion";
import React from "react";

export function useCardTilt() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics: stiffness: 260, damping: 20
  const springConfig = { stiffness: 260, damping: 20 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Card tilts with authentic resting isometric angle matching the reference image:
  // Base rotateX: ~5deg, rotateY: ~-6deg, rotateZ: ~-1deg
  const cardRotateX = useTransform(smoothY, [-0.5, 0.5], [9, 1]);
  const cardRotateY = useTransform(smoothX, [-0.5, 0.5], [-10, -2]);
  const cardRotateZ = useTransform(smoothX, [-0.5, 0.5], [-2, 0]);

  // Ceramic Coin gets amplified parallax translation to create dramatic foreground depth
  const coinTranslateX = useTransform(smoothX, [-0.5, 0.5], [-22, 22]);
  const coinTranslateY = useTransform(smoothY, [-0.5, 0.5], [-18, 18]);

  // Floating tags subtle opposing parallax
  const pillTranslateX = useTransform(smoothX, [-0.5, 0.5], [10, -10]);
  const pillTranslateY = useTransform(smoothY, [-0.5, 0.5], [8, -8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return {
    cardRotateX,
    cardRotateY,
    cardRotateZ,
    coinTranslateX,
    coinTranslateY,
    pillTranslateX,
    pillTranslateY,
    handleMouseMove,
    handleMouseLeave,
  };
}
