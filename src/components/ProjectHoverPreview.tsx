import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface ProjectHoverPreviewProps {
  hoveredProject: Project | null;
}

export const ProjectHoverPreview: React.FC<ProjectHoverPreviewProps> = ({ hoveredProject }) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHoverDevice, setIsHoverDevice] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supportsHover = window.matchMedia('(hover: hover)').matches;
      setIsHoverDevice(supportsHover);
    }

    const handlePointerMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

  if (!isHoverDevice) return null;

  const mediaUrl =
    hoveredProject?.hoverMedia ||
    hoveredProject?.heroMedia ||
    (hoveredProject?.gallery && hoveredProject.gallery.length > 0 ? hoveredProject.gallery[0] : '');

  if (!hoveredProject || !mediaUrl) return null;

  const isVideo =
    mediaUrl.endsWith('.mp4') ||
    mediaUrl.endsWith('.webm') ||
    mediaUrl.includes('video') ||
    mediaUrl.startsWith('data:video');

  const cardWidth = 320;
  const cardHeight = 210;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Calculate position with padding away from mouse cursor
  let x = mousePos.x + 24;
  let y = mousePos.y - 105;

  if (x + cardWidth > viewportWidth - 20) {
    x = mousePos.x - cardWidth - 24;
  }
  if (y + cardHeight > viewportHeight - 20) {
    y = viewportHeight - cardHeight - 20;
  }
  if (y < 20) {
    y = 20;
  }

  return (
    <AnimatePresence>
      {hoveredProject && (
        <motion.div
          key={hoveredProject.id}
          initial={{ opacity: 0, scale: 0.9, y: y + 15 }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 320,
            mass: 0.4,
            opacity: { duration: 0.12 }
          }}
          className="fixed top-0 left-0 pointer-events-none z-[999999] hidden md:block"
          style={{
            width: `${cardWidth}px`,
            position: 'fixed'
          }}
        >
          <div className="relative rounded-lg overflow-hidden bg-neutral-950 border border-teal-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(20,184,166,0.2)] p-1 backdrop-blur-xl">
            {/* Ambient glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/30 via-sky-500/20 to-teal-500/30 blur-md pointer-events-none" />

            {/* Media Box */}
            <div className="relative w-full h-44 rounded-md overflow-hidden bg-neutral-900">
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
                  className="w-full h-full object-cover contrast-105"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/25 to-transparent pointer-events-none" />

              {/* Tag Header */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-neutral-950/90 text-teal-300 border border-teal-500/40 rounded-full font-bold shadow-sm">
                  {hoveredProject.category}
                </span>
              </div>

              {/* Project Title & Venue Footer */}
              <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-end justify-between gap-2">
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="font-syne font-extrabold text-xs text-white uppercase tracking-wider truncate drop-shadow-md">
                    {hoveredProject.title}
                  </span>
                  {hoveredProject.venue && (
                    <span className="text-[10px] font-mono text-neutral-300 truncate">
                      {hoveredProject.venue}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-teal-400 font-bold bg-neutral-950/90 border border-white/10 px-1.5 py-0.5 rounded-sm shrink-0 shadow-sm">
                  {hoveredProject.year}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
