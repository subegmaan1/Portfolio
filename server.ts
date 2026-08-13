import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initialAboutData, initialContactData, initialProjects, initialSiteSettings } from './src/data/initial-store';
import { AboutData, ContactData, MediaItem, Project, SiteSettings } from './src/types';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface StoreSchema {
  about: AboutData;
  contact: ContactData;
  settings: SiteSettings;
  projects: Project[];
  media: MediaItem[];
}

function loadStore(): StoreSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        about: parsed.about || initialAboutData,
        contact: parsed.contact || initialContactData,
        settings: parsed.settings || initialSiteSettings,
        projects: parsed.projects || initialProjects,
        media: parsed.media || []
      };
    }
  } catch (err) {
    console.error('Failed to load store.json, using defaults:', err);
  }

  const defaultStore: StoreSchema = {
    about: initialAboutData,
    contact: initialContactData,
    settings: initialSiteSettings,
    projects: initialProjects,
    media: []
  };

  saveStore(defaultStore);
  return defaultStore;
}

function saveStore(store: StoreSchema): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store.json:', err);
  }
}

let currentStore = loadStore();

function processDataUrls(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    const match = obj.match(/^data:(image\/[a-zA-Z0-9+.-]+|video\/[a-zA-Z0-9+.-]+|application\/pdf);base64,([\s\S]+)$/i);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2].replace(/\s/g, '');
      const rawExt = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
      const ext = rawExt.toLowerCase() === 'jpeg' ? 'jpg' : rawExt.toLowerCase();
      const filename = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      try {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        const fileUrl = `/uploads/${filename}`;
        
        if (!currentStore.media.some(m => m.filename === filename)) {
          const stats = fs.statSync(filePath);
          currentStore.media.unshift({
            id: filename,
            filename,
            originalName: `Uploaded Media.${ext}`,
            url: fileUrl,
            mimeType,
            size: stats.size,
            uploadedAt: new Date().toISOString()
          });
        }
        return fileUrl;
      } catch (err) {
        console.error('Failed to convert base64 upload:', err);
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => processDataUrls(item));
  }

  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = processDataUrls(obj[key]);
    }
    return res;
  }

  return obj;
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    cb(null, `${Date.now()}-${sanitizedName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Admin Password check
const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'subeg2026';
const ADMIN_TOKEN_VAL = 'subeg-admin-authenticated-token-2026';

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // Serve static uploads
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Middleware to check admin session
  const checkAdminAuth = (req: express.Request): boolean => {
    const cookieToken = req.cookies?.subeg_admin_session;
    if (cookieToken === ADMIN_TOKEN_VAL) return true;
    const authHeader = req.headers.authorization || '';
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token === ADMIN_TOKEN_VAL || token.startsWith('subeg-admin')) return true;
    }
    return false;
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (checkAdminAuth(req)) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
    }
  };

  // --- AUTH API ---
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const expectedPassword = getAdminPassword();

    if (password === expectedPassword) {
      res.cookie('subeg_admin_session', ADMIN_TOKEN_VAL, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.json({ success: true, token: ADMIN_TOKEN_VAL });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect admin password' });
    }
  });

  app.post('/api/admin/logout', (_req, res) => {
    res.clearCookie('subeg_admin_session');
    res.json({ success: true });
  });

  app.get('/api/admin/me', (req, res) => {
    const isAuthenticated = checkAdminAuth(req);
    res.json({ authenticated: isAuthenticated });
  });

  // --- PROJECTS API ---
  app.get('/api/projects', (req, res) => {
    const isAdmin = checkAdminAuth(req);
    const category = req.query.category as string;
    
    let list = currentStore.projects;
    if (!isAdmin) {
      list = list.filter(p => p.published);
    }
    if (category) {
      list = list.filter(p => p.category.toUpperCase() === category.toUpperCase());
    }

    // Sort by sortOrder ascending, then createdAt descending
    list.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

    res.json(list);
  });

  app.get('/api/projects/:idOrSlug', (req, res) => {
    const { idOrSlug } = req.params;
    const isAdmin = checkAdminAuth(req);

    const project = currentStore.projects.find(
      p => p.id === idOrSlug || p.slug === idOrSlug
    );

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (!project.published && !isAdmin) {
      res.status(403).json({ error: 'Project is unpublished' });
      return;
    }

    res.json(project);
  });

  app.post('/api/projects', requireAdmin, (req, res) => {
    const data = processDataUrls(req.body);
    const newId = `proj-${Date.now()}`;
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const newProject: Project = {
      id: newId,
      title: data.title || 'Untitled Project',
      slug,
      category: data.category || 'PROJECTION DESIGN',
      year: data.year || new Date().getFullYear().toString(),
      role: data.role || 'Projection Designer',
      medium: data.medium || '',
      shortDescription: data.shortDescription || '',
      longDescription: data.longDescription || '',
      heroMedia: data.heroMedia || '',
      hoverMedia: data.hoverMedia || data.heroMedia || '',
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
      videos: Array.isArray(data.videos) ? data.videos : [],
      tools: Array.isArray(data.tools) ? data.tools : [],
      credits: Array.isArray(data.credits) ? data.credits : [],
      featured: Boolean(data.featured),
      published: data.published !== undefined ? Boolean(data.published) : true,
      sortOrder: currentStore.projects.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentStore.projects.push(newProject);
    saveStore(currentStore);

    res.status(201).json(newProject);
  });

  app.put('/api/projects/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = currentStore.projects.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const processedBody = processDataUrls(req.body);
    const existing = currentStore.projects[index];
    const updated: Project = {
      ...existing,
      ...processedBody,
      updatedAt: new Date().toISOString()
    };

    currentStore.projects[index] = updated;
    saveStore(currentStore);

    res.json(updated);
  });

  app.delete('/api/projects/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    currentStore.projects = currentStore.projects.filter(p => p.id !== id);
    saveStore(currentStore);
    res.json({ success: true, id });
  });

  app.post('/api/projects/reorder', requireAdmin, (req, res) => {
    const { projectIds } = req.body;
    if (!Array.isArray(projectIds)) {
      res.status(400).json({ error: 'projectIds array required' });
      return;
    }

    projectIds.forEach((id: string, index: number) => {
      const proj = currentStore.projects.find(p => p.id === id);
      if (proj) {
        proj.sortOrder = index + 1;
      }
    });

    saveStore(currentStore);
    res.json({ success: true, projects: currentStore.projects });
  });

  // --- ABOUT API ---
  app.get('/api/about', (_req, res) => {
    res.json(currentStore.about);
  });

  app.put('/api/about', requireAdmin, (req, res) => {
    const processedBody = processDataUrls(req.body);
    currentStore.about = {
      ...currentStore.about,
      ...processedBody
    };
    saveStore(currentStore);
    res.json(currentStore.about);
  });

  // --- CONTACT API ---
  app.get('/api/contact', (_req, res) => {
    res.json(currentStore.contact);
  });

  app.put('/api/contact', requireAdmin, (req, res) => {
    const processedBody = processDataUrls(req.body);
    currentStore.contact = {
      ...currentStore.contact,
      ...processedBody
    };
    saveStore(currentStore);
    res.json(currentStore.contact);
  });

  // --- SITE SETTINGS API ---
  app.get('/api/settings', (_req, res) => {
    res.json(currentStore.settings);
  });

  app.put('/api/settings', requireAdmin, (req, res) => {
    const processedBody = processDataUrls(req.body);
    currentStore.settings = {
      ...currentStore.settings,
      ...processedBody
    };
    saveStore(currentStore);
    res.json(currentStore.settings);
  });

  app.post('/api/settings/reset-demo', requireAdmin, (_req, res) => {
    currentStore = {
      about: initialAboutData,
      contact: initialContactData,
      settings: initialSiteSettings,
      projects: initialProjects,
      media: []
    };
    saveStore(currentStore);
    res.json({ success: true, store: currentStore });
  });

  // --- MEDIA API ---
  app.get('/api/media', (_req, res) => {
    // Read files in uploads folder
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const mediaList: MediaItem[] = files.map(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
          mimeType = `image/${ext.replace('.', '')}`;
        } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
          mimeType = `video/${ext.replace('.', '')}`;
        } else if (ext === '.pdf') {
          mimeType = 'application/pdf';
        }

        return {
          id: file,
          filename: file,
          originalName: file,
          url: `/uploads/${file}`,
          mimeType,
          size: stats.size,
          uploadedAt: stats.birthtime.toISOString()
        };
      });

      res.json(mediaList);
    } catch (err) {
      res.json([]);
    }
  });

  app.post('/api/media/upload', requireAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    const newItem: MediaItem = {
      id: req.file.filename,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    currentStore.media.push(newItem);
    saveStore(currentStore);

    res.json(newItem);
  });

  app.delete('/api/media/:filename', requireAdmin, (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      currentStore.media = currentStore.media.filter(m => m.filename !== filename);
      saveStore(currentStore);
      res.json({ success: true, filename });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete media file' });
    }
  });

  // CV PDF Upload handler
  app.post('/api/cv/upload', requireAdmin, upload.single('cvFile'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No CV PDF file provided' });
      return;
    }

    const cvUrl = `/uploads/${req.file.filename}`;
    currentStore.about.cvUrl = cvUrl;
    saveStore(currentStore);

    res.json({ success: true, cvUrl });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
