'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createIndexedDBPersister } from '@/lib/api/persister';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // More lenient caching for a premium feel
            staleTime: 24 * 60 * 60 * 1000, // 24 hours
            gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const persister = createIndexedDBPersister();

    persistQueryClient({
      queryClient,
      persister,
      maxAge: 7 * 24 * 60 * 60 * 1000, // Keep data for 7 days
      buster: 'v1', // Change this to invalidate all caches
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
