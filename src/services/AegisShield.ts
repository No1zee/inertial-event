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

  startMonitoring(callback: (status: ShieldStatus) => void) {
    this.onStatusChange = callback;
    this.state.active = true;
    this.state.health = 'optimal';
    this.state.bufferedDuration = 0;
    this.monitorStartTime = Date.now();
    
    this.monitoringInterval = setInterval(() => {
      this.audit();
    }, 2000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.state.active = false;
  }

  updateMetrics(bufferedDuration: number, bandwidth: number) {
    this.state.bufferedDuration = bufferedDuration;
    this.state.bandwidth = bandwidth;
    streamingOptimizer.updateBufferHealth(bufferedDuration, bandwidth, 'auto');
  }

  updateCurrentSource(sourceId: string) {
    this.state.currentSourceId = sourceId;
  }

  private async audit() {
    if (!this.state.active) return;

    // Warmup period: allow 12 seconds before triggering critical alerts
    const isWarmingUp = Date.now() - this.monitorStartTime < 12000;
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
