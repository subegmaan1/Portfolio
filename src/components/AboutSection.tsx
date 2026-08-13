import React from 'react';
import { AboutData } from '../types';
import { FileDown } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutSectionProps {
  about: AboutData;
  onNavigateToSection: (section: 'PROJECTION DESIGN' | 'IMMERSIVE MEDIA' | 'CONTACT') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export const AboutSection: React.FC<AboutSectionProps> = ({ about, onNavigateToSection }) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto flex flex-col justify-between"
    >
      {/* Structural Vertical Rail Text */}
      <div className="hidden xl:block rail-text fixed left-8 top-1/2 -translate-y-1/2 pointer-events-none z-20">
        Immersive Media &amp; Projection Architecture
      </div>

      {/* Hero Headline & Creative Portrait Block */}
      <div className="my-auto py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column: Name & Intro */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <motion.h1 variants={itemVariants} className="font-syne font-extrabold text-4xl sm:text-7xl lg:text-8xl xl:text-[95px] tracking-[-0.04em] text-neutral-100 leading-[0.9] uppercase">
              {about.name ? about.name.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {word}
                  {i < about.name.split(' ').length - 1 && <br />}
                </React.Fragment>
              )) : 'SUBEG\nSINGH'}
            </motion.h1>

            <motion.div variants={itemVariants} className="sub-text text-neutral-200 max-w-xl text-base sm:text-lg leading-relaxed font-light">
              {about.introduction || `${about.title} working at the intersection of architecture, performance, and digital scenography.`}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6 max-w-lg">
              <p className="font-sans text-sm sm:text-base leading-relaxed text-white/60 font-light">
                Exploring the spatial relationship between physical structures and generated light to create narrative environments that breathe.
              </p>

              {/* CV / Contact Button */}
              {about.cvUrl ? (
                <a
                  href={about.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cv-button inline-flex items-center space-x-2"
                  id="download-cv-button"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download CV</span>
                </a>
              ) : (
                <button
                  onClick={() => onNavigateToSection('CONTACT')}
                  className="cv-button inline-flex items-center space-x-2"
                >
                  <span>GET IN TOUCH</span>
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Creative Portrait Frame */}
          <motion.div variants={itemVariants} className="lg:col-span-5 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <div className="relative group w-full max-w-sm">
              {/* Subtle ambient lighting projection glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-sky-500/15 to-amber-500/10 rounded-lg blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Frame Container */}
              <div className="relative bg-[#0d0d0f] border border-white/10 p-3 sm:p-4 rounded-sm shadow-2xl overflow-hidden transition-transform duration-500 group-hover:border-teal-500/40">
                
                {/* Architectural Corner Crosshairs (+) */}
                <span className="absolute top-2 left-2 text-[10px] font-mono text-teal-400/60 font-bold select-none">+</span>
                <span className="absolute top-2 right-2 text-[10px] font-mono text-teal-400/60 font-bold select-none">+</span>
                <span className="absolute bottom-2 left-2 text-[10px] font-mono text-teal-400/60 font-bold select-none">+</span>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono text-teal-400/60 font-bold select-none">+</span>

                {/* Laser scanline effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-400/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out pointer-events-none z-10" />

                {/* Image display */}
                <div className="relative aspect-[3/4] w-full bg-neutral-900 overflow-hidden border border-white/5 rounded-sm">
                  {about.photoUrl ? (
                    <img
                      src={about.photoUrl}
                      alt={about.name || 'Subeg Singh'}
                      className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 contrast-125 transition-all duration-700 scale-100 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-900 to-neutral-950">
                      <div className="w-16 h-16 rounded-full border border-teal-500/30 flex items-center justify-center font-syne font-bold text-xl text-teal-400 mb-3">
                        SS
                      </div>
                      <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                        {about.name || 'SUBEG SINGH'}
                      </span>
                    </div>
                  )}

                  {/* Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent opacity-40 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid line divider */}
      <motion.div variants={itemVariants} className="w-full h-[1px] bg-white/[0.06] my-8 sm:my-12" />

      {/* Editorial Practice Sections */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 my-6 sm:my-8">
        {/* 01 Background */}
        <div className="md:col-span-6 space-y-3 sm:space-y-4">
          <div className="font-mono text-[10px] tracking-[0.3em] text-teal-400/80 uppercase font-semibold">
            01 &bull; Background
          </div>
          <p className="text-white/80 leading-relaxed text-sm sm:text-base font-light">
            {about.background}
          </p>
        </div>

        {/* 02 Practice */}
        <div className="md:col-span-6 space-y-3 sm:space-y-4">
          <div className="font-mono text-[10px] tracking-[0.3em] text-teal-400/80 uppercase font-semibold">
            02 &bull; Digital Scenography & Practice
          </div>
          <p className="text-white/80 leading-relaxed text-sm sm:text-base font-light">
            {about.practiceDescription}
          </p>
        </div>
      </motion.div>

      {/* Supporting Technical Capabilities */}
      <motion.div variants={itemVariants} className="pt-8 sm:pt-12 border-t border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="font-mono text-[10px] tracking-[0.3em] text-teal-400/80 uppercase font-semibold">
            03 &bull; Supporting Capabilities
          </div>
          <div className="font-syne text-xs sm:text-sm text-neutral-300">
            {about.primaryPractice} &bull; {about.secondaryPractice}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {about.capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="p-4 bg-white/[0.02] border border-white/[0.06] hover:border-teal-500/40 transition-colors group rounded-none"
            >
              <span className="font-mono text-[9px] text-teal-400/60 block mb-1">
                0{idx + 1}
              </span>
              <span className="font-syne font-medium text-xs sm:text-sm text-neutral-200 group-hover:text-white transition-colors">
                {cap}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Direct Navigators */}
      <motion.div variants={itemVariants} className="pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <button
          onClick={() => onNavigateToSection('PROJECTION DESIGN')}
          className="group text-left p-6 sm:p-8 bg-white/[0.02] border border-white/[0.06] hover:border-teal-500/40 transition-all duration-300 flex justify-between items-center"
          id="goto-projection-design-btn"
        >
          <div>
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] block mb-1">
              Primary Practice
            </span>
            <span className="font-syne font-bold text-lg sm:text-xl text-neutral-100 group-hover:text-white uppercase tracking-wider">
              Projection Design &rarr;
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigateToSection('IMMERSIVE MEDIA')}
          className="group text-left p-6 sm:p-8 bg-white/[0.02] border border-white/[0.06] hover:border-teal-500/40 transition-all duration-300 flex justify-between items-center"
          id="goto-immersive-media-btn"
        >
          <div>
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] block mb-1">
              Secondary Practice
            </span>
            <span className="font-syne font-bold text-lg sm:text-xl text-neutral-100 group-hover:text-white uppercase tracking-wider">
              Immersive Media &rarr;
            </span>
          </div>
        </button>
      </motion.div>

      {/* Footer System Info */}
      <footer className="mt-16 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">Primary</span>
            <span className="text-xs text-neutral-300">{about.primaryPractice}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">Secondary</span>
            <span className="text-xs text-neutral-300">{about.secondaryPractice}</span>
          </div>
        </div>
        <div className="font-mono text-[9px] text-white/30 tracking-[0.1em] uppercase">
          &copy; {new Date().getFullYear()} PORTFOLIO SYSTEM / SUBEG SINGH
        </div>
      </footer>
    </motion.section>
  );
};


