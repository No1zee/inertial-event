"use client";

import { QueryProvider } from '@/components/providers/QueryProvider';
import { ShortcutProvider } from '@/components/providers/ShortcutProvider';
import ContentModal from '@/components/content/ContentModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';
import { ExperimentProvider } from './ExperimentProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            onError={(error, errorInfo) => {
                logger.error('React Error Boundary Error', {
                    componentStack: errorInfo.componentStack,
                    errorBoundary: true
                }, error);
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
