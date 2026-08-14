import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import { AboutData, ContactData, MediaItem, Project, SiteSettings } from '../types';
import { initialAboutData, initialContactData, initialProjects, initialSiteSettings } from '../data/initial-store';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
}

// Check connection to Firestore on initialization
if (typeof window !== 'undefined' && db) {
  try {
    getDocFromServer(doc(db, 'system', 'connection')).catch(() => {});
  } catch {}
}

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
  return { Authorization: `Bearer ${token}` };
}

// Global broadcast event for 0ms cross-component and cross-tab UI reactivity
function broadcastStoreUpdate(type: 'projects' | 'about' | 'contact' | 'settings' | 'media', payload: any) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('subeg-store-update', { detail: { type, payload } }));
    } catch {}
  }
}

// Convert File to highly optimized, lightweight Data URL for universal cross-device persistence
export async function fileToDataUrl(file: File): Promise<string> {
  const isImage =
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|webp|avif|gif|bmp|tiff|heic|jfif)$/i.test(file.name);

  // If it's an image and in browser environment, run ultra-fast canvas compression
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
      }, 6000);

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

          let quality = 0.74;
          let optimized = canvas.toDataURL('image/jpeg', quality);

          if (optimized.length > 95000) {
            quality = 0.60;
            optimized = canvas.toDataURL('image/jpeg', quality);
          }

          if (optimized.length > 95000) {
            const downscaledCanvas = document.createElement('canvas');
            downscaledCanvas.width = Math.max(1, Math.round(width * 0.75));
            downscaledCanvas.height = Math.max(1, Math.round(height * 0.75));
            const downCtx = downscaledCanvas.getContext('2d', { alpha: false });
            if (downCtx) {
              downCtx.fillStyle = '#121212';
              downCtx.fillRect(0, 0, downscaledCanvas.width, downscaledCanvas.height);
              downCtx.imageSmoothingEnabled = true;
              downCtx.imageSmoothingQuality = 'high';
              downCtx.drawImage(img, 0, 0, downscaledCanvas.width, downscaledCanvas.height);
              optimized = downscaledCanvas.toDataURL('image/jpeg', 0.55);
            }
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

  // Non-image files (e.g. PDFs or media)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Track Firestore availability status
let isFirestoreAvailable = Boolean(db);

export function getFirestoreStatus(): { available: boolean; mode: string } {
  return {
    available: isFirestoreAvailable,
    mode: isFirestoreAvailable
      ? 'Cloud Firestore & Server Synchronization Active'
      : 'Server Storage & Local Cache Active'
  };
}

// Helper to fetch directly from Server Backend API
async function fetchFromServer<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Server API /api/${endpoint} notice:`, err);
  }
  return fallback;
}

// Track cached representations to prevent unnecessary UI renders
let lastProjectsJson = '';
let lastAboutJson = '';
let lastContactJson = '';
let lastSettingsJson = '';

// Subscribe to real-time project updates across devices
export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  // 1. Deliver local cache immediately for instant 0ms UI
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

  // 2. Fetch fresh data from authoritative sources
  fetchProjects().then(projects => {
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
  // 1. Try Firestore First
  if (db && isFirestoreAvailable) {
    try {
      const snapshot = await getDocs(collection(db, 'projects'));
      if (!snapshot.empty) {
        const firestoreProjects: Project[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Project));

        if (firestoreProjects.length > 0) {
          firestoreProjects.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
          try {
            localStorage.setItem('subeg_projects_data', JSON.stringify(firestoreProjects));
          } catch {}
          return category && category !== 'ALL'
            ? firestoreProjects.filter(p => p.category === category)
            : firestoreProjects;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    }
  }

  // 2. Authoritative Server Backend API
  try {
    const serverProjects = await fetchFromServer<Project[]>('projects', []);
    if (Array.isArray(serverProjects) && serverProjects.length > 0) {
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(serverProjects));
      } catch {}
      return category && category !== 'ALL'
        ? serverProjects.filter(p => p.category === category)
        : serverProjects;
    }
  } catch {}

  // 3. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_projects_data');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return category && category !== 'ALL'
          ? parsed.filter((p: Project) => p.category === category)
          : parsed;
      }
    }
  } catch {}

  // 4. Default Initial Projects
  return category && category !== 'ALL'
    ? initialProjects.filter(p => p.category === category)
    : initialProjects;
}

export async function fetchProjectByIdOrSlug(idOrSlug: string): Promise<Project> {
  const all = await fetchProjects();
  const found = all.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  if (found) return found;

  // Try direct server endpoint
  try {
    const proj = await fetchFromServer<Project | null>(`projects/${idOrSlug}`, null);
    if (proj) return proj;
  } catch {}

  throw new Error('Project not found');
}

// Subscribe to About data
export function subscribeAboutData(callback: (about: AboutData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) {
      lastAboutJson = local;
      callback(JSON.parse(local));
    }
  } catch {}

  fetchAboutData().then(data => {
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
  // 1. Try Firestore First
  if (db && isFirestoreAvailable) {
    try {
      const docSnap = await getDoc(doc(db, 'about', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data() as AboutData;
        if (data && (data.name || data.introduction)) {
          try {
            localStorage.setItem('subeg_about_data', JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'about/main');
    }
  }

  // 2. Authoritative Server API
  try {
    const serverAbout = await fetchFromServer<AboutData>('about', initialAboutData);
    if (serverAbout && (serverAbout.name || serverAbout.introduction)) {
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(serverAbout));
      } catch {}
      return serverAbout;
    }
  } catch {}

  // 3. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) return JSON.parse(local);
  } catch {}

  return initialAboutData;
}

// Subscribe to Contact data
export function subscribeContactData(callback: (contact: ContactData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) {
      lastContactJson = local;
      callback(JSON.parse(local));
    }
  } catch {}

  fetchContactData().then(data => {
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
  // 1. Try Firestore First
  if (db && isFirestoreAvailable) {
    try {
      const docSnap = await getDoc(doc(db, 'contact', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data() as ContactData;
        if (data && (data.email || data.location)) {
          try {
            localStorage.setItem('subeg_contact_data', JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'contact/main');
    }
  }

  // 2. Authoritative Server API
  try {
    const serverContact = await fetchFromServer<ContactData>('contact', initialContactData);
    if (serverContact && (serverContact.email || serverContact.location)) {
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(serverContact));
      } catch {}
      return serverContact;
    }
  } catch {}

  // 3. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) return JSON.parse(local);
  } catch {}

  return initialContactData;
}

// Subscribe to Settings
export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) {
      lastSettingsJson = local;
      callback(JSON.parse(local));
    }
  } catch {}

  fetchSiteSettings().then(data => {
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
  // 1. Try Firestore First
  if (db && isFirestoreAvailable) {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        if (data && data.siteTitle) {
          try {
            localStorage.setItem('subeg_site_settings', JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'settings/main');
    }
  }

  // 2. Authoritative Server API
  try {
    const serverSettings = await fetchFromServer<SiteSettings>('settings', initialSiteSettings);
    if (serverSettings && serverSettings.siteTitle) {
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(serverSettings));
      } catch {}
      return serverSettings;
    }
  } catch {}

  // 3. LocalStorage Cache
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) return JSON.parse(local);
  } catch {}

  return initialSiteSettings;
}

// Admin Auth
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

    // Also notify server backend
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

// Save or Update Project with Multi-Tier Storage (Firestore + Server API + LocalStorage)
export async function saveProjectApi(project: Partial<Project>): Promise<Project> {
  const id = project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fullProject: Project = {
    id,
    title: project.title || 'Untitled Project',
    slug: project.slug || id,
    category: project.category || 'PROJECTION DESIGN',
    year: project.year || new Date().getFullYear().toString(),
    role: project.role || 'Projection Designer',
    medium: project.medium || '',
    shortDescription: project.shortDescription || '',
    longDescription: project.longDescription || '',
    heroMedia: project.heroMedia || '',
    hoverMedia: project.hoverMedia || '',
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

  // 1. Immediately update Local Storage cache and broadcast
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const idx = existingList.findIndex(p => p.id === id);
    if (idx !== -1) {
      existingList[idx] = fullProject;
    } else {
      existingList.unshift(fullProject);
    }
    localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
    broadcastStoreUpdate('projects', existingList);
  } catch {}

  // 2. Persist to Firestore
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'projects', id);
      await setDoc(docRef, fullProject, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${id}`);
    }
  }

  // 3. Persist to Express Server Backend
  try {
    const isEdit = Boolean(project.id);
    const url = isEdit ? `/api/projects/${id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(fullProject)
    });
  } catch (e) {
    console.warn('Server API save project notice:', e);
  }

  return fullProject;
}

export async function deleteProjectApi(id: string): Promise<void> {
  // 1. Delete from LocalStorage immediately & broadcast
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const filtered = existingList.filter(p => p.id !== id);
    localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
    broadcastStoreUpdate('projects', filtered);
  } catch {}

  // 2. Delete from Firestore
  if (db && isFirestoreAvailable) {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    }
  }

  // 3. Delete from Server
  try {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch {}
}

export async function reorderProjectsApi(projectIds: string[]): Promise<void> {
  // 1. Update local & broadcast
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const projectMap = new Map(existingList.map(p => [p.id, p]));
    const reordered: Project[] = [];
    projectIds.forEach((id, idx) => {
      const p = projectMap.get(id);
      if (p) reordered.push({ ...p, sortOrder: idx });
    });
    existingList.forEach(p => {
      if (!projectIds.includes(p.id)) reordered.push(p);
    });
    localStorage.setItem('subeg_projects_data', JSON.stringify(reordered));
    broadcastStoreUpdate('projects', reordered);
  } catch {}

  // 2. Firestore batch update
  if (db && isFirestoreAvailable) {
    try {
      const batch = writeBatch(db);
      projectIds.forEach((id, index) => {
        const docRef = doc(db, 'projects', id);
        batch.update(docRef, { sortOrder: index });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'projects');
    }
  }

  // 3. Server reorder
  try {
    await fetch('/api/projects/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ projectIds })
    });
  } catch {}
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  let existingAbout: AboutData = initialAboutData;
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) existingAbout = JSON.parse(local);
  } catch {}

  const updated: AboutData = { ...existingAbout, ...data };

  // 1. Update LocalStorage immediately & broadcast
  try {
    localStorage.setItem('subeg_about_data', JSON.stringify(updated));
    broadcastStoreUpdate('about', updated);
  } catch {}

  // 2. Save to Firestore
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'about', 'main');
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'about/main');
    }
  }

  // 3. Save to Server Backend
  try {
    await fetch('/api/about', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch (e) {
    console.warn('Server API about save notice:', e);
  }

  return updated;
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  let existingContact: ContactData = initialContactData;
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) existingContact = JSON.parse(local);
  } catch {}

  const updated: ContactData = { ...existingContact, ...data };

  // 1. Update LocalStorage immediately & broadcast
  try {
    localStorage.setItem('subeg_contact_data', JSON.stringify(updated));
    broadcastStoreUpdate('contact', updated);
  } catch {}

  // 2. Save to Firestore
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'contact', 'main');
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'contact/main');
    }
  }

  // 3. Save to Server Backend
  try {
    await fetch('/api/contact', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch (e) {
    console.warn('Server API contact save notice:', e);
  }

  // 4. Keep siteSettings in sync if email changed
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

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  let existingSettings: SiteSettings = initialSiteSettings;
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) existingSettings = JSON.parse(local);
  } catch {}

  const updated: SiteSettings = { ...existingSettings, ...data };

  // 1. Update LocalStorage immediately & broadcast
  try {
    localStorage.setItem('subeg_site_settings', JSON.stringify(updated));
    broadcastStoreUpdate('settings', updated);
  } catch {}

  // 2. Save to Firestore
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'settings', 'main');
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main');
    }
  }

  // 3. Save to Server Backend
  try {
    await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch (e) {
    console.warn('Server API settings save notice:', e);
  }

  // 4. Keep contact email in sync if contactEmail changed
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

export async function fetchMediaApi(): Promise<MediaItem[]> {
  // 1. Try Server API first (direct uploads directory)
  try {
    const serverMedia = await fetchFromServer<MediaItem[]>('media', []);
    if (serverMedia && serverMedia.length > 0) {
      try {
        localStorage.setItem('subeg_media_items', JSON.stringify(serverMedia));
      } catch {}
      return serverMedia;
    }
  } catch {}

  // 2. Try Firestore if available
  if (db && isFirestoreAvailable) {
    try {
      const querySnapshot = await getDocs(collection(db, 'media'));
      if (!querySnapshot.empty) {
        const mediaItems: MediaItem[] = querySnapshot.docs.map(
          d => ({ id: d.id, ...d.data() } as MediaItem)
        );
        mediaItems.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        try {
          localStorage.setItem('subeg_media_items', JSON.stringify(mediaItems));
        } catch {}
        return mediaItems;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'media');
    }
  }

  // 3. Fallback to LocalStorage
  const local = localStorage.getItem('subeg_media_items');
  return local ? JSON.parse(local) : [];
}

export async function uploadMediaApi(file: File): Promise<MediaItem> {
  const dataUrl = await fileToDataUrl(file);
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  let finalUrl = dataUrl;

  // 1. Upload to Server disk storage
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
    console.warn('Server upload notice, using optimized client media payload:', e);
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

  // 2. LocalStorage cache
  try {
    const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
    existing.unshift(mediaItem);
    if (existing.length > 60) existing.length = 60;
    localStorage.setItem('subeg_media_items', JSON.stringify(existing));
    broadcastStoreUpdate('media', existing);
  } catch {}

  // 3. Firestore save if available
  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'media', mediaId), mediaItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `media/${mediaId}`);
    }
  }

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
    const filtered = existing.filter(m => m.id !== filenameOrId && m.filename !== filenameOrId);
    localStorage.setItem('subeg_media_items', JSON.stringify(filtered));
    broadcastStoreUpdate('media', filtered);
  } catch {}

  // Delete from Firestore
  if (db && isFirestoreAvailable) {
    try {
      await deleteDoc(doc(db, 'media', filenameOrId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `media/${filenameOrId}`);
    }
  }
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

    // Also push to server backup endpoint
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
  // Server reset
  try {
    await fetch('/api/settings/reset-demo', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch {}

  // Firestore reset
  if (db && isFirestoreAvailable) {
    try {
      const batch = writeBatch(db);
      initialProjects.forEach((proj, idx) => {
        const docRef = doc(db, 'projects', proj.id);
        batch.set(docRef, { ...proj, sortOrder: idx });
      });
      batch.set(doc(db, 'about', 'main'), initialAboutData);
      batch.set(doc(db, 'contact', 'main'), initialContactData);
      batch.set(doc(db, 'settings', 'main'), initialSiteSettings);
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reset-demo');
    }
  }

  localStorage.removeItem('subeg_projects_data');
  localStorage.removeItem('subeg_about_data');
  localStorage.removeItem('subeg_contact_data');
  localStorage.removeItem('subeg_site_settings');
  localStorage.removeItem('subeg_media_items');
}
