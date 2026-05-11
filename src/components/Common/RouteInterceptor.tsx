'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIPreferences, useUserPreferencesStore } from '@/lib/stores';

export function RouteInterceptor() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasCompletedOnboarding } = useUIPreferences();
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check hydration status of the user preferences store
    if (useUserPreferencesStore?.persist?.hasHydrated) {
      setHydrated(useUserPreferencesStore.persist.hasHydrated());
      const unsubHydrate = useUserPreferencesStore.persist.onFinishHydration(() => setHydrated(true));
      return () => unsubHydrate();
    } else {
      // Fallback if not using persist middleware
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated) return;

    const shouldBypass = typeof window !== 'undefined' && (window as any).NOVA_TEST_BYPASS_ONBOARDING;
    if (!hasCompletedOnboarding && pathname !== '/onboarding' && !shouldBypass) {
      router.push('/onboarding');
    } else if (hasCompletedOnboarding && pathname === '/onboarding' && !shouldBypass) {
      router.push('/');
    }
  }, [mounted, hydrated, hasCompletedOnboarding, pathname, router]);

  return null;
}
