/**
 * Institutional Next.js Image Loader
 *
 * Routes image requests through wsrv.nl for elite WebP compression,
 * caching, and resizing before it even hits the browser's main thread.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src) return '';

  // Normalize protocol-relative or malformed absolute paths
  let workingPath = src;
  if (workingPath.startsWith('//')) {
    workingPath = 'https:' + workingPath;
  } else if (workingPath.startsWith('/http')) {
    workingPath = workingPath.substring(1);
  }

  // Handle local assets (must be served as-is in Electron/Static)
  if (
    workingPath.startsWith('/') && 
    !workingPath.startsWith('/t/p/') && 
    (workingPath.startsWith('/_next/') || 
     workingPath.startsWith('/images/') || 
     workingPath.startsWith('/icons/') || 
     workingPath.startsWith('/providers/') || 
     workingPath.startsWith('/brand/') ||
     workingPath.startsWith('/avatars/') ||
     workingPath.includes('placeholder'))
  ) {
    return workingPath;
  }

  // If it's already a full URL, proxy it if it's not already proxied
  if (workingPath.startsWith('http')) {
    // If it's already a wsrv.nl URL, we should try to update the width parameter
    if (workingPath.includes('wsrv.nl')) {
      const urlMatch = workingPath.match(/[?&]url=([^&]+)/);
      if (urlMatch && urlMatch[1]) {
        const originalUrl = decodeURIComponent(urlMatch[1]);
        const q = quality || 80;
        return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=${width}&output=webp&q=${q}`;
      }
      return workingPath;
    }
    
    const q = quality || 80;
    return `https://wsrv.nl/?url=${encodeURIComponent(workingPath)}&w=${width}&output=webp&q=${q}`;
  }

  // Handle TMDB relative paths
  let cleanPath = workingPath;
  
  // Strip TMDB prefix if present (e.g., /t/p/w500/abc.jpg -> /abc.jpg)
  if (cleanPath.startsWith('/t/p/')) {
    const tmdbMatch = cleanPath.match(/\/t\/p\/[^/]+(\/.*)$/);
    if (tmdbMatch && tmdbMatch[1]) {
      cleanPath = tmdbMatch[1];
    }
  }

  // Ensure leading slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  // Fallback assumption: it's a TMDB path
  const baseUrl = `https://image.tmdb.org/t/p/original${cleanPath}`;

  const q = quality || 80;
  return `https://wsrv.nl/?url=${encodeURIComponent(baseUrl)}&w=${width}&output=webp&q=${q}`;
}
