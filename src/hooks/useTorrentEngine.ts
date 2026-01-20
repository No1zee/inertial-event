import { useState, useEffect, useCallback } from 'react';

declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                invoke: (channel: string, data?: any) => Promise<any>;
                on: (channel: string, func: (...args: any[]) => void) => void;
                log: (msg: string) => void;
            }
        }
    }
}

export const useTorrentEngine = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    const startTorrent = useCallback(async (magnet: string) => {
        setLoading(true);
        setError(null);
        let lastError = null;

        if (window.electron && window.electron.ipcRenderer.log) {
            window.electron.ipcRenderer.log(`Hooks: Starting torrent request...`);
        }

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[AG] Torrent Attempt ${attempt}/${MAX_RETRIES}`);
                if (window.electron && window.electron.ipcRenderer.log) {
                    window.electron.ipcRenderer.log(`Hooks: Invoke torrent:start-stream (Attempt ${attempt})`);
                }
                
                const res = await window.electron.ipcRenderer.invoke('torrent:start-stream', { magnetUri: magnet });
                
                if (window.electron && window.electron.ipcRenderer.log) {
                    window.electron.ipcRenderer.log(`Hooks: Response received. Success: ${res.success}, URL: ${res.streamUrl}`);
                }

                if (res.success) {
                    setRetryCount(0);
                    setLoading(false);
                    return res.streamUrl;
                }
            } catch (err: any) {
                lastError = err.message || 'IPC Timeout';
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
        if (!window.electron) return;

        const handleStatus = (data: any) => setStatus(data);
        window.electron.ipcRenderer.on('torrent:status', handleStatus);

        return () => {
            stopTorrent();
        };
    }, [stopTorrent]);

    return {
        status,
        loading,
        error,
        retryCount,
        startTorrent,
        stopTorrent
    };
};

export default useTorrentEngine;
