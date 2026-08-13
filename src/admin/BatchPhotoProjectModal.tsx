import React, { useState } from 'react';
import { ProjectCategory } from '../types';
import { saveProjectApi, uploadMediaApi } from '../lib/api';
import { Upload, X, Check, Image as ImageIcon, Layers, Sparkles } from 'lucide-react';

interface BatchPhotoProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GroupedProject {
  id: string;
  groupKey: string;
  title: string;
  category: ProjectCategory;
  year: string;
  role: string;
  images: { id: string; url: string; originalName: string }[];
  heroIndex: number;
}

// Clean filename to extract project name base
function extractProjectNameFromFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Remove trailing numbers, version suffixes like _1, -1, (1), _v1, copy
  const cleaned = nameWithoutExt
    .replace(/[-_]?(?:v\d+|\d+|copy|\(\d+\))$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned ? cleaned.toUpperCase() : 'NEW PROJECT';
}

export const BatchPhotoProjectModal: React.FC<BatchPhotoProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [groups, setGroups] = useState<GroupedProject[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadedMedia: { url: string; originalName: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await uploadMediaApi(files[i]);
        uploadedMedia.push({ url: item.url, originalName: item.originalName });
      }

      // Group uploaded media by extracted project name
      const groupsMap = new Map<string, GroupedProject>();

      uploadedMedia.forEach((media, idx) => {
        const titleBase = extractProjectNameFromFilename(media.originalName);
        const groupKey = titleBase.toLowerCase();

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: `batch-${Date.now()}-${idx}`,
            groupKey,
            title: titleBase,
            category: 'PROJECTION DESIGN',
            year: new Date().getFullYear().toString(),
            role: 'Projection Designer',
            images: [],
            heroIndex: 0
          });
        }

        const group = groupsMap.get(groupKey)!;
        group.images.push({
          id: `img-${Date.now()}-${idx}`,
          url: media.url,
          originalName: media.originalName
        });
      });

      setGroups(prev => {
        const combined = [...prev];
        groupsMap.forEach(newGroup => {
          const existing = combined.find(g => g.groupKey === newGroup.groupKey);
          if (existing) {
            existing.images.push(...newGroup.images);
          } else {
            combined.push(newGroup);
          }
        });
        return combined;
      });
    } catch {
      setError('Failed to upload some image files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProjects = async () => {
    if (groups.length === 0) return;

    setProcessing(true);
    setError('');

    try {
      for (const group of groups) {
        if (!group.title.trim() || group.images.length === 0) continue;

        const heroUrl = group.images[group.heroIndex]?.url || group.images[0].url;
        const hoverUrl = group.images[1]?.url || heroUrl;
        const galleryUrls = group.images.map(img => img.url);

        await saveProjectApi({
          title: group.title.trim(),
          category: group.category,
          year: group.year,
          role: group.role,
          medium: 'Digital Scenography & Project Mapping',
          shortDescription: `A case study exploring ${group.title.toLowerCase()} through immersive spatial projection.`,
          longDescription: `${group.title} integrates high-resolution spatial projection, custom real-time canvas architectures, and digital scenography.`,
          heroMedia: heroUrl,
          hoverMedia: hoverUrl,
          gallery: galleryUrls,
          featured: false,
          published: true
        });
      }

      onSuccess();
      onClose();
    } catch {
      setError('Failed to create projects from photos');
    } finally {
      setProcessing(false);
    }
  };

  const updateGroup = (id: string, updates: Partial<GroupedProject>) => {
    setGroups(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  };

  const removeGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-800 rounded">
              <Layers className="w-5 h-5 text-neutral-200" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-lg text-neutral-100 tracking-wider">
                BATCH CREATE PROJECTS FROM PHOTOS
              </h2>
              <p className="font-mono text-xs text-neutral-400">
                Upload photos with matching names to automatically build single project case studies with hero & gallery images.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 transition-colors p-8 text-center bg-neutral-950/50">
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <p className="font-syne font-bold text-sm text-neutral-200 mb-1">
              Select or Drop Project Photos
            </p>
            <p className="font-mono text-xs text-neutral-400 max-w-md mx-auto mb-4">
              Photos with identical or similar names (e.g. <span className="text-neutral-200">LightShow_1.jpg</span>, <span className="text-neutral-200">LightShow_2.jpg</span>) are automatically grouped into one project.
            </p>

            <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors cursor-pointer">
              <ImageIcon className="w-4 h-4" />
              <span>{uploading ? 'Uploading & Grouping...' : 'Upload Photos'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 font-mono text-xs">
              {error}
            </div>
          )}

          {/* Grouped Projects List */}
          {groups.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Detected Project Groups ({groups.length})</span>
                </span>
                <span className="font-mono text-[11px] text-neutral-500">
                  Click an image thumbnail to designate it as the Hero Image
                </span>
              </div>

              <div className="space-y-4">
                {groups.map((group, gIdx) => (
                  <div
                    key={group.id}
                    className="bg-neutral-950 border border-neutral-800 p-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Project Title */}
                      <div className="md:col-span-5">
                        <label className="font-mono text-[10px] text-neutral-400 uppercase block mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={group.title}
                          onChange={e => updateGroup(group.id, { title: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 font-syne font-bold text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                        />
                      </div>

                      {/* Category */}
                      <div className="md:col-span-4">
                        <label className="font-mono text-[10px] text-neutral-400 uppercase block mb-1">
                          Category
                        </label>
                        <select
                          value={group.category}
                          onChange={e =>
                            updateGroup(group.id, { category: e.target.value as ProjectCategory })
                          }
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                        >
                          <option value="PROJECTION DESIGN">PROJECTION DESIGN</option>
                          <option value="IMMERSIVE MEDIA">IMMERSIVE MEDIA</option>
                        </select>
                      </div>

                      {/* Year */}
                      <div className="md:col-span-2">
                        <label className="font-mono text-[10px] text-neutral-400 uppercase block mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          value={group.year}
                          onChange={e => updateGroup(group.id, { year: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                        />
                      </div>

                      {/* Delete Group */}
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          onClick={() => removeGroup(group.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                          title="Remove Project Group"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Image Thumbnails & Hero Selection */}
                    <div>
                      <div className="font-mono text-[10px] text-neutral-400 uppercase mb-2">
                        Select Hero Image ({group.images.length} photos attached)
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {group.images.map((img, iIdx) => {
                          const isHero = group.heroIndex === iIdx;
                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => updateGroup(group.id, { heroIndex: iIdx })}
                              className={`relative aspect-video rounded border overflow-hidden transition-all group ${
                                isHero
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105'
                                  : 'border-neutral-800 hover:border-neutral-600 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.originalName}
                                className="w-full h-full object-cover"
                              />
                              {isHero && (
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-neutral-950 font-mono text-[9px] font-bold uppercase rounded flex items-center space-x-1 shadow">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>HERO</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 font-mono text-xs hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateProjects}
            disabled={groups.length === 0 || processing}
            className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>
              {processing
                ? 'Creating Projects...'
                : `Create ${groups.length} Project${groups.length === 1 ? '' : 's'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
