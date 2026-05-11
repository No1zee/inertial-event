/**
 * Aegis Shield v2: Automated High-Performance Streaming Guard
 * Monitoring buffer health and orchestrating seamless failovers
 */

import { streamingOptimizer } from './streamingOptimizer';

export interface ShieldStatus {
  active: boolean;
  health: 'optimal' | 'degraded' | 'critical';
  bufferedDuration: number;
  bandwidth: number;
  lastFailover?: number;
  recommendation?: string;
  currentSourceId?: string;
  handshakeLatency?: number;
  codecStatus?: {
    codec: string;
    hardwareAccelerated: boolean;
    audioCodec?: string;
  };
  tracks?: {
    audio: number;
    subtitles: number;
  };
}

class AegisShield {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private onStatusChange: ((status: ShieldStatus) => void) | null = null;
  
  private thresholds = {
    degraded: 15, // seconds of buffer
    critical: 5,   // seconds of buffer
    failoverDelay: 30000, // min time between auto-failovers
  };

  private state: ShieldStatus = {
    active: false,
    health: 'optimal',
    bufferedDuration: 0,
    bandwidth: 0,
  };

  private lastFailover = 0;
  private monitorStartTime = 0;

  private monitoringEnabled = true;

  startMonitoring(callback: (status: ShieldStatus) => void) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.onStatusChange = callback;
    this.state.active = true;
    this.state.health = 'optimal';
    this.state.bufferedDuration = 0;
    this.monitoringEnabled = true;
    this.monitorStartTime = Date.now();
    
    // Notify immediately with initial state
    this.notify();
    
    this.monitoringInterval = setInterval(() => {
      this.audit();
    }, 2000);
  }

  setMonitoringEnabled(enabled: boolean) {
    this.monitoringEnabled = enabled;
    if (enabled) {
      this.monitorStartTime = Date.now(); // Reset warmup when re-enabling
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.state.active = false;
  }

  updateMetrics(bufferedDuration: number, bandwidth: number, videoElement?: HTMLVideoElement) {
    this.state.bufferedDuration = bufferedDuration;
    this.state.bandwidth = bandwidth;
    
    if (videoElement) {
      if ((videoElement as any).getVideoPlaybackQuality) {
        const quality = (videoElement as any).getVideoPlaybackQuality();
        const isAccelerated = quality.droppedVideoFrames === 0 || 
                             (quality.totalVideoFrames > 0 && (quality.droppedVideoFrames / quality.totalVideoFrames) < 0.01);
        
        this.state.codecStatus = {
          codec: this.detectCurrentCodec(videoElement),
          hardwareAccelerated: isAccelerated,
          audioCodec: (videoElement as any).audioTracks?.[0]?.label || 'AAC',
        };
      }

      this.state.tracks = {
        audio: (videoElement as any).audioTracks?.length || 0,
        subtitles: (videoElement as any).textTracks?.length || 0,
      };
    }

    streamingOptimizer.updateBufferHealth(bufferedDuration, bandwidth, 'auto');
  }

  private detectCurrentCodec(video: HTMLVideoElement): string {
    // Attempt to extract codec info from video tracks or player state
    try {
      const videoTrack = (video as any).videoTracks?.[0];
      if (videoTrack?.label) return videoTrack.label;
      
      // Fallback: guess based on file extension or source URL if available
      const src = video.currentSrc.toLowerCase();
      if (src.includes('hevc') || src.includes('h265')) return 'HEVC';
      if (src.includes('av1')) return 'AV1';
      return 'H.264';
    } catch {
      return 'Unknown';
    }
  }

  updateCurrentSource(sourceId: string) {
    this.state.currentSourceId = sourceId;
  }

  setHandshakeLatency(ms: number) {
    this.state.handshakeLatency = ms;
    this.notify();
  }

  private async audit() {
    if (!this.state.active || !this.monitoringEnabled) return;

    // Warmup period: allow 12 seconds (60s in tests) before triggering critical alerts
    const warmupTime = (typeof window !== 'undefined' && (window as any).ELECTRON_TEST_MODE) ? 60000 : 12000;
    const isWarmingUp = Date.now() - this.monitorStartTime < warmupTime;
    const { bufferedDuration } = this.state;
    let newHealth: ShieldStatus['health'] = 'optimal';

    if (bufferedDuration < this.thresholds.critical && !isWarmingUp) {
      newHealth = 'critical';
    } else if (bufferedDuration < this.thresholds.degraded && !isWarmingUp) {
      newHealth = 'degraded';
    }

    if (newHealth !== this.state.health) {
      this.state.health = newHealth;
      
      if (newHealth === 'critical') {
        await this.handleCriticalHealth();
      }
      
      this.notify();
    }
  }

  public async triggerCriticalFailover() {
    this.state.health = 'critical';
    await this.handleCriticalHealth();
    this.notify();
  }

  private async handleCriticalHealth() {
    const now = Date.now();
    if (now - this.lastFailover < this.thresholds.failoverDelay) return;

    console.warn('[AegisShield] Critical buffer starvation detected. Initiating automated failover protocol.');
    
    if (this.state.currentSourceId) {
      streamingOptimizer.reportFailure(this.state.currentSourceId);
    }

    // Ranked sources check
    const ranked = streamingOptimizer.getRankedSources();
    if (ranked.length > 0) {
      this.state.recommendation = ranked[0].id;
      this.lastFailover = now;
      this.state.lastFailover = now;
    }
  }

  private notify() {
    if (this.onStatusChange) {
      this.onStatusChange({ ...this.state });
    }
  }
}

export const aegisShield = new AegisShield();
export default aegisShield;
