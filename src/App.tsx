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
import { ProjectHoverPreview } from './components/ProjectHoverPreview';
import { AboutSection } from './components/AboutSection';
import { ProjectionDesignSection } from './components/ProjectionDesignSection';
import { ImmersiveMediaSection } from './components/ImmersiveMediaSection';
import { ContactSection } from './components/ContactSection';
import { ProjectDetailModal } from './components/ProjectDetailModal';

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

export default function App() {
  // Public Section State (Default homepage is ABOUT)
  const [activeSection, setActiveSection] = useState<PublicNavSection>('ABOUT');

  // Core Data Stores
  const [about, setAbout] = useState<AboutData | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Interaction States
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Admin Dashboard States
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('DASHBOARD');
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

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

  useEffect(() => {
    setHoveredProject(null);
  }, [activeSection, selectedProject, isAdminOpen]);

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowLoginModal(false);
    setIsAdminOpen(true);
    loadPublicData();
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
        onLogout={() => {
          setIsAdminAuthenticated(false);
          setIsAdminOpen(false);
        }}
        onViewSite={() => setIsAdminOpen(false)}
      >
        {editingProject ? (
          <AdminProjectForm
            initialProject={editingProject}
            onCancel={() => setEditingProject(null)}
            onSaveSuccess={() => {
              setEditingProject(null);
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

      {/* Top Restricted Navigation */}
      <HeaderNav
        activeSection={activeSection}
        onSelectSection={sec => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={isAdminAuthenticated}
      />

      {/* Cursor Floating Hover Media Preview */}
      <ProjectHoverPreview hoveredProject={hoveredProject} />

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
                  onNavigateToSection={sec => {
                    setActiveSection(sec);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Section 2: PROJECTION DESIGN */}
              {activeSection === 'PROJECTION DESIGN' && (
                <ProjectionDesignSection
                  projects={projects}
                  onSelectProject={proj => setSelectedProject(proj)}
                  onHoverProject={proj => setHoveredProject(proj)}
                />
              )}

              {/* Section 3: IMMERSIVE MEDIA */}
              {activeSection === 'IMMERSIVE MEDIA' && (
                <ImmersiveMediaSection
                  projects={projects}
                  onSelectProject={proj => setSelectedProject(proj)}
                  onHoverProject={proj => setHoveredProject(proj)}
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
            onClose={() => setSelectedProject(null)}
            onSelectProject={proj => setSelectedProject(proj)}
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
