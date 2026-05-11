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

  // Normalize path and ensure it starts with / for local check, but keep original for external URLs
  let workingPath = path;
  if (workingPath.startsWith('//')) {
    workingPath = 'https:' + workingPath;
  } else if (workingPath.startsWith('/http')) {
    workingPath = workingPath.substring(1);
  }

  const normalizedPath = workingPath.startsWith('/') ? workingPath : `/${workingPath}`;
  const isLocalAsset = 
    normalizedPath.startsWith('/images/') ||
    normalizedPath.startsWith('/providers/') ||
    normalizedPath.startsWith('/brand/') ||
    normalizedPath.startsWith('/avatars/') ||
    normalizedPath.startsWith('/icons/') ||
    normalizedPath.includes('placeholder');

  if (isLocalAsset) {
    return normalizedPath;
  }

  // If it's already a wsrv.nl URL, return as-is
  if (workingPath.includes('wsrv.nl')) {
    return workingPath;
  }


  // Handle full URLs
  if (workingPath.startsWith('http')) {
    // If it's a TMDB URL, we can still optimize it by ensuring we use wsrv.nl proxy
    if (workingPath.includes('image.tmdb.org')) {
      const tmdbMatch = workingPath.match(/\/t\/p\/[^/]+(\/.*)$/);
      if (tmdbMatch && tmdbMatch[1]) {
        return getOptimizedImageUrl(tmdbMatch[1], size);
      }
      
      const parts = workingPath.split('/');
      const filename = parts[parts.length - 1];
      if (filename && filename.includes('.') && filename.length > 4) {
        return getOptimizedImageUrl(filename, size);
      }
    }
    
    // For other external URLs, use wsrv.nl
    return `https://wsrv.nl/?url=${encodeURIComponent(workingPath)}&output=webp&q=80`;
  }

  // If we reach here, it's either a TMDB path (e.g. /abc.jpg) or a TMDB path with prefix (e.g. /t/p/w500/abc.jpg)
  
  // Strip TMDB prefix if present
  let cleanPath = workingPath;
  if (cleanPath.startsWith('/t/p/')) {
    const tmdbMatch = cleanPath.match(/\/t\/p\/[^/]+(\/.*)$/);
    if (tmdbMatch && tmdbMatch[1]) {
      cleanPath = tmdbMatch[1];
    }
  }
  
  // Normalize leading slash for TMDB relative paths
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  // Map requested size to optimized variants
  let targetSize = size;
  if (size === 'original' || size === 'banner') targetSize = 'w1280';
  else if (size === 'w500' || size === 'poster') targetSize = 'w500';
  else if (size === 'backdrop' || size === 'landscape' || size === '16:9' || size === '21:9') targetSize = 'w780';
  else if (size === 'ambiance') targetSize = 'w185';

  const validSizes = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'w1280', 'original'];
  if (!validSizes.includes(targetSize)) {
    targetSize = 'w500';
  }

  const tmdbUrl = `${TMDB_IMAGE_BASE}/${targetSize}/${cleanPath}`;
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
