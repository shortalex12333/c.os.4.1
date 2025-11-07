# Search Mode UX Structure - Frontend Integration Guide

## Overview

This document defines the **search_mode** UX structure for CelesteOS webhook responses. The search mode provides a simplified, search-results-only interface without AI analysis or summary boxes.

**Purpose:** When n8n sends `ux_display: "search_mode"`, the frontend displays a clean list of document results with confidence scores, page numbers, and content previews.

**Use Cases:**
- AIR model (search-only, no AI processing)
- Quick document retrieval
- Performance-optimized searches
- Mobile-friendly browsing

---

## Response Structure

### Top-Level Webhook Response (Actual n8n Structure)

```json
{
  "ux_display": "search_mode",
  "ui_payload": {
    "original_input": {
      "query_text": "find em the furuno manual",
      "extracted_entities": {...},
      "user_access": {
        "role": "engineering",
        "allowed_folders": ["02_ENGINEERING"]
      }
    },
    "all_documents": [...]
  }
}
```

### Critical Fields

| Field | Location | Required | Description |
|-------|----------|----------|-------------|
| `ux_display` | **Top level** (not nested) | **YES** | Controls UX mode: `"search_mode"` or `"ai_summary"` |
| `all_documents` | `ui_payload.all_documents[]` | **YES** | Array of all search results (can be 1-50+) |
| `query_text` | `ui_payload.original_input.query_text` | Optional | Original user query for display |

---

## Document Object Structure

Each document in the `all_documents[]` array follows this structure:

### Complete Example (From Actual n8n Response)

```json
{
  "index": 0,
  "source_type": "document",
  "path": "/Users/celeste7/Documents/yacht-nas/ROOT/02_ENGINEERING/generators/OPERATOR MANUALOME44900C_FA170.pdf",
  "filename": "OPERATOR MANUALOME44900C_FA170.pdf",
  "display_name": "OPERATOR MANUALOME44900C FA170",
  "match_ratio": 0.1,
  "relevance_score": 0.1,
  "match_quality": "POOR",
  "quality_score": 0.25,
  "matching_pages": [3, 1, 41],
  "page_count": 3,
  "best_page": 3,
  "entities_found": ["manual"],
  "entity_count": 1,
  "content_preview": "i\nIMPORTANT NOTICES\nGeneral\n• This manual has been authored with simplified grammar, to meet the needs of international users.\n• The operator of this equipment must read and follow the descriptions in this manual. Wrong oper-\nation or maintenance can cancel the warranty or cause injury...",
  "content_full": "...",
  "content_length": 894,
  "tier": 4,
  "display_color": "#ef4444",
  "stars": 1,
  "all_pages": [3, 1, 41],
  "snippet": "i IMPORTANT NOTICES...",
  "original_content": "...",
  "relative_path": "02_ENGINEERING/generators/OPERATOR MANUALOME44900C_FA170.pdf",
  "links": {
    "document": "http://localhost:8095/ROOT/02_ENGINEERING/generators/OPERATOR MANUALOME44900C_FA170.pdf",
    "pages": [
      {
        "page": 3,
        "url": "http://localhost:8095/ROOT/02_ENGINEERING/generators/OPERATOR MANUALOME44900C_FA170.pdf#page=3"
      },
      {
        "page": 1,
        "url": "http://localhost:8095/ROOT/02_ENGINEERING/generators/OPERATOR MANUALOME44900C_FA170.pdf#page=1"
      }
    ]
  },
  "sol_id": "sol_id1",
  "search_sol_id": "search_sol_id1"
}
```

### Field Definitions

#### **Identifiers**

- **`sol_id`** (string, optional)
  - Unique identifier for this solution
  - Format: `"search_sol_001"`, `"search_sol_002"`, etc.
  - Fallback: Auto-generated from array index if missing

- **`display_name`** (string, **REQUIRED**)
  - Human-readable document title
  - Used as card header text
  - Example: `"FURUNO Radar Operator Manual FR-8252"`

- **`filename`** (string, **REQUIRED**)
  - Original PDF filename
  - Fallback if `display_name` is missing
  - Example: `"FURUNO_Radar_FR8252_Manual.pdf"`

#### **Confidence Metrics**

- **`match_ratio`** (number, **REQUIRED**, 0.0-1.0)
  - Primary confidence score
  - Controls colored dot indicator
  - Example: `0.95` = 95% match

- **`relevance_score`** (number, optional, 0.0-1.0)
  - Alternative confidence metric
  - Fallback if `match_ratio` missing
  - Example: `0.89` = 89% relevant

- **`match_quality`** (string, optional)
  - Human-readable quality label
  - Values: `"EXCELLENT"`, `"GOOD"`, `"FAIR"`, `"POOR"`
  - Currently not displayed but useful for debugging

**Confidence Color Mapping:**
```javascript
match_ratio >= 0.8  → 🟢 Green (high confidence)
match_ratio >= 0.6  → 🟡 Yellow (medium confidence)
match_ratio < 0.6   → 🔴 Red (low confidence)
```

#### **Content Fields**

- **`content_preview`** (string, **REQUIRED**)
  - Multi-line text excerpt from the document
  - Shown when card is expanded
  - Supports `\n` newlines
  - Length: 200-500 characters recommended
  - Example:
    ```
    FURUNO Radar System FR-8252

    Operator Instructions

    Chapter 3: Basic Operations...
    ```

- **`snippet`** (string, optional)
  - Short one-line summary
  - Fallback if `content_preview` missing
  - Length: 50-150 characters recommended
  - Example: `"Quick start guide for radar operation..."`

#### **Document References**

- **`best_page`** (number, optional)
  - Most relevant page number in the PDF
  - Displayed as `"p.12"`
  - Example: `12`

- **`links.document`** (string, optional)
  - Direct URL to open the PDF
  - Used by "View Document" button
  - Format: `"http://localhost:8095/ROOT/path/to/file.pdf"`

- **`doc_link`** (string, optional)
  - Fallback if `links.document` missing
  - Same purpose and format

---

## UI Component Mapping

### 1. Card Header (Collapsed State)

**Appears as:**
```
┌──────────────────────────────────────────────────┐
│ FURUNO Radar Operator Manual FR-8252       🟢   │
│ 📄 FURUNO Radar Operator Manual  p.12           │
└──────────────────────────────────────────────────┘
```

**Field Mapping:**
```typescript
Title: solution.display_name || solution.filename
Page:  solution.best_page ? `p.${solution.best_page}` : null
Dot:   solution.match_ratio >= 0.8 ? green : >= 0.6 ? yellow : red
```

### 2. Card Body (Expanded State)

**Appears as:**
```
┌──────────────────────────────────────────────────┐
│ FURUNO Radar Operator Manual FR-8252       🟢   │
│ 📄 FURUNO Radar Operator Manual  p.12           │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ FURUNO Radar System FR-8252              │   │
│ │                                          │   │
│ │ Operator Instructions                    │   │
│ │                                          │   │
│ │ Chapter 3: Basic Operations              │   │
│ │                                          │   │
│ │ 3.1 Power On Sequence                    │   │
│ │ Press the POWER button located on the    │   │
│ │ front panel...                           │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ [Ask AI] [Add to Handover] [View Document →]   │
└──────────────────────────────────────────────────┘
```

**Field Mapping:**
```typescript
Content:       solution.content_preview || solution.snippet || ""
Document Link: solution.links?.document || solution.doc_link
```

### 3. Action Buttons

| Button | Visibility | Action |
|--------|-----------|---------|
| **Ask AI** | Only in `search_mode` | Escalates this result to AI analysis |
| **Add to Handover** | Always | Adds to handover log for crew |
| **View Document →** | Only if `links.document` exists | Opens PDF in new tab |

---

## Complete 15-Solution Example

```json
{
  "ui_payload": {
    "ux_display": "search_mode",
    "query_text": "find me the furuno manual",

    "solutions": [
      {
        "sol_id": "search_sol_001",
        "display_name": "FURUNO Radar Operator Manual FR-8252",
        "filename": "FURUNO_Radar_FR8252_Manual.pdf",
        "best_page": 12,
        "match_ratio": 0.95,
        "relevance_score": 0.95,
        "match_quality": "EXCELLENT",
        "content_preview": "FURUNO Radar System FR-8252\n\nOperator Instructions\n\nChapter 3: Basic Operations...",
        "snippet": "Quick start guide for radar operation",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Radar_FR8252_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_002",
        "display_name": "FURUNO GPS Navigator Manual GP-170",
        "filename": "FURUNO_GPS_GP170_Manual.pdf",
        "best_page": 5,
        "match_ratio": 0.89,
        "content_preview": "GPS Navigator GP-170\n\nInstallation and Setup Guide\n\nSection 2: Initial Configuration...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_GPS_GP170_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_003",
        "display_name": "FURUNO VHF Radio Manual FM-8800S",
        "filename": "FURUNO_VHF_FM8800S_Manual.pdf",
        "best_page": 1,
        "match_ratio": 0.85,
        "content_preview": "VHF Marine Radio FM-8800S\n\nUser Manual\n\nChapter 1: Getting Started...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/communications/FURUNO_VHF_FM8800S_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_004",
        "display_name": "FURUNO Echo Sounder Manual FCV-295",
        "filename": "FURUNO_Echo_Sounder_FCV295.pdf",
        "best_page": 8,
        "match_ratio": 0.82,
        "content_preview": "Fish Finder & Echo Sounder FCV-295\n\nOperation Manual\n\nBasic Operation Procedures...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Echo_Sounder_FCV295.pdf"
        }
      },
      {
        "sol_id": "search_sol_005",
        "display_name": "FURUNO Autopilot Manual NavPilot-711C",
        "filename": "FURUNO_Autopilot_NavPilot711C.pdf",
        "best_page": 15,
        "match_ratio": 0.78,
        "content_preview": "NavPilot-711C Autopilot System\n\nInstallation and Operation\n\nSection 5: Autopilot Modes...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Autopilot_NavPilot711C.pdf"
        }
      },
      {
        "sol_id": "search_sol_006",
        "display_name": "FURUNO AIS Transponder Manual FA-170",
        "filename": "FURUNO_AIS_FA170_Manual.pdf",
        "best_page": 3,
        "match_ratio": 0.75,
        "content_preview": "AIS Transponder FA-170\n\nClass B AIS System\n\nChapter 2: Installation Requirements...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_AIS_FA170_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_007",
        "display_name": "FURUNO Weather Fax Receiver Manual FAX-408",
        "filename": "FURUNO_WeatherFax_FAX408.pdf",
        "best_page": 6,
        "match_ratio": 0.71,
        "content_preview": "Weather Facsimile Recorder FAX-408\n\nOperating Instructions\n\nReceiving Weather Charts...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/communications/FURUNO_WeatherFax_FAX408.pdf"
        }
      },
      {
        "sol_id": "search_sol_008",
        "display_name": "FURUNO ECDIS Manual FMD-3200",
        "filename": "FURUNO_ECDIS_FMD3200_Manual.pdf",
        "best_page": 20,
        "match_ratio": 0.68,
        "content_preview": "Electronic Chart Display & Information System FMD-3200\n\nOperator Manual\n\nChart Management...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_ECDIS_FMD3200_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_009",
        "display_name": "FURUNO Sat Compass Manual SC-130",
        "filename": "FURUNO_SatCompass_SC130.pdf",
        "best_page": 4,
        "match_ratio": 0.65,
        "content_preview": "Satellite Compass SC-130\n\nInstallation & Maintenance Manual\n\nCalibration Procedures...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_SatCompass_SC130.pdf"
        }
      },
      {
        "sol_id": "search_sol_010",
        "display_name": "FURUNO Searchlight Sonar Manual CH-600",
        "filename": "FURUNO_Sonar_CH600_Manual.pdf",
        "best_page": 10,
        "match_ratio": 0.61,
        "content_preview": "Scanning Sonar CH-600\n\nOperation and Maintenance\n\nTarget Detection Settings...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/sonar/FURUNO_Sonar_CH600_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_011",
        "display_name": "FURUNO NavNet TZtouch3 Manual",
        "filename": "FURUNO_NavNet_TZtouch3.pdf",
        "best_page": 1,
        "match_ratio": 0.58,
        "content_preview": "NavNet TZtouch3 Multi-Function Display\n\nQuick Start Guide\n\nTouchscreen Navigation...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_NavNet_TZtouch3.pdf"
        }
      },
      {
        "sol_id": "search_sol_012",
        "display_name": "FURUNO Speed Log Manual DS-80",
        "filename": "FURUNO_SpeedLog_DS80.pdf",
        "best_page": 7,
        "match_ratio": 0.55,
        "content_preview": "Doppler Speed Log DS-80\n\nInstallation Manual\n\nSensor Mounting Requirements...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/sensors/FURUNO_SpeedLog_DS80.pdf"
        }
      },
      {
        "sol_id": "search_sol_013",
        "display_name": "FURUNO Gyrocompass Manual GC-100",
        "filename": "FURUNO_Gyrocompass_GC100.pdf",
        "best_page": 14,
        "match_ratio": 0.52,
        "content_preview": "Gyrocompass GC-100\n\nMaintenance Manual\n\nRoutine Service Procedures...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/navigation/FURUNO_Gyrocompass_GC100.pdf"
        }
      },
      {
        "sol_id": "search_sol_014",
        "display_name": "FURUNO SSAS Manual SS-100",
        "filename": "FURUNO_SSAS_SS100_Manual.pdf",
        "best_page": 2,
        "match_ratio": 0.48,
        "content_preview": "Ship Security Alert System SS-100\n\nSecurity Manual\n\nEmergency Activation Procedures...",
        "links": {
          "document": "http://localhost:8095/ROOT/01_SAFETY/security/FURUNO_SSAS_SS100_Manual.pdf"
        }
      },
      {
        "sol_id": "search_sol_015",
        "display_name": "FURUNO Network Sounder Manual DFF-3D",
        "filename": "FURUNO_NetworkSounder_DFF3D.pdf",
        "best_page": 18,
        "match_ratio": 0.45,
        "content_preview": "DFF-3D Network Sounder\n\n3D Multi-Beam Sonar\n\nAdvanced Imaging Features...",
        "links": {
          "document": "http://localhost:8095/ROOT/02_ENGINEERING/sonar/FURUNO_NetworkSounder_DFF3D.pdf"
        }
      }
    ]
  },

  "webhook_payload": {
    "userId": "user_alex_short",
    "message": "find me the furuno manual",
    "selectedModel": "air",
    "search_strategy": "semantic"
  },

  "success": true
}
```

---

## Frontend Processing Logic

### Step 1: Mode Detection (AppFigma.tsx)

```typescript
// n8n explicitly tells us which UX to display via ux_display field
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
  // Fallback: use old logic if ux_display not provided
  mode = uiPayload.mode || 'search';
  showAiSummary = uiPayload.show_ai_summary || false;
}
```

### Step 2: Solution Array Capture

```typescript
// Build solutions array from multiple possible fields
const solutions = [];

// Check for direct solutions array first (all 15 together)
if (uiPayload.solutions && Array.isArray(uiPayload.solutions)) {
  solutions.push(...uiPayload.solutions);
}
// Otherwise check for primary + other structure
else {
  if (uiPayload.primary_solution) {
    solutions.push(uiPayload.primary_solution);
  }
  if (uiPayload.other_solutions && Array.isArray(uiPayload.other_solutions)) {
    solutions.push(...uiPayload.other_solutions);
  }
}
```

### Step 3: Field Transformation (ChatAreaReal.tsx)

```typescript
solutions={message.solutions.map((sol, idx) => ({
  id: sol.sol_id || sol.search_sol_id || sol.id || `sol_${idx}`,
  title: sol.display_name || sol.filename || sol.title || 'Document',
  confidence: (sol.match_ratio || sol.relevance_score || sol.confidence || 0) >= 0.8
    ? 'high'
    : (sol.match_ratio || sol.relevance_score || sol.confidence || 0) >= 0.6
      ? 'medium'
      : 'low',
  confidenceScore: Math.round((sol.match_ratio || sol.relevance_score || sol.confidence || 0) * 100),
  source: {
    title: sol.display_name || sol.filename || sol.source?.title || 'Document',
    page: sol.best_page || sol.source?.page
  },
  steps: [{
    text: sol.content_preview || sol.snippet || sol.content || '',
    type: 'normal'
  }],
  procedureLink: sol.links?.document || sol.doc_link
}))}
```

---

## Layout Behavior

### Desktop (> 1024px)
- **Stacked vertical cards** (one per row)
- Full document titles visible
- Expanded content shows full `content_preview`
- All action buttons visible

### Mobile (< 768px)
- **Stacked vertical cards** (compressed)
- Document titles truncated with ellipsis
- Content preview scrollable
- Buttons stack vertically

### No Grid Layout
Unlike AI summary mode, search_mode **does not use a grid**. All solutions are displayed as a single-column list regardless of screen size.

---

## Validation Checklist

When building your n8n workflow response, ensure:

- ✅ `ux_display` is set to `"search_mode"`
- ✅ `solutions` is an array with 1-50+ items
- ✅ Each solution has `display_name` or `filename`
- ✅ Each solution has `match_ratio` or `relevance_score` (0.0-1.0)
- ✅ Each solution has `content_preview` or `snippet`
- ✅ `best_page` is a number (not string)
- ✅ `links.document` is a full URL (if provided)

### Common Mistakes

❌ **Wrong:** `"ux_display": "search"`
✅ **Correct:** `"ux_display": "search_mode"`

❌ **Wrong:** `"match_ratio": "0.95"` (string)
✅ **Correct:** `"match_ratio": 0.95` (number)

❌ **Wrong:** `"best_page": "12"` (string)
✅ **Correct:** `"best_page": 12` (number)

❌ **Wrong:** `"solutions": { "primary": {...}, "others": [...] }`
✅ **Correct:** `"solutions": [{...}, {...}, ...]` (flat array)

---

## Testing

### Minimal Test Payload

```json
{
  "ui_payload": {
    "ux_display": "search_mode",
    "solutions": [
      {
        "display_name": "Test Document",
        "filename": "test.pdf",
        "match_ratio": 0.9,
        "content_preview": "This is test content",
        "best_page": 1,
        "links": {
          "document": "http://localhost:8095/ROOT/test.pdf"
        }
      }
    ]
  },
  "success": true
}
```

### Expected Behavior

1. No AI summary boxes appear
2. Single card displays with title "Test Document"
3. Green confidence dot (0.9 = high)
4. Page number shows "p.1"
5. When expanded, shows "This is test content"
6. "Ask AI" button is visible
7. "View Document →" button links to PDF

---

## Related Documentation

- **AI Summary Mode:** See `AI_SUMMARY_MODE_STRUCTURE.md` (not yet created)
- **Field Migration:** See `AISOLUTIONCARD_FIX.md`
- **Webhook Service:** See `client/services/webhookServiceComplete.ts`

---

**Last Updated:** 2025-10-07
**Frontend Version:** Vite 8082, React 18
**Maintained By:** CelesteOS Engineering
