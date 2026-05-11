import api, { API_BASE_URL } from './api';
import { useLocalDataStore } from '../lib/stores/localDataStore';
import { usePreferencesStore } from '../lib/stores/preferencesStore';
import { useAuthStore } from '../lib/stores/authStore';

// Simple debounce to prevent spamming the backend on every second of video watched
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 10000; // 10 seconds

const LOG_PREFIX = '[CloudSync]';

// Utility: log with consistent prefix and timestamp
function log(level: 'info' | 'warn' | 'error', msg: string, data?: unknown) {
  const ts = new Date().toISOString();
  const fn = level === 'info' ? console.log : level === 'warn' ? console.warn : console.error;
  if (data !== undefined) {
    fn(`${LOG_PREFIX} [${ts}] ${msg}`, data);
  } else {
    fn(`${LOG_PREFIX} [${ts}] ${msg}`);
  }
}

export const CloudSyncService = {
  /**
   * Fetches the cloud state and merges it into local unified store.
   * Uses the central `api` axios instance so that:
   *  - Electron IPC wake-up is handled automatically
   *  - Auth header injection is handled automatically
   */
  async pullFromCloud() {
    const { token, isAuthenticated } = useAuthStore.getState();

    log('info', `Pull triggered. isAuthenticated=${isAuthenticated}, hasToken=${!!token}`);

    if (!isAuthenticated || !token) {
      log('warn', 'Pull aborted: user is not authenticated or token is missing.');
      return;
    }

    // Diagnostic: confirm the resolved base URL
    log('info', `API_BASE_URL resolved to: ${API_BASE_URL}`);

    try {
      log('info', 'Initiating GET /user/sync …');

      const res = await api.get('/user/sync');

      log('info', `Response received — status: ${res.status}`);

      const appState = res.data;

      if (appState && typeof appState === 'object') {
        log('info', 'Hydrating local stores from cloud payload…', Object.keys(appState));

        // Restore Unified Data Store
        const { importData } = useLocalDataStore.getState();
        if (appState.unifiedData) {
          importData(JSON.stringify(appState.unifiedData));
          log('warn', 'Legacy unifiedData structure detected — local migration recommended.');
        }

        // Restore Preferences
        if (appState.preferences) {
          const {
            setVisualBoost,
            setAtmosphereIntensity,
            setStillWatchingEnabled,
          } = usePreferencesStore.getState();

          if (appState.preferences.visualBoost !== undefined) {
            setVisualBoost(appState.preferences.visualBoost);
          }
          if (appState.preferences.atmosphereIntensity !== undefined) {
            setAtmosphereIntensity(appState.preferences.atmosphereIntensity);
          }
          if (appState.preferences.stillWatchingEnabled !== undefined) {
            setStillWatchingEnabled(appState.preferences.stillWatchingEnabled);
          }
          log('info', 'Preferences restored from cloud.', appState.preferences);
        }

        log('info', 'Successfully pulled and hydrated from cloud.');
      } else {
        log('warn', 'Cloud returned an empty or malformed payload.', appState);
      }
    } catch (error: unknown) {
      // Axios wraps HTTP errors — extract as much detail as possible
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as {
          response?: { status: number; statusText: string; data: unknown };
          message: string;
        };
        const { status, statusText, data } = axiosErr.response ?? {};

        if (status === 404) {
          log('info', 'No cloud state found — first-time user or empty account.');
          return;
        }
        if (status === 401) {
          log('warn', `Session expired or invalid token. Server said: ${statusText}`);
          return;
        }

        log('error', `HTTP ${status} ${statusText} from /user/sync`, { responseBody: data });
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Request was made but no response received — likely network / Electron IPC issue
        log('error', 'No response received from backend. Network or Electron IPC issue likely.', {
          resolvedUrl: `${API_BASE_URL}/user/sync`,
          isElectron: typeof window !== 'undefined' && !!window.electron,
          tokenPresent: !!token,
        });
      } else {
        log('error', 'Unexpected error during cloud pull:', error);
      }
    }
  },

  /**
   * Pushes current local unified state up to the user's account.
   */
  async pushToCloud(immediate = false) {
    const { token, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token) return;

    const performPush = async () => {
      try {
        const storeState = useLocalDataStore.getState();
        const prefState = usePreferencesStore.getState();

        const payload = {
          appState: {
            unifiedData: {
              watchHistory: storeState.watchHistory,
              contentState: storeState.contentState,
              library: storeState.library,
              collections: storeState.collections,
              downloads: storeState.downloads,
            },
            preferences: {
              visualBoost: prefState.visualBoost,
              atmosphereIntensity: prefState.atmosphereIntensity,
              stillWatchingEnabled: prefState.stillWatchingEnabled,
            },
          },
        };

        log('info', 'Pushing state to cloud…');
        await api.post('/user/sync', payload);
        log('info', 'Successfully pushed state to cloud.');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosErr = error as { response?: { status: number; data: unknown }; message: string };
          log('error', `Push failed — HTTP ${axiosErr.response?.status}`, axiosErr.response?.data);
        } else {
          log('error', 'Push failed — network or Electron IPC error', error);
        }
      }
    };

    if (immediate) {
      if (syncTimeout) clearTimeout(syncTimeout);
      await performPush();
    } else {
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
    useLocalDataStore.subscribe((state, prevState) => {
      const historyChanged = state.watchHistory !== prevState.watchHistory;
      const libraryChanged = state.library !== prevState.library;
      const collectionsChanged = state.collections !== prevState.collections;
      const contentStateChanged = state.contentState !== prevState.contentState;

      if (historyChanged || libraryChanged || collectionsChanged || contentStateChanged) {
        this.pushToCloud();
      }
    });

    usePreferencesStore.subscribe((state, prevState) => {
      const atmoChanged = state.atmosphereIntensity !== prevState.atmosphereIntensity;
      const boostChanged = state.visualBoost !== prevState.visualBoost;
      const stillWatchingChanged = state.stillWatchingEnabled !== prevState.stillWatchingEnabled;

      if (atmoChanged || boostChanged || stillWatchingChanged) {
        this.pushToCloud();
      }
    });

    log('info', 'Background sync observer initialized.');
  },
};
