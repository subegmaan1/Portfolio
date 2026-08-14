import { AboutData, ContactData, MediaItem, Project, SiteSettings } from '../types';
import { initialAboutData, initialContactData, initialProjects, initialSiteSettings } from '../data/initial-store';

const ADMIN_TOKEN_KEY = 'subeg_admin_token';
const DEFAULT_ADMIN_TOKEN = 'subeg-admin-authenticated-token-2026';

export function setAdminToken(token: string) {
  if (token) {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {}
  } else {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {}
  }
}

export function getAdminToken(): string {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || DEFAULT_ADMIN_TOKEN;
  } catch {
    return DEFAULT_ADMIN_TOKEN;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAdminToken() || DEFAULT_ADMIN_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
    'X-Admin-Token': token
  };
}

// Global broadcast event for 0ms cross-component UI updates
function broadcastStoreUpdate(type: 'projects' | 'about' | 'contact' | 'settings' | 'media', payload: any) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('subeg-store-update', { detail: { type, payload } }));
    } catch {}
  }
}

// Helper to convert File to optimized Data URL
export async function fileToDataUrl(file: File): Promise<string> {
  const isImage =
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|webp|avif|gif|bmp|tiff|heic|jfif)$/i.test(file.name);

  if (isImage && typeof window !== 'undefined') {
    return new Promise((resolve) => {
      let objectUrl: string | null = null;
      let timeoutId: any = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
        }
      };

      try {
        objectUrl = URL.createObjectURL(file);
      } catch {
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => resolve(fallbackReader.result as string);
        fallbackReader.onerror = () => resolve('');
        fallbackReader.readAsDataURL(file);
        return;
      }

      const img = new Image();

      timeoutId = setTimeout(() => {
        cleanup();
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      }, 5000);

      img.onload = () => {
        cleanup();
        try {
          let { width, height } = img;
          if (!width || !height) {
            resolve(objectUrl || '');
            return;
          }

          const maxDim = 1280;
          const maxTotalPixels = 1280 * 800;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          if (width * height > maxTotalPixels) {
            const scale = Math.sqrt(maxTotalPixels / (width * height));
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            resolve(objectUrl || '');
            return;
          }

          ctx.fillStyle = '#121212';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.75;
          let optimized = canvas.toDataURL('image/jpeg', quality);

          if (optimized.length > 95000) {
            quality = 0.60;
            optimized = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(optimized);
        } catch {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        }
      };

      img.onerror = () => {
        cleanup();
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Fetch helper directly from Express Server Datastore
async function fetchFromServer<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Notice reading /api/${endpoint}:`, err);
  }
  return fallback;
}

// Cache trackers for snappy UI
let lastProjectsJson = '';
let lastAboutJson = '';
let lastContactJson = '';
let lastSettingsJson = '';

// ==================== PROJECTS ====================

export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  // 1. Instant local cache delivery
  try {
    const local = localStorage.getItem('subeg_projects_data');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        lastProjectsJson = local;
        callback(parsed);
      }
    }
  } catch {}

  // 2. Fetch authoritative fresh data from server
  fetchProjects().then((projects) => {
    const jsonStr = JSON.stringify(projects);
    if (jsonStr !== lastProjectsJson) {
      lastProjectsJson = jsonStr;
      callback(projects);
    }
  });

  // 3. React instantly to local broadcasts
  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'projects' && Array.isArray(custom.detail?.payload)) {
      const jsonStr = JSON.stringify(custom.detail.payload);
      if (jsonStr !== lastProjectsJson) {
        lastProjectsJson = jsonStr;
        callback(custom.detail.payload);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
  };
}

export async function fetchProjects(category?: string): Promise<Project[]> {
  // 1. Authoritative Server Datastore
  let serverProjects: Project[] | null = null;
  try {
    const res = await fetch('/api/projects', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const fetched = await res.json();
      if (Array.isArray(fetched)) {
        serverProjects = fetched;
        try {
          localStorage.setItem('subeg_projects_data', JSON.stringify(serverProjects));
        } catch {}
      }
    }
  } catch {}

  if (serverProjects !== null && Array.isArray(serverProjects)) {
    return category && category !== 'ALL'
      ? serverProjects.filter((p) => p.category === category)
      : serverProjects;
  }

  // 2. LocalStorage Cache fallback
  try {
    const local = localStorage.getItem('subeg_projects_data');
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return category && category !== 'ALL'
          ? parsed.filter((p: Project) => p.category === category)
          : parsed;
      }
    }
  } catch {}

  // 3. Default Seed Projects
  return category && category !== 'ALL'
    ? initialProjects.filter((p) => p.category === category)
    : initialProjects;
}

export async function fetchProjectByIdOrSlug(idOrSlug: string): Promise<Project> {
  const all = await fetchProjects();
  const found = all.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (found) return found;

  try {
    const proj = await fetchFromServer<Project | null>(`projects/${idOrSlug}`, null);
    if (proj) return proj;
  } catch {}

  throw new Error('Project not found');
}

export async function saveProjectApi(project: Partial<Project>): Promise<Project> {
  const id = project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fullProject: Project = {
    id,
    title: project.title || 'Untitled Project',
    slug: project.slug || (project.title ? project.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : id),
    category: project.category || 'PROJECTION DESIGN',
    year: project.year || new Date().getFullYear().toString(),
    role: project.role || 'Projection Designer',
    medium: project.medium || '',
    shortDescription: project.shortDescription || '',
    longDescription: project.longDescription || '',
    heroMedia: project.heroMedia || '',
    hoverMedia: project.hoverMedia || project.heroMedia || '',
    videoStreamUrl: project.videoStreamUrl || '',
    enableStreaming: Boolean(project.enableStreaming),
    gallery: project.gallery || [],
    videos: project.videos || [],
    tools: project.tools || [],
    credits: project.credits || [],
    featured: Boolean(project.featured),
    published: project.published ?? true,
    sortOrder: project.sortOrder ?? 0,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately update LocalStorage cache & dispatch broadcast (0ms instant UI update)
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const idx = existingList.findIndex((p) => p.id === id);
    if (idx !== -1) {
      existingList[idx] = fullProject;
    } else {
      existingList.unshift(fullProject);
    }
    localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
    broadcastStoreUpdate('projects', existingList);
  } catch {}

  // 2. Persist directly to Express Server Backend JSON Store
  try {
    const isEdit = Boolean(project.id);
    const url = isEdit ? `/api/projects/${id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(fullProject)
    });
    if (res.ok) {
      const savedFromServer = await res.json();
      return savedFromServer;
    }
  } catch (e) {
    console.warn('Notice saving project to server backend:', e);
  }

  return fullProject;
}

export async function deleteProjectApi(id: string): Promise<void> {
  // 1. Delete from LocalStorage & broadcast immediately
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const filtered = existingList.filter((p) => p.id !== id);
    localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
    broadcastStoreUpdate('projects', filtered);
  } catch {}

  // 2. Delete from Server
  try {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch (e) {
    console.warn('Notice deleting project on server backend:', e);
  }
}

export async function reorderProjectsApi(projectIds: string[]): Promise<void> {
  // 1. Update local & broadcast immediately
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const projectMap = new Map(existingList.map((p) => [p.id, p]));
    const reordered: Project[] = [];
    projectIds.forEach((id, idx) => {
      const p = projectMap.get(id);
      if (p) reordered.push({ ...p, sortOrder: idx });
    });
    existingList.forEach((p) => {
      if (!projectIds.includes(p.id)) reordered.push(p);
    });
    localStorage.setItem('subeg_projects_data', JSON.stringify(reordered));
    broadcastStoreUpdate('projects', reordered);
  } catch {}

  // 2. Server reorder
  try {
    await fetch('/api/projects/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ projectIds })
    });
  } catch (e) {
    console.warn('Notice reordering on server:', e);
  }
}

// ==================== ABOUT ====================

export function subscribeAboutData(callback: (about: AboutData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) {
      lastAboutJson = local;
      callback(JSON.parse(local));
    }
  } catch {}

  fetchAboutData().then((data) => {
    const jsonStr = JSON.stringify(data);
    if (jsonStr !== lastAboutJson) {
      lastAboutJson = jsonStr;
      callback(data);
    }
  });

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'about' && custom.detail?.payload) {
      const jsonStr = JSON.stringify(custom.detail.payload);
      if (jsonStr !== lastAboutJson) {
        lastAboutJson = jsonStr;
        callback(custom.detail.payload);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
  };
}

export async function fetchAboutData(): Promise<AboutData> {
  // 1. Try Server API first
  try {
    const serverAbout = await fetchFromServer<AboutData>('about', initialAboutData);
    if (serverAbout && (serverAbout.name || serverAbout.introduction)) {
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(serverAbout));
      } catch {}
      return serverAbout;
    }
  } catch {}

  // 2. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) return JSON.parse(local);
  } catch {}

  return initialAboutData;
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  let existingAbout: AboutData = initialAboutData;
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) existingAbout = JSON.parse(local);
  } catch {}

  const updated: AboutData = { ...existingAbout, ...data };

  // 1. Update LocalStorage immediately & broadcast (0ms instant reactivity)
  try {
    localStorage.setItem('subeg_about_data', JSON.stringify(updated));
    broadcastStoreUpdate('about', updated);
  } catch {}

  // 2. Save directly to Server Backend Datastore
  try {
    const res = await fetch('/api/about', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const serverResult = await res.json();
      return serverResult;
    }
  } catch (e) {
    console.warn('Notice saving about to server backend:', e);
  }

  return updated;
}

// ==================== CONTACT ====================

export function subscribeContactData(callback: (contact: ContactData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) {
      lastContactJson = local;
      callback(JSON.parse(local));
    }
  } catch {}

  fetchContactData().then((data) => {
    const jsonStr = JSON.stringify(data);
    if (jsonStr !== lastContactJson) {
      lastContactJson = jsonStr;
      callback(data);
    }
  });

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'contact' && custom.detail?.payload) {
      const jsonStr = JSON.stringify(custom.detail.payload);
      if (jsonStr !== lastContactJson) {
        lastContactJson = jsonStr;
        callback(custom.detail.payload);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
  };
}

export async function fetchContactData(): Promise<ContactData> {
  // 1. Try Server API first
  try {
    const serverContact = await fetchFromServer<ContactData>('contact', initialContactData);
    if (serverContact && (serverContact.email || serverContact.location)) {
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(serverContact));
      } catch {}
      return serverContact;
    }
  } catch {}

  // 2. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) return JSON.parse(local);
  } catch {}

  return initialContactData;
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  let existingContact: ContactData = initialContactData;
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) existingContact = JSON.parse(local);
  } catch {}

  const updated: ContactData = { ...existingContact, ...data };

  // 1. Update LocalStorage immediately & broadcast (0ms instant reactivity)
  try {
    localStorage.setItem('subeg_contact_data', JSON.stringify(updated));
    broadcastStoreUpdate('contact', updated);
  } catch {}

  // 2. Save to Server Backend
  try {
    const res = await fetch('/api/contact', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const savedResult = await res.json();
      return savedResult;
    }
  } catch (e) {
    console.warn('Notice saving contact to server backend:', e);
  }

  // 3. Sync siteSettings contactEmail if needed
  if (data.email) {
    try {
      const localStg = localStorage.getItem('subeg_site_settings');
      if (localStg) {
        const parsed = JSON.parse(localStg);
        parsed.contactEmail = data.email;
        localStorage.setItem('subeg_site_settings', JSON.stringify(parsed));
        broadcastStoreUpdate('settings', parsed);
      }
    } catch {}
  }

  return updated;
}

// ==================== SETTINGS ====================

export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) {
      lastSettingsJson = local;
      callback(JSON.parse(local));
    }
  } catch {}

  fetchSiteSettings().then((data) => {
    const jsonStr = JSON.stringify(data);
    if (jsonStr !== lastSettingsJson) {
      lastSettingsJson = jsonStr;
      callback(data);
    }
  });

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'settings' && custom.detail?.payload) {
      const jsonStr = JSON.stringify(custom.detail.payload);
      if (jsonStr !== lastSettingsJson) {
        lastSettingsJson = jsonStr;
        callback(custom.detail.payload);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
  };
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  // 1. Try Server API first
  try {
    const serverSettings = await fetchFromServer<SiteSettings>('settings', initialSiteSettings);
    if (serverSettings && serverSettings.siteTitle) {
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(serverSettings));
      } catch {}
      return serverSettings;
    }
  } catch {}

  // 2. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) return JSON.parse(local);
  } catch {}

  return initialSiteSettings;
}

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  let existingSettings: SiteSettings = initialSiteSettings;
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) existingSettings = JSON.parse(local);
  } catch {}

  const updated: SiteSettings = { ...existingSettings, ...data };

  // 1. Update LocalStorage immediately & broadcast (0ms instant reactivity)
  try {
    localStorage.setItem('subeg_site_settings', JSON.stringify(updated));
    broadcastStoreUpdate('settings', updated);
  } catch {}

  // 2. Save to Server Backend
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const savedRes = await res.json();
      return savedRes;
    }
  } catch (e) {
    console.warn('Notice saving settings to server backend:', e);
  }

  // 3. Keep contact email in sync if contactEmail changed
  if (data.contactEmail) {
    try {
      const localCnt = localStorage.getItem('subeg_contact_data');
      if (localCnt) {
        const parsed = JSON.parse(localCnt);
        parsed.email = data.contactEmail;
        localStorage.setItem('subeg_contact_data', JSON.stringify(parsed));
        broadcastStoreUpdate('contact', parsed);
      }
    } catch {}
  }

  return updated;
}

// ==================== MEDIA ====================

export async function fetchMediaApi(): Promise<MediaItem[]> {
  // 1. Try Server API first
  try {
    const serverMedia = await fetchFromServer<MediaItem[]>('media', []);
    if (serverMedia && serverMedia.length > 0) {
      try {
        localStorage.setItem('subeg_media_items', JSON.stringify(serverMedia));
      } catch {}
      return serverMedia;
    }
  } catch {}

  // 2. Fallback to LocalStorage
  const local = localStorage.getItem('subeg_media_items');
  return local ? JSON.parse(local) : [];
}

export async function uploadMediaApi(file: File): Promise<MediaItem> {
  const dataUrl = await fileToDataUrl(file);
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let finalUrl = dataUrl;

  // 1. Upload to Server (which automatically uploads to Cloudinary or disk)
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData
    });
    if (res.ok) {
      const serverItem = await res.json();
      if (serverItem?.url) {
        finalUrl = serverItem.url;
      }
    }
  } catch (e) {
    console.warn('Notice on server media upload:', e);
  }

  const mediaItem: MediaItem = {
    id: mediaId,
    filename: file.name,
    originalName: file.name,
    url: finalUrl,
    mimeType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    uploadedAt: new Date().toISOString(),
    size: file.size
  };

  // 2. LocalStorage cache & broadcast
  try {
    const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
    existing.unshift(mediaItem);
    if (existing.length > 60) existing.length = 60;
    localStorage.setItem('subeg_media_items', JSON.stringify(existing));
    broadcastStoreUpdate('media', existing);
  } catch {}

  return mediaItem;
}

export async function deleteMediaApi(filenameOrId: string): Promise<void> {
  // Delete from Server
  try {
    await fetch(`/api/media/${filenameOrId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch {}

  // Delete from LocalStorage
  try {
    const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
    const filtered = existing.filter((m) => m.id !== filenameOrId && m.filename !== filenameOrId);
    localStorage.setItem('subeg_media_items', JSON.stringify(filtered));
    broadcastStoreUpdate('media', filtered);
  } catch {}
}

export async function uploadCvApi(file: File): Promise<{ cvUrl: string }> {
  try {
    let cvUrl = '';
    try {
      const formData = new FormData();
      formData.append('cvFile', file);
      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        cvUrl = data.cvUrl;
      }
    } catch {}

    if (!cvUrl) {
      cvUrl = await fileToDataUrl(file);
    }

    await saveAboutApi({ cvUrl });
    return { cvUrl };
  } catch {
    throw new Error('Failed to upload CV file');
  }
}

// ==================== AUTH ====================

export async function checkAdminAuth(): Promise<boolean> {
  const token = getAdminToken();
  if (token && token.length > 0) return true;
  try {
    const res = await fetch('/api/admin/me', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.authenticated);
    }
  } catch {}
  return false;
}

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (password === 'subeg2026') {
    const token = DEFAULT_ADMIN_TOKEN;
    setAdminToken(token);

    try {
      await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
    } catch {}

    return { success: true, token };
  } else {
    return { success: false, error: 'Invalid password' };
  }
}

export async function adminLogout(): Promise<void> {
  setAdminToken('');
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch {}
}

// ==================== BACKUP & RESTORE ====================

export async function exportFullBackup(): Promise<string> {
  const [projects, about, contact, settings, media] = await Promise.all([
    fetchProjects(),
    fetchAboutData(),
    fetchContactData(),
    fetchSiteSettings(),
    fetchMediaApi()
  ]);

  const backupData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    store: {
      about,
      contact,
      settings,
      projects,
      media
    }
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importFullBackup(jsonContent: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonContent);
    const store = parsed.store || parsed;

    if (store.projects && Array.isArray(store.projects)) {
      for (const p of store.projects) {
        await saveProjectApi(p);
      }
    }
    if (store.about) {
      await saveAboutApi(store.about);
    }
    if (store.contact) {
      await saveContactApi(store.contact);
    }
    if (store.settings) {
      await saveSettingsApi(store.settings);
    }

    try {
      await fetch('/api/backup/restore', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(store)
      });
    } catch {}

    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

export async function resetDemoDataApi(): Promise<void> {
  try {
    await fetch('/api/settings/reset-demo', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch {}

  localStorage.removeItem('subeg_projects_data');
  localStorage.removeItem('subeg_about_data');
  localStorage.removeItem('subeg_contact_data');
  localStorage.removeItem('subeg_site_settings');
  localStorage.removeItem('subeg_media_items');
}
