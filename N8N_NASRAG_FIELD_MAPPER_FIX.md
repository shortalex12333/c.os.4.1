# N8N → NASRAG Field Mapping Fix

## Problem
NASRAG API crashes with:
```
AttributeError: 'NoneType' object has no attribute 'lower'
```

**Root Cause:** n8n sends `original_query` but NASRAG expects `query`.

## Fix: Add Code Node Before NASRAG HTTP Request

### Location in Workflow
Insert between:
- **Entity Extractor** (outputs `original_query`)
- **Maritime RAG v3.0 Orchestrator** (sends to NASRAG)

### Code Node Configuration

**Node Name:** `Format NASRAG Request`

**JavaScript Code:**
```javascript
// ============================================================
// N8N CODE NODE: Format Request for NASRAG API
// ============================================================
// Purpose: Map field names from 3B Entity output to NASRAG input
//
// Input: 3B Entity Integration Service output
// Output: NASRAG-compatible request payload
//
// Date: 2025-11-05
// Issue: NASRAG expects 'query' but receives 'original_query'
// ============================================================

const input = $input.item.json;

// Extract required fields
const query = input.original_query || input.message || input.query || "";
const entities = input.entities || { merged: [] };
const yachtId = input.yacht_id || "default";
const userId = input.userId || input.user_id || null;
const department = input.department || "Purser";
const rbac_role = input.rbac_role || "Purser";

// Log for debugging
console.log(`[NASRAG FORMAT] Query: "${query}"`);
console.log(`[NASRAG FORMAT] Entities: ${entities.merged?.length || 0} merged entities`);
console.log(`[NASRAG FORMAT] Department: ${department}`);

// Validate query exists
if (!query || query.trim() === "") {
  throw new Error("Query is required but was empty or missing");
}

// Build NASRAG request payload
const nasragRequest = {
  // CRITICAL: Map original_query → query
  query: query,

  // Entities (already in correct format from 3B Entity)
  entities: entities,

  // User context
  yacht_id: yachtId,
  user_id: userId,
  department: department,
  rbac_role: rbac_role,

  // Optional metadata (preserve if exists)
  conversation_id: input.conversation_id || null,
  session_id: input.sessionId || input.session_id || null,
  request_id: input.request_id || null,

  // Search mode
  mode: "search",

  // Preserve original request for debugging
  _original_fields: {
    had_original_query: !!input.original_query,
    had_message: !!input.message,
    had_query: !!input.query
  }
};

// Return formatted request
return {
  json: nasragRequest
};
```

---

## Validation Test

After adding the Code node, test with:

```bash
# Monitor NASRAG logs
tail -f /Users/celeste7/Documents/NASRAG_V2/logs/nasrag_api_output.log
```

Expected log output:
```
✅ Stage 0 MINIMAL: Query='what is the refill capacity for 3512b manual', Entities=4
```

**NOT:**
```
❌ Stage 0 MINIMAL: Query='None', Entities=4
```

---

## Alternative Fix (Python-side)

If you can't modify n8n workflow, add fallback in NASRAG:

**File:** `/Users/celeste7/Documents/NASRAG_V2/src/pipeline/core/models.py`

```python
# Around line 50-60 in PipelineRequest class
@property
def query_text(self):
    """Get query with fallback to original_query"""
    return self.query or self.original_query or ""
```

Then update `/src/pipeline/stages/stage0_minimal.py` line 663:

```python
# OLD (crashes on None):
query_lower = query.lower()

# NEW (handles None):
query_lower = (query or "").lower()
```

---

## Which Fix to Use?

**Recommended: n8n Code Node** (cleaner architecture)
- Keeps NASRAG API contract strict
- Makes field mapping explicit
- Easier to debug data flow

**Fallback: Python-side fix** (if workflow can't be modified)
- Adds defensive code
- Makes API more forgiving
- Risk of masking future issues

---

## Implementation Steps

### Option 1: n8n Workflow Fix (Recommended)

1. Open n8n: http://localhost:5678
2. Edit "Text Chat" workflow
3. Find "Entity Extractor" node
4. Add new **Code** node after it
5. Name it: `Format NASRAG Request`
6. Paste the JavaScript code above
7. Connect: `Entity Extractor` → `Format NASRAG Request` → `Maritime RAG v3.0 Orchestrator`
8. Save and activate workflow
9. Test with: "what is the refill capacity for 3512b manual"

### Option 2: Python Fix (Quick Patch)

```bash
cd /Users/celeste7/Documents/NASRAG_V2

# Edit stage0_minimal.py
# Line 663: Change to defensive code
# query_lower = (query or "").lower()

# Restart NASRAG
pkill -f "api.endpoints"
./start_api.sh
```

---

## Monitoring

After fix, watch for successful pipeline execution:

```bash
# NASRAG logs
tail -f /Users/celeste7/Documents/NASRAG_V2/logs/nasrag_api_output.log | grep "Query="

# Frontend logs
# In browser console, should see search results instead of empty response
```

---

## Status

- ❌ **Current:** Query arrives as `None`, crashes at line 663
- ✅ **After Fix:** Query arrives as `"what is the refill capacity..."`, proceeds to search

---

**Priority:** 🔴 HIGH - Blocks all text chat searches
**Estimated Time:** 5 minutes (n8n fix) or 2 minutes (Python fix)
