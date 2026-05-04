'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, FileVideo, Home, ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
  size: number;
}

export function FileExplorer() {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string>('/'); // Default to root or a safe start
  const [items, setItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load directory function - must be defined before useEffect
  const loadDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Detect if we are in production (Vercel) vs local development
      const isProd = typeof window !== 'undefined' && 
                    (window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('novastream.media'));

      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      
      const apiUrl = isHttps 
        ? '/api/proxy' 
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

      const encodedPath = encodeURIComponent(path);
      
      // Add a timeout to the fetch to detect bridge unavailability quickly
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        // Logic moved to apiUrl selection above

        const res = await fetch(`${apiUrl}/tunnel/list?path=${encodedPath}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to load directory');

        const data = (await res.json()) as { files: FileItem[]; path: string };

        const sorted = (data.files || []).sort((a: FileItem, b: FileItem) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });

        setItems(sorted);
        setCurrentPath(data.path);
      } catch (fetchErr) {
        if (fetchErr instanceof Error && fetchErr.message.includes('Security Block')) {
          throw fetchErr;
        }
        if (isProd) {
          throw new Error('LAN Tunnel Unavailable in Cloud. Ensure the NovaStream bridge is running and reachable.');
        } else {
          throw new Error('Local Bridge Not Found. Ensure the NovaStream background process is running on port 5000.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  const handleNavigate = (path: string) => {
    loadDirectory(path);
  };

  const handleUp = () => {
    if (currentPath === '/' || currentPath === '' || currentPath.match(/^[a-zA-Z]:\\?$/)) return;
    
    const separator = currentPath.includes('\\') ? '\\' : '/';
    const parts = currentPath.split(separator).filter(Boolean);
    
    if (parts.length > 0) {
      parts.pop();
      const parent = parts.join(separator) || (separator === '\\' ? currentPath.split(separator)[0] + '\\' : '/');
      loadDirectory(parent);
    }
  };

  const handlePlay = (item: FileItem) => {
    // Navigate to watch page with special local file ID
    // We'll need to handle this in /watch/[id] page to recognize "local:" prefix or query param
    const encodedPath = encodeURIComponent(item.path);
    router.push(`/watch?id=local&path=${encodedPath}&name=${encodeURIComponent(item.name)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-white/5">
        <button
          onClick={handleUp}
          disabled={isLoading}
          aria-label="Go up one level"
          title="Go up one level"
          className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 font-mono text-sm text-zinc-400">
          <Home size={16} className="shrink-0" />
          <span className="text-zinc-600">/</span>
          <span className="text-white whitespace-nowrap">{currentPath}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">Error: {error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map(item => (
          <div
            key={item.path}
            onClick={() => (item.isDirectory ? handleNavigate(item.path) : handlePlay(item))}
            className={cn(
              'group flex items-center gap-3 p-3 rounded-lg border border-white/5 transition-all cursor-pointer',
              item.isDirectory
                ? 'bg-zinc-900/50 hover:bg-zinc-800 hover:border-white/10'
                : 'bg-zinc-950 hover:bg-zinc-900 hover:border-red-500/20'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                item.isDirectory
                  ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20'
                  : 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20'
              )}
            >
              {item.isDirectory ? <Folder size={20} /> : <FileVideo size={20} />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-white truncate group-hover:text-red-500 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-zinc-500 truncate">{item.isDirectory ? 'Folder' : 'Media File'}</p>
            </div>

            {!item.isDirectory && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={16} className="text-white fill-current" />
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && !isLoading && !error && (
          <div className="col-span-full py-12 text-center text-zinc-500">This folder is empty.</div>
        )}
      </div>
    </div>
  );
}
