/**
 * N8N JAVASCRIPT NODE: Document RAG Transform
 *
 * Purpose: Transform Document RAG output into clean search_mode format
 *          matching the structure used by Email RAG (OUTLOOK_RAG_TRANSFORM.js)
 *
 * WORKFLOW POSITION:
 * [Document RAG API] → [THIS NODE] → [Response to Frontend]
 *
 * INPUT: Document RAG API response with all_documents array
 * OUTPUT: Cascading search_mode structure (primary/other/all/hidden)
 *
 * Date: 2025-10-21
 * Version: 1.0
 */

// ============================================================================
// MAIN TRANSFORMATION FUNCTION
// ============================================================================

try {
  // ============================================================================
  // STEP 1: Get Document RAG API response
  // ============================================================================

  let rawInput = $input.item.json;

  // Handle if n8n wraps response in array
  if (Array.isArray(rawInput)) {
    rawInput = rawInput[0];
  }

  const ragResult = rawInput;

  // Validate input structure
  if (!ragResult || !ragResult.ui_payload) {
    throw new Error('No Document RAG API result received');
  }

  const uiPayload = ragResult.ui_payload;
  const allDocuments = uiPayload.all_documents || [];

  console.log('[DOCUMENT_TRANSFORM] Input validated');
  console.log(`[DOCUMENT_TRANSFORM] Total documents: ${allDocuments.length}`);

  // ============================================================================
  // STEP 2: SORT DOCUMENTS BY CONFIDENCE (High → Low)
  // ============================================================================

  // Sort by match_ratio (highest first)
  const sortedDocuments = [...allDocuments].sort((a, b) => {
    const aScore = a.match_ratio || a.relevance_score || 0;
    const bScore = b.match_ratio || b.relevance_score || 0;
    return bScore - aScore;
  });

  console.log(`[DOCUMENT_TRANSFORM] Documents sorted by confidence`);

  // ============================================================================
  // STEP 3: CASCADE INTO PRIMARY / OTHER / ALL / HIDDEN
  // ============================================================================

  // Confidence thresholds (for reference, not for filtering)
  const HIGH_CONFIDENCE = 0.6;
  const MEDIUM_CONFIDENCE = 0.4;

  // IMPORTANT: Use position-based cascading (like Email RAG), NOT confidence-based filtering
  // This ensures all documents are shown, sorted by confidence

  // Primary documents: Top 5 (sorted by confidence, highest first)
  const primary_documents = sortedDocuments.slice(0, 5);

  // Other documents: Positions 6-10 (next highest confidence)
  const other_documents = sortedDocuments.slice(5, 10);

  // All documents: Positions 11-15 (lower confidence)
  const all_documents_low = sortedDocuments.slice(10, 15);

  // Hidden results: Everything beyond position 15
  const hidden_documents = sortedDocuments.slice(15);

  const showing_count = primary_documents.length + other_documents.length + all_documents_low.length;

  console.log(`[DOCUMENT_TRANSFORM] Cascading complete:`);
  console.log(`  - Primary: ${primary_documents.length}`);
  console.log(`  - Other: ${other_documents.length}`);
  console.log(`  - All (low confidence): ${all_documents_low.length}`);
  console.log(`  - Hidden: ${hidden_documents.length}`);

  // ============================================================================
  // STEP 4: NORMALIZE DOCUMENT OBJECTS (Match Email Structure)
  // ============================================================================

  function normalizeDocument(doc) {
    return {
      // IDs
      id: doc.sol_id || doc.search_sol_id || `doc_${doc.index}`,
      sol_id: doc.sol_id,
      search_sol_id: doc.search_sol_id,

      // Display fields
      display_name: doc.display_name || doc.filename,
      filename: doc.filename,

      // Confidence scoring
      match_ratio: doc.match_ratio || doc.relevance_score,
      relevance_score: doc.relevance_score,
      confidence: doc.match_ratio || doc.relevance_score,

      // Content
      content_preview: doc.content_preview,
      snippet: doc.snippet,

      // Pages
      best_page: doc.best_page,
      all_pages: doc.all_pages || doc.matching_pages,
      matching_pages: doc.matching_pages,

      // Links
      links: doc.links,
      doc_link: doc.links?.document,

      // Handover section (per-document handover data)
      handover_section: doc.handover_section,

      // Metadata
      metadata: {
        source_type: doc.source_type,
        path: doc.path,
        relative_path: doc.relative_path,
        entities_found: doc.entities_found,
        entity_count: doc.entity_count,
        tier: doc.tier,
        stars: doc.stars
      }
    };
  }

  // Apply normalization
  const normalized_primary = primary_documents.map(normalizeDocument);
  const normalized_other = other_documents.map(normalizeDocument);
  const normalized_all = all_documents_low.map(normalizeDocument);
  const normalized_hidden = hidden_documents.map(normalizeDocument);

  // ============================================================================
  // STEP 5: CREATE GLOBAL HANDOVER SECTION
  // ============================================================================

  // Use existing handover_template from response, or generate new one
  const handover_section = uiPayload.handover_template || {
    system: "",
    fault_code: "",
    symptoms: uiPayload.query_text || uiPayload.original_query || "",
    actions_taken: "Searched technical manuals and documentation",
    duration: null,
    linked_doc: normalized_primary[0]?.links?.document || ""
  };

  // Update linked_doc to top document if not set
  if (!handover_section.linked_doc && normalized_primary[0]) {
    handover_section.linked_doc = normalized_primary[0].links?.document || "";
  }

  // Use existing handover_metadata or create new
  const handover_metadata = uiPayload.handover_metadata || {
    auto_filled_count: 0,
    auto_filled_fields: [],
    entity_count: (uiPayload.entities || []).length,
    confidence: 0,
    generated_at: new Date().toISOString()
  };

  // ============================================================================
  // STEP 6: CREATE SUMMARY METADATA
  // ============================================================================

  const documents_found = allDocuments.length;
  const documents_showing = showing_count;
  const documents_hidden = hidden_documents.length;

  // Calculate average confidence
  const avg_confidence = allDocuments.length > 0
    ? allDocuments.reduce((sum, doc) => sum + (doc.match_ratio || 0), 0) / allDocuments.length
    : 0;

  const summary = {
    documents_found: documents_found,
    showing: documents_showing,
    hidden: documents_hidden,
    confidence: avg_confidence,
    documents_searched: uiPayload.tracking?.total_examined || documents_found,
    message: documents_found === 0 ? "No documents found" : null,
    pipeline_version: "document-rag-v1",
    execution_time_ms: uiPayload.tracking?.processing_time_ms || null
  };

  // ============================================================================
  // STEP 7: BUILD FINAL OUTPUT
  // ============================================================================

  const output = {
    // Top-level fields (preserved from input)
    success: ragResult.success !== false,
    ux_display: "search_mode",

    // Transformed UI payload
    ui_payload: {
      // Cascading document results (FIXED - now properly sorted!)
      primary_documents: normalized_primary,
      other_documents: normalized_other,
      all_documents: normalized_all,

      // Hidden results
      hidden_results: {
        count: documents_hidden,
        documents: normalized_hidden
      },

      // Metadata
      summary: summary,
      handover_section: handover_section,
      handover_metadata: handover_metadata,

      // Original fields (preserved for compatibility)
      query_text: uiPayload.query_text,
      original_query: uiPayload.original_query,
      entities: uiPayload.entities,
      entity_summary: uiPayload.entity_summary,
      quality_metrics: uiPayload.quality_metrics,
      confidence: uiPayload.confidence,
      tracking: uiPayload.tracking,
      categorization_metadata: {
        high_confidence_threshold: HIGH_CONFIDENCE,
        medium_confidence_threshold: MEDIUM_CONFIDENCE,
        primary_count: normalized_primary.length,
        other_count: normalized_other.length,
        total_count: documents_found,
        average_confidence: avg_confidence
      }
    },

    // Debug info
    _debug: {
      transform_version: "document-rag-transform-v1.0",
      transformation_timestamp: new Date().toISOString(),
      input_total_documents: allDocuments.length,
      output_primary: normalized_primary.length,
      output_other: normalized_other.length,
      output_all: normalized_all.length,
      output_hidden: normalized_hidden.length,
      confidence_thresholds: {
        high: HIGH_CONFIDENCE,
        medium: MEDIUM_CONFIDENCE
      }
    }
  };

  // ============================================================================
  // STEP 8: RETURN TRANSFORMED OUTPUT
  // ============================================================================

  console.log('[DOCUMENT_TRANSFORM] ========== TRANSFORMATION COMPLETE ==========');
  console.log(`[DOCUMENT_TRANSFORM] Output: ${normalized_primary.length} primary + ${normalized_other.length} other + ${normalized_all.length} all + ${normalized_hidden.length} hidden`);
  console.log(`[DOCUMENT_TRANSFORM] Handover: ${handover_metadata.auto_filled_count} fields auto-filled`);
  console.log('[DOCUMENT_TRANSFORM] =========================================================');

  return [{
    json: output
  }];

} catch (error) {
  // ============================================================================
  // ERROR HANDLER
  // ============================================================================

  console.error('❌ Document RAG transformation error:', error);

  return [{
    json: {
      success: false,
      ux_display: "error",
      error: {
        type: "transform_error",
        message: "Failed to transform document search results",
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }
  }];
}
