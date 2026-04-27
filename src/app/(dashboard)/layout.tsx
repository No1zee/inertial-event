import { Suspense, lazy } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CinematicRail } from '@/components/layout/CinematicRail';
import { cn } from '@/lib/utils';
import { DashboardClientInit } from '@/components/layout/DashboardClientInit';
import { CinematicReveal } from '@/components/layout/CinematicReveal';
import { GlobalPlayerBar } from '@/components/player/GlobalPlayerBar';

const CommandCenter = lazy(() =>
  import('@/components/layout/CommandCenter').then(mod => ({ default: mod.CommandCenter }))
);
const SettingsModal = lazy(() =>
  import('@/components/layout/SettingsModal').then(mod => ({ default: mod.SettingsModal }))
);
const CastCrewModal = lazy(() =>
  import('@/components/content/CastCrewModal').then(mod => ({ default: mod.CastCrewModal }))
);

export default function DashboardLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <CinematicReveal>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
        <DashboardClientInit />
        <CinematicRail />
        <Suspense fallback={null}>
          <CommandCenter />
          <SettingsModal />
          <CastCrewModal />
        </Suspense>

        <div
          className={cn(
            'flex flex-col min-h-screen transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden',
            'pl-[72px]' // Base padding for the rail
          )}
        >
          <Navbar />
          <main className="flex-1 w-full transition-all duration-500 pb-20">
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-3xl">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="text-zinc-500 font-bold tracking-[0.3em] text-xs uppercase animate-pulse">
                      Initializing MaiWatch
                    </div>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
        <GlobalPlayerBar />
        {modal}
      </div>
    </CinematicReveal>
  );
}
