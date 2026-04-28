'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIPreferences } from '@/lib/stores';

export function RouteInterceptor() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasCompletedOnboarding } = useUIPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!hasCompletedOnboarding && pathname !== '/onboarding') {
      router.push('/onboarding');
    } else if (hasCompletedOnboarding && pathname === '/onboarding') {
      router.push('/');
    }
  }, [mounted, hasCompletedOnboarding, pathname, router]);

  return null;
}
