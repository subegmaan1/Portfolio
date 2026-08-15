import { AboutData, ContactData, MediaItem, Project, SiteSettings, SoftwareTool } from '../types';
import { initialAboutData, initialContactData, initialProjects, initialSiteSettings, initialSoftwareTools } from '../data/initial-store';
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

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
function broadcastStoreUpdate(type: 'projects' | 'about' | 'contact' | 'settings' | 'media' | 'software', payload: any) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('subeg-store-update', { detail: { type, payload } }));
    } catch {}
  }
}

// Sanitize helper to remove undefined values before Firestore writes
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof data === 'object') {
    const result: any = {};
    for (const key of Object.keys(data as any)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        result[key] = sanitizeForFirestore(val);
      }
    }
    return result;
  }
  return data;
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
    // Expected on static hosting where /api is not available
  }
  return fallback;
}

// Local cache helper to get current local projects with fallback to initial
function getCachedProjects(): Project[] {
  try {
    const local = localStorage.getItem('subeg_projects_data');
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return initialProjects;
}

// Seeding check for Firestore
let isSeeding = false;
async function seedFirestoreIfNeeded() {
  if (isSeeding) return;
  try {
    const metaDoc = await getDoc(doc(db, 'metadata', 'store_init'));
    if (!metaDoc.exists()) {
      isSeeding = true;
      // Seed Projects
      for (const p of initialProjects) {
        await setDoc(doc(db, 'projects', p.id), sanitizeForFirestore(p));
      }
      // Seed Content
      await setDoc(doc(db, 'content', 'about'), sanitizeForFirestore(initialAboutData));
      await setDoc(doc(db, 'content', 'contact'), sanitizeForFirestore(initialContactData));
      await setDoc(doc(db, 'content', 'settings'), sanitizeForFirestore(initialSiteSettings));
      // Mark initialized
      await setDoc(doc(db, 'metadata', 'store_init'), {
        initialized: true,
        seededAt: new Date().toISOString()
      });
      isSeeding = false;
    }
  } catch (e) {
    isSeeding = false;
  }
}

// ==================== PROJECTS ====================

export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  // 1. Instant local cache delivery
  const cached = getCachedProjects();
  callback(cached);

  // 2. React to local custom broadcast events (0ms cross-component reactivity)
  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'projects' && Array.isArray(custom.detail?.payload)) {
      callback(custom.detail.payload);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  // 3. Real-time Firestore Cloud Subscription
  let unsubFirestore = () => {};
  try {
    const projectsCol = collection(db, 'projects');
    unsubFirestore = onSnapshot(projectsCol, (snapshot) => {
      if (snapshot.empty) {
        // Check if database was initialized before falling back to initialProjects
        getDoc(doc(db, 'metadata', 'store_init')).then((metaSnap) => {
          if (!metaSnap.exists()) {
            seedFirestoreIfNeeded().then(() => {
              callback(initialProjects);
            });
          } else {
            // User genuinely has 0 projects in Firestore
            try {
              localStorage.setItem('subeg_projects_data', JSON.stringify([]));
            } catch {}
            callback([]);
          }
        }).catch(() => {});
      } else {
        const firestoreProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          firestoreProjects.push(docSnap.data() as Project);
        });
        firestoreProjects.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        try {
          localStorage.setItem('subeg_projects_data', JSON.stringify(firestoreProjects));
        } catch {}
        callback(firestoreProjects);
      }
    }, (error) => {
      console.warn('Firestore subscription fallback:', error.message);
    });
  } catch {}

  // 4. Server API fetch fallback (if backend is active)
  fetchFromServer<Project[] | null>('projects', null).then((serverProjects) => {
    if (Array.isArray(serverProjects) && serverProjects.length > 0) {
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(serverProjects));
      } catch {}
      callback(serverProjects);
    }
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
    unsubFirestore();
  };
}

export async function fetchProjects(category?: string): Promise<Project[]> {
  // 1. Try Firestore first
  try {
    const projectsCol = collection(db, 'projects');
    const snapshot = await getDocs(projectsCol);
    if (!snapshot.empty) {
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Project);
      });
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(list));
      } catch {}
      return category && category !== 'ALL'
        ? list.filter((p) => p.category === category)
        : list;
    } else {
      // Check if DB was initialized
      const meta = await getDoc(doc(db, 'metadata', 'store_init'));
      if (meta.exists()) {
        // 0 projects is authoritative
        return [];
      }
      // Seed if not initialized
      await seedFirestoreIfNeeded();
    }
  } catch (err) {
    // Firestore error, fall through to server/localStorage
  }

  // 2. Server API fallback
  try {
    const serverProjects = await fetchFromServer<Project[] | null>('projects', null);
    if (Array.isArray(serverProjects)) {
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(serverProjects));
      } catch {}
      return category && category !== 'ALL'
        ? serverProjects.filter((p) => p.category === category)
        : serverProjects;
    }
  } catch {}

  // 3. LocalStorage fallback
  const cached = getCachedProjects();
  return category && category !== 'ALL'
    ? cached.filter((p) => p.category === category)
    : cached;
}

export async function fetchProjectByIdOrSlug(idOrSlug: string): Promise<Project> {
  const all = await fetchProjects();
  const found = all.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (found) return found;

  try {
    const projSnap = await getDoc(doc(db, 'projects', idOrSlug));
    if (projSnap.exists()) {
      return projSnap.data() as Project;
    }
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
    const existingList = [...getCachedProjects()];
    const idx = existingList.findIndex((p) => p.id === id);
    if (idx !== -1) {
      existingList[idx] = fullProject;
    } else {
      existingList.unshift(fullProject);
    }
    localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
    broadcastStoreUpdate('projects', existingList);
  } catch {}

  // 2. Persist to Firestore Cloud Database
  try {
    await setDoc(doc(db, 'projects', id), sanitizeForFirestore(fullProject));
    await setDoc(doc(db, 'metadata', 'store_init'), { initialized: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore write warning:', e);
  }

  // 3. Persist to Express Server Backend if running
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
  } catch {}

  return fullProject;
}

export async function deleteProjectApi(id: string): Promise<void> {
  // 1. Delete from LocalStorage & broadcast immediately (0ms instant UI removal)
  try {
    const existingList = getCachedProjects();
    const filtered = existingList.filter((p) => p.id !== id);
    localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
    broadcastStoreUpdate('projects', filtered);
  } catch {}

  // 2. Delete from Firestore Cloud Database
  try {
    await deleteDoc(doc(db, 'projects', id));
    await setDoc(doc(db, 'metadata', 'store_init'), { initialized: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore delete warning:', e);
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
  // 1. Update local cache & broadcast immediately
  try {
    const existingList = getCachedProjects();
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

    // 2. Sync updated sort orders to Firestore
    for (let idx = 0; idx < projectIds.length; idx++) {
      const id = projectIds[idx];
      setDoc(doc(db, 'projects', id), { sortOrder: idx }, { merge: true }).catch(() => {});
    }
  } catch {}

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

// ==================== ABOUT ====================

export function subscribeAboutData(callback: (about: AboutData) => void): () => void {
  // 1. Instant local delivery
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) {
      callback({ ...initialAboutData, ...JSON.parse(local) });
    } else {
      callback(initialAboutData);
    }
  } catch {
    callback(initialAboutData);
  }

  // 2. Broadcast listener
  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'about' && custom.detail?.payload) {
      callback({ ...initialAboutData, ...custom.detail.payload });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  // 3. Firestore Cloud listener
  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(doc(db, 'content', 'about'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AboutData;
        const merged = { ...initialAboutData, ...data };
        try {
          localStorage.setItem('subeg_about_data', JSON.stringify(merged));
        } catch {}
        callback(merged);
      }
    });
  } catch {}

  // 4. Server fetch
  fetchFromServer<AboutData | null>('about', null).then((serverAbout) => {
    if (serverAbout && (serverAbout.name || serverAbout.introduction)) {
      const merged = { ...initialAboutData, ...serverAbout };
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(merged));
      } catch {}
      callback(merged);
    }
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
    unsubFirestore();
  };
}

export async function fetchAboutData(): Promise<AboutData> {
  // 1. Try Firestore
  try {
    const docSnap = await getDoc(doc(db, 'content', 'about'));
    if (docSnap.exists()) {
      const data = docSnap.data() as AboutData;
      const merged = { ...initialAboutData, ...data };
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {}

  // 2. Try Server API
  try {
    const serverAbout = await fetchFromServer<AboutData | null>('about', null);
    if (serverAbout && (serverAbout.name || serverAbout.introduction)) {
      const merged = { ...initialAboutData, ...serverAbout };
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {}

  // 3. LocalStorage fallback
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) return { ...initialAboutData, ...JSON.parse(local) };
  } catch {}

  return initialAboutData;
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  let existingAbout: AboutData = initialAboutData;
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) existingAbout = { ...initialAboutData, ...JSON.parse(local) };
  } catch {}

  const updated: AboutData = { ...existingAbout, ...data };

  // 1. Local cache & broadcast immediately (0ms instant reactivity)
  try {
    localStorage.setItem('subeg_about_data', JSON.stringify(updated));
    broadcastStoreUpdate('about', updated);
  } catch {}

  // 2. Save to Firestore Cloud Database
  try {
    await setDoc(doc(db, 'content', 'about'), sanitizeForFirestore(updated), { merge: true });
    await setDoc(doc(db, 'metadata', 'store_init'), { initialized: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore about save warning:', e);
  }

  // 3. Save to Server Backend
  try {
    await fetch('/api/about', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch {}

  return updated;
}

// ==================== CONTACT ====================

export function subscribeContactData(callback: (contact: ContactData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) {
      callback({ ...initialContactData, ...JSON.parse(local) });
    } else {
      callback(initialContactData);
    }
  } catch {
    callback(initialContactData);
  }

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'contact' && custom.detail?.payload) {
      callback({ ...initialContactData, ...custom.detail.payload });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(doc(db, 'content', 'contact'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ContactData;
        const merged = { ...initialContactData, ...data };
        try {
          localStorage.setItem('subeg_contact_data', JSON.stringify(merged));
        } catch {}
        callback(merged);
      }
    });
  } catch {}

  fetchFromServer<ContactData | null>('contact', null).then((serverContact) => {
    if (serverContact && (serverContact.email || serverContact.location)) {
      const merged = { ...initialContactData, ...serverContact };
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(merged));
      } catch {}
      callback(merged);
    }
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
    unsubFirestore();
  };
}

export async function fetchContactData(): Promise<ContactData> {
  try {
    const docSnap = await getDoc(doc(db, 'content', 'contact'));
    if (docSnap.exists()) {
      const data = docSnap.data() as ContactData;
      const merged = { ...initialContactData, ...data };
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {}

  try {
    const serverContact = await fetchFromServer<ContactData | null>('contact', null);
    if (serverContact && (serverContact.email || serverContact.location)) {
      const merged = { ...initialContactData, ...serverContact };
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {}

  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) return { ...initialContactData, ...JSON.parse(local) };
  } catch {}

  return initialContactData;
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  let existingContact: ContactData = initialContactData;
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) existingContact = { ...initialContactData, ...JSON.parse(local) };
  } catch {}

  const updated: ContactData = { ...existingContact, ...data };

  // 1. Local cache & broadcast immediately
  try {
    localStorage.setItem('subeg_contact_data', JSON.stringify(updated));
    broadcastStoreUpdate('contact', updated);
  } catch {}

  // 2. Firestore Cloud Database
  try {
    await setDoc(doc(db, 'content', 'contact'), sanitizeForFirestore(updated), { merge: true });
    await setDoc(doc(db, 'metadata', 'store_init'), { initialized: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore contact save warning:', e);
  }

  // 3. Server Backend
  try {
    await fetch('/api/contact', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch {}

  return updated;
}

// ==================== SETTINGS ====================

export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) {
      callback({ ...initialSiteSettings, ...JSON.parse(local) });
    } else {
      callback(initialSiteSettings);
    }
  } catch {
    callback(initialSiteSettings);
  }

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'settings' && custom.detail?.payload) {
      callback({ ...initialSiteSettings, ...custom.detail.payload });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  let unsubFirestore = () => {};
  try {
    unsubFirestore = onSnapshot(doc(db, 'content', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        const merged = { ...initialSiteSettings, ...data };
        try {
          localStorage.setItem('subeg_site_settings', JSON.stringify(merged));
        } catch {}
        callback(merged);
      }
    });
  } catch {}

  fetchFromServer<SiteSettings | null>('settings', null).then((serverSettings) => {
    if (serverSettings && serverSettings.siteTitle) {
      const merged = { ...initialSiteSettings, ...serverSettings };
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(merged));
      } catch {}
      callback(merged);
    }
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
    unsubFirestore();
  };
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const docSnap = await getDoc(doc(db, 'content', 'settings'));
    if (docSnap.exists()) {
      const data = docSnap.data() as SiteSettings;
      const merged = { ...initialSiteSettings, ...data };
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {}

  try {
    const serverSettings = await fetchFromServer<SiteSettings | null>('settings', null);
    if (serverSettings && serverSettings.siteTitle) {
      const merged = { ...initialSiteSettings, ...serverSettings };
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {}

  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) return { ...initialSiteSettings, ...JSON.parse(local) };
  } catch {}

  return initialSiteSettings;
}

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  let existingSettings: SiteSettings = initialSiteSettings;
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) existingSettings = { ...initialSiteSettings, ...JSON.parse(local) };
  } catch {}

  const updated: SiteSettings = { ...existingSettings, ...data };

  // 1. Local cache & broadcast immediately
  try {
    localStorage.setItem('subeg_site_settings', JSON.stringify(updated));
    broadcastStoreUpdate('settings', updated);
  } catch {}

  // 2. Firestore Cloud Database
  try {
    await setDoc(doc(db, 'content', 'settings'), sanitizeForFirestore(updated), { merge: true });
    await setDoc(doc(db, 'metadata', 'store_init'), { initialized: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore settings save warning:', e);
  }

  // 3. Server Backend
  try {
    await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch {}

  return updated;
}

// ==================== SOFTWARE TOOLKIT ====================

export function subscribeSoftwareTools(callback: (tools: SoftwareTool[]) => void): () => void {
  // 1. Local Cache
  try {
    const local = localStorage.getItem('subeg_software_tools');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      } else {
        callback(initialSoftwareTools);
      }
    } else {
      callback(initialSoftwareTools);
    }
  } catch {
    callback(initialSoftwareTools);
  }

  // 2. Broadcast events
  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.type === 'software' && Array.isArray(custom.detail?.payload)) {
      callback(custom.detail.payload);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('subeg-store-update', handleUpdate);
  }

  // 3. Real-time Firestore Cloud Subscription
  let unsubFirestore = () => {};
  try {
    const softwareDocRef = doc(db, 'content', 'software');
    unsubFirestore = onSnapshot(softwareDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.tools)) {
          const sorted = [...data.tools].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          try {
            localStorage.setItem('subeg_software_tools', JSON.stringify(sorted));
          } catch {}
          callback(sorted);
          return;
        }
      }
      // If doc doesn't exist yet, seed initialSoftwareTools
      setDoc(softwareDocRef, { tools: sanitizeForFirestore(initialSoftwareTools) }, { merge: true }).catch(() => {});
      callback(initialSoftwareTools);
    }, (err) => {
      console.warn('Firestore software subscription warning:', err);
    });
  } catch {}

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('subeg-store-update', handleUpdate);
    }
    unsubFirestore();
  };
}

export async function fetchSoftwareTools(): Promise<SoftwareTool[]> {
  try {
    const snap = await getDoc(doc(db, 'content', 'software'));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.tools)) {
        const sorted = [...data.tools].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        try {
          localStorage.setItem('subeg_software_tools', JSON.stringify(sorted));
        } catch {}
        return sorted;
      }
    }
  } catch {}

  try {
    const local = localStorage.getItem('subeg_software_tools');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return initialSoftwareTools;
}

export async function saveSoftwareToolsApi(tools: SoftwareTool[]): Promise<SoftwareTool[]> {
  const sorted = [...tools].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // 1. Local cache & broadcast immediately
  try {
    localStorage.setItem('subeg_software_tools', JSON.stringify(sorted));
    broadcastStoreUpdate('software', sorted);
  } catch {}

  // 2. Firestore Cloud Database
  try {
    await setDoc(doc(db, 'content', 'software'), {
      tools: sanitizeForFirestore(sorted),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    await setDoc(doc(db, 'metadata', 'store_init'), { initialized: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore software save warning:', e);
  }

  return sorted;
}

export async function resetSoftwareToolsApi(): Promise<SoftwareTool[]> {
  return await saveSoftwareToolsApi(initialSoftwareTools);
}

// ==================== MEDIA ====================

export async function fetchMediaApi(): Promise<MediaItem[]> {
  // 1. Try Firestore
  try {
    const mediaCol = collection(db, 'media');
    const snapshot = await getDocs(mediaCol);
    if (!snapshot.empty) {
      const list: MediaItem[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as MediaItem));
      list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      try {
        localStorage.setItem('subeg_media_items', JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch {}

  // 2. Try Server API
  try {
    const serverMedia = await fetchFromServer<MediaItem[]>('media', []);
    if (serverMedia && serverMedia.length > 0) {
      try {
        localStorage.setItem('subeg_media_items', JSON.stringify(serverMedia));
      } catch {}
      return serverMedia;
    }
  } catch {}

  // 3. LocalStorage fallback
  const local = localStorage.getItem('subeg_media_items');
  return local ? JSON.parse(local) : [];
}

export async function uploadMediaApi(file: File): Promise<MediaItem> {
  const dataUrl = await fileToDataUrl(file);
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let finalUrl = dataUrl;

  // 1. Upload to Server (if available)
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
  } catch {}

  const mediaItem: MediaItem = {
    id: mediaId,
    filename: file.name,
    originalName: file.name,
    url: finalUrl,
    mimeType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    uploadedAt: new Date().toISOString(),
    size: file.size
  };

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, 'media', mediaId), sanitizeForFirestore(mediaItem));
  } catch {}

  // 3. LocalStorage cache & broadcast
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
  // Delete from Firestore
  try {
    await deleteDoc(doc(db, 'media', filenameOrId));
  } catch {}

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

  // Reset Firestore to initial seed
  try {
    const projSnap = await getDocs(collection(db, 'projects'));
    for (const d of projSnap.docs) {
      await deleteDoc(d.ref);
    }
    for (const p of initialProjects) {
      await setDoc(doc(db, 'projects', p.id), sanitizeForFirestore(p));
    }
    await setDoc(doc(db, 'content', 'about'), sanitizeForFirestore(initialAboutData));
    await setDoc(doc(db, 'content', 'contact'), sanitizeForFirestore(initialContactData));
    await setDoc(doc(db, 'content', 'settings'), sanitizeForFirestore(initialSiteSettings));
  } catch {}

  localStorage.removeItem('subeg_projects_data');
  localStorage.removeItem('subeg_about_data');
  localStorage.removeItem('subeg_contact_data');
  localStorage.removeItem('subeg_site_settings');
  localStorage.removeItem('subeg_media_items');
  broadcastStoreUpdate('projects', initialProjects);
  broadcastStoreUpdate('about', initialAboutData);
  broadcastStoreUpdate('contact', initialContactData);
  broadcastStoreUpdate('settings', initialSiteSettings);
}
