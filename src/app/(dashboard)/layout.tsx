import { Suspense, lazy } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CinematicRail } from '@/components/layout/CinematicRail';
import { cn } from '@/lib/utils';
import { DashboardClientInit } from '@/components/layout/DashboardClientInit';
import { CinematicReveal } from '@/components/layout/CinematicReveal';
import { GlobalPlayerBar } from '@/components/player/GlobalPlayerBar';
import { DashboardChassis } from '@/components/layout/DashboardChassis';

const CommandCenter = lazy(() =>
  import('@/components/layout/CommandCenter').then(mod => ({ default: mod.CommandCenter }))
);
const SettingsModal = lazy(() =>
  import('@/components/layout/SettingsModal').then(mod => ({ default: mod.SettingsModal }))
);
const CastCrewModal = lazy(() =>
  import('@/components/content/CastCrewModal').then(mod => ({ default: mod.CastCrewModal }))
);
const DirectorialControls = lazy(() =>
  import('@/components/layout/DirectorialControls').then(mod => ({ default: mod.DirectorialControls }))
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
          <DirectorialControls />
        </Suspense>

        <DashboardChassis>
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
        </DashboardChassis>
        <GlobalPlayerBar />
        {modal}
      </div>
    </CinematicReveal>
  );
}
