import { useState, useEffect, useCallback, useRef } from 'react';


export interface TorrentStatus {
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
  timeRemaining: number;
}

export const useTorrentEngine = () => {
  const [status, setStatus] = useState<TorrentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastRequestRef = useRef<number>(0);
  const MAX_RETRIES = 3;

  const startTorrent = useCallback(async (magnet: string, season?: number, episode?: number, bufferStrategy: string = 'standard', fileIndex: number | null = null, audioTrackIndex: number | null = null) => {
    if (!window.electron || !window.electron.ipcRenderer) {
      console.warn('[AG] Torrent playback is only available in the Desktop App.');
      return null;
    }
    const requestId = ++lastRequestRef.current;
    
    setLoading(true);
    setError(null);
    let lastError = null;

    if (window.electron && window.electron.ipcRenderer.log) {
      window.electron.ipcRenderer.log(`Hooks: Starting torrent request with ${bufferStrategy} strategy...`);
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (window.electron && window.electron.ipcRenderer.log) {
          window.electron.ipcRenderer.log(`Hooks: Invoke torrent:start-stream (Attempt ${attempt})`);
        }

        const res = (await window.electron.ipcRenderer.invoke('torrent:start-stream', { 
          magnetUri: magnet,
          season,
          episode,
          bufferStrategy,
          fileIndex,
          audioTrackIndex
        })) as {
          success: boolean;
          streamUrl: string;
          error?: string;
        };

        if (window.electron && window.electron.ipcRenderer.log) {
          window.electron.ipcRenderer.log(`Hooks: Response received. Success: ${res.success}, URL: ${res.streamUrl}`);
        }

        if (res.success) {
          // Guard: Only update state if this is still the latest request
          if (requestId !== lastRequestRef.current) {
            console.log('[AG] Torrent initialization superseded by newer request.');
            return null;
          }
          setRetryCount(0);
          setLoading(false);
          return res.streamUrl;
        } else {
          lastError = res.error || 'Unknown initialization error';
          // P0: Special handling for superseding errors
          if (lastError.includes('superseded')) {
            console.log('[AG] Stream initialization superseded by engine.');
            return null;
          }
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

    if (requestId === lastRequestRef.current) {
      setError(lastError || 'Failed to start torrent after retries');
      setLoading(false);
    }
    return null;
  }, []);

  const getMetadata = useCallback(async (magnet: string) => {
    if (!window.electron || !window.electron.ipcRenderer) return null;
    try {
      const res = (await window.electron.ipcRenderer.invoke('torrent:get-metadata', magnet)) as { success: boolean; metadata: any };
      if (res.success) return res.metadata;
      return null;
    } catch (err) {
      console.error('[AG] Failed to get torrent metadata:', err);
      return null;
    }
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
      if (data) setStatus(data as TorrentStatus); // Only update if data exists
    };

    const subscription = electron.ipcRenderer.on('torrent:status', handleStatus);

    return () => {
      if (subscription && electron.ipcRenderer.off) {
        electron.ipcRenderer.off('torrent:status', subscription);
      }
      // P0: Removed aggressive stopTorrent() here to allow 
      // "Always-On" state during rapid component transitions.
      // The parent component is responsible for final cleanup.
    };
  }, []); // Removed stopTorrent dependency as it's memoized with [] anyway

  return {
    status,
    loading,
    error,
    retryCount,
    startTorrent,
    stopTorrent,
    getMetadata,
  };
};

export default useTorrentEngine;
