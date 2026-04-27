import { useLocalDataStore } from '../lib/stores/localDataStore';
import { useAuthStore } from '../lib/store/authStore';

// Simple debounce to prevent spamming the backend on every second of video watched
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 10000; // 10 seconds

export const CloudSyncService = {
  /**
   * Fetches the cloud state and merges it into local unified store
   */
  async pullFromCloud() {
    const { token, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token) return;

    try {
      const res = await fetch('/api/user/sync', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch sync state');

      const appState = await res.json();

      if (appState && typeof appState === 'object') {
        // Restore Unified Data Store
        // We map legacy cloud fields if they exist, or use the new unified structure if the backend was updated
        const { importData } = useLocalDataStore.getState();

        if (appState.unifiedData) {
          importData(JSON.stringify(appState.unifiedData));
        } else if (appState.history || appState.trackedSeries) {
          // Backwards compatibility for legacy cloud data
          // We can't easily use importData here without a full schema,
          // but we can at least manually merge them if needed.
          // For now, we assume the user will migrate locally first.
          console.warn('[CloudSync] Legacy cloud data detected. Local migration recommended.');
        }

        console.log('[CloudSync] Successfully pulled and hydrated from cloud.');
      }
    } catch (error) {
      console.error('[CloudSync] Pull error:', error);
    }
  },

  /**
   * Pushes current local unified state up to the user's account
   */
  async pushToCloud(immediate = false) {
    const { token, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token) return;

    const performPush = async () => {
      try {
        const storeState = useLocalDataStore.getState();

        // Prepare a consolidated payload
        const payload = {
          appState: {
            unifiedData: {
              watchHistory: storeState.watchHistory,
              contentState: storeState.contentState,
              library: storeState.library,
              collections: storeState.collections,
              downloads: storeState.downloads,
            },
          },
        };

        const res = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
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
    // Subscribe to Local Data Store Changes
    useLocalDataStore.subscribe((state, prevState) => {
      // Check if significant data changed
      const historyChanged = state.watchHistory !== prevState.watchHistory;
      const libraryChanged = state.library !== prevState.library;
      const collectionsChanged = state.collections !== prevState.collections;
      const contentStateChanged = state.contentState !== prevState.contentState;

      if (historyChanged || libraryChanged || collectionsChanged || contentStateChanged) {
        this.pushToCloud();
      }
    });

    console.log('[CloudSync] Background sync observer initialized.');
  },
};
