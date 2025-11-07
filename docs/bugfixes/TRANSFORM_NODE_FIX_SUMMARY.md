# Transform Node Fix Summary

**Date:** October 21, 2025
**Version:** 1.1
**File:** `/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js`

---

## Issue Identified

The user pointed out that the transform node was incorrectly referencing input sources:

> "what node are you referncing in most recent js code you produce? this code only takse the input as the output frmo the atlas http call."

**Problem:** The transform code needed clarity on:
1. Which node provides the input (`$input.item.json`)
2. Where routing metadata comes from (`$('Webhook').item.json`)
3. Validation to ensure Email RAG API v4.0 format (not ATLAS)

---

## Fixes Applied

### 1. **Clear Workflow Documentation**

Added explicit workflow position documentation:

```javascript
/**
 * WORKFLOW POSITION:
 * [Webhook] → [Entity Extraction] → [HTTP Request: Email RAG API v4.0] → [THIS NODE] → [Response]
 *
 * INPUT SOURCE: HTTP Request node that calls Email RAG API v4.0 (POST http://localhost:5156/api/v4/search-emails)
 * WEBHOOK DATA: Referenced via $('Webhook').item.json for routing metadata
 */
```

### 2. **Input Validation**

Added validation to ensure correct input format:

```javascript
// Validate that this is Email RAG API v4.0 output (not ATLAS)
if (!ragResult.solution_emails && !ragResult.other_emails) {
  throw new Error('Invalid input: Expected Email RAG API v4.0 format with solution_emails/other_emails. Got ATLAS format instead?');
}
```

### 3. **Explicit Data Source References**

Clarified where each piece of data comes from:

```javascript
// Get original webhook data from the Webhook node
const webhookData = $('Webhook').item.json || {};

// Entity extraction may also be in the input (from Entity Extraction node)
const entityData = $input.item.json || {};

// Extract request body (may contain userId, message, etc.)
const requestBody = webhookData.body || entityData.body || {};
```

### 4. **Improved Metadata Extraction**

Added proper fallback chain with comments:

```javascript
const incomingMetadata = {
  // Timestamp (webhook takes priority)
  timestamp: webhookData.timestamp || new Date().toISOString(),

  // Source application (usually from webhook)
  source: webhookData.source || "celesteos_modern_local_ux",

  // Client info (browser, platform, language) - only in webhook
  client_info: webhookData.client_info || {},

  // Webhook URL (only in webhook)
  webhookUrl: webhookData.webhookUrl || "",

  // Execution mode (webhook or default)
  executionMode: webhookData.executionMode || "production",

  // Yacht ID (webhook → request body → default)
  yacht_id: webhookData.yacht_id || requestBody.yacht_id || "default",

  // Original query (webhook → entity data → request body → default)
  original_query: webhookData.original_query ||
                  entityData.original_query ||
                  requestBody.message ||
                  "",

  // Entities (webhook → entity data)
  entities: transformEntitiesToGroupedFormat(
    webhookData.entities || entityData.entities || {}
  )
};
```

### 5. **Enhanced Debug Output**

Added detailed debug tracking to show where data comes from:

```javascript
output._debug = {
  // API response info
  api_tier: tier,
  api_confidence: confidence,
  solution_emails_count: solution_emails.length,
  other_emails_count: other_emails.length,

  // Data source tracking (for troubleshooting)
  data_sources: {
    input_type: ragResult.solution_emails ? 'email_rag_v4' : 'unknown',
    webhook_data_found: Object.keys(webhookData).length > 0,
    entity_data_found: Object.keys(entityData).length > 0,
    metadata_timestamp_source: webhookData.timestamp ? 'webhook' : 'generated',
    metadata_entities_source: webhookData.entities ? 'webhook' : (entityData.entities ? 'entity_data' : 'none'),
    metadata_query_source: webhookData.original_query ? 'webhook' : (entityData.original_query ? 'entity_data' : (requestBody.message ? 'request_body' : 'none'))
  },

  // Validation flags
  has_routing_metadata: !!(incomingMetadata.timestamp && incomingMetadata.source),
  has_client_info: Object.keys(incomingMetadata.client_info).length > 0,
  has_entities: Object.keys(incomingMetadata.entities).length > 0
};
```

---

## Node References Explained

### `$input.item.json`
**What it is:** Output from the PREVIOUS node in the workflow
**In this case:** HTTP Request node response from Email RAG API v4.0
**Contains:**
```json
{
  "tier": "uncertain",
  "confidence": 0.5844,
  "result_count": 5,
  "solution_emails": [...],
  "other_emails": [...],
  "processing_metadata": {...}
}
```

### `$('Webhook').item.json`
**What it is:** Output from the Webhook node (referenced by name)
**Contains:**
```json
{
  "timestamp": "2025-10-21T22:51:50.016Z",
  "source": "celesteos_modern_local_ux",
  "client_info": {
    "user_agent": "Mozilla/5.0...",
    "platform": "MacIntel",
    "language": "en-GB"
  },
  "webhookUrl": "http://127.0.0.1:8083/webhook/text-chat",
  "executionMode": "production",
  "yacht_id": "default",
  "original_query": "what was latest microsoft invoice?\n",
  "entities": {
    "merged": [...]
  },
  "body": {
    "userId": "...",
    "message": "..."
  }
}
```

---

## Expected Input Format (Email RAG API v4.0)

The transform node expects the HTTP Request node to return this structure:

```json
{
  "tier": "uncertain",
  "confidence": 0.5844,
  "result_count": 5,
  "early_exit": true,
  "solution_emails": [
    {
      "id": "AAMkAGMw...",
      "subject": "Your Microsoft invoice G118751505 is ready",
      "from": {
        "emailAddress": {
          "address": "microsoft-noreply@microsoft.com",
          "name": "Microsoft"
        }
      },
      "receivedDateTime": "2025-10-13T03:13:57Z",
      "bodyPreview": "Sign in to review your latest invoice...",
      "hasAttachments": false,
      "bm25_score": 11.7506,
      "confidence": 0.5844,
      "entity_boost": 2.138,
      "entity_coverage": 0.6667,
      "lexical_score": 36.8733,
      "matched_entities": [...],
      "scoring_method": "bm25_entity_weighted"
    }
  ],
  "other_emails": [...],
  "processing_metadata": {
    "time_ms": {
      "bm25_scoring": 1.5292,
      "confidence_calculation": 0.0832,
      "deduplication": 9.8722,
      "orchestration": 0.2890,
      "tier_execution": 355.9842,
      "token_management": 10.3660
    }
  },
  "response": "Found 5 possible matches (58% confidence). Review results carefully.",
  "response_type": "uncertain_results",
  "stages_executed": [1, 2, 3, 4, 7, 8],
  "strategy_succeeded": "search",
  "tier_reached": 1,
  "total_processed": 50,
  "total_time_ms": 378.12
}
```

---

## What Changed from v1.0 to v1.1

| Change | Reason | Impact |
|--------|--------|--------|
| Added workflow position diagram | Clarify node placement | Better documentation |
| Added input validation | Detect ATLAS vs v4.0 format | Early error detection |
| Explicit node references | Clear data sources | Easier debugging |
| Enhanced fallback chain | Handle missing data | More robust |
| Detailed debug output | Track data sources | Troubleshooting |
| Step-by-step comments | Explain logic flow | Maintainability |

---

## Testing the Transform

### Test Command

```bash
# 1. Start Email RAG API v4.0 (if not running)
cd /Users/celeste7/Documents/ATLAS_EMAIL_FILTRATION/python_orchestrator
python3 email_rag_api.py

# 2. Test the API directly
curl -X POST http://localhost:5156/api/v4/search-emails \
  -H "Content-Type: application/json" \
  -d @/tmp/test_n8n_format.json | jq '.'

# 3. Import transform node into n8n workflow
# Copy the contents of n8n_email_rag_v4_transform.js into a JavaScript node

# 4. Connect workflow:
# Webhook → Entity Extraction → HTTP Request (Email RAG v4.0) → Transform Node → Response
```

### Expected Output Structure

```json
{
  "timestamp": "2025-10-21T22:51:50.016Z",
  "source": "celesteos_modern_local_ux",
  "client_info": {
    "user_agent": "Mozilla/5.0...",
    "platform": "MacIntel",
    "language": "en-GB"
  },
  "webhookUrl": "http://127.0.0.1:8083/webhook/text-chat",
  "executionMode": "production",
  "success": true,
  "yacht_id": "default",
  "original_query": "what was latest microsoft invoice?\n",
  "entities": {
    "extracted": {
      "org": ["Microsoft"],
      "document_type": ["invoice"],
      "fault_classification": ["test_mode"]
    }
  },
  "ux_display": "search_mode",
  "ui_payload": {
    "primary_findings": [5],
    "other_emails": [5],
    "all_emails": [5],
    "hidden_results": {
      "count": 25,
      "emails": [25]
    },
    "summary": {
      "emails_found": 5,
      "showing": 15,
      "hidden": 25,
      "tier": "uncertain",
      "confidence": 0.5844
    },
    "handover_section": {...}
  },
  "_debug": {
    "data_sources": {
      "input_type": "email_rag_v4",
      "webhook_data_found": true,
      "metadata_timestamp_source": "webhook",
      "metadata_entities_source": "webhook"
    },
    "has_routing_metadata": true,
    "has_client_info": true,
    "has_entities": true
  }
}
```

---

## Key Differences: Email RAG v4.0 vs ATLAS

| Feature | Email RAG v4.0 | ATLAS (OLD) |
|---------|----------------|-------------|
| **Email arrays** | `solution_emails`, `other_emails` | `emails` (single array) |
| **Email format** | Full objects in response | Need ID mapping |
| **Tier classification** | `tier: "uncertain"` | `tier_reached: 1` |
| **Confidence** | Per-email + global | Global only |
| **BM25 scores** | Included per email | Not included |
| **Entity metrics** | `entity_boost`, `entity_coverage` | Not included |
| **Sorting** | Pre-sorted by BM25 | Manual sorting needed |
| **Transform complexity** | Simple (50 lines logic) | Complex (150 lines) |

---

## Next Steps

1. ✅ **Fixed transform node** - Clear input source references
2. ⏳ **Discuss handover integration** - How to populate handover_section
3. ⏳ **Test in n8n workflow** - Validate with real webhook data
4. ⏳ **Frontend integration** - Connect to MessageBubble.js

---

**Status:** Transform node fixed and documented
**Confidence:** 9/10 (needs testing with live n8n workflow)
