import React from 'react';
import { adminLogout } from '../lib/api';
import {
  LayoutDashboard,
  FolderKanban,
  Image as ImageIcon,
  User,
  FileText,
  Mail,
  Settings,
  LogOut,
  Eye
} from 'lucide-react';

export type AdminTab =
  | 'DASHBOARD'
  | 'PROJECTS'
  | 'MEDIA'
  | 'ABOUT'
  | 'CV'
  | 'CONTACT'
  | 'SETTINGS';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onViewSite: () => void;
  children: React.ReactNode;
}

const TABS: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'PROJECTS', label: 'Projects', icon: FolderKanban },
  { id: 'MEDIA', label: 'Media Library', icon: ImageIcon },
  { id: 'ABOUT', label: 'About', icon: User },
  { id: 'CV', label: 'CV Manager', icon: FileText },
  { id: 'CONTACT', label: 'Contact', icon: Mail },
  { id: 'SETTINGS', label: 'Settings', icon: Settings }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  onViewSite,
  children
}) => {
  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-neutral-900 border-r border-neutral-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <span className="font-syne font-bold text-base text-neutral-100 block">
                SUBEG SINGH
              </span>
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-semibold">
                Control Panel
              </span>
            </div>
            <button
              onClick={onViewSite}
              className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="View Public Site"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Tabs */}
          <nav className="space-y-1 font-mono text-xs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-100 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                  id={`admin-nav-${tab.id.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-6 border-t border-neutral-800 space-y-3 font-mono text-xs">
          <button
            onClick={onViewSite}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Return to Website</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-red-400 hover:bg-red-950/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
