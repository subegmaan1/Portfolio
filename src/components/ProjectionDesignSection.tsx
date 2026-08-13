import React from 'react';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectionDesignSectionProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export const ProjectionDesignSection: React.FC<ProjectionDesignSectionProps> = ({
  projects,
  onSelectProject
}) => {
  const filtered = projects.filter(p => p.category === 'PROJECTION DESIGN' && p.published);

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto"
    >
      {/* Section Header */}
      <motion.div variants={itemVariants} className="mb-12 sm:mb-16 space-y-4">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-teal-400/90 uppercase font-semibold">
            01 &bull; Primary Practice
          </span>
          <span className="h-[1px] w-12 bg-white/10" />
        </div>
        <h1 className="font-syne font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-[-0.03em] text-neutral-100 uppercase">
          PROJECTION DESIGN
        </h1>
        <p className="font-mono text-xs text-white/50 uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
          Digital Scenography &bull; Architectural Projection Mapping &bull; LED Visual Design &bull; Live Performance
        </p>
      </motion.div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="py-24 text-center border border-dashed border-white/10 p-8">
          <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">
            No published Projection Design projects yet. Add projects via the Admin Dashboard.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-0 border-t border-white/[0.06]">
          {filtered.map((proj, idx) => (
            <motion.div
              key={proj.id}
              variants={itemVariants}
              onClick={() => onSelectProject(proj)}
              className="group relative border-b border-white/[0.06] py-8 lg:py-12 cursor-pointer transition-colors duration-300 hover:bg-white/[0.02] px-4 -mx-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              id={`project-item-${proj.slug}`}
            >
              {/* Left Title & Meta */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-[10px] text-teal-400/80 font-bold">
                    0{idx + 1}
                  </span>
                  <span className="font-mono text-[10px] text-white/50 border border-white/10 px-2.5 py-0.5 uppercase tracking-wider">
                    {proj.year}
                  </span>
                  <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider hidden sm:inline">
                    {proj.role}
                  </span>
                </div>

                <h2 className="font-syne font-bold text-2xl sm:text-4xl lg:text-5xl text-neutral-100 group-hover:text-teal-300 transition-colors tracking-tight">
                  {proj.title}
                </h2>

                <p className="text-sm sm:text-base text-white/60 font-light max-w-3xl line-clamp-2">
                  {proj.shortDescription}
                </p>

                {/* Mobile static image fallback */}
                <div className="lg:hidden mt-4 rounded-none overflow-hidden aspect-video max-w-md border border-white/10">
                  <img
                    src={proj.hoverMedia || proj.heroMedia}
                    alt={proj.title}
                    className="w-full h-full object-cover grayscale active:grayscale-0 group-active:grayscale-0 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Right Arrow Action */}
              <div className="flex items-center space-x-4">
                <span className="font-mono text-[10px] text-teal-400 tracking-[0.2em] uppercase hidden lg:inline opacity-0 group-hover:opacity-100 transition-opacity">
                  View Case Study
                </span>
                <div className="w-11 h-11 border border-white/20 group-hover:border-teal-400 group-hover:bg-teal-400 group-hover:text-neutral-950 text-white flex items-center justify-center transition-all duration-300">
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
};


