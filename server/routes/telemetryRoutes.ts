/**
 * Telemetry API Routes
 * Provides telemetry endpoints for monitoring yacht fleet health
 */

import { Request, Response } from 'express';
import { telemetryService } from '../services/telemetryService';

interface TelemetryRequestBody {
  workflow_id?: string;
  stage?: string;
  success?: boolean;
  response_time_ms?: number;
  metadata?: Record<string, any>;
  error_message?: string;
}

/**
 * POST /api/telemetry/track
 * Track a workflow stage completion
 */
export async function trackTelemetryEvent(req: Request, res: Response): Promise<void> {
  try {
    const {
      workflow_id = 'unknown',
      stage = 'unknown',
      success = false,
      response_time_ms = 0,
      metadata = {},
      error_message
    }: TelemetryRequestBody = req.body;

    // Validate required fields
    if (!workflow_id || !stage) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: workflow_id, stage'
      });
      return;
    }

    // Track the event
    telemetryService.trackWorkflowStage(
      workflow_id,
      stage,
      success,
      response_time_ms,
      metadata,
      error_message
    );

    res.json({
      success: true,
      message: 'Telemetry event tracked successfully',
      data: {
        workflow_id,
        stage,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Telemetry tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track telemetry event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/telemetry/health
 * Get current system health status
 */
export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    const startTime = Date.now();
    const health = await telemetryService.getSystemHealth();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'System health retrieved successfully',
      data: health,
      response_time_ms: responseTime
    });

  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/telemetry/metrics
 * Get workflow performance metrics
 */
export async function getWorkflowMetrics(req: Request, res: Response): Promise<void> {
  try {
    const startTime = Date.now();
    const metrics = telemetryService.calculateMetrics();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Workflow metrics calculated successfully',
      data: metrics,
      response_time_ms: responseTime
    });

  } catch (error) {
    console.error('Metrics calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/telemetry/debug
 * Export sanitized debug information
 */
export async function exportDebugInfo(req: Request, res: Response): Promise<void> {
  try {
    const startTime = Date.now();
    const debugInfo = telemetryService.exportDebugInfo();
    const responseTime = Date.now() - startTime;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="celesteos_debug_${Date.now()}.json"`);

    res.json({
      success: true,
      message: 'Debug information exported successfully',
      data: debugInfo,
      response_time_ms: responseTime,
      export_note: 'This debug export contains no sensitive customer data or business logic'
    });

  } catch (error) {
    console.error('Debug export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export debug information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/telemetry/batch
 * Track multiple telemetry events in a single request
 */
export async function trackBatchTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      res.status(400).json({
        success: false,
        message: 'Invalid request: events must be an array'
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each event
    for (const event of events) {
      try {
        const {
          workflow_id = 'batch',
          stage = 'unknown',
          success = false,
          response_time_ms = 0,
          metadata = {},
          error_message
        } = event;

        telemetryService.trackWorkflowStage(
          workflow_id,
          stage,
          success,
          response_time_ms,
          metadata,
          error_message
        );

        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Batch event processing error:', error);
      }
    }

    res.json({
      success: true,
      message: 'Batch telemetry processed',
      data: {
        total_events: events.length,
        successful_events: successCount,
        failed_events: errorCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Batch telemetry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch telemetry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/telemetry/dashboard
 * Serve simple telemetry dashboard HTML
 */
export function serveTelemetryDashboard(req: Request, res: Response): void {
  const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CelesteOS Fleet Telemetry</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0a0a0a;
            color: #ffffff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            color: #94a3b8;
            margin: 10px 0 0 0;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .card h3 {
            color: #3b82f6;
            margin: 0 0 15px 0;
            font-size: 1.2em;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #374151;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            color: #d1d5db;
        }
        .metric-value {
            color: #22c55e;
            font-weight: bold;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-connected { background-color: #22c55e; }
        .status-disconnected { background-color: #ef4444; }
        .status-degraded { background-color: #f59e0b; }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
            font-size: 16px;
        }
        .refresh-btn:hover {
            background: #2563eb;
        }
        .loading {
            text-align: center;
            color: #94a3b8;
            padding: 20px;
        }
        .error {
            color: #ef4444;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚢 CelesteOS Fleet Telemetry</h1>
        <p>Real-time monitoring of yacht AI systems</p>
    </div>

    <div id="dashboard" class="dashboard">
        <div class="loading">Loading telemetry data...</div>
    </div>

    <button class="refresh-btn" onclick="loadDashboard()">🔄 Refresh Data</button>

    <script>
        async function loadDashboard() {
            const dashboard = document.getElementById('dashboard');
            dashboard.innerHTML = '<div class="loading">Loading telemetry data...</div>';

            try {
                // Load system health
                const healthResponse = await fetch('/api/telemetry/health');
                const healthData = await healthResponse.json();

                // Load workflow metrics
                const metricsResponse = await fetch('/api/telemetry/metrics');
                const metricsData = await metricsResponse.json();

                // Render dashboard
                dashboard.innerHTML = generateDashboardHTML(healthData.data, metricsData.data);
            } catch (error) {
                dashboard.innerHTML = '<div class="error">Failed to load telemetry data: ' + error.message + '</div>';
            }
        }

        function generateDashboardHTML(health, metrics) {
            return \`
                <div class="card">
                    <h3>🔌 System Health</h3>
                    <div class="metric">
                        <span class="metric-label">
                            <span class="status-indicator status-\${health.nas_status}"></span>
                            NAS Connection
                        </span>
                        <span class="metric-value">\${health.nas_status.toUpperCase()}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">
                            <span class="status-indicator status-\${health.ollama_status === 'running' ? 'connected' : 'disconnected'}"></span>
                            Ollama AI
                        </span>
                        <span class="metric-value">\${health.ollama_status.toUpperCase()}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">
                            <span class="status-indicator status-\${health.chromadb_status === 'healthy' ? 'connected' : 'disconnected'}"></span>
                            ChromaDB
                        </span>
                        <span class="metric-value">\${health.chromadb_status.toUpperCase()}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">System Uptime</span>
                        <span class="metric-value">\${health.uptime_hours}h</span>
                    </div>
                </div>

                <div class="card">
                    <h3>📊 Workflow Performance</h3>
                    <div class="metric">
                        <span class="metric-label">Total Queries</span>
                        <span class="metric-value">\${metrics.total_queries}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Success Rate</span>
                        <span class="metric-value">\${Math.round(metrics.success_rate * 100)}%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Avg Response Time</span>
                        <span class="metric-value">\${metrics.avg_response_time}ms</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">NAS Connectivity</span>
                        <span class="metric-value">\${Math.round(metrics.nas_connectivity_rate * 100)}%</span>
                    </div>
                </div>

                <div class="card">
                    <h3>🎯 Document Effectiveness</h3>
                    <div class="metric">
                        <span class="metric-label">Successful Queries</span>
                        <span class="metric-value">\${metrics.successful_queries}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Failed Queries</span>
                        <span class="metric-value">\${metrics.failed_queries}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Document Effectiveness</span>
                        <span class="metric-value">\${Math.round(metrics.document_effectiveness_score * 100)}%</span>
                    </div>
                </div>

                <div class="card">
                    <h3>🛠️ Debug Actions</h3>
                    <div style="text-align: center;">
                        <button onclick="exportDebugInfo()" style="background: #059669; color: white; border: none; padding: 10px 15px; border-radius: 5px; margin: 5px; cursor: pointer;">
                            📥 Export Debug Info
                        </button>
                        <button onclick="window.open('/api/telemetry/debug', '_blank')" style="background: #7c3aed; color: white; border: none; padding: 10px 15px; border-radius: 5px; margin: 5px; cursor: pointer;">
                            🔍 View Raw Debug
                        </button>
                    </div>
                </div>
            \`;
        }

        async function exportDebugInfo() {
            try {
                const response = await fetch('/api/telemetry/debug');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'celesteos_debug_' + Date.now() + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                alert('Failed to export debug info: ' + error.message);
            }
        }

        // Auto-refresh every 30 seconds
        setInterval(loadDashboard, 30000);

        // Load dashboard on page load
        loadDashboard();
    </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(dashboardHTML);
}