'use client';

import React from 'react';

/**
 * Institutional Living Background (v2)
 *
 * Performance Wins:
 * 1. Uses pure CSS keyframe animations (zero main-thread JS overhead).
 * 2. GPU-accelerated transforms (translate3d/scale3d).
 * 3. Atomic compositing layers via will-change.
 */
import { useUIStore } from '@/lib/stores/uiStore';
import { shallow } from 'zustand/shallow';

export const LivingBackground: React.FC = () => {
  const intensity = useUIStore(state => state.atmosphereIntensity, shallow);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020205] pointer-events-none">
      {/* Ambient Aura 1 */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] aura-blur bg-primary/30 rounded-full animate-pulse-slow will-change-transform" 
        ref={el => el?.style.setProperty('--aura-opacity', (0.4 * intensity).toString())}
      />

      {/* Ambient Aura 2 */}
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] aura-blur bg-indigo-600/20 rounded-full animate-float-slow will-change-transform" 
        ref={el => el?.style.setProperty('--aura-opacity', (0.3 * intensity).toString())}
      />

      {/* Ambient Aura 3 */}
      <div 
        className="absolute top-[30%] right-[10%] w-[30%] h-[30%] aura-blur bg-purple-600/15 rounded-full animate-pulse-gentle will-change-opacity" 
        ref={el => el?.style.setProperty('--aura-opacity', (0.25 * intensity).toString())}
      />

      {/* Static Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.svg')] bg-repeat" />
    </div>
  );
};
