export type ProjectCategory = 'PROJECTION DESIGN' | 'IMMERSIVE MEDIA';

export interface ProjectCredit {
  role: string;
  name: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  year: string;
  role: string;
  medium: string;
  shortDescription: string;
  longDescription: string;
  heroMedia: string;
  hoverMedia: string;
  gallery: string[];
  videos: string[];
  tools: string[];
  credits: ProjectCredit[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AboutData {
  name: string;
  title: string;
  primaryPractice: string;
  secondaryPractice: string;
  introduction: string;
  background: string;
  practiceDescription: string;
  capabilities: string[];
  cvUrl: string;
  photoUrl?: string;
}

export interface ContactData {
  email: string;
  location: string;
  additionalLinks: { label: string; url: string }[];
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  socialLinks: { label: string; url: string }[];
  adminPasswordInfo: string;
}

export type PublicNavSection = 'ABOUT' | 'PROJECTION DESIGN' | 'IMMERSIVE MEDIA' | 'CONTACT';
