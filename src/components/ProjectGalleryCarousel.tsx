import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play, Image as ImageIcon } from 'lucide-react';

interface ProjectGalleryCarouselProps {
  projectTitle: string;
  items: string[];
}

export const ProjectGalleryCarousel: React.FC<ProjectGalleryCarouselProps> = ({
  projectTitle,
  items
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<number>(0);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // Filter out empty items
  const validItems = items.filter(item => typeof item === 'string' && item.trim().length > 0);

  const total = validItems.length;

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + total) % total);
  }, [total]);

  const goToIndex = (idx: number) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailStripRef.current) return;
    const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'Escape') setIsFullscreen(false);
        if (e.key === 'ArrowRight') goToNext();
        if (e.key === 'ArrowLeft') goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToNext, goToPrev]);

  if (validItems.length === 0) return null;

  const currentMedia = validItems[currentIndex];
  const isVideo =
    currentMedia.endsWith('.mp4') ||
    currentMedia.endsWith('.webm') ||
    currentMedia.includes('video') ||
    currentMedia.startsWith('data:video');

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(4px)'
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(4px)',
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <div className="space-y-4 pt-2" id="project-gallery-carousel">
      {/* Section Header with Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3 font-mono text-xs">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <h3 className="uppercase tracking-widest text-teal-300 font-bold text-xs">
            Documentation Gallery
          </h3>
          <span className="text-neutral-600">&bull;</span>
          <span className="text-neutral-400">
            {total} {total === 1 ? 'Frame' : 'Frames'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-neutral-400 text-[11px] font-mono tracking-wider bg-neutral-900 px-2.5 py-1 border border-neutral-800">
            [ {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} ]
          </span>

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center space-x-1.5 text-[11px]"
            title="Expand Fullscreen Lightbox"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Cinematic Carousel Stage */}
      <div className="relative w-full aspect-video rounded-none overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl group select-none">
        {/* Crosshair accents */}
        <span className="absolute top-2 left-2 font-mono text-[10px] text-teal-400/40 z-20 pointer-events-none">+</span>
        <span className="absolute top-2 right-2 font-mono text-[10px] text-teal-400/40 z-20 pointer-events-none">+</span>
        <span className="absolute bottom-2 left-2 font-mono text-[10px] text-teal-400/40 z-20 pointer-events-none">+</span>
        <span className="absolute bottom-2 right-2 font-mono text-[10px] text-teal-400/40 z-20 pointer-events-none">+</span>

        {/* Media Frame with Animated Slide Transition */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-950"
          >
            {isVideo ? (
              <video
                src={currentMedia}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={currentMedia}
                alt={`${projectTitle} documentation ${currentIndex + 1}`}
                className="w-full h-full object-contain cursor-zoom-in"
                onClick={() => setIsFullscreen(true)}
                referrerPolicy="no-referrer"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (visible if more than 1 item) */}
        {total > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-neutral-950/80 hover:bg-teal-950/90 text-white border border-white/10 hover:border-teal-500/50 backdrop-blur-md transition-all rounded-sm opacity-90 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg"
              title="Previous Photo (Left Arrow)"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-neutral-950/80 hover:bg-teal-950/90 text-white border border-white/10 hover:border-teal-500/50 backdrop-blur-md transition-all rounded-sm opacity-90 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg"
              title="Next Photo (Right Arrow)"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Interactive Horizontal Thumbnail Strip */}
      {total > 1 && (
        <div
          ref={thumbnailStripRef}
          className="flex space-x-2.5 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent select-none"
        >
          {validItems.map((item, idx) => {
            const isThumbVideo =
              item.endsWith('.mp4') ||
              item.endsWith('.webm') ||
              item.includes('video') ||
              item.startsWith('data:video');

            const isActive = idx === currentIndex;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => goToIndex(idx)}
                className={`relative shrink-0 w-24 h-16 sm:w-28 sm:h-18 bg-neutral-900 border transition-all overflow-hidden rounded-sm group ${
                  isActive
                    ? 'border-teal-400 ring-2 ring-teal-500/30 scale-105 shadow-md'
                    : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600'
                }`}
              >
                {isThumbVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-950 text-neutral-400">
                    <Play className="w-4 h-4" />
                  </div>
                ) : (
                  <img
                    src={item}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="absolute bottom-1 right-1 font-mono text-[9px] px-1 bg-neutral-950/90 text-neutral-300 border border-white/10">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-neutral-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center space-x-3">
                <span className="font-syne font-bold text-sm text-neutral-200 uppercase">
                  {projectTitle}
                </span>
                <span className="text-neutral-600">&bull;</span>
                <span className="font-mono text-xs text-teal-400">
                  Slide {currentIndex + 1} of {total}
                </span>
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close Lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Main Stage */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              {isVideo ? (
                <video
                  src={currentMedia}
                  autoPlay
                  loop
                  controls
                  playsInline
                  className="max-h-[82vh] max-w-[92vw] object-contain shadow-2xl"
                />
              ) : (
                <img
                  src={currentMedia}
                  alt={projectTitle}
                  className="max-h-[82vh] max-w-[92vw] object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              )}

              {total > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 bg-neutral-900/90 hover:bg-teal-950 text-white border border-neutral-700 hover:border-teal-500 rounded-full transition-all shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 bg-neutral-900/90 hover:bg-teal-950 text-white border border-neutral-700 hover:border-teal-500 rounded-full transition-all shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Mini Thumbnails */}
            {total > 1 && (
              <div className="flex justify-center space-x-2 overflow-x-auto py-2">
                {validItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToIndex(idx)}
                    className={`w-14 h-10 shrink-0 border overflow-hidden rounded-sm transition-all ${
                      idx === currentIndex ? 'border-teal-400 ring-2 ring-teal-500/40' : 'border-neutral-800 opacity-50'
                    }`}
                  >
                    <img src={item} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
