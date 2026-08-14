import React, { useState, useEffect } from 'react';
import { ContactData } from '../types';
import { saveContactApi } from '../lib/api';
import { Save, Plus, Trash2, Mail, MapPin, ArrowUpRight, CheckCircle2, Eye, Globe } from 'lucide-react';

interface AdminContactEditorProps {
  contact: ContactData;
  onRefreshContact: () => void;
}

export const AdminContactEditor: React.FC<AdminContactEditorProps> = ({
  contact,
  onRefreshContact
}) => {
  const [email, setEmail] = useState(contact.email || '');
  const [location, setLocation] = useState(contact.location || '');
  const [additionalLinks, setAdditionalLinks] = useState<{ label: string; url: string }[]>(
    contact.additionalLinks || []
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isDirtyRef = React.useRef(false);

  // Sync state only if contact prop updates AND user has not made unsaved changes
  useEffect(() => {
    if (contact && !isDirtyRef.current) {
      setEmail(contact.email || '');
      setLocation(contact.location || '');
      setAdditionalLinks(contact.additionalLinks || []);
    }
  }, [contact]);

  const markDirty = () => {
    isDirtyRef.current = true;
  };

  const addLink = () => {
    markDirty();
    setAdditionalLinks(prev => [...prev, { label: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    markDirty();
    setAdditionalLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const validLinks = additionalLinks.filter(l => l.label.trim() && l.url.trim());
      await saveContactApi({
        email: email.trim(),
        location: location.trim(),
        additionalLinks: validLinks
      });
      isDirtyRef.current = false;
      setMessage('Contact details saved successfully!');
      onRefreshContact();
    } catch (err) {
      console.error('Failed to update contact:', err);
      setMessage('Failed to update contact details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            EDIT CONTACT DETAILS
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Update direct email, studio base location, and representation / agency links
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="#/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-mono text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Page</span>
          </a>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50"
            id="save-contact-btn"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Contact'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-neutral-900 border border-emerald-500/50 text-emerald-300 flex items-center space-x-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
            <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
              <Mail className="w-4 h-4 text-teal-400" />
              <span>Primary Direct Contact</span>
            </h2>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">
                Direct Contact Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { markDirty(); setEmail(e.target.value); }}
                placeholder="subegsingh@example.com"
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 font-syne font-bold text-base focus:border-teal-400 outline-none"
                required
              />
              <p className="text-[11px] text-neutral-500 mt-1.5">
                Displayed prominently in the hero section of the public Contact page and linked as mailto:
              </p>
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">
                Base Location / Working Territory
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={e => { markDirty(); setLocation(e.target.value); }}
                  placeholder="New York / Global Commissions"
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-teal-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Representation & Agency Links */}
          <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-syne font-bold text-sm text-neutral-200 uppercase flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Representation & Inquiries Links</span>
                </h2>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                  Add links for management, studio inquiries, press, or social profiles
                </p>
              </div>

              <button
                type="button"
                onClick={addLink}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-[11px] uppercase tracking-wider flex items-center space-x-1 border border-neutral-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>

            {additionalLinks.length === 0 ? (
              <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 text-neutral-500 text-center py-6">
                No extra representation links added yet. Click &quot;Add Link&quot; above to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {additionalLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-neutral-950/80 p-3 border border-neutral-800">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={e => {
                          const next = [...additionalLinks];
                          next[idx].label = e.target.value;
                          setAdditionalLinks(next);
                        }}
                        placeholder="Link Label (e.g. Studio Inquiries, Management)"
                        className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-teal-400 outline-none"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={e => {
                          const next = [...additionalLinks];
                          next[idx].url = e.target.value;
                          setAdditionalLinks(next);
                        }}
                        placeholder="https://example.com or mailto:agency@example.com"
                        className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs focus:border-teal-400 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors self-center"
                      title="Remove link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Right Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900/40 p-5 border border-neutral-800 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="font-mono text-[11px] text-teal-400 uppercase tracking-wider font-semibold">
                Live Public Contact Preview
              </span>
              <span className="text-[10px] text-neutral-500 uppercase">Real-Time</span>
            </div>

            {/* Preview Box */}
            <div className="bg-neutral-950 p-5 border border-neutral-800/80 space-y-6">
              <div>
                <span className="font-mono text-[9px] tracking-[0.25em] text-teal-400/80 uppercase font-semibold block mb-1">
                  04 &bull; Inquiries
                </span>
                <div className="font-syne font-extrabold text-xl text-neutral-100 uppercase">
                  CONTACT
                </div>
              </div>

              {/* Email Callout Preview */}
              <div className="py-4 border-y border-white/10 space-y-1">
                <span className="font-mono text-[9px] text-teal-400/80 uppercase tracking-widest block">
                  Direct Contact Email
                </span>
                <div className="font-syne font-bold text-base text-neutral-100 break-all flex items-center justify-between">
                  <span>{email || 'your-email@domain.com'}</span>
                  <ArrowUpRight className="w-4 h-4 text-teal-400 shrink-0 ml-2" />
                </div>
              </div>

              {/* Location Preview */}
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-teal-400/80 uppercase tracking-widest flex items-center space-x-1.5">
                  <MapPin className="w-3 h-3 text-teal-400" />
                  <span>Base / Location</span>
                </span>
                <div className="font-syne text-sm text-neutral-300">
                  {location || 'Location Not Specified'}
                </div>
              </div>

              {/* Links Preview */}
              {additionalLinks.filter(l => l.label).length > 0 && (
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <span className="font-mono text-[9px] text-teal-400/80 uppercase tracking-widest block">
                    Representation & Management
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {additionalLinks.filter(l => l.label).map((link, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-[10px] text-neutral-300 flex items-center space-x-1.5"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-teal-400" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
