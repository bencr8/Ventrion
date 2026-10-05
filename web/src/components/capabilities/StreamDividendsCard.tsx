"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import clsx from "clsx";
import {
  Coins,
  ArrowDownToLine,
  Sparkles,
  Check,
  Clock,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Store,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
} from "lucide-react";

export interface StreamDividendsCardProps {
  isExpanded?: boolean;
  onActivate?: () => void;
  className?: string;
  initialBalance?: number;
  ratePerSecond?: number;
  onClaimSuccess?: (claimedAmount: number) => void;
}

// Fixed-point scaling factor from Ventrion Anchor Smart Contract:
// pub const ACC_PRECISION: u128 = 1_000_000_000_000_000_000; (1e18)
const DIVIDEND_PRECISION_LABEL = "10¹⁸";

interface Droplet {
  x: number;
  y: number;
  vy: number;
  radius: number;
  alpha: number;
  isCoin: boolean;
  angle: number;
  spin: number;
  wobble: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export function StreamDividendsCard({
  isExpanded,
  onActivate,
  className = "",
  initialBalance = 248.514,
  ratePerSecond = 0.042,
  onClaimSuccess,
}: StreamDividendsCardProps) {
  // Expansion control: internal fallback if not controlled by parent
  const [internalExpanded, setInternalExpanded] = useState(false);
  const activeExpanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  // Live Micro-Cent Accumulation State
  const [balance, setBalance] = useState(initialBalance);
  const [totalClaimed, setTotalClaimed] = useState(3842.1);
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [claimedAmountSnapshot, setClaimedAmountSnapshot] = useState(0);

  // Micro-cent live tick loop (smooth delta accumulation)
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;
    const updateTick = (currentTime: number) => {
      const delta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      if (delta > 0 && delta < 1) {
        setBalance((prev) => prev + ratePerSecond * delta);
      }
      animId = requestAnimationFrame(updateTick);
    };
    animId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animId);
  }, [ratePerSecond]);

  // Canvas Ref for 3D Porcelain Coin & Droplet Stream Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropletsRef = useRef<Droplet[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const splashesRef = useRef<SplashParticle[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5, isHovering: false });

  // Spawn droplet/coin helper
  const spawnItem = useCallback((isCoin: boolean = false, targetX?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const originX =
      targetX !== undefined
        ? targetX
        : width * 0.5 + (Math.random() * 28 - 14);

    dropletsRef.current.push({
      x: originX,
      y: 12,
      vy: isCoin ? 1.8 + Math.random() * 0.8 : 2.4 + Math.random() * 1.2,
      radius: isCoin ? 11 : 3.5,
      alpha: 1.0,
      isCoin,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.08,
      wobble: Math.random() * Math.PI * 2,
    });
  }, []);

  // 60FPS Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let spawnTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Liquid Vault Surface Level in canvas
      const vaultTop = height * 0.52;
      const vaultBottom = height * 0.94;
      const vaultLeft = width * 0.5 - 75;
      const vaultRight = width * 0.5 + 75;
      const vaultWidth = vaultRight - vaultLeft;
      const liquidLevel = vaultTop + 22;

      // 1. Draw Glass Vault Ambient Backglow
      const glowGrad = ctx.createRadialGradient(
        width * 0.5,
        (liquidLevel + vaultBottom) * 0.5,
        10,
        width * 0.5,
        (liquidLevel + vaultBottom) * 0.5,
        80
      );
      glowGrad.addColorStop(0, "rgba(255, 92, 24, 0.18)");
      glowGrad.addColorStop(0.5, "rgba(255, 166, 128, 0.08)");
      glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(vaultLeft - 20, vaultTop - 10, vaultWidth + 40, vaultBottom - vaultTop + 30);

      // 2. Draw Top Porcelain Stream Dispenser / Spigot
      const spoutGrad = ctx.createLinearGradient(width * 0.5 - 28, 0, width * 0.5 + 28, 16);
      spoutGrad.addColorStop(0, "#FFFFFF");
      spoutGrad.addColorStop(0.4, "#F6F4EE");
      spoutGrad.addColorStop(0.8, "#EFECE3");
      spoutGrad.addColorStop(1, "#D3CDC0");

      ctx.save();
      ctx.fillStyle = spoutGrad;
      ctx.shadowColor = "rgba(15, 15, 17, 0.08)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.beginPath();
      ctx.roundRect(width * 0.5 - 26, -4, 52, 18, [0, 0, 10, 10]);
      ctx.fill();
      ctx.restore();

      // Dispenser Lip Highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(width * 0.5 - 22, 13);
      ctx.lineTo(width * 0.5 + 22, 13);
      ctx.stroke();

      // 3. Periodic Automatic Spawner (micro droplets + coins)
      spawnTimer++;
      if (spawnTimer % 35 === 0) {
        spawnItem(false); // luminous micro droplet
      }
      if (spawnTimer % 130 === 0) {
        spawnItem(true); // porcelain coin
      }

      // 4. Update & Render Droplets / Coins
      for (let i = dropletsRef.current.length - 1; i >= 0; i--) {
        const item = dropletsRef.current[i];
        item.y += item.vy;
        item.vy += 0.16; // gravity
        item.angle += item.spin;
        item.wobble += 0.06;

        // Collision with Glass Vault Liquid Surface
        if (item.y >= liquidLevel) {
          // Trigger Surface Ripple
          ripplesRef.current.push({
            x: item.x,
            y: liquidLevel,
            radius: 4,
            maxRadius: item.isCoin ? 38 : 18,
            alpha: item.isCoin ? 0.85 : 0.6,
          });

          // Trigger Splash Particles
          const count = item.isCoin ? 5 : 2;
          for (let s = 0; s < count; s++) {
            splashesRef.current.push({
              x: item.x + (Math.random() * 8 - 4),
              y: liquidLevel - 2,
              vx: (Math.random() - 0.5) * (item.isCoin ? 2.8 : 1.4),
              vy: -(Math.random() * 2.2 + (item.isCoin ? 2.0 : 1.0)),
              radius: item.isCoin ? 1.8 : 1.2,
              alpha: 0.9,
            });
          }

          dropletsRef.current.splice(i, 1);
          continue;
        }

        // Draw In-Flight Droplet or 3D Porcelain Coin
        if (item.isCoin) {
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.angle);

          const scaleX = Math.cos(item.wobble) * 0.4 + 0.6;
          ctx.scale(scaleX, 1);

          // Coin Drop Shadow
          ctx.fillStyle = "rgba(180, 110, 80, 0.18)";
          ctx.beginPath();
          ctx.ellipse(0, 4, item.radius, item.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          // Porcelain Coin Rim / Extrusion
          ctx.fillStyle = "#E5E1D3";
          ctx.beginPath();
          ctx.ellipse(0, 1.8, item.radius, item.radius * 0.68, 0, 0, Math.PI * 2);
          ctx.fill();

          // Porcelain Coin Face
          const coinGrad = ctx.createLinearGradient(-item.radius, -item.radius, item.radius, item.radius);
          coinGrad.addColorStop(0, "#FFFFFF");
          coinGrad.addColorStop(0.3, "#FAF8F5");
          coinGrad.addColorStop(0.7, "#F6F4EE");
          coinGrad.addColorStop(1, "#EFECE3");

          ctx.fillStyle = coinGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, item.radius, item.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          // Coin Embossed Ring
          ctx.strokeStyle = "rgba(229, 139, 109, 0.45)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.ellipse(0, 0, item.radius * 0.72, item.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Coin Center Token Mark (Clean geometric stroke)
          ctx.fillStyle = "#FF5C18";
          ctx.beginPath();
          ctx.arc(0, 0, 2.0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else {
          // Luminous Warm Micro-Droplet
          ctx.save();
          const dropGrad = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius);
          dropGrad.addColorStop(0, "#FFA680");
          dropGrad.addColorStop(0.5, "#FF5C18");
          dropGrad.addColorStop(1, "rgba(229, 139, 109, 0)");

          ctx.fillStyle = dropGrad;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. Update & Render Ripples
      for (let r = ripplesRef.current.length - 1; r >= 0; r--) {
        const rip = ripplesRef.current[r];
        rip.radius += 0.8;
        rip.alpha *= 0.94;

        if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
          ripplesRef.current.splice(r, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(255, 166, 128, ${rip.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.8})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.radius * 0.8, rip.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 6. Update & Render Splashes
      for (let s = splashesRef.current.length - 1; s >= 0; s--) {
        const sp = splashesRef.current[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.14;
        sp.alpha *= 0.93;

        if (sp.alpha <= 0.02) {
          splashesRef.current.splice(s, 1);
          continue;
        }

        ctx.fillStyle = `rgba(255, 166, 128, ${sp.alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Render Glass Dividend Vault (Translucent Refractive Chamber)
      ctx.save();
      // Glass Body Fill
      const glassGrad = ctx.createLinearGradient(vaultLeft, vaultTop, vaultRight, vaultBottom);
      glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      glassGrad.addColorStop(0.5, "rgba(250, 248, 244, 0.25)");
      glassGrad.addColorStop(1, "rgba(246, 244, 238, 0.55)");

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.roundRect(vaultLeft, vaultTop, vaultWidth, vaultBottom - vaultTop, [18, 18, 26, 26]);
      ctx.fill();

      // Liquid Fill Reservoir inside Vault
      const liquidGrad = ctx.createLinearGradient(0, liquidLevel, 0, vaultBottom);
      liquidGrad.addColorStop(0, "rgba(255, 166, 128, 0.22)");
      liquidGrad.addColorStop(0.4, "rgba(229, 139, 109, 0.16)");
      liquidGrad.addColorStop(1, "rgba(255, 92, 24, 0.28)");

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(vaultLeft + 1.5, liquidLevel, vaultWidth - 3, vaultBottom - liquidLevel - 1.5, [
        0,
        0,
        24,
        24,
      ]);
      ctx.clip();
      ctx.fillStyle = liquidGrad;
      ctx.fillRect(vaultLeft, liquidLevel, vaultWidth, vaultBottom - liquidLevel);

      // Submerged Porcelain Coin Stack (Tactile Accumulation Bed)
      const stackCenterX = width * 0.5;
      const stackBaseY = vaultBottom - 10;
      const coinsInStack = [
        { dx: -18, dy: 0, r: 12, rot: -0.15 },
        { dx: 14, dy: 2, r: 13, rot: 0.18 },
        { dx: -2, dy: -4, r: 14, rot: 0.02 },
        { dx: 10, dy: -9, r: 11, rot: -0.1 },
        { dx: -12, dy: -10, r: 12, rot: 0.12 },
        { dx: 0, dy: -15, r: 13, rot: -0.05 },
      ];

      for (const sc of coinsInStack) {
        ctx.save();
        ctx.translate(stackCenterX + sc.dx, stackBaseY + sc.dy);
        ctx.rotate(sc.rot);

        ctx.fillStyle = "rgba(180, 110, 80, 0.2)";
        ctx.beginPath();
        ctx.ellipse(0, 2, sc.r, sc.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#E5E1D3";
        ctx.beginPath();
        ctx.ellipse(0, 1.2, sc.r, sc.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const sCoinGrad = ctx.createLinearGradient(-sc.r, -sc.r, sc.r, sc.r);
        sCoinGrad.addColorStop(0, "#FFFFFF");
        sCoinGrad.addColorStop(0.5, "#F6F4EE");
        sCoinGrad.addColorStop(1, "#EFECE3");

        ctx.fillStyle = sCoinGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, sc.r, sc.r * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 92, 24, 0.4)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, sc.r * 0.7, sc.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore(); // end clip

      // Glass Vault Beveled Specular Outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(vaultLeft, vaultTop, vaultWidth, vaultBottom - vaultTop, [18, 18, 26, 26]);
      ctx.stroke();

      // Glass Specular Vertical Edge Reflection (Left wall highlight)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(vaultLeft + 5, vaultTop + 14);
      ctx.lineTo(vaultLeft + 5, vaultBottom - 18);
      ctx.stroke();

      // Glass Specular Rim Highlight (Right corner sparkle)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(vaultRight - 5, vaultTop + 18);
      ctx.lineTo(vaultRight - 5, vaultBottom - 24);
      ctx.stroke();

      // Liquid Meniscus Highlight Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(vaultLeft + 6, liquidLevel);
      ctx.lineTo(vaultRight - 6, liquidLevel);
      ctx.stroke();

      ctx.restore();

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, [spawnItem]);

  // Handle Interactive Tap on Canvas (drops instant coin)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    spawnItem(true, x);
    // Instant micro-jump in accumulator
    setBalance((prev) => prev + 0.05);
  };

  // Tactile Claim Dividends Handler
  const handleClaim = () => {
    if (isClaiming || balance <= 0) return;
    setIsClaiming(true);

    const amountToClaim = balance;

    setTimeout(() => {
      setIsClaiming(false);
      setJustClaimed(true);
      setClaimedAmountSnapshot(amountToClaim);
      setTotalClaimed((prev) => prev + amountToClaim);
      setBalance(0.0001);

      // Trigger Confetti Celebration (warm porcelain & peach palette)
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.72 },
          colors: ["#FF5C18", "#FFA680", "#E58B6D", "#111113", "#FFFFFF"],
          ticks: 200,
          gravity: 1.15,
          scalar: 0.85,
        });
      } catch {
        // Fallback gracefully if canvas context blocked
      }

      if (onClaimSuccess) {
        onClaimSuccess(amountToClaim);
      }

      setTimeout(() => {
        setJustClaimed(false);
      }, 3500);
    }, 1100);
  };

  // Toggle or trigger parent activate
  const handleToggleExpand = () => {
    if (onActivate) {
      onActivate();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  // Number formatting helpers
  const balanceInt = Math.floor(balance).toLocaleString("en-US");
  const balanceDecimals = (balance % 1).toFixed(4).substring(2);
  const centsPart = balanceDecimals.slice(0, 2);
  const microPart = balanceDecimals.slice(2, 4);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={clsx(
        "relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/80 rounded-[32px] shadow-cardFloat transition-shadow duration-300 select-none",
        activeExpanded ? "p-6 sm:p-8 ring-1 ring-[#FF5C18]/15" : "p-5 sm:p-6",
        className
      )}
    >
      {/* 1. Realistic Studio Overhead Downlight Specular Sheen */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.95),transparent_70%)] pointer-events-none -z-0" />
      <div className="absolute top-1/3 -right-20 w-48 h-48 rounded-full bg-gradient-to-br from-[#FFA680]/20 to-transparent blur-2xl pointer-events-none -z-0" />

      {/* 2. Top Header & O(1) Mathematical Index Badge */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-black/[0.05] pb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-peach-500/10 border border-[#FFA680]/40 text-[#FF5C18] text-[11px] font-bold tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5 text-[#FF5C18]" />
            <span>STREAM PASSIVE USDC</span>
          </div>

          <div
            title="Constant compute budget on Solana: claim directly without iterating lists"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-black/[0.06] text-[#5A5652] text-[11px] font-mono font-medium shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-[#E58B6D]" />
            <span>O(1) Pull-Accounting</span>
            <span className="text-[10px] text-[#8E8B88]">({DIVIDEND_PRECISION_LABEL})</span>
          </div>
        </div>

        <button
          onClick={handleToggleExpand}
          className="p-2 rounded-full bg-white/60 hover:bg-white/90 border border-white/90 text-[#5A5652] hover:text-[#111113] transition-all cursor-pointer shadow-sm outline-none"
          aria-label={activeExpanded ? "Collapse dividend stream details" : "Expand dividend stream details"}
        >
          {activeExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 3. Real-Time Accumulating USDC Counter */}
      <div className="relative z-10 my-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8E8B88] tracking-wide uppercase">
            <span>Accumulating Balance</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#FF5C18] bg-[#FF5C18]/10 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C18] animate-ping" />
              +${(ratePerSecond * 60).toFixed(2)}/min
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold text-[#111113] tracking-tight">
              ${balanceInt}.{centsPart}
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#E58B6D] tracking-tight">
              {microPart}
            </span>
            <span className="ml-1 text-xs font-bold text-[#5A5652] font-mono tracking-wider">
              USDC
            </span>
          </div>
          <p className="text-xs text-[#5A5652] mt-1">
            Every Checkout & Swap • Direct Wallet Claims
          </p>
        </div>

        {!activeExpanded && (
          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[11px] text-[#8E8B88]">Claimed To Date</span>
            <span className="font-mono text-sm font-bold text-[#111113]">
              ${totalClaimed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        )}
      </div>

      {/* 4. Rich Interactive 3D / Vector Porcelain Coin Waterfall & Glass Dividend Vault */}
      <div className="relative z-10 w-full h-44 sm:h-48 rounded-2xl bg-gradient-to-b from-[#FAF7F2]/60 to-white/40 border border-white/90 overflow-hidden shadow-insetCoin group cursor-pointer">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
          title="Click to drip immediate porcelain coin"
        />

        {/* Ambient Top Glow Lip */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />

        {/* Floating live indicator tag */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/90 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <Coins className="w-3 h-3 text-[#FF5C18]" />
          <span className="text-[10px] font-bold text-[#111113] tracking-tight">
            Live Solana Pay Inflow
          </span>
        </div>

        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/90 shadow-sm text-[10px] font-mono text-[#8E8B88] pointer-events-none">
          Tap vault to inject
        </div>
      </div>

      {/* 5. EXPANDED VIEW: Detailed Breakdown & Tactile Claim Action */}
      <AnimatePresence initial={false}>
        {activeExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 pt-6 space-y-5"
          >
            {/* Revenue Origin Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stream 1: Commerce Checkouts */}
              <div className="p-4 rounded-2xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-[#5A5652]">
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#FF5C18]" />
                    Commerce Checkouts
                  </span>
                  <span className="font-mono text-[#FF5C18] font-bold">68%</span>
                </div>
                <div className="my-2">
                  <div className="text-xl font-bold font-mono text-[#111113]">
                    ${(balance * 0.68).toFixed(2)} USDC
                  </div>
                  <div className="text-[11px] text-[#8E8B88] mt-0.5">
                    Real Webshop & POS Sales
                  </div>
                </div>
                <div className="text-[10px] text-[#5A5652] font-medium border-t border-black/[0.04] pt-2">
                  Atomic Gross Profit Waterfall
                </div>
              </div>

              {/* Stream 2: DEX Swaps */}
              <div className="p-4 rounded-2xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-[#5A5652]">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#E58B6D]" />
                    DEX Volume Tax
                  </span>
                  <span className="font-mono text-[#E58B6D] font-bold">32%</span>
                </div>
                <div className="my-2">
                  <div className="text-xl font-bold font-mono text-[#111113]">
                    ${(balance * 0.32).toFixed(2)} USDC
                  </div>
                  <div className="text-[11px] text-[#8E8B88] mt-0.5">
                    2.5% AMM Secondary Volume
                  </div>
                </div>
                <div className="text-[10px] text-[#5A5652] font-medium border-t border-black/[0.04] pt-2">
                  No Lockup • No Token Printing
                </div>
              </div>
            </div>

            {/* Protocol Guarantees Bar */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-black/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#5A5652]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Non-Custodial: Accrues inside Company Dividend Vault PDA</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-[#8E8B88]">
                <span>Precision: 1e12</span>
                <span className="inline-block w-1 h-1 rounded-full bg-black/20" />
                <span>Gas: ~0.000005 SOL</span>
              </div>
            </div>

            {/* Tactile Interactive Claim Button */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97, y: 1.5 }}
                disabled={isClaiming || balance < 0.01}
                onClick={handleClaim}
                className={clsx(
                  "relative w-full py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 outline-none cursor-pointer overflow-hidden",
                  justClaimed
                    ? "bg-emerald-600 text-white shadow-md"
                    : balance >= 0.01
                    ? "bg-[#111113] text-white hover:bg-black shadow-[0_12px_24px_-6px_rgba(255,92,24,0.22),inset_0_1px_0_0_rgba(255,255,255,0.25)] active:shadow-inner"
                    : "bg-black/10 text-[#8E8B88] cursor-not-allowed"
                )}
              >
                {/* Ambient Warm Underglow */}
                {balance >= 0.01 && !justClaimed && !isClaiming && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF5C18]/10 via-[#FFA680]/20 to-[#FF5C18]/10 pointer-events-none" />
                )}

                {isClaiming ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Pulling O(1) Vault...</span>
                  </>
                ) : justClaimed ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Transferred ${claimedAmountSnapshot.toFixed(2)} USDC to Wallet!</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4 text-[#FFA680]" />
                    <span>Claim USDC</span>
                    <ArrowUpRight className="w-4 h-4 text-white/50 ml-0.5" />
                  </>
                )}
              </motion.button>

              <div className="flex items-center justify-between text-[11px] text-[#8E8B88] mt-2.5 px-2">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-[#5A5652]" />
                  Direct to Connected Solana Wallet
                </span>
                <span>Anchor: claim_venture_dividends</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default StreamDividendsCard;
