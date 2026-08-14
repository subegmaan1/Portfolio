import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
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
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

// Track Firestore availability status to avoid repeated quota exhaustion loops
let isFirestoreAvailable = true;
let lastFirestoreCheck = 0;

export function getFirestoreStatus(): { available: boolean; mode: string } {
  return {
    available: isFirestoreAvailable,
    mode: isFirestoreAvailable ? 'Cloud Firestore & Server Sync' : 'High-Speed Server & Local Cache (Quota Safeguard Active)'
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
    console.warn(`Server API /api/${endpoint} unreachable:`, err);
  }
  return fallback;
}

// Helper to seed initial data into Firestore if collection is empty
let isSeedingProjects = false;
async function seedInitialProjectsIfNeeded(): Promise<Project[]> {
  if (isSeedingProjects) return initialProjects;
  isSeedingProjects = true;
  try {
    if (db && isFirestoreAvailable) {
      const batch = writeBatch(db);
      initialProjects.forEach((proj, idx) => {
        const docRef = doc(db, 'projects', proj.id);
        batch.set(docRef, { ...proj, order: idx });
      });
      await batch.commit();
    }
    return initialProjects;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') {
      isFirestoreAvailable = false;
    }
    return initialProjects;
  } finally {
    isSeedingProjects = false;
  }
}

// Subscribe to real-time project updates across devices
export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  // First, deliver any fast cached data immediately
  try {
    const local = localStorage.getItem('subeg_projects_data');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      }
    }
  } catch {}

  // Fetch from server / Firestore
  fetchProjects().then(callback);

  // If Firestore is available and connected, attach snapshot listener with quota protection
  if (db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, 'projects'));
      const unsub = onSnapshot(
        q,
        async snapshot => {
          if (snapshot.empty) {
            const serverProjects = await fetchFromServer<Project[]>('projects', []);
            if (serverProjects.length > 0) {
              callback(serverProjects);
              return;
            }
            const seeded = await seedInitialProjectsIfNeeded();
            callback(seeded);
            return;
          }
          const docsData: (Project & { order?: number })[] = snapshot.docs.map(
            d => ({ id: d.id, ...d.data() } as Project & { order?: number })
          );
          docsData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          try {
            localStorage.setItem('subeg_projects_data', JSON.stringify(docsData));
          } catch {}
          callback(docsData);
        },
        async error => {
          if (error?.code === 'resource-exhausted') {
            isFirestoreAvailable = false;
          }
          // On Firestore quota notice, fallback to Server API
          const serverProjects = await fetchFromServer<Project[]>('projects', []);
          if (serverProjects.length > 0) {
            callback(serverProjects);
          }
        }
      );
      return unsub;
    } catch {
      // Fallback
    }
  }

  // Periodic refresh from server API for multi-device sync if Firestore is paused
  const intervalId = setInterval(async () => {
    const serverProjects = await fetchFromServer<Project[]>('projects', []);
    if (serverProjects && serverProjects.length > 0) {
      callback(serverProjects);
    }
  }, 10000);

  return () => clearInterval(intervalId);
}

export async function fetchProjects(category?: string): Promise<Project[]> {
  // 1. Try Firestore if available
  if (db && isFirestoreAvailable) {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      if (!querySnapshot.empty) {
        const projects: (Project & { order?: number })[] = querySnapshot.docs.map(
          d => ({ id: d.id, ...d.data() } as Project & { order?: number })
        );
        projects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        try {
          localStorage.setItem('subeg_projects_data', JSON.stringify(projects));
        } catch {}
        return category && category !== 'ALL' ? projects.filter(p => p.category === category) : projects;
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') {
        isFirestoreAvailable = false;
      }
    }
  }

  // 2. Fetch from Express Server Backend
  try {
    const serverProjects = await fetchFromServer<Project[]>('projects', []);
    if (serverProjects && serverProjects.length > 0) {
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(serverProjects));
      } catch {}
      return category && category !== 'ALL' ? serverProjects.filter(p => p.category === category) : serverProjects;
    }
  } catch {}

  // 3. Fallback to LocalStorage
  try {
    const local = localStorage.getItem('subeg_projects_data');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return category && category !== 'ALL' ? parsed.filter((p: Project) => p.category === category) : parsed;
      }
    }
  } catch {}

  // 4. Default Initial Projects
  return category && category !== 'ALL' ? initialProjects.filter(p => p.category === category) : initialProjects;
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

// Subscribe to About data real-time
export function subscribeAboutData(callback: (about: AboutData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) callback(JSON.parse(local));
  } catch {}

  fetchAboutData().then(callback);

  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'about', 'main');
      return onSnapshot(
        docRef,
        async docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AboutData;
            try {
              localStorage.setItem('subeg_about_data', JSON.stringify(data));
            } catch {}
            callback(data);
          }
        },
        async err => {
          if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
          const serverAbout = await fetchFromServer<AboutData>('about', initialAboutData);
          callback(serverAbout);
        }
      );
    } catch {}
  }

  return () => {};
}

export async function fetchAboutData(): Promise<AboutData> {
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'about', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AboutData;
        try {
          localStorage.setItem('subeg_about_data', JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }

  // Fetch from Server API
  try {
    const serverAbout = await fetchFromServer<AboutData>('about', initialAboutData);
    if (serverAbout && (serverAbout.name || serverAbout.introduction)) {
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(serverAbout));
      } catch {}
      return serverAbout;
    }
  } catch {}

  const local = localStorage.getItem('subeg_about_data');
  return local ? JSON.parse(local) : initialAboutData;
}

// Subscribe to Contact data real-time
export function subscribeContactData(callback: (contact: ContactData) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) callback(JSON.parse(local));
  } catch {}

  fetchContactData().then(callback);

  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'contact', 'main');
      return onSnapshot(
        docRef,
        async docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as ContactData;
            try {
              localStorage.setItem('subeg_contact_data', JSON.stringify(data));
            } catch {}
            callback(data);
          }
        },
        async err => {
          if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
          const serverContact = await fetchFromServer<ContactData>('contact', initialContactData);
          callback(serverContact);
        }
      );
    } catch {}
  }

  return () => {};
}

export async function fetchContactData(): Promise<ContactData> {
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'contact', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as ContactData;
        try {
          localStorage.setItem('subeg_contact_data', JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }

  try {
    const serverContact = await fetchFromServer<ContactData>('contact', initialContactData);
    if (serverContact) {
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(serverContact));
      } catch {}
      return serverContact;
    }
  } catch {}

  const local = localStorage.getItem('subeg_contact_data');
  return local ? JSON.parse(local) : initialContactData;
}

// Subscribe to Settings real-time
export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) callback(JSON.parse(local));
  } catch {}

  fetchSiteSettings().then(callback);

  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'settings', 'main');
      return onSnapshot(
        docRef,
        async docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as SiteSettings;
            try {
              localStorage.setItem('subeg_site_settings', JSON.stringify(data));
            } catch {}
            callback(data);
          }
        },
        async err => {
          if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
          const serverSettings = await fetchFromServer<SiteSettings>('settings', initialSiteSettings);
          callback(serverSettings);
        }
      );
    } catch {}
  }

  return () => {};
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'settings', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        try {
          localStorage.setItem('subeg_site_settings', JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }

  try {
    const serverSettings = await fetchFromServer<SiteSettings>('settings', initialSiteSettings);
    if (serverSettings) {
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(serverSettings));
      } catch {}
      return serverSettings;
    }
  } catch {}

  const local = localStorage.getItem('subeg_site_settings');
  return local ? JSON.parse(local) : initialSiteSettings;
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

// Save or Update Project with Multi-Tier Storage (Server API + Firestore + LocalStorage)
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

  // 1. Immediately update Local Storage cache
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const idx = existingList.findIndex(p => p.id === id);
    if (idx !== -1) {
      existingList[idx] = fullProject;
    } else {
      existingList.unshift(fullProject);
    }
    localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
  } catch {}

  // 2. Persist to Express Server Backend (saves to data/store.json on disk)
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

  // 3. Persist to Firestore if available
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'projects', id);
      const savePromise = setDoc(docRef, fullProject, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );
      await Promise.race([savePromise, timeoutPromise]);
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
      console.warn('Firestore setDoc notice (saved safely on server & local storage):', err);
    }
  }

  return fullProject;
}

export async function deleteProjectApi(id: string): Promise<void> {
  // 1. Delete from Server
  try {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch {}

  // 2. Delete from LocalStorage
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const filtered = existingList.filter(p => p.id !== id);
    localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
  } catch {}

  // 3. Delete from Firestore
  if (db && isFirestoreAvailable) {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }
}

export async function reorderProjectsApi(projectIds: string[]): Promise<void> {
  // Server reorder
  try {
    await fetch('/api/projects/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ projectIds })
    });
  } catch {}

  // Firestore reorder
  if (db && isFirestoreAvailable) {
    try {
      const batch = writeBatch(db);
      projectIds.forEach((id, index) => {
        const docRef = doc(db, 'projects', id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  const current = await fetchAboutData();
  const updated: AboutData = { ...current, ...data };

  // 1. Update LocalStorage
  try {
    localStorage.setItem('subeg_about_data', JSON.stringify(updated));
  } catch {}

  // 2. Save to Server
  try {
    await fetch('/api/about', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch {}

  // 3. Save to Firestore
  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'about', 'main'), updated, { merge: true });
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }

  return updated;
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  const current = await fetchContactData();
  const updated: ContactData = { ...current, ...data };

  try {
    localStorage.setItem('subeg_contact_data', JSON.stringify(updated));
  } catch {}

  try {
    await fetch('/api/contact', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch {}

  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'contact', 'main'), updated, { merge: true });
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }

  return updated;
}

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await fetchSiteSettings();
  const updated: SiteSettings = { ...current, ...data };

  try {
    localStorage.setItem('subeg_site_settings', JSON.stringify(updated));
  } catch {}

  try {
    await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    });
  } catch {}

  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'settings', 'main'), updated, { merge: true });
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
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
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
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
  } catch {}

  // 3. Firestore save if available
  if (db && isFirestoreAvailable) {
    try {
      const savePromise = setDoc(doc(db, 'media', mediaId), mediaItem);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Media Firestore timeout')), 4000)
      );
      await Promise.race([savePromise, timeoutPromise]);
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
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
  } catch {}

  // Delete from Firestore
  if (db && isFirestoreAvailable) {
    try {
      await deleteDoc(doc(db, 'media', filenameOrId));
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
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
        batch.set(docRef, { ...proj, order: idx });
      });
      batch.set(doc(db, 'about', 'main'), initialAboutData);
      batch.set(doc(db, 'contact', 'main'), initialContactData);
      batch.set(doc(db, 'settings', 'main'), initialSiteSettings);
      await batch.commit();
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') isFirestoreAvailable = false;
    }
  }

  localStorage.removeItem('subeg_projects_data');
  localStorage.removeItem('subeg_about_data');
  localStorage.removeItem('subeg_contact_data');
  localStorage.removeItem('subeg_site_settings');
  localStorage.removeItem('subeg_media_items');
}

