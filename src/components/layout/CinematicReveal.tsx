'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayoutState, useLayoutActions } from '@/lib/stores/uiStore';

interface CinematicRevealProps {
  children: React.ReactNode;
}

export const CinematicReveal: React.FC<CinematicRevealProps> = ({ children }) => {
  const { hasInitialized } = useLayoutState();
  const { setHasInitialized } = useLayoutActions();
  const [isRevealed, setIsRevealed] = useState(hasInitialized);

  useEffect(() => {
    if (!hasInitialized) {
      // Small delay for the very first entrance to ensure DOM stability
      const timer = setTimeout(() => {
        setIsRevealed(true);
        setHasInitialized(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [hasInitialized, setHasInitialized]);

  // If already initialized, we skip the shutter but keep the subtle fade/scale entry for children
  const showShutter = !hasInitialized;

  return (
    <AnimatePresence>
      {showShutter && !isRevealed && (
        <motion.div
          key="shutter"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[2000] bg-black flex items-center justify-center"
        >
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 120, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'circOut' }}
            className="h-[1px] bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
          />
        </motion.div>
      )}

      <motion.div
        initial={hasInitialized ? { opacity: 1 } : { opacity: 0, scale: 1.01, filter: 'blur(10px)' }}
        animate={
          isRevealed
            ? {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transition: {
                  duration: hasInitialized ? 0.3 : 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0,
                },
              }
            : {}
        }
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
