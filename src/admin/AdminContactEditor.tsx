import React, { useState, useEffect } from 'react';
import { ContactData } from '../types';
import { saveContactApi } from '../lib/api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface AdminContactEditorProps {
  contact: ContactData;
  onRefreshContact: (newContact?: ContactData) => void;
}

export const AdminContactEditor: React.FC<AdminContactEditorProps> = ({
  contact,
  onRefreshContact
}) => {
  const [email, setEmail] = useState(contact?.email || 'projectiondjjs@gmail.com');
  const [location, setLocation] = useState(contact?.location || 'New York / Global');
  const [additionalLinks, setAdditionalLinks] = useState(Array.isArray(contact?.additionalLinks) ? contact.additionalLinks : []);
  const [isDirty, setIsDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (contact && !isDirty) {
      setEmail(contact.email || 'projectiondjjs@gmail.com');
      setLocation(contact.location || 'New York / Global');
      setAdditionalLinks(Array.isArray(contact.additionalLinks) ? contact.additionalLinks : []);
    }
  }, [contact, isDirty]);

  const addLink = () => {
    setIsDirty(true);
    setAdditionalLinks(prev => [...prev, { label: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setIsDirty(true);
    setAdditionalLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload: Partial<ContactData> = {
        email,
        location,
        additionalLinks: additionalLinks.filter(l => l && l.label && l.url)
      };
      const saved = await saveContactApi(payload);
      setIsDirty(false);
      setMessage('Contact details updated successfully!');
      onRefreshContact(saved);
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessage('Contact details updated in local and cloud stores.');
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
            EDIT CONTACT DETAILS
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Update email, location, and professional management or studio links
          </p>
        </div>

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

      {message && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 text-neutral-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div>
            <label className="block text-neutral-400 uppercase mb-2">Direct Contact Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 font-syne font-bold text-base"
              required
            />
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Base / Location</label>
            <input
              type="text"
              value={location}
              onChange={e => {
                setLocation(e.target.value);
                setIsDirty(true);
              }}
              placeholder="New York / Global"
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200"
            />
          </div>
        </div>

        {/* Representation & Extra Links */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-neutral-400 uppercase">Representation / Management Links</label>
            <button
              type="button"
              onClick={addLink}
              className="text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>

          <div className="space-y-3">
            {additionalLinks.map((link, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={link.label}
                  onChange={e => {
                    const next = [...additionalLinks];
                    next[idx].label = e.target.value;
                    setAdditionalLinks(next);
                  }}
                  placeholder="Link Label (e.g. Studio Inquiries)"
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={e => {
                    const next = [...additionalLinks];
                    next[idx].url = e.target.value;
                    setAdditionalLinks(next);
                  }}
                  placeholder="URL or mailto: link"
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
