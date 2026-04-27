'use client';

import { useState, useEffect } from 'react';

interface ScrollInfo {
  y: number;
  direction: 'up' | 'down' | null;
  isScrolled: boolean;
}

export function useScrollInfo(threshold = 50): ScrollInfo {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    y: 0,
    direction: null,
    isScrolled: false,
  });

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const direction = currentY > lastY ? 'down' : 'up';
      
      setScrollInfo({
        y: currentY,
        direction,
        isScrolled: currentY > threshold,
      });

      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrollInfo;
}
