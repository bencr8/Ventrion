"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface PureGlassVTokenProps {
  className?: string;
  mouse?: { x: number; y: number };
}

export function PureGlassVToken({ className = "" }: PureGlassVTokenProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = 240;
    const height = 240;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.6);

    // 2. WebGL Renderer
    // LinearToneMapping prevents ACES from darkening semi-transparent whites into dull grey!
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
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;

      // Neutral crisp studio background
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.4, "#F8F9FA");
      grad.addColorStop(0.7, "#F1F3F5");
      grad.addColorStop(1, "#E9ECEF");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Top Key Studio Softbox
      const topBox = ctx.createRadialGradient(512, 40, 10, 512, 40, 240);
      topBox.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      topBox.addColorStop(0.6, "rgba(255, 255, 255, 0.85)");
      topBox.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = topBox;
      ctx.fillRect(100, 0, 824, 220);

      // Bottom-Left Table Bounce Softbox (Eliminates bottom dark reflection completely!)
      const bottomBox = ctx.createRadialGradient(280, 440, 10, 280, 440, 220);
      bottomBox.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      bottomBox.addColorStop(0.6, "rgba(255, 255, 255, 0.80)");
      bottomBox.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = bottomBox;
      ctx.fillRect(0, 280, 560, 232);

      // Bottom-Right Table Bounce Softbox
      const bottomRightBox = ctx.createRadialGradient(780, 440, 10, 780, 440, 200);
      bottomRightBox.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      bottomRightBox.addColorStop(0.5, "rgba(255, 250, 245, 0.6)");
      bottomRightBox.addColorStop(1, "rgba(255, 250, 245, 0.0)");
      ctx.fillStyle = bottomRightBox;
      ctx.fillRect(520, 300, 504, 212);

      // Left Rim Strip (Edge catchlight)
      const leftStrip = ctx.createRadialGradient(160, 200, 10, 160, 200, 180);
      leftStrip.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      leftStrip.addColorStop(0.4, "rgba(255, 255, 255, 0.5)");
      leftStrip.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = leftStrip;
      ctx.fillRect(0, 30, 380, 340);

      // Right Rim Strip (Edge catchlight)
      const rightStrip = ctx.createRadialGradient(860, 220, 10, 860, 220, 180);
      rightStrip.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      rightStrip.addColorStop(0.4, "rgba(255, 250, 245, 0.45)");
      rightStrip.addColorStop(1, "rgba(255, 250, 245, 0.0)");
      ctx.fillStyle = rightStrip;
      ctx.fillRect(640, 40, 384, 340);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const envMap = createStudioEnvironmentTexture();

    // 4. RICH, FULL-SURFACE MICRO-SCRATCH & ETCHED TEXTURE (Tactile, authentic, crystal-clear everywhere)
    const createMicroScratchTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 1024, 1024);

      // A. Fine Frosted Base Grain (Evenly distributed across entire disc)
      for (let i = 0; i < 6000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const d = Math.hypot(x - 512, y - 512);
        if (d < 508) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
          ctx.fillRect(x, y, 1.2, 1.2);
        }
      }

      // B. Dense Concentric Lathe Polishing Micro-Grooves with varied intensity
      for (let r = 16; r < 506; r += 3.2) {
        ctx.beginPath();
        ctx.arc(512, 512, r, 0, Math.PI * 2);
        const ringSeed = (r * 37) % 100;
        if (ringSeed < 68) {
          // 68% of rings: faint polishing tracks ("kaum zu erkennen")
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 0.6;
        } else if (ringSeed < 92) {
          // 24% of rings: medium natural rings
          ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
          ctx.lineWidth = 0.9;
        } else {
          // 8% of rings: distinct, prominent optical lathe rings ("stärker")
          ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
          ctx.lineWidth = 1.4;
        }
        ctx.stroke();
      }

      // C. Systematic Omnidirectional Hairlines & Etched Scratches across ALL quadrants
      // Multi-tier hierarchy: some barely visible ("kaum zu erkennen"), some distinct and strong ("stärker")
      let seed = 12345;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      // 12 angular sectors x 4 radial rings = 48 localized sectors
      for (let sector = 0; sector < 12; sector++) {
        const baseAngle = (sector / 12) * Math.PI * 2;
        for (let ring = 0; ring < 4; ring++) {
          const rMin = ring === 0 ? 25 : ring === 1 ? 140 : ring === 2 ? 260 : 380;
          const rMax = ring === 0 ? 140 : ring === 1 ? 260 : ring === 2 ? 380 : 504;

          // 7 distinct scratches per sector-ring cell = 336 scratches
          for (let s = 0; s < 7; s++) {
            const angle = baseAngle + (rnd() - 0.5) * (Math.PI / 6);
            const radius = rMin + rnd() * (rMax - rMin);
            const cx = 512 + Math.cos(angle) * radius;
            const cy = 512 + Math.sin(angle) * radius;
            const len = 14 + rnd() * 60;
            const scratchAngle = rnd() * Math.PI * 2;
            const curve = (rnd() - 0.5) * 16;

            const p0x = cx - (Math.cos(scratchAngle) * len) / 2;
            const p0y = cy - (Math.sin(scratchAngle) * len) / 2;
            const cpx = cx + Math.cos(scratchAngle + Math.PI / 2) * curve;
            const cpy = cy + Math.sin(scratchAngle + Math.PI / 2) * curve;
            const p1x = cx + (Math.cos(scratchAngle) * len) / 2;
            const p1y = cy + (Math.sin(scratchAngle) * len) / 2;

            const tier = rnd();
            if (tier < 0.55) {
              // TIER 1: "Kaum zu erkennen" (55% of scratches)
              // Ultra-faint, delicate micro-scratches
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + rnd() * 0.11})`;
              ctx.lineWidth = 0.4 + rnd() * 0.4;
              ctx.beginPath();
              ctx.moveTo(p0x, p0y);
              ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
              ctx.stroke();
            } else if (tier < 0.82) {
              // TIER 2: Medium visible natural wear (27% of scratches)
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + rnd() * 0.25})`;
              ctx.lineWidth = 0.8 + rnd() * 0.4;
              ctx.beginPath();
              ctx.moveTo(p0x, p0y);
              ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
              ctx.stroke();
            } else {
              // TIER 3: "Stärkere Kratzer" (18% of scratches)
              // Distinct, deeper scratches with sharp definition and subtle halo
              const strongAlpha = 0.82 + rnd() * 0.18;
              const strongWidth = 1.6 + rnd() * 1.0;

              // Soft halo for physical depth
              ctx.strokeStyle = `rgba(255, 255, 255, ${strongAlpha * 0.22})`;
              ctx.lineWidth = strongWidth + 1.6;
              ctx.beginPath();
              ctx.moveTo(p0x, p0y);
              ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
              ctx.stroke();

              // Razor sharp core
              ctx.strokeStyle = `rgba(255, 255, 255, ${strongAlpha})`;
              ctx.lineWidth = strongWidth;
              ctx.beginPath();
              ctx.moveTo(p0x, p0y);
              ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
              ctx.stroke();
            }
          }
        }
      }

      // 60 long intersecting rogue scratches with same multi-tier intensity
      for (let i = 0; i < 60; i++) {
        const angle = rnd() * Math.PI * 2;
        const radius = rnd() * 460;
        const cx = 512 + Math.cos(angle) * radius;
        const cy = 512 + Math.sin(angle) * radius;
        const len = 35 + rnd() * 75;
        const scratchAngle = rnd() * Math.PI * 2;
        const curve = (rnd() - 0.5) * 22;

        const p0x = cx - (Math.cos(scratchAngle) * len) / 2;
        const p0y = cy - (Math.sin(scratchAngle) * len) / 2;
        const cpx = cx + Math.cos(scratchAngle + Math.PI / 2) * curve;
        const cpy = cy + Math.sin(scratchAngle + Math.PI / 2) * curve;
        const p1x = cx + (Math.cos(scratchAngle) * len) / 2;
        const p1y = cy + (Math.sin(scratchAngle) * len) / 2;

        const rogueTier = rnd();
        if (rogueTier < 0.50) {
          // Faint long scratch ("kaum zu erkennen")
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.07 + rnd() * 0.10})`;
          ctx.lineWidth = 0.5 + rnd() * 0.4;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
          ctx.stroke();
        } else if (rogueTier < 0.78) {
          // Medium long scratch
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.28 + rnd() * 0.22})`;
          ctx.lineWidth = 0.9 + rnd() * 0.5;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
          ctx.stroke();
        } else {
          // Strong, striking rogue scratch ("stärker")
          const alpha = 0.88 + rnd() * 0.12;
          const w = 1.8 + rnd() * 1.1;

          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
          ctx.lineWidth = w + 1.8;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
          ctx.stroke();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const microScratchTex = createMicroScratchTexture();

    // 5. Token Root Group (Supports Interactive User Cursor Drag & Momentum)
    const tokenGroup = new THREE.Group();
    const baseRotation = { x: 0.28, y: -0.36, z: -0.06 };
    tokenGroup.rotation.x = baseRotation.x;
    tokenGroup.rotation.y = baseRotation.y;
    tokenGroup.rotation.z = baseRotation.z;
    tokenGroup.scale.set(0.001, 0.001, 0.001); // Starts scaled down for pop-up entrance animation
    scene.add(tokenGroup);

    // 6. PHOTOREALISTIC DIELECTRIC OPTICAL GLASS SHADER
    // ZERO diffuse paint (plastic look 100% eliminated!)
    // Optical transmission in center, brilliant Fresnel bevel reflections, glistening micro-scratches across 100% of the surface
    const glassVertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;

      void main() {
        // Planar mapping centered at (0.5, 0.5) across the entire front and back circular faces:
        // position.xy ranges from -1.30 to +1.30 (tokenRadius 1.20 + bevelSize 0.10)
        // This maps the full disk symmetrically across all 4 quadrants (center at 0.5, 0.5)
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
        // Multi-tier scratches: faint ones are barely visible, strong ones catch crisp diamond glints
        vec2 uvClamped = clamp(vUv, 0.0, 1.0);
        vec4 scratchSample = texture2D(uMicroScratch, uvClamped);
        float scratch = scratchSample.r;

        // Normal perturbation scales with scratch depth (strong scratches catch blazing glints, faint ones shimmer gently)
        vec3 perturbedN = normalize(N + vec3(scratch * 0.30, scratch * 0.30, 0.0));

        // 2. Physical Dielectric Fresnel (Optical Crown Glass / Sapphire IOR = 1.54)
        // Center is clear transparent; glancing beveled edges reflect 100% of studio environment!
        float NdotV = max(dot(perturbedN, V), 0.0);
        float fresnel = 0.05 + 0.95 * pow(1.0 - NdotV, 3.8);

        // 3. Crisp Studio Reflection
        vec3 R = reflect(-V, perturbedN);
        vec2 envUv = vec2(atan(R.z, R.x) / (2.0 * 3.14159265) + 0.5, asin(clamp(R.y, -1.0, 1.0)) / 3.14159265 + 0.5);
        vec3 envColor = texture2D(uEnvMap, envUv).rgb;

        // 4. Omnidirectional Subtle Direct Studio Catchlights from EVERY direction ("Lichteinwirkungen von ÜBERALL"):
        // Overhead key light
        float specTop = pow(max(dot(perturbedN, H), 0.0), 65.0) * 3.2;

        // Top-left fill light
        vec3 L_topLeft = normalize(vec3(-3.8, 5.2, 3.0) - vWorldPosition);
        vec3 H_topLeft = normalize(L_topLeft + V);
        float specTopLeft = pow(max(dot(perturbedN, H_topLeft), 0.0), 50.0) * 2.0;

        // Left rim light
        vec3 L_left = normalize(vec3(-4.8, 1.8, 2.2) - vWorldPosition);
        vec3 H_left = normalize(L_left + V);
        float specLeft = pow(max(dot(perturbedN, H_left), 0.0), 50.0) * 2.2;

        // Right rim light
        vec3 L_right = normalize(vec3(4.2, -2.0, 2.0) - vWorldPosition);
        vec3 H_right = normalize(L_right + V);
        float specRight = pow(max(dot(perturbedN, H_right), 0.0), 45.0) * 1.9;

        // Bottom-left table bounce light (brilliant white lower rim)
        vec3 L_bottom = normalize(vec3(-3.0, -5.0, 2.5) - vWorldPosition);
        vec3 H_bottom = normalize(L_bottom + V);
        float specBottom = pow(max(dot(perturbedN, H_bottom), 0.0), 45.0) * 2.6;

        // Bottom-right soft fill light
        vec3 L_bottomRight = normalize(vec3(3.6, -4.6, 2.4) - vWorldPosition);
        vec3 H_bottomRight = normalize(L_bottomRight + V);
        float specBottomRight = pow(max(dot(perturbedN, H_bottomRight), 0.0), 42.0) * 1.8;

        // Front direct camera soft sheen (illuminates the central glass face gently so it never looks dead/grey)
        vec3 L_front = normalize(vec3(0.4, 0.7, 4.0) - vWorldPosition);
        vec3 H_front = normalize(L_front + V);
        float specFrontSharp = pow(max(dot(perturbedN, H_front), 0.0), 24.0) * 0.55;
        float specFrontSoft = pow(max(dot(perturbedN, H_front), 0.0), 6.0) * 0.22;
        float specFront = specFrontSharp + specFrontSoft;

        float allEdgeSpec = specTop + specTopLeft + specLeft + specRight + specBottom + specBottomRight;

        // 5. RADIANT PURE WHITE OPTICAL LIGHT SWEEP ("Echtes weißes Licht")
        float sweepSpeed = 0.28;
        float sweepPos = mod(uTime * sweepSpeed, 3.6) - 0.8;
        float coord = (vWorldPosition.x * 0.58 + vWorldPosition.y * 0.82 + 1.15) / 2.3;
        float distToSweep = abs(coord - sweepPos);

        // Sharp optical glint beam
        float sweepBeam = exp(-distToSweep * distToSweep * 90.0) * 0.95;
        // Internal refracted caustic flare
        float distRefract = abs(coord - sweepPos + 0.09 * N.x);
        float sweepRefract = exp(-distRefract * distRefract * 120.0) * 0.45;
        float totalSweep = sweepBeam + sweepRefract;

        // 6. Glistening Scratches across ALL lights (High dynamic contrast between faint and strong scratches)
        float scratchOmniCatch = (allEdgeSpec * 0.6 + specFront * 1.8) * scratch * 1.8;
        float scratchKeyCatch = pow(max(dot(perturbedN, H), 0.0), 32.0) * pow(scratch, 1.25) * 4.2;
        float scratchSweepIgnite = scratch * totalSweep * 4.5;
        float scratchPresence = scratch * 0.26; // High contrast: faint is ~0.02, strong is ~0.26

        // 7. Ambient Optical Internal Radiance (Prevents ANY "graue Masse" appearance by ensuring pure crystalline white baseline)
        vec3 ambientRadiance = vec3(1.0, 0.995, 0.99) * (0.16 + fresnel * 0.24 + specFrontSoft * 0.35);

        // 8. Composite Pure Optical Dielectric Glass (ZERO DIFFUSE = ZERO PLASTIC):
        // Silvery studio reflections on beveled rims + sharp specular catchlights from everywhere
        vec3 glassColor = vec3(1.0) * (allEdgeSpec * 1.15 + specFrontSharp + scratchKeyCatch + scratchOmniCatch + scratchSweepIgnite);
        glassColor += envColor * (fresnel * 1.35);
        glassColor += vec3(1.0, 1.0, 1.0) * (totalSweep * (fresnel * 1.3 + 0.30));
        glassColor += ambientRadiance;
        glassColor += vec3(1.0) * scratchPresence;

        // Alpha: Crisp optical crystal clarity with luminous highlights
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

    // 7. SLEEK CRYSTAL PUCK GEOMETRY (Faceted luxury chamfer, 128 segments)
    const tokenRadius = 1.20;
    const tokenDepth = 0.14; // Sleek luxury crystal lens depth

    const puckShape = new THREE.Shape();
    const circleSegments = 128;
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
      bevelSegments: 16,
      steps: 2,
      bevelSize: 0.10,
      bevelThickness: 0.08,
    });
    puckGeo.center();
    puckGeo.computeVertexNormals();

    const glassPuckMesh = new THREE.Mesh(puckGeo, glassMaterial);
    tokenGroup.add(glassPuckMesh);


    // 8. OFFICIAL VENTRION EMBLEM (Photorealistic crystal embedded emblem)
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load("/ventrion/ventrion-logo.png");
    logoTexture.colorSpace = THREE.SRGBColorSpace;

    const logoPlaneGeo = new THREE.PlaneGeometry(1.42, 1.42);
    const logoMaterial = new THREE.MeshPhysicalMaterial({
      map: logoTexture,
      transparent: true,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      emissive: new THREE.Color("#FF5C18"),
      emissiveMap: logoTexture,
      emissiveIntensity: 0.65,
      specularIntensity: 1.2,
      specularColor: new THREE.Color("#FFFFFF"),
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const vMesh = new THREE.Mesh(logoPlaneGeo, logoMaterial);
    vMesh.position.z = tokenDepth / 2 + 0.02;
    tokenGroup.add(vMesh);

    // Warm peach point light right in front of the emblem
    const vPointGlow = new THREE.PointLight(0xff6a28, 3.2, 3.5);
    vPointGlow.position.set(0, 0, vMesh.position.z + 0.25);
    tokenGroup.add(vPointGlow);

    // 9. INTERACTIVE 3D ROTATION WITH WEIGHTED DRAG, PROGRESSIVE RESISTANCE & ELASTIC RECOIL
    // "mache das spinnen SCHWERER und nur bis zu einem bestimmten grad, dann wird es immer schwerer und springt dann mit etwas rückstoß subtil zurück"
    let isDragging = false;
    let previousPointerPos = { x: 0, y: 0 };
    const userRotation = { x: 0, y: 0 };
    const rotationVelocity = { x: 0, y: 0 };
    let hasInteracted = false;

    // Angular limits before resistance stiffens dramatically
    const limitY = 0.68; // max yaw angle (~39 degrees)
    const limitX = 0.48; // max pitch angle (~27 degrees)
    const baseSensitivity = 0.0055; // Substantially heavier weighted drag feel ("SCHWERER")

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      hasInteracted = true;
      previousPointerPos = { x: e.clientX, y: e.clientY };
      rotationVelocity.x = 0;
      rotationVelocity.y = 0;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousPointerPos.x;
      const deltaY = e.clientY - previousPointerPos.y;
      previousPointerPos = { x: e.clientX, y: e.clientY };

      // Progressive resistance as cursor moves further toward / past limits
      const dispY = Math.abs(userRotation.y) / limitY;
      const dispX = Math.abs(userRotation.x) / limitX;

      // If pulling in direction that increases displacement, resistance kicks in
      let resistY = 1.0;
      if ((deltaX > 0 && userRotation.y > 0) || (deltaX < 0 && userRotation.y < 0)) {
        resistY = Math.max(0.06, 1.0 - Math.pow(Math.min(dispY, 1.4), 2.2));
      }

      let resistX = 1.0;
      if ((deltaY > 0 && userRotation.x > 0) || (deltaY < 0 && userRotation.x < 0)) {
        resistX = Math.max(0.06, 1.0 - Math.pow(Math.min(dispX, 1.4), 2.2));
      }

      const stepY = deltaX * baseSensitivity * resistY;
      const stepX = deltaY * baseSensitivity * resistX;

      userRotation.y += stepY;
      userRotation.x += stepX;

      // Hard limits to keep token from tumbling or inverting
      const hardLimitY = limitY * 1.30;
      const hardLimitX = limitX * 1.30;
      userRotation.y = Math.max(-hardLimitY, Math.min(hardLimitY, userRotation.y));
      userRotation.x = Math.max(-hardLimitX, Math.min(hardLimitX, userRotation.x));

      // Impart fling velocity
      rotationVelocity.y = stepY * 0.75;
      rotationVelocity.x = stepX * 0.75;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // Initial render
    renderer.render(scene, camera);

    // 10. Pop-Up Entrance Animation & Continuous Smooth Physics Loop
    let animId: number;
    const clock = new THREE.Clock();
    const startTime = performance.now();
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const dt = Math.min(0.033, Math.max(0.001, (currentTime - lastTime) / 1000));
      lastTime = currentTime;

      const elapsed = clock.getElapsedTime();
      const popUpDuration = 0.95; // seconds
      const popUpProgress = Math.min(1.0, (currentTime - startTime) / (popUpDuration * 1000));

      // Pure steep-rise ease curve on the original flat sine:
      // Steep initial pop from 0, completely flat horizontal landing at 1.0, strictly <= 1.0 (no overshoot)
      let currentScale = 1.0;
      if (popUpProgress < 1.0) {
        const p = popUpProgress;
        const progressSteep = 1 - Math.pow(1 - p, 3.2);
        currentScale = Math.min(1.0, Math.sin(progressSteep * Math.PI * 0.5));
      }
      tokenGroup.scale.set(currentScale, currentScale, currentScale);

      // Update light sweep uniform
      glassUniforms.uTime.value = elapsed;

      // Rotational Physics (Damped Harmonic Spring Recoil: "springt dann mit etwas rückstoß subtil zurück")
      if (!isDragging) {
        // Rest position is 0
        const springK = 36.0; // Snappy return strength
        const damping = 0.88; // Slightly underdamped for tactile elastic recoil

        const forceX = -springK * userRotation.x;
        const forceY = -springK * userRotation.y;

        rotationVelocity.x = (rotationVelocity.x + forceX * dt) * Math.pow(damping, dt * 60);
        rotationVelocity.y = (rotationVelocity.y + forceY * dt) * Math.pow(damping, dt * 60);

        userRotation.x += rotationVelocity.x * dt;
        userRotation.y += rotationVelocity.y * dt;

        // Clean deadband snap when settled
        if (Math.abs(userRotation.x) < 0.0004 && Math.abs(rotationVelocity.x) < 0.0008) {
          userRotation.x = 0;
          rotationVelocity.x = 0;
        }
        if (Math.abs(userRotation.y) < 0.0004 && Math.abs(rotationVelocity.y) < 0.0008) {
          userRotation.y = 0;
          rotationVelocity.y = 0;
        }
      }

      // Gentle organic 3D float oscillation
      const floatX = Math.sin(elapsed * 1.2) * 0.032;
      const floatY = Math.cos(elapsed * 1.0) * 0.036;
      const floatZ = Math.sin(elapsed * 0.8) * 0.015;

      // Apply composed rotation (Base angle + User Interactive Drag + Organic Float)
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
      glassMaterial.dispose();
      puckGeo.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-[240px] h-[240px] pointer-events-auto cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
      title="Click and drag to rotate the 3D token"
    />
  );
}
