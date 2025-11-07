/**
 * Telemetry Service for CelesteOS Yacht AI
 * Tracks workflow performance and system health anonymously
 */

interface TelemetryEvent {
  timestamp: string;
  event_type: string;
  workflow_id: string;
  stage: string;
  success: boolean;
  response_time_ms: number;
  metadata: Record<string, any>;
  error_message?: string;
  system_info: {
    version: string;
    environment: string;
    yacht_id?: string;
  };
}

interface WorkflowMetrics {
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  success_rate: number;
  avg_response_time: number;
  nas_connectivity_rate: number;
  document_effectiveness_score: number;
}

interface SystemHealth {
  nas_status: 'connected' | 'disconnected' | 'degraded';
  ollama_status: 'running' | 'stopped' | 'error';
  chromadb_status: 'healthy' | 'unhealthy';
  last_check: string;
  uptime_hours: number;
}

class TelemetryService {
  private telemetryBuffer: TelemetryEvent[] = [];
  private readonly bufferSize = 50;
  private readonly flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicFlush();
  }

  /**
   * Track workflow stage completion
   */
  trackWorkflowStage(
    workflowId: string,
    stage: string,
    success: boolean,
    responseTimeMs: number,
    metadata: Record<string, any> = {},
    errorMessage?: string
  ): void {
    const event: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      event_type: 'workflow_stage',
      workflow_id: workflowId,
      stage: this.sanitizeString(stage),
      success,
      response_time_ms: responseTimeMs,
      metadata: this.sanitizeMetadata(metadata),
      error_message: errorMessage ? this.sanitizeErrorMessage(errorMessage) : undefined,
      system_info: {
        version: process.env.CELESTEOS_VERSION || '1.0.0-mvp',
        environment: process.env.NODE_ENV || 'production'
      }
    };

    this.addToBuffer(event);
  }

  /**
   * Track NAS connectivity status
   */
  trackNASConnectivity(isConnected: boolean, responseTimeMs: number, errorDetails?: string): void {
    this.trackWorkflowStage(
      'nas_connectivity_check',
      'nas_connection',
      isConnected,
      responseTimeMs,
      { connection_type: 'qnap_cloud' },
      errorDetails
    );
  }

  /**
   * Track document search effectiveness
   */
  trackDocumentSearch(
    query: string,
    resultsFound: number,
    relevanceScore: number,
    responseTimeMs: number,
    source: string
  ): void {
    this.trackWorkflowStage(
      'document_search',
      'search_execution',
      resultsFound > 0,
      responseTimeMs,
      {
        query_length: query.length,
        results_count: resultsFound,
        relevance_score: relevanceScore,
        search_source: source
      }
    );
  }

  /**
   * Track AI response generation
   */
  trackAIResponse(
    queryType: string,
    success: boolean,
    responseTimeMs: number,
    tokenCount?: number,
    errorType?: string
  ): void {
    this.trackWorkflowStage(
      'ai_response_generation',
      'response_generation',
      success,
      responseTimeMs,
      {
        query_type: queryType,
        token_count: tokenCount
      },
      errorType
    );
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    // Check NAS connectivity
    const nasStatus = await this.checkNASHealth();
    
    // Check Ollama status
    const ollamaStatus = await this.checkOllamaHealth();
    
    // Check ChromaDB status  
    const chromaStatus = await this.checkChromaDBHealth();

    const health: SystemHealth = {
      nas_status: nasStatus,
      ollama_status: ollamaStatus,
      chromadb_status: chromaStatus,
      last_check: new Date().toISOString(),
      uptime_hours: Math.round(process.uptime() / 3600 * 100) / 100
    };

    // Track the health check itself
    this.trackWorkflowStage(
      'system_health_check',
      'health_monitoring',
      true,
      Date.now() - startTime,
      { health_summary: health }
    );

    return health;
  }

  /**
   * Calculate workflow metrics from recent telemetry
   */
  calculateMetrics(): WorkflowMetrics {
    const recentEvents = this.getRecentEvents(24); // Last 24 hours
    const workflowEvents = recentEvents.filter(e => e.event_type === 'workflow_stage');
    
    const totalQueries = workflowEvents.length;
    const successfulQueries = workflowEvents.filter(e => e.success).length;
    const failedQueries = totalQueries - successfulQueries;
    
    const avgResponseTime = totalQueries > 0 
      ? Math.round(workflowEvents.reduce((sum, e) => sum + e.response_time_ms, 0) / totalQueries)
      : 0;

    const nasEvents = workflowEvents.filter(e => e.stage === 'nas_connection');
    const nasConnectivityRate = nasEvents.length > 0 
      ? Math.round((nasEvents.filter(e => e.success).length / nasEvents.length) * 100) / 100
      : 1.0;

    const searchEvents = workflowEvents.filter(e => e.stage === 'search_execution');
    const documentEffectiveness = searchEvents.length > 0
      ? Math.round(searchEvents.reduce((sum, e) => sum + (e.metadata.relevance_score || 0), 0) / searchEvents.length * 100) / 100
      : 0.8;

    return {
      total_queries: totalQueries,
      successful_queries: successfulQueries,
      failed_queries: failedQueries,
      success_rate: totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) / 100 : 1.0,
      avg_response_time: avgResponseTime,
      nas_connectivity_rate: nasConnectivityRate,
      document_effectiveness_score: documentEffectiveness
    };
  }

  /**
   * Export sanitized debug information
   */
  exportDebugInfo(): any {
    const metrics = this.calculateMetrics();
    const recentEvents = this.getRecentEvents(1).map(event => ({
      timestamp: event.timestamp,
      stage: event.stage,
      success: event.success,
      response_time: event.response_time_ms,
      // Remove sensitive metadata
      metadata_keys: Object.keys(event.metadata)
    }));

    return {
      system_version: process.env.CELESTEOS_VERSION || '1.0.0-mvp',
      export_timestamp: new Date().toISOString(),
      metrics,
      recent_events: recentEvents,
      uptime_hours: Math.round(process.uptime() / 3600 * 100) / 100,
      memory_usage: process.memoryUsage(),
      // No sensitive data included
      note: 'This debug export contains no sensitive customer data, credentials, or business logic'
    };
  }

  /**
   * Private helper methods
   */
  private addToBuffer(event: TelemetryEvent): void {
    this.telemetryBuffer.push(event);
    
    if (this.telemetryBuffer.length >= this.bufferSize) {
      this.flushTelemetry();
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.telemetryBuffer.length > 0) {
        this.flushTelemetry();
      }
    }, this.flushInterval);
  }

  private async flushTelemetry(): Promise<void> {
    if (this.telemetryBuffer.length === 0) return;

    const eventsToFlush = [...this.telemetryBuffer];
    this.telemetryBuffer = [];

    try {
      // In production, send to telemetry endpoint
      // For now, store locally and queue for later transmission
      await this.storeTelemetryLocally(eventsToFlush);
      
      console.log(`📊 Telemetry: Flushed ${eventsToFlush.length} events`);
    } catch (error) {
      console.error('Failed to flush telemetry:', error);
      // Re-queue events on failure
      this.telemetryBuffer.unshift(...eventsToFlush);
    }
  }

  private async storeTelemetryLocally(events: TelemetryEvent[]): Promise<void> {
    // Store in local cache for later transmission when connectivity is restored
    // This ensures telemetry is not lost during network outages
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    
    const telemetryDir = join(process.cwd(), '.telemetry');
    const telemetryFile = join(telemetryDir, `telemetry_${Date.now()}.json`);
    
    try {
      await fs.mkdir(telemetryDir, { recursive: true });
      await fs.writeFile(telemetryFile, JSON.stringify(events, null, 2));
    } catch (error) {
      console.error('Failed to store telemetry locally:', error);
    }
  }

  private async checkNASHealth(): Promise<'connected' | 'disconnected' | 'degraded'> {
    try {
      // Quick connectivity test without exposing credentials
      const testStart = Date.now();
      const response = await fetch('http://localhost:8080/api/nas/status', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.connected ? 'connected' : 'disconnected';
      }
      return 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  }

  private async checkOllamaHealth(): Promise<'running' | 'stopped' | 'error'> {
    try {
      // Check if Ollama is responding on typical port
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        timeout: 3000
      });
      return response.ok ? 'running' : 'error';
    } catch (error) {
      return 'stopped';
    }
  }

  private async checkChromaDBHealth(): Promise<'healthy' | 'unhealthy'> {
    try {
      // Check ChromaDB on port 8001
      const response = await fetch('http://localhost:8001/api/v1/heartbeat', {
        method: 'GET',
        timeout: 3000
      });
      return response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  private getRecentEvents(hours: number): TelemetryEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.telemetryBuffer.filter(event => 
      new Date(event.timestamp) > cutoff
    );
  }

  private sanitizeString(input: string): string {
    // Remove any potentially sensitive information
    return input
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
      .replace(/password|secret|key|token/gi, '[CREDENTIAL]')
      .substring(0, 100); // Limit length
  }

  private sanitizeErrorMessage(error: string): string {
    // Sanitize error messages to remove file paths and sensitive info
    return error
      .replace(/\/[^\s]+/g, '[PATH]') // Remove file paths
      .replace(/at\s+[^\s]+\s+\([^)]+\)/g, '[STACK_TRACE]') // Remove stack traces
      .replace(/Error:\s*/g, '')
      .substring(0, 200);
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[OBJECT]';
      }
    }
    
    return sanitized;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush before shutdown
    if (this.telemetryBuffer.length > 0) {
      this.flushTelemetry();
    }
  }
}

export const telemetryService = new TelemetryService();
export default TelemetryService;