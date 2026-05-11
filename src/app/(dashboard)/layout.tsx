import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CinematicRail } from '@/components/layout/CinematicRail';
import { DashboardClientInit } from '@/components/layout/DashboardClientInit';
import { CinematicReveal } from '@/components/layout/CinematicReveal';
import { GlobalPlayerBar } from '@/components/player/GlobalPlayerBar';
import { DashboardLayout as BaseDashboardLayout } from '@/components/layout/DashboardLayout';

import { DashboardOverlays } from '@/components/layout/DashboardOverlays';

export default function DashboardLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-foreground overflow-x-hidden selection:bg-primary/30">
      <DashboardClientInit />
      <DashboardOverlays />

      <CinematicRail />
      
      <CinematicReveal>
        <BaseDashboardLayout>
          <Navbar />
          <main className="flex-1 w-full pb-20">
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-transparent backdrop-blur-xl">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="text-[hsl(var(--foreground)/.4)] font-bold tracking-[0.3em] text-xs uppercase animate-pulse">
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
