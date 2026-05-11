/**
 * Streaming Optimization Service
 * Handles pre-caching, source ranking, and buffer management for Netflix-level smoothness
 */

import { SOURCES, StreamingSource } from '@/lib/config/sources';
import { API_BASE_URL } from './api';


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
  sources: { url: string; type: string; codec?: string }[];
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
  codecSupport: {
    hevc: boolean;
    av1: boolean;
    h264: boolean;
    vp9: boolean;
    is10Bit: boolean;
  };
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
    codecSupport: {
      hevc: false,
      av1: false,
      h264: true, // Baseline assumption
      vp9: false,
      is10Bit: false,
    },
  };

  private healthCheckTimeout = 60000;
  private preloadCacheExpiry = 6 * 60 * 60 * 1000; // 6 hours persistence for sources

  constructor() {
    this.initSourceHealth();
    this.detectCodecs();
    // Background pre-warm for top sources
    setTimeout(() => this.preWarmTopSources(), 1000);
  }

  private async preWarmTopSources() {
    const topSources = SOURCES.slice(0, 3);
    await Promise.allSettled(topSources.map(s => this.checkSourceHealth(s)));
  }

  private detectCodecs() {
    if (typeof window === 'undefined') return;

    const video = document.createElement('video');
    
    const check = (mimetype: string) => {
      const result = video.canPlayType(mimetype);
      return result === 'probably' || result === 'maybe';
    };

    // Memoize support to avoid repeated DOM element creation
    this.state.codecSupport = {
      hevc: check('video/mp4; codecs="hvc1.1.6.L93.B0"') || 
            check('video/mp4; codecs="hev1.1.6.L93.B0"') ||
            check('video/mp4; codecs="hvc1"') ||
            check('video/mp4; codecs="hev1"'),
      av1: check('video/webm; codecs="av01.0.05M.08"') ||
           check('video/mp4; codecs="av01"'),
      h264: check('video/mp4; codecs="avc1.42E01E"') || 
            check('video/mp4; codecs="avc1"'),
      vp9: check('video/webm; codecs="vp9"') ||
           check('video/mp4; codecs="vp09"'),
      is10Bit: check('video/mp4; codecs="hvc1.2.4.L153.B0"') ||
               check('video/webm; codecs="vp09.02.10.10.01.01.01.01.00"'),
    };
    
    // Electron specific: If we have an IPC bridge, we likely have hardware decoding enabled
    if ((window as any).electron) {
      console.log('[StreamingOptimizer] Electron environment detected. Boosting codec optimism.');
      // Most modern Electron builds (Chromium) support HEVC if the hardware does.
      // We'll keep the detected values but log the boost.
    }
    
    console.log('[StreamingOptimizer] Codec Capability Audit:', this.state.codecSupport);
  }

  getCodecSupport() {
    return { ...this.state.codecSupport };
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

      this.state.blacklist.add(sourceId);
    }
  }

  clearFailure(sourceId: string) {
    this.state.failureCounts[sourceId] = 0;
    this.state.blacklist.delete(sourceId);
  }

  getRankedSources(): StreamingSource[] {
    const supported = this.state.codecSupport;
    return SOURCES.filter(s => {
      // 1. Check blacklist
      if (this.state.blacklist.has(s.id)) return false;
      
      // 2. Check health
      const health = this.state.sourceHealth[s.id];
      if (health && !health.healthy && health.failureCount >= 3) return false;

      // 3. Proactive Codec Pruning
      if (s.id.includes('hevc') && !supported.hevc) return false;
      if (s.id.includes('av1') && !supported.av1) return false;

      return true;
    }).sort((a, b) => {
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

  private async warmStream(url: string) {
    if (!url || url.startsWith('magnet:')) return;
    
    try {
      // Use a low-priority fetch to warm the connection/DNS/CDN
      // mode: 'no-cors' is safest for arbitrary streaming URLs
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        // Using a header that is likely to trigger a small read but not a full download
        headers: { 'Range': 'bytes=0-1' } 
      } as any); 
      
      clearTimeout(timeout);
      console.log(`[StreamingOptimizer] Stream warmed: ${url.substring(0, 60)}...`);
    } catch (e) {
      // Silently fail warming, it's a best-effort optimization
    }
  }

  async preloadSources(
    contentId: string,
    type: 'movie' | 'tv' | 'anime' | 'series',
    season: number = 1,
    episode: number = 1,
    title: string = '',
    audioPreference: string = 'dub'
  ): Promise<PreloadedSource | null> {
    const idStr = String(contentId).replace('tmdb_', '');
    if (!idStr || idStr === 'undefined' || idStr === 'null' || idStr.startsWith('mock-')) {
      return null;
    }

    // Movies should only ever fetch S1 E1 or just the ID
    const effectiveSeason = type === 'movie' ? 1 : Math.max(1, season);
    const effectiveEpisode = type === 'movie' ? 1 : Math.max(1, episode);

    const key = this.getPreloadKey(contentId, type, effectiveSeason, effectiveEpisode);

    if (this.state.currentPreloading.has(key)) {
      return this.state.preloadedSources[key] || null;
    }

    if (this.state.preloadedSources[key]) {
      const cached = this.state.preloadedSources[key];
      if (Date.now() - cached.loadedAt < this.preloadCacheExpiry) {
        // Even if cached, if it's the next episode we might want to re-warm the stream
        if (cached.sources?.[0]?.url) {
          this.warmStream(cached.sources[0].url);
        }
        return cached;
      }
    }

    this.state.currentPreloading.add(key);

    const fetchWithRetry = async (attempt: number = 1): Promise<PreloadedSource | null> => {
      try {
        const params = new URLSearchParams({
          id: idStr,
          type: (type === 'movie') ? 'movie' : 'tv',
          season: effectiveSeason.toString(),
          episode: effectiveEpisode.toString(),
          title,
          audioPreference,
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(`${API_BASE_URL}/sources?${params.toString()}`, {
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();

          if (data?.sources?.length > 0) {
            // Filter sources based on codec support
            const supportedSources = data.sources.filter((s: any) => {
              if (!s.codec) return true; // Assume supported if not specified
              const codec = s.codec.toLowerCase();
              if (codec.includes('hevc') || codec.includes('h265')) return this.state.codecSupport.hevc;
              if (codec.includes('av1')) return this.state.codecSupport.av1;
              if (codec.includes('vp9')) return this.state.codecSupport.vp9;
              return true;
            });

            if (supportedSources.length === 0 && data.sources.length > 0) {
              console.warn('[StreamingOptimizer] All returned sources use unsupported codecs. Falling back to primary.');
            }

            const bestSources = supportedSources.length > 0 ? supportedSources : data.sources;

            const preloadResult: PreloadedSource = {
              sources: bestSources,
              subtitles: data.subtitles || [],
              quality: data.sources[0]?.quality || 'auto',
              provider: data.sources[0]?.provider || 'unknown',
              loadedAt: Date.now(),
            };

            this.state.preloadedSources[key] = preloadResult;

            // CRITICAL: Warm the best source immediately after discovery
            if (bestSources[0]?.url) {
              this.warmStream(bestSources[0].url);
            }

            return preloadResult;
          }
        }

        // If we got an empty response or error, retry once
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          return fetchWithRetry(attempt + 1);
        }
      } catch (error) {
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

  /**
   * Proactively trigger source negotiation for specific content
   */
  async preWarmContent(title: string, type: string, season: number, episode: number) {
    if (this.state.blacklist.has(title)) return;
    
    console.log(`[StreamingOptimizer] Pre-warming handshake for: ${title}`);
    
    // Trigger parallel health checks for top sources if they are stale
    const top = this.getRankedSources().slice(0, 3);
    await Promise.allSettled(top.map(s => this.checkSourceHealth(s)));
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
