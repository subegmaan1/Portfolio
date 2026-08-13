import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types';
import { deleteMediaApi, fetchMediaApi, uploadMediaApi } from '../lib/api';
import { BatchPhotoProjectModal } from './BatchPhotoProjectModal';
import { Upload, Trash2, Copy, Check, File, Image, Film, Layers } from 'lucide-react';

export const AdminMediaLibrary: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'OTHER'>('ALL');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await fetchMediaApi();
      setMediaList(data);
    } catch {
      console.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadMediaApi(files[i]);
      }
      await loadMedia();
    } catch {
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (confirm(`Delete media file "${filename}"?`)) {
      try {
        await deleteMediaApi(filename);
        await loadMedia();
      } catch {
        alert('Failed to delete media file');
      }
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = mediaList.filter(item => {
    if (filter === 'IMAGE') return item.mimeType.startsWith('image/');
    if (filter === 'VIDEO') return item.mimeType.startsWith('video/');
    if (filter === 'OTHER') return !item.mimeType.startsWith('image/') && !item.mimeType.startsWith('video/');
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            MEDIA LIBRARY
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Upload, manage & reference visual assets for case studies
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-100 font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 hover:border-neutral-500 transition-colors flex items-center space-x-2"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Batch Photos to Projects</span>
          </button>

          <label className="px-5 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept="image/*,video/*,application/pdf"
            />
          </label>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 font-mono text-xs border-b border-neutral-800 pb-3">
        {(['ALL', 'IMAGE', 'VIDEO', 'OTHER'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded transition-colors uppercase ${
              filter === type
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 font-mono text-xs text-neutral-500">Loading media library...</div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 p-12 text-center space-y-3">
          <p className="font-mono text-xs text-neutral-400 uppercase">
            No media files uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map(item => {
            const isImage = item.mimeType.startsWith('image/');
            const isVideo = item.mimeType.startsWith('video/');

            return (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 overflow-hidden group flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={item.url}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : isVideo ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-4 text-center">
                      <File className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                      <span className="font-mono text-[10px] text-neutral-400 block truncate max-w-[120px]">
                        {item.originalName}
                      </span>
                    </div>
                  )}

                  {/* Copy URL Hover Button */}
                  <div className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleCopyUrl(item.url, item.id)}
                      className="p-2 bg-neutral-100 text-neutral-950 rounded font-mono text-xs flex items-center space-x-1"
                      title="Copy URL Reference"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between font-mono text-[11px]">
                  <div className="truncate pr-2">
                    <span className="text-neutral-200 block truncate">{item.originalName}</span>
                    <span className="text-[9px] text-neutral-500 uppercase">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.filename)}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Delete Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Photo Project Modal */}
      <BatchPhotoProjectModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={() => {
          loadMedia();
        }}
      />
    </div>
  );
};
