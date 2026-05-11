'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import {
  Home,
  Compass,
  Tv,
  Film,
  Zap,
  Folder,
  Clock,
  Bookmark,
  Library,
  User,
  Search,
  Settings,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutState, useLayoutActions, useNavigationActions } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  view: string;
}

const navItems: NavItem[] = [
  { label: 'Home', icon: Home, href: '/', view: 'home' },
  { label: 'Browse', icon: Compass, href: '/browse', view: 'browse' },
  { label: 'Live TV', icon: Tv, href: '/channels', view: 'channels' },
  { label: 'My List', icon: Bookmark, href: '/watchlist', view: 'watchlist' },
];

export const CinematicRail: React.FC = () => {
  const pathname = usePathname();
  const { isRailExpanded } = useLayoutState();
  const { setIsRailExpanded, setSearchOpen } = useLayoutActions();
  const { setActiveSection: setActiveView } = useNavigationActions();

  // Institutional Immersion: Hide sidebar during playback or on watch page
  const isWatchPage = pathname?.startsWith('/watch');
  
  if (isWatchPage) return null;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isRailExpanded ? 260 : 72,
        backgroundColor: isRailExpanded 
          ? 'rgba(var(--background-rgb), 0.95)' 
          : 'rgba(var(--background-rgb), 0.4)',
      }}
      onMouseEnter={() => setIsRailExpanded(true)}
      onMouseLeave={() => setIsRailExpanded(false)}
      className={cn(
        'fixed left-0 top-0 h-screen z-[100] backdrop-blur-3xl flex flex-col py-8 select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
        'border-r border-[hsl(var(--border))]/30',
        isRailExpanded ? 'shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : 'shadow-none'
      )}
    >
      {/* Logo Section */}
      <div className="px-6 mb-12 overflow-hidden shrink-0">
        <Logo size="sm" showText={isRailExpanded} animated={false} />
      </div>

      {/* Command Trigger */}
      <div className="px-4 mb-8 shrink-0">
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            'w-full flex items-center justify-center h-12 rounded-2xl bg-[hsl(var(--surface-elevated))]/20 border border-[hsl(var(--border))]/30 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-elevated))]/40 transition-all group overflow-hidden',
            isRailExpanded ? 'px-4 justify-start' : 'px-0'
          )}
        >
          <Search
            size={18}
            className={cn(
              'shrink-0 transition-transform duration-500 ease-out',
              !isRailExpanded && 'group-hover:scale-110'
            )}
          />
          {isRailExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-4 text-[13px] font-medium tracking-tight text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
            >
              Search...
            </motion.span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          <motion.div
            key={isRailExpanded ? 'expanded' : 'collapsed'}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.04,
                },
              },
            }}
            className="space-y-3"
          >
            {navItems.map(item => {
              const isActive = pathname === item.href;

              return (
                <motion.div
                  key={item.href}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0 },
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setActiveView(item.view)}
                    className={cn(
                      'relative flex items-center h-12 rounded-2xl transition-all group',
                      isActive
                        ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-elevated))]/30',
                      !isRailExpanded && 'justify-center'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      />
                    )}

                    <item.icon
                      size={20}
                      className={cn(
                        'shrink-0 transition-all duration-500 ease-out',
                        isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]',
                        !isRailExpanded && 'group-hover:scale-110'
                      )}
                    />

                    {isRailExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-4 text-[13px] font-bold tracking-wide whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}

                    {!isRailExpanded && (
                      <div className="absolute left-16 px-3 py-1.5 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))]/30 rounded-lg text-[10px] font-bold text-[hsl(var(--foreground))] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-3 group-hover:translate-x-0 z-50 shadow-2xl">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 mt-auto pt-8 space-y-3 shrink-0 border-t border-[hsl(var(--border))]/20">
        <Link
          href="/settings"
          className={cn(
            'flex items-center h-12 rounded-2xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-elevated))]/30 transition-all group',
            !isRailExpanded && 'justify-center'
          )}
        >
          <Settings size={20} className="shrink-0 transition-transform duration-500 ease-out group-hover:rotate-45" />
          {isRailExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-4 text-[13px] font-bold tracking-wide"
            >
              Settings
            </motion.span>
          )}
        </Link>

        <button
          className={cn(
            'w-full flex items-center h-12 rounded-2xl text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-900/10 transition-all group',
            !isRailExpanded && 'justify-center'
          )}
        >
          <LogOut
            size={20}
            className="shrink-0 transition-transform duration-500 ease-out group-hover:-translate-x-1"
          />
          {isRailExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-4 text-[13px] font-bold tracking-wide"
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
