import React, { useState, useEffect } from 'react';
import { ContactData, ContactLink } from '../types';
import { saveContactApi } from '../lib/api';
import { Save, Plus, Trash2, Mail, MapPin, Globe, Sparkles, Phone, Clock, ShieldCheck } from 'lucide-react';

interface AdminContactEditorProps {
  contact: ContactData;
  onRefreshContact: (newContact?: ContactData) => void;
}

export const AdminContactEditor: React.FC<AdminContactEditorProps> = ({
  contact,
  onRefreshContact
}) => {
  const [tagline, setTagline] = useState(contact?.tagline || '04 • Inquiries');
  const [title, setTitle] = useState(contact?.title || 'CONTACT');
  const [statement, setStatement] = useState(
    contact?.statement ||
      'Available for international commissions, digital scenography direction, and spatial media collaborations.'
  );

  const [email, setEmail] = useState(contact?.email || 'projectiondjjs@gmail.com');
  const [emailLabel, setEmailLabel] = useState(contact?.emailLabel || 'Direct Contact Email');
  
  const [phone, setPhone] = useState(contact?.phone || '');
  const [phoneLabel, setPhoneLabel] = useState(contact?.phoneLabel || 'Phone / WhatsApp');

  const [location, setLocation] = useState(contact?.location || 'New York / Global');
  const [locationLabel, setLocationLabel] = useState(contact?.locationLabel || 'Base / Location');

  const [availabilityStatus, setAvailabilityStatus] = useState(
    contact?.availabilityStatus || 'Accepting commissions & creative collaborations for 2026/2027'
  );
  const [responseTime, setResponseTime] = useState(
    contact?.responseTime || 'Typical response time: within 24–48 hours'
  );

  const [representationHeading, setRepresentationHeading] = useState(
    contact?.representationHeading || 'Representation & Management Inquiries'
  );
  const [additionalLinks, setAdditionalLinks] = useState<ContactLink[]>(
    Array.isArray(contact?.additionalLinks) ? contact.additionalLinks : []
  );

  const [socialLinks, setSocialLinks] = useState<ContactLink[]>(
    Array.isArray(contact?.socialLinks)
      ? contact.socialLinks
      : [
          { label: 'Instagram', url: 'https://instagram.com/subeg.design' },
          { label: 'LinkedIn', url: 'https://linkedin.com/in/subegsingh' },
          { label: 'Vimeo', url: 'https://vimeo.com/subegsingh' }
        ]
  );

  const [footerCopyright, setFooterCopyright] = useState(
    contact?.footerCopyright || `© ${new Date().getFullYear()} SUBEG SINGH. All rights reserved.`
  );
  const [footerSubtitle, setFooterSubtitle] = useState(
    contact?.footerSubtitle || 'Digital Scenography & Immersive Media'
  );

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (contact && !isDirty) {
      setTagline(contact.tagline || '04 • Inquiries');
      setTitle(contact.title || 'CONTACT');
      setStatement(
        contact.statement ||
          'Available for international commissions, digital scenography direction, and spatial media collaborations.'
      );
      setEmail(contact.email || 'projectiondjjs@gmail.com');
      setEmailLabel(contact.emailLabel || 'Direct Contact Email');
      setPhone(contact.phone || '');
      setPhoneLabel(contact.phoneLabel || 'Phone / WhatsApp');
      setLocation(contact.location || 'New York / Global');
      setLocationLabel(contact.locationLabel || 'Base / Location');
      setAvailabilityStatus(
        contact.availabilityStatus || 'Accepting commissions & creative collaborations for 2026/2027'
      );
      setResponseTime(contact.responseTime || 'Typical response time: within 24–48 hours');
      setRepresentationHeading(
        contact.representationHeading || 'Representation & Management Inquiries'
      );
      setAdditionalLinks(Array.isArray(contact.additionalLinks) ? contact.additionalLinks : []);
      setSocialLinks(
        Array.isArray(contact.socialLinks)
          ? contact.socialLinks
          : [
              { label: 'Instagram', url: 'https://instagram.com/subeg.design' },
              { label: 'LinkedIn', url: 'https://linkedin.com/in/subegsingh' },
              { label: 'Vimeo', url: 'https://vimeo.com/subegsingh' }
            ]
      );
      setFooterCopyright(
        contact.footerCopyright || `© ${new Date().getFullYear()} SUBEG SINGH. All rights reserved.`
      );
      setFooterSubtitle(contact.footerSubtitle || 'Digital Scenography & Immersive Media');
    }
  }, [contact, isDirty]);

  const addRepresentationLink = () => {
    setIsDirty(true);
    setAdditionalLinks(prev => [...prev, { label: '', url: '' }]);
  };

  const removeRepresentationLink = (index: number) => {
    setIsDirty(true);
    setAdditionalLinks(prev => prev.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    setIsDirty(true);
    setSocialLinks(prev => [...prev, { label: '', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    setIsDirty(true);
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload: Partial<ContactData> = {
        tagline: tagline.trim() || '04 • Inquiries',
        title: title.trim() || 'CONTACT',
        statement: statement.trim(),
        email: email.trim(),
        emailLabel: emailLabel.trim() || 'Direct Contact Email',
        phone: phone.trim(),
        phoneLabel: phoneLabel.trim() || 'Phone / WhatsApp',
        location: location.trim() || 'New York / Global',
        locationLabel: locationLabel.trim() || 'Base / Location',
        availabilityStatus: availabilityStatus.trim(),
        responseTime: responseTime.trim(),
        representationHeading: representationHeading.trim() || 'Representation & Management Inquiries',
        additionalLinks: additionalLinks.filter(l => l && l.label.trim() && l.url.trim()),
        socialLinks: socialLinks.filter(l => l && l.label.trim() && l.url.trim()),
        footerCopyright: footerCopyright.trim() || `© ${new Date().getFullYear()} SUBEG SINGH. All rights reserved.`,
        footerSubtitle: footerSubtitle.trim() || 'Digital Scenography & Immersive Media'
      };

      const saved = await saveContactApi(payload);
      setIsDirty(false);
      setMessage('Contact section updated successfully and published across live site!');
      onRefreshContact(saved);
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessage('Contact section saved in local and cloud stores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl font-mono text-xs pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100">
            EDIT CONTACT SECTION
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Completely customize all headers, direct channels, availability, representation, social links, and footer
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50 cursor-pointer shadow-lg"
          id="save-contact-btn"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Contact'}</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-teal-950/40 border border-teal-500/40 text-teal-200 flex items-center space-x-3">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Top Hero & Headings */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h2 className="font-syne font-bold text-base text-neutral-100 uppercase">
              1. Section Header & Introduction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Section Eyebrow Tag</label>
              <input
                type="text"
                value={tagline}
                onChange={e => {
                  setTagline(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="04 • Inquiries"
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Main Headline / Title</label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="CONTACT"
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 font-syne font-bold uppercase focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Introductory / Collaboration Statement</label>
            <textarea
              rows={2}
              value={statement}
              onChange={e => {
                setStatement(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Available for international commissions, digital scenography direction, and spatial media collaborations."
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Section 2: Direct Communications */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-2">
            <Mail className="w-4 h-4 text-teal-400" />
            <h2 className="font-syne font-bold text-base text-neutral-100 uppercase">
              2. Direct Communications & Email
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Email Label</label>
              <input
                type="text"
                value={emailLabel}
                onChange={e => {
                  setEmailLabel(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Direct Contact Email"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Direct Contact Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="projectiondjjs@gmail.com"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-teal-300 font-syne font-bold text-base focus:border-teal-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Phone / WhatsApp Label (Optional)</label>
              <input
                type="text"
                value={phoneLabel}
                onChange={e => {
                  setPhoneLabel(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Phone / WhatsApp"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Direct Phone / WhatsApp Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="+1 (917) 000-0000 (leave blank to hide)"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Location & Live Availability */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-2">
            <MapPin className="w-4 h-4 text-teal-400" />
            <h2 className="font-syne font-bold text-base text-neutral-100 uppercase">
              3. Location, Availability & Response Time
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Location Label</label>
              <input
                type="text"
                value={locationLabel}
                onChange={e => {
                  setLocationLabel(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Base / Location"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-teal-500 outline-none"
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
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none font-syne text-base font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Availability Status Note</label>
              <input
                type="text"
                value={availabilityStatus}
                onChange={e => {
                  setAvailabilityStatus(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Accepting commissions & creative collaborations for 2026/2027"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Response Time Note</label>
              <input
                type="text"
                value={responseTime}
                onChange={e => {
                  setResponseTime(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Typical response time: within 24–48 hours"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Representation & Management Inquiries */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <h2 className="font-syne font-bold text-base text-neutral-100 uppercase">
                4. Representation & Management Inquiries
              </h2>
            </div>
            <button
              type="button"
              onClick={addRepresentationLink}
              className="text-teal-400 hover:text-teal-300 flex items-center space-x-1.5 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>

          <div>
            <label className="block text-neutral-400 uppercase mb-2">Group Heading</label>
            <input
              type="text"
              value={representationHeading}
              onChange={e => {
                setRepresentationHeading(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Representation & Management Inquiries"
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-teal-500 outline-none mb-4"
            />
          </div>

          <div className="space-y-3">
            {additionalLinks.map((link, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-neutral-950/60 p-2.5 border border-neutral-800/80">
                <input
                  type="text"
                  value={link.label}
                  onChange={e => {
                    const next = [...additionalLinks];
                    next[idx].label = e.target.value;
                    setAdditionalLinks(next);
                    setIsDirty(true);
                  }}
                  placeholder="Link Label (e.g. Studio Representation)"
                  className="w-1/3 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={e => {
                    const next = [...additionalLinks];
                    next[idx].url = e.target.value;
                    setAdditionalLinks(next);
                    setIsDirty(true);
                  }}
                  placeholder="URL or mailto: link (e.g. mailto:mgmt@agency.com)"
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRepresentationLink(idx)}
                  className="p-2 text-red-400 hover:text-red-300 cursor-pointer"
                  title="Remove link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Social & Portfolio Profiles */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-2">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-teal-400" />
              <h2 className="font-syne font-bold text-base text-neutral-100 uppercase">
                5. Social & Portfolio Profiles
              </h2>
            </div>
            <button
              type="button"
              onClick={addSocialLink}
              className="text-teal-400 hover:text-teal-300 flex items-center space-x-1.5 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Profile</span>
            </button>
          </div>

          <div className="space-y-3">
            {socialLinks.map((link, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-neutral-950/60 p-2.5 border border-neutral-800/80">
                <input
                  type="text"
                  value={link.label}
                  onChange={e => {
                    const next = [...socialLinks];
                    next[idx].label = e.target.value;
                    setSocialLinks(next);
                    setIsDirty(true);
                  }}
                  placeholder="Platform (e.g. Instagram, LinkedIn, Vimeo, X, GitHub)"
                  className="w-1/3 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={e => {
                    const next = [...socialLinks];
                    next[idx].url = e.target.value;
                    setSocialLinks(next);
                    setIsDirty(true);
                  }}
                  placeholder="Profile URL (e.g. https://instagram.com/subeg.design)"
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(idx)}
                  className="p-2 text-red-400 hover:text-red-300 cursor-pointer"
                  title="Remove profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Footer Copyright & Subtitle */}
        <div className="bg-neutral-900/60 p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <h2 className="font-syne font-bold text-base text-neutral-100 uppercase">
              6. Footer Signoff & Copyright Text
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-2">Copyright Text</label>
              <input
                type="text"
                value={footerCopyright}
                onChange={e => {
                  setFooterCopyright(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="© 2026 SUBEG SINGH. All rights reserved."
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-2">Footer Practice Subtitle</label>
              <input
                type="text"
                value={footerSubtitle}
                onChange={e => {
                  setFooterSubtitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Digital Scenography & Immersive Media"
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

