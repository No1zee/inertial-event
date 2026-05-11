'use client';

import * as React from 'react';
import { useNavigationState, useNavigationActions } from '@/lib/stores/uiStore';
import { useWatchHistory, useCollections, useWatchHistoryActions } from '@/lib/stores/localDataStore';
import { Home, Compass, Clock, Bookmark, Settings, X, Tv, Film, Folder, User, Library, Zap } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SidebarItem } from './SidebarItem';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PROVIDERS } from '@/lib/constants/providers';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  hoverColor?: string;
  logo?: string;
}

const navGroups = [
  {
    title: 'Browse',
    items: [
      { label: 'Home', icon: Home, href: '/' },
      { label: 'Shorts', icon: Zap, href: '/shorts' },
      { label: 'Movies', icon: Film, href: '/browse/movies' },
      { label: 'TV Shows', icon: Tv, href: '/browse/tv-shows' },
      { label: 'Live TV', icon: Tv, href: '/tv' },
    ],
  },
  {
    title: 'Library',
    items: [
      { label: 'Watchlist', icon: Bookmark, href: '/watchlist' },
      { label: 'History', icon: Clock, href: '/history' },
      { label: 'My Lists', icon: Library, href: '/collections' },
    ],
  },
  {
    title: 'Channels',
    items: PROVIDERS.map(p => ({
      label: p.name,
      icon: p.slug === 'acu' ? Zap : Film, // Fallback icons
      href: `/channel/${p.id}`,
      logo: p.logo,
      hoverColor: p.color,
    })),
  },
];
  
  export function Sidebar() {
    const { sidebarOpen } = useNavigationState();
    const { setSidebarOpen } = useNavigationActions();
    const [isHovered, setIsHovered] = React.useState(false);
    const pathname = usePathname();
  
    // Dynamic Data
    const watchHistory = useWatchHistory();
    const { removeFromWatchHistory } = useWatchHistoryActions();
    const collections = useCollections();
  
    const historyCount = watchHistory.length;
    const watchlistCount = collections.find(c => c.id === 'watch-later')?.items.length || 0;
  
    const recentlyPlayed = React.useMemo(() => {
      const distinct = new Map();
      watchHistory.forEach(item => {
        if (!distinct.has(item.contentId)) {
          distinct.set(item.contentId, item);
        }
      });
      return Array.from(distinct.values()).slice(0, 3);
    }, [watchHistory]);
  
    // Determine effective expansion state
    // On desktop (>= 1024px), we expand on hover.
    // On mobile (< 1024px), we use the global sidebarOpen state.
    const [isDesktop, setIsDesktop] = React.useState(false);
  
    React.useEffect(() => {
      const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
      checkDesktop();
      window.addEventListener('resize', checkDesktop);
      return () => window.removeEventListener('resize', checkDesktop);
    }, []);
  
    const isExpanded = isDesktop ? isHovered : sidebarOpen;
  
    return (
      <>
        {/* Mobile Overlay */}
        <AnimatePresence>
          {!isDesktop && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 z-[400] backdrop-blur-md"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
  
        {/* Main Sidebar Chassis */}
        <motion.aside
          onMouseEnter={() => isDesktop && setIsHovered(true)}
          onMouseLeave={() => isDesktop && setIsHovered(false)}
          initial={false}
          animate={{
            width: isExpanded ? (isDesktop ? 280 : 300) : isDesktop ? 88 : 0,
            x: !isDesktop && !sidebarOpen ? -320 : 0,
            opacity: !isDesktop && !sidebarOpen ? 0 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 220,
            damping: 28,
          }}
          className={cn(
            'fixed top-0 left-0 z-[500] h-screen flex flex-col',
            'bg-[hsl(var(--background))/0.6] border-r border-border transition-colors duration-500',
            'backdrop-blur-[40px]',
            'liquid-glass border-none shadow-cinematic',
            isHovered && 'bg-[hsl(var(--surface-elevated))/0.8]'
          )}
        >
          {/* Header / Logo */}
          <div
            className={cn(
              'h-24 flex items-center border-b border-border/30 shrink-0 transition-all duration-500',
              isExpanded ? 'px-8 justify-between' : 'px-0 justify-center'
            )}
          >
            <Link href="/" onClick={() => !isDesktop && setSidebarOpen(false)}>
              <Logo size="md" showText={isExpanded} />
            </Link>
            {isExpanded && !isDesktop && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                aria-label="Close sidebar"
                data-testid="close-sidebar"
              >
                <X size={20} />
              </button>
            )}
          </div>
  
          {/* Main Navigation Stack */}
          <div className="flex-1 overflow-y-auto pt-8 pb-4 space-y-8 custom-scrollbar">
          {navGroups.map(group => (
            <div key={group.title} className="space-y-3">
              <AnimatePresence>
                {isExpanded && (
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="px-8 text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap"
                  >
                    {group.title}
                  </motion.h3>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {group.items.map(item => {
                  let count = undefined;
                  if (item.label === 'History') count = historyCount;
                  if (item.label === 'Watchlist') count = watchlistCount;
                  if (item.label === 'Movies' || item.label === 'TV Shows') {
                    // Optional: add counts for these too if needed
                  }

                  return (
                    <SidebarItem
                      key={item.href}
                      {...item}
                      isOpen={isExpanded}
                      isActive={pathname === item.href}
                      count={count}
                      isApp={group.title === 'Channels'}
                      hoverColor={(item as NavItem).hoverColor}
                      customIcon={
                        (item as NavItem).logo ? (
                          <div
                            className={cn(
                              'relative w-5 h-5 transition-opacity duration-300',
                              group.title === 'Channels'
                                ? 'w-full h-full opacity-100'
                                : 'opacity-60 group-hover/item:opacity-100'
                            )}
                          >
                            <OptimizedImage
                              src={(item as NavItem).logo!}
                              alt={item.label}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : undefined
                      }
                      onClick={() => {
                        if (!isDesktop) setSidebarOpen(false);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Recently Played Quick Access */}
          {isExpanded && recentlyPlayed.length > 0 && (
            <div className="px-8 pt-4 space-y-4">
              <h3 className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em]">Resuming</h3>
              <div className="space-y-3">
                {recentlyPlayed.map(item => {
                  const isRecent = Date.now() - item.lastWatched < 300000; // 5 minutes
                  const timeSince = (date: number) => {
                    const seconds = Math.floor((Date.now() - date) / 1000);
                    if (seconds < 60) return 'Just now';
                    const minutes = Math.floor(seconds / 60);
                    if (minutes < 60) return `${minutes}m`;
                    return `${Math.floor(minutes / 60)}h`;
                  };
                  return (
                    <div key={item.id} className="group/item relative">
                      <Link
                        href={
                          item.type === 'movie'
                            ? `/watch?id=${item.contentId}&type=movie${item.providerId ? `&provider=${item.providerId}` : ''}`
                            : `/watch?id=${item.contentId}&type=tv&season=${item.season || 1}&episode=${item.episode || 1}${item.providerId ? `&provider=${item.providerId}` : ''}`
                        }
                        className="flex items-center gap-3 group/played transition-all duration-300 hover:translate-x-1 pr-6"
                        aria-label={`Resume ${item.title}`}
                        data-testid={`resume-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border/10 group-hover/played:border-primary/30 bg-surface-deep">
                          <OptimizedImage
                            src={item.poster || ''}
                            alt={item.title}
                            fill
                            className="object-cover opacity-60 group-hover/played:opacity-100 transition-opacity"
                            sizes="40px"
                          />
                          {isRecent && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-[11px] font-bold text-muted-foreground group-hover/played:text-foreground truncate transition-colors">
                                {item.title}
                              </p>
                              {item.providerId && (
                                <span
                                  className={cn(
                                    'text-[7px] font-black uppercase px-1 rounded-sm tracking-tighter shrink-0',
                                    item.providerId === 'acu'
                                      ? 'bg-amber-400 text-black shadow-[0_0_5px_rgba(251,191,36,0.5)]'
                                      : item.providerId === 'netflix'
                                        ? 'bg-red-600 text-white shadow-[0_0_5px_rgba(220,38,38,0.5)]'
                                        : item.providerId === 'hulu'
                                          ? 'bg-[#1ce783] text-black shadow-[0_0_5px_rgba(28,231,131,0.5)]'
                                          : 'bg-surface-elevated text-foreground/50'
                                  )}
                                >
                                  {item.providerId === 'acu' ? 'A' : item.providerId.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-muted-foreground shrink-0">
                              {timeSince(item.lastWatched)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="h-0.5 flex-1 bg-foreground/5 rounded-full overflow-hidden max-w-[60px]">
                              <motion.div
                                className="h-full bg-red-600/60"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">
                              {item.progress > 90 ? 'Done' : `${Math.round(item.progress)}%`}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFromWatchHistory(item.id);
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover/item:opacity-100 transition-all hover:text-red-500 bg-background/80 rounded-md backdrop-blur-sm border border-border/10"
                        title="Remove from history"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chassis Footer */}
        <div
          className={cn(
            'p-6 border-t border-border/30 bg-linear-to-t from-primary/5 to-transparent shrink-0 transition-all duration-500',
            !isExpanded && 'px-0 flex justify-center'
          )}
        >
          <SidebarItem
            label="Settings"
            icon={Settings}
            href="/settings"
            isOpen={isExpanded}
            isActive={pathname === '/settings'}
            onClick={() => !isDesktop && setSidebarOpen(false)}
          />
        </div>
      </motion.aside>

      {/* Desktop Spacer (to prevent content occlusion) */}
      {isDesktop && <div className="hidden lg:block w-[88px] shrink-0" />}
    </>
  );
}

