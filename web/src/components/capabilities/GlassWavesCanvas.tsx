"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface GlassWavesCanvasProps {
  activeIndex: number;
  mousePos: { x: number; y: number };
  containerBounds?: { width: number; height: number };
  isHovering: boolean;
}

// 4 Distinct Nuanced Variations of Radiant Ventrion Solar Orange (True Orange, No Reddish/Rust Tones!)
interface LayerSpec {
  baseZ: number;
  baseY: number;
  amp1: number;
  amp2: number;
  freq1: number;
  freq2: number;
  speed: number;
  phase: number;
  depthArch: number;
  zAmp: number;
  thickness: number;
  opacity: number;
  colorHex: string;
}

const LAYER_SPECS: LayerSpec[] = [
  // Layer 0: Deep Horizon Radiant Orange Bed (Deepest depth, rich warm solar orange)
  {
    baseZ: -1.25,
    baseY: -0.35,
    amp1: 0.95,
    amp2: 0.45,
    freq1: 0.28,
    freq2: 0.56,
    speed: 0.24,
    phase: 0.0,
    depthArch: 0.75,
    zAmp: 0.48,
    thickness: 2.2,
    opacity: 0.88,
    colorHex: "#FF5E16", // Warm radiant Ventrion orange
  },
  // Layer 1: Mid-Back Sculptural Ribbon (Canonical Ventrion Solar Orange, sweeping S-curve)
  {
    baseZ: -0.40,
    baseY: -0.05,
    amp1: 1.05,
    amp2: 0.50,
    freq1: 0.36,
    freq2: 0.72,
    speed: 0.30,
    phase: 1.85,
    depthArch: 0.85,
    zAmp: 0.58,
    thickness: 2.0,
    opacity: 0.92,
    colorHex: "#FF6C1E", // Vibrant canonical solar orange
  },
  // Layer 2: Hero Center Crest Ribbon (Luminous electric golden-orange crest)
  {
    baseZ: 0.35,
    baseY: 0.22,
    amp1: 1.10,
    amp2: 0.52,
    freq1: 0.44,
    freq2: 0.88,
    speed: 0.36,
    phase: 3.70,
    depthArch: 0.95,
    zAmp: 0.65,
    thickness: 1.8,
    opacity: 0.94,
    colorHex: "#FF7E28", // Luminous radiant golden-orange
  },
  // Layer 3: Foreground Crystalline Ribbon (Bright solar apricot edge, high parallax)
  {
    baseZ: 1.05,
    baseY: 0.48,
    amp1: 0.88,
    amp2: 0.42,
    freq1: 0.52,
    freq2: 1.04,
    speed: 0.42,
    phase: 5.35,
    depthArch: 0.70,
    zAmp: 0.46,
    thickness: 1.5,
    opacity: 0.86,
    colorHex: "#FF9238", // Luminous crystalline apricot-orange
  },
];

export function GlassWavesCanvas({
  activeIndex,
  mousePos,
  containerBounds = { width: 1100, height: 530 },
  isHovering,
}: GlassWavesCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // References for render loop state
  const mousePosRef = useRef(mousePos);
  mousePosRef.current = mousePos;

  const containerBoundsRef = useRef(containerBounds);
  containerBoundsRef.current = containerBounds;

  const isHoveringRef = useRef(isHovering);
  isHoveringRef.current = isHovering;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || containerBoundsRef.current.width || 1100;
    let height = container.clientHeight || containerBoundsRef.current.height || 530;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0xff5c18, 1); // Rich Ventrion orange clear color
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Texture for Sparkling Pure White Edge Glints
    const createStudioEnvironmentTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;

      // Pristine White Studio Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
      bgGrad.addColorStop(0, "#FFFFFF");
      bgGrad.addColorStop(0.35, "#FAFAFA");
      bgGrad.addColorStop(0.7, "#F5F6F8");
      bgGrad.addColorStop(1, "#ECEEF1");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Studio Overhead Softbox (Pure White Gleam)
      const topSoftbox = ctx.createRadialGradient(512, 50, 10, 512, 50, 260);
      topSoftbox.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      topSoftbox.addColorStop(0.5, "rgba(255, 255, 255, 0.98)");
      topSoftbox.addColorStop(0.85, "rgba(255, 255, 255, 0.50)");
      topSoftbox.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = topSoftbox;
      ctx.fillRect(100, 0, 824, 220);

      // Left Rim Catchlight Strip
      const leftStrip = ctx.createLinearGradient(0, 0, 220, 0);
      leftStrip.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      leftStrip.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
      leftStrip.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = leftStrip;
      ctx.fillRect(0, 40, 220, 360);

      // Right Studio Rim Strip
      const rightStrip = ctx.createLinearGradient(1024, 0, 804, 0);
      rightStrip.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      rightStrip.addColorStop(0.5, "rgba(255, 255, 255, 0.45)");
      rightStrip.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = rightStrip;
      ctx.fillRect(804, 40, 220, 360);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const envMap = createStudioEnvironmentTexture();

    // 4. Custom Parametric 3D Glass Wave Shader: Smooth Flow, Deep Overlaps, Zero Weird Ripples
    const glassVertexShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uHover;
      uniform float uBaseZ;
      uniform float uBaseY;
      uniform float uAmp1;
      uniform float uAmp2;
      uniform float uFreq1;
      uniform float uFreq2;
      uniform float uSpeed;
      uniform float uPhase;
      uniform float uDepthArch;
      uniform float uZAmp;
      uniform float uLayerIndex;
      uniform float uRibbonHeight;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vLocalV;
      varying float vOpticalDepth;

      // Closed-form continuous sinusoidal displacement function (Smooth, elegant, fluid)
      vec3 evaluateWave(float x, float y) {
        float normV = clamp(y / uRibbonHeight + 0.5, 0.0, 1.0);
        float t = uTime * uSpeed + uPhase;

        // 1. Primary multi-frequency undulating wave along X axis
        float waveY1 = sin(x * uFreq1 + t) * uAmp1;
        float waveY2 = cos(x * uFreq2 - t * 0.75 + uPhase * 0.5) * uAmp2;
        float totalWaveY = waveY1 + waveY2;

        // 2. 3D Cross-sectional Arching along ribbon width
        float crossArch = sin(normV * 3.14159265) * uDepthArch;
        float waveZ1 = cos(x * (uFreq1 * 0.85) + t * 0.75 + uPhase) * uZAmp;
        float waveZ2 = sin(x * (uFreq2 * 0.55) - t * 0.45) * (uZAmp * 0.35);
        float totalZ = uBaseZ + crossArch + waveZ1 + waveZ2;

        // 3. Smooth harmonic cursor convergence (natural attraction without circular ripples)
        float distX = abs(x - (uMouse.x * 6.5));
        float attractFactor = exp(-distX * distX * 0.065) * uHover;

        float focalY = sin(x * 0.35 + uTime * 0.35) * 0.30 + (uMouse.y * 0.95);
        float focalZ = 0.15 + (uLayerIndex - 1.5) * 0.18;

        float finalY = y + uBaseY + mix(totalWaveY, focalY, attractFactor * 0.38);
        float finalZ = mix(totalZ, focalZ, attractFactor * 0.48);

        // Responsive gentle tilt
        finalY += (normV - 0.5) * (uMouse.y * 0.25) * attractFactor;

        return vec3(x, finalY, finalZ);
      }

      void main() {
        vUv = uv;
        vLocalV = uv.y;

        vec3 displacedP = evaluateWave(position.x, position.y);
        vOpticalDepth = displacedP.z;

        // Surface Normal via finite differences on the GPU
        float eps = 0.035;
        vec3 pX1 = evaluateWave(position.x + eps, position.y);
        vec3 pX0 = evaluateWave(position.x - eps, position.y);
        vec3 pY1 = evaluateWave(position.x, position.y + eps);
        vec3 pY0 = evaluateWave(position.x, position.y - eps);

        vec3 dX = (pX1 - pX0) / (2.0 * eps);
        vec3 dY = (pY1 - pY0) / (2.0 * eps);
        vec3 computedN = normalize(cross(dX, dY));

        vec4 worldPos = modelMatrix * vec4(displacedP, 1.0);
        vWorldPosition = worldPos.xyz;

        vNormal = normalize(mat3(modelMatrix) * computedN);
        vec4 mvPosition = modelViewMatrix * vec4(displacedP, 1.0);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const glassFragmentShader = `
      uniform sampler2D uEnvMap;
      uniform vec3 uLayerColor;          // True Ventrion Solar Orange (No Reddish Tones)
      uniform float uThickness;           // 1.5 - 2.2
      uniform vec3 uMouseLightPos;        // Dynamic virtual 3D point light
      uniform float uHover;
      uniform float uBaseAlpha;
      uniform float uLayerIndex;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vLocalV;
      varying float vOpticalDepth;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);

        if (!gl_FrontFacing) {
          N = -N;
        }

        // 1. Dielectric Fresnel (Glass IOR = 1.52)
        float NdotV = clamp(dot(N, V), 0.0, 1.0);
        float F0 = 0.043;
        float fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 3.8);

        // 2. High-Key Studio Reflection Mapping
        vec3 R = reflect(-V, N);
        float phi = atan(R.z, R.x);
        float theta = asin(clamp(R.y, -1.0, 1.0));
        vec2 envUv = vec2(phi / (2.0 * 3.14159265) + 0.5, theta / 3.14159265 + 0.5);
        vec3 envReflect = texture2D(uEnvMap, envUv).rgb;

        // 3. Volumetric Translucent Glass Body with Beer-Lambert Optical Depth
        float opticalPath = uThickness / max(0.24, NdotV);
        float absorb = exp(-opticalPath / 4.8);
        vec3 bodyColor = mix(uLayerColor, vec3(1.0, 0.94, 0.86), absorb * 0.35);

        // 4. "EIN PAAR WEISSE STELLEN": Razor-Sharp Pure White Specular Glints & Edge Reflections
        // A) Key Directional Light (Crisp Pure White Glint on crests)
        vec3 L_key = normalize(vec3(-3.0, 4.6, 4.0));
        vec3 H_key = normalize(L_key + V);
        float NdotH_key = max(dot(N, H_key), 0.0);
        float specKeySharp = pow(NdotH_key, 85.0) * 2.8;
        float specKeySoft = pow(NdotH_key, 20.0) * 0.40;
        vec3 whiteKey = vec3(1.0) * (specKeySharp + specKeySoft);

        // B) Studio Rim Light (Pure White Rim Catchlight)
        vec3 L_rim = normalize(vec3(4.2, -2.0, 3.6));
        vec3 H_rim = normalize(L_rim + V);
        float specRim = pow(max(dot(N, H_rim), 0.0), 65.0) * 1.4;
        vec3 whiteRim = vec3(1.0) * specRim;

        // C) Interactive Spotlight (Brilliant White Flash tracking cursor in 3D)
        vec3 L_cursor = uMouseLightPos - vWorldPosition;
        float distCursor = length(L_cursor);
        L_cursor = normalize(L_cursor);
        vec3 H_cursor = normalize(L_cursor + V);
        float lightAtten = 1.0 / (1.0 + 0.14 * distCursor * distCursor);
        float specCursor = pow(max(dot(N, H_cursor), 0.0), 75.0) * 3.8 * lightAtten;
        vec3 whiteCursor = vec3(1.0) * specCursor;

        // D) Pure White Fresnel Edge Catchlight
        vec3 whiteFresnel = envReflect * pow(1.0 - NdotV, 3.2) * 0.95;

        // E) Razor-Sharp Glint along the wave peaks
        float crestGlint = pow(max(0.0, 1.0 - abs(N.z)), 6.0) * 0.85;
        vec3 whiteCrest = vec3(1.0) * crestGlint;

        vec3 whiteHighlights = whiteKey + whiteRim + whiteCursor + whiteFresnel + whiteCrest;

        // 5. Soft Edge Tapering along ribbon borders
        float edgeFade = smoothstep(0.0, 0.10, vLocalV) * smoothstep(1.0, 0.90, vLocalV);

        // 6. Final Crystal Glass Tone
        vec3 finalColor = bodyColor + whiteHighlights;

        // Rich Opacity for Deep Overlapping
        float alpha = (0.50 + fresnel * 0.35 + (1.0 - absorb) * 0.30) * uBaseAlpha * edgeFade;
        alpha = clamp(alpha, 0.0, 0.96);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    // 5. Build 4 Parametric Wave Meshes (Deep Interlocking Layers)
    const ribbonWidth = 24.0;
    const ribbonHeight = 4.2;
    const segmentsX = 140;
    const segmentsY = 40;

    const waveMeshes: THREE.Mesh[] = [];
    const waveMaterials: THREE.ShaderMaterial[] = [];
    const waveGeometries: THREE.PlaneGeometry[] = [];

    LAYER_SPECS.forEach((spec, index) => {
      const geometry = new THREE.PlaneGeometry(
        ribbonWidth,
        ribbonHeight,
        segmentsX,
        segmentsY
      );
      waveGeometries.push(geometry);

      const layerColor = new THREE.Color(spec.colorHex);

      const material = new THREE.ShaderMaterial({
        vertexShader: glassVertexShader,
        fragmentShader: glassFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uHover: { value: 0 },
          uBaseZ: { value: spec.baseZ },
          uBaseY: { value: spec.baseY },
          uAmp1: { value: spec.amp1 },
          uAmp2: { value: spec.amp2 },
          freq1: { value: spec.freq1 },
          uFreq1: { value: spec.freq1 },
          uFreq2: { value: spec.freq2 },
          uSpeed: { value: spec.speed },
          uPhase: { value: spec.phase },
          uDepthArch: { value: spec.depthArch },
          uZAmp: { value: spec.zAmp },
          uLayerIndex: { value: index },
          uRibbonHeight: { value: ribbonHeight },
          uEnvMap: { value: envMap },
          uLayerColor: { value: layerColor },
          uThickness: { value: spec.thickness },
          uMouseLightPos: { value: new THREE.Vector3(0, 0, 2.8) },
          uBaseAlpha: { value: spec.opacity },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
      });
      waveMaterials.push(material);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = index;
      scene.add(mesh);
      waveMeshes.push(mesh);
    });

    // 6. Atmospheric Solar Orange Backdrop Plane (Harmonious Pure Orange Stage, ZERO Reddish/Brown Tone!)
    const backdropGeo = new THREE.PlaneGeometry(26.0, 12.0, 40, 20);
    const backdropMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uHover;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Pure Radiant Ventrion Orange Palette (No Reddish / Rust Tones!)
          vec3 topOrange  = vec3(1.0, 0.48, 0.16);   // #FF7A29 (warm luminous golden-orange)
          vec3 midOrange  = vec3(1.0, 0.38, 0.10);   // #FF611A (canonical solar orange)
          vec3 baseOrange = vec3(0.96, 0.33, 0.08);  // #F55414 (rich solar orange base, NOT dark red)

          vec3 baseGrad = mix(baseOrange, topOrange, uv.y * 0.70 + uv.x * 0.30);
          baseGrad = mix(baseGrad, midOrange, sin(uv.x * 3.14159) * 0.25);

          // Subtle moving caustic light bands
          float band = sin(uv.x * 3.8 + uTime * 0.22 + sin(uv.y * 3.2));
          float caustic = pow(max(0.0, band * 0.5 + 0.5), 2.6) * 0.14;

          // Responsive gentle mouse warmth
          float mouseDist = length(uv - vec2(uMouse.x * 0.35 + 0.5, -uMouse.y * 0.25 + 0.5));
          float mouseGlow = exp(-mouseDist * mouseDist * 3.8) * uHover * 0.12;

          vec3 finalBackdrop = baseGrad + vec3(caustic + mouseGlow);

          // Rich opacity for crisp 100% white text contrast
          gl_FragColor = vec4(finalBackdrop, 0.98);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uHover: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.set(0, 0, -2.2);
    backdropMesh.renderOrder = -1;
    scene.add(backdropMesh);

    // 7. Interactive Physics & Animation State
    let animationFrameId: number;
    const clock = new THREE.Clock();

    // Damped spring physics state
    let springMouseX = 0;
    let springMouseY = 0;
    let springHover = 0;

    const render = () => {
      const elapsedTime = clock.getElapsedTime();

      // Normalize mouse coordinates from container center [-1, 1]
      const curBounds = containerBoundsRef.current;
      const bWidth = curBounds.width || width || 1100;
      const bHeight = curBounds.height || height || 530;
      const halfW = bWidth / 2;
      const halfH = bHeight / 2;

      const targetX = Math.max(-1, Math.min(1, (mousePosRef.current.x - halfW) / halfW));
      const targetY = Math.max(-1, Math.min(1, (mousePosRef.current.y - halfH) / halfH));
      const targetHover = isHoveringRef.current ? 1.0 : 0.0;

      // Smooth Spring / Lerp integration
      springMouseX += (targetX - springMouseX) * 0.045;
      springMouseY += (targetY - springMouseY) * 0.045;
      springHover += (targetHover - springHover) * 0.055;

      // Camera Parallax
      camera.position.x = springMouseX * 0.38;
      camera.position.y = -springMouseY * 0.26;
      camera.lookAt(springMouseX * 0.05, -springMouseY * 0.04, 0.0);

      // Dynamic cursor spotlight in 3D world space
      const mouseLightWorld = new THREE.Vector3(
        springMouseX * 4.8,
        -springMouseY * 2.2,
        2.8
      );

      // Update Wave Uniforms
      waveMaterials.forEach((mat) => {
        mat.uniforms.uTime.value = elapsedTime;
        mat.uniforms.uMouse.value.set(springMouseX, -springMouseY);
        mat.uniforms.uHover.value = springHover;
        mat.uniforms.uMouseLightPos.value.copy(mouseLightWorld);
      });

      // Individual Layer Depth Parallax
      waveMeshes.forEach((mesh, idx) => {
        const parallaxFactor = 0.20 + idx * 0.25;
        mesh.rotation.y = springMouseX * 0.028 * parallaxFactor;
        mesh.rotation.x = springMouseY * 0.018 * parallaxFactor;
        mesh.position.x = -springMouseX * 0.14 * (1.0 - parallaxFactor);
      });

      // Update Backdrop Uniforms
      backdropMat.uniforms.uTime.value = elapsedTime;
      backdropMat.uniforms.uMouse.value.set(springMouseX, -springMouseY);
      backdropMat.uniforms.uHover.value = springHover;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 8. Responsive Resize Handling
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || containerBoundsRef.current.width || 1100;
      height = container.clientHeight || containerBoundsRef.current.height || 530;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 9. Resource Disposal
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      waveGeometries.forEach((g) => g.dispose());
      waveMaterials.forEach((m) => m.dispose());
      backdropGeo.dispose();
      backdropMat.dispose();
      envMap.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
