/**
 * Institutional Next.js Image Loader
 *
 * Routes image requests through wsrv.nl for elite WebP compression,
 * caching, and resizing before it even hits the browser's main thread.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src) return '';

  // Don't optimize local images already in public folder (unless they look like TMDB paths)
  const isTmdbPath = src.startsWith('/t/p/') || (/^\/[a-zA-Z0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(src));
  if (src.startsWith('/') && !isTmdbPath) {
    return src;
  }

  // If it's already a wsrv URL, we extract the base URL to avoid double-wrapping
  let baseUrl = src;
  if (src.includes('wsrv.nl')) {
    try {
      const urlObj = new URL(src);
      const extracted = urlObj.searchParams.get('url');
      if (extracted) baseUrl = extracted;
    } catch {
      // Fallback to src if parsing fails
    }
  }

  // Handle TMDB relative paths
  if (isTmdbPath || (!src.startsWith('http') && src.length > 5)) {
    if (!src.includes('http')) {
      baseUrl = `https://image.tmdb.org/t/p/original${src.startsWith('/') ? '' : '/'}${src}`;
    }
  }

  const q = quality || 80;
  return `https://wsrv.nl/?url=${encodeURIComponent(baseUrl)}&w=${width}&output=webp&q=${q}`;
}
