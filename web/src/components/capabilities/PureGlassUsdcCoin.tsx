"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface PureGlassUsdcCoinProps {
  amount?: number;
  size?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PureGlassUsdcCoin({
  amount = 142.85,
  size = 116,
  isActive = true,
  onClick,
  className = "",
}: PureGlassUsdcCoinProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef(amount);
  const onClickRef = useRef(onClick);
  const isActiveRef = useRef(isActive);
  const updateTextureRef = useRef<(() => void) | null>(null);

  amountRef.current = amount;
  onClickRef.current = onClick;
  isActiveRef.current = isActive;

  // Whenever amount updates, trigger a redraw on the emblem texture
  useEffect(() => {
    if (updateTextureRef.current) {
      updateTextureRef.current();
    }
  }, [amount]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = size;
    const height = size;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // 2. WebGL Renderer with LinearToneMapping for crystal-clear optical glass
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 3. Clean Studio Environment Texture (Neutral White Studio Softboxes)
    const createStudioEnvironmentTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;

      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.4, "#F8F9FA");
      grad.addColorStop(0.7, "#F1F3F5");
      grad.addColorStop(1, "#E9ECEF");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Top Key Softbox
      const topBox = ctx.createRadialGradient(256, 20, 5, 256, 20, 120);
      topBox.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      topBox.addColorStop(0.6, "rgba(255, 255, 255, 0.85)");
      topBox.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = topBox;
      ctx.fillRect(50, 0, 412, 110);

      // Bottom-Left Table Bounce Softbox
      const bottomBox = ctx.createRadialGradient(140, 220, 5, 140, 220, 110);
      bottomBox.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      bottomBox.addColorStop(0.6, "rgba(255, 255, 255, 0.80)");
      bottomBox.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = bottomBox;
      ctx.fillRect(0, 140, 280, 116);

      // Edge Catchlights (Left & Right Rims)
      const leftStrip = ctx.createRadialGradient(80, 100, 5, 80, 100, 90);
      leftStrip.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      leftStrip.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
      leftStrip.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = leftStrip;
      ctx.fillRect(0, 15, 190, 170);

      const rightStrip = ctx.createRadialGradient(430, 110, 5, 430, 110, 90);
      rightStrip.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      rightStrip.addColorStop(0.5, "rgba(255, 250, 245, 0.35)");
      rightStrip.addColorStop(1, "rgba(255, 250, 245, 0.0)");
      ctx.fillStyle = rightStrip;
      ctx.fillRect(320, 20, 192, 170);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const envMap = createStudioEnvironmentTexture();

    // 4. Procedural Micro-Scratch & Lathe Polishing Grooves Texture
    const createMicroScratchTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 512, 512);

      // Frosted base grain
      for (let i = 0; i < 2500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const d = Math.hypot(x - 256, y - 256);
        if (d < 254) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
          ctx.fillRect(x, y, 1.2, 1.2);
        }
      }

      // Lathe polishing micro-grooves
      for (let r = 8; r < 253; r += 2.5) {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        const seed = (r * 37) % 100;
        if (seed < 70) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 0.5;
        } else if (seed < 93) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.60)";
          ctx.lineWidth = 1.3;
        }
        ctx.stroke();
      }

      // Hairline optical scratches
      let seed = 9876;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < 110; i++) {
        const angle = rnd() * Math.PI * 2;
        const radius = rnd() * 240;
        const cx = 256 + Math.cos(angle) * radius;
        const cy = 256 + Math.sin(angle) * radius;
        const len = 10 + rnd() * 35;
        const sAngle = rnd() * Math.PI * 2;

        const p0x = cx - (Math.cos(sAngle) * len) / 2;
        const p0y = cy - (Math.sin(sAngle) * len) / 2;
        const p1x = cx + (Math.cos(sAngle) * len) / 2;
        const p1y = cy + (Math.sin(sAngle) * len) / 2;

        const tier = rnd();
        if (tier < 0.6) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + rnd() * 0.12})`;
          ctx.lineWidth = 0.4;
        } else if (tier < 0.85) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 + rnd() * 0.22})`;
          ctx.lineWidth = 0.7;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 + rnd() * 0.25})`;
          ctx.lineWidth = 1.4;
        }
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const microScratchTex = createMicroScratchTexture();

    // 5. Token Root Group
    const tokenGroup = new THREE.Group();
    const baseRotation = { x: 0.22, y: -0.28, z: -0.04 };
    tokenGroup.rotation.x = baseRotation.x;
    tokenGroup.rotation.y = baseRotation.y;
    tokenGroup.rotation.z = baseRotation.z;
    tokenGroup.scale.set(0.001, 0.001, 0.001); // Pop-up entrance
    scene.add(tokenGroup);

    // 6. Photorealistic Dielectric Optical Glass Shader
    const glassVertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;

      void main() {
        float puckRadius = 1.30;
        vUv = vec2(
          position.x / (2.0 * puckRadius) + 0.5,
          position.y / (2.0 * puckRadius) + 0.5
        );
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const glassFragmentShader = `
      uniform sampler2D uEnvMap;
      uniform sampler2D uMicroScratch;
      uniform float uTime;
      uniform vec3 uLightPos;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        vec3 L = normalize(uLightPos - vWorldPosition);
        vec3 H = normalize(L + V);

        // 1. Physical Micro-Scratch Sampling
        vec2 uvClamped = clamp(vUv, 0.0, 1.0);
        vec4 scratchSample = texture2D(uMicroScratch, uvClamped);
        float scratch = scratchSample.r;
        vec3 perturbedN = normalize(N + vec3(scratch * 0.28, scratch * 0.28, 0.0));

        // 2. Physical Dielectric Fresnel (IOR = 1.54)
        float NdotV = max(dot(perturbedN, V), 0.0);
        float fresnel = 0.05 + 0.95 * pow(1.0 - NdotV, 3.8);

        // 3. Crisp Studio Reflection
        vec3 R = reflect(-V, perturbedN);
        vec2 envUv = vec2(atan(R.z, R.x) / (2.0 * 3.14159265) + 0.5, asin(clamp(R.y, -1.0, 1.0)) / 3.14159265 + 0.5);
        vec3 envColor = texture2D(uEnvMap, envUv).rgb;

        // 4. Studio Specular Lights
        float specTop = pow(max(dot(perturbedN, H), 0.0), 65.0) * 3.2;

        vec3 L_topLeft = normalize(vec3(-3.5, 4.8, 3.0) - vWorldPosition);
        vec3 H_topLeft = normalize(L_topLeft + V);
        float specTopLeft = pow(max(dot(perturbedN, H_topLeft), 0.0), 50.0) * 2.0;

        vec3 L_left = normalize(vec3(-4.5, 1.6, 2.2) - vWorldPosition);
        vec3 H_left = normalize(L_left + V);
        float specLeft = pow(max(dot(perturbedN, H_left), 0.0), 50.0) * 2.2;

        vec3 L_right = normalize(vec3(4.0, -2.0, 2.0) - vWorldPosition);
        vec3 H_right = normalize(L_right + V);
        float specRight = pow(max(dot(perturbedN, H_right), 0.0), 45.0) * 1.9;

        vec3 L_bottom = normalize(vec3(-2.8, -4.5, 2.5) - vWorldPosition);
        vec3 H_bottom = normalize(L_bottom + V);
        float specBottom = pow(max(dot(perturbedN, H_bottom), 0.0), 45.0) * 2.6;

        vec3 L_front = normalize(vec3(0.4, 0.7, 4.0) - vWorldPosition);
        vec3 H_front = normalize(L_front + V);
        float specFrontSharp = pow(max(dot(perturbedN, H_front), 0.0), 24.0) * 0.55;
        float specFrontSoft = pow(max(dot(perturbedN, H_front), 0.0), 6.0) * 0.22;
        float specFront = specFrontSharp + specFrontSoft;

        float allEdgeSpec = specTop + specTopLeft + specLeft + specRight + specBottom;

        // 5. Radiant Optical Light Sweep
        float sweepSpeed = 0.32;
        float sweepPos = mod(uTime * sweepSpeed, 3.6) - 0.8;
        float coord = (vWorldPosition.x * 0.58 + vWorldPosition.y * 0.82 + 1.15) / 2.3;
        float distToSweep = abs(coord - sweepPos);
        float sweepBeam = exp(-distToSweep * distToSweep * 90.0) * 0.95;
        float distRefract = abs(coord - sweepPos + 0.09 * N.x);
        float sweepRefract = exp(-distRefract * distRefract * 120.0) * 0.45;
        float totalSweep = sweepBeam + sweepRefract;

        // 6. Glistening Scratches across lights
        float scratchOmniCatch = (allEdgeSpec * 0.6 + specFront * 1.8) * scratch * 1.8;
        float scratchKeyCatch = pow(max(dot(perturbedN, H), 0.0), 32.0) * pow(scratch, 1.25) * 4.2;
        float scratchSweepIgnite = scratch * totalSweep * 4.5;
        float scratchPresence = scratch * 0.26;

        // 7. Ambient Optical Internal Radiance
        vec3 ambientRadiance = vec3(1.0, 0.995, 0.99) * (0.16 + fresnel * 0.24 + specFrontSoft * 0.35);

        // 8. Composite Pure Optical Dielectric Glass
        vec3 glassColor = vec3(1.0) * (allEdgeSpec * 1.15 + specFrontSharp + scratchKeyCatch + scratchOmniCatch + scratchSweepIgnite);
        glassColor += envColor * (fresnel * 1.35);
        glassColor += vec3(1.0, 1.0, 1.0) * (totalSweep * (fresnel * 1.3 + 0.30));
        glassColor += ambientRadiance;
        glassColor += vec3(1.0) * scratchPresence;

        float alpha = clamp(
          fresnel * 0.88 + 
          allEdgeSpec * 0.82 + 
          specFront * 0.60 + 
          totalSweep * 0.38 + 
          scratchSweepIgnite * 0.45 + 
          scratchOmniCatch * 0.40 + 
          scratchPresence * 0.32 + 
          0.06, 
          0.0, 0.97
        );

        gl_FragColor = vec4(glassColor, alpha);
      }
    `;

    const glassUniforms = {
      uEnvMap: { value: envMap },
      uMicroScratch: { value: microScratchTex },
      uTime: { value: 0 },
      uLightPos: { value: new THREE.Vector3(1.2, 7.5, 3.8) },
    };

    const glassMaterial = new THREE.ShaderMaterial({
      vertexShader: glassVertexShader,
      fragmentShader: glassFragmentShader,
      uniforms: glassUniforms,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    // 7. Crystal Puck Geometry (Faceted luxury chamfer)
    const tokenRadius = 1.18;
    const tokenDepth = 0.14;

    const puckShape = new THREE.Shape();
    const circleSegments = 96;
    for (let i = 0; i <= circleSegments; i++) {
      const theta = (i / circleSegments) * Math.PI * 2;
      const px = Math.cos(theta) * tokenRadius;
      const py = Math.sin(theta) * tokenRadius;
      if (i === 0) puckShape.moveTo(px, py);
      else puckShape.lineTo(px, py);
    }

    const puckGeo = new THREE.ExtrudeGeometry(puckShape, {
      depth: tokenDepth,
      bevelEnabled: true,
      bevelSegments: 14,
      steps: 2,
      bevelSize: 0.09,
      bevelThickness: 0.07,
    });
    puckGeo.center();
    puckGeo.computeVertexNormals();

    const glassPuckMesh = new THREE.Mesh(puckGeo, glassMaterial);
    tokenGroup.add(glassPuckMesh);

    // 8. DYNAMIC HIGH-RES USDC EMBLEM TEXTURE WITH "$" AND LIVE AMOUNT
    const emblemCanvas = document.createElement("canvas");
    emblemCanvas.width = 1024;
    emblemCanvas.height = 1024;
    const emblemCtx = emblemCanvas.getContext("2d")!;

    const emblemTexture = new THREE.CanvasTexture(emblemCanvas);
    emblemTexture.colorSpace = THREE.SRGBColorSpace;

    const renderEmblem = () => {
      const currentAmt = amountRef.current;
      emblemCtx.clearRect(0, 0, 1024, 1024);

      // A. Outer circular subtle backdrop disk
      const bgGrad = emblemCtx.createRadialGradient(512, 512, 100, 512, 512, 470);
      bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      bgGrad.addColorStop(0.7, "rgba(250, 248, 244, 0.92)");
      bgGrad.addColorStop(0.92, "rgba(240, 235, 226, 0.85)");
      bgGrad.addColorStop(1, "rgba(230, 224, 212, 0.4)");
      emblemCtx.fillStyle = bgGrad;
      emblemCtx.beginPath();
      emblemCtx.arc(512, 512, 465, 0, Math.PI * 2);
      emblemCtx.fill();

      // B. Fine Lathe & Guilloché Concentric Ring Borders
      emblemCtx.strokeStyle = "rgba(39, 117, 202, 0.35)";
      emblemCtx.lineWidth = 3.5;
      emblemCtx.beginPath();
      emblemCtx.arc(512, 512, 452, 0, Math.PI * 2);
      emblemCtx.stroke();

      emblemCtx.strokeStyle = "rgba(255, 92, 24, 0.28)";
      emblemCtx.lineWidth = 2.0;
      emblemCtx.beginPath();
      emblemCtx.arc(512, 512, 440, 0, Math.PI * 2);
      emblemCtx.stroke();

      // Delicate minute/index ticks around circumference
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const isMajor = i % 5 === 0;
        const rIn = isMajor ? 418 : 426;
        const rOut = 434;
        emblemCtx.strokeStyle = isMajor ? "rgba(39, 117, 202, 0.65)" : "rgba(0, 0, 0, 0.15)";
        emblemCtx.lineWidth = isMajor ? 3.0 : 1.5;
        emblemCtx.beginPath();
        emblemCtx.moveTo(512 + Math.cos(a) * rIn, 512 + Math.sin(a) * rIn);
        emblemCtx.lineTo(512 + Math.cos(a) * rOut, 512 + Math.sin(a) * rOut);
        emblemCtx.stroke();
      }

      // C. THE ICONIC USDC DUAL CRESCENT ARCS
      // Left arc: 120° to 240°
      emblemCtx.save();
      emblemCtx.shadowColor = "rgba(39, 117, 202, 0.45)";
      emblemCtx.shadowBlur = 24;

      const arcGradL = emblemCtx.createLinearGradient(180, 200, 180, 800);
      arcGradL.addColorStop(0, "#2775CA");
      arcGradL.addColorStop(0.5, "#4B96F3");
      arcGradL.addColorStop(1, "#2775CA");

      emblemCtx.strokeStyle = arcGradL;
      emblemCtx.lineWidth = 42;
      emblemCtx.lineCap = "round";

      emblemCtx.beginPath();
      emblemCtx.arc(512, 512, 335, (122 * Math.PI) / 180, (238 * Math.PI) / 180);
      emblemCtx.stroke();

      // Right arc: 302° to 58°
      const arcGradR = emblemCtx.createLinearGradient(840, 200, 840, 800);
      arcGradR.addColorStop(0, "#2775CA");
      arcGradR.addColorStop(0.5, "#4B96F3");
      arcGradR.addColorStop(1, "#2775CA");

      emblemCtx.strokeStyle = arcGradR;
      emblemCtx.beginPath();
      emblemCtx.arc(512, 512, 335, (302 * Math.PI) / 180, (58 * Math.PI) / 180);
      emblemCtx.stroke();
      emblemCtx.restore();

      // Inner thin echo ring
      emblemCtx.strokeStyle = "rgba(39, 117, 202, 0.22)";
      emblemCtx.lineWidth = 3.0;
      emblemCtx.beginPath();
      emblemCtx.arc(512, 512, 290, 0, Math.PI * 2);
      emblemCtx.stroke();

      // D. TOP ARCH / BANNER: "USD COIN • USDC"
      emblemCtx.save();
      emblemCtx.font = "bold 44px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      emblemCtx.fillStyle = "#1E293B";
      emblemCtx.textAlign = "center";
      emblemCtx.textBaseline = "middle";
      emblemCtx.letterSpacing = "4px";
      emblemCtx.fillText("USD COIN", 512, 235);
      emblemCtx.restore();

      // E. CENTER PIECE: THE EMBOSSED "$" SYMBOL
      emblemCtx.save();
      // Drop shadow for 3D physical punch
      emblemCtx.shadowColor = "rgba(0, 0, 0, 0.18)";
      emblemCtx.shadowOffsetX = 0;
      emblemCtx.shadowOffsetY = 8;
      emblemCtx.shadowBlur = 18;

      const dollarGrad = emblemCtx.createLinearGradient(512, 280, 512, 650);
      dollarGrad.addColorStop(0, "#111113");
      dollarGrad.addColorStop(0.5, "#1F2937");
      dollarGrad.addColorStop(1, "#2775CA");

      emblemCtx.fillStyle = dollarGrad;
      emblemCtx.font = "900 310px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      emblemCtx.textAlign = "center";
      emblemCtx.textBaseline = "middle";
      emblemCtx.fillText("$", 512, 460);
      emblemCtx.restore();

      // Subtle specular highlight on top bevel of "$"
      emblemCtx.save();
      emblemCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
      emblemCtx.font = "900 306px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      emblemCtx.textAlign = "center";
      emblemCtx.textBaseline = "middle";
      emblemCtx.fillText("$", 510, 457);
      emblemCtx.restore();

      // Re-overlay crisp dark body
      emblemCtx.save();
      emblemCtx.fillStyle = "#111827";
      emblemCtx.font = "900 304px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      emblemCtx.textAlign = "center";
      emblemCtx.textBaseline = "middle";
      emblemCtx.fillText("$", 512, 460);
      emblemCtx.restore();

      // F. BOTTOM MEDALLION BADGE: DYNAMIC "$" AMOUNT
      // Pill container
      const pillW = 440;
      const pillH = 74;
      const pillX = 512 - pillW / 2;
      const pillY = 672;
      const pillR = pillH / 2;

      emblemCtx.save();
      emblemCtx.shadowColor = "rgba(39, 117, 202, 0.25)";
      emblemCtx.shadowBlur = 16;
      emblemCtx.shadowOffsetY = 4;

      const pillGrad = emblemCtx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
      pillGrad.addColorStop(0, "#0F172A");
      pillGrad.addColorStop(0.5, "#1E293B");
      pillGrad.addColorStop(1, "#0F172A");

      emblemCtx.fillStyle = pillGrad;
      emblemCtx.beginPath();
      emblemCtx.roundRect(pillX, pillY, pillW, pillH, pillR);
      emblemCtx.fill();

      // Pill border
      emblemCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      emblemCtx.lineWidth = 2.5;
      emblemCtx.stroke();
      emblemCtx.restore();

      // Amount Text inside pill
      emblemCtx.save();
      emblemCtx.textAlign = "center";
      emblemCtx.textBaseline = "middle";

      // "$142.85" text formatted
      const formattedAmt = `$${currentAmt.toFixed(2)}`;
      emblemCtx.font = "800 40px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      emblemCtx.fillStyle = "#FFFFFF";
      emblemCtx.fillText(formattedAmt, 512, pillY + pillH / 2 + 1);

      // Subtle orange dot at end for Ventrion dividend lineage
      emblemCtx.fillStyle = "#FF5C18";
      emblemCtx.beginPath();
      emblemCtx.arc(512 + pillW / 2 - 32, pillY + pillH / 2, 5, 0, Math.PI * 2);
      emblemCtx.fill();
      emblemCtx.restore();

      // G. Small bottom protocol watermark: "VENTRION DIVIDENDS"
      emblemCtx.save();
      emblemCtx.font = "bold 26px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      emblemCtx.fillStyle = "rgba(100, 116, 139, 0.85)";
      emblemCtx.textAlign = "center";
      emblemCtx.textBaseline = "middle";
      emblemCtx.letterSpacing = "3px";
      emblemCtx.fillText("USDC • 1.00 USD", 512, 792);
      emblemCtx.restore();

      emblemTexture.needsUpdate = true;
    };

    updateTextureRef.current = renderEmblem;
    renderEmblem();

    // Emblem Plane on Front Face
    const logoPlaneGeo = new THREE.PlaneGeometry(1.48, 1.48);
    const emblemMaterial = new THREE.MeshPhysicalMaterial({
      map: emblemTexture,
      transparent: true,
      roughness: 0.14,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const frontEmblemMesh = new THREE.Mesh(logoPlaneGeo, emblemMaterial);
    frontEmblemMesh.position.z = tokenDepth / 2 + 0.02;
    tokenGroup.add(frontEmblemMesh);

    // Emblem Plane on Back Face (Reverse side)
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: emblemTexture,
      transparent: true,
      roughness: 0.14,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const backEmblemMesh = new THREE.Mesh(logoPlaneGeo, backMaterial);
    backEmblemMesh.rotation.y = Math.PI;
    backEmblemMesh.position.z = -(tokenDepth / 2 + 0.02);
    tokenGroup.add(backEmblemMesh);

    // Jewel-like Internal Point Lights
    const usdcBlueGlow = new THREE.PointLight(0x2775ca, 2.6, 3.2);
    usdcBlueGlow.position.set(0, 0, frontEmblemMesh.position.z + 0.28);
    tokenGroup.add(usdcBlueGlow);

    const warmSpecularLight = new THREE.PointLight(0xfff5ea, 1.5, 3.5);
    warmSpecularLight.position.set(0.6, 0.8, 1.4);
    scene.add(warmSpecularLight);

    // 9. Interactive Drag & Recoil Physics (Hero-style weighted drag & damped return)
    let isDragging = false;
    let hasMoved = false;
    let pointerDownPos = { x: 0, y: 0 };
    let previousPointerPos = { x: 0, y: 0 };
    const userRotation = { x: 0, y: 0 };
    const rotationVelocity = { x: 0, y: 0 };

    const limitY = 0.65;
    const limitX = 0.45;
    const baseSensitivity = 0.007;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      hasMoved = false;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      previousPointerPos = { x: e.clientX, y: e.clientY };
      rotationVelocity.x = 0;
      rotationVelocity.y = 0;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousPointerPos.x;
      const deltaY = e.clientY - previousPointerPos.y;
      previousPointerPos = { x: e.clientX, y: e.clientY };

      const totalDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (totalDist > 5) {
        hasMoved = true;
      }

      // Progressive elastic resistance
      const dispY = Math.abs(userRotation.y) / limitY;
      const dispX = Math.abs(userRotation.x) / limitX;

      let resistY = 1.0;
      if ((deltaX > 0 && userRotation.y > 0) || (deltaX < 0 && userRotation.y < 0)) {
        resistY = Math.max(0.08, 1.0 - Math.pow(Math.min(dispY, 1.4), 2.2));
      }

      let resistX = 1.0;
      if ((deltaY > 0 && userRotation.x > 0) || (deltaY < 0 && userRotation.x < 0)) {
        resistX = Math.max(0.08, 1.0 - Math.pow(Math.min(dispX, 1.4), 2.2));
      }

      const stepY = deltaX * baseSensitivity * resistY;
      const stepX = deltaY * baseSensitivity * resistX;

      userRotation.y += stepY;
      userRotation.x += stepX;

      const hardLimitY = limitY * 1.35;
      const hardLimitX = limitX * 1.35;
      userRotation.y = Math.max(-hardLimitY, Math.min(hardLimitY, userRotation.y));
      userRotation.x = Math.max(-hardLimitX, Math.min(hardLimitX, userRotation.x));

      rotationVelocity.y = stepY * 0.75;
      rotationVelocity.x = stepX * 0.75;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {}

      // If clicked without dragging: celebratory 360° spin kick + trigger onClick!
      if (!hasMoved) {
        rotationVelocity.y = (Math.random() > 0.5 ? 1 : -1) * 3.8;
        if (onClickRef.current) {
          onClickRef.current();
        }
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // Initial render
    renderer.render(scene, camera);

    // 10. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();
    const startTime = performance.now();
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isActiveRef.current) {
        return; // Pause rendering when tab is not active
      }

      const currentTime = performance.now();
      const dt = Math.min(0.033, Math.max(0.001, (currentTime - lastTime) / 1000));
      lastTime = currentTime;

      const elapsed = clock.getElapsedTime();

      // Pop-up entrance spring
      const popUpDuration = 1.0;
      const popUpProgress = Math.min(1.0, (currentTime - startTime) / (popUpDuration * 1000));
      let currentScale = 1.0;
      if (popUpProgress < 1.0) {
        const p = popUpProgress;
        currentScale = Math.sin(p * Math.PI * 0.5) * (1.0 + Math.sin(p * Math.PI * 2.0) * 0.15 * (1.0 - p));
      }
      tokenGroup.scale.set(currentScale, currentScale, currentScale);

      // Light sweep
      glassUniforms.uTime.value = elapsed;

      // Rotational Spring Recoil
      if (!isDragging) {
        const springK = 38.0;
        const damping = 0.88;

        const forceX = -springK * userRotation.x;
        const forceY = -springK * userRotation.y;

        rotationVelocity.x = (rotationVelocity.x + forceX * dt) * Math.pow(damping, dt * 60);
        rotationVelocity.y = (rotationVelocity.y + forceY * dt) * Math.pow(damping, dt * 60);

        userRotation.x += rotationVelocity.x * dt;
        userRotation.y += rotationVelocity.y * dt;

        if (Math.abs(userRotation.x) < 0.0004 && Math.abs(rotationVelocity.x) < 0.0008) {
          userRotation.x = 0;
          rotationVelocity.x = 0;
        }
        if (Math.abs(userRotation.y) < 0.0004 && Math.abs(rotationVelocity.y) < 0.0008) {
          userRotation.y = 0;
          rotationVelocity.y = 0;
        }
      }

      // Gentle organic float
      const floatX = Math.sin(elapsed * 1.3) * 0.03;
      const floatY = Math.cos(elapsed * 1.1) * 0.034;
      const floatZ = Math.sin(elapsed * 0.9) * 0.015;

      tokenGroup.rotation.x = baseRotation.x + userRotation.x + floatX;
      tokenGroup.rotation.y = baseRotation.y + userRotation.y + floatY;
      tokenGroup.rotation.z = baseRotation.z + floatZ;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      envMap.dispose();
      microScratchTex.dispose();
      emblemTexture.dispose();
      glassMaterial.dispose();
      emblemMaterial.dispose();
      backMaterial.dispose();
      puckGeo.dispose();
      logoPlaneGeo.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="relative z-20 cursor-grab active:cursor-grabbing pointer-events-auto touch-none"
        style={{ width: size, height: size }}
        title="Interactive 3D Glass USDC Coin • Drag to inspect • Click to claim"
      />

      {/* Realistic Soft Contact Drop Shadow on Card */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-[100%] bg-[#362015]/15 blur-md pointer-events-none scale-90 z-10"
        style={{ width: size * 0.72, height: size * 0.16 }}
      />
      <div
        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-[100%] bg-black/20 blur-xs pointer-events-none scale-75 z-10"
        style={{ width: size * 0.48, height: size * 0.08 }}
      />
    </div>
  );
}

export default PureGlassUsdcCoin;
