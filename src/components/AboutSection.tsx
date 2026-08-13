import React from 'react';
import { AboutData, Project } from '../types';
import { FileDown, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutSectionProps {
  about: AboutData;
  projects?: Project[];
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

export const AboutSection: React.FC<AboutSectionProps> = ({ about, projects = [], onNavigateToSection }) => {
  const projectionProjects = projects.filter(p => p.category === 'PROJECTION DESIGN' && p.published);
  const immersiveProjects = projects.filter(p => p.category === 'IMMERSIVE MEDIA' && p.published);

  const projCover1 =
    projectionProjects[0]?.heroMedia ||
    projectionProjects[0]?.hoverMedia ||
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=1200';

  const projCover2 =
    immersiveProjects[0]?.heroMedia ||
    immersiveProjects[0]?.hoverMedia ||
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200';
  const [portraitTouched, setPortraitTouched] = React.useState(false);
  const [card1Touched, setCard1Touched] = React.useState(false);
  const [card2Touched, setCard2Touched] = React.useState(false);

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
                <div
                  onTouchStart={() => setPortraitTouched(true)}
                  onTouchEnd={() => setTimeout(() => setPortraitTouched(false), 2500)}
                  onClick={() => setPortraitTouched(prev => !prev)}
                  className="relative aspect-[3/4] w-full bg-neutral-900 overflow-hidden border border-white/5 rounded-sm cursor-pointer select-none"
                >
                  {about.photoUrl ? (
                    <img
                      src={about.photoUrl}
                      alt={about.name || 'Subeg Singh'}
                      className={`w-full h-full object-cover object-top contrast-125 transition-all duration-500 active:grayscale-0 group-active:grayscale-0 ${
                        portraitTouched ? 'grayscale-0 scale-105' : 'grayscale group-hover:grayscale-0 group-hover:scale-105'
                      }`}
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

      {/* Big Practice Feature Cards */}
      <motion.div variants={itemVariants} className="pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-white/[0.06] grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Big Card 1: Projection Design */}
        <div
          onClick={() => onNavigateToSection('PROJECTION DESIGN')}
          className="group relative cursor-pointer overflow-hidden rounded-sm border border-white/10 hover:border-teal-500/60 transition-all duration-500 bg-neutral-950/90 shadow-2xl flex flex-col justify-between min-h-[340px] sm:min-h-[400px] p-6 sm:p-8"
          id="goto-projection-design-card"
        >
          {/* Background Media Image */}
          <div
            onTouchStart={() => setCard1Touched(true)}
            onTouchEnd={() => setTimeout(() => setCard1Touched(false), 2000)}
            className="absolute inset-0 z-0 overflow-hidden"
          >
            <img
              src={projCover1}
              alt="Projection Design"
              className={`w-full h-full object-cover object-center transition-all duration-700 active:grayscale-0 group-active:grayscale-0 ${
                card1Touched
                  ? 'grayscale-0 opacity-60 scale-105'
                  : 'grayscale group-hover:grayscale-0 group-hover:scale-105 opacity-30 group-hover:opacity-50'
              }`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/90 via-transparent to-transparent" />
          </div>

          {/* Crosshair corner accents */}
          <span className="absolute top-3 left-3 font-mono text-[10px] text-teal-400/60 z-10 select-none">+</span>
          <span className="absolute top-3 right-3 font-mono text-[10px] text-teal-400/60 z-10 select-none">+</span>

          {/* Top Header Metadata */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.25em] text-teal-400 uppercase font-bold bg-teal-950/80 border border-teal-500/30 px-3 py-1 rounded-full backdrop-blur-md">
              PRIMARY PRACTICE &bull; 01
            </span>
            <span className="font-mono text-[10px] tracking-wider text-white/70 bg-white/10 border border-white/10 px-2.5 py-1 rounded-sm uppercase backdrop-blur-md">
              {projectionProjects.length} {projectionProjects.length === 1 ? 'PROJECT' : 'PROJECTS'}
            </span>
          </div>

          {/* Bottom Card Info & CTA */}
          <div className="relative z-10 mt-auto pt-16 space-y-4">
            <div>
              <h3 className="font-syne font-extrabold text-3xl sm:text-4xl text-white group-hover:text-teal-300 transition-colors uppercase tracking-tight leading-tight">
                PROJECTION DESIGN
              </h3>
              <p className="font-mono text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed font-light">
                Digital Scenography &bull; Architectural Mapping &bull; LED Visual Systems &bull; Live Scenography
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-white/10">
              <span className="font-mono text-[11px] text-teal-400 uppercase tracking-widest font-semibold group-hover:translate-x-1 transition-transform flex items-center space-x-2">
                <span>EXPLORE COLLECTION</span>
                <span>&rarr;</span>
              </span>
              <div className="w-10 h-10 rounded-full border border-white/20 group-hover:border-teal-400 group-hover:bg-teal-400 group-hover:text-neutral-950 text-white flex items-center justify-center transition-all duration-300">
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Big Card 2: Immersive Media */}
        <div
          onClick={() => onNavigateToSection('IMMERSIVE MEDIA')}
          className="group relative cursor-pointer overflow-hidden rounded-sm border border-white/10 hover:border-sky-500/60 transition-all duration-500 bg-neutral-950/90 shadow-2xl flex flex-col justify-between min-h-[340px] sm:min-h-[400px] p-6 sm:p-8"
          id="goto-immersive-media-card"
        >
          {/* Background Media Image */}
          <div
            onTouchStart={() => setCard2Touched(true)}
            onTouchEnd={() => setTimeout(() => setCard2Touched(false), 2000)}
            className="absolute inset-0 z-0 overflow-hidden"
          >
            <img
              src={projCover2}
              alt="Immersive Media"
              className={`w-full h-full object-cover object-center transition-all duration-700 active:grayscale-0 group-active:grayscale-0 ${
                card2Touched
                  ? 'grayscale-0 opacity-60 scale-105'
                  : 'grayscale group-hover:grayscale-0 group-hover:scale-105 opacity-30 group-hover:opacity-50'
              }`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/90 via-transparent to-transparent" />
          </div>

          {/* Crosshair corner accents */}
          <span className="absolute top-3 left-3 font-mono text-[10px] text-sky-400/60 z-10 select-none">+</span>
          <span className="absolute top-3 right-3 font-mono text-[10px] text-sky-400/60 z-10 select-none">+</span>

          {/* Top Header Metadata */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.25em] text-sky-400 uppercase font-bold bg-sky-950/80 border border-sky-500/30 px-3 py-1 rounded-full backdrop-blur-md">
              SECONDARY PRACTICE &bull; 02
            </span>
            <span className="font-mono text-[10px] tracking-wider text-white/70 bg-white/10 border border-white/10 px-2.5 py-1 rounded-sm uppercase backdrop-blur-md">
              {immersiveProjects.length} {immersiveProjects.length === 1 ? 'PROJECT' : 'PROJECTS'}
            </span>
          </div>

          {/* Bottom Card Info & CTA */}
          <div className="relative z-10 mt-auto pt-16 space-y-4">
            <div>
              <h3 className="font-syne font-extrabold text-3xl sm:text-4xl text-white group-hover:text-sky-300 transition-colors uppercase tracking-tight leading-tight">
                IMMERSIVE MEDIA
              </h3>
              <p className="font-mono text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed font-light">
                Virtual Production &bull; Interactive Environments &bull; Real-Time Systems &bull; Spatial Computing
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-white/10">
              <span className="font-mono text-[11px] text-sky-400 uppercase tracking-widest font-semibold group-hover:translate-x-1 transition-transform flex items-center space-x-2">
                <span>EXPLORE COLLECTION</span>
                <span>&rarr;</span>
              </span>
              <div className="w-10 h-10 rounded-full border border-white/20 group-hover:border-sky-400 group-hover:bg-sky-400 group-hover:text-neutral-950 text-white flex items-center justify-center transition-all duration-300">
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
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


