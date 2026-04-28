/**
 * Streaming Optimization Service
 * Handles pre-caching, source ranking, and buffer management for Netflix-level smoothness
 */

import { SOURCES, StreamingSource } from '@/lib/config/sources';

interface SourceHealth {
  id: string;
  url: string;
  latency: number;
  healthy: boolean;
  lastChecked: number;
  successCount: number;
  failureCount: number;
}

interface PreloadedSource {
  sources: { url: string; type: string }[];
  subtitles?: { url: string; label: string; lang: string }[];
  quality: string;
  provider: string;
  loadedAt: number;
}

interface StreamOptimizerState {
  sourceHealth: Record<string, SourceHealth>;
  preloadedSources: Record<string, PreloadedSource>;
  bufferHealth: {
    bufferedDuration: number;
    bandwidth: number;
    quality: string;
    lastBuffer: number;
  };
  currentPreloading: Set<string>;
  blacklist: Set<string>;
  failureCounts: Record<string, number>;
}

class StreamingOptimizer {
  private state: StreamOptimizerState = {
    sourceHealth: {},
    preloadedSources: {},
    bufferHealth: {
      bufferedDuration: 0,
      bandwidth: 0,
      quality: 'auto',
      lastBuffer: 0,
    },
    currentPreloading: new Set(),
    blacklist: new Set(),
    failureCounts: {},
  };

  private healthCheckTimeout = 60000;
  private preloadCacheExpiry = 6 * 60 * 60 * 1000; // 6 hours persistence for sources

  constructor() {
    this.initSourceHealth();
  }

  private initSourceHealth() {
    SOURCES.forEach(source => {
      this.state.sourceHealth[source.id] = {
        id: source.id,
        url: source.baseUrl,
        latency: -1,
        healthy: true,
        lastChecked: 0,
        successCount: 0,
        failureCount: 0,
      };
    });
  }

  async checkSourceHealth(source: StreamingSource): Promise<SourceHealth> {
    const cached = this.state.sourceHealth[source.id];

    if (cached && Date.now() - cached.lastChecked < this.healthCheckTimeout) {
      return cached;
    }

    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      await fetch(source.baseUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const latency = performance.now() - startTime;

      this.state.sourceHealth[source.id] = {
        ...cached,
        latency,
        healthy: true,
        lastChecked: Date.now(),
        successCount: (cached?.successCount || 0) + 1,
        failureCount: 0,
      };
    } catch {
      this.state.sourceHealth[source.id] = {
        ...cached,
        healthy: false,
        lastChecked: Date.now(),
        successCount: cached?.successCount || 0,
        failureCount: (cached?.failureCount || 0) + 1,
      };
    }

    return this.state.sourceHealth[source.id];
  }

  reportFailure(sourceId: string) {
    this.state.failureCounts[sourceId] = (this.state.failureCounts[sourceId] || 0) + 1;
    if (this.state.failureCounts[sourceId] >= 2) {
      console.warn(`[StreamingOptimizer] Blacklisting source ${sourceId} due to repeated failures.`);
      this.state.blacklist.add(sourceId);
    }
  }

  clearFailure(sourceId: string) {
    this.state.failureCounts[sourceId] = 0;
    this.state.blacklist.delete(sourceId);
  }

  getRankedSources(): StreamingSource[] {
    return SOURCES.filter(s => !this.state.blacklist.has(s.id)).sort((a, b) => {
      const healthA = this.state.sourceHealth[a.id];
      const healthB = this.state.sourceHealth[b.id];

      if (!healthA?.healthy && healthB?.healthy) return 1;
      if (healthA?.healthy && !healthB?.healthy) return -1;

      if (healthA?.latency > 0 && healthB?.latency > 0) {
        return healthA.latency - healthB.latency;
      }

      if (a.stability === 'stable' && b.stability !== 'stable') return -1;
      if (a.stability !== 'stable' && b.stability === 'stable') return 1;

      return 0;
    });
  }


  getPreloadKey(contentId: string, type: string, season?: number, episode?: number): string {
    return `${contentId}-${type}-${season || 0}-${episode || 0}`;
  }

  async preloadSources(
    contentId: string,
    type: 'movie' | 'tv' | 'anime',
    season: number = 1,
    episode: number = 1,
    title: string = '',
    audioPreference: string = 'dub'
  ): Promise<PreloadedSource | null> {
    const key = this.getPreloadKey(contentId, type, season, episode);

    if (this.state.currentPreloading.has(key)) {
      return this.state.preloadedSources[key] || null;
    }

    if (this.state.preloadedSources[key]) {
      const cached = this.state.preloadedSources[key];
      if (Date.now() - cached.loadedAt < this.preloadCacheExpiry) {
        return cached;
      }
    }

    this.state.currentPreloading.add(key);

    const fetchWithRetry = async (attempt: number = 1): Promise<PreloadedSource | null> => {
      try {
        const params = new URLSearchParams({
          id: contentId,
          type: type === 'movie' ? 'movie' : 'tv',
          season: season.toString(),
          episode: episode.toString(),
          title,
          audioPreference,
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(`/api/sources?${params.toString()}`, {
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();

          if (data?.sources?.length > 0) {
            const preloadResult: PreloadedSource = {
              sources: data.sources,
              subtitles: data.subtitles || [],
              quality: data.sources[0]?.quality || 'auto',
              provider: data.sources[0]?.provider || 'unknown',
              loadedAt: Date.now(),
            };

            this.state.preloadedSources[key] = preloadResult;
            return preloadResult;
          }
        }

        // If we got an empty response or error, retry once
        if (attempt < 2) {
          console.log(`[StreamingOptimizer] Attempt ${attempt} failed, retrying in 2s...`);
          await new Promise(r => setTimeout(r, 2000));
          return fetchWithRetry(attempt + 1);
        }
      } catch (error) {
        console.warn(`[StreamingOptimizer] Preload attempt ${attempt} failed:`, error);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          return fetchWithRetry(attempt + 1);
        }
      }
      return null;
    };

    try {
      return await fetchWithRetry();
    } finally {
      this.state.currentPreloading.delete(key);
    }
  }

  getPreloaded(key: string): PreloadedSource | null {
    const cached = this.state.preloadedSources[key];
    if (cached && Date.now() - cached.loadedAt < this.preloadCacheExpiry) {
      return cached;
    }
    return null;
  }

  updateBufferHealth(bufferedDuration: number, bandwidth: number, quality: string) {
    this.state.bufferHealth = {
      bufferedDuration,
      bandwidth,
      quality,
      lastBuffer: Date.now(),
    };
  }

  getBufferHealth() {
    return { ...this.state.bufferHealth };
  }

  clearOldPreloads() {
    const now = Date.now();
    Object.keys(this.state.preloadedSources).forEach(key => {
      if (now - this.state.preloadedSources[key].loadedAt > this.preloadCacheExpiry) {
        delete this.state.preloadedSources[key];
      }
    });
  }
}

export const streamingOptimizer = new StreamingOptimizer();
export default streamingOptimizer;
