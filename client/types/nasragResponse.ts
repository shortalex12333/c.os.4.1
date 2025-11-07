/**
 * NASRAG Response Type Definitions (Debloated Version)
 *
 * Updated: October 29, 2025
 * Changes: Removed 'stages' field (1111.5 KB debug data) from response
 * Response size: 20 KB (was 1130 KB)
 *
 * @see /tmp/NASRAG_DEBLOAT_FIX_SUMMARY.md for implementation details
 */

// ============================================
// CHUNK & DOCUMENT TYPES
// ============================================

export interface NasragChunk {
  // Basic identification
  id?: string;
  path: string;
  filename?: string;
  document: string;

  // Scoring
  score: number;
  final_score?: number;
  match_score?: number;
  match_ratio?: number;

  // Entity matching
  matched_entities?: string[];
  entities_found?: string[];
  entity_weights?: Record<string, number>;
  entity_count?: number;
  has_critical_entities?: boolean;

  // Content
  text?: string;
  text_preview?: string;
  chunk_index?: number;
  chunk_size?: number;
  token_count?: number;

  // Page information
  page_number?: number;
  page_label?: string;

  // Extraction metadata
  extraction_method?: string;
  method?: string;
  selection_reason?: string;

  // Score breakdown
  score_breakdown?: {
    base_score?: number;
    proximity_score?: number;
    entity_density?: number;
    final_score?: number;
  };

  // OCR flags
  ocr_used?: boolean;
  needs_ocr?: boolean;

  // Links
  links?: {
    document?: string;
    document_base?: string;
    folder?: string;
    page?: string;
  };

  // Display configuration (for cascading display strategy)
  display_mode?: 'expanded' | 'collapsed';
  tier?: number;
  coverage_contribution?: number;
  diversity_score?: number;
}

export interface NasragDocument {
  document_path: string;
  display_name: string;
  chunks: NasragChunk[];

  // Document-level scores
  total_score: number;
  max_score: number;
  avg_score: number;

  // Entity information
  entity_count: number;
  all_entities: string[];
  has_critical: boolean;

  // Page information
  page_numbers: number[];
  other_pages?: number[] | null;

  // Display configuration
  chunk_variance?: number;
  chunk_count: number;
  preview_only: boolean;
  collapsed: boolean;

  // Links
  links: {
    document: string;
    document_base: string;
    folder: string;
    page: string;
  };
}

// ============================================
// QUERY PATTERN CLASSIFICATION
// ============================================

export interface QueryPattern {
  pattern: 'content_chunks' | 'document_collection' | 'single_document';
  display_mode: 'search_results' | 'document_list' | 'document_card';
  reason: string;
  documents_count: number;
  chunks_count: number;
  score_variance?: number;
}

// ============================================
// METADATA TYPES
// ============================================

export interface GateStats {
  deduplication?: {
    duplicates_removed: number;
    unique_items: number;
  };
  token_counting?: {
    total_tokens: number;
    max_tokens?: number;
  };
}

export interface PagesScannedMetadata {
  exact_match?: boolean;
  confidence?: number;
  champions_used?: number;
  blacklist_applied?: number;
  vector_hints_used?: boolean;
  documents_found?: number;
}

export interface NasragMetadata {
  exit_point: string;
  gates: GateStats;
  pages_scanned?: PagesScannedMetadata;
  query_pattern: QueryPattern;
  email_candidates?: string[];
  enriched_optimizations?: {
    pre_weighted_entities?: boolean;
    champion_docs_used?: number;
    blacklist_applied?: number;
    cache_keys_available?: number;
  };
}

// ============================================
// TIMING & LOGS
// ============================================

export interface Timing {
  total_time_ms: number;
}

// ============================================
// MAIN RESPONSE TYPE
// ============================================

export interface NasragResponse {
  // Request identification
  run_id: string;
  status: 'success' | 'error' | 'partial';
  mode: string;

  // Results
  answer: {
    results: NasragChunk[] | NasragDocument[];
  };

  // Coverage & quality
  final_coverage: number;
  tier_info: any | null;
  clarification_prompt: string | null;

  // Metadata & timing
  metadata: NasragMetadata;
  timing: Timing;
  logs: string[];
  artifacts: Record<string, any>;

  // User routing fields (passthrough from request)
  userId: string | null;
  userName: string | null;
  sessionId: string | null;
  session_id: string | null;
  conversation_id: string | null;
  request_id: string | null;
  webhookUrl: string | null;
  executionMode: 'production' | 'test';
  source: string;
  client_info: Record<string, any>;

  // Query information
  query: string | null;
  original_query: string;

  // Multi-tenant routing
  yacht_id: string;
  department: string | null;
  action: string | null;
  search_strategy: 'yacht' | 'email';

  // Legacy fields (may be removed in future)
  stage_3_chunks: any | null;

  // ❌ REMOVED IN DEBLOAT FIX (2025-10-29):
  // stages?: {
  //   stage0?: any;  // 1111.5 KB of debug data
  //   stage1?: any;
  //   stage2?: any;
  //   stage3?: any;
  //   stage4?: any;
  //   stage5?: any;
  //   stage6?: any;
  //   stage7?: any;
  // };
}

// ============================================
// TYPE GUARDS
// ============================================

export function isNasragChunk(result: any): result is NasragChunk {
  return result && typeof result === 'object' && 'path' in result && 'score' in result;
}

export function isNasragDocument(result: any): result is NasragDocument {
  return result && typeof result === 'object' && 'document_path' in result && 'chunks' in result;
}

export function isContentChunksPattern(pattern: QueryPattern): boolean {
  return pattern.pattern === 'content_chunks';
}

export function isSingleDocumentPattern(pattern: QueryPattern): boolean {
  return pattern.pattern === 'single_document';
}

export function isDocumentCollectionPattern(pattern: QueryPattern): boolean {
  return pattern.pattern === 'document_collection';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract all chunks from NASRAG response regardless of structure
 */
export function extractAllChunks(response: NasragResponse): NasragChunk[] {
  if (!response.answer?.results) return [];

  const results = response.answer.results;
  const chunks: NasragChunk[] = [];

  results.forEach(result => {
    if (isNasragDocument(result)) {
      // Document with nested chunks
      chunks.push(...result.chunks);
    } else if (isNasragChunk(result)) {
      // Direct chunk
      chunks.push(result);
    }
  });

  return chunks;
}

/**
 * Group chunks by document path
 */
export function groupChunksByDocument(chunks: NasragChunk[]): Record<string, NasragChunk[]> {
  const grouped: Record<string, NasragChunk[]> = {};

  chunks.forEach(chunk => {
    const docPath = chunk.document || chunk.path;
    if (!grouped[docPath]) {
      grouped[docPath] = [];
    }
    grouped[docPath].push(chunk);
  });

  return grouped;
}

/**
 * Get expanded chunks (for cascading display)
 */
export function getExpandedChunks(chunks: NasragChunk[]): NasragChunk[] {
  return chunks.filter(chunk => chunk.display_mode === 'expanded' || !chunk.display_mode);
}

/**
 * Get collapsed chunks (for cascading display)
 */
export function getCollapsedChunks(chunks: NasragChunk[]): NasragChunk[] {
  return chunks.filter(chunk => chunk.display_mode === 'collapsed');
}

/**
 * Calculate total chunks count
 */
export function getTotalChunksCount(response: NasragResponse): number {
  return extractAllChunks(response).length;
}

/**
 * Get unique document paths
 */
export function getUniqueDocuments(response: NasragResponse): string[] {
  const chunks = extractAllChunks(response);
  const docPaths = new Set<string>();

  chunks.forEach(chunk => {
    const docPath = chunk.document || chunk.path;
    docPaths.add(docPath);
  });

  return Array.from(docPaths);
}

// ============================================
// EXPORTS
// ============================================

export default NasragResponse;
