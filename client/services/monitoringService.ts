interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface UserAnalytics {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private performanceBuffer: PerformanceMetric[] = [];
  private errorBuffer: ErrorReport[] = [];
  private analyticsBuffer: UserAnalytics[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
    this.initializeErrorHandling();
    this.startPeriodicFlush();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              this.recordMetric('cls', (entry as any).value);
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Long Tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long_task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });

      } catch (error) {
        console.warn('Failed to initialize performance observers:', error);
      }
    }

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor animation performance
    this.monitorAnimationPerformance();
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize);
        this.recordMetric('memory_total', memory.totalJSHeapSize);
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
        
        // Alert if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          this.recordError({
            message: `High memory usage: ${usagePercent.toFixed(1)}%`,
            component: 'MemoryMonitor',
            metadata: {
              memoryUsage: memory.usedJSHeapSize,
              memoryLimit: memory.jsHeapSizeLimit,
              usagePercent,
            },
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private monitorAnimationPerformance(): void {
    // DISABLED - Animation monitoring was causing severe performance issues and console spam
    // Performance monitoring will be handled more conservatively
  }

  private initializeErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        metadata: {
          reason: event.reason,
        },
      });
    });

    // React error boundary integration
    if (typeof window !== 'undefined') {
      (window as any).__CELESTE_ERROR_REPORTER__ = (error: Error, errorInfo: any) => {
        this.recordError({
          message: error.message,
          stack: error.stack,
          component: 'ReactErrorBoundary',
          metadata: errorInfo,
        });
      };
    }
  }

  private startPeriodicFlush(): void {
    // DISABLED - Monitoring was causing performance issues
    // this.flushInterval = setInterval(() => {
    //   this.flush();
    // }, 30000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Flush on visibility change (tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.performanceBuffer.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Auto-flush if buffer is getting large
    if (this.performanceBuffer.length > 100) {
      this.flush();
    }
  }

  public recordError(error: Omit<ErrorReport, 'timestamp' | 'userAgent' | 'url'>): void {
    this.errorBuffer.push({
      ...error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.userId,
    });

    // Auto-flush errors immediately for critical issues
    if (this.errorBuffer.length > 0) {
      this.flush();
    }
  }

  public trackEvent(event: string, properties: Record<string, any> = {}): void {
    this.analyticsBuffer.push({
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    });

    // Auto-flush if buffer is getting large
    if (this.analyticsBuffer.length > 50) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.performanceBuffer.length === 0 && 
        this.errorBuffer.length === 0 && 
        this.analyticsBuffer.length === 0) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      performance: [...this.performanceBuffer],
      errors: [...this.errorBuffer],
      analytics: [...this.analyticsBuffer],
      metadata: {
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connection: this.getConnectionInfo(),
      },
    };

    // Clear buffers
    this.performanceBuffer = [];
    this.errorBuffer = [];
    this.analyticsBuffer = [];

    try {
      // DISABLED - Console logging was causing spam
      // if (process.env.NODE_ENV === 'development') {
      //   console.group('📊 CelesteOS Monitoring Data');
      //   console.log('Performance:', payload.performance);
      //   console.log('Errors:', payload.errors);
      //   console.log('Analytics:', payload.analytics);
      //   console.groupEnd();
      // }

      // Store locally for debugging
      this.storeLocally(payload);

      // Send to monitoring service (if configured)
      await this.sendToMonitoringService(payload);

    } catch (error) {
      console.warn('Failed to flush monitoring data:', error);
      
      // Restore buffers on failure
      this.performanceBuffer.push(...payload.performance);
      this.errorBuffer.push(...payload.errors);
      this.analyticsBuffer.push(...payload.analytics);
    }
  }

  private getConnectionInfo(): Record<string, any> {
    const connection = (navigator as any).connection || {};
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  private storeLocally(payload: any): void {
    try {
      const stored = JSON.parse(localStorage.getItem('celesteos_monitoring') || '[]');
      stored.push(payload);
      
      // Keep only last 10 entries
      if (stored.length > 10) {
        stored.splice(0, stored.length - 10);
      }
      
      localStorage.setItem('celesteos_monitoring', JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to store monitoring data locally:', error);
    }
  }

  private async sendToMonitoringService(payload: any): Promise<void> {
    // This would send to your monitoring service (e.g., DataDog, New Relic, custom endpoint)
    // For now, we'll just simulate the call
    
    const monitoringEndpoint = process.env.VITE_MONITORING_ENDPOINT;
    if (!monitoringEndpoint) {
      return; // No monitoring endpoint configured
    }

    try {
      await fetch(monitoringEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to send monitoring data:', error);
      throw error;
    }
  }

  public getStoredMetrics(): any[] {
    try {
      return JSON.parse(localStorage.getItem('celesteos_monitoring') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve stored metrics:', error);
      return [];
    }
  }

  public clearStoredMetrics(): void {
    try {
      localStorage.removeItem('celesteos_monitoring');
    } catch (error) {
      console.warn('Failed to clear stored metrics:', error);
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Final flush
    this.flush();
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();

// Convenience functions
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  monitoringService.trackEvent(event, properties);
};

export const recordError = (error: Error, component?: string, metadata?: Record<string, any>) => {
  monitoringService.recordError({
    message: error.message,
    stack: error.stack,
    component,
    metadata,
  });
};

export const recordMetric = (name: string, value: number, metadata?: Record<string, any>) => {
  monitoringService.recordMetric(name, value, metadata);
};

export default monitoringService;