import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PublicNavSection } from '../types';

interface ImmersiveBackgroundProps {
  activeSection: PublicNavSection;
}

export const ImmersiveBackground: React.FC<ImmersiveBackgroundProps> = ({ activeSection }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Helper to get distinct vibrant color palettes per section
  const getPalette = (section: PublicNavSection) => {
    switch (section) {
      case 'PROJECTION DESIGN':
        return {
          base: new THREE.Color('#020d18'),
          color1: new THREE.Color('#0284c7'), // Electric Sky Cyan
          color2: new THREE.Color('#0d9488'), // Luminous Ocean Teal
          color3: new THREE.Color('#1d4ed8')  // Sapphire Beam
        };
      case 'IMMERSIVE MEDIA':
        return {
          base: new THREE.Color('#0d0217'),
          color1: new THREE.Color('#9333ea'), // Vibrant Purple
          color2: new THREE.Color('#d946ef'), // Electric Fuchsia
          color3: new THREE.Color('#2563eb')  // Cosmic Blue
        };
      case 'CONTACT':
        return {
          base: new THREE.Color('#01140b'),
          color1: new THREE.Color('#059669'), // Luminous Emerald
          color2: new THREE.Color('#047857'), // Deep Forest Jade
          color3: new THREE.Color('#14b8a6')  // Bright Mint Teal
        };
      case 'ABOUT':
      default:
        return {
          base: new THREE.Color('#120904'),
          color1: new THREE.Color('#9a3412'), // Warm Terracotta Amber
          color2: new THREE.Color('#854d0e'), // Warm Gold Ochre
          color3: new THREE.Color('#c2410c')  // Luminous Copper
        };
    }
  };

  const targetPalette = useRef(getPalette(activeSection));

  // Update target palette whenever activeSection changes
  useEffect(() => {
    targetPalette.current = getPalette(activeSection);
  }, [activeSection]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fullscreen Orthographic setup for precise edge-to-edge quad
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL initialization skipped or failed:', err);
      return;
    }

    const geometry = new THREE.PlaneGeometry(2, 2);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      uniform vec3 uColorBase;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;

      varying vec2 vUv;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
        vec2 mouseSt = (uMouse * uResolution.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

        float t = uTime * 0.35;

        // Distance from current pixel to mouse cursor
        float mouseDist = length(st - mouseSt);
        float mouseForce = smoothstep(0.75, 0.0, mouseDist);

        // Noise textures
        float n1 = noise(st * 2.2 + vec2(t * 0.25, t * 0.18));
        float n2 = noise(st * 2.8 - vec2(t * 0.18, t * 0.28));

        // Base Kinetic Orbs that shift dynamically toward mouse cursor
        vec2 p1 = vec2(
          sin(t * 0.7) * 0.45,
          cos(t * 0.5) * 0.35
        ) + (mouseSt - vec2(0.15, 0.1)) * 0.35;

        vec2 p2 = vec2(
          cos(t * 0.6) * 0.55,
          sin(t * 0.8) * 0.45
        ) + (mouseSt + vec2(0.15, -0.1)) * 0.4;

        vec2 p3 = vec2(
          sin(t * 0.4) * 0.3,
          cos(t * 0.9) * 0.3
        ) - (mouseSt) * 0.25;

        float d1 = length(st - p1);
        float d2 = length(st - p2);
        float d3 = length(st - p3);

        float w1 = 1.0 - smoothstep(0.0, 0.85, d1 + n1 * 0.20);
        float w2 = 1.0 - smoothstep(0.0, 0.75, d2 + n2 * 0.25);
        float w3 = 1.0 - smoothstep(0.0, 0.65, d3 + n1 * 0.15);

        // Direct cursor spotlight glow and liquid ripple
        float mouseGlow = 1.0 - smoothstep(0.0, 0.50, mouseDist + n1 * 0.1);
        float mouseRipple = sin(mouseDist * 18.0 - t * 4.0) * exp(-mouseDist * 3.5) * 0.12;

        vec3 col = uColorBase;
        col = mix(col, uColor1, clamp(w1 * 0.75 + mouseGlow * 0.4, 0.0, 1.0));
        col = mix(col, uColor2, clamp(w2 * 0.70 + mouseForce * 0.35, 0.0, 1.0));
        col = mix(col, uColor3, clamp(w3 * 0.60 + mouseRipple * 0.4, 0.0, 1.0));

        // Inject vibrant cursor highlight aura directly under cursor
        col += uColor1 * mouseGlow * 0.5;
        col += uColor2 * (1.0 - smoothstep(0.0, 0.22, mouseDist)) * 0.3;

        // High resolution tactile film grain
        float grain = (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.085;
        col += grain;

        // Subtle vignette
        float vignette = 1.0 - smoothstep(0.3, 1.3, length(st));
        col *= (0.65 + 0.35 * vignette);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const initial = getPalette(activeSection);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uColorBase: { value: initial.base.clone() },
      uColor1: { value: initial.color1.clone() },
      uColor2: { value: initial.color2.clone() },
      uColor3: { value: initial.color3.clone() }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false
    });

    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let isTouchInteraction = false;

    const handlePointerMove = (e: MouseEvent | TouchEvent | PointerEvent) => {
      let clientX = -1;
      let clientY = -1;

      if ('touches' in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        isTouchInteraction = true;
      } else if ('targetTouches' in e && (e as TouchEvent).targetTouches && (e as TouchEvent).targetTouches.length > 0) {
        clientX = (e as TouchEvent).targetTouches[0].clientX;
        clientY = (e as TouchEvent).targetTouches[0].clientY;
        isTouchInteraction = true;
      } else if ('clientX' in e && typeof e.clientX === 'number') {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      if (clientX >= 0 && clientY >= 0) {
        mousePos.current.targetX = clientX / window.innerWidth;
        mousePos.current.targetY = 1.0 - (clientY / window.innerHeight);
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchstart', handlePointerMove, { passive: true });
    document.addEventListener('touchmove', handlePointerMove, { passive: true });

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Silky responsive mouse/touch lerp (faster response on touch)
      const lerpSpeed = isTouchInteraction ? 0.25 : 0.12;
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * lerpSpeed;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * lerpSpeed;
      uniforms.uMouse.value.set(mousePos.current.x, mousePos.current.y);

      if (!prefersReducedMotion) {
        uniforms.uTime.value = elapsedTime;
      }

      // Smoothly interpolate uniform colors toward target palette
      const target = targetPalette.current;
      uniforms.uColorBase.value.lerp(target.base, 0.04);
      uniforms.uColor1.value.lerp(target.color1, 0.04);
      uniforms.uColor2.value.lerp(target.color2, 0.04);
      uniforms.uColor3.value.lerp(target.color3, 0.04);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchstart', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      materialRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};

