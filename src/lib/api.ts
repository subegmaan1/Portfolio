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

// Convert File to Base64 Data URL for universal cross-device image persistence
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to seed initial data into Firestore if collection/document is empty
let isSeedingProjects = false;
async function seedInitialProjectsIfNeeded(): Promise<Project[]> {
  if (isSeedingProjects) return initialProjects;
  isSeedingProjects = true;
  try {
    const batch = writeBatch(db);
    initialProjects.forEach((proj, idx) => {
      const docRef = doc(db, 'projects', proj.id);
      batch.set(docRef, { ...proj, order: idx });
    });
    await batch.commit();
    return initialProjects;
  } catch (err) {
    console.error('Failed to seed initial projects to Firestore:', err);
    return initialProjects;
  } finally {
    isSeedingProjects = false;
  }
}

// Subscribe to real-time project updates across devices
export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  if (!db) {
    const local = localStorage.getItem('subeg_projects_data');
    callback(local ? JSON.parse(local) : initialProjects);
    return () => {};
  }
  try {
    const q = query(collection(db, 'projects'));
    return onSnapshot(
      q,
      async snapshot => {
        if (snapshot.empty) {
          const seeded = await seedInitialProjectsIfNeeded();
          callback(seeded);
          return;
        }
        const docsData: (Project & { order?: number })[] = snapshot.docs.map(
          d => ({ id: d.id, ...d.data() } as Project & { order?: number })
        );
        // Sort by order or index
        docsData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(docsData);
      },
      error => {
        console.warn('Firestore projects snapshot notice, using cached data:', error);
        const local = localStorage.getItem('subeg_projects_data');
        callback(local ? JSON.parse(local) : initialProjects);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe projects failed:', err);
    const local = localStorage.getItem('subeg_projects_data');
    callback(local ? JSON.parse(local) : initialProjects);
    return () => {};
  }
}

export async function fetchProjects(category?: string): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'projects'));
    if (querySnapshot.empty) {
      const seeded = await seedInitialProjectsIfNeeded();
      return category && category !== 'ALL' ? seeded.filter(p => p.category === category) : seeded;
    }
    const projects: (Project & { order?: number })[] = querySnapshot.docs.map(
      d => ({ id: d.id, ...d.data() } as Project & { order?: number })
    );
    projects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    try {
      localStorage.setItem('subeg_projects_data', JSON.stringify(projects));
    } catch {}

    return category && category !== 'ALL' ? projects.filter(p => p.category === category) : projects;
  } catch (err) {
    console.warn('Firestore fetch projects error, using cached data:', err);
    const local = localStorage.getItem('subeg_projects_data');
    const allProjects: Project[] = local ? JSON.parse(local) : initialProjects;
    return category && category !== 'ALL' ? allProjects.filter(p => p.category === category) : allProjects;
  }
}

export async function fetchProjectByIdOrSlug(idOrSlug: string): Promise<Project> {
  try {
    const docRef = doc(db, 'projects', idOrSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Project;
    }
  } catch {}

  const all = await fetchProjects();
  const found = all.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  if (found) return found;
  throw new Error('Project not found');
}

// Subscribe to About data real-time
export function subscribeAboutData(callback: (about: AboutData) => void): () => void {
  if (!db) {
    const local = localStorage.getItem('subeg_about_data');
    callback(local ? JSON.parse(local) : initialAboutData);
    return () => {};
  }
  try {
    const docRef = doc(db, 'about', 'main');
    return onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          await setDoc(docRef, initialAboutData);
          callback(initialAboutData);
          return;
        }
        callback(docSnap.data() as AboutData);
      },
      () => {
        const local = localStorage.getItem('subeg_about_data');
        callback(local ? JSON.parse(local) : initialAboutData);
      }
    );
  } catch {
    const local = localStorage.getItem('subeg_about_data');
    callback(local ? JSON.parse(local) : initialAboutData);
    return () => {};
  }
}

export async function fetchAboutData(): Promise<AboutData> {
  if (!db) {
    const local = localStorage.getItem('subeg_about_data');
    return local ? JSON.parse(local) : initialAboutData;
  }
  try {
    const docRef = doc(db, 'about', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AboutData;
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(data));
      } catch {}
      return data;
    } else {
      await setDoc(docRef, initialAboutData);
      return initialAboutData;
    }
  } catch {
    const local = localStorage.getItem('subeg_about_data');
    return local ? JSON.parse(local) : initialAboutData;
  }
}

// Subscribe to Contact data real-time
export function subscribeContactData(callback: (contact: ContactData) => void): () => void {
  if (!db) {
    const local = localStorage.getItem('subeg_contact_data');
    callback(local ? JSON.parse(local) : initialContactData);
    return () => {};
  }
  try {
    const docRef = doc(db, 'contact', 'main');
    return onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          await setDoc(docRef, initialContactData);
          callback(initialContactData);
          return;
        }
        callback(docSnap.data() as ContactData);
      },
      () => {
        const local = localStorage.getItem('subeg_contact_data');
        callback(local ? JSON.parse(local) : initialContactData);
      }
    );
  } catch {
    const local = localStorage.getItem('subeg_contact_data');
    callback(local ? JSON.parse(local) : initialContactData);
    return () => {};
  }
}

export async function fetchContactData(): Promise<ContactData> {
  if (!db) {
    const local = localStorage.getItem('subeg_contact_data');
    return local ? JSON.parse(local) : initialContactData;
  }
  try {
    const docRef = doc(db, 'contact', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as ContactData;
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(data));
      } catch {}
      return data;
    } else {
      await setDoc(docRef, initialContactData);
      return initialContactData;
    }
  } catch {
    const local = localStorage.getItem('subeg_contact_data');
    return local ? JSON.parse(local) : initialContactData;
  }
}

// Subscribe to Settings real-time
export function subscribeSiteSettings(callback: (settings: SiteSettings) => void): () => void {
  if (!db) {
    const local = localStorage.getItem('subeg_site_settings');
    callback(local ? JSON.parse(local) : initialSiteSettings);
    return () => {};
  }
  try {
    const docRef = doc(db, 'settings', 'main');
    return onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          await setDoc(docRef, initialSiteSettings);
          callback(initialSiteSettings);
          return;
        }
        callback(docSnap.data() as SiteSettings);
      },
      () => {
        const local = localStorage.getItem('subeg_site_settings');
        callback(local ? JSON.parse(local) : initialSiteSettings);
      }
    );
  } catch {
    const local = localStorage.getItem('subeg_site_settings');
    callback(local ? JSON.parse(local) : initialSiteSettings);
    return () => {};
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!db) {
    const local = localStorage.getItem('subeg_site_settings');
    return local ? JSON.parse(local) : initialSiteSettings;
  }
  try {
    const docRef = doc(db, 'settings', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SiteSettings;
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(data));
      } catch {}
      return data;
    } else {
      await setDoc(docRef, initialSiteSettings);
      return initialSiteSettings;
    }
  } catch {
    const local = localStorage.getItem('subeg_site_settings');
    return local ? JSON.parse(local) : initialSiteSettings;
  }
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
  const id = project.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
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

  try {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};
    await setDoc(docRef, { ...existingData, ...fullProject }, { merge: true });
  } catch (err) {
    console.error('Error saving project to Firestore:', err);
  }

  // Local fallback cache update
  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const idx = existingList.findIndex(p => p.id === id);
    if (idx !== -1) existingList[idx] = fullProject;
    else existingList.push(fullProject);
    localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
  } catch {}

  // Also notify server backend if express endpoint is accessible
  try {
    const isEdit = Boolean(project.id);
    const url = isEdit ? `/api/projects/${id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(fullProject)
    }).catch(() => {});
  } catch {}

  return fullProject;
}

export async function deleteProjectApi(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (err) {
    console.error('Error deleting project from Firestore:', err);
  }

  try {
    const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
    const filtered = existingList.filter(p => p.id !== id);
    localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
  } catch {}

  try {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    }).catch(() => {});
  } catch {}
}

export async function reorderProjectsApi(projectIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    projectIds.forEach((id, index) => {
      const docRef = doc(db, 'projects', id);
      batch.update(docRef, { order: index });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error reordering projects in Firestore:', err);
  }
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  const current = await fetchAboutData();
  const updated: AboutData = { ...current, ...data };

  try {
    await setDoc(doc(db, 'about', 'main'), updated, { merge: true });
  } catch (err) {
    console.error('Error saving about data to Firestore:', err);
  }

  try {
    localStorage.setItem('subeg_about_data', JSON.stringify(updated));
  } catch {}

  try {
    await fetch('/api/about', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    }).catch(() => {});
  } catch {}

  return updated;
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  const current = await fetchContactData();
  const updated: ContactData = { ...current, ...data };

  try {
    await setDoc(doc(db, 'contact', 'main'), updated, { merge: true });
  } catch (err) {
    console.error('Error saving contact data to Firestore:', err);
  }

  try {
    localStorage.setItem('subeg_contact_data', JSON.stringify(updated));
  } catch {}

  try {
    await fetch('/api/contact', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    }).catch(() => {});
  } catch {}

  return updated;
}

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await fetchSiteSettings();
  const updated: SiteSettings = { ...current, ...data };

  try {
    await setDoc(doc(db, 'settings', 'main'), updated, { merge: true });
  } catch (err) {
    console.error('Error saving settings to Firestore:', err);
  }

  try {
    localStorage.setItem('subeg_site_settings', JSON.stringify(updated));
  } catch {}

  try {
    await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updated)
    }).catch(() => {});
  } catch {}

  return updated;
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
  // Try server upload first if express is running
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const serverItem: MediaItem = await res.json();
      await setDoc(doc(db, 'media', serverItem.id), serverItem, { merge: true }).catch(() => {});
      return serverItem;
    }
  } catch {}

  // Portable Data URL mode for static hosting (e.g. GitHub Pages):
  // Converts image to Data URL so it is stored in Firestore and renders anywhere on mobile/web globally!
  const dataUrl = await fileToDataUrl(file);
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
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
    await setDoc(doc(db, 'media', mediaId), mediaItem);
  } catch (err) {
    console.error('Error saving media item to Firestore:', err);
  }

  try {
    const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
    existing.unshift(mediaItem);
    localStorage.setItem('subeg_media_items', JSON.stringify(existing));
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
