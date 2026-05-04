'use client';

import { useCallback } from 'react';
import { useUserPreferences } from '@/lib/stores/localDataStore';

let sharedAudioCtx: AudioContext | null = null;

export function useUISounds() {
  const { interfaceSounds } = useUserPreferences();

  const playSound = useCallback(
    (type: 'hover' | 'click' | 'success' | 'error') => {
      if (typeof window === 'undefined' || !interfaceSounds) return;

      if (!sharedAudioCtx) {
        sharedAudioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }

      const oscillator = sharedAudioCtx.createOscillator();
      const gainNode = sharedAudioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(sharedAudioCtx.destination);

      const now = sharedAudioCtx.currentTime;

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
    },
    [interfaceSounds]
  );

  return { playSound };
}
