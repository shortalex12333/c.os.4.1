/**
 * Ask AI Service
 * Handles communication with N8N webhook for AI-powered follow-up queries
 * Endpoint: http://localhost:5678/webhook/ask-ai
 */

import { getHostIP } from '../config/network';

// Get N8N webhook URL (use host IP for local network access)
import { WEBHOOK_CONFIG } from '../config/webhookConfig';

const WEBHOOK_URL = WEBHOOK_CONFIG.chat.askAI;

// Request/Response types matching N8N workflow expectations
export interface AskAIRequest {
  message: string;                  // Combined: original query + user's additional context
  original_query: string;           // Original search query
  additional_context: string;       // User's added details
  search_results: SearchResultReference[]; // Reference to documents found
  user_id?: string;
  session_id?: string;
  metadata?: {
    search_strategy?: 'yacht' | 'email';
    timestamp?: string;
    [key: string]: any;
  };
}

export interface SearchResultReference {
  doc_id: string;
  doc_name?: string;
  doc_path?: string;
  page?: number;
  chunk_id?: string;
  content?: string;              // NEW: actual chunk text content
  chunk_index?: number;           // NEW: position in document
  relevance_score?: number;
  metadata?: any;                 // NEW: additional metadata from search
}

export interface AskAIResponse {
  success: boolean;
  ai_response?: {
    answer: string;
    model_used: string;
    reasoning?: string;
    sources?: Array<{
      doc_name: string;
      page?: number;
      relevance?: string;
    }>;
    token_usage?: {
      total: number;
      model_tier: string;
    };
  };
  error?: string;
  request_id?: string;
}

class AskAIService {
  /**
   * Send Ask AI request to N8N workflow
   *
   * @param originalQuery - The original search query
   * @param additionalContext - User's additional context/details
   * @param searchResults - Document references from original search
   * @param metadata - Optional metadata (user_id, session_id, etc.)
   */
  async askAI(
    originalQuery: string,
    additionalContext: string,
    searchResults: SearchResultReference[],
    metadata?: {
      user_id?: string;
      session_id?: string;
      search_strategy?: 'yacht' | 'email';
      [key: string]: any;
    }
  ): Promise<AskAIResponse> {
    try {
      console.log('🤖 Sending Ask AI request:', {
        originalQuery,
        additionalContext,
        resultsCount: searchResults.length,
        url: WEBHOOK_URL
      });

      // Combine original query with additional context
      const combinedMessage = additionalContext
        ? `${originalQuery}\n\nAdditional details: ${additionalContext}`
        : originalQuery;

      const requestBody: AskAIRequest = {
        message: combinedMessage,
        original_query: originalQuery,
        additional_context: additionalContext,
        search_results: searchResults,
        user_id: metadata?.user_id,
        session_id: metadata?.session_id,
        metadata: {
          search_strategy: metadata?.search_strategy || 'yacht',
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Ask AI response received:', {
        success: data.success,
        model: data.ai_response?.model_used,
        answerLength: data.ai_response?.answer?.length
      });

      return data;

    } catch (error) {
      console.error('❌ Ask AI service error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Extract search result references with chunk content from cascade card data
   * This includes the actual text content needed by the AI workflow
   */
  extractSearchReferences(cardData: any): SearchResultReference[] {
    const references: SearchResultReference[] = [];

    // Extract from files array (NAS cards)
    if (cardData.files && Array.isArray(cardData.files)) {
      cardData.files.forEach((file: any) => {
        references.push({
          doc_id: file.id || file.fileName,
          doc_name: file.fileName,
          doc_path: file.source,
          content: file.content || file.text || file.excerpt,
          page: file.page,
          chunk_id: file.chunk_id,
          chunk_index: file.chunk_index,
          relevance_score: file.score || file.similarity,
          metadata: file.metadata
        });
      });
    }

    // Extract from document_links (if available)
    if (cardData.document_links && Array.isArray(cardData.document_links)) {
      cardData.document_links.forEach((link: any) => {
        references.push({
          doc_id: link.doc_id || link.document_path,
          doc_name: link.doc_name || link.title,
          doc_path: link.document_path,
          content: link.content || link.text || link.excerpt || link.snippet,
          page: link.page,
          chunk_id: link.chunk_id,
          chunk_index: link.chunk_index,
          relevance_score: link.relevance_score,
          metadata: link.metadata
        });
      });
    }

    // Extract from source field with description/content
    if (cardData.source && typeof cardData.source === 'string') {
      // Parse source like "MTU 2000 Series Manual, Page 247, Section 4.2"
      const sourceMatch = cardData.source.match(/(.+?),\s*Page\s*(\d+)/i);
      if (sourceMatch) {
        references.push({
          doc_id: sourceMatch[1],
          doc_name: sourceMatch[1],
          page: parseInt(sourceMatch[2]),
          content: cardData.description || cardData.content || cardData.summary,
          relevance_score: cardData.relevance_score
        });
      } else {
        references.push({
          doc_id: cardData.source,
          doc_name: cardData.source,
          content: cardData.description || cardData.content || cardData.summary,
          relevance_score: cardData.relevance_score
        });
      }
    }

    // Extract from metadata.chunks (most complete structure)
    if (cardData.metadata?.chunks && Array.isArray(cardData.metadata.chunks)) {
      cardData.metadata.chunks.forEach((chunk: any) => {
        references.push({
          doc_id: chunk.doc_id,
          doc_name: chunk.doc_name,
          doc_path: chunk.doc_path,
          content: chunk.content || chunk.text || chunk.chunk_text,
          page: chunk.page,
          chunk_id: chunk.chunk_id || chunk.id,
          chunk_index: chunk.chunk_index,
          relevance_score: chunk.score || chunk.similarity || chunk.relevance_score,
          metadata: chunk.metadata
        });
      });
    }

    // If card has diagnostics or partsList (NAS-specific), add as content
    if (cardData.diagnostics || cardData.partsList) {
      const existingRef = references.find(r => r.doc_id === cardData.source);
      const diagnosticsText = cardData.diagnostics ?
        `Diagnostics:\n${cardData.diagnostics.join('\n')}` : '';
      const partsText = cardData.partsList ?
        `\n\nParts:\n${cardData.partsList.join('\n')}` : '';
      const combinedContent = diagnosticsText + partsText;

      if (existingRef && combinedContent) {
        existingRef.content = (existingRef.content || '') + '\n\n' + combinedContent;
      }
    }

    const totalContent = references.reduce((sum, r) => sum + (r.content?.length || 0), 0);
    const avgContentLength = references.length > 0 ? Math.round(totalContent / references.length) : 0;

    console.log(`📚 Extracted ${references.length} chunks with content (avg ${avgContentLength} chars each)`);
    console.log(`📊 Total content size: ${(totalContent / 1024).toFixed(1)}KB`);

    return references;
  }

  /**
   * Format AI response for display in chat/card
   */
  formatAIResponse(response: AskAIResponse): {
    success: boolean;
    content: string;
    sources: string[];
    metadata: any;
  } {
    if (!response.success || !response.ai_response) {
      return {
        success: false,
        content: response.error || 'Failed to get AI response',
        sources: [],
        metadata: {}
      };
    }

    const { ai_response } = response;

    // Format sources as readable strings
    const sources = ai_response.sources?.map(source =>
      `${source.doc_name}${source.page ? ` (Page ${source.page})` : ''}`
    ) || [];

    return {
      success: true,
      content: ai_response.answer,
      sources,
      metadata: {
        model_used: ai_response.model_used,
        reasoning: ai_response.reasoning,
        token_usage: ai_response.token_usage,
        request_id: response.request_id
      }
    };
  }
}

// Export singleton instance
export const askAIService = new AskAIService();
export default askAIService;
