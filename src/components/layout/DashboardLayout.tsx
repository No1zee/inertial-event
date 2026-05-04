'use client';

import React from 'react';
import { useLayoutState } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isRailExpanded } = useLayoutState();

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen transition-[padding-left] duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden',
        isRailExpanded ? 'pl-[260px]' : 'pl-[72px]'
      )}
    >
      {children}
    </div>
  );
}
