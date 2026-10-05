"use client";

import React, { useEffect, useRef } from "react";

interface InteractiveDotGridProps {
  mousePos: { x: number; y: number } | null;
}

export function InteractiveDotGrid({ mousePos }: InteractiveDotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetMouseRef = useRef<{ x: number; y: number } | null>(null);
  const currentMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Sync mouse position ref for animation frame
  useEffect(() => {
    targetMouseRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const GRID_SPACING = 30; // 30px uniform grid step
    const INFLUENCE_RADIUS = 150; // Subtle local radius around cursor

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly lerp current mouse towards target
      if (targetMouseRef.current) {
        if (!currentMouseRef.current) {
          currentMouseRef.current = { ...targetMouseRef.current };
        } else {
          currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * 0.10;
          currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * 0.10;
        }
      } else if (currentMouseRef.current) {
        currentMouseRef.current = null;
      }

      const mouse = currentMouseRef.current;

      const cols = Math.ceil(width / GRID_SPACING);
      const rows = Math.ceil(height / GRID_SPACING);
      const startX = (width - cols * GRID_SPACING) / 2 + GRID_SPACING / 2;
      const startY = (height - rows * GRID_SPACING) / 2 + GRID_SPACING / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = startX + i * GRID_SPACING;
          const y = startY + j * GRID_SPACING;

          // Always visible: subtle dark-grey dots
          let radius = 0.95;
          let alpha = 0.07;

          if (mouse) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < INFLUENCE_RADIUS) {
              const t = 1 - dist / INFLUENCE_RADIUS;
              // Very gentle cosine ease for quiet, subtle cursor reaction
              const ease = Math.cos((1 - t) * (Math.PI / 2));
              radius = 0.95 + ease * 0.45; // Subtle growth from 0.95px to max 1.40px
              alpha = 0.07 + ease * 0.11; // Subtle illumination from 0.07 to max 0.18
            }
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none -z-0"
    />
  );
}
