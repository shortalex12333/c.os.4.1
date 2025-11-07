# Document Search UX - Comprehensive Test Plan

**Date:** 2025-10-21
**Changes:** Document RAG Transform + Frontend Cascading + Handover Modal Updates
**Status:** ✅ READY FOR TESTING

---

## Files Modified

### Backend/Transform
```
/Users/celeste7/Documents/NEWSITE/
└── DOCUMENT_RAG_TRANSFORM.js           ✅ CREATED (294 lines)
```

### Frontend
```
/Users/celeste7/Documents/NEWSITE/client/
├── AppFigma.tsx                        ✅ MODIFIED (lines 312-329, 351-357)
├── components/
    ├── HandoverModal.tsx               ✅ MODIFIED (lines 4-26, 34-43)
    └── layout/
        └── ChatAreaReal.tsx            ✅ (No changes - already correct!)
```

---

## Changes Summary

### 1. DOCUMENT_RAG_TRANSFORM.js (NEW FILE)

**What it does:**
- Sorts documents by confidence (high → low)
- Creates cascading structure (primary/other/all/hidden)
- Normalizes fields to match email structure
- Preserves per-document handover_section
- Adds summary metadata

**Key Features:**
```javascript
// Position-based cascading (like Email RAG)
primary_documents: sorted.slice(0, 5)      // Top 5
other_documents: sorted.slice(5, 10)       // Next 5
all_documents: sorted.slice(10, 15)        // Next 5
hidden_results: sorted.slice(15)           // Overflow

// Normalization
{
  id, display_name, match_ratio,
  content_preview, best_page,
  links, handover_section,      // ← Preserved!
  metadata: { ... }
}
```

### 2. AppFigma.tsx (UPDATED)

**Lines 312-329: Cascading Document Structure**

**Before:**
```typescript
// Priority 2: Document RAG structure (all_documents)
else if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
  solutions.push(...uiPayload.all_documents);
}
```

**After:**
```typescript
// Priority 2: Document RAG structure (primary_documents, other_documents, all_documents)
else if (uiPayload.primary_documents && Array.isArray(uiPayload.primary_documents)) {
  solutions.push(...uiPayload.primary_documents);

  // Add other_documents (positions 6-10)
  if (uiPayload.other_documents && Array.isArray(uiPayload.other_documents)) {
    solutions.push(...uiPayload.other_documents);
  }

  // Add all_documents (positions 11-15, lower confidence)
  if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
    solutions.push(...uiPayload.all_documents);
  }
}
// Fallback: Legacy all_documents structure (pre-transform)
else if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
  solutions.push(...uiPayload.all_documents);
}
```

**Lines 351-357: Enhanced Logging**

Added logging for document cascading structure to match email logging.

### 3. HandoverModal.tsx (UPDATED)

**Lines 4-26: Extended EmailData Interface**

Added `handover_section` field to support pre-filled document handover data.

**Lines 34-43: Smart Pre-fill Logic**

**Before:**
```typescript
system: emailData.sender?.name || '',
symptoms: emailData.content_preview || '',
```

**After:**
```typescript
// For documents: Use handover_section if available
// For emails: Extract from sender.name
system: emailData.handover_section?.system || emailData.sender?.name || emailData.display_name || '',
fault_code: emailData.handover_section?.fault_code || '',
symptoms: emailData.handover_section?.symptoms || emailData.content_preview || '',
actions_taken: emailData.handover_section?.actions_taken || '',
duration_minutes: emailData.handover_section?.duration?.toString() || '',
notes: emailData.handover_section?.notes || ''
```

---

## How to Apply

### Step 1: Add Transform to n8n Workflow

1. Open n8n workflow for **Document Search** (`search_strategy=yacht`)
2. Find the node that returns the document search results
3. **Add a new Code/JavaScript node** BEFORE the final response
4. **Name it:** "Document Transform"
5. **Paste contents** of `/Users/celeste7/Documents/NEWSITE/DOCUMENT_RAG_TRANSFORM.js`
6. **Connect:** `[Document RAG API] → [Document Transform] → [Respond to Webhook]`
7. Save and activate workflow

### Step 2: Rebuild Frontend (if needed)

If using Vite dev server with HMR (Hot Module Replacement):
- Frontend will auto-reload changes

If using production build:
```bash
cd /Users/celeste7/Documents/NEWSITE
npm run build   # or yarn build
```

### Step 3: Clear Browser Cache

Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)

---

## Test Scenarios

### Test 1: Single Low Confidence Document (Current Behavior)

**Query:** `"find me the cat 3516c manual"`

**Current Backend Response (No Transform):**
```json
{
  "primary_documents": [],
  "other_documents": [],
  "all_documents": [
    {
      "display_name": "capdf86",
      "match_ratio": 0.024,
      "best_page": 3,
      "content_preview": "...",
      "handover_section": {
        "system": "Port Engine - Manual"
      }
    }
  ]
}
```

**Expected Backend Response (With Transform):**
```json
{
  "primary_documents": [],
  "other_documents": [],
  "all_documents": [
    {
      "id": "sol_id1",
      "display_name": "capdf86",
      "match_ratio": 0.024,
      "best_page": 3,
      "content_preview": "...",
      "handover_section": {
        "system": "Port Engine - Manual"
      }
    }
  ],
  "hidden_results": { "count": 0, "documents": [] },
  "summary": {
    "documents_found": 1,
    "showing": 1,
    "hidden": 0,
    "confidence": 0.024
  }
}
```

**Expected Frontend Display:**
```
Searched 1 document. Showing 0 most relevant, plus 1 other.

More results ▼
  capdf86                                         🔴 p.3

(Click to expand - shows in dropdown because confidence < 60%)
```

**When Expanded:**
```
More results ▼

  ▼ capdf86                                       🔴 p.3

    or the first time and before performing
    maintenance...
    [Truncated content preview]

    [Open document] [Add to Handover]
```

**When "Add to Handover" Clicked:**
```
[Modal Opens]

Email Information:
  Subject: capdf86
  Link: [Open in Browser]

Handover Form:
  System: Port Engine - Manual     ← Pre-filled from handover_section!
  Fault Code: [empty]
  Symptoms: [empty]
  Actions Taken: [empty]
  Duration: [empty]
  Notes: [empty]

  [Cancel] [Add to Handover]
```

**Test Points:**
- ✅ Document shows in "More results" (red dot, confidence < 60%)
- ✅ "Open document" button works
- ✅ "Add to Handover" button appears
- ✅ Handover modal pre-fills "System" from handover_section
- ✅ Handover saves to Supabase

---

### Test 2: Multiple High Confidence Documents

**Query:** `"caterpillar c32 operation manual"`

**Mock Backend Response (With Transform):**
```json
{
  "primary_documents": [
    {
      "display_name": "CAT C32 Operation Manual",
      "match_ratio": 0.95,
      "best_page": 1,
      "content_preview": "Caterpillar C32 Marine Engine...",
      "handover_section": { "system": "Main Engine - C32" }
    },
    {
      "display_name": "C32 Maintenance Guide",
      "match_ratio": 0.88,
      "best_page": 5,
      "content_preview": "Routine maintenance procedures...",
      "handover_section": { "system": "Main Engine - C32" }
    }
  ],
  "other_documents": [],
  "all_documents": [],
  "summary": {
    "documents_found": 2,
    "showing": 2,
    "hidden": 0,
    "confidence": 0.915
  }
}
```

**Expected Frontend Display:**
```
Searched 2 documents.

▼ CAT C32 Operation Manual                        🟢 p.1

  Caterpillar C32 Marine Engine

  Operation and Maintenance Manual

  Chapter 1: Engine Overview...

  [Open document] [Add to Handover]

▼ C32 Maintenance Guide                           🟢 p.5

  Routine maintenance procedures
  for CAT C32 engines...

  [Open document] [Add to Handover]
```

**Test Points:**
- ✅ Both documents show expanded (green dots, confidence >= 80%)
- ✅ Content previews visible
- ✅ Page numbers displayed
- ✅ Both action buttons visible
- ✅ Handover modal pre-fills correctly for each document

---

### Test 3: Mixed Confidence Documents

**Query:** `"generator troubleshooting"`

**Mock Backend Response (With Transform):**
```json
{
  "primary_documents": [
    { "display_name": "Generator Service Manual", "match_ratio": 0.85 }
  ],
  "other_documents": [
    { "display_name": "Generator Parts Catalog", "match_ratio": 0.55 }
  ],
  "all_documents": [
    { "display_name": "General Troubleshooting", "match_ratio": 0.35 }
  ],
  "summary": {
    "documents_found": 3,
    "showing": 3,
    "hidden": 0
  }
}
```

**Expected Frontend Display:**
```
Searched 3 documents.

▼ Generator Service Manual                        🟢 p.12

  [Content expanded by default - high confidence]

  [Open document] [Add to Handover]

> Generator Parts Catalog                         🟡 p.3

  (Collapsed - medium confidence, click to expand)

More results ▼
  General Troubleshooting                         🔴 p.1
```

**Test Points:**
- ✅ High confidence (>= 80%): Expanded with green dot
- ✅ Medium confidence (60-80%): Collapsed with yellow dot
- ✅ Low confidence (< 60%): In "More results" with red dot
- ✅ All documents accessible
- ✅ Handover works for all

---

### Test 4: Large Result Set (15+ Documents)

**Mock Backend Response (With Transform):**
```json
{
  "primary_documents": [ /* 5 docs */ ],
  "other_documents": [ /* 5 docs */ ],
  "all_documents": [ /* 5 docs */ ],
  "hidden_results": {
    "count": 10,
    "documents": [ /* 10 more docs */ ]
  },
  "summary": {
    "documents_found": 25,
    "showing": 15,
    "hidden": 10
  }
}
```

**Expected Frontend Display:**
```
Searched 25 documents. Showing 15, plus 10 more.

▼ [5 high confidence docs - expanded]

> [5 medium confidence docs - collapsed]

More results ▼
  [5 low confidence docs - collapsed]

  (Note: 10 additional documents not shown)
```

**Test Points:**
- ✅ Only shows top 15
- ✅ Summary text accurate ("Showing 15, plus 10 more")
- ✅ Hidden count displayed
- ✅ No performance issues with large result set

---

### Test 5: Handover Modal (Documents vs Emails)

#### Test 5a: Document Handover

**Setup:** Click "Add to Handover" on a document result

**Expected Modal State:**
```
Document Information:
  Subject: CAT C32 Operation Manual
  Link: http://localhost:8095/ROOT/...

Handover Form:
  System: Main Engine - C32          ← Pre-filled from handover_section
  Fault Code: [empty]                ← User fills
  Symptoms: [empty]                  ← User fills
  Actions Taken: [empty]             ← User fills
  Duration: [empty]                  ← User fills
  Notes: [empty]                     ← User fills

  [Cancel] [Add to Handover]
```

#### Test 5b: Email Handover (Comparison)

**Setup:** Click "Add to Handover" on an email result

**Expected Modal State:**
```
Email Information:
  Subject: Your Microsoft invoice G118751505 is ready
  From: Microsoft (billing@microsoft.com)
  Received: 2025-10-21 10:30:00
  Link: https://outlook.office.com/...

Handover Form:
  System: Microsoft                  ← Pre-filled from sender.name
  Fault Code: [empty]
  Symptoms: Sign in to review...     ← Pre-filled from content_preview
  Actions Taken: [empty]
  Duration: [empty]
  Notes: [empty]

  [Cancel] [Add to Handover]
```

**Test Points:**
- ✅ Both emails and documents open the same modal
- ✅ Documents use handover_section for pre-fill
- ✅ Emails use sender.name for pre-fill
- ✅ Content preview used as fallback for symptoms
- ✅ Saving works for both types

---

### Test 6: Document Links

**Setup:** Click "Open document" button

**Expected Behavior:**

**For local documents:**
```
http://localhost:8095/ROOT/02_ENGINEERING/generators/manual.pdf
↓
Opens in new tab with JWT authentication
```

**For documents with page numbers:**
```
http://localhost:8095/ROOT/02_ENGINEERING/generators/manual.pdf#page=12
↓
Opens to page 12 directly
```

**Test Points:**
- ✅ Document opens in new tab
- ✅ JWT authentication works
- ✅ Page anchor (#page=N) works if supported by PDF viewer
- ✅ No "Invalid document path" errors

---

### Test 7: Confidence Indicators (Color Dots)

**Test Matrix:**

| Confidence | Dot Color | Display State | Location |
|-----------|-----------|---------------|----------|
| >= 0.8 | 🟢 Green | Expanded | Main list |
| 0.6 - 0.8 | 🟡 Yellow | Collapsed | Main list |
| < 0.6 | 🔴 Red | Collapsed | "More results" |

**Test Each:**
- ✅ 0.95 → Green dot, expanded
- ✅ 0.75 → Yellow dot, collapsed
- ✅ 0.45 → Red dot, in "More results"
- ✅ 0.024 → Red dot, in "More results" (current example)

---

### Test 8: Empty Results

**Query:** `"nonexistent manual xyz123"`

**Expected Backend Response:**
```json
{
  "primary_documents": [],
  "other_documents": [],
  "all_documents": [],
  "summary": {
    "documents_found": 0,
    "showing": 0,
    "hidden": 0
  }
}
```

**Expected Frontend Display:**
```
Searched 0 documents.

[Empty state message]
"No documents found"
```

**Test Points:**
- ✅ No errors thrown
- ✅ Empty state message displayed
- ✅ No "More results" dropdown shown

---

### Test 9: Transform Error Handling

**Scenario:** Transform fails due to malformed input

**Expected Behavior:**
```json
{
  "success": false,
  "ux_display": "error",
  "error": {
    "type": "transform_error",
    "message": "Failed to transform document search results",
    "details": "[error details]",
    "timestamp": "2025-10-21T..."
  }
}
```

**Test Points:**
- ✅ Error doesn't crash frontend
- ✅ User sees error message
- ✅ Error logged to console
- ✅ Transform error distinguishable from API error

---

### Test 10: Backward Compatibility

**Scenario:** n8n workflow sends old format (no transform)

**Old Format:**
```json
{
  "ui_payload": {
    "all_documents": [...]
  }
}
```

**Expected Behavior:**
- ✅ Frontend fallback handles it (line 327-329 in AppFigma.tsx)
- ✅ Documents still display (may not be sorted)
- ✅ No errors

---

## Console Log Verification

### Expected Console Output (With Transform)

**When document search completes:**

```
[DOCUMENT_TRANSFORM] Input validated
[DOCUMENT_TRANSFORM] Total documents: 1
[DOCUMENT_TRANSFORM] Documents sorted by confidence
[DOCUMENT_TRANSFORM] Cascading complete:
  - Primary: 0
  - Other: 0
  - All (low confidence): 1
  - Hidden: 0
[DOCUMENT_TRANSFORM] ========== TRANSFORMATION COMPLETE ==========
[DOCUMENT_TRANSFORM] Output: 0 primary + 0 other + 1 all + 0 hidden
[DOCUMENT_TRANSFORM] Handover: 0 fields auto-filled
[DOCUMENT_TRANSFORM] =========================================================

✅ Total solutions captured: 1
✅ Solution sources: {
  email_rag: { primary_findings: 0, other_emails: 0, all_emails: 0 },
  document_rag: {
    primary_documents: 0,
    other_documents: 0,
    all_documents: 1,
    solutions: 0
  }
}
```

---

## Success Criteria

### Must Pass:
- ✅ Transform sorts documents by confidence
- ✅ Cascading structure created (primary/other/all/hidden)
- ✅ Frontend displays documents using SimpleSearchList
- ✅ Confidence dots show correct colors
- ✅ "Open document" button works
- ✅ "Add to Handover" button appears and works
- ✅ Handover modal pre-fills from handover_section (documents)
- ✅ Handover modal pre-fills from sender.name (emails)
- ✅ No console errors
- ✅ UX matches email search quality

### Nice to Have:
- ⭐ Page numbers display correctly
- ⭐ Summary metadata shows accurate counts
- ⭐ Large result sets (50+) don't cause performance issues
- ⭐ Mobile responsiveness maintained

---

## Rollback Plan

If issues occur:

### 1. Disable Transform (Quick)
In n8n: Bypass the "Document Transform" node
- Documents will use old format
- UX will revert to previous state (messy but functional)

### 2. Revert Frontend Changes (Medium)
```bash
cd /Users/celeste7/Documents/NEWSITE
git checkout AppFigma.tsx
git checkout client/components/HandoverModal.tsx
npm run build
```

### 3. Full Rollback (Nuclear)
```bash
git revert HEAD~3  # Revert last 3 commits
npm run build
```

---

## Next Steps After Testing

### If Tests Pass ✅
1. Document any edge cases discovered
2. Update DOCUMENT_SEARCH_UX_FIX.md with test results
3. Consider adding unit tests for transform logic
4. Deploy to production

### If Tests Fail ❌
1. Document specific failures
2. Check console logs for errors
3. Verify n8n transform node is active
4. Check network tab for malformed responses
5. Fix issues and re-test

---

## Performance Benchmarks

**Target Response Times:**

| Documents | Transform Time | Total Time | Status |
|-----------|---------------|------------|--------|
| 1-5 | < 50ms | < 2s | ✅ Acceptable |
| 6-15 | < 100ms | < 3s | ✅ Acceptable |
| 16-50 | < 200ms | < 5s | ⚠️ Monitor |
| 51-100 | < 500ms | < 10s | ⚠️ Consider pagination |

**Current Baseline (From User's Example):**
- Documents: 1
- Processing time: 11,253ms (11.2s)
- ⚠️ **SLOW** - This is Document RAG API time, not transform time

**Transform should add < 50ms overhead.**

---

## Documentation

**Created:**
1. `DOCUMENT_RAG_TRANSFORM.js` - Transform file (294 lines)
2. `DOCUMENT_SEARCH_UX_FIX.md` - Problem analysis and solution
3. `DOCUMENT_SEARCH_UX_ANALYSIS.md` - Technical deep dive
4. `DOCUMENT_SEARCH_TEST_PLAN.md` - This file

**To Update After Testing:**
1. `DOCUMENT_SEARCH_UX_FIX.md` - Add test results
2. `README.md` or `CHANGELOG.md` - Version notes

---

**Status:** ✅ READY FOR TESTING

**Estimated Test Time:** 30-45 minutes

**Tester:** User

**Next Review:** After testing completes
