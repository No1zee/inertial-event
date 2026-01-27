import React from 'react';
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              logger.performance('Page Load', navEntry.loadEventEnd - navEntry.loadEventStart, {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                transferSize: navEntry.transferSize
              });
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        logger.debug('Navigation observer not supported', { error });
      }

      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        logger.debug('Long task observer not supported', { error });
      }

      // Monitor resource loading
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resource = entry as PerformanceResourceTiming;
              logger.debug('Resource loaded', {
                name: resource.name,
                duration: resource.duration,
                size: resource.transferSize,
                type: this.getResourceType(resource.name)
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        logger.debug('Resource observer not supported', { error });
      }
    }
  }

  private getFirstPaint(): number | undefined {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint?.startTime;
    }
    return undefined;
  }

  private getFirstContentfulPaint(): number | undefined {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return firstContentfulPaint?.startTime;
    }
    return undefined;
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['js', 'mjs'].includes(extension || '')) return 'script';
    if (['css'].includes(extension || '')) return 'stylesheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'font';
    return 'other';
  }

  startTimer(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    this.metrics.set(id, metric);
    logger.debug(`Timer started: ${name}`, { timerId: id, metadata });
    return id;
  }

  endTimer(id: string, additionalMetadata?: Record<string, any>): PerformanceMetric | undefined {
    const metric = this.metrics.get(id);
    if (!metric) {
      logger.warn(`Timer not found: ${id}`);
      return undefined;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    logger.performance(metric.name, metric.duration, metric.metadata);
    this.metrics.delete(id);
    return metric;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const timerId = this.startTimer(name, metadata);
    
    return fn().finally(() => {
      this.endTimer(timerId);
    });
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const timerId = this.startTimer(name, metadata);
    try {
      const result = fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId, { error: true });
      throw error;
    }
  }

  getCoreWebVitals(): {
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  } {
    const vitals: any = {};

    if (typeof window !== 'undefined' && 'performance' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
        }
      } catch (error) {
        logger.debug('Could not get LCP', { error });
      }

      // First Contentful Paint (FCP)
      vitals.FCP = this.getFirstContentfulPaint();

      // Time to First Byte (TTFB)
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const navEntry = navEntries[0] as PerformanceNavigationTiming;
          vitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        }
      } catch (error) {
        logger.debug('Could not get TTFB', { error });
      }

      // First Input Delay (FID) - would need additional setup
      // Cumulative Layout Shift (CLS) - would need additional setup
    }

    return vitals;
  }

  logCoreWebVitals(): void {
    const vitals = this.getCoreWebVitals();
    logger.info('Core Web Vitals', vitals);
  }

  getActiveTimers(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startTimer = (name: string, metadata?: Record<string, any>) => {
  return performanceMonitor.startTimer(name, metadata);
};

export const endTimer = (id: string, additionalMetadata?: Record<string, any>) => {
  return performanceMonitor.endTimer(id, additionalMetadata);
};

export const measureAsync = async <T>(
  name: string, 
  fn: () => Promise<T>, 
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.measureAsync(name, fn, metadata);
};

export const measureSync = <T>(
  name: string, 
  fn: () => T, 
  metadata?: Record<string, any>
): T => {
  return performanceMonitor.measureSync(name, fn, metadata);
};

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const startTime = React.useRef<number>();

  const startMeasurement = React.useCallback((name: string) => {
    startTime.current = performance.now();
    logger.debug(`React component measurement started: ${name}`);
  }, []);

  const endMeasurement = React.useCallback((name: string, metadata?: Record<string, any>) => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      logger.performance(`React Component: ${name}`, duration, metadata);
      startTime.current = undefined;
    }
  }, []);

  return { startMeasurement, endMeasurement };
};