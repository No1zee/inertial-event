'use client';

import { useLayoutActions, useAuthStore, useActiveProfile } from '@/lib/stores';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import { MagneticButton } from '@/components/Common/MagneticButton';

export function Navbar() {
  const { setSearchOpen } = useLayoutActions();
  const { user } = useAuthStore();
  const activeProfile = useActiveProfile();

  const displayName = activeProfile?.name || user?.username || 'Guest';
  const avatarUrl = activeProfile?.avatar || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  return (
    <header className="sticky top-0 z-30 w-full h-20 bg-transparent px-8 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">{/* Mobile Logo or View Title could go here */}</div>

      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Subtle Search Trigger with Magnetic Effect */}
        <MagneticButton distance={0.3}>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            aria-label="Search"
            data-testid="search-button"
          >
            <Search size={22} className="stroke-[1.5px]" />
          </button>
        </MagneticButton>

        <NotificationDropdown />

        <Link href="/profile" className="flex items-center gap-3 pl-4 group">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">
              Active Profile
            </span>
            <span className="text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
              {displayName}
            </span>
          </div>
          <MagneticButton distance={0.1}>
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden group-hover:border-primary/50 transition-all p-0.5 relative">
              <OptimizedImage
                src={avatarUrl}
                alt="Profile"
                fill
                className="object-cover rounded-[calc(1rem-0.125rem)]"
                sizes="40px"
              />
            </div>
          </MagneticButton>
        </Link>
      </div>
    </header>
  );
}
