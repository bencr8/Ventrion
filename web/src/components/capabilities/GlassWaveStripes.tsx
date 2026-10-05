"use client";

import React from "react";
import { GlassWavesCanvas, GlassWavesCanvasProps } from "./GlassWavesCanvas";

export type GlassWaveStripesProps = GlassWavesCanvasProps;

/**
 * Architectural 3D Crystal Glass Waves Canvas
 * Forwarding export for backwards compatibility
 */
export const GlassWaveStripes: React.FC<GlassWaveStripesProps> = (props) => {
  return <GlassWavesCanvas {...props} />;
};

export { GlassWavesCanvas };
