'use client';

import { useCallback } from 'react';
import { useUserPreferences } from '@/lib/stores/localDataStore';

export function useUISounds() {
  const { interfaceSounds } = useUserPreferences();

  const playSound = useCallback(
    (type: 'hover' | 'click' | 'success' | 'error') => {
      if (typeof window === 'undefined' || !interfaceSounds) return;

      const audioCtx = new (
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'hover') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
      } else if (type === 'click') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(1, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      }

      setTimeout(() => audioCtx.close(), 200);
    },
    [interfaceSounds]
  );

  return { playSound };
}
