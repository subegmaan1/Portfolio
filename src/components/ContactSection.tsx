import React, { useState } from 'react';
import { ContactData } from '../types';
import { MapPin, ArrowUpRight, Copy, Check, Phone, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactSectionProps {
  contact: ContactData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(3px)' },
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
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (contact?.email) {
      navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const email = contact?.email || 'projectiondjjs@gmail.com';
  const tagline = contact?.tagline || '04 • Inquiries';
  const title = contact?.title || 'CONTACT';
  const statement =
    contact?.statement ||
    'Available for international commissions, digital scenography direction, and spatial media collaborations.';
  const emailLabel = contact?.emailLabel || 'Direct Contact Email';
  const phone = contact?.phone || '';
  const phoneLabel = contact?.phoneLabel || 'Phone / WhatsApp';
  const location = contact?.location || 'New York / Global';
  const locationLabel = contact?.locationLabel || 'Base / Location';
  const availabilityStatus =
    contact?.availabilityStatus || 'Accepting commissions & creative collaborations for 2026/2027';
  const responseTime = contact?.responseTime || 'Typical response time: within 24–48 hours';
  const representationHeading =
    contact?.representationHeading || 'Representation & Management Inquiries';
  const additionalLinks = Array.isArray(contact?.additionalLinks) ? contact.additionalLinks : [];
  const socialLinks = Array.isArray(contact?.socialLinks) ? contact.socialLinks : [];
  const footerCopyright =
    contact?.footerCopyright || `© ${new Date().getFullYear()} SUBEG SINGH. All rights reserved.`;
  const footerSubtitle = contact?.footerSubtitle || 'Digital Scenography & Immersive Media';

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto flex flex-col justify-between"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Top Header */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-teal-400/90 uppercase font-semibold">
              {tagline}
            </span>
            <span className="h-[1px] w-12 bg-white/10 hidden sm:inline-block" />
            {availabilityStatus && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{availabilityStatus}</span>
              </span>
            )}
          </div>

          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl lg:text-8xl tracking-[-0.03em] text-neutral-100 uppercase leading-none">
            {title}
          </h1>

          {statement && (
            <p className="sub-text max-w-3xl text-neutral-200">
              {statement}
            </p>
          )}
        </motion.div>

        {/* Main Email Action Callout */}
        <motion.div variants={itemVariants} className="py-10 sm:py-14 border-y border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>{emailLabel}</span>
            </span>

            <button
              onClick={handleCopyEmail}
              type="button"
              className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy email to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <a
            href={`mailto:${email}`}
            className="group inline-flex items-center gap-4 font-syne font-bold text-xl sm:text-4xl md:text-5xl lg:text-6xl text-neutral-100 hover:text-teal-300 transition-colors break-all"
            id="contact-email-link"
          >
            <span>{email}</span>
            <ArrowUpRight className="w-7 h-7 sm:w-11 sm:h-11 text-teal-400/80 group-hover:text-teal-300 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform shrink-0" />
          </a>
        </motion.div>

        {/* Multi-Column Info Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {/* Location */}
          <div className="space-y-2.5 p-6 bg-white/[0.02] border border-white/[0.06]">
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] flex items-center space-x-2 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{locationLabel}</span>
            </span>
            <p className="font-syne text-lg sm:text-xl text-neutral-100 font-semibold">
              {location}
            </p>
          </div>

          {/* Direct Phone / WhatsApp (if provided) */}
          {phone ? (
            <div className="space-y-2.5 p-6 bg-white/[0.02] border border-white/[0.06]">
              <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] flex items-center space-x-2 font-semibold">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>{phoneLabel}</span>
              </span>
              <a
                href={phone.startsWith('+') ? `tel:${phone.replace(/[^0-9+]/g, '')}` : `tel:${phone}`}
                className="font-syne text-lg sm:text-xl text-neutral-100 hover:text-teal-300 transition-colors font-semibold block"
              >
                {phone}
              </a>
            </div>
          ) : (
            <div className="space-y-2.5 p-6 bg-white/[0.02] border border-white/[0.06]">
              <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] flex items-center space-x-2 font-semibold">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Turnaround & Response</span>
              </span>
              <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                {responseTime}
              </p>
            </div>
          )}

          {/* Response Time if phone was shown */}
          {phone && (
            <div className="space-y-2.5 p-6 bg-white/[0.02] border border-white/[0.06]">
              <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] flex items-center space-x-2 font-semibold">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Turnaround & Response</span>
              </span>
              <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                {responseTime}
              </p>
            </div>
          )}
        </motion.div>

        {/* Representation & Management Links */}
        {additionalLinks.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4 pt-4">
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] block font-semibold">
              {representationHeading}
            </span>
            <div className="flex flex-wrap gap-4">
              {additionalLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-white/90 hover:text-white transition-colors uppercase tracking-[0.15em] flex items-center space-x-2.5 border border-white/15 hover:border-teal-400/60 px-5 py-3.5 bg-white/[0.03] hover:bg-white/[0.08]"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Social & Industry Profiles */}
        {socialLinks.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4 pt-4 border-t border-white/[0.06]">
            <span className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.2em] block font-semibold">
              Social & Industry Portfolios
            </span>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-neutral-300 hover:text-white transition-colors uppercase tracking-[0.12em] flex items-center space-x-2 border border-white/10 hover:border-teal-400/40 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.06]"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400/80" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Copyright Signoff */}
      <motion.div variants={itemVariants} className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between font-mono text-[10px] text-white/40 tracking-[0.1em] uppercase gap-4">
        <span>{footerCopyright}</span>
        <span>{footerSubtitle}</span>
      </motion.div>
    </motion.section>
  );
};



