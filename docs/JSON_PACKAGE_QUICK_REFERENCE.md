# JSON Package Quick Reference

**Version:** 1.0
**Date:** October 21, 2025
**Purpose:** Fast lookup for JSON paths, structures, and files

---

## Path Map

```
yacht/
├── email/
│   ├── search_mode      → Cascading email results (17 visible + overflow)
│   └── ai_summary       → AI-generated summary with sources
│
└── documents/
    ├── search_mode      → Document search results (yacht NAS)
    └── ai_summary       → Summary from technical manuals
```

---

## 1. `search_mode` (Email Results)

### Location
**API Output Path:** `ux_display: "search_mode"`
**Frontend Path:** `yacht/email/search_mode`

### Files
- Transform: `/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js`
- Tests: `/Users/celeste7/Documents/NEWSITE/n8n_search_mode_test_cases.json`
- Frontend: `/Users/celeste7/Documents/NEWSITE/yacht-frontend/src/components/Chat/MessageBubble.js`

### Structure
```javascript
{
  success: true,
  ux_display: "search_mode",
  ui_payload: {
    primary_findings: [5],      // Top 5 emails
    other_emails: [5],          // Next 5 emails
    all_emails: [5],            // Lower confidence 5
    hidden_results: {           // Overflow
      count: 27,
      emails: [27]
    },
    summary: {
      emails_found: 37,
      showing: 15,
      hidden: 27,
      tier: "uncertain",
      confidence: 0.58
    },
    handover_section: {         // 6-field template
      system: "",
      fault_code: "",
      symptoms: "",
      actions_taken: "",
      duration: null,
      linked_doc: ""
    }
  }
}
```

### Display Limits
- Primary findings: 5-7 emails (top tier)
- Other emails: 5 emails (mid tier)
- All emails: 5 emails (low tier)
- **Total visible: 15-17 emails**
- Overflow → hidden_results

---

## 2. `ai_summary` (AI-Generated Response)

### Location
**API Output Path:** `ux_display: "ai_summary"`
**Frontend Path:** `yacht/email/ai_summary`

### Files
- Architecture: `/Users/celeste7/Documents/NEWSITE/YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md`
- Pattern: Found in `n8n_email_search_mode_complete.js` (yacht branch)

### Structure
```javascript
{
  success: true,
  ux_display: "ai_summary",
  ui_payload: {
    summary_text: "Based on 5 emails, the jet ski engine won't start due to...",
    sources: [
      {
        id: "AAMkAGE001",
        subject: "Jet ski engine won't start",
        sender: "John Doe",
        received_date: "2025-10-20T12:00:00Z",
        link: "https://outlook.office365.com/..."
      }
    ],
    confidence: 0.85,
    model: "claude-sonnet-4",
    generated_at: "2025-10-21T21:00:00Z"
  }
}
```

### Display
- Summary text (markdown formatted)
- Source citations (clickable email links)
- Confidence badge
- Model attribution

---

## 3. `handover_section` (Fault Template)

### Location
**Field Path:** `ui_payload.handover_section`
**Used In:** All search modes

### Files
- Architecture: `/Users/celeste7/Documents/NEWSITE/YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md`
- Simplifier: NODE 6 in `n8n_email_search_mode_complete.js`

### Structure
```javascript
{
  system: "Main Engine",              // Equipment/system name
  fault_code: "P0231",                // Error/fault code
  symptoms: "Coolant pressure low",   // User's query or description
  actions_taken: "",                  // Empty - user fills
  duration: null,                     // null - user fills
  linked_doc: "https://..."           // Link to top result
}
```

### Auto-Fill Logic
- `system`: Extracted from entities (equipment, location)
- `fault_code`: Extracted from query (regex patterns)
- `symptoms`: User's original query
- `actions_taken`: Static text "Searched email correspondence..."
- `duration`: Always null (user input required)
- `linked_doc`: Link to #1 result

---

## 4. Email Object Structure

### Location
**Field Path:** `ui_payload.primary_findings[0]`
**Used In:** All email arrays (primary, other, all, hidden)

### Structure
```javascript
{
  id: "AAMkAGE001",
  display_name: "Invoice #12345",
  sender: {
    name: "John Doe",
    email: "john@example.com"
  },
  received_date: "2025-10-20T12:00:00Z",
  content_preview: "Please find attached the invoice..." (max 500 chars),
  match_ratio: 0.85,                  // BM25 score
  entity_boost: 0.25,                 // Entity match contribution
  entity_coverage: 0.67,              // % of query entities matched
  has_attachments: true,
  tier: 1,                            // 1=high, 2=med, 3=low
  search_type: "entity_boosted",
  links: {
    document: "https://outlook.office365.com/mail/deeplink/read/AAMkAGE001?ItemID=AAMkAGE001&exvsurl=1",
    web: "https://outlook.office365.com/mail/deeplink/read/AAMkAGE001",
    desktop: "outlook:message/AAMkAGE001"
  },
  metadata: {
    importance: "normal",
    is_read: false,
    categories: [],
    conversation_id: "AAMkAGE001"
  }
}
```

---

## 5. Error Response Structure

### Location
**Field Path:** `ux_display: "error"`

### Structure
```javascript
{
  success: false,
  ux_display: "error",
  error: {
    type: "token_expired",              // error_type
    message: "Your email connection...", // user-friendly message
    action: "redirect_to_settings",     // action to take
    redirect_url: "/settings/email-connector",
    cta_text: "Connect Email"
  }
}
```

### Error Types
- `token_expired` → Redirect to settings
- `offline` → Retry button
- `system_error` → Contact support

---

## API Comparison

### Email RAG API v4.0 (NEW)

**Endpoint:** `POST http://localhost:5156/api/v4/search-emails`

**Response:**
```javascript
{
  tier: "uncertain",
  confidence: 0.5844,
  result_count: 37,
  solution_emails: [/* Full email objects */],
  other_emails: [/* Full email objects */],
  metadata: {
    user_id: "...",
    query: "...",
    execution_time_ms: 318.5,
    stages: {...}
  }
}
```

**Characteristics:**
✅ Full email objects (not IDs)
✅ Already sorted by BM25
✅ Tier classification done
✅ Execution metadata included

**Transform File:** `n8n_email_rag_v4_transform.js`

---

### ATLAS API (OLD)

**Endpoint:** `POST http://localhost:8080/api/search-emails`

**Response:**
```javascript
{
  success: true,
  emails: [/* All 50 emails */],
  emails_found: 50,
  tier_reached: 1,
  analyzed_data: {
    email_analysis: {
      high_confidence: ["id1", "id2"],   // ID arrays
      medium_confidence: ["id3"],
      low_confidence: ["id4"]
    },
    entities: {
      merged: [...]
    }
  }
}
```

**Characteristics:**
❌ ID arrays (need mapping)
❌ All emails in one array
❌ Not sorted
❌ No BM25 scores

**Transform File:** `n8n_search_mode_email_transform.js`

---

## Transformation Logic

### Email RAG v4.0 → search_mode

```javascript
// Input: solution_emails, other_emails

primary_findings  = solution_emails[0-4]     // Top 5
other_emails      = solution_emails[5-9]     // Next 5
all_emails        = other_emails[0-4]        // Lower 5
hidden_results    = solution_emails[10+] + other_emails[5+]

// Total visible: 15
// Total hidden: result_count - 15
```

### ATLAS → search_mode

```javascript
// Input: high_confidence[], medium_confidence[], low_confidence[]

primary_findings = mapIdsToEmails(high_confidence, emails, 7)
other_emails     = mapIdsToEmails(medium_confidence, emails, 5)
all_emails       = mapIdsToEmails(low_confidence, emails, 5)
hidden_results   = overflow from all tiers

// Total visible: 17
// Total hidden: overflow count
```

---

## Field Mappings

### Email RAG v4.0 → Frontend

| API Field | Frontend Field | Notes |
|-----------|----------------|-------|
| `solution_emails[0]` | `primary_findings[0]` | Top result |
| `solution_emails.bm25_score` | `match_ratio` | Renamed |
| `solution_emails.tier` | `tier` | Direct copy |
| `tier` | `summary.tier` | Global tier |
| `confidence` | `summary.confidence` | Global confidence |
| `result_count` | `summary.emails_found` | Total found |
| `metadata.query` | `handover_section.symptoms` | User query |

---

## File Locations

### JavaScript Transform Nodes

```
/Users/celeste7/Documents/NEWSITE/
├── n8n_email_rag_v4_transform.js        ← NEW (for Email RAG v4.0)
├── n8n_search_mode_email_transform.js   ← OLD (for ATLAS)
└── n8n_email_search_mode_complete.js    ← Full 8-node workflow (yacht)
```

### Documentation

```
/Users/celeste7/Documents/NEWSITE/
├── EMAIL_RAG_V4_INTEGRATION_GUIDE.md    ← Integration guide (NEW)
├── JSON_PACKAGE_QUICK_REFERENCE.md      ← This file (NEW)
├── YACHT_VS_EMAIL_HANDOVER_ARCHITECTURE.md
└── n8n_search_mode_test_cases.json
```

### Email RAG API

```
/Users/celeste7/Documents/ATLAS_EMAIL_FILTRATION/
├── python_orchestrator/
│   ├── email_rag_api.py                 ← Main API file
│   └── modules/
│       └── token_manager.py             ← Token refresh (FIXED)
└── EMAIL_RAG_API_ENDPOINTS.md           ← API documentation
```

### Entity Extraction

```
/Users/celeste7/Documents/3B_ENTITY_PRODUCTION/
├── start_production.sh                  ← Start both services
├── api/
│   └── app.py                           ← Extraction API (port 5400)
└── integration_service/
    └── index.js                         ← Integration API (port 5401)
```

---

## Service Ports

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Email RAG API v4.0 | 5156 | ✅ Running | NASRAG pipeline |
| Entity Integration | 5401 | ✅ Running | 3B integration |
| Entity Extraction | 5400 | ✅ Running | 3B extraction (9 workers) |
| n8n Workflows | 5678 | ✅ Running | Workflow orchestration |
| Supabase | 54321 | ✅ Running | Token storage |
| BGE Embeddings | 8003 | ✅ Running | Semantic scoring |

---

## Common Workflows

### Workflow 1: Email Search (v4.0)

```
User Query
    ↓
Entity Extraction (port 5401)
    ↓
Email RAG API v4.0 (port 5156)
    ↓
Transform Node (n8n_email_rag_v4_transform.js)
    ↓
Frontend (search_mode display)
```

### Workflow 2: Document Search (yacht)

```
User Query
    ↓
Entity Extraction (port 5401)
    ↓
YACHT NAS Search (ChromaDB)
    ↓
Transform Node (yacht workflow)
    ↓
Frontend (search_mode display)
```

---

## Testing Commands

### Test Email RAG API v4.0

```bash
curl -X POST http://localhost:5156/api/v4/search-emails \
  -H "Content-Type: application/json" \
  -d '{
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
  }' | jq
```

### Test n8n Webhook

```bash
curl -X POST http://localhost:5678/webhook/text-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "3ca32d5f-5d83-4904-b194-5791b8d4f866",
    "message": "What was the latest microsoft invoice?",
    "search_strategy": "semantic"
  }' | jq
```

### Check Service Health

```bash
# Email RAG API
curl -s http://localhost:5156/health | jq

# Entity Integration
curl -s http://localhost:5401/health | jq

# Entity Extraction
curl -s http://localhost:5400/health | jq
```

---

## Key Differences Summary

| Feature | Email RAG v4.0 | ATLAS (OLD) |
|---------|----------------|-------------|
| Email objects | ✅ Full objects in response | ❌ Need ID mapping |
| Sorting | ✅ Pre-sorted by BM25 | ❌ Manual sorting |
| Tier classification | ✅ Done in API | ⚠️ Done in transform |
| BM25 scores | ✅ Included per email | ❌ Not included |
| Entity metrics | ✅ boost, coverage | ❌ Not included |
| Metadata | ✅ Execution timing | ⚠️ Limited |
| Transform complexity | 🟢 Simple (50 lines) | 🟡 Complex (150 lines) |
| Performance | 🟢 Faster | 🟡 Slower (ID mapping) |

---

**Quick Lookup Complete** ✅
**Last Updated:** October 21, 2025 at 22:20 UTC
