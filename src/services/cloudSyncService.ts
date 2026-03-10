import { useHistoryStore } from '../lib/store/historyStore';
import { useSeriesTrackingStore } from '../lib/store/seriesTrackingStore';
import { useAuthStore } from '../lib/store/authStore';

// Simple debounce to prevent spamming the backend on every second of video watched
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 10000; // 10 seconds

export const CloudSyncService = {
    /**
     * Fetches the cloud state and merges it into local Zustand stores
     */
    async pullFromCloud() {
        const { token, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !token) return;

        try {
            const res = await fetch('/api/user/sync', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch sync state');

            const appState = await res.json();
            
            if (appState && typeof appState === 'object') {
                // Restore History Store
                if (appState.history) {
                    useHistoryStore.setState({ history: appState.history });
                }

                // Restore Series Tracking Store
                if (appState.trackedSeries) {
                    useSeriesTrackingStore.setState({ trackedSeries: appState.trackedSeries });
                }
                
                console.log('[CloudSync] Successfully pulled and hydrated from cloud.');
            }
        } catch (error) {
            console.error('[CloudSync] Pull error:', error);
        }
    },

    /**
     * Pushes current local Zustand state up to the user's account
     */
    async pushToCloud(immediate = false) {
        const { token, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !token) return;

        const performPush = async () => {
            try {
                const historyState = useHistoryStore.getState().history;
                const trackingState = useSeriesTrackingStore.getState().trackedSeries;

                const payload = {
                    appState: {
                        history: historyState,
                        trackedSeries: trackingState
                    }
                };

                const res = await fetch('/api/user/sync', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Failed to push sync state');
                console.log('[CloudSync] Successfully pushed state to cloud.');
            } catch (error) {
                console.error('[CloudSync] Push error:', error);
            }
        };

        if (immediate) {
            if (syncTimeout) clearTimeout(syncTimeout);
            await performPush();
        } else {
            // Debounce standard pushes (e.g. from continuous video progress)
            if (syncTimeout) clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                performPush();
            }, SYNC_DEBOUNCE_MS);
        }
    },

    /**
     * Start the background observer that listens to local changes
     * and automatically queues them for upload.
     */
    initBackgroundSync() {
        // Subscribe to History Changes
        useHistoryStore.subscribe((state, prevState) => {
            // Quick check if something actually changed to avoid infinite loops
            if (state.history !== prevState.history) {
                this.pushToCloud();
            }
        });

        // Subscribe to Series Tracking Changes
        useSeriesTrackingStore.subscribe((state, prevState) => {
            if (state.trackedSeries !== prevState.trackedSeries) {
                this.pushToCloud();
            }
        });
        
        console.log('[CloudSync] Background sync observer initialized.');
    }
};
