'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const SearchModal = dynamic(() =>
  import('@/components/layout/SearchModal').then(mod => mod.SearchModal), { ssr: false }
);
const SettingsModal = dynamic(() =>
  import('@/components/layout/SettingsModal').then(mod => mod.SettingsModal), { ssr: false }
);
const CastCrewModal = dynamic(() =>
  import('@/components/content/CastCrewModal').then(mod => mod.CastCrewModal), { ssr: false }
);
const PlaybackHUD = dynamic(() =>
  import('@/components/layout/PlaybackHUD').then(mod => mod.StreamHealthHUD), { ssr: false }
);

export function DashboardOverlays() {
  return (
    <Suspense fallback={null}>
      <SearchModal />
      <SettingsModal />
      <CastCrewModal />
      <PlaybackHUD />
    </Suspense>
  );
}
