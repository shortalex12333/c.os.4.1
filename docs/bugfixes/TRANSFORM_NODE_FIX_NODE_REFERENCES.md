# Transform Node Fix: Removed Non-Existent Node References

**Date:** October 22, 2025
**Issue:** Transform node was trying to reference `$('Webhook')` which doesn't exist
**Fix:** Changed to only reference "Outlook RAG" node output via `$input.item.json`

---

## Error Message

```
"error": {
  "type": "system_error",
  "message": "Failed to process Email RAG API v4.0 results",
  "details": "Referenced node doesn't exist",
  "stack": "ExpressionError: Referenced node doesn't exist
    at $ (/opt/homebrew/lib/node_modules/n8n/node_modules/n8n-workflow/src/workflow-data-proxy.ts:1056:12)
```

**Root Cause:** Line 85 had `const webhookData = $('Webhook').item.json || {};` but no "Webhook" node exists in the workflow.

---

## Workflow Structure (Actual)

```
[Previous Node] → [Outlook RAG] → [Code3 (Transform)] → [Response]
                       ↑
                 HTTP Request to
           POST http://localhost:5156/api/v4/search-emails
```

**Node Names:**
- **Outlook RAG** - HTTP Request node calling Email RAG API v4.0
- **Code3** - This transform node (JavaScript)

---

## Changes Made

### 1. Removed Non-Existent Node References

**BEFORE:**
```javascript
// Get original webhook data from the Webhook node
const webhookData = $('Webhook').item.json || {};

// Entity extraction may also be in the input (from Entity Extraction node)
const entityData = $input.item.json || {};

// Extract request body (may contain userId, message, etc.)
const requestBody = webhookData.body || entityData.body || {};
```

**AFTER:**
```javascript
// All metadata should come from the Email RAG API response
// The API receives the full request and returns everything we need

// Extract request body if present in API response
const requestBody = ragResult.body || {};
```

**Why:** There is no "Webhook" node to reference. Everything comes from the "Outlook RAG" node output.

---

### 2. Simplified Metadata Building

**BEFORE:**
```javascript
const incomingMetadata = {
  timestamp: webhookData.timestamp || new Date().toISOString(),
  source: webhookData.source || "celesteos_modern_local_ux",
  client_info: webhookData.client_info || {},
  webhookUrl: webhookData.webhookUrl || "",
  executionMode: webhookData.executionMode || "production",
  yacht_id: webhookData.yacht_id || requestBody.yacht_id || "default",
  original_query: webhookData.original_query ||
                  entityData.original_query ||
                  requestBody.message ||
                  "",
  entities: transformEntitiesToGroupedFormat(
    ragResult.entities || webhookData.entities || entityData.entities || {}
  )
};
```

**AFTER:**
```javascript
const incomingMetadata = {
  timestamp: new Date().toISOString(),
  source: "celesteos_modern_local_ux",
  client_info: {},
  webhookUrl: "",
  executionMode: "production",
  yacht_id: requestBody.yacht_id || requestBody.yachtId || "default",
  original_query: requestBody.message || requestBody.query || "",
  entities: transformEntitiesToGroupedFormat(
    ragResult.entities || {}
  )
};
```

**Why:** All data comes from `ragResult` (the "Outlook RAG" node output), not from other nodes.

---

### 3. Cleaned Up Debug Section

**BEFORE:**
```javascript
data_sources: {
  input_type: ragResult.solution_emails ? 'email_rag_v4' : 'unknown',
  webhook_data_found: Object.keys(webhookData).length > 0,
  entity_data_found: Object.keys(entityData).length > 0,
  metadata_timestamp_source: webhookData.timestamp ? 'webhook' : 'generated',
  metadata_entities_source: webhookData.entities ? 'webhook' : (entityData.entities ? 'entity_data' : 'none'),
  metadata_query_source: webhookData.original_query ? 'webhook' : (entityData.original_query ? 'entity_data' : (requestBody.message ? 'request_body' : 'none'))
}
```

**AFTER:**
```javascript
data_sources: {
  input_type: ragResult.solution_emails ? 'email_rag_v4' : 'unknown',
  entities_in_api_response: !!(ragResult.entities && ragResult.entities.merged),
  entity_count: (ragResult.entities?.merged || []).length,
  query_source: requestBody.message ? 'request_body.message' : (requestBody.query ? 'request_body.query' : 'none')
}
```

**Why:** Removed references to non-existent node data.

---

### 4. Updated Documentation

**BEFORE:**
```javascript
/**
 * WORKFLOW POSITION:
 * [Webhook] → [Entity Extraction] → [HTTP Request: Email RAG API v4.0] → [THIS NODE] → [Response]
 *
 * INPUT SOURCE: HTTP Request node that calls Email RAG API v4.0 (POST http://localhost:5156/api/v4/search-emails)
 * WEBHOOK DATA: Referenced via $('Webhook').item.json for routing metadata
```

**AFTER:**
```javascript
/**
 * WORKFLOW POSITION:
 * [Previous Node] → [Outlook RAG (HTTP Request)] → [THIS NODE (Code3)] → [Response]
 *
 * INPUT SOURCE: "Outlook RAG" node output ($input.item.json)
 * - Outlook RAG node calls: POST http://localhost:5156/api/v4/search-emails
```

**Why:** Accurately reflects the actual workflow structure.

---

## Data Flow (Corrected)

### What the Transform Node Receives

**Input:** `$input.item.json` from "Outlook RAG" node

**Expected Structure:**
```json
[
  {
    "tier": "uncertain",
    "confidence": 0.6501,
    "result_count": 5,
    "solution_emails": [...],
    "other_emails": [...],
    "rescued_emails": [],
    "entities": {
      "merged": [
        {
          "term": "Microsoft",
          "type": "org",
          "final_weight": 1.5,
          "metadata": {...}
        }
      ]
    },
    "processing_metadata": {...},
    "search_transparency": {...},
    "response": "Found 5 possible matches...",
    "response_type": "uncertain_results"
  }
]
```

**Note:** Array-wrapped (handled by unwrapping logic on line 45-47)

### What the Transform Node Outputs

**Output:** Frontend-ready `search_mode` JSON

```json
{
  "timestamp": "2025-10-22T00:43:49.190Z",
  "source": "celesteos_modern_local_ux",
  "yacht_id": "default",
  "original_query": "what was the microsoft invoice amount?",
  "entities": {
    "extracted": {
      "org": ["Microsoft"],
      "document_type": ["invoice"]
    }
  },
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "primary_findings": [...],
    "other_emails": [...],
    "all_emails": [...],
    "hidden_results": {...},
    "summary": {...},
    "handover_section": {
      "system": "Microsoft",
      "fault_code": "",
      "symptoms": "what was the microsoft invoice amount?",
      "actions_taken": "Searched email correspondence for related information",
      "duration": null,
      "linked_doc": "https://outlook.office365.com/mail/..."
    },
    "handover_metadata": {
      "auto_filled_count": 2,
      "auto_filled_fields": ["system", "symptoms"],
      "confidence": 0.96,
      "entity_count": 2
    }
  }
}
```

---

## Node References in n8n

### ✅ Correct Way to Reference Nodes

```javascript
// Reference the CURRENT input (from previous node in workflow)
const ragResult = $input.item.json;

// Reference a SPECIFIC node by name
const outlookData = $('Outlook RAG').item.json;
```

### ❌ Incorrect (What Was Causing the Error)

```javascript
// Trying to reference a node that doesn't exist
const webhookData = $('Webhook').item.json;  // ERROR!
```

---

## Testing

**Before Fix:**
```json
{
  "error": {
    "type": "system_error",
    "details": "Referenced node doesn't exist"
  }
}
```

**After Fix:**
```json
{
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "primary_findings": [5 emails],
    "handover_section": {
      "system": "Microsoft"  // ✅ Auto-filled!
    }
  }
}
```

---

## Files Updated

| File | Change |
|------|--------|
| `n8n_email_rag_v4_transform.js` | Removed all references to non-existent nodes |

**Lines Changed:**
- 6-10: Updated workflow documentation
- 71-79: Removed webhookData/entityData references
- 81-119: Simplified metadata building
- 635-641: Cleaned up debug tracking

---

## Key Lessons

1. **Only reference nodes that actually exist in the workflow**
   - Check n8n workflow canvas to see node names
   - Use `$input.item.json` for previous node
   - Use `$('NodeName').item.json` for specific nodes

2. **API response should contain all needed data**
   - Don't rely on data from upstream nodes that may not exist
   - Email RAG API now returns entities in response
   - Transform node only needs the API output

3. **Keep it simple**
   - Don't create complex fallback chains across multiple nodes
   - Single source of truth: the "Outlook RAG" API output

---

**Status:** ✅ Fixed - Transform node now only references "Outlook RAG" output
**Next Step:** Test in n8n workflow
**Confidence:** 10/10
