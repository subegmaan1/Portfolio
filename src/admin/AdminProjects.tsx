import React, { useState } from 'react';
import { Project } from '../types';
import { deleteProjectApi, reorderProjectsApi, saveProjectApi, flushAllMockDataApi } from '../lib/api';
import { BatchPhotoProjectModal } from './BatchPhotoProjectModal';
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  GripVertical,
  Layers,
  ArrowUpDown,
  Check,
  Sparkles
} from 'lucide-react';

interface AdminProjectsProps {
  projects: Project[];
  onRefreshProjects: () => void;
  onAddNewProject: () => void;
  onEditProject: (project: Project) => void;
}

export const AdminProjects: React.FC<AdminProjectsProps> = ({
  projects,
  onRefreshProjects,
  onAddNewProject,
  onEditProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [reorderSuccess, setReorderSuccess] = useState(false);
  const [flushMessage, setFlushMessage] = useState('');

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFlushDemoData = async () => {
    if (confirm('Flush all deleted ghost projects and leftover mock demo data?')) {
      setLoading(true);
      try {
        await flushAllMockDataApi();
        setFlushMessage('Old demo & ghost data flushed successfully!');
        onRefreshProjects();
        setTimeout(() => setFlushMessage(''), 4000);
      } catch {
        onRefreshProjects();
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter projects
  const filtered = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.medium.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || p.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'PUBLISHED' && p.published) ||
      (selectedStatus === 'DRAFT' && !p.published);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (project: Project) => {
    if (confirm(`Are you sure you want to delete project "${project.title}"?`)) {
      setLoading(true);
      try {
        await deleteProjectApi(project.id);
        onRefreshProjects();
      } catch (err) {
        alert('Failed to delete project');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTogglePublish = async (project: Project) => {
    try {
      await saveProjectApi({
        id: project.id,
        published: !project.published
      });
      onRefreshProjects();
    } catch {
      alert('Failed to update status');
    }
  };

  const persistReorderedList = async (reorderedFiltered: Project[]) => {
    // Merge reordered subset back into the full project list
    const remainingProjects = projects.filter(p => !reorderedFiltered.some(rf => rf.id === p.id));
    const fullReordered = [...reorderedFiltered, ...remainingProjects];
    const reorderedIds = fullReordered.map(p => p.id);

    try {
      setLoading(true);
      await reorderProjectsApi(reorderedIds);
      onRefreshProjects();
      setReorderSuccess(true);
      setTimeout(() => setReorderSuccess(false), 2500);
    } catch {
      alert('Failed to reorder projects');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === filtered.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const reorderedList = [...filtered];
    const [moved] = reorderedList.splice(index, 1);
    reorderedList.splice(targetIndex, 0, moved);

    await persistReorderedList(reorderedList);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reorderedList = [...filtered];
    const [moved] = reorderedList.splice(draggedIndex, 1);
    reorderedList.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);

    await persistReorderedList(reorderedList);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            PROJECT MANAGEMENT
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Create, edit, reorder & organize portfolio case studies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          {reorderSuccess && (
            <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Project order saved!</span>
            </div>
          )}

          {flushMessage && (
            <div className="px-3 py-1.5 bg-amber-950 border border-amber-800 text-amber-300 font-mono text-xs flex items-center space-x-1.5 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{flushMessage}</span>
            </div>
          )}

          <button
            onClick={handleFlushDemoData}
            disabled={loading}
            title="Flush old demo projects and deleted ghost items"
            className="px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-xs hover:bg-neutral-800 hover:text-amber-300 transition-colors flex items-center space-x-1.5"
            id="admin-flush-data-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Flush Ghost Data</span>
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-100 font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 hover:border-neutral-500 transition-colors flex items-center space-x-2"
            id="admin-batch-photos-btn"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Batch Photos to Projects</span>
          </button>

          <button
            onClick={onAddNewProject}
            className="px-5 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2"
            id="admin-create-project-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Resequencing Hint Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-neutral-400">
        <div className="flex items-center space-x-2.5">
          <ArrowUpDown className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            <strong className="text-neutral-200 uppercase">Resequence Projects:</strong> Drag any row using the handle ( <GripVertical className="w-3 h-3 inline text-neutral-500" /> ) or click the ▲ / ▼ arrows to rearrange the display sequence in real-time.
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase shrink-0">
          {filtered.length} {filtered.length === 1 ? 'Project' : 'Projects'} Listed
        </span>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 font-mono text-xs">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search projects by title, role or medium..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
          >
            <option value="ALL">All Categories</option>
            <option value="PROJECTION DESIGN">PROJECTION DESIGN</option>
            <option value="IMMERSIVE MEDIA">IMMERSIVE MEDIA</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      {filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 p-12 text-center space-y-3">
          <p className="font-mono text-xs text-neutral-400 uppercase">
            No projects matched your search criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
            }}
            className="font-mono text-xs text-amber-400 underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase select-none">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4 w-20">Order</th>
                <th className="p-4">Project Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Year</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.map((proj, idx) => {
                const isDragging = draggedIndex === idx;
                const isOver = dragOverIndex === idx;

                return (
                  <tr
                    key={proj.id}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDrop={e => handleDrop(e, idx)}
                    className={`transition-all ${
                      isDragging
                        ? 'opacity-30 bg-neutral-800/80 border-dashed border-teal-500'
                        : isOver
                        ? 'bg-teal-950/40 border-t-2 border-teal-400'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    {/* Index Display */}
                    <td className="p-4 text-center text-neutral-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Order Controls & Drag Handle */}
                    <td className="p-4">
                      <div className="flex items-center space-x-1">
                        <span
                          className="p-1 cursor-grab active:cursor-grabbing text-neutral-500 hover:text-teal-400 transition-colors"
                          title="Drag to resequence"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                        <button
                          onClick={() => handleMove(idx, 'UP')}
                          disabled={idx === 0}
                          className="p-1 text-neutral-500 hover:text-neutral-100 disabled:opacity-20 transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'DOWN')}
                          disabled={idx === filtered.length - 1}
                          className="p-1 text-neutral-500 hover:text-neutral-100 disabled:opacity-20 transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Title & Preview Image */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {proj.heroMedia ? (
                          <img
                            src={proj.heroMedia}
                            alt={proj.title}
                            className="w-12 h-9 object-cover border border-neutral-800 shrink-0 bg-neutral-950"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-9 bg-neutral-950 border border-neutral-800 shrink-0 flex items-center justify-center text-[9px] text-neutral-600">
                            No Pic
                          </div>
                        )}
                        <div>
                          <span
                            onClick={() => onEditProject(proj)}
                            className="font-syne font-bold text-sm text-neutral-100 block hover:text-teal-300 cursor-pointer transition-colors"
                          >
                            {proj.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-light truncate max-w-xs block">
                            {proj.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2 py-1 bg-neutral-800 text-neutral-300 border border-neutral-700/50 uppercase text-[10px]">
                        {proj.category}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="p-4 text-neutral-300">{proj.year}</td>

                    {/* Status Toggle */}
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePublish(proj)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-semibold transition-colors ${
                          proj.published
                            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                            : 'bg-amber-950/80 border border-amber-800 text-amber-300 hover:bg-amber-900'
                        }`}
                      >
                        {proj.published ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEditProject(proj)}
                          className="p-1.5 bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                          title="Edit Project"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(proj)}
                          className="p-1.5 bg-red-950/50 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Batch Photo Project Modal */}
      <BatchPhotoProjectModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={() => {
          onRefreshProjects();
        }}
      />
    </div>
  );
};

