import React, { useState } from 'react';
import { SiteSettings } from '../types';
import { resetDemoDataApi, saveSettingsApi } from '../lib/api';
import { Save, RefreshCw, Key, ShieldCheck } from 'lucide-react';

interface AdminSettingsProps {
  settings: SiteSettings;
  onRefreshSettings: () => void;
  onRefreshAllData: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onRefreshSettings,
  onRefreshAllData
}) => {
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle || '');
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription || '');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || '');

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await saveSettingsApi({
        siteTitle,
        siteDescription,
        contactEmail
      });
      setMessage('Site settings updated!');
      onRefreshSettings();
    } catch {
      setMessage('Failed to update site settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Reset store data to default Subeg Singh showcase projects and about content?')) {
      setResetting(true);
      try {
        await resetDemoDataApi();
        setMessage('Database reset to initial Subeg Singh store!');
        onRefreshAllData();
      } catch {
        alert('Failed to reset store');
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            SYSTEM SETTINGS
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Global site configuration, credentials documentation & database reset
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50"
          id="save-settings-btn"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 text-neutral-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase">
            Site Metadata
          </h2>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Site Title</label>
            <input
              type="text"
              value={siteTitle}
              onChange={e => setSiteTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Site SEO Description</label>
            <textarea
              value={siteDescription}
              onChange={e => setSiteDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100"
            />
          </div>
        </div>
      </form>

      {/* Admin Password Instructions */}
      <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-3">
        <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span>Admin Access Security</span>
        </h2>
        <p className="text-neutral-300 leading-relaxed font-light">
          Admin authentication is securely validated via encrypted session cookies against the server environment credentials (<code className="bg-neutral-800 px-1.5 py-0.5 text-amber-300">ADMIN_PASSWORD</code>).
        </p>
        <p className="text-neutral-400 font-light text-[11px]">
          To update your administrator password, modify the secret environment variable in your project configuration.
        </p>
      </div>

      {/* Database Reset */}
      <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
        <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 text-red-400" />
          <span>Reset Showcase Database</span>
        </h2>
        <p className="text-neutral-400 font-light">
          Restore initial Subeg Singh projects, about copy, and settings.
        </p>
        <button
          type="button"
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-5 py-2.5 bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 hover:text-red-100 uppercase font-bold transition-colors"
        >
          {resetting ? 'Resetting Store...' : 'Reset Store to Default Showcase'}
        </button>
      </div>
    </div>
  );
};
