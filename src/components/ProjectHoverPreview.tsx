import React, { useEffect, useState } from 'react';
import { Project } from '../types';

interface ProjectHoverPreviewProps {
  hoveredProject: Project | null;
}

export const ProjectHoverPreview: React.FC<ProjectHoverPreviewProps> = ({ hoveredProject }) => {
  const [pos, setPos] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [rotation, setRotation] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos(prev => ({
        ...prev,
        targetX: e.clientX,
        targetY: e.clientY
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!hoveredProject || isTouchDevice) return;

    let frameId: number;
    const updatePosition = () => {
      setPos(prev => {
        const dx = prev.targetX - prev.x;
        const dy = prev.targetY - prev.y;

        // Calculate rotation velocity tilt
        const targetRot = Math.max(-12, Math.min(12, dx * 0.15));

        return {
          ...prev,
          x: prev.x + dx * 0.12, // Smooth spring inertia
          y: prev.y + dy * 0.12,
          targetX: prev.targetX,
          targetY: prev.targetY
        };
      });

      setRotation(prev => prev + ((-pos.x + pos.targetX) * 0.08 - prev) * 0.1);

      frameId = requestAnimationFrame(updatePosition);
    };

    frameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frameId);
  }, [hoveredProject, isTouchDevice, pos.x, pos.targetX]);

  if (!hoveredProject || isTouchDevice) return null;

  const mediaUrl = hoveredProject.hoverMedia || hoveredProject.heroMedia;
  const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');

  return (
    <div
      className="fixed pointer-events-none z-30 transition-opacity duration-300 ease-out hidden md:block"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`,
      }}
      id="project-hover-preview-container"
    >
      <div className="relative w-80 h-52 sm:w-96 sm:h-64 rounded-none overflow-hidden shadow-2xl border border-neutral-700/50 bg-neutral-900/90 backdrop-blur-sm p-1">
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
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-neutral-100 font-mono text-xs">
          <span className="truncate uppercase font-bold tracking-wider">{hoveredProject.title}</span>
          <span className="text-neutral-400 font-normal">{hoveredProject.year}</span>
        </div>
      </div>
    </div>
  );
};
