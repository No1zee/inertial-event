import { useState, useEffect, useCallback } from 'react';
import '@/types/electron.d';

export const useTorrentEngine = () => {
  const [status, setStatus] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const startTorrent = useCallback(async (magnet: string) => {
    if (!window.electron || !window.electron.ipcRenderer) {
      console.warn('[AG] Torrent playback is only available in the Desktop App.');
      return null;
    }
    setLoading(true);
    setError(null);
    let lastError = null;

    if (window.electron && window.electron.ipcRenderer.log) {
      window.electron.ipcRenderer.log(`Hooks: Starting torrent request...`);
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // console.log(`[AG] Torrent Attempt ${attempt}/${MAX_RETRIES}`);
        if (window.electron && window.electron.ipcRenderer.log) {
          window.electron.ipcRenderer.log(`Hooks: Invoke torrent:start-stream (Attempt ${attempt})`);
        }

        const res = (await window.electron.ipcRenderer.invoke('torrent:start-stream', { magnetUri: magnet })) as {
          success: boolean;
          streamUrl: string;
        };

        if (window.electron && window.electron.ipcRenderer.log) {
          window.electron.ipcRenderer.log(`Hooks: Response received. Success: ${res.success}, URL: ${res.streamUrl}`);
        }

        if (res.success) {
          setRetryCount(0);
          setLoading(false);
          return res.streamUrl;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'IPC Timeout';
        console.warn(`[AG] Torrent Attempt ${attempt} failed:`, lastError);
        if (window.electron && window.electron.ipcRenderer.log) {
          window.electron.ipcRenderer.log(`Hooks: Error on attempt ${attempt}: ${lastError}`);
        }
      }

      if (attempt < MAX_RETRIES) {
        setRetryCount(attempt);
        await new Promise(r => setTimeout(r, 2000)); // Wait before retry
      }
    }

    setError(lastError || 'Failed to start torrent after retries');
    setLoading(false);
    return null;
  }, []);

  const stopTorrent = useCallback(async () => {
    if (!window.electron || !window.electron.ipcRenderer) return;
    try {
      await window.electron.ipcRenderer.invoke('torrent:stop-stream');
      setStatus(null);
      setRetryCount(0);
    } catch (err) {
      console.error('[AG] Failed to stop torrent:', err);
    }
  }, []);

  useEffect(() => {
    const electron = window.electron;
    if (!electron || !electron.ipcRenderer.on) return;

    const handleStatus = (data: unknown) => {
      if (data) setStatus(data); // Only update if data exists
    };

    // Use a more robust listener attachment if possible, or ensure it's removed
    // Return value from .on() is the subscription function we need to pass to .off()
    const subscription = electron.ipcRenderer.on('torrent:status', handleStatus);

    return () => {
      if (subscription && electron.ipcRenderer.off) {
        electron.ipcRenderer.off('torrent:status', subscription);
      }
      stopTorrent();
    };
  }, [stopTorrent]);

  return {
    status,
    loading,
    error,
    retryCount,
    startTorrent,
    stopTorrent,
  };
};

export default useTorrentEngine;
