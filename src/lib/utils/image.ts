/**
 * Image Utility
 *
 * Centralized logic for generating optimized image URLs, enforcing WebP,
 * and handling fallbacks. This ensures consistent performance across the app.
 */

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Generates an optimized TMDB image URL with WebP conversion via proxy.
 *
 * @param path The TMDB image path (e.g., /path.jpg)
 * @param size Desired size ('original', 'w500', 'w780', etc.)
 * @returns Fully qualified, optimized URL
 */
export function getOptimizedImageUrl(path: string | null | undefined, size: string = 'w500'): string {
  if (!path || path === '') return '/images/placeholder.png';

  // If it's already a wsrv.nl URL, we might want to change the size/quality
  if (path.includes('wsrv.nl')) {
    try {
      const urlObj = new URL(path);
      const originalUrl = urlObj.searchParams.get('url');
      if (originalUrl) {
        // Strip the current wsrv.nl wrapper and re-optimize with new parameters
        return getOptimizedImageUrl(originalUrl, size);
      }
    } catch {
      // If URL parsing fails, just return as is to avoid crash
      return path;
    }
    return path;
  }

  // Handle full URLs if passed accidentally
  if (path.startsWith('http')) {
    // If it's already a TMDB URL, we can still optimize it by stripping to the filename
    if (path.includes('image.tmdb.org')) {
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      if (filename && filename.includes('.')) {
        return getOptimizedImageUrl(filename, size);
      }
    }

    // Wrap ANY external URL in wsrv.nl to ensure WebP and consistent sizing
    return `https://wsrv.nl/?url=${encodeURIComponent(path)}&output=webp&q=80`;
  }

  // Handle local/internal paths or placeholders
  if (path.startsWith('/') && !path.startsWith('/t/p/')) {
    if (
      path.startsWith('/images/') ||
      path.startsWith('/providers/') ||
      path.startsWith('/brand/') ||
      path.includes('placeholder')
    ) {
      return path;
    }
  }

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Map requested size to optimized variants
  let targetSize = size;
  if (size === 'original') targetSize = 'w1280';
  else if (size === 'w500' || size === 'poster') targetSize = 'w500';
  else if (size === 'backdrop' || size === 'landscape' || size === '16:9' || size === '21:9') targetSize = 'w780';
  else if (size === 'ambiance') targetSize = 'w185';

  // Ensure we fall back to a valid TMDB size if an unknown string is passed
  const validSizes = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'w1280', 'original'];
  if (!validSizes.includes(targetSize)) {
    targetSize = 'w500';
  }

  const tmdbUrl = `${TMDB_IMAGE_BASE}/${targetSize}/${cleanPath}`;

  // Wrap in wsrv.nl for mandatory WebP and high-performance CDN delivery
  return `https://wsrv.nl/?url=${encodeURIComponent(tmdbUrl)}&output=webp&q=80`;
}

/**
 * Special helper for backdrops to ensure they are optimized for large screens but performant.
 */
export function getBackdropUrl(path: string | null | undefined): string {
  return getOptimizedImageUrl(path, 'backdrop');
}

/**
 * Special helper for posters.
 */
export function getPosterUrl(path: string | null | undefined): string {
  return getOptimizedImageUrl(path, 'w500');
}
