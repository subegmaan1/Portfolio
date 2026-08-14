import React, { useState } from 'react';
import { AboutData } from '../types';
import { saveAboutApi, uploadCvApi } from '../lib/api';
import { FileText, Upload, Trash2, ExternalLink, FileCheck } from 'lucide-react';

interface AdminCVManagerProps {
  about: AboutData;
  onRefreshAbout: (newAbout?: AboutData) => void;
}

export const AdminCVManager: React.FC<AdminCVManagerProps> = ({ about, onRefreshAbout }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file for Curriculum Vitae');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const res = await uploadCvApi(file);
      const updated = await saveAboutApi({ cvUrl: res.cvUrl });
      setMessage('CV uploaded successfully! Automatically attached to public About page.');
      onRefreshAbout(updated);
    } catch {
      setMessage('Failed to upload CV PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCv = async () => {
    if (confirm('Remove current CV link from public About page?')) {
      try {
        const updated = await saveAboutApi({ cvUrl: '' });
        setMessage('CV link removed.');
        onRefreshAbout(updated);
      } catch {
        setMessage('Failed to remove CV link.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl font-mono text-xs">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
          CURRICULUM VITAE (CV) MANAGER
        </h1>
        <p className="font-mono text-xs text-neutral-400 mt-1">
          Upload or replace Subeg Singh's professional PDF CV shown on the public About page
        </p>
      </div>

      {message && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 text-neutral-200">
          {message}
        </div>
      )}

      {/* Current Active CV Status */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 space-y-4">
        <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Active CV Document Status</span>
        </h2>

        {about.cvUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-950 border border-neutral-800 gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-amber-400" />
              <div>
                <span className="font-syne font-bold text-neutral-200 text-sm block">
                  SUBEG SINGH — Curriculum Vitae (PDF)
                </span>
                <span className="text-[10px] text-neutral-500">{about.cvUrl}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={about.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 flex items-center space-x-1"
              >
                <span>View / Download</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleDeleteCv}
                className="p-2 bg-red-950/50 text-red-400 hover:text-red-300 rounded"
                title="Delete CV Link"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-neutral-950 border border-dashed border-neutral-800 text-neutral-500 text-center">
            No active CV uploaded. Use the button below to upload a PDF file.
          </div>
        )}
      </div>

      {/* Upload Box */}
      <div className="bg-neutral-900/60 p-8 border border-neutral-800 text-center space-y-4">
        <FileText className="w-12 h-12 text-neutral-600 mx-auto" />
        <div>
          <span className="font-syne font-bold text-base text-neutral-200 block">
            Upload / Replace CV (PDF)
          </span>
          <span className="text-neutral-500 block text-[11px] mt-1">
            Supported format: PDF only (max 50MB)
          </span>
        </div>

        <label className="inline-flex items-center space-x-2 px-6 py-3 bg-neutral-100 text-neutral-950 font-bold uppercase hover:bg-white transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading PDF...' : 'Select PDF File'}</span>
          <input
            type="file"
            onChange={handleCvUpload}
            accept="application/pdf"
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
