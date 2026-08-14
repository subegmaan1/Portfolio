import React from 'react';
import { ContactData } from '../types';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactSectionProps {
  contact: ContactData;
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

export const ContactSection: React.FC<ContactSectionProps> = ({ contact }) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto flex flex-col justify-between"
    >
      {/* Top Header */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-teal-400/90 uppercase font-semibold">
            04 &bull; Inquiries
          </span>
          <span className="h-[1px] w-12 bg-white/10" />
        </div>

        <h1 className="font-syne font-extrabold text-4xl sm:text-6xl lg:text-8xl tracking-[-0.03em] text-neutral-100 uppercase leading-none">
          CONTACT
        </h1>

        <p className="sub-text max-w-2xl text-neutral-200">
          Available for international commissions, digital scenography direction, and spatial media collaborations.
        </p>
      </motion.div>

      {/* Main Email Action Callout */}
      <motion.div variants={itemVariants} className="my-12 sm:my-16 py-10 sm:py-12 border-y border-white/[0.06]">
        <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] block mb-3 font-semibold">
          Direct Contact Email
        </span>
        <a
          href={`mailto:${contact.email}`}
          className="group inline-flex items-center gap-4 font-syne font-bold text-xl sm:text-4xl md:text-5xl lg:text-6xl text-neutral-100 hover:text-teal-300 transition-colors break-all"
          id="contact-email-link"
        >
          <span>{contact.email}</span>
          <ArrowUpRight className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400/80 group-hover:text-teal-300 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform shrink-0" />
        </a>
      </motion.div>

      {/* Location and Representation Links */}
      <motion.div variants={itemVariants} className="space-y-8">
        {/* Location */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] flex items-center space-x-2 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <span>Base / Location</span>
          </span>
          <p className="font-syne text-lg sm:text-2xl text-neutral-200">
            {contact.location || 'New York / International'}
          </p>
        </div>

        {/* Representation & Studio Links */}
        {contact.additionalLinks && contact.additionalLinks.length > 0 && (
          <div className="pt-6 border-t border-white/[0.06]">
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] block mb-4 font-semibold">
              Representation & Management Inquiries
            </span>
            <div className="flex flex-wrap gap-4">
              {contact.additionalLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-white/80 hover:text-white transition-colors uppercase tracking-[0.15em] flex items-center space-x-2 border border-white/15 hover:border-teal-400/50 px-5 py-3 bg-white/[0.02] hover:bg-white/[0.06]"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
};


