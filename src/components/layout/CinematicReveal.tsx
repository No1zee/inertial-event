'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicRevealProps {
  children: React.ReactNode;
}

export const CinematicReveal: React.FC<CinematicRevealProps> = ({ children }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Trigger reveal after a short delay to ensure everything is mounted
    const timer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!isRevealed && (
        <motion.div
          key="shutter"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[2000] bg-black flex items-center justify-center"
        >
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 120, opacity: 1 }}
            transition={{ duration: 1, ease: 'circOut' }}
            className="h-[1px] bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
        animate={
          isRevealed
            ? {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transition: {
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.2,
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
