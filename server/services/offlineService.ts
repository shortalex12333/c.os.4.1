/**
 * Offline Fallback Service
 * Provides cached responses when NAS/internet is unavailable
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { telemetryService } from './telemetryService';
import { redisConnection, redisDel, redisGet, redisScanKeys, redisSet } from './redisClient';

interface CachedQueryResult {
  query: string;
  query_hash: string;
  category?: string;
  response: any;
  timestamp: string;
  success: boolean;
  response_time_ms: number;
  relevance_score: number;
  usage_count: number;
  last_used: string;
}

interface OfflineMetrics {
  cache_hits: number;
  cache_misses: number;
  cache_size: number;
  cache_hit_rate: number;
  last_cache_update: string;
  degraded_mode_active: boolean;
}

class OfflineService {
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private readonly maxCacheSize = 100;
  private cache: Map<string, CachedQueryResult> = new Map();
  private readonly redisKeyPrefix = 'yacht:cache:';
  private useRedis = false;
  private metrics: OfflineMetrics;
  private degradedMode = false;

  constructor() {
    this.cacheDir = join(process.cwd(), '.cache');
    this.cacheFile = join(this.cacheDir, 'query_cache.json');
    
    this.metrics = {
      cache_hits: 0,
      cache_misses: 0,
      cache_size: 0,
      cache_hit_rate: 0,
      last_cache_update: new Date().toISOString(),
      degraded_mode_active: false
    };

    this.useRedis = redisConnection.isEnabled;
    this.initializeCache();
  }

  /**
   * Initialize cache from disk
   */
  private initializeCache(): void {
    try {
      if (this.useRedis) {
        // With Redis, we lazily read entries on-demand; no preload needed
        console.log('📦 Redis cache backend enabled');
        return;
      }

      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }

      if (existsSync(this.cacheFile)) {
        const cacheData = JSON.parse(readFileSync(this.cacheFile, 'utf8'));
        this.cache = new Map(cacheData.entries || []);
        this.metrics = { ...this.metrics, ...cacheData.metrics };
        console.log(`📦 Loaded ${this.cache.size} cached queries from disk`);
      }
    } catch (error) {
      console.error('Failed to initialize cache:', error);
      this.cache = new Map();
    }
  }

  /**
   * Save cache to disk
   */
  private persistCache(): void {
    try {
      if (this.useRedis) return; // not needed when using Redis backend
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        metrics: this.metrics,
        last_updated: new Date().toISOString()
      };

      writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  /**
   * Generate hash for query normalization
   */
  private generateQueryHash(query: string, category?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    const hashInput = category ? `${normalizedQuery}:${category}` : normalizedQuery;
    
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache a successful query result
   */
  async cacheQueryResult(
    query: string,
    category: string | undefined,
    response: any,
    responseTimeMs: number,
    relevanceScore = 0.8
  ): Promise<void> {
    const queryHash = this.generateQueryHash(query, category);
    
    const cachedResult: CachedQueryResult = {
      query: query.substring(0, 200), // Limit query length
      query_hash: queryHash,
      category,
      response: this.sanitizeResponse(response),
      timestamp: new Date().toISOString(),
      success: true,
      response_time_ms: responseTimeMs,
      relevance_score: relevanceScore,
      usage_count: 1,
      last_used: new Date().toISOString()
    };

    // Check if query already exists
    if (this.cache.has(queryHash)) {
      const existing = this.cache.get(queryHash)!;
      cachedResult.usage_count = existing.usage_count + 1;
    }

    if (this.useRedis) {
      await redisSet(this.redisKeyPrefix + queryHash, JSON.stringify(cachedResult));
      // With Redis we don't track total size precisely; approximate via scan when requested
      this.metrics.last_cache_update = new Date().toISOString();
    } else {
      this.cache.set(queryHash, cachedResult);
      this.metrics.cache_size = this.cache.size;
      this.metrics.last_cache_update = new Date().toISOString();
      if (this.cache.size > this.maxCacheSize) {
        this.evictLeastUsed();
      }
      this.persistCache();
    }

    console.log(`💾 Cached query result: ${query.substring(0, 50)}... (${queryHash})`);
  }

  /**
   * Search cache for matching query
   */
  async searchCache(query: string, category?: string): Promise<any | null> {
    const queryHash = this.generateQueryHash(query, category);

    if (this.useRedis) {
      const raw = await redisGet(this.redisKeyPrefix + queryHash);
      if (raw) {
        const cached: CachedQueryResult = JSON.parse(raw);
        cached.usage_count += 1;
        cached.last_used = new Date().toISOString();
        await redisSet(this.redisKeyPrefix + queryHash, JSON.stringify(cached));

        this.metrics.cache_hits++;
        this.updateCacheHitRate();

        console.log(`🎯 Cache hit (Redis) for query: ${query.substring(0, 50)}... (${queryHash})`);

        telemetryService.trackWorkflowStage(
          'offline_cache_search',
          'cache_lookup',
          true,
          cached.response_time_ms,
          {
            cache_hit: true,
            usage_count: cached.usage_count,
            relevance_score: cached.relevance_score
          }
        );

        const response = { ...cached.response };
        if (this.degradedMode) {
          response.degraded_mode = true;
          response.cache_warning = 'This response is from offline cache due to connectivity issues';
        }
        return response;
      }
    } else if (this.cache.has(queryHash)) {
      const cached = this.cache.get(queryHash)!;
      cached.usage_count++;
      cached.last_used = new Date().toISOString();
      this.cache.set(queryHash, cached);

      this.metrics.cache_hits++;
      this.updateCacheHitRate();

      console.log(`🎯 Cache hit for query: ${query.substring(0, 50)}... (${queryHash})`);

      telemetryService.trackWorkflowStage(
        'offline_cache_search',
        'cache_lookup',
        true,
        cached.response_time_ms,
        {
          cache_hit: true,
          usage_count: cached.usage_count,
          relevance_score: cached.relevance_score
        }
      );

      const response = { ...cached.response };
      if (this.degradedMode) {
        response.degraded_mode = true;
        response.cache_warning = 'This response is from offline cache due to connectivity issues';
      }
      return response;
    }

    this.metrics.cache_misses++;
    this.updateCacheHitRate();
    
    console.log(`❌ Cache miss for query: ${query.substring(0, 50)}... (${queryHash})`);
    
    // Track telemetry
    telemetryService.trackWorkflowStage(
      'offline_cache_search',
      'cache_lookup',
      false,
      0,
      { cache_hit: false }
    );

    return null;
  }

  /**
   * Enable degraded mode when connectivity issues detected
   */
  enableDegradedMode(reason: string): void {
    if (!this.degradedMode) {
      this.degradedMode = true;
      this.metrics.degraded_mode_active = true;
      
      console.log(`🔥 DEGRADED MODE ENABLED: ${reason}`);
      console.log(`📦 Available cached responses: ${this.cache.size}`);
      
      // Track telemetry
      telemetryService.trackWorkflowStage(
        'system_mode_change',
        'degraded_mode_activation',
        true,
        0,
        { reason, cache_size: this.cache.size }
      );
    }
  }

  /**
   * Disable degraded mode when connectivity restored
   */
  disableDegradedMode(): void {
    if (this.degradedMode) {
      this.degradedMode = false;
      this.metrics.degraded_mode_active = false;
      
      console.log('✅ DEGRADED MODE DISABLED: Connectivity restored');
      
      // Track telemetry
      telemetryService.trackWorkflowStage(
        'system_mode_change',
        'degraded_mode_deactivation',
        true,
        0,
        { cache_size: this.cache.size }
      );
    }
  }

  /**
   * Check if system is in degraded mode
   */
  isDegradedMode(): boolean {
    return this.degradedMode;
  }

  /**
   * Get cache metrics and statistics
   */
  getMetrics(): OfflineMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache (maintenance function)
   */
  clearCache(): void {
    if (this.useRedis) {
      // Fire-and-forget async cleanup
      (async () => {
        const keys = await redisScanKeys(this.redisKeyPrefix + '*');
        await Promise.all(keys.map((k) => redisDel(k)));
      })();
    } else {
      this.cache.clear();
      this.persistCache();
    }

    this.metrics.cache_size = 0;
    this.metrics.cache_hits = 0;
    this.metrics.cache_misses = 0;
    this.metrics.cache_hit_rate = 0;
    this.metrics.last_cache_update = new Date().toISOString();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get popular cached queries for debugging
   */
  getPopularQueries(limit = 10): Array<{ query: string; usage_count: number; last_used: string }> {
    if (this.useRedis) {
      // Synchronous signature; fetch synchronously is not possible, so return best-effort snapshot
      // Callers use it for diagnostics; we keep a small in-memory mirror when Redis is enabled
      // Fallback to scanning Redis synchronously via de-sugared async not allowed; return empty list here
      return [];
    }
    return Array.from(this.cache.values())
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
      .map((item) => ({ query: item.query, usage_count: item.usage_count, last_used: item.last_used }));
  }

  /**
   * Test connectivity to external services
   */
  async testConnectivity(): Promise<{
    nas: boolean;
    ollama: boolean;
    chromadb: boolean;
    internet: boolean;
  }> {
    const results = {
      nas: false,
      ollama: false,
      chromadb: false,
      internet: false
    };

    try {
      // Test NAS connectivity
      const nasResponse = await fetch('http://localhost:8080/api/nas/status', { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      results.nas = nasResponse.ok;
    } catch (error) {
      results.nas = false;
    }

    try {
      // Test Ollama
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      results.ollama = ollamaResponse.ok;
    } catch (error) {
      results.ollama = false;
    }

    try {
      // Test ChromaDB
      const chromaResponse = await fetch('http://localhost:8001/api/v1/heartbeat', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      results.chromadb = chromaResponse.ok;
    } catch (error) {
      results.chromadb = false;
    }

    try {
      // Test internet connectivity
      const internetResponse = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      results.internet = internetResponse.ok;
    } catch (error) {
      results.internet = false;
    }

    // Enable/disable degraded mode based on connectivity
    const hasConnectivity = results.nas || results.chromadb || results.internet;
    if (!hasConnectivity && !this.degradedMode) {
      this.enableDegradedMode('All external services unreachable');
    } else if (hasConnectivity && this.degradedMode) {
      this.disableDegradedMode();
    }

    return results;
  }

  /**
   * Private helper methods
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      // Sort by usage count (ascending) then by last used (ascending)
      if (a[1].usage_count !== b[1].usage_count) {
        return a[1].usage_count - b[1].usage_count;
      }
      return new Date(a[1].last_used).getTime() - new Date(b[1].last_used).getTime();
    });

    // Remove least used entries until we're under the limit
    const toRemove = Math.ceil(this.maxCacheSize * 0.1); // Remove 10%
    for (let i = 0; i < toRemove && this.cache.size > this.maxCacheSize * 0.9; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`🧹 Evicted ${toRemove} least used cache entries`);
  }

  private updateCacheHitRate(): void {
    const total = this.metrics.cache_hits + this.metrics.cache_misses;
    this.metrics.cache_hit_rate = total > 0 ? this.metrics.cache_hits / total : 0;
  }

  private sanitizeResponse(response: any): any {
    // Remove sensitive information from cached responses
    if (typeof response === 'object' && response !== null) {
      const sanitized = { ...response };
      
      // Remove credential-related fields
      delete sanitized.credentials;
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.api_key;
      
      return sanitized;
    }
    
    return response;
  }
}

export const offlineService = new OfflineService();
export default OfflineService;