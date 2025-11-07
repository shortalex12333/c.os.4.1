/**
 * N8N JAVASCRIPT NODE: Email RAG API v4.0 Transform
 *
 * Purpose: Transform Email RAG API v4.0-NASRAG output into frontend-ready search_mode format
 *
 * WORKFLOW POSITION:
 * [Previous Node] → [Outlook RAG (HTTP Request)] → [THIS NODE (Code3)] → [Response]
 *
 * INPUT SOURCE: "Outlook RAG" node output ($input.item.json)
 * - Outlook RAG node calls: POST http://127.0.0.1:8080/api/search-emails
 *
 * Expected Input Structure (from Email RAG API v4.0 - UPDATED 2025-10-22):
 * [
 *   {
 *     analyzed_data: {
 *       original_query: "what was the last microsoft invoice\n",
 *       yacht_id: "default",
 *       entities: { merged: [...] },
 *       ...
 *     },
 *     atlas_result: {
 *       tier: "definitive",
 *       confidence: 0.95,
 *       solution_emails: [...],
 *       other_emails: [...],
 *       rescued_emails: [...],
 *       original_query: "what was the last microsoft invoice\n",
 *       yacht_id: "default",
 *       processing_metadata: {...},
 *       search_transparency: {...}
 *     }
 *   }
 * ]
 *
 * Output: Frontend-ready search_mode JSON with routing metadata + dynamic handover
 *
 * Date: 2025-10-22
 * Version: 2.0 (nested structure with analyzed_data + atlas_result)
 * API: Email RAG Pipeline v4.0-NASRAG
 */

// ============================================================================
// MAIN TRANSFORMATION FUNCTION
// ============================================================================

try {
  // ============================================================================
  // STEP 1: Get Email RAG API v4.0 response from HTTP Request node
  // ============================================================================

  // This should be the DIRECT output from the HTTP Request node
  // that calls POST http://127.0.0.1:8080/api/search-emails
  let rawInput = $input.item.json;

  // Handle if n8n wraps response in array (it does!)
  if (Array.isArray(rawInput)) {
    rawInput = rawInput[0];
  }

  const ragResult = rawInput;

  // Validate input structure
  if (!ragResult) {
    throw new Error('No Email RAG API result received from upstream node');
  }

  // NEW: Validate nested structure (analyzed_data + atlas_result)
  if (!ragResult.atlas_result) {
    throw new Error('Invalid input: Expected nested structure with atlas_result');
  }

  // Extract atlas_result (main email data)
  const atlasResult = ragResult.atlas_result;
  const analyzedData = ragResult.analyzed_data || {};

  console.log('[TRANSFORM] Input validated - Email RAG API v4.0 nested format detected');
  console.log(`[TRANSFORM] Tier: ${atlasResult.tier}, Confidence: ${atlasResult.confidence}, Results: ${atlasResult.result_count}`);

  // ============================================================================
  // STEP 2: EXTRACT METADATA FROM API RESPONSE
  // ============================================================================

  // Extract entities from analyzed_data.entities.merged
  const entities = analyzedData.entities || { merged: [] };

  // Extract original_query and yacht_id from atlas_result
  const original_query = atlasResult.original_query || "";
  const yacht_id = atlasResult.yacht_id || "default";

  // Build metadata object from API response
  const incomingMetadata = {
    // Timestamp
    timestamp: new Date().toISOString(),

    // Source application
    source: "celesteos_modern_local_ux",

    // Client info (empty for now, could be added to API request later)
    client_info: {},

    // Webhook URL (not used in this workflow)
    webhookUrl: "",

    // Execution mode
    executionMode: "production",

    // Yacht ID (echoed back from API)
    yacht_id: yacht_id,

    // Original query (echoed back from API)
    original_query: original_query,

    // Entities (from analyzed_data)
    // NOTE: Keep entities in merged[] array format (do NOT transform)
    // Frontend will handle entity display
    entities: entities
  };

  // Log entity extraction for debugging
  const entityCount = (entities.merged || []).length;
  console.log(`[TRANSFORM] Entities: ${entityCount} from analyzed_data.entities.merged`);
  console.log(`[TRANSFORM] Original Query: ${original_query}`);
  console.log(`[TRANSFORM] Yacht ID: ${yacht_id}`);

  // ============================================================================
  // ERROR HANDLING: Token Expiry / API Failures
  // ============================================================================

  if (atlasResult.error) {
    const errorMessage = atlasResult.error.message || atlasResult.error;

    // Token expired or invalid
    if (errorMessage.includes('token') ||
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized')) {
      return [{
        json: {
          // PRESERVE ROUTING METADATA EVEN IN ERRORS
          timestamp: new Date().toISOString(),
          source: "celesteos_modern_local_ux",
          client_info: {},
          webhookUrl: "",
          executionMode: "production",
          yacht_id: yacht_id,
          original_query: original_query,
          entities: entities,

          success: false,
          ux_display: "error",
          error: {
            type: "token_expired",
            message: "Your email connection has expired. Please reconnect your email account.",
            action: "redirect_to_settings",
            redirect_url: "/settings/email-connector",
            cta_text: "Connect Email"
          }
        }
      }];
    }

    // Network/offline errors
    if (errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('Network') ||
        errorMessage.includes('timeout')) {
      return [{
        json: {
          // PRESERVE ROUTING METADATA
          timestamp: new Date().toISOString(),
          source: "celesteos_modern_local_ux",
          client_info: {},
          webhookUrl: "",
          executionMode: "production",
          yacht_id: yacht_id,
          original_query: original_query,
          entities: entities,

          success: false,
          ux_display: "error",
          error: {
            type: "offline",
            message: "Unable to connect to email service. Please check your internet connection.",
            action: "retry",
            cta_text: "Retry Search"
          }
        }
      }];
    }

    // Generic error fallback
    return [{
      json: {
        // PRESERVE ROUTING METADATA
        timestamp: new Date().toISOString(),
        source: "celesteos_modern_local_ux",
        client_info: {},
        webhookUrl: "",
        executionMode: "production",
        yacht_id: yacht_id,
        original_query: original_query,
        entities: entities,

        success: false,
        ux_display: "error",
        error: {
          type: "system_error",
          message: errorMessage,
          action: "contact_support",
          details: atlasResult.error
        }
      }
    }];
  }

  // ============================================================================
  // DATA EXTRACTION (from atlas_result)
  // ============================================================================

  // Extract email arrays from atlas_result (not top-level ragResult!)
  const solution_emails = atlasResult.solution_emails || [];
  const other_emails = atlasResult.other_emails || [];
  const rescued_emails = atlasResult.rescued_emails || [];

  // Extract metadata from atlas_result
  const tier = atlasResult.tier || "insufficient";
  const confidence = atlasResult.confidence || 0;
  const result_count = atlasResult.result_count || 0;

  console.log(`[TRANSFORM] Emails extracted: ${solution_emails.length} solution, ${other_emails.length} other, ${rescued_emails.length} rescued`);

  const processing_metadata = atlasResult.processing_metadata || {};
  const search_transparency = atlasResult.search_transparency || {};

  // Total emails found
  const emails_found = result_count;
  const emails_searched = atlasResult.total_processed || 50;

  // ============================================================================
  // HELPER FUNCTION: Transform Email to Document Structure
  // ============================================================================

  function transformEmailToDocument(email) {
    if (!email || !email.email_id) {
      return null; // Skip invalid emails
    }

    return {
      id: email.email_id,

      // Display name from subject with fallback
      display_name: email.subject || "(No Subject)",

      // Sender information
      sender: {
        name: email.from?.emailAddress?.name || "Unknown Sender",
        email: email.from?.emailAddress?.address || ""
      },

      // Received date
      received_date: email.receivedDateTime || new Date().toISOString(),

      // Content preview (max 500 chars)
      content_preview: (email.bodyPreview || "").substring(0, 500),

      // Match ratio/confidence score (from lexical_score)
      match_ratio: email.lexical_score || email.final_score || 0.5,

      // Entity metrics
      entity_boost: email.matched_entities?.length || 0,
      entity_coverage: email.matched_entities?.reduce((sum, e) => sum + e.contribution, 0) || 0,

      // Attachment flag
      has_attachments: email.hasAttachments || false,

      // Tier classification (label: "high", "medium", "low")
      tier: email.label === 'high' ? 2 : (email.label === 'medium' ? 1 : 0),

      // Search type
      search_type: email.rescued_by_attachment ? "attachment_rescued" : "lexical",

      // Links (Outlook URLs)
      links: {
        // Primary web link - use conversation ID if available, fallback to message ID
        document: email.conversation_id
          ? `https://outlook.office.com/mail/deeplink/readconv/${encodeURIComponent(email.conversation_id)}`
          : `https://outlook.office.com/mail/deeplink/read/${encodeURIComponent(email.email_id)}`,

        // Web URL (conversation-based for reliability)
        web: email.conversation_id
          ? `https://outlook.office.com/mail/deeplink/readconv/${encodeURIComponent(email.conversation_id)}`
          : `https://outlook.office.com/mail/deeplink/read/${encodeURIComponent(email.email_id)}`,

        // Desktop app protocol (URL-encoded)
        desktop: `outlook:${encodeURIComponent(email.email_id)}`
      },

      // Additional metadata
      metadata: {
        importance: "normal",
        is_read: false,
        categories: [],
        conversation_id: email.email_id,
        matched_entities: email.matched_entities || []
      }
    };
  }

  // ============================================================================
  // EMPTY RESULTS HANDLING
  // ============================================================================

  if (emails_found === 0 || (solution_emails.length === 0 && other_emails.length === 0)) {
    return [{
      json: {
        // PRESERVE ROUTING METADATA
        timestamp: incomingMetadata.timestamp,
        source: incomingMetadata.source,
        client_info: incomingMetadata.client_info,
        webhookUrl: incomingMetadata.webhookUrl,
        executionMode: incomingMetadata.executionMode,
        success: true,
        yacht_id: incomingMetadata.yacht_id,
        original_query: incomingMetadata.original_query,
        entities: incomingMetadata.entities,

        ux_display: "search_mode",
        ui_payload: {
          primary_findings: [],
          other_emails: [],
          all_emails: [],
          hidden_results: {
            count: 0,
            emails: []
          },
          summary: {
            emails_found: 0,
            showing: 0,
            hidden: 0,
            tier: tier,
            confidence: confidence,
            emails_searched: emails_searched,
            message: `Searched ${emails_searched} recent emails, found 0 matches`,
            suggestion: "Try different keywords or check your email filters"
          },
          handover_section: {
            system: "",
            fault_code: "",
            symptoms: original_query,
            actions_taken: "Searched email correspondence for related information",
            duration: null,
            linked_doc: ""
          }
        },
        _debug: {
          api_tier: tier,
          api_confidence: confidence,
          pipeline_version: "v4.0-nasrag",
          transformation_timestamp: new Date().toISOString()
        }
      }
    }];
  }

  // ============================================================================
  // CASCADING EMAIL RESULTS (Top 5 from solution_emails)
  // ============================================================================

  // Primary findings: Top 5 from solution_emails (high confidence)
  const primary_findings = solution_emails
    .slice(0, 5)
    .map(transformEmailToDocument)
    .filter(Boolean);

  // Other emails: Remaining from solution_emails (positions 6-10)
  const remaining_solution = solution_emails
    .slice(5, 10)
    .map(transformEmailToDocument)
    .filter(Boolean);

  // All emails: Top 5 from other_emails (lower confidence)
  const all_emails = other_emails
    .slice(0, 5)
    .map(transformEmailToDocument)
    .filter(Boolean);

  // Rescued emails: Emails rescued via attachment processing (special case)
  // These are emails with low text match but high attachment match
  const rescued_items = rescued_emails
    .map(transformEmailToDocument)
    .filter(Boolean);

  // ============================================================================
  // HIDDEN RESULTS (Overflow beyond top 15)
  // ============================================================================

  const hidden_results = {
    count: 0,
    emails: []
  };

  // Add overflow from solution_emails (positions 11+)
  const solution_overflow = solution_emails
    .slice(10)
    .map(transformEmailToDocument)
    .filter(Boolean);
  hidden_results.emails.push(...solution_overflow);

  // Add overflow from other_emails (positions 6+)
  const other_overflow = other_emails
    .slice(5)
    .map(transformEmailToDocument)
    .filter(Boolean);
  hidden_results.emails.push(...other_overflow);

  // Add rescued emails to hidden results (or could be shown separately)
  hidden_results.emails.push(...rescued_items);

  hidden_results.count = hidden_results.emails.length;

  // ============================================================================
  // HANDOVER SECTION (Global for entire search) - DYNAMIC GENERATION
  // ============================================================================

  // Get original user query from API response (echoed back)
  const userQuery = original_query || "Email search";

  // Top result link (primary finding #1)
  const topEmailLink = primary_findings[0]?.links?.document || "";

  // ============================================================================
  // DYNAMIC HANDOVER GENERATION (Based on entities)
  // ============================================================================

  // Extract handover fields from entities (merged[] array format)
  function extractHandoverFieldsFromEntities(entitiesData) {
    const fields = {
      company: '',
      document_type: '',
      equipment: '',
      fault_code: '',
      location: ''
    };

    try {
      // Work with merged[] array format
      const merged = entitiesData.merged || [];

      // Company/Organization (type: org, company, manufacturer)
      const companyEntity = merged.find(e =>
        e.type === 'org' || e.type === 'company' || e.type === 'manufacturer'
      );
      if (companyEntity) {
        fields.company = companyEntity.term;
      }

      // Document type (type: document_type)
      const docEntity = merged.find(e => e.type === 'document_type');
      if (docEntity) {
        fields.document_type = docEntity.term;
      }

      // Equipment/System (type: equipment, component, system)
      const equipmentEntity = merged.find(e =>
        e.type === 'equipment' || e.type === 'component' || e.type === 'system'
      );
      if (equipmentEntity) {
        fields.equipment = equipmentEntity.term;
      }

      // Fault code (type: fault_code, error_code)
      const faultEntity = merged.find(e =>
        e.type === 'fault_code' || e.type === 'error_code'
      );
      if (faultEntity) {
        fields.fault_code = faultEntity.term.toUpperCase();
      }

      // Location (type: location_on_board, location)
      const locationEntity = merged.find(e =>
        e.type === 'location_on_board' || e.type === 'location'
      );
      if (locationEntity) {
        fields.location = locationEntity.term;
      }

    } catch (error) {
      console.error('[HANDOVER] Error extracting fields from entities:', error.message);
    }

    return fields;
  }

  // Extract fields from entities
  const extractedFields = extractHandoverFieldsFromEntities(entities);

  // Build system field (priority: equipment > company)
  let systemField = extractedFields.equipment || extractedFields.company || '';

  // Add location prefix if available
  if (extractedFields.location && !systemField.includes(extractedFields.location)) {
    systemField = extractedFields.location + (systemField ? ' - ' + systemField : '');
  }

  // Fallback: Extract from query if entities didn't provide
  if (!systemField) {
    const systemMatch = userQuery.match(/\b(engine|generator|pump|hydraulic|electrical|fuel|cooling|steering)\b/i);
    if (systemMatch) {
      systemField = systemMatch[1].charAt(0).toUpperCase() + systemMatch[1].slice(1);
    }
  }

  // Fault code (from entities or query)
  let faultCode = extractedFields.fault_code;
  if (!faultCode) {
    const faultMatch = userQuery.match(/\b([A-Z]{2,4}[-_]?\d{2,4})\b/);
    if (faultMatch) {
      faultCode = faultMatch[1].toUpperCase();
    }
  }

  // Build handover template
  const handover_section = {
    system: systemField,
    fault_code: faultCode || '',
    symptoms: userQuery,
    actions_taken: 'Searched email correspondence for related information',
    duration: null,
    linked_doc: topEmailLink
  };

  // Count auto-filled fields (for metadata)
  const autoFilledFields = Object.entries(handover_section)
    .filter(([key, val]) =>
      val !== '' &&
      val !== null &&
      key !== 'linked_doc' &&
      key !== 'actions_taken' &&
      key !== 'duration'
    )
    .map(([key]) => key);

  // Handover metadata (shows intelligence to frontend)
  const handover_metadata = {
    auto_filled_count: autoFilledFields.length,
    auto_filled_fields: autoFilledFields,
    confidence: autoFilledFields.length > 0 ? 0.85 : 0,
    entity_count: (entities.merged || []).length,
    generated_at: new Date().toISOString()
  };

  // ============================================================================
  // SUMMARY METADATA
  // ============================================================================

  const showing_count = primary_findings.length + remaining_solution.length + all_emails.length;

  const summary = {
    emails_found: emails_found,
    showing: showing_count,
    hidden: hidden_results.count,
    tier: tier,
    confidence: confidence,
    emails_searched: emails_searched,
    message: null, // Null when results found
    pipeline_version: "v4.0-nasrag",
    execution_time_ms: atlasResult.total_time_ms || null
  };

  // ============================================================================
  // FINAL OUTPUT STRUCTURE (WITH PRESERVED METADATA)
  // ============================================================================

  const output = {
    // CRITICAL ROUTING METADATA (preserved from incoming request)
    timestamp: incomingMetadata.timestamp,
    source: incomingMetadata.source,
    client_info: incomingMetadata.client_info,
    webhookUrl: incomingMetadata.webhookUrl,
    executionMode: incomingMetadata.executionMode,
    success: true,
    yacht_id: incomingMetadata.yacht_id,
    original_query: incomingMetadata.original_query,
    entities: incomingMetadata.entities,

    // UI DISPLAY MODE
    ux_display: "search_mode",

    // TRANSFORMED EMAIL RESULTS
    ui_payload: {
      primary_findings: primary_findings,
      other_emails: remaining_solution,
      all_emails: all_emails,
      hidden_results: hidden_results,
      summary: summary,
      handover_section: handover_section,
      handover_metadata: handover_metadata  // Intelligence for frontend (auto-fill stats)
    }
  };

  // ============================================================================
  // STEP 4: DEBUG INFO (Shows data sources for troubleshooting)
  // ============================================================================

  output._debug = {
    // API response info
    api_tier: tier,
    api_confidence: confidence,
    solution_emails_count: solution_emails.length,
    other_emails_count: other_emails.length,
    rescued_emails_count: rescued_emails.length,
    total_emails_received: emails_found,
    pipeline_version: "v4.0-nasrag",
    transformation_timestamp: new Date().toISOString(),
    stages_executed: search_transparency.stages_executed || [],
    execution_time_ms: atlasResult.total_time_ms || null,

    // Data source tracking (for troubleshooting)
    data_sources: {
      input_type: 'email_rag_v4_nested',
      structure: 'analyzed_data + atlas_result',
      entities_in_analyzed_data: !!(entities && entities.merged),
      entity_count: (entities.merged || []).length,
      query_source: 'atlas_result.original_query',
      yacht_id_source: 'atlas_result.yacht_id'
    },

    // Validation flags
    has_routing_metadata: !!(incomingMetadata.timestamp && incomingMetadata.source),
    has_original_query: !!original_query,
    has_yacht_id: !!yacht_id,
    has_entities: (entities.merged || []).length > 0
  };

  // ============================================================================
  // RETURN FORMATTED OUTPUT
  // ============================================================================

  console.log('[TRANSFORM] ========== TRANSFORMATION COMPLETE ==========');
  console.log(`[TRANSFORM] Output: search_mode with ${primary_findings.length} primary + ${remaining_solution.length} other + ${all_emails.length} all + ${hidden_results.count} hidden`);
  console.log(`[TRANSFORM] Handover: ${handover_metadata.auto_filled_count} fields auto-filled (${handover_metadata.auto_filled_fields.join(', ')})`);
  console.log('[TRANSFORM] ===================================================');

  return [{
    json: output
  }];

} catch (error) {
  // ============================================================================
  // CATASTROPHIC ERROR HANDLER
  // ============================================================================

  console.error('❌ Email RAG v4.0 transformation error:', error);

  return [{
    json: {
      // PRESERVE ROUTING METADATA (best effort in catastrophic error)
      timestamp: new Date().toISOString(),
      source: "celesteos_modern_local_ux",
      yacht_id: "default",

      success: false,
      ux_display: "error",
      error: {
        type: "system_error",
        message: "Failed to process Email RAG API v4.0 results",
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }
  }];
}
