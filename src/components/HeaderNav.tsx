import React, { useState } from 'react';
import { PublicNavSection } from '../types';
import { Lock, Menu, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderNavProps {
  activeSection: PublicNavSection;
  onSelectSection: (section: PublicNavSection) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  about?: { name: string; title: string } | null;
}

const NAV_ITEMS: { id: PublicNavSection; num: string; label: string }[] = [
  { id: 'ABOUT', num: '01', label: 'ABOUT' },
  { id: 'PROJECTION DESIGN', num: '02', label: 'PROJECTION DESIGN' },
  { id: 'IMMERSIVE MEDIA', num: '03', label: 'IMMERSIVE MEDIA' },
  { id: 'CONTACT', num: '04', label: 'CONTACT' }
];

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenAdmin,
  isAdminLoggedIn,
  about
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectMobile = (section: PublicNavSection) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  const handleAdminMobile = () => {
    onOpenAdmin();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#080808]/85 border-b border-white/[0.06] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 h-20 flex items-center justify-between">
          {/* Left: Designer Branding */}
          <button
            onClick={() => {
              onSelectSection('ABOUT');
              setMobileMenuOpen(false);
            }}
            className="text-left group flex items-center space-x-3 focus:outline-none z-10 shrink-0"
            id="nav-brand-button"
          >
            <div className="flex flex-col">
              <span className="font-syne font-extrabold text-sm sm:text-base tracking-[0.15em] text-neutral-100 group-hover:text-white transition-colors uppercase">
                {about?.name || 'SUBEG SINGH'}
              </span>
              <span className="text-[9px] font-mono text-teal-400/90 tracking-[0.2em] uppercase font-semibold group-hover:text-teal-300 transition-colors line-clamp-1 max-w-[220px] sm:max-w-none">
                {about?.title || 'IMMERSIVE MEDIA DESIGNER'}
              </span>
            </div>
          </button>

          {/* Right Desktop Nav (hidden on mobile, visible on md+) */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-10" id="main-nav">
            {NAV_ITEMS.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`relative font-mono text-[10px] lg:text-xs tracking-[0.22em] uppercase transition-all duration-300 py-2.5 ${
                    isActive
                      ? 'text-neutral-100 font-bold opacity-100'
                      : 'text-neutral-400 opacity-60 hover:opacity-100 hover:text-white'
                  }`}
                  id={`nav-item-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-teal-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* Subtle Admin Link */}
            <button
              onClick={onOpenAdmin}
              title={isAdminLoggedIn ? 'Admin Dashboard (Active)' : 'Admin Dashboard Login'}
              className={`p-2 rounded border transition-all duration-300 flex items-center space-x-1.5 ${
                isAdminLoggedIn
                  ? 'text-amber-400 border-amber-400/30 hover:text-amber-300 bg-amber-400/10'
                  : 'text-neutral-400 border-white/10 hover:text-white hover:border-white/30 hover:bg-white/5'
              }`}
              id="admin-dashboard-toggle-button"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="font-mono text-[9px] tracking-widest uppercase">
                {isAdminLoggedIn ? 'ADMIN' : 'LOGIN'}
              </span>
            </button>
          </nav>

          {/* Mobile Right Controls (visible on small screens) */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Quick Contact Button */}
            <button
              onClick={() => handleSelectMobile('CONTACT')}
              className={`p-2 rounded border font-mono text-[9px] tracking-wider uppercase flex items-center space-x-1.5 transition-colors ${
                activeSection === 'CONTACT'
                  ? 'text-teal-300 border-teal-500/40 bg-teal-500/10'
                  : 'text-neutral-300 border-white/10 hover:bg-white/5'
              }`}
              title="Contact Section"
              id="mobile-quick-contact-btn"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>CONTACT</span>
            </button>

            {/* Admin Lock Button */}
            <button
              onClick={handleAdminMobile}
              title={isAdminLoggedIn ? 'Admin Active' : 'Admin Login'}
              className={`p-2 rounded border transition-colors ${
                isAdminLoggedIn
                  ? 'text-amber-400 border-amber-400/40 bg-amber-400/10'
                  : 'text-neutral-400 border-white/10 hover:text-white hover:bg-white/5'
              }`}
              id="mobile-admin-toggle-btn"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-200 border border-white/10 rounded hover:bg-white/5 transition-colors"
              aria-label="Toggle Mobile Menu"
              id="mobile-menu-toggle-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-teal-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-30 bg-neutral-950/95 backdrop-blur-2xl pt-24 px-6 pb-12 flex flex-col justify-between md:hidden"
          >
            <div className="space-y-6 pt-4">
              <div className="font-mono text-[10px] text-teal-400/80 uppercase tracking-[0.3em] pb-3 border-b border-white/10 flex items-center justify-between">
                <span>// NAVIGATION DIRECTORY</span>
                <span className="text-white/40">SUBEG SINGH</span>
              </div>

              <div className="flex flex-col space-y-3">
                {NAV_ITEMS.map(item => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMobile(item.id)}
                      className={`text-left py-3 px-4 border transition-all flex items-center justify-between ${
                        isActive
                          ? 'border-teal-500/50 bg-teal-500/10 text-white'
                          : 'border-white/5 hover:border-white/20 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs text-teal-400 font-semibold">{item.num}</span>
                        <span className="font-syne font-bold text-lg uppercase tracking-wider">{item.label}</span>
                      </div>
                      {isActive && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Admin Button inside Mobile Drawer */}
              <div className="pt-4">
                <button
                  onClick={handleAdminMobile}
                  className={`w-full py-3.5 px-4 border font-mono text-xs tracking-widest uppercase flex items-center justify-center space-x-2 transition-all ${
                    isAdminLoggedIn
                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                      : 'border-white/10 hover:border-white/30 bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{isAdminLoggedIn ? 'OPEN ADMIN DASHBOARD' : 'ADMIN DASHBOARD LOGIN'}</span>
                </button>
              </div>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="pt-8 border-t border-white/10 flex justify-between items-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              <span>NEW YORK / GLOBAL</span>
              <span className="text-teal-400">IMMERSIVE MEDIA</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


