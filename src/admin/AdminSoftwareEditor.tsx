import React, { useState, useEffect, useRef } from 'react';
import { SoftwareTool } from '../types';
import { initialSoftwareTools } from '../data/initial-store';
import {
  fetchSoftwareTools,
  subscribeSoftwareTools,
  saveSoftwareToolsApi,
  resetSoftwareToolsApi,
  uploadMediaApi
} from '../lib/api';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Code2,
  Sparkles,
  Sliders,
  Check,
  X
} from 'lucide-react';

// Default built-in SVGs mapped by default software IDs
export const BUILTIN_SOFTWARE_ICONS: Record<string, React.ReactNode> = {
  'unreal-engine': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="#0A0D14" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
      <path
        d="M16 5.5C10.2 5.5 5.5 10.2 5.5 16C5.5 21.8 10.2 26.5 16 26.5C21.8 26.5 26.5 21.8 26.5 16C26.5 10.2 21.8 5.5 16 5.5ZM16 7.8C20.5 7.8 24.2 11.5 24.2 16C24.2 20.5 20.5 24.2 16 24.2C11.5 24.2 7.8 20.5 7.8 16C7.8 11.5 11.5 7.8 16 7.8Z"
        fill="#FFFFFF"
        fillOpacity="0.15"
      />
      <path
        d="M16 9L12.5 13.5H14.3V18.2C14.3 19.1 15.1 19.8 16 19.8C16.9 19.8 17.7 19.1 17.7 18.2V13.5H19.5L16 9ZM11.3 14.6L9.4 16.8C10.2 19 11.8 20.8 14 21.7L14.8 19.8C13 19 11.7 17.5 11.3 14.6ZM20.7 14.6C20.3 17.5 19 19 17.2 19.8L18 21.7C20.2 20.8 21.8 19 22.6 16.8L20.7 14.6Z"
        fill="#FFFFFF"
      />
    </svg>
  ),
  'after-effects': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#00005B" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#9999FF" strokeWidth="1.5" />
      <text
        x="16"
        y="22"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="15"
        fill="#9999FF"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Ae
      </text>
    </svg>
  ),
  'photoshop': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#001E36" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#31A8FF" strokeWidth="1.5" />
      <text
        x="16"
        y="22"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="15"
        fill="#31A8FF"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Ps
      </text>
    </svg>
  ),
  '3ds-max': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#061824" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#0696D7" strokeWidth="1.5" strokeOpacity="0.6" />
      <g transform="translate(4, 4)">
        <polygon points="2,20 2,4 7,7.5 7,20" fill="#025275" />
        <polygon points="7,7.5 12,14.5 12,18.5 7,11.5" fill="#0696D7" />
        <polygon points="12,14.5 12,18.5 17,11.5 17,7.5" fill="#23BFE6" />
        <polygon points="17,7.5 22,4 22,20 17,20" fill="#7CE6FF" />
        <polygon points="7,20 12,18.5 12,14.5 7,11.5" fill="#0372A3" />
        <polygon points="12,18.5 17,20 17,11.5 12,14.5" fill="#0696D7" />
      </g>
    </svg>
  ),
  'v-ray': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#140205" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#FF1844" strokeWidth="1.5" strokeOpacity="0.7" />
      <g transform="translate(5, 5)">
        <path d="M2.5 3L11 20H13L21.5 3H16.8L12 13.8L7.2 3H2.5Z" fill="#FF1844" />
        <path d="M17.5 11.5L21.5 20H17.8L15 14.5L17.5 11.5Z" fill="#FFFFFF" />
        <circle cx="12" cy="14" r="1.8" fill="#FF1844" />
      </g>
    </svg>
  ),
  'lumion': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="#00A3E0" />
      <g transform="translate(6.5, 6.5)">
        <polygon points="9.5,2 17,6 9.5,10 2,6" fill="#FFFFFF" />
        <polygon points="2,6 9.5,10 9.5,17.5 2,13.5" fill="#B3E9FA" />
        <polygon points="9.5,10 17,6 17,13.5 9.5,17.5" fill="#0077B3" />
        <circle cx="9.5" cy="10" r="1.2" fill="#FFFFFF" />
      </g>
    </svg>
  ),
  'premiere-pro': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#2E002E" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#EA77FF" strokeWidth="1.5" />
      <text
        x="16"
        y="22"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="15"
        fill="#EA77FF"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Pr
      </text>
    </svg>
  ),
  'autocad': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#1C0508" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#E51937" strokeWidth="1.5" strokeOpacity="0.6" />
      <g transform="translate(5, 5)">
        <polygon points="11,2 6,19 8.5,19 10,14 13.5,14 11.5,7" fill="#E51937" />
        <polygon points="11,2 17,19 14.5,19 13.5,14 11.5,7" fill="#FF526C" />
        <polygon points="9.5,14 14,14 13,11 10.5,11" fill="#FFA3AF" />
        <polygon points="6,19 8.5,19 9.5,16 7,16" fill="#A80E24" />
        <polygon points="17,19 14.5,19 13.5,16 16,16" fill="#C9132D" />
      </g>
    </svg>
  ),
  'resolume-arena': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#001F14" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#00FF99" strokeWidth="1.5" />
      <g transform="translate(5.5, 5.5)">
        <path
          d="M4 3H12.5C15.5 3 17.5 4.8 17.5 7.5C17.5 9.8 16 11.4 13.8 11.8L18 19H14.2L10.5 12.5H7.2V19H4V3ZM7.2 9.8H12C13.5 9.8 14.3 9 14.3 7.5C14.3 6 13.5 5.2 12 5.2H7.2V9.8Z"
          fill="#00FF99"
        />
        <circle cx="12" cy="7.5" r="1.5" fill="#FFFFFF" />
        <path d="M18.5 3.5L20 2M20 20L18.5 18.5" stroke="#00FF99" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  ),
  'corel-draw': (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#0B1A05" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.25" stroke="#65C227" strokeWidth="1.5" />
      <g transform="translate(5, 4.5)">
        <path
          d="M11 2C6.6 2 3 5.6 3 10C3 13.8 5.6 16.9 9 17.8L8.7 20H13.3L13 17.8C16.4 16.9 19 13.8 19 10C19 5.6 15.4 2 11 2Z"
          fill="#65C227"
        />
        <path
          d="M11 2C8.8 2 7.2 5.6 7.2 10C7.2 13.6 8.5 16.8 10 17.8L9.7 20H12.3L12 17.8C13.5 16.8 14.8 13.6 14.8 10C14.8 5.6 13.2 2 11 2Z"
          fill="#FFAA00"
        />
        <rect x="9.5" y="21" width="3" height="2" rx="0.5" fill="#65C227" />
      </g>
    </svg>
  )
};

// Color presets for quick styling
const PRESET_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF', bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.3)' },
  { name: 'Adobe Purple', hex: '#9999FF', bg: 'rgba(153, 153, 255, 0.12)', border: 'rgba(153, 153, 255, 0.4)' },
  { name: 'Cyan Blue', hex: '#31A8FF', bg: 'rgba(49, 168, 255, 0.12)', border: 'rgba(49, 168, 255, 0.4)' },
  { name: 'Autodesk Teal', hex: '#0696D7', bg: 'rgba(6, 150, 215, 0.12)', border: 'rgba(6, 150, 215, 0.4)' },
  { name: 'Chaos Red', hex: '#FF1844', bg: 'rgba(255, 24, 68, 0.12)', border: 'rgba(255, 24, 68, 0.4)' },
  { name: 'Lumion Sky', hex: '#00A3E0', bg: 'rgba(0, 163, 224, 0.12)', border: 'rgba(0, 163, 224, 0.4)' },
  { name: 'Adobe Magenta', hex: '#EA77FF', bg: 'rgba(234, 119, 255, 0.12)', border: 'rgba(234, 119, 255, 0.4)' },
  { name: 'AutoCAD Crimson', hex: '#E51937', bg: 'rgba(229, 25, 55, 0.12)', border: 'rgba(229, 25, 55, 0.4)' },
  { name: 'Resolume Neon', hex: '#00FF99', bg: 'rgba(0, 255, 153, 0.12)', border: 'rgba(0, 255, 153, 0.4)' },
  { name: 'Corel Lime', hex: '#65C227', bg: 'rgba(101, 194, 39, 0.12)', border: 'rgba(101, 194, 39, 0.4)' },
  { name: 'Amber Gold', hex: '#FFB800', bg: 'rgba(255, 184, 0, 0.12)', border: 'rgba(255, 184, 0, 0.4)' },
  { name: 'Emerald', hex: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)' }
];

export const AdminSoftwareEditor: React.FC = () => {
  const [tools, setTools] = useState<SoftwareTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingTool, setEditingTool] = useState<SoftwareTool | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formColor, setFormColor] = useState('#FFFFFF');
  const [formAccentBg, setFormAccentBg] = useState('rgba(255, 255, 255, 0.08)');
  const [formBorderColor, setFormBorderColor] = useState('rgba(255, 255, 255, 0.3)');
  const [formCustomIconUrl, setFormCustomIconUrl] = useState('');
  const [formCustomSvgCode, setFormCustomSvgCode] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [uploadProcessing, setUploadProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSoftwareTools((updatedTools) => {
      if (updatedTools && updatedTools.length > 0) {
        setTools(updatedTools);
        setLoading(false);
      }
    });

    // Also trigger authoritative load from backend
    fetchSoftwareTools().then((data) => {
      if (data && data.length > 0) {
        setTools(data);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setIsNew(true);
    setFormName('');
    setFormCategory('');
    setFormColor('#FFFFFF');
    setFormAccentBg('rgba(255, 255, 255, 0.08)');
    setFormBorderColor('rgba(255, 255, 255, 0.3)');
    setFormCustomIconUrl('');
    setFormCustomSvgCode('');
    setFormEnabled(true);
    setEditingTool({
      id: `tool-${Date.now()}`,
      name: '',
      category: '',
      color: '#FFFFFF',
      accentBg: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      sortOrder: tools.length + 1,
      enabled: true
    });
  };

  const handleOpenEdit = (tool: SoftwareTool) => {
    setIsNew(false);
    setEditingTool(tool);
    setFormName(tool.name);
    setFormCategory(tool.category);
    setFormColor(tool.color || '#FFFFFF');
    setFormAccentBg(tool.accentBg || 'rgba(255, 255, 255, 0.08)');
    setFormBorderColor(tool.borderColor || 'rgba(255, 255, 255, 0.3)');
    setFormCustomIconUrl(tool.customIconUrl || '');
    setFormCustomSvgCode(tool.customSvgCode || '');
    setFormEnabled(tool.enabled !== false);
  };

  // Upload logo via backend API or auto-resize via canvas fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProcessing(true);
    setMessage('');

    try {
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

      if (isSvg) {
        // Read SVG XML directly for vector fidelity
        const reader = new FileReader();
        reader.onload = (event) => {
          const svgText = (event.target?.result as string) || '';
          if (svgText.includes('<svg')) {
            setFormCustomSvgCode(svgText);
          }
        };
        reader.readAsText(file);
      }

      // 1. Upload directly through the server /api/media/upload and Firestore media storage
      try {
        const media = await uploadMediaApi(file);
        if (media?.url) {
          setFormCustomIconUrl(media.url);
          setMessage(`Logo uploaded successfully: ${file.name}`);
          setUploadProcessing(false);
          return;
        }
      } catch (uploadErr) {
        console.warn('Backend upload fallback:', uploadErr);
      }

      // 2. Canvas fallback for raster images
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const targetDim = 160;
        let width = img.width;
        let height = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, targetDim, targetDim);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fit contain with centering
          const scale = Math.min(targetDim / width, targetDim / height);
          const drawW = width * scale;
          const drawH = height * scale;
          const offsetX = (targetDim - drawW) / 2;
          const offsetY = (targetDim - drawH) / 2;

          ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
          const dataUrl = canvas.toDataURL('image/png');
          setFormCustomIconUrl(dataUrl);
          setMessage(`Logo processed (${targetDim}x${targetDim}px)`);
        }
        setUploadProcessing(false);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setMessage('Failed to process image file');
        setUploadProcessing(false);
      };
      img.src = objectUrl;
    } catch {
      setMessage('Error reading uploaded logo file');
      setUploadProcessing(false);
    }
  };

  const handleApplyColorPreset = (preset: typeof PRESET_COLORS[0]) => {
    setFormColor(preset.hex);
    setFormAccentBg(preset.bg);
    setFormBorderColor(preset.border);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;

    if (!formName.trim()) {
      alert('Please enter a software title');
      return;
    }

    const updated: SoftwareTool = {
      ...editingTool,
      name: formName.trim(),
      category: formCategory.trim() || 'Digital Media',
      color: formColor,
      accentBg: formAccentBg,
      borderColor: formBorderColor,
      customIconUrl: formCustomIconUrl.trim() || undefined,
      customSvgCode: formCustomSvgCode.trim() || undefined,
      enabled: formEnabled
    };

    let newToolsList: SoftwareTool[] = [];
    if (isNew) {
      newToolsList = [...tools, updated];
    } else {
      newToolsList = tools.map(t => (t.id === updated.id ? updated : t));
    }

    // Instant optimistic update
    setTools(newToolsList);
    setEditingTool(null);
    setSaving(true);
    setMessage(`Saving "${updated.name}"...`);

    try {
      await saveSoftwareToolsApi(newToolsList);
      setMessage(`"${updated.name}" saved and persisted successfully!`);
    } catch {
      setMessage(`"${updated.name}" saved locally.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTool = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the software stack?`)) return;

    const filtered = tools.filter(t => t.id !== id);
    // Instant optimistic UI update
    setTools(filtered);
    setMessage(`Removed "${name}" from software stack.`);

    try {
      await saveSoftwareToolsApi(filtered);
    } catch {
      console.warn('Background sync warning on delete');
    }
  };

  const handleToggleEnable = async (tool: SoftwareTool) => {
    const updated = tools.map(t =>
      t.id === tool.id ? { ...t, enabled: t.enabled === false ? true : false } : t
    );
    // Instant optimistic UI toggle
    setTools(updated);

    try {
      await saveSoftwareToolsApi(updated);
    } catch {
      console.warn('Background sync warning on toggle');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tools.length) return;

    const copy = [...tools];
    const item = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = item;

    // update sortOrder values
    const reordered = copy.map((t, idx) => ({ ...t, sortOrder: idx + 1 }));
    // Instant optimistic reorder
    setTools(reordered);

    try {
      await saveSoftwareToolsApi(reordered);
    } catch {
      console.warn('Background sync warning on reorder');
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset software stack back to the 10 default showcase tools (Unreal Engine, After Effects, Photoshop, 3ds Max, V-Ray, Lumion, Premiere Pro, AutoCAD, Resolume Arena, CorelDRAW)?')) {
      setSaving(true);
      setTools(initialSoftwareTools);
      setMessage('Reset to 10 official software stack tools!');
      try {
        const reset = await resetSoftwareToolsApi();
        setTools(reset);
      } catch {
        console.warn('Reset sync warning');
      } finally {
        setSaving(false);
      }
    }
  };

  // Helper to render icon preview
  const renderIconPreview = (tool: SoftwareTool | { customSvgCode?: string; customIconUrl?: string; id?: string }) => {
    if (tool.customSvgCode) {
      return (
        <div
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: tool.customSvgCode }}
        />
      );
    }
    if (tool.customIconUrl) {
      return (
        <img
          src={tool.customIconUrl}
          alt="Custom software logo"
          className="w-full h-full object-contain"
        />
      );
    }
    if (tool.id && BUILTIN_SOFTWARE_ICONS[tool.id]) {
      return BUILTIN_SOFTWARE_ICONS[tool.id];
    }
    return (
      <div className="w-full h-full rounded-sm bg-neutral-800 flex items-center justify-center text-neutral-400 font-bold text-xs">
        <Sparkles className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl font-mono text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl lg:text-3xl text-neutral-100 flex items-center space-x-3">
            <Sliders className="w-6 h-6 text-teal-400" />
            <span>SOFTWARE TOOLKIT</span>
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Manage the bottom looping marquee software stack with vector SVGs, custom logos & auto-resizing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2.5 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-mono text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Software</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-neutral-900 border border-emerald-500/50 text-emerald-300 flex items-center space-x-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Software List Container */}
      <div className="bg-neutral-900/60 border border-neutral-800 overflow-hidden">
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono text-xs text-neutral-400 uppercase tracking-wider font-semibold">
            <span>ACTIVE PIPELINE ({tools.filter(t => t.enabled !== false).length} / {tools.length})</span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            RTL Loop Animation Speed: 110s (Smooth & Calm)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-500">
            Loading software stack...
          </div>
        ) : tools.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-neutral-400">No software items configured.</p>
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs uppercase font-bold"
            >
              Load Default 10 Softwares
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {tools.map((tool, idx) => {
              const isEnabled = tool.enabled !== false;
              return (
                <div
                  key={tool.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isEnabled ? 'hover:bg-neutral-900/80' : 'opacity-40 bg-neutral-950/40'
                  }`}
                >
                  {/* Left: Reorder, Icon, Title, Category */}
                  <div className="flex items-center space-x-4 min-w-0">
                    {/* Move Up / Down */}
                    <div className="flex flex-col space-y-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === tools.length - 1}
                        className="p-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Logo Preview */}
                    <div
                      className="w-10 h-10 rounded border p-1 shrink-0 flex items-center justify-center bg-neutral-950"
                      style={{ borderColor: tool.borderColor || 'rgba(255,255,255,0.2)' }}
                    >
                      {renderIconPreview(tool)}
                    </div>

                    {/* Name & Category */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-syne font-bold text-sm text-neutral-100 truncate">
                          {tool.name}
                        </span>
                        {tool.customSvgCode && (
                          <span className="px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-800/80 text-teal-300 text-[9px] uppercase tracking-wider font-mono">
                            Custom SVG
                          </span>
                        )}
                        {tool.customIconUrl && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-[9px] uppercase tracking-wider font-mono">
                            Custom Logo
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block truncate mt-0.5">
                        {tool.category}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleEnable(tool)}
                      className={`p-2 border transition-colors ${
                        isEnabled
                          ? 'border-emerald-800 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/60'
                          : 'border-neutral-800 text-neutral-500 bg-neutral-900 hover:text-neutral-300'
                      }`}
                      title={isEnabled ? 'Enabled in ticker' : 'Disabled (Hidden)'}
                    >
                      {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tool)}
                      className="p-2 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Edit Software"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTool(tool.id, tool.name)}
                      className="p-2 border border-red-950/80 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                      title="Delete Software"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Software Modal */}
      {editingTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h2 className="font-syne font-bold text-lg text-neutral-100 uppercase flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-teal-400" />
                <span>{isNew ? 'Add New Software' : `Edit "${editingTool.name}"`}</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingTool(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 uppercase text-[10px] tracking-wider mb-1.5 font-bold">
                    Software Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. TouchDesigner, Notch, Blender"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase text-[10px] tracking-wider mb-1.5 font-bold">
                    Discipline / Category Tag
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="e.g. Real-Time Generative / VFX"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-neutral-100 focus:border-teal-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Logo / SVG Upload & Auto-Resize Section */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-syne font-bold text-xs text-neutral-200 uppercase flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-teal-400" />
                    <span>Logo & Vector Graphic Manager</span>
                  </span>
                  {(formCustomIconUrl || formCustomSvgCode) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormCustomIconUrl('');
                        setFormCustomSvgCode('');
                        setMessage('Cleared custom logo; using default built-in icon if available.');
                      }}
                      className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold"
                    >
                      Clear Custom Logo
                    </button>
                  )}
                </div>

                {/* Upload Action */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadProcessing}
                      className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 uppercase font-bold tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-teal-400" />
                      <span>{uploadProcessing ? 'Processing...' : 'Upload SVG / Image (Auto-Resized)'}</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".svg,.png,.jpg,.jpeg,.webp,.gif"
                      className="hidden"
                    />

                    <span className="text-[10px] text-neutral-500">
                      Supports SVG vectors, PNG, JPG, WebP with auto-scaling
                    </span>
                  </div>

                  {/* Direct SVG Code input (Optional) */}
                  <div className="pt-2">
                    <label className="block text-neutral-400 uppercase text-[10px] tracking-wider mb-1 flex items-center space-x-1.5">
                      <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Or Paste Direct SVG Code / Vector XML:</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formCustomSvgCode}
                      onChange={e => {
                        setFormCustomSvgCode(e.target.value);
                        if (e.target.value) setFormCustomIconUrl('');
                      }}
                      placeholder='<svg viewBox="0 0 24 24" fill="none">...</svg>'
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-200 font-mono text-[11px] focus:border-teal-500 outline-none"
                    />
                  </div>

                  {/* Direct Image URL input (Optional) */}
                  <div>
                    <label className="block text-neutral-400 uppercase text-[10px] tracking-wider mb-1">
                      Or Image URL / Cloudinary CDN Link:
                    </label>
                    <input
                      type="text"
                      value={formCustomIconUrl}
                      onChange={e => {
                        setFormCustomIconUrl(e.target.value);
                        if (e.target.value) setFormCustomSvgCode('');
                      }}
                      placeholder="https://.../logo.png"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                    Ticker Card Live Preview:
                  </span>
                  <div
                    className="flex items-center space-x-3 px-4 py-2.5 rounded-sm border transition-all"
                    style={{
                      borderColor: formBorderColor,
                      backgroundColor: formAccentBg
                    }}
                  >
                    <div className="w-8 h-8 shrink-0">
                      {renderIconPreview({
                        id: editingTool.id,
                        customSvgCode: formCustomSvgCode,
                        customIconUrl: formCustomIconUrl
                      })}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-syne font-bold text-xs text-neutral-100 whitespace-nowrap">
                        {formName || 'Software Title'}
                      </span>
                      <span className="font-mono text-[9px] text-neutral-400 uppercase whitespace-nowrap">
                        {formCategory || 'Category'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Presets & Styling */}
              <div className="space-y-3">
                <label className="block text-neutral-400 uppercase text-[10px] tracking-wider font-bold">
                  Brand Color & Border Presets
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_COLORS.map(p => {
                    const isSelected = formColor === p.hex;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyColorPreset(p)}
                        className={`p-2 rounded border text-left flex items-center space-x-2 transition-all ${
                          isSelected
                            ? 'border-white bg-neutral-800'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="text-[10px] text-neutral-300 truncate">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="tool-enabled-check"
                  checked={formEnabled}
                  onChange={e => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-teal-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="tool-enabled-check" className="text-neutral-300 text-xs font-mono cursor-pointer">
                  Display this software in public bottom ticker
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingTool(null)}
                  className="px-4 py-2 text-neutral-400 hover:text-white uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 font-bold uppercase tracking-wider flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Software Tool'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
