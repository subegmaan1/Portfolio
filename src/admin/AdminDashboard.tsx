import React from 'react';
import { Project } from '../types';
import { AdminTab } from './AdminLayout';
import { Plus, FolderKanban, Image, User, CheckCircle2, Clock } from 'lucide-react';

interface AdminDashboardProps {
  projects: Project[];
  onSelectTab: (tab: AdminTab) => void;
  onAddNewProject: () => void;
  onEditProject: (project: Project) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  projects,
  onSelectTab,
  onAddNewProject,
  onEditProject
}) => {
  const total = projects.length;
  const published = projects.filter(p => p.published).length;
  const drafts = projects.filter(p => !p.published).length;
  const projectionCount = projects.filter(p => p.category === 'PROJECTION DESIGN').length;
  const immersiveCount = projects.filter(p => p.category === 'IMMERSIVE MEDIA').length;

  const recentlyUpdated = [...projects].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            DASHBOARD OVERVIEW
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            System status, project statistics & portfolio metrics
          </p>
        </div>
        <button
          onClick={onAddNewProject}
          className="px-5 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 shrink-0 self-start sm:self-auto"
          id="dashboard-add-project-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-5 space-y-2">
          <span className="font-mono text-xs text-neutral-400 uppercase block">Total Projects</span>
          <span className="font-syne font-extrabold text-3xl text-neutral-100">{total}</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-5 space-y-2">
          <span className="font-mono text-xs text-emerald-400 uppercase block">Published</span>
          <span className="font-syne font-extrabold text-3xl text-emerald-300">{published}</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-5 space-y-2">
          <span className="font-mono text-xs text-amber-400 uppercase block">Drafts</span>
          <span className="font-syne font-extrabold text-3xl text-amber-300">{drafts}</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-5 space-y-2">
          <span className="font-mono text-xs text-neutral-400 uppercase block">Projection / Immersive</span>
          <span className="font-syne font-extrabold text-3xl text-neutral-100">{projectionCount} / {immersiveCount}</span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onSelectTab('PROJECTS')}
          className="p-5 bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 text-left transition-colors group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-mono text-xs text-neutral-400 uppercase block">Manage Projects</span>
            <span className="font-syne font-bold text-neutral-200 group-hover:text-white">Project List & Reordering</span>
          </div>
          <FolderKanban className="w-5 h-5 text-neutral-500 group-hover:text-neutral-200" />
        </button>

        <button
          onClick={() => onSelectTab('MEDIA')}
          className="p-5 bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 text-left transition-colors group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-mono text-xs text-neutral-400 uppercase block">Media Library</span>
            <span className="font-syne font-bold text-neutral-200 group-hover:text-white">Upload Images & Videos</span>
          </div>
          <Image className="w-5 h-5 text-neutral-500 group-hover:text-neutral-200" />
        </button>

        <button
          onClick={() => onSelectTab('ABOUT')}
          className="p-5 bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 text-left transition-colors group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-mono text-xs text-neutral-400 uppercase block">About & Bio</span>
            <span className="font-syne font-bold text-neutral-200 group-hover:text-white">Edit Practice Description</span>
          </div>
          <User className="w-5 h-5 text-neutral-500 group-hover:text-neutral-200" />
        </button>
      </div>

      {/* Recently Updated Projects Table */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="font-syne font-bold text-lg text-neutral-100 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Recently Updated Projects</span>
          </h2>
          <button
            onClick={() => onSelectTab('PROJECTS')}
            className="font-mono text-xs text-neutral-400 hover:text-neutral-200 uppercase"
          >
            View All &rarr;
          </button>
        </div>

        {recentlyUpdated.length === 0 ? (
          <p className="font-mono text-xs text-neutral-500 py-4">No projects created yet.</p>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            {recentlyUpdated.map(proj => (
              <div
                key={proj.id}
                onClick={() => onEditProject(proj)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/50 cursor-pointer transition-colors gap-2"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${proj.published ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="font-syne font-bold text-sm text-neutral-200">{proj.title}</span>
                  <span className="text-[10px] text-neutral-500 border border-neutral-800 px-2 py-0.5 uppercase">
                    {proj.category}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-neutral-400 text-[11px]">
                  <span>{proj.year}</span>
                  <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  <span className="text-neutral-300 underline hover:text-white">Edit &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
