import React, { useState, useEffect, useRef } from 'react';
import { SiteSettings } from '../types';
import { exportFullBackup, importFullBackup, resetDemoDataApi, saveSettingsApi, getFirestoreStatus } from '../lib/api';
import { Save, RefreshCw, Key, ShieldCheck, Download, Upload, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = getFirestoreStatus();

  // Sync state if settings prop updates
  useEffect(() => {
    if (settings) {
      setSiteTitle(settings.siteTitle || '');
      setSiteDescription(settings.siteDescription || '');
      setContactEmail(settings.contactEmail || '');
    }
  }, [settings]);

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
      setMessage('Site settings updated and synced!');
      onRefreshSettings();
    } catch {
      setMessage('Failed to update site settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    setExporting(true);
    setMessage('');
    try {
      const json = await exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subeg-singh-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Database backup downloaded successfully!');
    } catch (e) {
      alert('Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage('');
    try {
      const text = await file.text();
      const ok = await importFullBackup(text);
      if (ok) {
        setMessage('Database backup successfully imported & synced!');
        onRefreshAllData();
      } else {
        alert('Failed to parse backup JSON file.');
      }
    } catch (err) {
      alert('Error importing backup file.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            Global site configuration, multi-tier database status & backup management
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
        <div className="p-4 bg-neutral-900 border border-emerald-600/50 text-emerald-300 flex items-center space-x-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Storage & Sync Status Card */}
      <div className="bg-neutral-900/80 p-6 border border-neutral-800 space-y-4">
        <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Data Storage & Multi-Device Sync Engine</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-1.5">
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider">Cloud Server Storage</div>
            <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>Online & Synced (JSON + Disk Media)</span>
            </div>
            <p className="text-neutral-500 text-[11px]">Primary persistent storage running on high-speed server container.</p>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-1.5">
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider">Cloud Firestore Engine</div>
            <div className="text-neutral-200 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
              <span>{status.mode}</span>
            </div>
            <p className="text-neutral-500 text-[11px]">Protected by auto-failover to avoid Firebase daily read quota freezes.</p>
          </div>
        </div>
      </div>

      {/* Backup & Restore Tools */}
      <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
        <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Portfolio Backup & Restore (JSON)</span>
        </h2>
        <p className="text-neutral-400 font-light leading-relaxed">
          Download a complete backup snapshot of all your projects, bio copy, contact information, and media library to your computer, or restore a previous snapshot at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={exporting}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 uppercase font-bold tracking-wider flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{exporting ? 'Generating...' : 'Download Full Backup (.json)'}</span>
          </button>

          <label className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 uppercase font-bold tracking-wider flex items-center space-x-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>{importing ? 'Restoring...' : 'Restore from Backup File'}</span>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Site Metadata Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase">
            Site Metadata & Header
          </h2>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Site Title</label>
            <input
              type="text"
              value={siteTitle}
              onChange={e => setSiteTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-neutral-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Site SEO Description</label>
            <textarea
              value={siteDescription}
              onChange={e => setSiteDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-neutral-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Contact / Inquiries Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-neutral-500 outline-none"
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
          Admin authentication is validated via encrypted session cookies against the server environment credentials (<code className="bg-neutral-800 px-1.5 py-0.5 text-amber-300">ADMIN_PASSWORD</code>). Default password: <code className="bg-neutral-800 px-1.5 py-0.5 text-amber-300">subeg2026</code>.
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

