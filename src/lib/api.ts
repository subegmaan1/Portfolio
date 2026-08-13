import { AboutData, ContactData, MediaItem, Project, SiteSettings } from '../types';
import { initialAboutData, initialContactData, initialProjects, initialSiteSettings } from '../data/initial-store';

const ADMIN_TOKEN_KEY = 'subeg_admin_token';
const DEFAULT_ADMIN_TOKEN = 'subeg-admin-authenticated-token-2026';

export function setAdminToken(token: string) {
  if (token) {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {
      // Ignore
    }
  } else {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // Ignore
    }
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

export async function fetchProjects(category?: string): Promise<Project[]> {
  try {
    const url = category ? `/api/projects?category=${encodeURIComponent(category)}` : '/api/projects';
    const res = await fetch(url, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data: Project[] = await res.json();
      try {
        localStorage.setItem('subeg_projects_data', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('API unavailable, falling back to cached projects dataset:', e);
  }

  const local = localStorage.getItem('subeg_projects_data');
  const allProjects: Project[] = local ? JSON.parse(local) : initialProjects;
  return category && category !== 'ALL'
    ? allProjects.filter(p => p.category === category)
    : allProjects;
}

export async function fetchProjectByIdOrSlug(idOrSlug: string): Promise<Project> {
  try {
    const res = await fetch(`/api/projects/${idOrSlug}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API unavailable, falling back to static project details:', e);
  }

  const allProjects = await fetchProjects();
  const found = allProjects.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  if (found) return found;
  throw new Error('Project not found');
}

export async function fetchAboutData(): Promise<AboutData> {
  try {
    const res = await fetch('/api/about', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data: AboutData = await res.json();
      try {
        localStorage.setItem('subeg_about_data', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('API unavailable, falling back to cached about data:', e);
  }

  const local = localStorage.getItem('subeg_about_data');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return initialAboutData;
}

export async function fetchContactData(): Promise<ContactData> {
  try {
    const res = await fetch('/api/contact', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data: ContactData = await res.json();
      try {
        localStorage.setItem('subeg_contact_data', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('API unavailable, falling back to cached contact data:', e);
  }

  const local = localStorage.getItem('subeg_contact_data');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return initialContactData;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch('/api/settings', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data: SiteSettings = await res.json();
      try {
        localStorage.setItem('subeg_site_settings', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('API unavailable, falling back to cached site settings:', e);
  }

  const local = localStorage.getItem('subeg_site_settings');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return initialSiteSettings;
}

// Admin API
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/me', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      return Boolean(data.authenticated);
    }
  } catch {
    // Static host fallback
  }

  const token = getAdminToken();
  return Boolean(token && token.length > 0);
}

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
      }
      return data;
    }
  } catch {
    // API server unavailable
  }

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
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders()
    });
  } catch {
    // Static host
  }
}

export async function saveProjectApi(project: Partial<Project>): Promise<Project> {
  const isEdit = Boolean(project.id);
  const url = isEdit ? `/api/projects/${project.id}` : '/api/projects';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(project)
  });

  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('application/json')) {
    const saved: Project = await res.json();
    try {
      const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
      const idx = existingList.findIndex(p => p.id === saved.id);
      if (idx !== -1) existingList[idx] = saved;
      else existingList.push(saved);
      localStorage.setItem('subeg_projects_data', JSON.stringify(existingList));
    } catch {}
    return saved;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server save project failed:', res.status, errText);
  throw new Error(`Failed to save project on server (${res.status}): ${errText || 'Unauthorized or server error'}`);
}

export async function deleteProjectApi(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });

  if (res.ok) {
    try {
      const existingList: Project[] = JSON.parse(localStorage.getItem('subeg_projects_data') || '[]');
      const filtered = existingList.filter(p => p.id !== id);
      localStorage.setItem('subeg_projects_data', JSON.stringify(filtered));
    } catch {}
    return;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server delete project failed:', res.status, errText);
  throw new Error(`Failed to delete project on server (${res.status})`);
}

export async function reorderProjectsApi(projectIds: string[]): Promise<void> {
  const res = await fetch('/api/projects/reorder', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ projectIds })
  });

  if (res.ok) {
    return;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server reorder projects failed:', res.status, errText);
  throw new Error(`Failed to reorder projects on server (${res.status})`);
}

export async function saveAboutApi(data: Partial<AboutData>): Promise<AboutData> {
  const res = await fetch('/api/about', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });

  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('application/json')) {
    const result: AboutData = await res.json();
    try {
      localStorage.setItem('subeg_about_data', JSON.stringify(result));
    } catch {}
    return result;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server save about failed:', res.status, errText);
  throw new Error(`Failed to save about data on server (${res.status})`);
}

export async function saveContactApi(data: Partial<ContactData>): Promise<ContactData> {
  const res = await fetch('/api/contact', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });

  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('application/json')) {
    const result: ContactData = await res.json();
    try {
      localStorage.setItem('subeg_contact_data', JSON.stringify(result));
    } catch {}
    return result;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server save contact failed:', res.status, errText);
  throw new Error(`Failed to save contact data on server (${res.status})`);
}

export async function saveSettingsApi(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });

  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('application/json')) {
    const result: SiteSettings = await res.json();
    try {
      localStorage.setItem('subeg_site_settings', JSON.stringify(result));
    } catch {}
    return result;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server save settings failed:', res.status, errText);
  throw new Error(`Failed to save settings on server (${res.status})`);
}

export async function fetchMediaApi(): Promise<MediaItem[]> {
  try {
    const res = await fetch('/api/media', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data: MediaItem[] = await res.json();
      try {
        localStorage.setItem('subeg_media_items', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('API unavailable, returning media list from cache:', e);
  }

  return JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
}

export async function uploadMediaApi(file: File): Promise<MediaItem> {
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
    const mediaItem: MediaItem = await res.json();
    try {
      const existing: MediaItem[] = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
      existing.unshift(mediaItem);
      localStorage.setItem('subeg_media_items', JSON.stringify(existing));
    } catch {}
    return mediaItem;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server upload media failed:', res.status, errText);
  throw new Error(`Failed to upload media file on server (${res.status}): ${errText || res.statusText}`);
}

export async function deleteMediaApi(filename: string): Promise<void> {
  const res = await fetch(`/api/media/${filename}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });

  if (res.ok) {
    try {
      const existing = JSON.parse(localStorage.getItem('subeg_media_items') || '[]');
      const filtered = existing.filter((m: MediaItem) => m.filename !== filename);
      localStorage.setItem('subeg_media_items', JSON.stringify(filtered));
    } catch {}
    return;
  }

  const errText = await res.text().catch(() => '');
  console.error('Server delete media failed:', res.status, errText);
  throw new Error(`Failed to delete media file on server (${res.status})`);
}

export async function uploadCvApi(file: File): Promise<{ cvUrl: string }> {
  const formData = new FormData();
  formData.append('cvFile', file);

  const res = await fetch('/api/cv/upload', {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: formData
  });

  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('application/json')) {
    return await res.json();
  }

  const errText = await res.text().catch(() => '');
  console.error('Server upload CV failed:', res.status, errText);
  throw new Error(`Failed to upload CV file on server (${res.status})`);
}

export async function resetDemoDataApi(): Promise<void> {
  try {
    const res = await fetch('/api/settings/reset-demo', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('API unavailable, clearing local storage for store reset:', e);
  }

  localStorage.removeItem('subeg_projects_data');
  localStorage.removeItem('subeg_about_data');
  localStorage.removeItem('subeg_contact_data');
  localStorage.removeItem('subeg_site_settings');
  localStorage.removeItem('subeg_media_items');
}
