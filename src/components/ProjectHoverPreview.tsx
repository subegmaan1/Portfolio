import React, { useEffect, useState } from 'react';
import { Project } from '../types';

interface ProjectHoverPreviewProps {
  hoveredProject: Project | null;
}

// Global mouse tracker to ensure instant positioning on hover
let globalMouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
let globalMouseY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

if (typeof window !== 'undefined') {
  const updateGlobalPos = (e: MouseEvent | PointerEvent) => {
    if (e.clientX !== undefined && e.clientY !== undefined) {
      globalMouseX = e.clientX;
      globalMouseY = e.clientY;
    }
  };
  window.addEventListener('mousemove', updateGlobalPos, { passive: true });
  window.addEventListener('pointermove', updateGlobalPos, { passive: true });
}

export const ProjectHoverPreview: React.FC<ProjectHoverPreviewProps> = ({ hoveredProject }) => {
  const [pos, setPos] = useState({ x: globalMouseX, y: globalMouseY });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!hoveredProject) return;

    // Immediately snap initial position to current global mouse location
    setPos({ x: globalMouseX, y: globalMouseY });

    let animId: number;
    let targetX = globalMouseX;
    let targetY = globalMouseY;
    let currentX = globalMouseX;
    let currentY = globalMouseY;
    let lastX = currentX;

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      if (e.clientX !== undefined && e.clientY !== undefined) {
        targetX = e.clientX;
        targetY = e.clientY;
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const animate = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      currentX += dx * 0.2;
      currentY += dy * 0.2;

      const vx = currentX - lastX;
      lastX = currentX;

      const targetRot = Math.max(-10, Math.min(10, vx * 0.4));

      setPos({ x: currentX, y: currentY });
      setRotation(prev => prev + (targetRot - prev) * 0.15);

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, [hoveredProject]);

  if (!hoveredProject) return null;

  const mediaUrl =
    hoveredProject.hoverMedia ||
    hoveredProject.heroMedia ||
    (hoveredProject.gallery && hoveredProject.gallery.length > 0 ? hoveredProject.gallery[0] : '');

  if (!mediaUrl) return null;

  const isVideo =
    mediaUrl.endsWith('.mp4') ||
    mediaUrl.endsWith('.webm') ||
    mediaUrl.startsWith('data:video') ||
    mediaUrl.includes('.mp4') ||
    mediaUrl.includes('.webm') ||
    mediaUrl.includes('video');

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-opacity duration-200 ease-out hidden sm:block"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      id="project-hover-preview-container"
    >
      <div className="relative w-80 h-52 sm:w-96 sm:h-60 rounded-sm overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-teal-500/50 bg-neutral-950 p-1 backdrop-blur-md">
        {/* Subtle glowing ambient backdrop */}
        <div className="absolute -inset-1 bg-teal-500/20 blur-xl pointer-events-none" />

        <div className="relative w-full h-full overflow-hidden rounded-sm bg-neutral-900">
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
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent pointer-events-none" />

          {/* Project Details Footer */}
          <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-neutral-100 font-mono text-xs z-10">
            <div className="flex flex-col pr-2">
              <span className="font-mono text-[9px] text-teal-400 font-bold uppercase tracking-widest block mb-0.5">
                {hoveredProject.category}
              </span>
              <span className="font-syne font-extrabold uppercase tracking-wider text-sm truncate max-w-[220px] text-white">
                {hoveredProject.title}
              </span>
            </div>
            <span className="text-neutral-400 font-mono text-xs border border-white/10 px-2 py-0.5 rounded-none bg-neutral-900/80">
              {hoveredProject.year}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
