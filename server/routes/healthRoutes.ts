/**
 * Health Check Routes
 * Provides system health monitoring endpoints for the watchdog
 */

import express from 'express';
import { performance } from 'perf_hooks';

const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  res.status(200).json({
    status: 'healthy',
    timestamp,
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    pid: process.pid,
    version: process.env.CELESTEOS_VERSION || '1.0.0-mvp'
  });
});

// Detailed system status
router.get('/status', (req, res) => {
  const startTime = performance.now();
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  const status = {
    system: {
      status: 'operational',
      uptime: `${Math.floor(uptime)}s`,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    },
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    services: {
      api: 'healthy',
      nas: process.env.NAS_MODE === 'production' ? 'connected' : 'fallback',
      telemetry: 'active',
      auth: 'operational'
    },
    performance: {
      responseTime: Math.round((performance.now() - startTime) * 100) / 100
    }
  };
  
  res.status(200).json(status);
});

// Ready check (for load balancers)
router.get('/ready', (req, res) => {
  // Add any startup checks here
  res.status(200).json({ 
    ready: true,
    timestamp: new Date().toISOString() 
  });
});

// Liveness probe (for container orchestration)
router.get('/live', (req, res) => {
  res.status(200).json({ 
    alive: true,
    timestamp: new Date().toISOString() 
  });
});

export default router;