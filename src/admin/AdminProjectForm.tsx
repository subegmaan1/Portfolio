import React, { useState } from 'react';
import { Project, ProjectCategory } from '../types';
import { saveProjectApi, uploadMediaApi } from '../lib/api';
import { parseVideoUrl } from '../lib/videoUtils';
import { ArrowLeft, Save, Upload, Plus, Trash2, Video, Play, ExternalLink } from 'lucide-react';

interface AdminProjectFormProps {
  initialProject: Partial<Project> | null;
  onCancel: () => void;
  onSaveSuccess: () => void;
}

export const AdminProjectForm: React.FC<AdminProjectFormProps> = ({
  initialProject,
  onCancel,
  onSaveSuccess
}) => {
  const isEditing = Boolean(initialProject?.id);

  const [title, setTitle] = useState(initialProject?.title || '');
  const [slug, setSlug] = useState(initialProject?.slug || '');
  const [category, setCategory] = useState<ProjectCategory>(
    initialProject?.category || 'PROJECTION DESIGN'
  );
  const [year, setYear] = useState(initialProject?.year || new Date().getFullYear().toString());
  const [role, setRole] = useState(initialProject?.role || 'Projection Designer');
  const [medium, setMedium] = useState(initialProject?.medium || '');
  const [shortDescription, setShortDescription] = useState(initialProject?.shortDescription || '');
  const [longDescription, setLongDescription] = useState(initialProject?.longDescription || '');
  const [heroMedia, setHeroMedia] = useState(initialProject?.heroMedia || '');
  const [hoverMedia, setHoverMedia] = useState(initialProject?.hoverMedia || '');
  const [videoStreamUrl, setVideoStreamUrl] = useState(initialProject?.videoStreamUrl || '');
  const [enableStreaming, setEnableStreaming] = useState(initialProject?.enableStreaming || false);
  const [gallery, setGallery] = useState<string[]>(initialProject?.gallery || []);
  const [videos, setVideos] = useState<string[]>(initialProject?.videos || []);
  const [toolsStr, setToolsStr] = useState((initialProject?.tools || []).join(', '));
  const [credits, setCredits] = useState<{ role: string; name: string }[]>(
    initialProject?.credits || [{ role: 'Projection Designer', name: 'Subeg Singh' }]
  );
  const [featured, setFeatured] = useState(initialProject?.featured || false);
  const [published, setPublished] = useState(initialProject?.published ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Generate slug from title automatically if empty
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || !isEditing) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'hero' | 'hover' | 'gallery'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    try {
      if (target === 'gallery') {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const media = await uploadMediaApi(files[i]);
          if (media?.url) {
            uploadedUrls.push(media.url);
          }
        }
        if (uploadedUrls.length > 0) {
          setGallery(prev => {
            // Remove any broken /uploads/ paths when fresh photos are uploaded
            const cleanPrev = prev.filter(u => u && !u.startsWith('/uploads/'));
            return [...cleanPrev, ...uploadedUrls];
          });
          // Also set hero media if currently empty or broken
          if (!heroMedia || heroMedia.startsWith('/uploads/')) {
            setHeroMedia(uploadedUrls[0]);
          }
        }
      } else {
        const file = files[0];
        const media = await uploadMediaApi(file);
        if (target === 'hero') setHeroMedia(media.url);
        else if (target === 'hover') setHoverMedia(media.url);
      }
    } catch {
      setError('Failed to upload file(s). Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addCredit = () => {
    setCredits(prev => [...prev, { role: '', name: '' }]);
  };

  const removeCredit = (index: number) => {
    setCredits(prev => prev.filter((_, i) => i !== index));
  };

  const addGalleryUrl = () => {
    setGallery(prev => [...prev, '']);
  };

  const addVideoUrl = () => {
    setVideos(prev => [...prev, '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required');
      return;
    }

    setSaving(true);
    setError('');

    const toolsArr = toolsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const cleanedGallery = gallery
      .map(g => g.trim())
      .filter(Boolean)
      .filter(g => !g.startsWith('/uploads/')); // Exclude broken relative server paths

    const cleanedVideos = videos.map(v => v.trim()).filter(Boolean);
    const effectiveHero = heroMedia.startsWith('/uploads/') ? '' : heroMedia.trim();
    const effectiveHeroMedia = effectiveHero || (cleanedGallery.length > 0 ? cleanedGallery[0] : '');

    const projectData: Partial<Project> = {
      id: initialProject?.id,
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category,
      year: year.trim(),
      role: role.trim(),
      medium: medium.trim(),
      shortDescription: shortDescription.trim(),
      longDescription: longDescription.trim(),
      heroMedia: effectiveHeroMedia,
      hoverMedia: hoverMedia.startsWith('/uploads/') ? effectiveHeroMedia : (hoverMedia.trim() || effectiveHeroMedia),
      videoStreamUrl: videoStreamUrl.trim(),
      enableStreaming,
      gallery: cleanedGallery,
      videos: cleanedVideos,
      tools: toolsArr,
      credits: credits.filter(c => c.role.trim() && c.name.trim()),
      featured,
      published
    };

    try {
      await saveProjectApi(projectData);
      onSaveSuccess();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.message ? `Failed to save project: ${err.message}` : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-syne font-bold text-2xl text-neutral-100">
              {isEditing ? `EDIT PROJECT: ${initialProject?.title}` : 'ADD NEW PROJECT'}
            </h1>
            <p className="font-mono text-xs text-neutral-400">
              Configure project metadata, hero media, galleries, and credits
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50"
          id="save-project-btn"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Project'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 font-mono text-xs">
          {error}
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-8 font-mono text-xs">
        {/* Core Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/60 p-6 border border-neutral-800">
          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. LUMEN: SYMPHONIC MONOLITH"
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600 font-syne font-bold text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="e.g. lumen-symphonic-monolith"
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ProjectCategory)}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600 uppercase font-semibold"
            >
              <option value="PROJECTION DESIGN">PROJECTION DESIGN</option>
              <option value="IMMERSIVE MEDIA">IMMERSIVE MEDIA</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Year</label>
            <input
              type="text"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="e.g. 2025"
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Designer Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Lead Projection Designer & Scenographer"
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Medium / Physical Format</label>
            <input
              type="text"
              value={medium}
              onChange={e => setMedium(e.target.value)}
              placeholder="e.g. 360° Architectural Projection Mapping"
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-6">
          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Short Summary Description</label>
            <textarea
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
              rows={2}
              placeholder="Concise 1-2 sentence overview shown in list..."
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Full Case Study Description</label>
            <textarea
              value={longDescription}
              onChange={e => setLongDescription(e.target.value)}
              rows={5}
              placeholder="Detailed architectural concept, execution, technical breakdown..."
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        {/* Hero & Hover Media Uploads */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-6">
          <h3 className="font-syne font-bold text-sm text-neutral-200 uppercase">
            Hero & Cursor Hover Media
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hero Media */}
            <div className="space-y-3">
              <label className="block text-neutral-400 uppercase">Hero Media URL</label>
              <input
                type="text"
                value={heroMedia}
                onChange={e => setHeroMedia(e.target.value)}
                placeholder="Image or MP4 Video URL"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100"
              />
              <label className="inline-flex items-center space-x-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-200 cursor-pointer hover:bg-neutral-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={e => handleFileUpload(e, 'hero')}
                  className="hidden"
                  accept="image/*,video/*"
                />
              </label>
              {heroMedia && (
                <div className="aspect-video bg-neutral-950 border border-neutral-800 overflow-hidden">
                  <img src={heroMedia} alt="Hero Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Hover Media */}
            <div className="space-y-3">
              <label className="block text-neutral-400 uppercase">Hover Preview Media URL</label>
              <input
                type="text"
                value={hoverMedia}
                onChange={e => setHoverMedia(e.target.value)}
                placeholder="Cursor preview URL (defaults to hero media)"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100"
              />
              <label className="inline-flex items-center space-x-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-200 cursor-pointer hover:bg-neutral-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={e => handleFileUpload(e, 'hover')}
                  className="hidden"
                  accept="image/*,video/*"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Video Streaming (YouTube / Vimeo) Section */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-none bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-sm text-neutral-100 uppercase">
                  Cinematic Video Stream (YouTube / Vimeo)
                </h3>
                <p className="font-mono text-[11px] text-neutral-400">
                  Embed full high-definition video player for live case studies and documentation
                </p>
              </div>
            </div>

            {/* Activate Video Switch */}
            <label className="inline-flex items-center space-x-3 cursor-pointer bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-sm select-none hover:border-teal-500/50 transition-colors">
              <input
                type="checkbox"
                checked={enableStreaming}
                onChange={e => setEnableStreaming(e.target.checked)}
                className="w-4 h-4 accent-teal-500 cursor-pointer"
                id="activate-streaming-checkbox"
              />
              <span className="font-mono text-xs uppercase font-bold text-neutral-200">
                {enableStreaming ? 'Streaming Activated' : 'Streaming Disabled'}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-neutral-400 uppercase">
                Video Link (YouTube URL or Vimeo URL)
              </label>
              <input
                type="text"
                value={videoStreamUrl}
                onChange={e => setVideoStreamUrl(e.target.value)}
                placeholder="e.g. https://vimeo.com/76979871 or https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-teal-500 font-mono text-xs"
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-neutral-400">
                <span>Supported: Vimeo URLs, YouTube URLs, YouTube Shorts, or direct video streams</span>
                {videoStreamUrl && enableStreaming && (
                  <span className="text-teal-400 font-bold flex items-center space-x-1">
                    <span>&bull;</span>
                    <span>Ready for case study streaming</span>
                  </span>
                )}
              </div>
            </div>

            {/* Live Video Preview in Admin */}
            {videoStreamUrl && (
              <div className="pt-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-2">
                  Live Video Stream Embed Preview:
                </span>
                {(() => {
                  const parsed = parseVideoUrl(videoStreamUrl);
                  if (parsed.type === 'invalid') {
                    return (
                      <div className="p-3 bg-amber-950/40 border border-amber-800/60 text-amber-300 font-mono text-xs">
                        Warning: Unable to parse video URL. Please provide a valid YouTube (youtube.com / youtu.be) or Vimeo (vimeo.com) link.
                      </div>
                    );
                  }
                  return (
                    <div className="relative aspect-video w-full max-w-2xl bg-neutral-950 border border-teal-500/30 overflow-hidden shadow-xl">
                      {parsed.type === 'direct' ? (
                        <video
                          src={parsed.embedUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <iframe
                          src={parsed.embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video Stream Preview"
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Tools & Credits */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-6">
          <div className="space-y-2">
            <label className="block text-neutral-400 uppercase">Software Tools / Capabilities (Comma separated)</label>
            <input
              type="text"
              value={toolsStr}
              onChange={e => setToolsStr(e.target.value)}
              placeholder="e.g. TouchDesigner, Disguise vx4, Notch, Unreal Engine 5"
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex justify-between items-center">
              <label className="text-neutral-400 uppercase block">Project Credits</label>
              <button
                type="button"
                onClick={addCredit}
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Credit</span>
              </button>
            </div>

            {credits.map((cred, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={cred.role}
                  onChange={e => {
                    const next = [...credits];
                    next[idx].role = e.target.value;
                    setCredits(next);
                  }}
                  placeholder="Role (e.g. Conductor)"
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100"
                />
                <input
                  type="text"
                  value={cred.name}
                  onChange={e => {
                    const next = [...credits];
                    next[idx].name = e.target.value;
                    setCredits(next);
                  }}
                  placeholder="Name"
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => removeCredit(idx)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Documentation Images */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center space-x-3">
                <label className="text-neutral-200 font-bold uppercase text-xs">Documentation Gallery Images</label>
                <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-teal-400 text-[10px] font-mono">
                  {gallery.filter(Boolean).length} {gallery.filter(Boolean).length === 1 ? 'image' : 'images'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={addGalleryUrl}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono transition-colors"
                >
                  + Add URL
                </button>
                <label className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-xs font-mono font-bold cursor-pointer transition-colors flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Upload Photos</span>
                  <input
                    type="file"
                    multiple
                    onChange={e => handleFileUpload(e, 'gallery')}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="p-8 border border-dashed border-neutral-800 text-center font-mono text-xs text-neutral-500 space-y-2">
                <p>No gallery images added yet.</p>
                <p className="text-[11px] text-neutral-600">Click &quot;+ Upload Photos&quot; to select one or multiple images for the project carousel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gallery.map((url, idx) => (
                  <div key={idx} className="bg-neutral-950 p-2.5 border border-neutral-800 space-y-2 group">
                    <div className="aspect-video relative overflow-hidden bg-neutral-900 border border-neutral-800/80">
                      {url ? (
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: url ? 'none' : 'flex' }}
                        className="w-full h-full flex flex-col items-center justify-center text-neutral-500 font-mono text-[10px] p-2 text-center bg-neutral-900"
                      >
                        {url.startsWith('/uploads/') ? (
                          <span className="text-amber-400">Broken local path. Please re-upload photo.</span>
                        ) : (
                          <span>{url ? 'Failed to load image' : 'Enter image URL below'}</span>
                        )}
                      </div>
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-neutral-950/80 font-mono text-[9px] text-neutral-400 border border-white/10">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={url}
                        placeholder="Image URL or data URI..."
                        onChange={e => {
                          const next = [...gallery];
                          next[idx] = e.target.value;
                          setGallery(next);
                        }}
                        className="flex-1 px-2 py-1.5 bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-teal-500"
                        autoFocus={url === ''}
                      />
                      <button
                        type="button"
                        onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {url && (
                      <div className="flex justify-between items-center pt-1 border-t border-neutral-900 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => setHeroMedia(url)}
                          className="text-neutral-500 hover:text-teal-400"
                          title="Use this image as Hero Media"
                        >
                          {heroMedia === url ? '★ Hero Media' : 'Set as Hero'}
                        </button>
                        <div className="flex space-x-2">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...gallery];
                                const temp = next[idx - 1];
                                next[idx - 1] = next[idx];
                                next[idx] = temp;
                                setGallery(next);
                              }}
                              className="text-neutral-500 hover:text-neutral-300"
                            >
                              &larr; Prev
                            </button>
                          )}
                          {idx < gallery.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...gallery];
                                const temp = next[idx + 1];
                                next[idx + 1] = next[idx];
                                next[idx] = temp;
                                setGallery(next);
                              }}
                              className="text-neutral-500 hover:text-neutral-300"
                            >
                              Next &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Checkboxes */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 flex flex-wrap gap-8">
          <label className="inline-flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={e => setPublished(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="uppercase text-neutral-200">Publish Project Publicly</span>
          </label>

          <label className="inline-flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="uppercase text-neutral-200">Feature on Homepage Highlight</span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-neutral-100 text-neutral-950 font-bold uppercase hover:bg-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
};
