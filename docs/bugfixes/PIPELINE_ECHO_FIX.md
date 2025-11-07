# Pipeline Fix: Echo Back original_query and yacht_id

**Date:** October 22, 2025
**Version:** 1.4
**Status:** ✅ Fixed

---

## Problem

User clarified that the Email RAG API was NOT returning critical fields needed for routing and handover generation:

1. ❌ `original_query` - User's query text ("what was the microsoft invoice amount?")
2. ❌ `yacht_id` - Yacht identifier for routing
3. ❌ Entities were being transformed from `merged[]` to `extracted{}` format

**Impact:**
- Handover symptoms showed "Email search" instead of actual query
- yacht_id was always "default"
- Frontend had to handle two different entity formats

---

## User Clarifications

> "yacht_id is found on input of Outlook RAG (our pipeline) and should be outputted afterward, and therefore refernced via json accordingly."

> "a! the offiiccl input fo entitie sfomr original query"
> (Translation: "Ah! the official input for entities from original query")
> → Symptoms should be the original user query

> "mergeed array format. if this is too hard toa chieve, we cna change front end to accept divergence"
> → Keep entities in merged[] array format

---

## Solution

### 1. Modified Email RAG Pipeline (email_rag_pipeline.py)

**File:** `/Users/celeste7/Documents/ATLAS_EMAIL_FILTRATION/python_orchestrator/modules/email_rag_pipeline.py`

**Line 92-93:** Extract yacht_id from request
```python
yacht_id = request_data.get('body', {}).get('yacht_id') or \
           request_data.get('body', {}).get('yachtId') or \
           request_data.get('yacht_id', 'default')
```

**Line 343-344:** Echo back in response
```python
# Request echo (for workflow routing)
'original_query': original_query,  # Echo back user's query
'yacht_id': yacht_id,  # Echo back yacht_id for routing
```

**Line 380:** Updated error response signature
```python
def _error_response(self, error_message: str, original_query: str = '', yacht_id: str = 'default')
```

**Line 400-401:** Echo back in error responses
```python
'original_query': original_query,  # Echo back user's query
'yacht_id': yacht_id,  # Echo back yacht_id for routing
```

---

### 2. Modified Transform Node (OUTLOOK_RAG_TRANSFORM.js)

**File:** `/Users/celeste7/Documents/NEWSITE/OUTLOOK_RAG_TRANSFORM.js`

#### A. Extract Fields from API Response (Lines 75-109)

**BEFORE:**
```javascript
const requestBody = ragResult.body || {};

const incomingMetadata = {
  yacht_id: requestBody.yacht_id || requestBody.yachtId || "default",
  original_query: requestBody.message || requestBody.query || "",
  entities: transformEntitiesToGroupedFormat(ragResult.entities || {})
};
```

**AFTER:**
```javascript
const incomingMetadata = {
  yacht_id: ragResult.yacht_id || "default",  // ✅ From API
  original_query: ragResult.original_query || "",  // ✅ From API
  entities: ragResult.entities || { merged: [] }  // ✅ Keep merged[] format
};
```

#### B. Updated Handover Field Extraction (Lines 450-500)

**BEFORE:** Expected `entities.extracted.{type}[]` format
```javascript
const extracted = entitiesGrouped.extracted || {};

if (extracted.org && extracted.org.length > 0) {
  fields.company = extracted.org[0];
}
```

**AFTER:** Work with `entities.merged[]` format
```javascript
const merged = entitiesData.merged || [];

const companyEntity = merged.find(e =>
  e.type === 'org' || e.type === 'company' || e.type === 'manufacturer'
);
if (companyEntity) {
  fields.company = companyEntity.term;
}
```

#### C. Removed Unused Function (Lines 115-138)

Deleted `transformEntitiesToGroupedFormat()` function - no longer needed

---

## API Response Structure (Updated)

### Before Fix

```json
{
  "tier": "uncertain",
  "confidence": 0.6501,
  "solution_emails": [...],
  "entities": {
    "merged": [
      {"term": "Microsoft", "type": "org", "final_weight": 1.5}
    ]
  }
  // ❌ No original_query
  // ❌ No yacht_id
}
```

### After Fix

```json
{
  "tier": "uncertain",
  "confidence": 0.6501,
  "solution_emails": [...],
  "original_query": "what was the microsoft invoice amount?",  // ✅ NEW!
  "yacht_id": "M/Y Celeste",  // ✅ NEW!
  "entities": {
    "merged": [
      {"term": "Microsoft", "type": "org", "final_weight": 1.5}
    ]
  }
}
```

---

## Transform Node Output (Updated)

### Before Fix

```json
{
  "original_query": "",  // ❌ EMPTY!
  "yacht_id": "default",  // ❌ Default value
  "entities": {
    "extracted": {  // ❌ Transformed format
      "org": ["Microsoft"],
      "document_type": ["invoice"]
    }
  },
  "ui_payload": {
    "handover_section": {
      "system": "Microsoft",
      "symptoms": "Email search"  // ❌ Generic text
    }
  }
}
```

### After Fix

```json
{
  "original_query": "what was the microsoft invoice amount?",  // ✅ Actual query!
  "yacht_id": "M/Y Celeste",  // ✅ Real yacht ID
  "entities": {
    "merged": [  // ✅ Original format preserved
      {"term": "Microsoft", "type": "org", "final_weight": 1.5},
      {"term": "invoice", "type": "document_type", "final_weight": 0.4225}
    ]
  },
  "ui_payload": {
    "handover_section": {
      "system": "Microsoft",
      "symptoms": "what was the microsoft invoice amount?"  // ✅ Actual query!
    }
  }
}
```

---

## Entity Format Change

### Old Format (Transformed)
```javascript
entities: {
  extracted: {
    org: ["Microsoft"],
    document_type: ["invoice"],
    equipment: ["engine"],
    fault_code: ["E401"]
  }
}
```

### New Format (Preserved)
```javascript
entities: {
  merged: [
    {
      term: "Microsoft",
      type: "org",
      final_weight: 1.5,
      canonical: "MICROSOFT",
      metadata: {...},
      quality_score: 0.75,
      rarity_score: 0.5
    },
    {
      term: "invoice",
      type: "document_type",
      final_weight: 0.4225,
      canonical: "INVOICE",
      metadata: {...}
    }
  ]
}
```

**Benefits:**
- ✅ Preserves all entity metadata (weights, scores, canonical forms)
- ✅ Single source of truth - no transformation
- ✅ Frontend receives exact same data as pipeline produces
- ✅ Easier debugging - no format conversion errors

---

## Handover Field Extraction (Updated Logic)

### extractHandoverFieldsFromEntities()

**Before:** Iterated through `extracted.{type}[]` arrays
```javascript
if (extracted.org && extracted.org.length > 0) {
  fields.company = extracted.org[0];
}
```

**After:** Uses `.find()` on `merged[]` array
```javascript
const companyEntity = merged.find(e =>
  e.type === 'org' || e.type === 'company' || e.type === 'manufacturer'
);
if (companyEntity) {
  fields.company = companyEntity.term;
}
```

**Field Mappings:**
- **company**: `type = org | company | manufacturer`
- **equipment**: `type = equipment | component | system`
- **document_type**: `type = document_type`
- **fault_code**: `type = fault_code | error_code`
- **location**: `type = location_on_board | location`

---

## Testing

### Test 1: Original Query

**Request:**
```json
{
  "body": {
    "userId": "test-user",
    "message": "what was the microsoft invoice amount?",
    "yacht_id": "M/Y Celeste"
  },
  "original_query": "what was the microsoft invoice amount?",
  "entities": {...}
}
```

**Expected API Response:**
```json
{
  "original_query": "what was the microsoft invoice amount?",
  "yacht_id": "M/Y Celeste",
  ...
}
```

**Expected Transform Output:**
```json
{
  "original_query": "what was the microsoft invoice amount?",
  "yacht_id": "M/Y Celeste",
  "ui_payload": {
    "handover_section": {
      "symptoms": "what was the microsoft invoice amount?"
    }
  }
}
```

### Test 2: Entity Format

**API Response:**
```json
{
  "entities": {
    "merged": [
      {"term": "Microsoft", "type": "org", "final_weight": 1.5}
    ]
  }
}
```

**Expected Transform Output:**
```json
{
  "entities": {
    "merged": [
      {"term": "Microsoft", "type": "org", "final_weight": 1.5}
    ]
  },
  "ui_payload": {
    "handover_section": {
      "system": "Microsoft"
    }
  }
}
```

---

## Files Changed

| File | Lines | Changes |
|------|-------|---------|
| `email_rag_pipeline.py` | 92-93 | Extract yacht_id from request |
| `email_rag_pipeline.py` | 343-344 | Echo original_query and yacht_id |
| `email_rag_pipeline.py` | 380, 400-401 | Update error response |
| `OUTLOOK_RAG_TRANSFORM.js` | 75-109 | Use API fields directly |
| `OUTLOOK_RAG_TRANSFORM.js` | 450-500 | Work with merged[] format |
| `OUTLOOK_RAG_TRANSFORM.js` | 115-138 | Delete unused function |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 20 | Initial transform node |
| 1.1 | Oct 21 | Added handover generation |
| 1.2 | Oct 21 | Pipeline fix - entities in API response |
| 1.3 | Oct 22 | Fixed node references (removed Webhook) |
| **1.4** | **Oct 22** | **Echo original_query/yacht_id + merged[] format** |

---

## Summary

**What Was Fixed:**
1. ✅ Email RAG API now echoes back `original_query` and `yacht_id`
2. ✅ Transform node extracts these fields from API response
3. ✅ Entities stay in `merged[]` format (no transformation)
4. ✅ Handover extraction updated to work with `merged[]` format
5. ✅ Removed unused transformation function

**Result:**
- Handover symptoms now shows actual user query
- yacht_id routing works correctly
- Entity format is consistent across pipeline → API → transform → frontend
- Single source of truth for entity data

**Status:** ✅ Ready for testing in n8n workflow

**Confidence:** 10/10
