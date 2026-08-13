import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const CMS_BASE = `${API_BASE}/public`;
export const UPLOAD_BASE = `${API_BASE}/upload`;
export const ADMIN_BASE  = `${API_BASE}/admin`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CMSService {
  _id: string;
  title: string;
  description: string;
  features: string[];
  benefits: string[];
  image?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export interface CMSBanner {
  _id: string;
  title: string;
  text?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  location: string;
  active: boolean;
}

export interface CMSHeroSlide {
  _id: string;
  title: string;
  highlightText?: string;
  description?: string;
  image: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  sortOrder: number;
  active: boolean;
}

export interface CMSTestimonial {
  _id: string;
  name: string;
  photo?: string;
  rating: number;
  message: string;
  approved: boolean;
  sortOrder: number;
}

export interface CMSGalleryAlbum {
  _id: string;
  title: string;
  category: string;
  images: string[];
  videos: string[];
  active: boolean;
  sortOrder: number;
}

export interface CMSFAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
}

export interface CMSPackage {
  _id: string;
  name: string;
  displayName: string;
  price: number;
  currency?: string;
  description?: string;
  features: string[];
  badge?: string;
  featured: boolean;
  isActive: boolean;
  popular?: boolean;
  sortOrder: number;
}

export type CMSResource =
  | 'services'
  | 'banners'
  | 'heroslides'
  | 'testimonials'
  | 'gallery'
  | 'settings'
  | 'faqs'
  | 'packages';

interface CMSState {
  services:     CMSService[];
  banners:      CMSBanner[];
  heroSlides:   CMSHeroSlide[];
  testimonials: CMSTestimonial[];
  gallery:      CMSGalleryAlbum[];
  faqs:         CMSFAQ[];
  packages:     CMSPackage[];
  settings:     Record<string, string>;
  loading:      boolean;
  error:        string | null;
}

const DEFAULT_RESOURCES: CMSResource[] = [
  'services', 'banners', 'heroslides', 'testimonials', 'gallery', 'settings', 'faqs', 'packages',
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCMS(resources: CMSResource[] = DEFAULT_RESOURCES) {
  const resourceKey = resources.join(',');

  const [state, setState] = useState<CMSState>({
    services:     [],
    banners:      [],
    heroSlides:   [],
    testimonials: [],
    gallery:      [],
    faqs:         [],
    packages:     [],
    settings:     {},
    loading:      true,
    error:        null,
  });

  useEffect(() => {
    let cancelled = false;
    const list = resourceKey.split(',') as CMSResource[];

    async function fetchAll() {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const results: Partial<CMSState> = {};

      await Promise.all(
        list.map(async (resource) => {
          try {
            const res  = await fetch(`${CMS_BASE}/${resource}`);
            const json = await res.json();
            if (!json.success) return;
            switch (resource) {
              case 'services':     results.services     = json.services     ?? []; break;
              case 'banners':      results.banners      = json.banners      ?? []; break;
              case 'heroslides':   results.heroSlides   = json.slides       ?? []; break;
              case 'testimonials': results.testimonials = json.testimonials ?? []; break;
              case 'gallery':      results.gallery      = json.gallery      ?? []; break;
              case 'faqs':         results.faqs         = json.faqs         ?? []; break;
              case 'packages':     results.packages     = json.packages     ?? []; break;
              case 'settings':     results.settings     = json.settings     ?? {}; break;
            }
          } catch { /* non-fatal */ }
        }),
      );

      if (!cancelled) setState(prev => ({ ...prev, ...results, loading: false }));
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [resourceKey]);

  return state;
}

// ─── Image upload helpers ─────────────────────────────────────────────────────

/** Upload any file (image or video) directly to Cloudinary from the browser. */
export async function uploadToCloudinary(
  file: File,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return { success: false, error: 'Cloudinary not configured' };
  }

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'eternarest/memorials');
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body:   formData,
    });
    const json = await res.json();
    if (json.secure_url) return { success: true, url: json.secure_url };
    return { success: false, error: json.error?.message ?? 'Cloudinary upload failed' };
  } catch {
    return { success: false, error: 'Network error during upload' };
  }
}

/** Upload memorial media (photos/videos) — direct browser → Cloudinary. */
export async function uploadMemorialMedia(
  file: File,
  _token?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  return uploadToCloudinary(file);
}

/** Upload CMS image — direct browser → Cloudinary (same as memorial media). */
export async function uploadCMSImage(
  file: File,
  _token?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return { success: false, error: 'Cloudinary not configured (check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET)' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'eternarest/cms');
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body:   formData,
    });
    const json = await res.json();
    if (json.secure_url) return { success: true, url: json.secure_url };
    return { success: false, error: json.error?.message ?? 'Cloudinary upload failed' };
  } catch {
    return { success: false, error: 'Network error during upload' };
  }
}

// ─── Contact form submit helper ───────────────────────────────────────────────

export async function submitContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${CMS_BASE}/contact`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: 'Network error — please try again.' };
  }
}
