'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useActiveProfile, useLastWatched } from '@/lib/stores/localDataStore';
import { Play } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const activeProfile = useActiveProfile();
  const lastWatched = useLastWatched();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const greeting = useMemo(() => {
    if (!mounted) return 'Welcome';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, [mounted]);

  if (!mounted || !activeProfile) return null;

  return (
    <header className="relative px-10 lg:px-24 pt-32 pb-8 flex flex-col gap-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground">
          {greeting}, <span className="text-primary">{activeProfile.name}</span>
        </h1>
      </motion.div>

      {lastWatched && !lastWatched.completed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-4 group cursor-pointer w-fit"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Ready to finish?</span>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {lastWatched.title}
              </span>
              <div className="h-1 w-1 rounded-full bg-border" />
              <span className="text-xs font-medium text-muted-foreground italic">
                {lastWatched.type === 'tv' ? `S${lastWatched.season} E${lastWatched.episode}` : 'Movie'}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-elevated/50 border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary/50 transition-all duration-300 group-hover:scale-110">
            <Play size={12} fill="currentColor" className="text-foreground group-hover:text-white ml-0.5" />
          </div>
        </motion.div>
      )}
    </header>
  );
};
