"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "framer-motion";

interface ParallaxFloatingCardObjectProps {
  children: React.ReactNode;
  className?: string;
  depth?: number; // Visual Z-elevation intensity (default 40)
  shadowWidth?: string | number;
}

export function ParallaxFloatingCardObject({
  children,
  className = "",
  depth = 40,
  shadowWidth = "85%",
}: ParallaxFloatingCardObjectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 1. Scroll-Driven 3D Parallax
  // Track scroll position of the capability section / viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth, weighted spring for scroll parallax
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 24,
    mass: 0.8,
    restDelta: 0.001,
  });

  // Faster scroll speed delta: Foreground object travels from +36px to -36px
  // As the page scrolls down, the floating object moves UP faster than the underlying card!
  const parallaxY = useTransform(smoothScroll, [0, 1], [36, -36]);

  // 3D Tilt based on scroll position (leans back slightly when entering from bottom, tilts flat at center, leans forward when exiting)
  const scrollRotateX = useTransform(smoothScroll, [0, 0.5, 1], [7.5, 0, -6.0]);
  const scrollRotateZ = useTransform(smoothScroll, [0, 0.5, 1], [-1.8, 0, 1.8]);

  // Shadow offset and blur that dynamically shifts in response to scroll parallax
  const shadowY = useTransform(smoothScroll, [0, 1], [16, 28]);
  const shadowScale = useTransform(smoothScroll, [0, 0.5, 1], [0.92, 1.0, 0.94]);
  const shadowOpacity = useTransform(smoothScroll, [0, 0.5, 1], [0.18, 0.28, 0.20]);

  // 2. Interactive Cursor Parallax (Spatial Hover Separation)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { stiffness: 120, damping: 18 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 120, damping: 18 });

  const cursorRotateX = useTransform(smoothMouseY, [-0.5, 0.5], [6.0, -6.0]);
  const cursorRotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-7.5, 7.5]);
  const cursorTranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [-14, 14]);
  const cursorTranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [-12, 12]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        perspective: "1000px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      {/* 3. MULTI-TIER FLOATING CONTACT SHADOW BENEATH THE OBJECT */}
      {/* This ground-plane shadow proves to the eye that the object is genuinely floating above the card */}
      <motion.div
        style={{
          y: shadowY,
          scale: shadowScale,
          opacity: shadowOpacity,
          width: shadowWidth,
        }}
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-14 rounded-full bg-[#3B2518] blur-2xl pointer-events-none -z-10"
      />
      <motion.div
        style={{
          y: shadowY,
          scale: shadowScale,
          opacity: isHovered ? 0.35 : 0.22,
          width: typeof shadowWidth === "number" ? shadowWidth * 0.75 : "65%",
        }}
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-7 rounded-full bg-black/40 blur-md pointer-events-none -z-10"
      />

      {/* 4. THE 3D PARALLAX FLOATING VESSEL */}
      <motion.div
        style={{
          y: parallaxY,
          rotateX: scrollRotateX,
          rotateZ: scrollRotateZ,
          x: cursorTranslateX,
          z: depth,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full flex items-center justify-center will-change-transform"
      >
        {/* Subtle Ambient Levitation Wave */}
        <motion.div
          animate={{
            y: [-3.5, 3.5, -3.5],
            rotateY: [-1.2, 1.2, -1.2],
          }}
          transition={{
            duration: 5.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          style={{
            rotateX: cursorRotateX,
            rotateY: cursorRotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ParallaxFloatingCardObject;
