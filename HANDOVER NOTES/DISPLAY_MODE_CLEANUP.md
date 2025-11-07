# Display Mode Cleanup - ai_summary vs search_mode

## Overview
This document explains the cleaned-up implementation for handling two distinct display modes in the text-chat webhook response.

---

## Two Display Modes

### 1. **AI Summary Mode** (`ux_display: 'ai_summary'`)
**When to use:** AI model has analyzed documents and generated insights

**What displays:**
- ✅ AI Summary Box (green box with analysis, findings, gaps, recommendations)
- ✅ Full Solution Cards (AISolutionCard component with expand/collapse, handover forms)
- ✅ Document links and metadata

**Frontend values:**
- `mode: 'ai_enhanced'`
- `show_ai_summary: true`
- `ai_summary: { ... }` (populated)

---

### 2. **Search Mode** (`ux_display: 'search_mode'`)
**When to use:** Simple semantic search without AI analysis

**What displays:**
- ❌ No AI Summary Box
- ✅ Simple search results list
- ✅ Document titles with page numbers
- ✅ "Open document" links
- ✅ Search count summary

**Frontend values:**
- `mode: 'search'`
- `show_ai_summary: false`
- `ai_summary: null`

---

## Implementation Details

### File: `client/AppFigma.tsx` (Lines 324-360)
**Purpose:** Receives webhook response and sets the display mode

```typescript
const uxDisplay = responseData.ux_display || uiPayload.ux_display;

if (uxDisplay === 'search_mode') {
  mode = 'search';
  showAiSummary = false;
} else if (uxDisplay === 'ai_summary') {
  mode = 'ai_enhanced';
  showAiSummary = true;
}

const aiMessage: Message = {
  mode: mode,
  show_ai_summary: showAiSummary,
  ai_summary: showAiSummary ? (uiPayload.ai_summary || null) : null,
  solutions: [...],
  ...
};
```

---

### File: `client/components/layout/ChatAreaReal.tsx` (Lines 228-329)
**Purpose:** Conditionally renders UI based on mode

#### AI Summary Mode Section (Lines 228-284)
```typescript
{message.role === 'assistant' && message.mode !== 'search' && (
  <>
    {/* AI Summary Box */}
    {message.show_ai_summary === true && message.ai_summary && (
      <AISummaryBox data={message.ai_summary} />
    )}

    {/* Full Solution Cards */}
    {message.solutions && message.solutions.length > 0 && (
      <AISolutionCard solutions={...} mode={message.mode} />
    )}
  </>
)}
```

#### Search Mode Section (Lines 286-329)
```typescript
{message.role === 'assistant' && message.mode === 'search' && (
  <div className="mt-4">
    {/* TODO: Replace with SimpleSearchList component
        Currently using AISolutionCard as fallback */}
    <AISolutionCard solutions={...} mode="search" />
  </div>
)}
```

---

## Cleanup Results

### Before Cleanup:
❌ Both modes showed the same component (AISolutionCard)
❌ No clear separation between display modes
❌ AI Summary would show in search mode if present
❌ Hard to understand the flow

### After Cleanup:
✅ Clear conditional blocks for each mode
✅ AI Summary only shows in AI mode (`mode !== 'search'`)
✅ Search mode isolated with clear TODO for custom component
✅ Well-documented with inline comments
✅ Ready for implementing SimpleSearchList component

---

## Implementation Complete ✅

### SimpleSearchList Component
Created `client/components/SimpleSearchList.tsx` with minimalist search results display:

**Features:**
- ✅ Confidence-based filtering (threshold: 0.6)
  - High confidence (>= 0.6): Expanded format with content, buttons
  - Low confidence (< 0.6): Collapsed in "More results" dropdown
- ✅ Expandable items (click to show content + buttons)
- ✅ "Open document" button (if doc_link present)
- ✅ "Add to Handover" button (if onHandover provided)
- ✅ Edge case handling:
  - 0 documents → Empty state
  - Missing fields → Graceful fallbacks
  - Variable text lengths → Truncation at 300 chars
- ✅ Dark mode support
- ✅ Mobile responsive

**Target UX:**
```
Searched 18 documents. Showing 3 most relevant, plus 10 others.

▼ Maintenance Procedures              Page 4, 6, 9
  ├─ Content preview snippet here...
  ├─ [Open document]
  └─ [Add to Handover]

▼ Component Tester Guide              Page 7
  ├─ Content preview...
  ├─ [Open document]
  └─ [Add to Handover]

More results ▶
  HV Battery Removal                  Open
  Diagnostic Instructions             Open
  Battery Pack Data Sheet             Open
```

**Component location:** `client/components/SimpleSearchList.tsx`

**Props interface:**
```typescript
interface SimpleSearchListProps {
  solutions: Solution[];
  isDarkMode?: boolean;
  isMobile?: boolean;
  onHandover?: (solution: Solution) => void;
}
```

**Integration:** ChatAreaReal.tsx (lines 291-313) now uses SimpleSearchList for search mode

---

## Testing the Modes

### Test AI Summary Mode:
1. Send webhook with `ux_display: 'ai_summary'`
2. Verify AI Summary Box appears (green box)
3. Verify full AISolutionCard displays

### Test Search Mode:
1. Send webhook with `ux_display: 'search_mode'`
2. Verify NO AI Summary Box appears
3. Verify simple results list displays (currently fallback to AISolutionCard)

---

## Files Modified
- ✅ `/Users/celeste7/Documents/NEWSITE/client/AppFigma.tsx`
- ✅ `/Users/celeste7/Documents/NEWSITE/client/components/layout/ChatAreaReal.tsx`
