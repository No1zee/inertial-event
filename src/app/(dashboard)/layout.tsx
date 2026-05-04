import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CinematicRail } from '@/components/layout/CinematicRail';
import { DashboardClientInit } from '@/components/layout/DashboardClientInit';
import { CinematicReveal } from '@/components/layout/CinematicReveal';
import { GlobalPlayerBar } from '@/components/player/GlobalPlayerBar';
import { DashboardLayout as BaseDashboardLayout } from '@/components/layout/DashboardLayout';

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

export default function DashboardLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <DashboardClientInit />
      <Suspense fallback={null}>
        <SearchModal />
        <SettingsModal />
        <CastCrewModal />
        <PlaybackHUD />
      </Suspense>

      <CinematicRail />
      
      <CinematicReveal>
        <BaseDashboardLayout>
          <Navbar />
          <main className="flex-1 w-full pb-20">
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-xl">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="text-zinc-500 font-bold tracking-[0.3em] text-xs uppercase animate-pulse">
                      Initializing NovaStream
                    </div>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </BaseDashboardLayout>
        {modal}
      </CinematicReveal>

      <GlobalPlayerBar />
    </div>
  );
}
