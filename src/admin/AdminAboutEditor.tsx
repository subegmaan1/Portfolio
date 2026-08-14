import React, { useState, useEffect } from 'react';
import { AboutData } from '../types';
import { saveAboutApi, uploadMediaApi } from '../lib/api';
import { Save, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

interface AdminAboutEditorProps {
  about: AboutData;
  onRefreshAbout: () => void;
}

export const AdminAboutEditor: React.FC<AdminAboutEditorProps> = ({ about, onRefreshAbout }) => {
  const [name, setName] = useState(about.name || 'SUBEG SINGH');
  const [title, setTitle] = useState(about.title || 'Projection Designer & Immersive Media Designer');
  const [primaryPractice, setPrimaryPractice] = useState(about.primaryPractice || 'Digital Scenography / Projection Design');
  const [secondaryPractice, setSecondaryPractice] = useState(about.secondaryPractice || 'Immersive Media');
  const [introduction, setIntroduction] = useState(about.introduction || '');
  const [background, setBackground] = useState(about.background || '');
  const [practiceDescription, setPracticeDescription] = useState(about.practiceDescription || '');
  const [capabilities, setCapabilities] = useState<string[]>(about.capabilities || []);
  const [photoUrl, setPhotoUrl] = useState(about?.photoUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isDirtyRef = React.useRef(false);

  // Sync state only if about prop updates AND user has not made unsaved changes
  useEffect(() => {
    if (about && !isDirtyRef.current) {
      setName(about.name || 'SUBEG SINGH');
      setTitle(about.title || 'Projection Designer & Immersive Media Designer');
      setPrimaryPractice(about.primaryPractice || 'Digital Scenography / Projection Design');
      setSecondaryPractice(about.secondaryPractice || 'Immersive Media');
      setIntroduction(about.introduction || '');
      setBackground(about.background || '');
      setPracticeDescription(about.practiceDescription || '');
      setCapabilities(about.capabilities || []);
      setPhotoUrl(about.photoUrl || '');
    }
  }, [about]);

  const markDirty = () => {
    isDirtyRef.current = true;
  };

  const addCapability = () => {
    markDirty();
    setCapabilities(prev => [...prev, '']);
  };

  const removeCapability = (index: number) => {
    markDirty();
    setCapabilities(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    markDirty();
    setUploadingPhoto(true);
    setMessage('');

    try {
      try {
        const media = await uploadMediaApi(file);
        setPhotoUrl(media.url);
        setMessage('Photo uploaded successfully!');
      } catch {
        // Static fallback to base64 Data URL if backend API is unreachable
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setPhotoUrl(result);
            setMessage('Photo loaded locally as Data URL.');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
      setMessage('Failed to process photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await saveAboutApi({
        name,
        title,
        primaryPractice,
        secondaryPractice,
        introduction,
        background,
        practiceDescription,
        capabilities,
        cvUrl: about?.cvUrl,
        photoUrl
      });
      isDirtyRef.current = false;
      setMessage('Saved to Cloud Firestore & Server storage successfully!');
      onRefreshAbout();
    } catch {
      setMessage('Failed to update About content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            EDIT ABOUT CONTENT
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Update personal identity, titles, bio statements, and practice descriptions
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50"
          id="save-about-btn"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save About'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 text-neutral-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name & Title */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Designer Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => { markDirty(); setName(e.target.value); }}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 font-syne font-bold text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Professional Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => { markDirty(); setTitle(e.target.value); }}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 font-syne text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Primary Practice Label</label>
              <input
                type="text"
                value={primaryPractice}
                onChange={e => { markDirty(); setPrimaryPractice(e.target.value); }}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Secondary Practice Label</label>
              <input
                type="text"
                value={secondaryPractice}
                onChange={e => { markDirty(); setSecondaryPractice(e.target.value); }}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200"
              />
            </div>
          </div>
        </div>

        {/* Artist Portrait Photo Section */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <label className="block text-neutral-300 uppercase font-bold text-sm tracking-wider flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-teal-400" />
            <span>Artist Portrait / Profile Photo</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Live Portrait Preview Box */}
            <div className="w-28 h-36 bg-neutral-950 border border-neutral-700 rounded overflow-hidden shrink-0 relative flex items-center justify-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Portrait Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-2 text-neutral-600 font-mono text-[10px]">
                  No Photo
                </div>
              )}
            </div>

            {/* Input & Upload Button */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="block text-neutral-400 uppercase mb-1.5 text-[10px]">
                  Photo Image URL
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  placeholder="e.g. https://images.unsplash.com/photo-... or /uploads/..."
                  onChange={e => { markDirty(); setPhotoUrl(e.target.value); }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-xs focus:border-teal-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center space-x-2 rounded">
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload Local Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => { markDirty(); setPhotoUrl(''); }}
                    className="text-neutral-500 hover:text-rose-400 text-xs underline font-mono"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">
                Supports JPG, PNG, WEBP or URL links. This photo appears in the About section with creative lighting &amp; scanlines.
              </p>
            </div>
          </div>
        </div>

        {/* Introduction & Bio */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-6">
          <div>
            <label className="block text-neutral-400 uppercase mb-2">Short Hero Introduction Statement</label>
            <textarea
              value={introduction}
              onChange={e => { markDirty(); setIntroduction(e.target.value); }}
              rows={2}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">01 &bull; Professional History / Background</label>
            <textarea
              value={background}
              onChange={e => { markDirty(); setBackground(e.target.value); }}
              rows={4}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">02 &bull; Digital Scenography & Practice Description</label>
            <textarea
              value={practiceDescription}
              onChange={e => { markDirty(); setPracticeDescription(e.target.value); }}
              rows={4}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm"
            />
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <label className="text-neutral-400 uppercase font-bold">Supporting Technical Capabilities</label>
            <button
              type="button"
              onClick={addCapability}
              className="px-3 py-1.5 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400 text-xs font-mono font-bold uppercase transition-all flex items-center space-x-1.5 rounded"
              id="add-capability-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Capability</span>
            </button>
          </div>

          <div className="space-y-2">
            {capabilities.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-neutral-800 text-neutral-500 font-mono text-xs">
                No capabilities added yet. Click "+ Add Capability" to add one.
              </div>
            ) : (
              capabilities.map((cap, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-neutral-950 px-3 py-2 border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <span className="text-neutral-500 font-bold font-mono text-xs shrink-0">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <input
                    type="text"
                    value={cap}
                    placeholder="e.g. Unreal Engine 5 & Disguise vx4"
                    onChange={e => {
                      const next = [...capabilities];
                      next[idx] = e.target.value;
                      setCapabilities(next);
                    }}
                    className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none font-mono text-xs"
                    autoFocus={cap === ''}
                  />
                  <button
                    type="button"
                    onClick={() => removeCapability(idx)}
                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                    title="Delete Capability"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
