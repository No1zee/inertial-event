'use client';

import { useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

/**
 * useMousePosition (Institutional v1)
 * 
 * Returns smoothed, normalized mouse coordinates (-1 to 1) for parallax effects.
 * Optimized for performance using Framer Motion values to avoid React re-renders.
 */
export const useMousePosition = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring configuration for "weighted" premium feel
  const springConfig = { damping: 30, stiffness: 100, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1 range
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return { x: smoothX, y: smoothY };
};
