import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lac`
  }
  return `₹${price.toLocaleString('en-IN')}`
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('en-IN')} sq.ft`
}

/**
 * Auto-optimizes Cloudinary media URLs with f_auto, q_auto and width limits
 * ensuring 0% bandwidth wastage on the free tier.
 */
export function getOptimizedCloudinaryUrl(url?: string | null, width?: number): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes('res.cloudinary.com')) return trimmed;
  // Skip raw resources & PDFs
  if (trimmed.includes('/raw/upload/') || trimmed.toLowerCase().endsWith('.pdf')) {
    return trimmed;
  }
  const transform = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  if (!trimmed.includes('/f_auto')) {
    if (trimmed.includes('/image/upload/')) {
      return trimmed.replace('/image/upload/', `/image/upload/${transform}/`);
    }
    if (trimmed.includes('/upload/')) {
      return trimmed.replace('/upload/', `/upload/${transform}/`);
    }
  }
  return trimmed;
}

export function getImageUrl(img: any, fallback: string = '', width?: number): string {
  if (!img) return fallback;
  if (typeof img === 'string') return getOptimizedCloudinaryUrl(img, width) || fallback;
  if (typeof img === 'object') {
    const raw = img.url || img.src || img.secure_url || img.public_id || '';
    return getOptimizedCloudinaryUrl(raw, width) || fallback;
  }
  return fallback;
}
