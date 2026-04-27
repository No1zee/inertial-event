'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Film, Tv, Zap, Bookmark, Command, History, Star } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useLayoutState, useLayoutActions, useUIStore } from '@/lib/stores/uiStore';
import { SearchBar } from '@/components/content/SearchBar';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { searchContentServer } from '@/lib/actions/content';
import { Content } from '@/lib/types/content';
import { useUISounds } from '@/hooks/useUISounds';

export const CommandCenter: React.FC = () => {
  const router = useRouter();
  const { isCommandCenterOpen } = useLayoutState();
  const { setCommandCenterOpen } = useLayoutActions();
  const { playSound } = useUISounds();

  const { openContentModal } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Content[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchContentServer(query);
        setResults(data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandCenterOpen(!isCommandCenterOpen);
      }
      if (e.key === 'Escape' && isCommandCenterOpen) {
        setCommandCenterOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandCenterOpen, setCommandCenterOpen]);

  const handleSearch = (query: string, isAi?: boolean) => {
    setCommandCenterOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}&ai=${isAi}`);
  };

  const shortcuts = [
    { label: 'Cinema', icon: Film, href: '/browse/movies', desc: 'Feature Films' },
    { label: 'Broadcast', icon: Tv, href: '/browse/tv-shows', desc: 'Serialized Content' },
    { label: 'Vanguard', icon: Zap, href: '/browse/anime', desc: 'Anime Collection' },
    { label: 'Records', icon: History, href: '/history', desc: 'Watch History' },
    { label: 'Archives', icon: Bookmark, href: '/watchlist', desc: 'Curated Watchlist' },
  ];

  return (
    <AnimatePresence>
      {isCommandCenterOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandCenterOpen(false)}
            className="fixed inset-0 bg-background/90 backdrop-blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.99, filter: 'blur(10px)' }}
            transition={{
              type: 'spring',
              damping: 35,
              stiffness: 400,
              mass: 0.8,
            }}
            className="relative w-full max-w-6xl h-[700px] bg-surface-elevated border border-border rounded-[3.5rem] shadow-cinematic overflow-hidden flex"
          >
            <div className="w-[300px] border-r border-border bg-surface-deep flex flex-col">
              <div className="p-10 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                    <Command size={16} />
                  </div>
                  <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Console</h2>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-2">
                {shortcuts.map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.href);
                      setCommandCenterOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] text-left group transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-primary group-hover:border-primary/20 transition-all duration-500">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground/60 font-medium group-hover:text-muted-foreground transition-colors uppercase tracking-tighter">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-10 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-foreground tracking-widest uppercase">Active</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-background">
              <div className="p-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-16 px-4">
                  <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase">Search</h3>
                  <button
                    onClick={() => {
                      playSound('click');
                      setCommandCenterOpen(false);
                    }}
                    className="h-14 w-14 rounded-full bg-surface-deep border border-border text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                    aria-label="Close command center"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="px-4 mb-8">
                  <SearchBar
                    variant="compact"
                    onSearch={handleSearch}
                    onChange={setQuery}
                    placeholder="Direct your search..."
                  />
                </div>

                <div className="mt-4 px-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                      {query
                        ? isSearching
                          ? 'Processing...'
                          : `${results.length} Matches Found`
                        : 'Cinematic Registry'}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {query ? (
                      <div className="grid grid-cols-1 gap-2">
                        {results.map(item => (
                          <button
                            key={item.id}
                            onMouseEnter={() => playSound('hover')}
                            onClick={() => {
                              playSound('click');
                              setCommandCenterOpen(false);
                              openContentModal(item);
                            }}
                            className="w-full flex items-center gap-6 p-4 rounded-[1.5rem] bg-surface-deep/50 hover:bg-surface-elevated border border-white/5 hover:border-primary/20 transition-all group"
                          >
                            <div className="w-16 aspect-video rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/40 transition-all">
                              <OptimizedImage
                                src={item.backdrop || item.poster}
                                alt={item.title}
                                width={64}
                                height={36}
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                {item.releaseDate?.substring(0, 4)} • {item.type}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 font-black text-[9px] uppercase tracking-widest">
                              <Star size={10} fill="currentColor" />
                              {item.rating?.toFixed(1)}
                            </div>
                          </button>
                        ))}
                        {results.length === 0 && !isSearching && (
                          <div className="py-20 text-center">
                            <div className="text-zinc-600 font-black uppercase tracking-[0.3em] italic">
                              No results found in archive.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-8">
                        <div className="p-8 rounded-[2.5rem] bg-surface-deep border border-border flex items-center gap-6 group hover:border-primary/20 cursor-pointer transition-all">
                          <div className="w-16 h-16 rounded-full bg-surface-elevated overflow-hidden border border-border group-hover:border-primary/40 transition-border">
                            <OptimizedImage
                              src={getOptimizedImageUrl('/4v9Y3u286p2S7f0tDToKz6o3G7y.jpg', 'w200')}
                              alt="Ryan Reynolds"
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-black text-foreground tracking-tight uppercase group-hover:text-primary transition-colors">
                              Ryan Reynolds
                            </div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                              Trending
                            </div>
                          </div>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex items-center gap-6 group hover:border-primary/40 cursor-pointer transition-all">
                          <div className="w-16 h-16 rounded-2xl bg-primary border border-primary/40 flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                            <Sparkles size={24} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-foreground tracking-tight uppercase transition-colors">
                              Neural Sync
                            </div>
                            <div className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">
                              Matched
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-14 py-8 bg-surface-deep border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-12">
                  <div className="flex items-center gap-4">
                    <kbd className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-[10px] font-black text-muted-foreground">
                      ESC
                    </kbd>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Abort</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-[10px] font-black text-muted-foreground">
                      RET
                    </kbd>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Execute
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
