import React, { useEffect } from 'react';
import { Project } from '../types';
import { parseVideoUrl } from '../lib/videoUtils';
import { ProjectGalleryCarousel } from './ProjectGalleryCarousel';
import { X, ArrowLeft, ArrowRight, Wrench, Users, Play, Video, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectDetailModalProps {
  project: Project | null;
  allProjects: Project[];
  onClose: () => void;
  onSelectProject: (proj: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  allProjects,
  onClose,
  onSelectProject
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  // Filter same category published projects for prev/next
  const categoryProjects = allProjects.filter(p => p.category === project.category && p.published);
  const currentIndex = categoryProjects.findIndex(p => p.id === project.id);
  const prevProject = currentIndex > 0 ? categoryProjects[currentIndex - 1] : categoryProjects[categoryProjects.length - 1];
  const nextProject = currentIndex < categoryProjects.length - 1 ? categoryProjects[currentIndex + 1] : categoryProjects[0];

  const isHeroVideo = project.heroMedia?.endsWith('.mp4') || project.heroMedia?.endsWith('.webm');

  // Collect all media items (Hero Media + Gallery frames) uniquely
  const allMediaItems = Array.from(
    new Set(
      [
        ...(project.heroMedia ? [project.heroMedia] : []),
        ...(project.gallery || [])
      ].filter(item => typeof item === 'string' && item.trim().length > 0)
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.98, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 50, scale: 0.98, filter: 'blur(4px)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/95 backdrop-blur-xl text-neutral-100"
    >
      {/* Fixed Header Bar */}
      <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        {/* Top Left: Clickable Return / Back to previous window */}
        <button
          onClick={onClose}
          className="group flex items-center space-x-2.5 px-3 py-2 -ml-2 rounded-md bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition-all text-neutral-300 hover:text-white cursor-pointer active:scale-95"
          title="Return to Projects / Back"
          id="back-to-projects-btn"
        >
          <ArrowLeft className="w-4 h-4 text-teal-400 group-hover:-translate-x-1 transition-transform" />
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-100 group-hover:text-teal-300 transition-colors">
              Back to Projects
            </span>
            <span className="text-neutral-600 hidden sm:inline">&bull;</span>
            <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider hidden sm:inline">
              {project.category}
            </span>
            <span className="text-neutral-600 hidden md:inline">&bull;</span>
            <span className="font-mono text-xs text-neutral-400 font-medium uppercase hidden md:inline">
              {project.year}
            </span>
          </div>
        </button>

        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer active:scale-95"
          title="Close Case Study (Esc)"
          id="close-project-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 space-y-16">
        {/* Project Header Title */}
        <div className="space-y-6">
          <h1 className="font-syne font-extrabold text-3xl sm:text-5xl lg:text-7xl uppercase tracking-tight leading-tight text-neutral-100">
            {project.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-neutral-800/80 font-mono text-xs">
            <div>
              <span className="text-neutral-500 uppercase block mb-1">Role</span>
              <span className="text-neutral-200 font-medium">{project.role}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase block mb-1">Medium</span>
              <span className="text-neutral-200 font-medium">{project.medium || 'Digital Scenography'}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase block mb-1">Year</span>
              <span className="text-neutral-200 font-medium">{project.year}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase block mb-1">Practice</span>
              <span className="text-neutral-200 font-medium">{project.category}</span>
            </div>
          </div>
        </div>

        {/* Project Documentation & Media Gallery (Cinematic stage with interactive Fullscreen Lightbox) */}
        {allMediaItems.length > 0 && (
          <ProjectGalleryCarousel
            projectTitle={project.title}
            items={allMediaItems}
          />
        )}

        {/* Case Study Overview & Long Description */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-6">
          <div className="md:col-span-8 space-y-8">
            <div className="space-y-4">
              <h2 className="font-syne font-bold text-2xl text-neutral-100">
                Project Overview
              </h2>
              <p className="text-lg text-neutral-300 font-light leading-relaxed">
                {project.shortDescription}
              </p>
            </div>

            {project.longDescription && (
              <div className="space-y-4 pt-6 border-t border-neutral-800/60">
                <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  Concept & Architectural Execution
                </h3>
                <p className="text-neutral-300 leading-relaxed font-light whitespace-pre-line text-base sm:text-lg">
                  {project.longDescription}
                </p>
              </div>
            )}
          </div>

          {/* Tools & Credits Sidebar */}
          <div className="md:col-span-4 space-y-8 bg-neutral-900/30 p-6 border border-neutral-800/80">
            {/* Tools */}
            {project.tools && project.tools.length > 0 && (
              <div className="space-y-3">
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest flex items-center space-x-2">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Technical Capabilities</span>
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {project.tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-xs bg-neutral-800/80 text-neutral-300 px-3 py-1 border border-neutral-700/50"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Credits */}
            {project.credits && project.credits.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-neutral-800/80">
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Project Credits</span>
                </span>
                <div className="space-y-2 font-mono text-xs pt-1">
                  {project.credits.map((cred, idx) => (
                    <div key={idx} className="flex justify-between items-baseline border-b border-neutral-800/40 pb-1.5">
                      <span className="text-neutral-500">{cred.role}</span>
                      <span className="text-neutral-200 font-medium">{cred.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Cinematic Video Stream Section (Activated only when enabled and link provided) */}
        {project.enableStreaming && project.videoStreamUrl && (() => {
          const parsed = parseVideoUrl(project.videoStreamUrl);
          if (parsed.type === 'invalid') return null;

          return (
            <div className="space-y-6 pt-12 border-t border-neutral-800/80" id="project-video-stream-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-teal-300 font-bold">
                    Cinematic Documentation Stream
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-white/50 bg-neutral-900 border border-white/10 px-3 py-1 uppercase tracking-wider">
                    {parsed.type.toUpperCase()} 4K PLAYBACK
                  </span>
                </div>
              </div>

              {/* Cinematic Video Player Container */}
              <div className="relative rounded-sm overflow-hidden bg-neutral-950 border border-teal-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(20,184,166,0.15)] group">
                {/* Crosshairs */}
                <span className="absolute top-2 left-2 font-mono text-[10px] text-teal-400/60 z-20 select-none pointer-events-none">+</span>
                <span className="absolute top-2 right-2 font-mono text-[10px] text-teal-400/60 z-20 select-none pointer-events-none">+</span>
                <span className="absolute bottom-2 left-2 font-mono text-[10px] text-teal-400/60 z-20 select-none pointer-events-none">+</span>
                <span className="absolute bottom-2 right-2 font-mono text-[10px] text-teal-400/60 z-20 select-none pointer-events-none">+</span>

                <div className="relative w-full aspect-video bg-neutral-950">
                  {parsed.type === 'direct' ? (
                    <video
                      src={parsed.embedUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <iframe
                      src={parsed.embedUrl}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={`${project.title} Video Stream`}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Video Embeds if any */}
        {project.videos && project.videos.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-neutral-800/80">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Motion & Documentation Video Stream
            </h3>
            <div className="space-y-6">
              {project.videos.map((videoUrl, idx) => (
                <div key={idx} className="aspect-video bg-neutral-900 border border-neutral-800 overflow-hidden">
                  <iframe
                    src={videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={`${project.title} Video ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next / Prev Project Navigation */}
        <div className="pt-16 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {prevProject && (
            <button
              onClick={() => onSelectProject(prevProject)}
              className="text-left p-6 bg-neutral-900/40 border border-neutral-800 hover:border-neutral-600 transition-all group flex items-center space-x-4"
              id="prev-project-btn"
            >
              <ArrowLeft className="w-6 h-6 text-neutral-500 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
              <div>
                <span className="font-mono text-[10px] text-neutral-500 uppercase block">Previous Case Study</span>
                <span className="font-syne font-bold text-lg text-neutral-200 group-hover:text-white">{prevProject.title}</span>
              </div>
            </button>
          )}

          {nextProject && (
            <button
              onClick={() => onSelectProject(nextProject)}
              className="text-right p-6 bg-neutral-900/40 border border-neutral-800 hover:border-neutral-600 transition-all group flex items-center justify-end space-x-4"
              id="next-project-btn"
            >
              <div>
                <span className="font-mono text-[10px] text-neutral-500 uppercase block">Next Case Study</span>
                <span className="font-syne font-bold text-lg text-neutral-200 group-hover:text-white">{nextProject.title}</span>
              </div>
              <ArrowRight className="w-6 h-6 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
