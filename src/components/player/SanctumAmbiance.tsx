'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SanctumAmbianceProps {
  src: string | null;
}

/**
 * SanctumAmbiance
 *
 * Provides a heavily blurred, high-fidelity background glow for the Media Sanctum.
 * It pulls colors from the content backdrop and creates an immersive 'leak'
 * effect that surrounds the video player.
 */
export function SanctumAmbiance({ src }: SanctumAmbianceProps) {
  const backdropRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (backdropRef.current && src) {
      backdropRef.current.style.setProperty('--bg-image', `url(${src})`);
    }
  }, [src]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
      {/* Base Layer */}
      <motion.div
        ref={backdropRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        className="absolute inset-0 bg-cover bg-center dynamic-bg-image blur-[120px] saturate-[1.8] scale-[1.2] will-change-transform"
      />

      {/* Smart Lighting Sync Layer (Feature 7) */}
      <motion.div
        animate={{
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 blur-[150px] saturate-[2] pointer-events-none"
        style={{
          backgroundColor: 'rgb(var(--ambient-rgb, var(--brand-primary-rgb, 192, 57, 43)))',
        }}
      />

      {/* Pulsing Gradient Overlays */}
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5"
      />

      {/* Vignette to focus on player */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_80%,rgba(0,0,0,1)_100%)]" />
    </div>
  );
}
