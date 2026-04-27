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
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white">
          {greeting}, <span className="text-red-600">{activeProfile.name}</span>
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
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Ready to finish?</span>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-bold text-zinc-300 group-hover:text-white transition-colors">
                {lastWatched.title}
              </span>
              <div className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="text-xs font-medium text-zinc-500 italic">
                {lastWatched.type === 'tv' ? `S${lastWatched.season} E${lastWatched.episode}` : 'Movie'}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-500 transition-all duration-300 group-hover:scale-110">
            <Play size={12} fill="currentColor" className="text-white ml-0.5" />
          </div>
        </motion.div>
      )}
    </header>
  );
};
