# Text-Chat Response Modes Explained

**How the backend responds based on input parameters**

---

## Response Mode Overview

The backend returns different response structures based on:
1. **`ai_bypass`** → Controls AI processing (true = skip AI, false = use AI)
2. **`search_strategy`** → Controls data source (yacht = NAS, email = Outlook)
3. **`selectedModel`** → Sets processing level (air/reach/power)

---

## 1. Search Mode (AIR Model)

**When:** `selectedModel: "air"` → `ai_bypass: true`

**Purpose:** Fast document search without AI analysis

### Response Structure

```json
{
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "all_documents": [
      {
        "display_name": "FURUNO Radar Manual FR-8252",
        "match_ratio": 0.95,
        "best_page": 12,
        "content_preview": "Radar operation procedures...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf"
        },
        "relative_path": "02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf",
        "tier": 1,
        "stars": 5
      }
    ],
    "handover_section": {
      "system": "",
      "fault_code": "",
      "symptoms": "",
      "actions_taken": "",
      "duration": null,
      "linked_doc": ""
    }
  }
}
```

### UI Displays:
- ✅ Document cards with confidence dots
- ✅ "Open Document" button
- ✅ "Add to Handover" button (for yacht/local, not email)
- ❌ No AI summary box
- ❌ No step-by-step solutions

---

## 2. AI Summary Mode (REACH/POWER Models)

**When:** `selectedModel: "reach"` or `"power"` → `ai_bypass: false`

**Purpose:** AI-enhanced search with analysis and summaries

### Response Structure

```json
{
  "success": true,
  "ux_display": "ai_summary",
  "ui_payload": {
    "ai_summary": {
      "headline": "FURUNO FR-8252 Radar Calibration Procedure",
      "confidence": "High",
      "answer": "To calibrate the FURUNO FR-8252 radar system, access the calibration menu via MENU > SETUP > CALIBRATION. The procedure involves adjusting sea clutter, verifying target echo strength, and confirming bearing accuracy.",
      "text": "Full AI analysis text here...",
      "enabled": true
    },
    "primary_solution": {
      "sol_id": "sol_001",
      "display_name": "Radar Calibration Procedure",
      "confidence": 0.92,
      "match_ratio": 0.92,
      "steps": [
        {
          "text": "Access calibration menu via MENU > SETUP > CALIBRATION",
          "type": "normal"
        },
        {
          "text": "Perform sea clutter adjustment",
          "type": "normal"
        },
        {
          "text": "Verify target echo strength",
          "type": "normal"
        }
      ],
      "best_page": 45,
      "links": {
        "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf#page=45"
      }
    },
    "other_solutions": [
      {
        "sol_id": "sol_002",
        "display_name": "Quick Reference Card",
        "match_ratio": 0.78,
        "best_page": 1
      }
    ],
    "all_documents": [
      {
        "display_name": "FURUNO Radar Manual FR-8252",
        "match_ratio": 0.95,
        "best_page": 12
      }
    ],
    "handover_section": {
      "system": "Navigation - Radar",
      "fault_code": "",
      "symptoms": "Radar calibration needed",
      "actions_taken": "Reviewed calibration procedure",
      "duration": null,
      "linked_doc": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf"
    }
  }
}
```

### UI Displays:
- ✅ AI summary box at top (headline + answer)
- ✅ Primary solution card with numbered steps
- ✅ "Other solutions" section (collapsible)
- ✅ "All documents" section at bottom
- ✅ "Add to Handover" button on primary solution
- ✅ Confidence indicators

---

## 3. NAS Search (Yacht Strategy)

**When:** `search_strategy: "yacht"`

**Data Source:** `/Users/celeste7/Documents/yacht-nas/ROOT/`

**Link Format:** HTTP file server URLs

### Example Document Object

```json
{
  "display_name": "FURUNO Radar Manual FR-8252",
  "filename": "FURUNO_Radar_Manual.pdf",
  "path": "/Users/celeste7/Documents/yacht-nas/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf",
  "relative_path": "02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf",
  "links": {
    "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf",
    "pages": [
      {
        "page": 12,
        "url": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf#page=12"
      }
    ]
  },
  "match_ratio": 0.95,
  "best_page": 12,
  "page_count": 3,
  "matching_pages": [12, 15, 18]
}
```

### Characteristics:
- ✅ HTTP URLs to local file server (port 8095)
- ✅ Page-specific links with `#page=N`
- ✅ Handover button visible
- ✅ Works with both AIR and REACH/POWER models

---

## 4. Email Search (Email Strategy)

**When:** `search_strategy: "email"`

**Data Source:** Microsoft Graph API (Outlook emails)

**Link Format:** Email metadata + Outlook URLs

### Example Email Object

```json
{
  "id": "AAMkAGI2NGVhZTExLTI3...",
  "subject": "RE: Yacht Maintenance Contract 2025",
  "sender": {
    "name": "John Smith",
    "email": "john.smith@yachtservice.com"
  },
  "recipients": ["x@alex-short.com"],
  "date": "2025-10-05T14:30:00Z",
  "received_date": "2025-10-05T14:30:15Z",
  "snippet": "Regarding the annual maintenance contract terms...",
  "preview": "Regarding the annual maintenance contract terms, we've updated the pricing structure...",
  "relevanceScore": 0.89,
  "has_attachments": true,
  "attachments": [
    {
      "name": "Contract_2025_v2.pdf",
      "type": "application/pdf",
      "size": 245680
    }
  ],
  "folder": "Inbox",
  "is_read": true,
  "importance": "normal"
}
```

### Characteristics:
- ✅ Email-specific fields (subject, sender, date, snippet)
- ✅ Attachment metadata
- ❌ No "Add to Handover" button
- ✅ "Open in Outlook" button instead
- ⚠️ Requires bearer token (injected by backend proxy)

---

## Mode Combinations Matrix

| Model | Search Strategy | `ai_bypass` | `ux_display` | UI Shows |
|-------|----------------|-------------|--------------|----------|
| AIR | yacht | `true` | `search_mode` | Document cards only |
| AIR | email | `true` | `search_mode` | Email cards only |
| REACH | yacht | `false` | `ai_summary` | AI summary + solutions + docs |
| REACH | email | `false` | `ai_summary` | AI summary + emails |
| POWER | yacht | `false` | `ai_summary` | Deep AI + solutions + docs |
| POWER | email | `false` | `ai_summary` | Deep AI + emails |

---

## Handover Section Behavior

The `handover_section` is **always included** in responses but content varies:

### Empty State (Typical for AIR)
```json
{
  "handover_section": {
    "system": "",
    "fault_code": "",
    "symptoms": "",
    "actions_taken": "",
    "duration": null,
    "linked_doc": ""
  }
}
```

### Pre-populated (Typical for REACH/POWER)
```json
{
  "handover_section": {
    "system": "Navigation - Radar",
    "fault_code": "RAD-42",
    "symptoms": "Intermittent signal loss",
    "actions_taken": "Reviewed calibration procedure",
    "duration": 45,
    "linked_doc": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_Manual.pdf"
  }
}
```

### Button Visibility

| Search Strategy | Handover Button |
|----------------|-----------------|
| `yacht` | ✅ Shown |
| `email` | ❌ Hidden |

**Reason:** Email results are not yacht technical documentation, so handover logs don't apply.

---

## Frontend Mode Detection

**File:** `client/AppFigma.tsx:437-454`

```typescript
const uxDisplay = uiPayload.ux_display || responseData.ux_display;

let mode: 'search' | 'ai' | 'ai_enhanced';
let showAiSummary: boolean;

if (uxDisplay === 'search_mode') {
  mode = 'search';
  showAiSummary = false;
} else if (uxDisplay === 'ai_summary') {
  mode = 'ai_enhanced';
  showAiSummary = true;
} else {
  // Fallback: use old logic
  mode = uiPayload.mode || 'search';
  showAiSummary = uiPayload.show_ai_summary || false;
}
```

---

## Response Time Expectations

| Mode | Search Strategy | Typical Response Time |
|------|----------------|----------------------|
| AIR | yacht | 0.5 - 2 seconds |
| AIR | email | 1 - 3 seconds |
| REACH | yacht | 3 - 8 seconds |
| REACH | email | 4 - 10 seconds |
| POWER | yacht | 8 - 20 seconds |
| POWER | email | 10 - 25 seconds |

**Factors:**
- NAS search: Fast (local filesystem)
- Email search: Slower (API calls to Microsoft Graph)
- AI processing: Adds 2-15 seconds depending on model complexity

---

## Error Handling

### Email Search Requires Token

If `search_strategy: "email"` but no bearer token available:

```json
{
  "success": false,
  "error": "Email search requires Microsoft account connection",
  "error_code": "NO_BEARER_TOKEN",
  "user_action": "Please connect your Microsoft account in Settings"
}
```

### No Results Found

```json
{
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "all_documents": [],
    "message": "No documents found matching your query"
  }
}
```

---

## Testing Checklist

### AIR Model (search_mode)
- [ ] Returns documents without AI summary
- [ ] Shows confidence dots on cards
- [ ] Handover button visible (yacht) or hidden (email)
- [ ] Response time < 3 seconds

### REACH Model (ai_summary)
- [ ] Returns AI summary with headline + answer
- [ ] Shows primary_solution with steps
- [ ] Shows other_solutions list
- [ ] Shows all_documents at bottom
- [ ] Handover section has pre-populated fields

### POWER Model (ai_summary)
- [ ] Deeper analysis than REACH
- [ ] More detailed steps
- [ ] Multiple solution alternatives
- [ ] Higher confidence scores

### NAS Search (yacht)
- [ ] HTTP URLs to localhost:8095
- [ ] Page-specific links work
- [ ] Handover button visible
- [ ] Fast response time

### Email Search (email)
- [ ] Returns email metadata
- [ ] Shows sender, date, snippet
- [ ] Attachments listed if present
- [ ] Handover button hidden
- [ ] "Open in Outlook" button shown

---

**Last Updated:** 2025-10-14
**Related:** `TEXT_CHAT_WEBHOOK_INPUT.md`
