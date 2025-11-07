# Frontend Changes for Email RAG (model=air, search_mode)

## Executive Summary

The Email RAG Pipeline v4.0 now returns a **nested response structure** with entities, handover data, and tiered email results. The frontend needs updates to:
1. Extract email results from the new `primary_findings`, `other_emails`, `all_emails` structure
2. Display handover section (optional)
3. Handle entities in `merged[]` format (already in response, no display changes needed for search_mode)

---

## Current Frontend Flow (Working)

### 1. API Call - `webhookServiceComplete.ts`
```typescript
// Line 298: For model='air', ai_bypass=true (search-only mode)
const ai_bypass = selectedModel === 'air';

// Payload sent to n8n
{
  "userId": "...",
  "message": "what was the last microsoft invoice",
  "selectedModel": "air",
  "ai_bypass": true,  // Search-only for AIR
  "search_strategy": "email"
}
```

### 2. Response Processing - `AppFigma.tsx` (Lines 284-322)
```typescript
const responseData = response.data || {};
const uiPayload = responseData.ui_payload || {};

// CURRENT: Looks for these fields (OLD structure)
const solutions = [];
if (uiPayload.all_documents) {
  solutions.push(...uiPayload.all_documents);
} else if (uiPayload.solutions) {
  solutions.push(...uiPayload.solutions);
}

// Mode detection
const uxDisplay = responseData.ux_display; // 'search_mode' for AIR
const mode = uxDisplay === 'search_mode' ? 'search' : 'ai_enhanced';
```

### 3. Display - `ChatAreaReal.tsx` (Lines 287-313)
```typescript
{message.mode === 'search' && message.solutions && (
  <SimpleSearchList
    solutions={message.solutions.map(sol => ({
      id: sol.id,
      display_name: sol.display_name,
      match_ratio: sol.match_ratio,
      // ... etc
    }))}
  />
)}
```

### 4. Rendering - `SimpleSearchList.tsx`
```typescript
interface Solution {
  id: string;
  display_name?: string;
  match_ratio?: number;
  // ... document-focused fields
  // ❌ NO entity handling
  // ❌ NO handover handling
}
```

---

## New Email RAG Response Structure (from 222.json)

```json
{
  "timestamp": "2025-10-22T01:27:14.670Z",
  "source": "celesteos_modern_local_ux",
  "yacht_id": "default",
  "original_query": "what was the last microsoft invoice\n",

  // ✅ NEW: Entities in merged[] format
  "entities": {
    "merged": [
      {
        "term": "Microsoft",
        "type": "org",
        "final_weight": 1.5,
        "canonical": "MICROSOFT",
        "quality_score": 0.75,
        "metadata": { "is_technical": false }
      }
    ]
  },

  "ux_display": "search_mode",

  // ✅ NEW: ui_payload structure
  "ui_payload": {
    // ✅ NEW: Tiered email results
    "primary_findings": [
      {
        "id": "AAMkAG...",
        "display_name": "Your Microsoft invoice G118751505 is ready",
        "sender": { "name": "Microsoft", "email": "..." },
        "received_date": "2025-10-13T03:13:57Z",
        "content_preview": "Sign in to review...",
        "match_ratio": 2.96,
        "entity_boost": 2,
        "entity_coverage": 1.74,
        "has_attachments": false,
        "tier": 2,
        "search_type": "lexical",
        "links": {
          "document": "https://outlook.office365.com/...",
          "web": "...",
          "desktop": "outlook:message/..."
        },
        "metadata": {
          "matched_entities": [
            {
              "term": "Microsoft",
              "type": "org",
              "weight": 1.5,
              "contribution": 1.64
            }
          ]
        }
      }
    ],

    "other_emails": [],
    "all_emails": [],
    "hidden_results": { "count": 0, "emails": [] },

    // ✅ NEW: Summary with tier info
    "summary": {
      "emails_found": 3,
      "showing": 3,
      "tier": "definitive",
      "confidence": 0.95,
      "emails_searched": 35,
      "pipeline_version": "v4.0-nasrag",
      "execution_time_ms": 1.73
    },

    // ✅ NEW: Handover section (auto-filled)
    "handover_section": {
      "system": "Microsoft",
      "fault_code": "",
      "symptoms": "what was the last microsoft invoice\n",
      "actions_taken": "Searched email correspondence...",
      "duration": null,
      "linked_doc": "https://outlook.office365.com/..."
    },

    // ✅ NEW: Handover intelligence
    "handover_metadata": {
      "auto_filled_count": 2,
      "auto_filled_fields": ["system", "symptoms"],
      "confidence": 0.85,
      "entity_count": 2
    }
  }
}
```

---

## Required Frontend Changes

### ✅ CHANGE 1: AppFigma.tsx - Update Solution Extraction

**File:** `/Users/celeste7/Documents/NEWSITE/client/AppFigma.tsx`
**Lines:** 295-322

**Current Code:**
```typescript
const solutions = [];
if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
  solutions.push(...uiPayload.all_documents);
} else if (uiPayload.solutions && Array.isArray(uiPayload.solutions)) {
  solutions.push(...uiPayload.solutions);
}
```

**New Code:**
```typescript
const solutions = [];

// NEW: Email RAG structure (primary_findings, other_emails, all_emails)
if (uiPayload.primary_findings && Array.isArray(uiPayload.primary_findings)) {
  // Email RAG v4.0 structure
  solutions.push(...uiPayload.primary_findings);

  // Add other_emails (positions 6-10 from solution_emails)
  if (uiPayload.other_emails && Array.isArray(uiPayload.other_emails)) {
    solutions.push(...uiPayload.other_emails);
  }

  // Add all_emails (lower confidence results)
  if (uiPayload.all_emails && Array.isArray(uiPayload.all_emails)) {
    solutions.push(...uiPayload.all_emails);
  }
}
// LEGACY: Document RAG structure (all_documents, solutions)
else if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
  solutions.push(...uiPayload.all_documents);
} else if (uiPayload.solutions && Array.isArray(uiPayload.solutions)) {
  solutions.push(...uiPayload.solutions);
}
// LEGACY: primary + other structure
else {
  if (uiPayload.primary_solution) {
    solutions.push(uiPayload.primary_solution);
  }
  if (uiPayload.other_solutions && Array.isArray(uiPayload.other_solutions)) {
    solutions.push(...uiPayload.other_solutions);
  }
}

console.log('✅ Total solutions captured:', solutions.length);
console.log('✅ Solution sources:', {
  email_rag: {
    primary_findings: uiPayload.primary_findings?.length || 0,
    other_emails: uiPayload.other_emails?.length || 0,
    all_emails: uiPayload.all_emails?.length || 0
  },
  document_rag: {
    all_documents: uiPayload.all_documents?.length || 0,
    solutions: uiPayload.solutions?.length || 0,
    primary_solution: uiPayload.primary_solution ? 1 : 0,
    other_solutions: uiPayload.other_solutions?.length || 0
  }
});
```

**Why:** The new Email RAG structure uses `primary_findings`, `other_emails`, `all_emails` instead of `all_documents` or `solutions`.

---

### ✅ CHANGE 2: ChatAreaReal.tsx - Map Email Fields to Solution Interface

**File:** `/Users/celeste7/Documents/NEWSITE/client/components/layout/ChatAreaReal.tsx`
**Lines:** 291-313

**Current Code:**
```typescript
<SimpleSearchList
  solutions={message.solutions.map((sol, idx) => ({
    id: sol.sol_id || sol.search_sol_id || sol.id || `sol_${idx}`,
    display_name: sol.display_name,
    filename: sol.filename,
    title: sol.title,
    // ... document fields
  }))}
/>
```

**Updated Code:**
```typescript
<SimpleSearchList
  solutions={message.solutions.map((sol, idx) => ({
    // Email IDs vs Document IDs
    id: sol.id || sol.sol_id || sol.search_sol_id || `sol_${idx}`,

    // Email uses display_name (subject), documents use filename/title
    display_name: sol.display_name || sol.subject || sol.filename || sol.title,
    filename: sol.filename, // Only for documents
    title: sol.title,

    // Pages (documents only)
    best_page: sol.best_page,
    all_pages: sol.all_pages || sol.matching_pages,

    // Confidence scoring (different field names)
    match_ratio: sol.match_ratio || sol.relevance_score || sol.confidence,
    relevance_score: sol.relevance_score,
    confidence: sol.confidence,

    // Content preview (both use similar field)
    content_preview: sol.content_preview || sol.snippet,
    snippet: sol.snippet,

    // Links (different structures)
    links: sol.links || {}, // Email has {document, web, desktop}
    doc_link: sol.doc_link || sol.links?.document,

    // NEW: Email-specific fields (optional, for future features)
    sender: sol.sender, // { name, email }
    received_date: sol.received_date,
    has_attachments: sol.hasAttachments || sol.has_attachments,
    entity_boost: sol.entity_boost,
    entity_coverage: sol.entity_coverage,
    search_type: sol.search_type, // "lexical" or "attachment_rescued"

    // Metadata
    metadata: sol.metadata
  }))}
  isDarkMode={isDarkMode}
  isMobile={isMobile}
/>
```

**Why:** Email results have different field names than document results. This mapping ensures backward compatibility while supporting both email and document search.

---

### ✅ CHANGE 3: SimpleSearchList.tsx - Update Solution Interface (Optional Enhancement)

**File:** `/Users/celeste7/Documents/NEWSITE/client/components/SimpleSearchList.tsx`
**Lines:** 6-22

**Current Interface:**
```typescript
interface Solution {
  id: string;
  display_name?: string;
  filename?: string;
  title?: string;
  best_page?: number;
  all_pages?: number[];
  match_ratio?: number;
  relevance_score?: number;
  confidence?: number;
  content_preview?: string;
  snippet?: string;
  links?: { document?: string };
  doc_link?: string;
}
```

**Enhanced Interface (Optional):**
```typescript
interface Solution {
  // Universal fields (both emails and documents)
  id: string;
  display_name?: string;
  match_ratio?: number;
  relevance_score?: number;
  confidence?: number;
  content_preview?: string;
  snippet?: string;
  links?: {
    document?: string;
    web?: string;        // NEW: Email web link
    desktop?: string;    // NEW: Email desktop protocol
  };
  doc_link?: string;

  // Document-specific fields
  filename?: string;
  title?: string;
  best_page?: number;
  all_pages?: number[];

  // Email-specific fields (NEW, optional)
  sender?: {
    name: string;
    email: string;
  };
  received_date?: string;
  has_attachments?: boolean;
  entity_boost?: number;
  entity_coverage?: number;
  search_type?: string; // "lexical" or "attachment_rescued"

  // Metadata
  metadata?: {
    matched_entities?: Array<{
      term: string;
      type: string;
      weight: number;
      contribution: number;
    }>;
    importance?: string;
    is_read?: boolean;
    categories?: string[];
    conversation_id?: string;
  };
}
```

**Optional Display Enhancements:**
```typescript
// Inside SimpleSearchList.tsx rendering logic

// Show sender for emails (line 155-157 area)
<div className="flex items-center gap-2 flex-1 text-left">
  <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
    {title}
  </span>

  {/* NEW: Show sender for emails */}
  {solution.sender && (
    <span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      from {solution.sender.name}
    </span>
  )}
</div>

{/* Show page for documents OR date for emails */}
{pages ? (
  <span className={`text-sm ml-2 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
    {pages}
  </span>
) : solution.received_date ? (
  <span className={`text-sm ml-2 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
    {new Date(solution.received_date).toLocaleDateString()}
  </span>
) : null}
```

**Why:** This makes SimpleSearchList work seamlessly with both email and document results, and adds optional email-specific display features.

---

### 🔄 OPTIONAL CHANGE 4: Display Handover Section

**Option A: Pass to SimpleSearchList (Simpler)**

**File:** `ChatAreaReal.tsx` (Line 293)

```typescript
<SimpleSearchList
  solutions={message.solutions.map(...)}
  handover_section={message.handover_section} // NEW
  isDarkMode={isDarkMode}
  isMobile={isMobile}
/>
```

**File:** `SimpleSearchList.tsx` (Add new prop + display)

```typescript
interface SimpleSearchListProps {
  solutions: Solution[];
  handover_section?: {
    system: string;
    fault_code: string;
    symptoms: string;
    actions_taken: string;
    duration: number | null;
    linked_doc: string;
  };
  isDarkMode?: boolean;
  isMobile?: boolean;
}

// Add handover display BEFORE solutions list (line 114)
{handover_section && (
  <div className={`mb-4 p-4 rounded-lg border ${
    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
  }`}>
    <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      Auto-filled Handover
    </h3>
    <div className="space-y-1 text-sm">
      {handover_section.system && (
        <div><span className="font-medium">System:</span> {handover_section.system}</div>
      )}
      {handover_section.symptoms && (
        <div><span className="font-medium">Symptoms:</span> {handover_section.symptoms}</div>
      )}
      {handover_section.fault_code && (
        <div><span className="font-medium">Fault Code:</span> {handover_section.fault_code}</div>
      )}
    </div>
  </div>
)}
```

**Option B: Use AISolutionCard (Already Has Handover Support)**

The `AISolutionCard` component already has handover support (ChatAreaReal.tsx line 277). For search_mode, you could:

1. Keep using SimpleSearchList for minimalist email list
2. OR switch to AISolutionCard which already handles handover

**File:** `ChatAreaReal.tsx` (Line 291-313)

```typescript
{/* Option: Use AISolutionCard even for search_mode if you want handover display */}
{message.mode === 'search' && message.solutions && message.solutions.length > 0 && (
  <div className="mt-4">
    <AISolutionCard
      solutions={message.solutions.map(...)}
      handover_section={message.handover_section} // Already supported!
      isMobile={isMobile}
      isDarkMode={isDarkMode}
      mode="search" // Simplified mode
      conversationId={message.id}
      queryText={message.content}
    />
  </div>
)}
```

**Why:** AISolutionCard already has full handover display logic built-in.

---

### ❌ NO CHANGE NEEDED: Entity Display

**Entities are already in the response structure** and don't need frontend display changes for `search_mode`:

```typescript
// AppFigma.tsx already creates message with entities
const aiMessage: Message = {
  // ... other fields
  entities: responseData.entities, // ✅ Already captured
  handover_section: uiPayload.handover_section // ✅ Already captured
};
```

**Entities in `merged[]` format** are stored in the message but **not displayed** in search_mode (minimalist design). They could be displayed later if needed:

```typescript
// Future: Display entities in search results
{message.entities?.merged?.map(entity => (
  <span key={entity.term} className="badge">
    {entity.term} ({entity.type})
  </span>
))}
```

---

## Summary of Changes

| File | Change | Priority | Complexity |
|------|--------|----------|------------|
| `AppFigma.tsx` (lines 295-322) | Extract from `primary_findings`, `other_emails`, `all_emails` | **REQUIRED** | Low |
| `ChatAreaReal.tsx` (lines 291-313) | Map email fields to Solution interface | **REQUIRED** | Low |
| `SimpleSearchList.tsx` (interface) | Add email-specific fields to Solution | Optional | Low |
| `SimpleSearchList.tsx` (display) | Show sender, date for emails | Optional | Medium |
| Handover display | Add handover section (Option A or B) | Optional | Low-Medium |

---

## Testing Checklist

After making changes, test with:

1. ✅ **Email search with model=air**
   - Query: "what was the last microsoft invoice"
   - Expected: Shows email results in SimpleSearchList
   - Verify: primary_findings displayed correctly

2. ✅ **Document search with model=air**
   - Query: "generator maintenance manual"
   - Expected: Shows document results (backward compatible)
   - Verify: all_documents still works

3. ✅ **AI mode with model=reach/power**
   - Query: Any query
   - Expected: Shows AISummaryBox + AISolutionCard
   - Verify: Not affected by email changes

4. ✅ **Empty results**
   - Query: "zzzzzz"
   - Expected: "No documents found" message
   - Verify: No errors

5. ✅ **Handover section (if implemented)**
   - Query: Email query
   - Expected: Handover section shows auto-filled fields
   - Verify: System, symptoms populated

---

## Backward Compatibility

All changes maintain **100% backward compatibility** with:
- ✅ Document search (all_documents, solutions)
- ✅ Legacy primary_solution + other_solutions structure
- ✅ AI mode (ai_summary, ai_enhanced)
- ✅ Existing Solution interface

The solution extraction uses **priority cascade**:
1. NEW: `primary_findings` + `other_emails` + `all_emails` (Email RAG)
2. LEGACY: `all_documents` (Document RAG)
3. LEGACY: `solutions` (Generic)
4. LEGACY: `primary_solution` + `other_solutions` (Old structure)

---

## File Locations

```
/Users/celeste7/Documents/NEWSITE/
├── client/
│   ├── AppFigma.tsx                          ← CHANGE 1 (REQUIRED)
│   ├── components/
│   │   ├── layout/
│   │   │   └── ChatAreaReal.tsx              ← CHANGE 2 (REQUIRED)
│   │   └── SimpleSearchList.tsx              ← CHANGE 3 (Optional)
│   └── services/
│       └── webhookServiceComplete.ts         ← No changes needed
└── OUTLOOK_RAG_TRANSFORM.js                  ← Already updated ✅
```

---

## Next Steps

1. **Make required changes** (AppFigma.tsx, ChatAreaReal.tsx)
2. **Test with email search** (model=air, search_strategy=email)
3. **Verify backward compatibility** (document search still works)
4. **Optional enhancements** (SimpleSearchList email display, handover)
5. **Deploy and monitor**
