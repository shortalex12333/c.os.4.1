# Email RAG API v4.0 Integration Guide

**Date:** October 21, 2025
**Purpose:** Guide for integrating Email RAG API v4.0 with n8n workflow and frontend

---

## JSON Package Structures Found

### 1. **search_mode** (Email Search UI)

**Path:** `yacht/email` → `search_mode`

**Purpose:** Display cascading email results in frontend

**Structure:**
```json
{
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "primary_findings": [/* Top 5-7 high-confidence emails */],
    "other_emails": [/* 5 medium-confidence emails */],
    "all_emails": [/* 5 low-confidence emails */],
    "hidden_results": {
      "count": 33,
      "emails": [/* Overflow emails beyond 17 visible */]
    },
    "summary": {
      "emails_found": 50,
      "showing": 17,
      "hidden": 33,
      "tier": "uncertain",
      "confidence": 0.5844,
      "emails_searched": 50,
      "message": null
    },
    "handover_section": {
      "system": "fuel pump",
      "fault_code": "P0231",
      "symptoms": "What is the PO number for engine coolant?",
      "actions_taken": "Searched email correspondence for related information",
      "duration": null,
      "linked_doc": "https://outlook.office365.com/..."
    }
  }
}
```

**Files:**
- `/Users/celeste7/Documents/NEWSITE/n8n_search_mode_email_transform.js` (for ATLAS format)
- `/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js` (NEW - for Email RAG v4.0)

---

### 2. **ai_summary** (AI-Generated Summary UI)

**Path:** `yacht/email` → `ai_summary`

**Purpose:** Display AI-generated summary with sources

**Structure:** (Based on yacht branch patterns)
```json
{
  "success": true,
  "ux_display": "ai_summary",
  "ui_payload": {
    "summary_text": "Based on the emails, the jet ski engine won't start due to...",
    "sources": [
      {
        "id": "AAMkAGE001",
        "subject": "Jet ski engine won't start",
        "sender": "Engineer",
        "received_date": "2025-10-15T14:30:00Z",
        "link": "https://outlook.office365.com/..."
      }
    ],
    "confidence": 0.85,
    "model": "claude-sonnet-4",
    "generated_at": "2025-10-21T21:00:00Z"
  }
}
```

**Files:**
- Pattern found in `n8n_email_search_mode_complete.js` (not yet implemented for emails)

---

### 3. **handover** (6-Field Handover Template)

**Path:** All search modes → `handover_section`

**Purpose:** Pre-filled handover form for fault reporting

**Structure:**
```json
{
  "system": "Main Engine",
  "fault_code": "P0231",
  "symptoms": "Engine coolant pressure low",
  "actions_taken": "Searched email correspondence for related information",
  "duration": null,
  "linked_doc": "https://outlook.office365.com/mail/deeplink/read/AAMkAGE001..."
}
```

**Files:**
- `/Users/celeste7/Documents/NEWSITE/YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md` (architecture)
- NODE 6 in `n8n_email_search_mode_complete.js` (Handover Simplifier)

---

## Email RAG API v4.0 vs ATLAS Format

### Input Comparison

#### **Email RAG API v4.0** (Port 5156)

**Response Format:**
```json
{
  "tier": "uncertain",
  "confidence": 0.5844,
  "result_count": 5,
  "solution_emails": [
    {
      "id": "AAMkAGE001",
      "subject": "Invoice #12345",
      "from": {
        "emailAddress": {
          "name": "John Doe",
          "address": "john@example.com"
        }
      },
      "receivedDateTime": "2025-10-20T12:00:00Z",
      "bodyPreview": "Please find attached...",
      "hasAttachments": true,
      "bm25_score": 0.85,
      "entity_boost": 0.25,
      "entity_coverage": 0.67,
      "tier": 1,
      "search_type": "entity_boosted"
    }
  ],
  "other_emails": [/* Lower confidence emails */],
  "metadata": {
    "user_id": "3ca32d5f-5d83-4904-b194-5791b8d4f866",
    "query": "What was the latest microsoft invoice?",
    "execution_time_ms": 318.5,
    "stages": {
      "token_management": 4.62,
      "orchestration": 0.29,
      "tier_execution": 312.09
    }
  }
}
```

**Key Differences:**
- ✅ **Full email objects** in `solution_emails` and `other_emails` (not just IDs)
- ✅ **Already sorted** by relevance (BM25 + entity boost)
- ✅ **Tier classification** already done (`tier` field)
- ✅ **Metadata** includes execution timing and stages

#### **ATLAS API** (Old format)

**Response Format:**
```json
{
  "success": true,
  "emails": [/* ALL emails mixed together */],
  "emails_found": 50,
  "tier_reached": 1,
  "analyzed_data": {
    "email_analysis": {
      "high_confidence": ["id1", "id2", "id3"],  // ID arrays only
      "medium_confidence": ["id4", "id5"],
      "low_confidence": ["id6"]
    },
    "entities": {
      "merged": [
        {"term": "Microsoft", "type": "org", "final_weight": 1.5}
      ]
    }
  }
}
```

**Key Differences:**
- ❌ **ID arrays only** (need to map IDs to email objects)
- ❌ **All emails in one array** (not pre-separated)
- ❌ **Not sorted** (need to manually sort by tier)
- ❌ **No BM25 scores** in individual emails

---

## Transformation Strategy

### For Email RAG API v4.0 (NEW)

**Use:** `/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js`

**Logic:**
1. Extract `solution_emails` (already sorted)
2. Take top 5 → `primary_findings`
3. Take positions 6-10 → `other_emails`
4. Extract `other_emails` from API
5. Take top 5 → `all_emails`
6. Everything else → `hidden_results`

**Advantages:**
- Simpler transformation (no ID mapping needed)
- Faster (emails already sorted)
- More accurate (BM25 scores included)

### For ATLAS API (OLD)

**Use:** `/Users/celeste7/Documents/NEWSITE/n8n_search_mode_email_transform.js`

**Logic:**
1. Extract ID arrays: `high_confidence`, `medium_confidence`, `low_confidence`
2. Map IDs to full email objects from `emails` array
3. Top 7 from high → `primary_findings`
4. Top 5 from medium → `other_emails`
5. Top 5 from low → `all_emails`
6. Overflow → `hidden_results`

---

## n8n Workflow Integration

### Complete Flow (Email RAG API v4.0)

```
┌─────────────────────────────────────────────────────────────┐
│ WEBHOOK (Port 5678)                                         │
│ /webhook/text-chat                                          │
│                                                              │
│ Input:                                                       │
│ {                                                            │
│   "userId": "3ca32d5f-5d83-4904-b194-5791b8d4f866",         │
│   "message": "What was the latest microsoft invoice?",      │
│   "search_strategy": "semantic"                             │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ NODE 1: Entity Extraction (Port 5401)                       │
│ Service: 3B_ENTITY_PRODUCTION/Integration                   │
│                                                              │
│ Output:                                                      │
│ {                                                            │
│   "entities": {                                              │
│     "merged": [                                              │
│       {"term": "Microsoft", "canonical": "MICROSOFT", ...},  │
│       {"term": "invoice", "canonical": "INVOICE", ...}       │
│     ]                                                        │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ NODE 2: Email RAG API v4.0 (Port 5156)                      │
│ Endpoint: POST /api/v4/search-emails                        │
│                                                              │
│ Request:                                                     │
│ {                                                            │
│   "body": {                                                  │
│     "userId": "...",                                         │
│     "message": "What was the latest microsoft invoice?"     │
│   },                                                         │
│   "original_query": "...",                                   │
│   "entities": { "merged": [...] }                            │
│ }                                                            │
│                                                              │
│ Response:                                                    │
│ {                                                            │
│   "tier": "uncertain",                                       │
│   "confidence": 0.5844,                                      │
│   "solution_emails": [5 emails],                             │
│   "other_emails": [32 emails]                                │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ NODE 3: Email RAG v4.0 Transform (JavaScript)               │
│ File: n8n_email_rag_v4_transform.js                         │
│                                                              │
│ Transforms:                                                  │
│ - solution_emails[0-4] → primary_findings                    │
│ - solution_emails[5-9] → other_emails                        │
│ - other_emails[0-4] → all_emails                             │
│ - Overflow → hidden_results                                  │
│                                                              │
│ Output:                                                      │
│ {                                                            │
│   "success": true,                                           │
│   "ux_display": "search_mode",                               │
│   "ui_payload": {                                            │
│     "primary_findings": [5],                                 │
│     "other_emails": [5],                                     │
│     "all_emails": [5],                                       │
│     "hidden_results": {...},                                 │
│     "summary": {...},                                        │
│     "handover_section": {...}                                │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE TO FRONTEND                                         │
│ Display: search_mode UI with cascading email results        │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Display Paths

### Path 1: **yacht/email → search_mode**

**Components:**
- `/Users/celeste7/Documents/NEWSITE/yacht-frontend/src/components/Chat/MessageBubble.js`

**Display Logic:**
1. `primary_findings` → Large cards at top
2. `other_emails` → Medium cards in middle
3. `all_emails` → Small cards at bottom
4. `hidden_results` → "Show 33 more..." expandable section
5. `handover_section` → Quick-fill handover form

### Path 2: **yacht/email → ai_summary**

**Components:** (Not yet implemented for emails)

**Display Logic:**
1. AI-generated summary text
2. Source emails as citations
3. Confidence score
4. Model attribution

---

## Test Cases

### Test Case 1: Top 5 Results Only

**Input to Email RAG API v4.0:**
```json
{
  "body": {
    "userId": "3ca32d5f-5d83-4904-b194-5791b8d4f866",
    "message": "What was the latest microsoft invoice?"
  },
  "entities": {
    "merged": [
      {"term": "Microsoft", "canonical": "MICROSOFT", "final_weight": 1.5},
      {"term": "invoice", "canonical": "INVOICE", "final_weight": 0.4225}
    ]
  }
}
```

**Expected Output (after transform):**
```json
{
  "ui_payload": {
    "primary_findings": [5],  // Top 5 solution emails
    "other_emails": [0],      // No remaining solution emails
    "all_emails": [5],        // Top 5 other emails
    "hidden_results": {
      "count": 27,
      "emails": [27]          // Overflow from other_emails
    },
    "summary": {
      "showing": 10,
      "hidden": 27
    }
  }
}
```

### Test Case 2: Empty Results

**API Response:**
```json
{
  "tier": "insufficient",
  "confidence": 0,
  "result_count": 0,
  "solution_emails": [],
  "other_emails": []
}
```

**Expected Output:**
```json
{
  "ui_payload": {
    "primary_findings": [],
    "other_emails": [],
    "all_emails": [],
    "summary": {
      "emails_found": 0,
      "message": "Searched 50 recent emails, found 0 matches",
      "suggestion": "Try different keywords or check your email filters"
    }
  }
}
```

### Test Case 3: Token Expired

**API Response:**
```json
{
  "error": {
    "message": "Failed to fetch token from Supabase: 401 Unauthorized"
  }
}
```

**Expected Output:**
```json
{
  "success": false,
  "ux_display": "error",
  "error": {
    "type": "token_expired",
    "message": "Your email connection has expired. Please reconnect your email account.",
    "action": "redirect_to_settings",
    "redirect_url": "/settings/email-connector"
  }
}
```

---

## File Summary

### Created Files

1. **`/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js`** (NEW)
   - JavaScript code node for Email RAG API v4.0
   - Transforms `solution_emails` + `other_emails` → search_mode UI
   - Handles errors, empty results, cascading limits

2. **`/Users/celeste7/Documents/NEWSITE/EMAIL_RAG_V4_INTEGRATION_GUIDE.md`** (THIS FILE)
   - Complete integration documentation
   - JSON package structures explained
   - n8n workflow integration guide

### Existing Files Referenced

1. **`/Users/celeste7/Documents/NEWSITE/n8n_search_mode_email_transform.js`**
   - Old ATLAS format transformer
   - Uses ID arrays + mapping logic

2. **`/Users/celeste7/Documents/NEWSITE/n8n_search_mode_test_cases.json`**
   - Test cases for edge cases
   - Shows expected JSON structures

3. **`/Users/celeste7/Documents/NEWSITE/YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md`**
   - Handover pattern architecture
   - 8-node workflow explanation

4. **`/Users/celeste7/Documents/NEWSITE/yacht-frontend/src/components/Chat/MessageBubble.js`**
   - Frontend component for displaying messages
   - Handles search_mode and ai_summary displays

---

## Quick Start

### 1. Add JavaScript Node to n8n Workflow

1. Open n8n: http://localhost:5678
2. Create new workflow or edit existing "text-chat" workflow
3. Add **Code** node after "Email RAG API v4.0" HTTP Request node
4. Copy contents of `/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js`
5. Paste into Code node
6. Set mode: **Run Once for Each Item**

### 2. Test with Sample Query

```bash
curl -X POST http://localhost:5678/webhook/text-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "3ca32d5f-5d83-4904-b194-5791b8d4f866",
    "message": "What was the latest microsoft invoice?",
    "search_strategy": "semantic"
  }' | jq
```

### 3. Verify Output Structure

Expected response:
```json
{
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "primary_findings": [/* 5 emails */],
    "summary": {
      "emails_found": 37,
      "showing": 10,
      "hidden": 27
    }
  }
}
```

---

## Troubleshooting

### Issue: "No Email RAG API result received"

**Cause:** HTTP Request node failed or returned empty response

**Fix:**
```bash
# Check Email RAG API is running
curl -s http://localhost:5156/health

# Restart if needed
cd /Users/celeste7/Documents/ATLAS_EMAIL_FILTRATION/python_orchestrator
pkill -f email_rag_api.py
nohup python3 email_rag_api.py > /tmp/email_rag_api.log 2>&1 &
```

### Issue: "Token expired" error

**Cause:** Microsoft OAuth token expired and refresh failed

**Fix:**
1. Check token in Supabase
2. Verify token_manager.py timezone fix is applied
3. Manually refresh token via n8n workflow

### Issue: Empty `primary_findings` array

**Cause:** Entity extraction not capturing relevant terms

**Fix:**
1. Check 3B entity extraction output
2. Verify entities in request to Email RAG API
3. Review BM25 scoring in API logs

---

## Performance Metrics

**Expected Response Times:**

| Stage | Time (ms) | Notes |
|-------|-----------|-------|
| Entity Extraction | 50-100 | 3B service (9 workers) |
| Email RAG API | 350-600 | Token + Graph API + BM25 |
| Transform Node | 5-10 | JavaScript execution |
| **Total** | **400-700ms** | End-to-end |

**Scalability:**

- Entity Extraction: 9 Gunicorn workers (high throughput)
- Email RAG API: Single process (needs Gunicorn for production)
- Transform Node: Stateless (scales with n8n)

---

## Next Steps

1. **Test the new transform node** with real queries
2. **Compare output** with old ATLAS transformer
3. **Verify frontend display** in yacht-frontend
4. **Tune cascading limits** if needed (currently 5+5+5=15)
5. **Deploy to production** with Gunicorn

---

**Created:** October 21, 2025 at 22:15 UTC
**Version:** 1.0
**Status:** Ready for testing
