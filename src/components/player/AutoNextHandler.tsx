'use client';

import { useEffect, useRef } from 'react';
import { usePlaybackState } from '@/store/playerStore';

interface AutoNextHandlerProps {
  type: string;
  hasNext: boolean;
  duration: number;
  currentTime: number;
  onNext: () => void;
}

/**
 * Isolated logic handler for automatic episode transitions.
 * This component listens to the fast-changing playback state so that
 * the main Player UI doesn't have to re-render every second.
 */
export function AutoNextHandler({ type, hasNext, onNext }: Omit<AutoNextHandlerProps, 'currentTime' | 'duration'>) {
  const { currentTime, duration } = usePlaybackState();
  const transitionTriggeredRef = useRef(false);

  useEffect(() => {
    // Reset trigger if duration/content changes
    transitionTriggeredRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (
      type !== 'movie' &&
      hasNext &&
      duration > 0 &&
      currentTime >= duration - 0.5 &&
      !transitionTriggeredRef.current
    ) {
      console.log('[MaiWatch] AutoNextHandler: Playback completed. Triggering next episode...');
      transitionTriggeredRef.current = true;
      onNext();
    }
  }, [currentTime, duration, type, hasNext, onNext]);

  return null;
}
