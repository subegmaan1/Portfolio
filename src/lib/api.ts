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
        // Fallback to FileReader if createObjectURL fails
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => resolve(fallbackReader.result as string);
        fallbackReader.onerror = () => resolve('');
        fallbackReader.readAsDataURL(file);
        return;
      }

      const img = new Image();

      // Guard with 6-second timeout so image loading never hangs indefinitely
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

          // Strict dimension and aspect ratio bounding
          const maxDim = 1280;
          const maxTotalPixels = 1280 * 800; // ~1MP max to prevent memory spikes on extreme narrow/panoramic images

          // Scale down if either dimension exceeds maxDim
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          // Handle extreme narrow aspect ratios (panoramas or tall screenshots)
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

          // Fill white background for transparent PNGs converting to JPEG
          ctx.fillStyle = '#121212';
          ctx.fillRect(0, 0, width, height);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Fast adaptive quality compression (aiming for 40KB - 80KB)
          let quality = 0.74;
          let optimized = canvas.toDataURL('image/jpeg', quality);

          // Step 2: Adaptive reduction if payload exceeds 90KB
          if (optimized.length > 95000) {
            quality = 0.60;
            optimized = canvas.toDataURL('image/jpeg', quality);
          }

          // Step 3: Progressive resize if still large (e.g. detailed textures)
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

// Subscribe to real-time project updates across devices
export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  if (!db) {
    try {
      const local = localStorage.getItem('subeg_projects_data');
      callback(local ? JSON.parse(local) : []);
    } catch {
      callback([]);
    }
    return () => {};
  }
  try {
    const q = query(collection(db, 'projects'));
    return onSnapshot(
      q,
      snapshot => {
        const docsData: (Project & { order?: number })[] = snapshot.docs.map(
          d => ({ id: d.id, ...d.data() } as Project & { order?: number })
        );
        // Sort by sortOrder or order
        docsData.sort((a, b) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0));
        try {
          localStorage.setItem('subeg_projects_data', JSON.stringify(docsData));
        } catch {}
        callback(docsData);
      },
      error => {
        console.warn('Firestore projects snapshot notice, using cached data:', error);
        try {
          const local = localStorage.getItem('subeg_projects_data');
          callback(local ? JSON.parse(local) : []);
        } catch {
          callback([]);
        }
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe projects failed:', err);
    try {
      const local = localStorage.getItem('subeg_projects_data');
      callback(local ? JSON.parse(local) : []);
    } catch {
      callback([]);
    }
    return () => {};
  }
}

export async function fetchProjects(category?: string): Promise<Project[]> {
  try {
    if (db) {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projects: (Project & { order?: number })[] = querySnapshot.docs.map(
        d => ({ id: d.id, ...d.data() } as Project & { order?: number })
      );
      projects.sort((a, b) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0));
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(projects));
      } catch {}

      return category && category !== 'ALL' ? projects.filter(p => p.category === category) : projects;
    }
  } catch (err) {
    console.warn('Firestore fetch projects error, using cached data:', err);
  }

  try {
    const local = localStorage.getItem('subeg_projects_data');
    const allProjects: Project[] = local ? JSON.parse(local) : [];
    return category && category !== 'ALL' ? allProjects.filter(p => p.category === category) : allProjects;
  } catch {
    return [];
  }
}

export async function fetchProjectByIdOrSlug(idOrSlug: string): Promise<Project> {
  try {
    if (db) {
      const docRef = doc(db, 'projects', idOrSlug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
      }
    }
  } catch {}

  const all = await fetchProjects();
  const found = all.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  if (found) return found;
  throw new Error('Project not found');
}

// Subscribe to About data real-time
export function subscribeAboutData(callback: (about: AboutData) => void): () => void {
  const loadFallback = () => {
    try {
      const local = localStorage.getItem('subeg_about_data');
      if (local) {
        const parsed = JSON.parse(local);
        callback({
          ...initialAboutData,
          ...parsed,
          capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : initialAboutData.capabilities
        });
        return;
      }
    } catch {}
    callback(initialAboutData);
  };

  if (!db) {
    loadFallback();
    return () => {};
  }

  try {
    const docRef = doc(db, 'about', 'main');
    return onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          try {
            const local = localStorage.getItem('subeg_about_data');
            if (local) {
              const parsed = JSON.parse(local);
              const data: AboutData = {
                ...initialAboutData,
                ...parsed,
                capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : initialAboutData.capabilities
              };
              callback(data);
              setDoc(docRef, data, { merge: true }).catch(() => {});
              return;
            }
          } catch {}
          callback(initialAboutData);
          setDoc(docRef, initialAboutData, { merge: true }).catch(() => {});
          return;
        }

        const raw = docSnap.data() as AboutData;
        const data: AboutData = {
          ...initialAboutData,
          ...raw,
          capabilities: Array.isArray(raw.capabilities) ? raw.capabilities : initialAboutData.capabilities
        };
        try {
          localStorage.setItem('subeg_about_data', JSON.stringify(data));
        } catch {}
        callback(data);
      },
      error => {
        console.warn('Firestore subscribe about notice:', error);
        loadFallback();
      }
    );
  } catch {
    loadFallback();
    return () => {};
  }
}

export async function fetchAboutData(): Promise<AboutData> {
  if (db) {
    try {
      const docRef = doc(db, 'about', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const raw = docSnap.data() as AboutData;
        const data: AboutData = {
          ...initialAboutData,
          ...raw,
          capabilities: Array.isArray(raw.capabilities) ? raw.capabilities : initialAboutData.capabilities
        };
        try {
          localStorage.setItem('subeg_about_data', JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Firestore fetch about notice:', err);
    }
  }

  try {
    const res = await fetch('/api/about');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object') {
        const data: AboutData = {
          ...initialAboutData,
          ...serverData,
          capabilities: Array.isArray(serverData.capabilities) ? serverData.capabilities : initialAboutData.capabilities
        };
        try {
          localStorage.setItem('subeg_about_data', JSON.stringify(data));
        } catch {}
        return data;
      }
    }
  } catch {}

  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...initialAboutData,
        ...parsed,
        capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : initialAboutData.capabilities
      };
    }
  } catch {}

  return initialAboutData;
}

// Subscribe to Contact data real-time
export function subscribeContactData(callback: (contact: ContactData) => void): () => void {
  const loadFallback = () => {
    try {
      const local = localStorage.getItem('subeg_contact_data');
      if (local) {
        const parsed = JSON.parse(local);
        callback({
          ...initialContactData,
          ...parsed,
          additionalLinks: Array.isArray(parsed.additionalLinks) ? parsed.additionalLinks : initialContactData.additionalLinks,
          socialLinks: Array.isArray(parsed.socialLinks) ? parsed.socialLinks : (initialContactData.socialLinks || [])
        });
        return;
      }
    } catch {}
    callback(initialContactData);
  };

  if (!db) {
    loadFallback();
    return () => {};
  }

  try {
    const docRef = doc(db, 'contact', 'main');
    return onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          try {
            const local = localStorage.getItem('subeg_contact_data');
            if (local) {
              const parsed = JSON.parse(local);
              const data: ContactData = {
                ...initialContactData,
                ...parsed,
                additionalLinks: Array.isArray(parsed.additionalLinks) ? parsed.additionalLinks : initialContactData.additionalLinks,
                socialLinks: Array.isArray(parsed.socialLinks) ? parsed.socialLinks : (initialContactData.socialLinks || [])
              };
              callback(data);
              setDoc(docRef, data, { merge: true }).catch(() => {});
              return;
            }
          } catch {}
          callback(initialContactData);
          setDoc(docRef, initialContactData, { merge: true }).catch(() => {});
          return;
        }

        const raw = docSnap.data() as ContactData;
        const data: ContactData = {
          ...initialContactData,
          ...raw,
          additionalLinks: Array.isArray(raw.additionalLinks) ? raw.additionalLinks : initialContactData.additionalLinks,
          socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks : (initialContactData.socialLinks || [])
        };
        try {
          localStorage.setItem('subeg_contact_data', JSON.stringify(data));
        } catch {}
        callback(data);
      },
      error => {
        console.warn('Firestore subscribe contact notice:', error);
        loadFallback();
      }
    );
  } catch {
    loadFallback();
    return () => {};
  }
}

export async function fetchContactData(): Promise<ContactData> {
  if (db) {
    try {
      const docRef = doc(db, 'contact', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const raw = docSnap.data() as ContactData;
        const data: ContactData = {
          ...initialContactData,
          ...raw,
          additionalLinks: Array.isArray(raw.additionalLinks) ? raw.additionalLinks : initialContactData.additionalLinks,
          socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks : (initialContactData.socialLinks || [])
        };
        try {
          localStorage.setItem('subeg_contact_data', JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Firestore fetch contact notice:', err);
    }
  }

  try {
    const res = await fetch('/api/contact');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object') {
        const data: ContactData = {
          ...initialContactData,
          ...serverData,
          additionalLinks: Array.isArray(serverData.additionalLinks) ? serverData.additionalLinks : initialContactData.additionalLinks,
          socialLinks: Array.isArray(serverData.socialLinks) ? serverData.socialLinks : (initialContactData.socialLinks || [])
        };
        try {
          localStorage.setItem('subeg_contact_data', JSON.stringify(data));
        } catch {}
        return data;
      }
    }
  } catch {}

  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...initialContactData,
        ...parsed,
        additionalLinks: Array.isArray(parsed.additionalLinks) ? parsed.additionalLinks : initialContactData.additionalLinks,
        socialLinks: Array.isArray(parsed.socialLinks) ? parsed.socialLinks : (initialContactData.socialLinks || [])
      };
    }
  } catch {}

  return initialContactData;
}

// Subscribe to Settings real-time
export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  const loadFallback = () => {
    try {
      const local = localStorage.getItem('subeg_site_settings');
      if (local) {
        const parsed = JSON.parse(local);
        callback({
          ...initialSiteSettings,
          ...parsed
        });
        return;
      }
    } catch {}
    callback(initialSiteSettings);
  };

  if (!db) {
    loadFallback();
    return () => {};
  }

  try {
    const docRef = doc(db, 'settings', 'main');
    return onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          try {
            const local = localStorage.getItem('subeg_site_settings');
            if (local) {
              const parsed = JSON.parse(local);
              const data: SiteSettings = {
                ...initialSiteSettings,
                ...parsed
              };
              callback(data);
              setDoc(docRef, data, { merge: true }).catch(() => {});
              return;
            }
          } catch {}
          callback(initialSiteSettings);
          setDoc(docRef, initialSiteSettings, { merge: true }).catch(() => {});
          return;
        }

        const raw = docSnap.data() as SiteSettings;
        const data: SiteSettings = {
          ...initialSiteSettings,
          ...raw
        };
        try {
          localStorage.setItem('subeg_site_settings', JSON.stringify(data));
        } catch {}
        callback(data);
      },
      error => {
        console.warn('Firestore subscribe settings notice:', error);
        loadFallback();
      }
    );
  } catch {
    loadFallback();
    return () => {};
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (db) {
    try {
      const docRef = doc(db, 'settings', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const raw = docSnap.data() as SiteSettings;
        const data: SiteSettings = {
          ...initialSiteSettings,
          ...raw
        };
        try {
          localStorage.setItem('subeg_site_settings', JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Firestore fetch settings notice:', err);
    }
  }

  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object') {
        const data: SiteSettings = {
          ...initialSiteSettings,
          ...serverData
        };
        try {
          localStorage.setItem('subeg_site_settings', JSON.stringify(data));
        } catch {}
        return data;
      }
    }
  } catch {}

  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...initialSiteSettings,
        ...parsed
      };
    }
  } catch {}

  return initialSiteSettings;
}

// Admin Auth
export async function checkAdminAuth(): Promise<boolean> {
  const token = getAdminToken();
  return Boolean(token && token.length > 0);
}

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (password === 'subeg2026') {
    const token = DEFAULT_ADMIN_TOKEN;
    setAdminToken(token);
    try {
      await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
}

// Save or Update Project directly in Firestore
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

  // 1. Immediately update Local Storage cache as fast synchronous primary store
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const idx = existingList.findIndex(p => p.id === id);
    if (idx !== -1) {
      existingList[idx] = fullProject;
    } else {
      existingList.unshift(fullProject);
    }
    localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
  } catch {
    // If quota is tight, clear transient media cache and retry
    try {
      localStorage.removeItem('subeg_media_items');
      const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
      const idx = existingList.findIndex(p => p.id === id);
      if (idx !== -1) existingList[idx] = fullProject;
      else existingList.unshift(fullProject);
      localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
    } catch (e) {
      console.warn('LocalStorage project cache notice:', e);
    }
  }

  // 2. Persist directly to Firestore with a 6-second timeout race to prevent indefinite hang
  try {
    if (db) {
      const docRef = doc(db, 'projects', id);
      const savePromise = setDoc(docRef, fullProject, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore project save timed out')), 6000)
      );
      await Promise.race([savePromise, timeoutPromise]);
    }
  } catch (err: any) {
    console.warn('Firestore setDoc notice (changes preserved in local & server cache):', err);
  }

  // 3. Also notify server backend if express endpoint is accessible
  try {
    const isEdit = Boolean(project.id);
    const url = isEdit ? `/api/projects/${id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(fullProject)
    }).catch(() => {});
  } catch {}

  return fullProject;
}

export async function deleteProjectApi(id: string): Promise<void> {
  // 1. Delete from Firestore with timeout
  try {
    if (db) {
      const deletePromise = deleteDoc(doc(db, 'projects', id));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore delete timed out')), 5000)
      );
      await Promise.race([deletePromise, timeoutPromise]);
    }
  } catch (err) {
    console.warn('Firestore project delete notice:', err);
  }

  // 2. Remove from LocalStorage
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const filtered = existingList.filter(p => p.id !== id);
    localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
  } catch {}

  // 3. Notify server
  try {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    }).catch(() => {});
  } catch {}
}

export async function reorderProjectsApi(projectIds: string[]): Promise<void> {
  // 1. Update local storage immediately
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const map = new Map(existingList.map(p => [p.id, p]));
    const reordered: Project[] = [];
    projectIds.forEach((id, index) => {
      const p = map.get(id);
      if (p) {
        p.sortOrder = index + 1;
        reordered.push(p);
      }
    });
    // Add any remaining
    existingList.forEach(p => {
      if (!projectIds.includes(p.id)) reordered.push(p);
    });
    localStorage.setItem('subeg_projects_data', JSON.stringify(reordered));
  } catch {}

  // 2. Update in Firestore batch with timeout
  try {
    if (db) {
      const batch = writeBatch(db);
      projectIds.forEach((id, index) => {
        const docRef = doc(db, 'projects', id);
        batch.set(docRef, { sortOrder: index + 1, order: index + 1 }, { merge: true });
      });
      const batchPromise = batch.commit();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore batch reorder timeout')), 6000)
      );
      await Promise.race([batchPromise, timeoutPromise]);
    }
  } catch (err) {
    console.warn('Firestore reorder batch notice:', err);
  }

  // 3. Update server
  try {
    fetch('/api/projects/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ projectIds })
    }).catch(() => {});
  } catch {}
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  let current: AboutData = initialAboutData;
  try {
    const local = localStorage.getItem('subeg_about_data');
    if (local) {
      const parsed = JSON.parse(local);
      current = { ...initialAboutData, ...parsed };
    }
  } catch {}

  const updated: AboutData = {
    ...current,
    ...data,
    capabilities: data.capabilities !== undefined
      ? (Array.isArray(data.capabilities) ? data.capabilities : [])
      : current.capabilities
  };

  // 1. Synchronously save to localStorage
  try {
    localStorage.setItem('subeg_about_data', JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save about notice:', e);
  }

  // 2. Persist to Firestore with timeout guard
  try {
    if (db) {
      const docRef = doc(db, 'about', 'main');
      const savePromise = setDoc(docRef, updated, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore about timeout')), 5000)
      );
      await Promise.race([savePromise, timeoutPromise]);
    }
  } catch (err) {
    console.warn('Firestore about setDoc notice:', err);
  }

  // 3. Send to server
  try {
    fetch('/api/about', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    }).catch(() => {});
  } catch {}

  return updated;
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  let current: ContactData = initialContactData;
  try {
    const local = localStorage.getItem('subeg_contact_data');
    if (local) {
      const parsed = JSON.parse(local);
      current = { ...initialContactData, ...parsed };
    }
  } catch {}

  const updated: ContactData = {
    ...current,
    ...data,
    additionalLinks: data.additionalLinks !== undefined
      ? (Array.isArray(data.additionalLinks) ? data.additionalLinks : [])
      : (Array.isArray(current.additionalLinks) ? current.additionalLinks : []),
    socialLinks: data.socialLinks !== undefined
      ? (Array.isArray(data.socialLinks) ? data.socialLinks : [])
      : (Array.isArray(current.socialLinks) ? current.socialLinks : [])
  };

  try {
    localStorage.setItem('subeg_contact_data', JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save contact notice:', e);
  }

  try {
    if (db) {
      const docRef = doc(db, 'contact', 'main');
      const savePromise = setDoc(docRef, updated, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore contact timeout')), 5000)
      );
      await Promise.race([savePromise, timeoutPromise]);
    }
  } catch (err) {
    console.warn('Firestore contact setDoc notice:', err);
  }

  try {
    fetch('/api/contact', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    }).catch(() => {});
  } catch {}

  return updated;
}

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  let current: SiteSettings = initialSiteSettings;
  try {
    const local = localStorage.getItem('subeg_site_settings');
    if (local) {
      const parsed = JSON.parse(local);
      current = { ...initialSiteSettings, ...parsed };
    }
  } catch {}

  const updated: SiteSettings = { ...current, ...data };

  try {
    localStorage.setItem('subeg_site_settings', JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save settings notice:', e);
  }

  try {
    if (db) {
      const docRef = doc(db, 'settings', 'main');
      const savePromise = setDoc(docRef, updated, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore settings timeout')), 5000)
      );
      await Promise.race([savePromise, timeoutPromise]);
    }
  } catch (err) {
    console.warn('Firestore settings setDoc notice:', err);
  }

  try {
    fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    }).catch(() => {});
  } catch {}

  return updated;
}

// Complete Flush of Deleted / Demo Data & Ghost Items
export async function flushAllMockDataApi(): Promise<void> {
  const mockIds = ['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6'];

  // 1. Delete mock IDs from Firestore
  try {
    if (db) {
      for (const id of mockIds) {
        try {
          await deleteDoc(doc(db, 'projects', id));
        } catch {}
      }
    }
  } catch {}

  // 2. Clear out deleted / mock items from local storage
  try {
    const cached = localStorage.getItem('subeg_projects_data');
    if (cached) {
      const list: Project[] = JSON.parse(cached);
      const filtered = list.filter(p => !mockIds.includes(p.id));
      localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
    }
  } catch {}

  // 3. Clear temporary media cache
  try {
    localStorage.removeItem('subeg_media_items');
  } catch {}

  // 4. Notify server to remove mock projects from server store
  try {
    for (const id of mockIds) {
      fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      }).catch(() => {});
    }
  } catch {}
}

export async function fetchMediaApi(): Promise<MediaItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'media'));
    const mediaItems: MediaItem[] = querySnapshot.docs.map(
      d => ({ id: d.id, ...d.data() } as MediaItem)
    );
    mediaItems.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return mediaItems;
  } catch {
    const local = localStorage.getItem('subeg_media_items');
    return local ? JSON.parse(local) : [];
  }
}

export async function uploadMediaApi(file: File): Promise<MediaItem> {
  // Portable optimized Data URL for universal cross-platform persistence (works on GitHub Pages, Firebase, Cloud Run, and mobile)
  const dataUrl = await fileToDataUrl(file);
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const mediaItem: MediaItem = {
    id: mediaId,
    filename: file.name,
    originalName: file.name,
    url: dataUrl,
    mimeType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
    uploadedAt: new Date().toISOString(),
    size: file.size
  };

  try {
    const savePromise = setDoc(doc(db, 'media', mediaId), mediaItem);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Media Firestore timeout')), 5000)
    );
    await Promise.race([savePromise, timeoutPromise]);
  } catch (err) {
    console.warn('Notice saving media item to Firestore (using local & server copy):', err);
  }

  try {
    const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
    existing.unshift(mediaItem);
    // Keep max 50 items in local media cache to preserve localStorage quota
    if (existing.length > 50) existing.length = 50;
    localStorage.setItem('subeg_media_items', JSON.stringify(existing));
  } catch {}

  // Also sync to server if running
  try {
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/media/upload', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData
    }).catch(() => {});
  } catch {}

  return mediaItem;
}

export async function deleteMediaApi(filenameOrId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'media', filenameOrId));
  } catch {}

  try {
    const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
    const filtered = existing.filter(m => m.id !== filenameOrId && m.filename !== filenameOrId);
    localStorage.setItem('subeg_media_items', JSON.stringify(filtered));
  } catch {}

  try {
    await fetch(`/api/media/${filenameOrId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    }).catch(() => {});
  } catch {}
}

export async function uploadCvApi(file: File): Promise<{ cvUrl: string }> {
  try {
    const dataUrl = await fileToDataUrl(file);
    await saveAboutApi({ cvUrl: dataUrl });
    return { cvUrl: dataUrl };
  } catch {
    throw new Error('Failed to upload CV file');
  }
}

export async function resetDemoDataApi(): Promise<void> {
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
  } catch (err) {
    console.error('Error resetting demo data in Firestore:', err);
  }

  localStorage.removeItem('subeg_projects_data');
  localStorage.removeItem('subeg_about_data');
  localStorage.removeItem('subeg_contact_data');
  localStorage.removeItem('subeg_site_settings');
  localStorage.removeItem('subeg_media_items');
}
