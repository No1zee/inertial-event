'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { Search, User, Bell, LayoutGrid } from 'lucide-react';
import { useLayoutActions, useNavigationActions } from '@/lib/stores/uiStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { motion } from 'framer-motion';
import { useScrollInfo } from '@/hooks/useScrollInfo';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setSearchOpen } = useLayoutActions();
  const { setSidebarOpen } = useNavigationActions();
  const { isScrolled } = useScrollInfo(20);
  const { user, _hasHydrated } = useAuthStore();
  
  const displayUser = _hasHydrated && user ? user.username : 'Operator';
  
  // High-level navigation items
  const NAV_ITEMS = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/browse/movies' },
    { name: 'TV Shows', path: '/browse/tv-shows' },
    { name: 'Anime', path: '/browse/anime' },
    { name: 'Live TV', path: '/browse/live' },
  ];

  return (
    <motion.header 
      initial={false}
      animate={{
        top: isScrolled ? '0px' : '32px',
        left: isScrolled ? '0px' : '48px',
        right: isScrolled ? '0px' : '48px',
        height: isScrolled ? '72px' : '80px',
        backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0)',
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0)',
        backdropFilter: isScrolled ? 'blur(40px)' : 'blur(0px)',
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className={cn(
        "fixed z-[400] flex items-center justify-between pointer-events-none px-12 transition-all duration-500",
        isScrolled && "shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      )}
    >
      {/* Primary Navigation Hub */}
      <div className="flex items-center gap-8 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(true)}
          className={cn(
            "rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-3xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all shadow-2xl",
            isScrolled ? "h-10 w-10" : "h-14 w-14"
          )}
          aria-label="Open sidebar"
        >
          <LayoutGrid size={isScrolled ? 18 : 22} />
        </motion.button>

        <nav className={cn(
          "flex items-center bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl shadow-2xl overflow-hidden transition-all",
          isScrolled ? "px-4 h-10" : "px-8 h-14"
        )}>
          <div className="flex items-center gap-6 lg:gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'transition-all duration-300 hover:scale-105 active:scale-95 group relative',
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <PretextHeadline
                    text={item.name}
                    className={cn(
                      'text-[10px] font-bold tracking-[0.3em] uppercase',
                      isActive && 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                    )}
                  />
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Directorial Actions */}
      <div className="flex items-center gap-6 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSearchOpen(true)}
          className={cn(
            "flex items-center gap-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl transition-all hover:bg-white/5 group",
            isScrolled ? "px-4 h-10" : "px-6 h-14"
          )}
        >
          <Search className="text-zinc-500 group-hover:text-primary transition-colors" size={isScrolled ? 14 : 18} />
          <span className={cn(
            "font-bold tracking-[0.2em] text-zinc-500 uppercase transition-all",
            isScrolled ? "text-[8px] mr-2" : "text-[10px] mr-4"
          )}>Search</span>
          {!isScrolled && (
            <div className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-[9px] font-bold text-zinc-600 tracking-tight">
              ⌘K
            </div>
          )}
        </motion.button>

        <div className={cn(
          "flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl shadow-2xl transition-all",
          isScrolled ? "px-2 h-10" : "px-3 h-14"
        )}>
          <button
            className={cn(
              "rounded-xl bg-white/[0.03] flex items-center justify-center text-zinc-500 hover:text-white transition-all",
              isScrolled ? "h-7 w-7" : "h-10 w-10"
            )}
            aria-label="Notifications"
          >
            <Bell size={isScrolled ? 14 : 18} />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={() => router.push('/profile')}
            className={cn(
              "flex items-center gap-3 rounded-xl hover:bg-white/5 transition-all group",
              isScrolled ? "px-2 py-1" : "px-3 py-2"
            )}
            aria-label="User profile"
          >
            <div className={cn(
              "rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all",
              isScrolled ? "w-6 h-6" : "w-8 h-8"
            )}>
              <User size={isScrolled ? 12 : 16} />
            </div>
            {!isScrolled && (
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase hidden lg:block">
                {displayUser}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
