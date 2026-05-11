/**
 * NovaStream Circuit Breaker
 * 
 * Protects the application from resource exhaustion and long timeouts
 * when external services (like TMDB) are experiencing issues.
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Service is down, fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back up
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly threshold: number;
  private readonly resetTimeout: number;
  private readonly name: string;

  constructor(name: string, threshold = 5, resetTimeout = 30000) {
    this.name = name;
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        console.warn(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN to test recovery...`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        const remaining = Math.round((this.resetTimeout - (now - this.lastFailureTime)) / 1000);
        throw new Error(`Circuit Breaker for ${this.name} is OPEN. Failing fast. Retry in ${remaining}s.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error: any) {
      // Don't count cancellation as failure
      if (error.name === 'CanceledError' || error.message?.includes('aborted')) {
        throw error;
      }
      
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    if (this.state !== CircuitState.CLOSED) {
      console.log(`[CircuitBreaker:${this.name}] Service recovered. Transitioning to CLOSED.`);
    }
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: any) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    const statusCode = error.response?.status;
    
    // Immediate open for critical maintenance or blocked keys (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      this.state = CircuitState.OPEN;
      console.error(`[CircuitBreaker:${this.name}] Critical Auth Error (${statusCode}). State changed to OPEN.`);
      return;
    }

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      console.error(`[CircuitBreaker:${this.name}] Failure threshold reached (${this.failureCount}/${this.threshold}). State changed to OPEN.`);
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}

// Global instances for core services
export const tmdbCircuit = new CircuitBreaker('TMDB', 10, 60000); // 10 failures, 60s cooldown
