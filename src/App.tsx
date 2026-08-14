import React, { useEffect, useState } from 'react';
import { AboutData, ContactData, Project, PublicNavSection, SiteSettings } from './types';
import { AnimatePresence, motion } from 'motion/react';
import {
  checkAdminAuth,
  fetchAboutData,
  fetchContactData,
  fetchProjects,
  fetchSiteSettings,
  subscribeAboutData,
  subscribeContactData,
  subscribeProjects,
  subscribeSiteSettings
} from './lib/api';
import { ImmersiveBackground } from './components/ImmersiveBackground';
import { HeaderNav } from './components/HeaderNav';
import { AboutSection } from './components/AboutSection';
import { ProjectionDesignSection } from './components/ProjectionDesignSection';
import { ImmersiveMediaSection } from './components/ImmersiveMediaSection';
import { ContactSection } from './components/ContactSection';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ProjectHoverPreview } from './components/ProjectHoverPreview';

// Admin imports
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout, AdminTab } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProjects } from './admin/AdminProjects';
import { AdminProjectForm } from './admin/AdminProjectForm';
import { AdminMediaLibrary } from './admin/AdminMediaLibrary';
import { AdminAboutEditor } from './admin/AdminAboutEditor';
import { AdminCVManager } from './admin/AdminCVManager';
import { AdminContactEditor } from './admin/AdminContactEditor';
import { AdminSettings } from './admin/AdminSettings';

import { initialAboutData, initialContactData, initialProjects, initialSiteSettings } from './data/initial-store';

export default function App() {
  // Public Section State (Default homepage is ABOUT)
  const [activeSection, setActiveSection] = useState<PublicNavSection>('ABOUT');

  // Core Data Stores initialized with fallback defaults for instant rendering
  const [about, setAbout] = useState<AboutData>(initialAboutData);
  const [contact, setContact] = useState<ContactData>(initialContactData);
  const [settings, setSettings] = useState<SiteSettings>(initialSiteSettings);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState<boolean>(false);

  // interaction States
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Admin Dashboard States
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('DASHBOARD');
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

  // Convert section name to URL hash
  const sectionToHash = (sec: PublicNavSection): string => {
    switch (sec) {
      case 'PROJECTION DESIGN':
        return '#/projection-design';
      case 'IMMERSIVE MEDIA':
        return '#/immersive-media';
      case 'CONTACT':
        return '#/contact';
      case 'ABOUT':
      default:
        return '#/about';
    }
  };

  // Convert URL hash to section name
  const hashToSection = (hash: string): PublicNavSection => {
    if (hash.includes('/projection-design')) return 'PROJECTION DESIGN';
    if (hash.includes('/immersive-media')) return 'IMMERSIVE MEDIA';
    if (hash.includes('/contact')) return 'CONTACT';
    return 'ABOUT';
  };

  // Handle URL Hash Synchronization (Back/Forward browser buttons & deep-linking)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash || '';

      if (hash.startsWith('#/project/')) {
        const slugOrId = hash.replace('#/project/', '').trim();
        const found = projects.find(p => p.slug === slugOrId || p.id === slugOrId);
        if (found) {
          setSelectedProject(found);
          return;
        }
      } else {
        setSelectedProject(null);
      }

      if (hash === '#/admin') {
        if (isAdminAuthenticated) {
          setIsAdminOpen(true);
        } else {
          setShowLoginModal(true);
        }
        return;
      }

      if (isAdminOpen) {
        setIsAdminOpen(false);
      }

      const sec = hashToSection(hash);
      setActiveSection(sec);
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [projects, isAdminAuthenticated, isAdminOpen]);

  // Section Selector with browser history push
  const handleSelectSection = (sec: PublicNavSection) => {
    setActiveSection(sec);
    const targetHash = sectionToHash(sec);
    if (window.location.hash !== targetHash) {
      window.history.pushState({ type: 'section', section: sec }, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Project Open Selector with browser history push
  const handleSelectProject = (proj: Project) => {
    setSelectedProject(proj);
    const targetHash = `#/project/${proj.slug || proj.id}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ type: 'project', slug: proj.slug || proj.id }, '', targetHash);
    }
  };

  // Project Close Handler with history cleanup
  const handleCloseProject = () => {
    setSelectedProject(null);
    const currentHash = window.location.hash;
    if (currentHash.startsWith('#/project/')) {
      const fallbackHash = sectionToHash(activeSection);
      window.history.replaceState({ type: 'section', section: activeSection }, '', fallbackHash);
    }
  };

  // Load store data
  const loadPublicData = async () => {
    try {
      const [abt, cnt, stg, prj] = await Promise.all([
        fetchAboutData(),
        fetchContactData(),
        fetchSiteSettings(),
        fetchProjects()
      ]);
      setAbout(abt);
      setContact(cnt);
      setSettings(stg);
      setProjects(prj);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyAdminStatus = async () => {
    const isAuth = await checkAdminAuth();
    setIsAdminAuthenticated(isAuth);
  };

  useEffect(() => {
    verifyAdminStatus();

    const unsubProjects = subscribeProjects(data => {
      setProjects(data);
      setLoading(false);
    });
    const unsubAbout = subscribeAboutData(data => setAbout(data));
    const unsubContact = subscribeContactData(data => setContact(data));
    const unsubSettings = subscribeSiteSettings(data => setSettings(data));

    return () => {
      unsubProjects();
      unsubAbout();
      unsubContact();
      unsubSettings();
    };
  }, []);

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setIsAdminOpen(true);
      window.history.pushState({ type: 'admin' }, '', '#/admin');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowLoginModal(false);
    setIsAdminOpen(true);
    window.history.pushState({ type: 'admin' }, '', '#/admin');
    loadPublicData();
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdminOpen(false);
    const fallbackHash = sectionToHash(activeSection);
    window.history.pushState({ type: 'section', section: activeSection }, '', fallbackHash);
  };

  const handleAdminViewSite = () => {
    setIsAdminOpen(false);
    const fallbackHash = sectionToHash(activeSection);
    window.history.pushState({ type: 'section', section: activeSection }, '', fallbackHash);
  };

  // Render Admin Dashboard View
  if (isAdminOpen && isAdminAuthenticated) {
    return (
      <AdminLayout
        activeTab={adminTab}
        onSelectTab={tab => {
          setEditingProject(null);
          setAdminTab(tab);
        }}
        onLogout={handleAdminLogout}
        onViewSite={handleAdminViewSite}
      >
        {editingProject ? (
          <AdminProjectForm
            initialProject={editingProject}
            onCancel={() => setEditingProject(null)}
            onSaveSuccess={(savedProj?: Project) => {
              setEditingProject(null);
              if (savedProj) {
                setProjects(prev => {
                  const idx = prev.findIndex(p => p.id === savedProj.id);
                  if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = savedProj;
                    return copy;
                  }
                  return [savedProj, ...prev];
                });
              }
              loadPublicData();
            }}
          />
        ) : (
          <>
            {adminTab === 'DASHBOARD' && (
              <AdminDashboard
                projects={projects}
                onSelectTab={tab => setAdminTab(tab)}
                onAddNewProject={() => setEditingProject({})}
                onEditProject={proj => setEditingProject(proj)}
              />
            )}
            {adminTab === 'PROJECTS' && (
              <AdminProjects
                projects={projects}
                onRefreshProjects={loadPublicData}
                onAddNewProject={() => setEditingProject({})}
                onEditProject={proj => setEditingProject(proj)}
              />
            )}
            {adminTab === 'MEDIA' && <AdminMediaLibrary />}
            {adminTab === 'ABOUT' && about && (
              <AdminAboutEditor about={about} onRefreshAbout={loadPublicData} />
            )}
            {adminTab === 'CV' && about && (
              <AdminCVManager about={about} onRefreshAbout={loadPublicData} />
            )}
            {adminTab === 'CONTACT' && contact && (
              <AdminContactEditor contact={contact} onRefreshContact={loadPublicData} />
            )}
            {adminTab === 'SETTINGS' && settings && (
              <AdminSettings
                settings={settings}
                onRefreshSettings={loadPublicData}
                onRefreshAllData={loadPublicData}
              />
            )}
          </>
        )}
      </AdminLayout>
    );
  }

  return (
    <div className="relative min-h-screen text-neutral-100 selection:bg-neutral-100 selection:text-neutral-950 overflow-x-hidden">
      {/* Light Leak Accent Overlay */}
      <div className="light-leak" />

      {/* Kinetic WebGL Shader Canvas Background with Per-Page Color Palettes */}
      <ImmersiveBackground activeSection={activeSection} />

      {/* Cursor Floating Hover Media Preview */}
      <ProjectHoverPreview hoveredProject={hoveredProject} />

      {/* Top Restricted Navigation */}
      <HeaderNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={isAdminAuthenticated}
        about={about}
      />

      {/* Main View Switching */}
      <main className="relative z-10 overflow-x-hidden">
        {loading || !about || !contact ? (
          <div className="min-h-screen flex items-center justify-center font-mono text-xs text-neutral-500 uppercase tracking-widest">
            <span>Loading Immersive Environment...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 35, scale: 0.98, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -35, scale: 0.98, filter: 'blur(3px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Section 1: ABOUT (Default Homepage State) */}
              {activeSection === 'ABOUT' && (
                <AboutSection
                  about={about}
                  projects={projects}
                  onNavigateToSection={handleSelectSection}
                />
              )}

              {/* Section 2: PROJECTION DESIGN */}
              {activeSection === 'PROJECTION DESIGN' && (
                <ProjectionDesignSection
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  onHoverProject={setHoveredProject}
                />
              )}

              {/* Section 3: IMMERSIVE MEDIA */}
              {activeSection === 'IMMERSIVE MEDIA' && (
                <ImmersiveMediaSection
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  onHoverProject={setHoveredProject}
                />
              )}

              {/* Section 4: CONTACT */}
              {activeSection === 'CONTACT' && <ContactSection contact={contact} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Case Study Detail Modal Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            allProjects={projects}
            onClose={handleCloseProject}
            onSelectProject={handleSelectProject}
          />
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <AdminLogin
            onSuccess={handleAdminLoginSuccess}
            onCancel={() => setShowLoginModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
