'use client';

import React from 'react';
import { motion, useTransform, type Transition } from 'framer-motion';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';
import { shallow } from 'zustand/shallow';
import { PretextBackground } from './PretextBackground';
import { useMousePosition } from '@/hooks/useMousePosition';

/**
 * Institutional Living Background (v4)
 *
 * Performance Architecture:
 * 1. Framer Motion optimized transforms — GPU-accelerated.
 * 2. Mouse parallax — subtle depth layer offsets.
 * 3. Directorial Bloom — cinematic 4s reveal sequence.
 * 4. CSS Variable Inheritance — preserves theme switching efficiency.
 */
export const LivingBackground: React.FC = () => {
  const intensity = useUserPreferencesStore(state => state.atmosphereIntensity, shallow);
  const { x, y } = useMousePosition();

  // Parallax transforms for depth layers
  const orb1X = useTransform(x, [-1, 1], [-40, 40]);
  const orb1Y = useTransform(y, [-1, 1], [-30, 30]);
  
  const orb2X = useTransform(x, [-1, 1], [30, -30]);
  const orb2Y = useTransform(y, [-1, 1], [20, -20]);
  
  const orb3X = useTransform(x, [-1, 1], [-15, 15]);
  const orb3Y = useTransform(y, [-1, 1], [-10, 10]);

  // Directorial Bloom (Reveal Animation Settings)
  const bloomTransition: Transition = {
    duration: 4,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number], // Cinematic cubic-bezier
  };

  return (
    <motion.div 
      className="fixed inset-0 -z-50 overflow-hidden bg-background pointer-events-none transition-[background-color] duration-1000 ease-in-out"
      style={{ '--atmo-intensity': intensity } as any}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <PretextBackground />
      
      {/* Aura Orb 1 — Primary atmospheric glow */}
      <motion.div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full will-change-transform aura-orb aura-orb-1 aura-animate-1"
        style={{ x: orb1X, y: orb1Y }}
        initial={{ scale: 1.5, filter: 'blur(100px)', opacity: 0 }}
        animate={{ scale: 1, filter: 'blur(60px)', opacity: 1 }}
        transition={bloomTransition}
      />

      {/* Aura Orb 2 — Secondary wash */}
      <motion.div 
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full will-change-transform aura-orb aura-orb-2 aura-animate-2"
        style={{ x: orb2X, y: orb2Y }}
        initial={{ scale: 0.8, filter: 'blur(80px)', opacity: 0 }}
        animate={{ scale: 1, filter: 'blur(40px)', opacity: 0.8 }}
        transition={{ ...bloomTransition, delay: 0.5 }}
      />

      {/* Aura Orb 3 — Accent haze */}
      <motion.div 
        className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full will-change-opacity aura-orb aura-orb-3 aura-animate-3"
        style={{ x: orb3X, y: orb3Y }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ ...bloomTransition, delay: 1 }}
      />

      {/* Aura Vignette — Radial atmospheric depth layer */}
      <div className="absolute inset-0 aura-vignette" />

      {/* Institutional Thematic Texture Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none texture-overlay" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ duration: 5, delay: 2 }}
      />
    </motion.div>
  );
};
