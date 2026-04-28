'use client';

import React from 'react';
import { useLayoutState } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils';

interface DashboardChassisProps {
  children: React.ReactNode;
}

export function DashboardChassis({ children }: DashboardChassisProps) {
  const { isRailExpanded } = useLayoutState();

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden',
        isRailExpanded ? 'pl-[280px]' : 'pl-[84px]'
      )}
    >
      {children}
    </div>
  );
}
