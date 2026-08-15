import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const fullscreenThumbnailsRef = useRef<HTMLDivElement>(null);

  // Touch gesture state for mobile swiping
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter out empty items
  const validItems = (items || []).filter(item => typeof item === 'string' && item.trim().length > 0);
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

  // Touch Swipe Handlers for mobile screens
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40; // minimum px swipe threshold
    if (diff > minSwipeDistance) {
      goToNext();
    } else if (diff < -minSwipeDistance) {
      goToPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
    if (fullscreenThumbnailsRef.current) {
      const activeFsThumb = fullscreenThumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (activeFsThumb) {
        activeFsThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex]);

  // Keyboard navigation & body scroll lock in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'Escape') setIsFullscreen(false);
        if (e.key === 'ArrowRight') goToNext();
        if (e.key === 'ArrowLeft') goToPrev();
      }
    };
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(3px)'
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.22 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(3px)',
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.18 }
      }
    })
  };

  return (
    <div className="space-y-3 pt-2" id="project-gallery-carousel">
      {/* Section Header with Status Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5 font-mono text-xs">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="w-2 h-2 shrink-0 rounded-full bg-teal-400" />
          <h3 className="uppercase tracking-widest text-teal-300 font-bold text-xs truncate">
            Documentation Gallery
          </h3>
          <span className="text-neutral-600 hidden xs:inline">&bull;</span>
          <span className="text-neutral-400 hidden xs:inline shrink-0">
            {total} {total === 1 ? 'Frame' : 'Frames'}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-neutral-300 text-[10px] sm:text-[11px] font-mono tracking-wider bg-neutral-900 px-2 py-0.5 sm:px-2.5 sm:py-1 border border-neutral-800 rounded-sm">
            {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1 sm:p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center space-x-1.5 text-[11px] rounded-sm cursor-pointer"
            title="Expand Fullscreen Lightbox"
            id="expand-gallery-fullscreen-btn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Cinematic Carousel Stage (Mobile optimized height & touch swiping) */}
      <div
        className="relative w-full aspect-[4/3] sm:aspect-video min-h-[240px] sm:min-h-[380px] max-h-[70vh] rounded-none overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl group select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Crosshair accents */}
        <span className="absolute top-2 left-2 font-mono text-[10px] text-teal-400/40 z-10 pointer-events-none">+</span>
        <span className="absolute top-2 right-2 font-mono text-[10px] text-teal-400/40 z-10 pointer-events-none">+</span>
        <span className="absolute bottom-2 left-2 font-mono text-[10px] text-teal-400/40 z-10 pointer-events-none">+</span>
        <span className="absolute bottom-2 right-2 font-mono text-[10px] text-teal-400/40 z-10 pointer-events-none">+</span>

        {/* Media Frame with Animated Slide Transition */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-950 p-1 sm:p-2"
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
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentMedia}
                  alt={`${projectTitle} documentation ${currentIndex + 1}`}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setIsFullscreen(true)}
                  referrerPolicy="no-referrer"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  style={{ display: 'none' }}
                  className="w-full h-full flex flex-col items-center justify-center text-neutral-500 font-mono text-xs p-6 text-center space-y-2 bg-neutral-950"
                >
                  <ImageIcon className="w-8 h-8 text-neutral-600 mb-1" />
                  <p className="text-neutral-400 font-bold uppercase tracking-wider">Image Unavailable</p>
                  <p className="text-[11px] text-neutral-600 max-w-sm">
                    {currentMedia.startsWith('/uploads/')
                      ? 'Local path not accessible on static hosting. Please re-upload in Admin.'
                      : 'Unable to load photo from provided source.'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (Visible on all devices, sized responsively) */}
        {total > 1 && (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-neutral-950/80 hover:bg-teal-950/90 text-white border border-white/10 hover:border-teal-500/50 backdrop-blur-md transition-all rounded-full sm:rounded-sm shadow-xl active:scale-90 cursor-pointer"
              title="Previous Photo (Left Arrow)"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-neutral-950/80 hover:bg-teal-950/90 text-white border border-white/10 hover:border-teal-500/50 backdrop-blur-md transition-all rounded-full sm:rounded-sm shadow-xl active:scale-90 cursor-pointer"
              title="Next Photo (Right Arrow)"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* Interactive Horizontal Thumbnail Strip */}
      {total > 1 && (
        <div
          ref={thumbnailStripRef}
          className="flex space-x-2 overflow-x-auto py-1 px-0.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent select-none"
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
                className={`relative shrink-0 w-20 h-14 sm:w-28 sm:h-18 bg-neutral-900 border transition-all overflow-hidden rounded-sm cursor-pointer ${
                  isActive
                    ? 'border-teal-400 ring-2 ring-teal-500/30 scale-[1.02] shadow-md'
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
                    onError={e => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="absolute bottom-0.5 right-0.5 font-mono text-[8px] sm:text-[9px] px-1 bg-neutral-950/90 text-neutral-300 border border-white/10 rounded-xs">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal rendered via Portal to escape modal overflow & motion transforms */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isFullscreen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9999999] bg-neutral-950/98 backdrop-blur-2xl flex flex-col h-[100dvh] w-[100vw] overflow-hidden select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Top Toolbar */}
                <div className="shrink-0 h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md z-30">
                  <div className="flex items-center space-x-2.5 min-w-0 pr-4">
                    <span className="font-syne font-bold text-xs sm:text-sm text-neutral-200 uppercase truncate">
                      {projectTitle}
                    </span>
                    <span className="text-neutral-600">&bull;</span>
                    <span className="font-mono text-[11px] text-teal-400 shrink-0 font-semibold">
                      {currentIndex + 1} / {total}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (!document.fullscreenElement) {
                          document.documentElement.requestFullscreen?.().catch(() => {});
                        } else {
                          document.exitFullscreen?.().catch(() => {});
                        }
                      }}
                      className="p-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95 hidden sm:flex items-center justify-center"
                      title="Toggle Device Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="shrink-0 p-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
                      title="Close Lightbox (Esc)"
                      id="close-gallery-lightbox-btn"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Lightbox Main Stage (Flex-1 min-h-0 guarantees strict viewport containment with zero overflow) */}
                <div className="flex-1 min-h-0 relative w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full h-full flex items-center justify-center"
                    >
                      {isVideo ? (
                        <video
                          src={currentMedia}
                          autoPlay
                          loop
                          controls
                          playsInline
                          className="max-h-full max-w-full object-contain shadow-2xl"
                        />
                      ) : (
                        <img
                          src={currentMedia}
                          alt={projectTitle}
                          className="max-h-full max-w-full object-contain shadow-2xl"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {total > 1 && (
                    <>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          goToPrev();
                        }}
                        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-4 bg-neutral-950/80 hover:bg-teal-950 text-white border border-neutral-700 hover:border-teal-500 rounded-full transition-all shadow-2xl active:scale-90 cursor-pointer"
                        title="Previous Slide"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          goToNext();
                        }}
                        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-4 bg-neutral-950/80 hover:bg-teal-950 text-white border border-neutral-700 hover:border-teal-500 rounded-full transition-all shadow-2xl active:scale-90 cursor-pointer"
                        title="Next Slide"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom Mini Thumbnails Strip */}
                {total > 1 && (
                  <div
                    ref={fullscreenThumbnailsRef}
                    className="shrink-0 py-2.5 px-4 border-t border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md overflow-x-auto flex justify-center space-x-2 z-30 scrollbar-none"
                  >
                    {validItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToIndex(idx)}
                        className={`w-12 h-8 sm:w-16 sm:h-11 shrink-0 border overflow-hidden rounded-xs transition-all cursor-pointer ${
                          idx === currentIndex
                            ? 'border-teal-400 ring-2 ring-teal-500/40 scale-105'
                            : 'border-neutral-800 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={item} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
