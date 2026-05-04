import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';

export function useStillWatching() {
  const autoPlayNext = useUserPreferencesStore(state => state.autoPlayNext);
  const stillWatchingEnabled = useUserPreferencesStore(state => state.stillWatchingEnabled);
  const [showStillWatching, setShowStillWatching] = useState(false);
  const consecutiveAutoplaysRef = useRef(0);
  const maxConsecutive = 3;

  const checkStillWatching = useCallback((onPauseCommand: () => void) => {
    if (stillWatchingEnabled && autoPlayNext) {
      consecutiveAutoplaysRef.current += 1;
      if (consecutiveAutoplaysRef.current >= maxConsecutive) {
        setShowStillWatching(true);
        onPauseCommand();
        return true;
      }
    }
    return false;
  }, [autoPlayNext, stillWatchingEnabled]);

  const handleContinueWatching = useCallback((onPlayCommand: () => void) => {
    setShowStillWatching(false);
    consecutiveAutoplaysRef.current = 0;
    onPlayCommand();
  }, []);

  const resetConsecutiveAutoplays = useCallback(() => {
    consecutiveAutoplaysRef.current = 0;
    setShowStillWatching(false);
  }, []);

  return {
    showStillWatching,
    checkStillWatching,
    handleContinueWatching,
    resetConsecutiveAutoplays
  };
}
