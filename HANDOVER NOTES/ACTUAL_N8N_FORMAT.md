# Actual n8n Response Format (Verified)

## Real Response from n8n Workflow

Based on actual test: "find me the furuno manual for antenna"

### n8n Returns:
```javascript
{
  ui_payload: {
    query_text: "find me the furuno manual for antenna",
    conversation_id: "conversation_1759849088603",
    query_id: "qry_1759849095873_hfcvxfy",
    timestamp: "2025-10-07T14:58:28.821Z",
    
    // PRIMARY RESULT (single object)
    primary_solution: {
      index: 0,
      source_type: "document",
      path: "/Users/.../v100NX_Manual.pdf",
      filename: "v100NX_Manual.pdf",
      display_name: "v100NX Manual",
      match_ratio: 0.1,
      relevance_score: 0.1,
      match_quality: "POOR",
      quality_score: 0.25,
      matching_pages: [...],
      page_count: 1,
      best_page: 83,
      entities_found: [...],
      entity_count: 1,
      content_preview: "83\nUsing AptusNX\nAntenna Firmware Upgrade...",
      content_full: "...",
      content_length: 400,
      tier: 4,
      display_color: "#ef4444",
      stars: 1,
      all_pages: [...],
      snippet: "...",
      relative_path: "02_ENGINEERING/main_engines/starboard_engine/v100NX_Manual.pdf",
      links: {...},
      sol_id: "sol_id1",
      search_sol_id: "search_sol_id1"
    },
    
    // ADDITIONAL RESULTS (array)
    other_solutions: [
      { /* same structure as primary_solution */ },
      { /* same structure */ },
      { /* same structure */ }
    ],
    
    // ADDITIONAL DOCS (array)
    additional_documents: [],
    
    // HANDOVER DATA
    handover_section: {
      enabled: true,
      error_state: true,
      role: "engineering",
      fields: [...],
      metadata: {...}
    },
    
    handover_data: [
      {...}, {...}, {...}, {...}, {...}, {...}, {...}
    ],
    
    // ENTITIES
    entities_found: [{...}],
    role: "engineering",
    
    // AI SUMMARY
    ai_summary: {
      text: "83\nUsing AptusNX\nAntenna Firmware Upgrade...",
      confidence: 0.6589473684210526,
      enabled: true
    },
    
    // METADATA
    transparency: {
      documents_examined_count: 4,
      average_confidence: 0.1,
      search_explanation: "Searched 4 documents. Showing top 4 results with 10% average confidence."
    },
    
    mode: "ai_enhanced",
    
    metrics: {
      processing_time_ms: 0,
      confidence_level: "MEDIUM"
    }
  },
  
  webhook_payload: {
    query_id: "qry_1759849095873_hfcvxfy",
    conversation_id: "conversation_1759849088603",
    query_text: "find me the furuno manual for antenna",
    role: "engineering",
    timestamp: "2025-10-07T14:58:28.821Z",
    mode: "ai_enhanced",
    results: {
      primary: {...},
      secondary: [...],
      additional: []
    },
    handover_section: {...},
    handover_data: [...],
    ai_summary: "text string...",
    ai_confidence: 0.6589473684210526,
    analytics: {
      documents_searched: 4,
      avg_relevance: 0.1,
      processing_time: 0,
      result_count: 4
    },
    entities: [{...}],
    meta: {
      workflow_version: "2.1",
      processor: "maritime_rag_v2",
      handover_mapper_version: "unknown",
      confidence_threshold: 0.5
    }
  },
  
  success: true
}
```

## Frontend Mapping (Fixed)

```typescript
// Build solutions array from primary + others
const solutions = [];
if (uiPayload.primary_solution) {
  solutions.push(uiPayload.primary_solution);
}
if (uiPayload.other_solutions) {
  solutions.push(...uiPayload.other_solutions);
}

const aiMessage: Message = {
  content: uiPayload.query_text,           // ✅ "find me the furuno..."
  solutions: solutions,                     // ✅ [primary, ...others]
  other_docs: uiPayload.additional_documents, // ✅ []
  mode: uiPayload.mode,                    // ✅ "ai_enhanced"
  ai_summary: uiPayload.ai_summary,        // ✅ {text, confidence, enabled}
  handover_section: uiPayload.handover_section, // ✅ {enabled, fields, ...}
  query_id: uiPayload.query_id,            // ✅ "qry_..."
  conversation_id: uiPayload.conversation_id, // ✅ "conversation_..."
}
```

## Key Differences from Mock

**Mock had:**
- `solution_cards` (array)
- `other_documents` (array)
- `query` (string)

**Real n8n has:**
- `primary_solution` (object) + `other_solutions` (array)
- `additional_documents` (array)
- `query_text` (string)

## Test Result

✅ **Working!** Found Furuno v100NX Manual page 83 about antenna firmware upgrade.

**Response Details:**
- Mode: `ai_enhanced`
- Solutions: 4 results (1 primary + 3 others)
- Confidence: 65.89%
- Processing time: 0ms
- Handover section: enabled (7 fields)
