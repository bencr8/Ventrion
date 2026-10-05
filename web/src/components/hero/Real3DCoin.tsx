"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Real3DCoinProps {
  className?: string;
}

export function Real3DCoin({ className = "" }: Real3DCoinProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = 220;
    const height = 220;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    // 2. WebGL Renderer with Antialiasing & Alpha
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Coin Root Group
    const coinGroup = new THREE.Group();
    coinGroup.rotation.x = 0.22;
    coinGroup.rotation.y = -0.26;
    coinGroup.rotation.z = -0.12;
    scene.add(coinGroup);

    // 4. Materials (High-End Ceramic Porcelain PBR)
    const ceramicMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#FAF7F2"),
      roughness: 0.18,
      metalness: 0.02,
      clearcoat: 0.95,
      clearcoatRoughness: 0.12,
      reflectivity: 0.9,
    });

    const innerDishMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#F3EDE3"),
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });

    const vPeachMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#F68D66"),
      emissive: new THREE.Color("#E57A52"),
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    // 5. Geometry Construction

    // A. Outer Rim: Thick Torus / Bevel Ring
    const outerRimGeo = new THREE.TorusGeometry(1.22, 0.28, 36, 64);
    const outerRimMesh = new THREE.Mesh(outerRimGeo, ceramicMaterial);
    outerRimMesh.castShadow = true;
    outerRimMesh.receiveShadow = true;
    coinGroup.add(outerRimMesh);

    // B. Coin Main Cylindrical Body
    const coinBodyGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.45, 64);
    const coinBodyMesh = new THREE.Mesh(coinBodyGeo, ceramicMaterial);
    coinBodyMesh.rotation.x = Math.PI / 2;
    coinBodyMesh.castShadow = true;
    coinBodyMesh.receiveShadow = true;
    coinGroup.add(coinBodyMesh);

    // C. Recessed Dish Face (front)
    const dishFaceGeo = new THREE.CylinderGeometry(0.96, 0.96, 0.08, 48);
    const dishFaceMesh = new THREE.Mesh(dishFaceGeo, innerDishMaterial);
    dishFaceMesh.rotation.x = Math.PI / 2;
    dishFaceMesh.position.z = 0.18;
    dishFaceMesh.receiveShadow = true;
    coinGroup.add(dishFaceMesh);

    // D. 3D Chubby "V" Extrusion
    const vShape = new THREE.Shape();
    // Precision outline of the chubby V
    vShape.moveTo(-0.48, 0.46);
    vShape.lineTo(-0.24, 0.46);
    vShape.lineTo(0.0, -0.22);
    vShape.lineTo(0.24, 0.46);
    vShape.lineTo(0.48, 0.46);
    vShape.lineTo(0.12, -0.42);
    vShape.bezierCurveTo(0.06, -0.52, -0.06, -0.52, -0.12, -0.42);
    vShape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.05,
      bevelThickness: 0.06,
    };

    const vGeo = new THREE.ExtrudeGeometry(vShape, extrudeSettings);
    vGeo.center();
    const vMesh = new THREE.Mesh(vGeo, vPeachMaterial);
    vMesh.position.z = 0.28;
    vMesh.castShadow = true;
    coinGroup.add(vMesh);

    // 6. Lighting Setup
    // Key Light (Warm Sun from top-left)
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light (Soft ambient sky)
    const fillLight = new THREE.DirectionalLight(0xf0f4f8, 1.0);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    // Peach Glow Internal Point Light (Casts peach warmth on ceramic dish)
    const peachPointLight = new THREE.PointLight(0xff8a60, 2.5, 3.5);
    peachPointLight.position.set(0, 0, 0.6);
    coinGroup.add(peachPointLight);

    // Soft Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // 7. Mouse Movement Handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseRef.current.targetX = (clientX / rect.width - 0.5) * 0.85;
      mouseRef.current.targetY = (clientY / rect.height - 0.5) * 0.85;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 8. Render Animation Loop with Smooth Spring Physics
    let animationFrameId: number;
    const baseRotX = 0.22;
    const baseRotY = -0.26;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth lerp damping towards mouse target
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      coinGroup.rotation.x = baseRotX + mouseRef.current.y;
      coinGroup.rotation.y = baseRotY + mouseRef.current.x;

      // Gentle floating oscillation
      const time = performance.now() * 0.0015;
      coinGroup.position.y = Math.sin(time) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      outerRimGeo.dispose();
      coinBodyGeo.dispose();
      dishFaceGeo.dispose();
      vGeo.dispose();
      ceramicMaterial.dispose();
      innerDishMaterial.dispose();
      vPeachMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="relative z-20 w-[220px] h-[220px]" />

      {/* Realistic Soft Contact Shadow on Canvas */}
      <div className="absolute -bottom-4 left-4 w-44 h-12 rounded-[100%] bg-[#362015]/20 blur-xl pointer-events-none transform -rotate-3 scale-95 z-10" />
      <div className="absolute -bottom-1 left-10 w-32 h-6 rounded-[100%] bg-black/25 blur-md pointer-events-none transform -rotate-1 z-10" />
    </div>
  );
}
