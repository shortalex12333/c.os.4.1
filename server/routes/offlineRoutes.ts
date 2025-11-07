/**
 * Offline Mode API Routes
 * Manages offline fallback functionality and degraded mode
 */

import { Request, Response } from 'express';
import { offlineService } from '../services/offlineService';
import { telemetryService } from '../services/telemetryService';

/**
 * GET /api/offline/status
 * Get offline service status and metrics
 */
export async function getOfflineStatus(req: Request, res: Response): Promise<void> {
  try {
    const startTime = Date.now();
    
    const metrics = offlineService.getMetrics();
    const connectivity = await offlineService.testConnectivity();
    const isDegraded = offlineService.isDegradedMode();
    
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Offline status retrieved successfully',
      data: {
        degraded_mode: isDegraded,
        cache_metrics: metrics,
        connectivity: connectivity,
        status: isDegraded ? 'degraded' : 'online'
      },
      response_time_ms: responseTime
    });

    // Track telemetry
    telemetryService.trackWorkflowStage(
      'offline_status_check',
      'status_retrieval',
      true,
      responseTime,
      { degraded_mode: isDegraded, cache_size: metrics.cache_size }
    );

  } catch (error) {
    console.error('Offline status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve offline status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/offline/search
 * Search cached queries with fallback to live search
 */
export async function searchWithOfflineFallback(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { query, category, force_offline = false } = req.body;

  if (!query) {
    res.status(400).json({
      success: false,
      message: 'Query parameter is required'
    });
    return;
  }

  try {
    let result = null;
    let source = 'cache';
    
    // Always check cache first
    const cachedResult = await offlineService.searchCache(query, category);
    
    if (cachedResult) {
      result = cachedResult;
      source = 'cache';
    } else if (!force_offline && !offlineService.isDegradedMode()) {
      // Try live search if not in degraded mode and not forced offline
      try {
        const liveResponse = await fetch('http://localhost:8080/api/nas/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, category }),
          signal: AbortSignal.timeout(10000)
        });

        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          result = liveData;
          source = 'live';
          
          // Cache successful live results
          if (liveData.success) {
            await offlineService.cacheQueryResult(
              query,
              category,
              liveData,
              Date.now() - startTime,
              0.8
            );
          }
        }
      } catch (liveError) {
        console.log('Live search failed, using degraded mode');
        offlineService.enableDegradedMode('Live search unavailable');
      }
    }

    const responseTime = Date.now() - startTime;

    if (result) {
      res.json({
        success: true,
        message: `Search completed using ${source}`,
        data: {
          ...result,
          search_source: source,
          degraded_mode: offlineService.isDegradedMode(),
          cache_hit: source === 'cache'
        },
        response_time_ms: responseTime
      });

      // Track successful search
      telemetryService.trackDocumentSearch(
        query,
        result.data?.results || 1,
        0.8,
        responseTime,
        source
      );

    } else {
      res.status(404).json({
        success: false,
        message: 'No results found in cache and live search unavailable',
        data: {
          degraded_mode: offlineService.isDegradedMode(),
          cache_miss: true,
          suggestion: 'Try different search terms or wait for connectivity'
        },
        response_time_ms: responseTime
      });

      // Track failed search
      telemetryService.trackWorkflowStage(
        'offline_search_failure',
        'search_execution',
        false,
        responseTime,
        { query_length: query.length },
        'No cached results and live search unavailable'
      );
    }

  } catch (error) {
    console.error('Offline search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/offline/cache
 * Manually cache a query result (for testing)
 */
export async function cacheQueryResult(req: Request, res: Response): Promise<void> {
  try {
    const { query, category, response, response_time_ms = 100, relevance_score = 0.8 } = req.body;

    if (!query || !response) {
      res.status(400).json({
        success: false,
        message: 'Query and response are required'
      });
      return;
    }

    await offlineService.cacheQueryResult(
      query,
      category,
      response,
      response_time_ms,
      relevance_score
    );

    res.json({
      success: true,
      message: 'Query result cached successfully',
      data: {
        query: query.substring(0, 50) + '...',
        category,
        cached_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cache query result',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/offline/degraded/enable
 * Manually enable degraded mode
 */
export function enableDegradedMode(req: Request, res: Response): void {
  try {
    const { reason = 'Manual activation' } = req.body;
    
    offlineService.enableDegradedMode(reason);

    res.json({
      success: true,
      message: 'Degraded mode enabled',
      data: {
        reason,
        enabled_at: new Date().toISOString(),
        cache_size: offlineService.getMetrics().cache_size
      }
    });

  } catch (error) {
    console.error('Enable degraded mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable degraded mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/offline/degraded/disable
 * Manually disable degraded mode
 */
export function disableDegradedMode(req: Request, res: Response): void {
  try {
    offlineService.disableDegradedMode();

    res.json({
      success: true,
      message: 'Degraded mode disabled',
      data: {
        disabled_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Disable degraded mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable degraded mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/offline/connectivity
 * Test connectivity to all services
 */
export async function testConnectivity(req: Request, res: Response): Promise<void> {
  try {
    const startTime = Date.now();
    const connectivity = await offlineService.testConnectivity();
    const responseTime = Date.now() - startTime;

    const allOnline = Object.values(connectivity).every(status => status);
    const anyOnline = Object.values(connectivity).some(status => status);

    res.json({
      success: true,
      message: 'Connectivity test completed',
      data: {
        services: connectivity,
        overall_status: allOnline ? 'fully_online' : anyOnline ? 'partially_online' : 'offline',
        degraded_mode: offlineService.isDegradedMode(),
        test_timestamp: new Date().toISOString()
      },
      response_time_ms: responseTime
    });

    // Track connectivity test
    telemetryService.trackWorkflowStage(
      'connectivity_test',
      'service_connectivity_check',
      anyOnline,
      responseTime,
      { services_online: Object.values(connectivity).filter(Boolean).length }
    );

  } catch (error) {
    console.error('Connectivity test error:', error);
    res.status(500).json({
      success: false,
      message: 'Connectivity test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/offline/cache/popular
 * Get most popular cached queries
 */
export function getPopularQueries(req: Request, res: Response): void {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const popularQueries = offlineService.getPopularQueries(limit);

    res.json({
      success: true,
      message: 'Popular queries retrieved',
      data: {
        queries: popularQueries,
        total_cached: offlineService.getMetrics().cache_size
      }
    });

  } catch (error) {
    console.error('Popular queries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular queries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/offline/cache
 * Clear the entire cache
 */
export function clearCache(req: Request, res: Response): void {
  try {
    const previousSize = offlineService.getMetrics().cache_size;
    offlineService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        previous_cache_size: previousSize,
        cleared_at: new Date().toISOString()
      }
    });

    // Track cache clear
    telemetryService.trackWorkflowStage(
      'cache_maintenance',
      'cache_clear',
      true,
      0,
      { previous_size: previousSize }
    );

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}