/**
 * Response Type Guards and Helpers
 * Handles mode detection for AI vs Search responses
 */

export interface AISummary {
  // Support both old format (summary) and new format (text)
  summary?: string;
  text?: string;
  key_findings?: string;
  gaps?: string;
  recommendation?: string;
  confidence: number;
  enabled?: boolean; // New field for new format
  sources_used?: Array<{
    doc: string;
    page: number;
    link: string;
  }>;
}

export interface SolutionCard {
  sol_id: string;
  file_name: string;
  doc_link: string;
  confidence: number;
  content_preview?: string;
  pages_examined?: number[];
  display_name?: string;
  handover_section?: any;
}

export interface QueryResponse {
  query_text: string;
  mode: 'search' | 'ai' | 'ai_enhanced';
  model_selected?: '7b' | '14b' | null;
  retrieval_used: boolean;
  retrieval_confidence: number;
  ai_summary?: AISummary | null;
  solution_cards: SolutionCard[];
  other_documents?: SolutionCard[];
  handover_data?: any[];
  processing_metadata?: any;
}

/**
 * Check if response is AI mode with summary
 * Supports both 'ai' and 'ai_enhanced' modes
 * Checks for both old format (summary) and new format (text)
 */
export const isAIResponse = (response: any): boolean => {
  const isAIMode = response?.mode === 'ai' || response?.mode === 'ai_enhanced';
  const hasSummary = !!(response?.ai_summary?.summary || response?.ai_summary?.text);
  return isAIMode && hasSummary;
};

/**
 * Check if response is search-only mode
 */
export const isSearchResponse = (response: any): boolean => {
  return response?.mode === 'search' || !response?.ai_summary;
};

/**
 * Get solution ID prefix based on mode
 */
export const getSolutionIdPrefix = (mode: string): string => {
  return mode === 'search' ? 'search_sol_' : 'sol_';
};

/**
 * Check if solution ID indicates search result
 */
export const isSearchResult = (solId: string): boolean => {
  return solId.startsWith('search_');
};

/**
 * Format confidence as percentage
 */
export const formatConfidence = (confidence: number | undefined): string => {
  if (confidence === undefined || confidence === null) return '';
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Safe array check
 */
export const hasItems = (arr: any[] | undefined | null): boolean => {
  return Array.isArray(arr) && arr.length > 0;
};
