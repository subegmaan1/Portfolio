import React from 'react';
import { Lock, Sparkles, ArrowUp } from 'lucide-react';
import { PublicNavSection } from '../types';

interface FooterProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onSelectSection: (section: PublicNavSection) => void;
  about?: { name: string; title: string; primaryPractice?: string; secondaryPractice?: string } | null;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  isAdminLoggedIn,
  onSelectSection,
  about
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative z-20 border-t border-white/[0.08] bg-[#070707]/90 backdrop-blur-lg mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-white/[0.06]">
          {/* Left: Branding & Tagline */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="font-syne font-extrabold text-base sm:text-lg tracking-[0.15em] text-neutral-100 uppercase">
                {about?.name || 'SUBEG SINGH'}
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="font-mono text-[10px] text-teal-400 font-semibold tracking-[0.2em] uppercase">
                {about?.title || 'IMMERSIVE MEDIA DESIGNER'}
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-400 max-w-md font-light">
              Digital Scenography &bull; Spatial Computing &bull; Interactive Environments
            </p>
          </div>

          {/* Center / Navigation Shortcuts */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <button
              onClick={() => {
                onSelectSection('ABOUT');
                scrollToTop();
              }}
              className="hover:text-teal-300 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => {
                onSelectSection('PROJECTION DESIGN');
                scrollToTop();
              }}
              className="hover:text-teal-300 transition-colors"
            >
              Projection Design
            </button>
            <button
              onClick={() => {
                onSelectSection('IMMERSIVE MEDIA');
                scrollToTop();
              }}
              className="hover:text-teal-300 transition-colors"
            >
              Immersive Media
            </button>
            <button
              onClick={() => {
                onSelectSection('CONTACT');
                scrollToTop();
              }}
              className="hover:text-teal-300 transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Right: Scroll to top */}
          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 font-mono text-[10px] text-neutral-400 hover:text-white uppercase tracking-widest transition-colors group p-2 border border-white/10 hover:border-teal-400/40 bg-white/[0.02]"
            title="Scroll back to top"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-teal-400 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Bottom Strip: Copyright & Admin Portal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
          <div>
            &copy; {new Date().getFullYear()} {about?.name || 'SUBEG SINGH'}. ALL RIGHTS RESERVED.
          </div>

          {/* Admin Login Button at the Bottom */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAdmin}
              className={`group flex items-center space-x-2 px-3 py-1.5 rounded-sm border transition-all duration-300 ${
                isAdminLoggedIn
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:border-amber-400'
                  : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-teal-400/40 hover:bg-white/[0.05]'
              }`}
              id="footer-admin-login-button"
              title={isAdminLoggedIn ? 'Open Admin Control Panel' : 'Authenticate as Administrator'}
            >
              <Lock className={`w-3 h-3 ${isAdminLoggedIn ? 'text-amber-400' : 'text-neutral-400 group-hover:text-teal-400'} transition-colors`} />
              <span className="tracking-[0.18em] font-semibold text-[10px]">
                {isAdminLoggedIn ? 'ADMIN DASHBOARD' : 'ADMIN LOGIN'}
              </span>
              {isAdminLoggedIn && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
