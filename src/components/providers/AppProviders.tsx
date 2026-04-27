'use client';

import { QueryProvider } from '@/components/providers/QueryProvider';
import { ShortcutProvider } from '@/components/providers/ShortcutProvider';
import dynamic from 'next/dynamic';
const ContentModal = dynamic(() => import('@/components/content/ContentModal'), { ssr: false });
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';
import { ExperimentProvider } from './ExperimentProvider';
import { useEffect } from 'react';
import { CloudSyncService } from '@/services/cloudSyncService';
import { useAuthStore } from '@/lib/stores/authStore';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      CloudSyncService.pullFromCloud();
      CloudSyncService.initBackgroundSync();
    }
  }, [isAuthenticated]);
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error(
          'React Error Boundary Error',
          {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
          },
          error
        );
      }}
    >
      <QueryProvider>
        <ExperimentProvider>
          <ShortcutProvider>
            {children}
            <ContentModal />
          </ShortcutProvider>
        </ExperimentProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
