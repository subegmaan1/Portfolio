import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface ProjectHoverPreviewProps {
  hoveredProject: Project | null;
}

// Global mouse tracker to guarantee instant position sync without any initial snapping
let currentGlobalMouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
let currentGlobalMouseY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;

if (typeof window !== 'undefined') {
  const updateGlobalPos = (e: MouseEvent | PointerEvent) => {
    if (e.clientX !== undefined && e.clientY !== undefined) {
      currentGlobalMouseX = e.clientX;
      currentGlobalMouseY = e.clientY;
    }
  };
  window.addEventListener('mousemove', updateGlobalPos, { passive: true });
  window.addEventListener('pointermove', updateGlobalPos, { passive: true });
}

export const ProjectHoverPreview: React.FC<ProjectHoverPreviewProps> = ({ hoveredProject }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHoverSupported, setIsHoverSupported] = useState<boolean>(true);

  // Check hover capability on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      setIsHoverSupported(supportsHover);
    }
  }, []);

  // Butter-smooth RAF lerp loop directly on container transform
  useEffect(() => {
    if (!isHoverSupported || !hoveredProject) return;

    const cardWidth = 340;
    const cardHeight = 220;

    let targetX = currentGlobalMouseX;
    let targetY = currentGlobalMouseY;
    let posX = currentGlobalMouseX;
    let posY = currentGlobalMouseY;
    let lastPosX = posX;
    let currentRotation = 0;
    let animId: number;

    const computeTargetPos = (mx: number, my: number) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Position to the right-bottom with cursor clearance
      let tx = mx + 28;
      let ty = my - 110;

      // Smooth flip to left if too close to right edge
      if (tx + cardWidth > vw - 24) {
        tx = mx - cardWidth - 28;
      }
      // Clamping vertically
      if (ty + cardHeight > vh - 24) {
        ty = vh - cardHeight - 24;
      }
      if (ty < 24) {
        ty = 24;
      }

      return { tx, ty };
    };

    const initial = computeTargetPos(currentGlobalMouseX, currentGlobalMouseY);
    posX = initial.tx;
    posY = initial.ty;
    targetX = initial.tx;
    targetY = initial.ty;
    lastPosX = posX;

    if (containerRef.current) {
      containerRef.current.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(0deg)`;
    }

    const onPointerMove = (e: MouseEvent | PointerEvent) => {
      if (e.clientX !== undefined && e.clientY !== undefined) {
        const computed = computeTargetPos(e.clientX, e.clientY);
        targetX = computed.tx;
        targetY = computed.ty;
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const loop = () => {
      // Lerp for butter smooth tracking without any discrete jitter
      const dx = targetX - posX;
      const dy = targetY - posY;

      posX += dx * 0.16;
      posY += dy * 0.16;

      const vx = posX - lastPosX;
      lastPosX = posX;

      // Subtle dynamic physical tilt based on horizontal drag speed
      const targetTilt = Math.max(-6, Math.min(6, vx * 0.35));
      currentRotation += (targetTilt - currentRotation) * 0.12;

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(${currentRotation}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(animId);
    };
  }, [hoveredProject, isHoverSupported]);

  if (!isHoverSupported) return null;

  const mediaUrl =
    hoveredProject?.hoverMedia ||
    hoveredProject?.heroMedia ||
    (hoveredProject?.gallery && hoveredProject.gallery.length > 0 ? hoveredProject.gallery[0] : '');

  const isVideo =
    mediaUrl.endsWith('.mp4') ||
    mediaUrl.endsWith('.webm') ||
    mediaUrl.includes('video') ||
    mediaUrl.startsWith('data:video');

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 pointer-events-none z-[99999] hidden lg:block will-change-transform"
      style={{
        width: '340px',
        transform: `translate3d(${currentGlobalMouseX}px, ${currentGlobalMouseY}px, 0)`
      }}
      id="project-hover-preview-wrapper"
    >
      <AnimatePresence mode="wait">
        {hoveredProject && mediaUrl && (
          <motion.div
            key={hoveredProject.id}
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="w-full"
          >
            {/* Outer Architectural Container inspired by Scheme Engine / Minimalist Precision */}
            <div className="relative rounded-sm overflow-hidden bg-neutral-950/95 border border-teal-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(20,184,166,0.15)] p-1 backdrop-blur-xl">
              
              {/* Subtle Chromatic Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-sky-500/15 to-teal-500/20 blur-md pointer-events-none" />

              {/* Media viewport */}
              <div className="relative w-full h-48 rounded-[2px] overflow-hidden bg-neutral-900">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={hoveredProject.title}
                    className="w-full h-full object-cover contrast-105 saturate-110"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/40 via-transparent to-transparent pointer-events-none" />

                {/* Top Category Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-neutral-950/90 text-teal-300 border border-teal-500/40 rounded-none font-bold shadow-md">
                    {hoveredProject.category}
                  </span>
                </div>

                {/* Bottom Project Metadata */}
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-3">
                  <div className="flex flex-col min-w-0 pr-1 space-y-0.5">
                    <span className="font-syne font-extrabold text-sm text-white uppercase tracking-wider truncate drop-shadow-md">
                      {hoveredProject.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-300 truncate">
                      {hoveredProject.medium || hoveredProject.role}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-teal-400 font-bold bg-neutral-950/90 border border-white/10 px-2 py-0.5 rounded-none shrink-0 shadow-md">
                    {hoveredProject.year}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
