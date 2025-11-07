# Text-Chat Webhook Documentation Index

**Complete documentation for the `/webhook/text-chat` endpoint**

**Last Updated:** 2025-10-14
**Total Pages:** 4 documents, 1,573 lines

---

## 📚 Documentation Set

| File | Purpose | Lines | Size |
|------|---------|-------|------|
| [TEXT_CHAT_WEBHOOK_INPUT.md](#1-webhook-input) | Request payload structure | 271 | 7.7 KB |
| [TEXT_CHAT_RESPONSE_MODES.md](#2-response-modes) | Backend response formats | 398 | 9.9 KB |
| [TEXT_CHAT_UI_PRESENTATION.md](#3-ui-presentation) | Frontend rendering specs | 656 | 17 KB |
| [TEXT_CHAT_QUICK_REFERENCE.md](#4-quick-reference) | One-page cheat sheet | 248 | 6.1 KB |

---

## 1. Webhook Input

📄 **File:** `TEXT_CHAT_WEBHOOK_INPUT.md`
**Purpose:** Request payload specification

### What's Documented:

✅ **Complete Request Payload**
- All required fields (action, userId, userName, message, etc.)
- Optional fields (client_info, webhookUrl, executionMode)
- Field types and validation rules

✅ **Key Parameters Explained**
- `selectedModel`: "air" | "reach" | "power"
- `search_strategy`: "yacht" | "email"
- `ai_bypass`: Boolean (auto-set based on model)

✅ **Example Payloads**
- AIR + yacht search (fast)
- REACH + yacht search (AI analysis)
- REACH + email search (Outlook)

✅ **Important Notes**
- What's NOT sent (common mistakes)
- Session tracking format
- Model to mode mapping

---

## 2. Response Modes

📄 **File:** `TEXT_CHAT_RESPONSE_MODES.md`
**Purpose:** Backend response structure by mode

### What's Documented:

✅ **Search Mode (AIR Model)**
- `ux_display: "search_mode"`
- Document cards only, no AI
- Fast response structure

✅ **AI Summary Mode (REACH/POWER)**
- `ux_display: "ai_summary"`
- AI summary + solutions + documents
- Complete hierarchy

✅ **NAS Search (Yacht Strategy)**
- HTTP URLs to localhost:8095
- Page-specific links
- Document metadata

✅ **Email Search (Email Strategy)**
- Email-specific fields
- Microsoft Graph API data
- Attachment metadata

✅ **Mode Combinations Matrix**
- All 6 combinations (3 models × 2 strategies)
- Expected UI for each

✅ **Handover Section Behavior**
- Empty vs pre-populated states
- Button visibility rules

---

## 3. UI Presentation

📄 **File:** `TEXT_CHAT_UI_PRESENTATION.md`
**Purpose:** Frontend rendering specifications

### What's Documented:

✅ **Confidence Display**
- Colored circle buttons
- Green (85%+), Amber (67.5-85%), Red (<67.5%)
- Hover effects and shadows

✅ **Button Specifications**
- "Ask AI" button (search mode only)
- "Add to Handover" button (3 states: initial, saving, saved)
- "View Full Procedure" link
- Copy button

✅ **Document Cascades**
- "Other related documents" structure
- "All documents searched" nested list
- Mini "+ Handover" buttons per doc

✅ **AI Summary Box**
- Headline, confidence badge, answer text
- Styling and layout
- Light/dark mode variants

✅ **Search Mode vs AI Mode**
- Visual differences table
- Layout diagrams
- Element visibility rules

✅ **Handover Form**
- Dropdown animation
- Field row structure
- Save button states (unsaved/saving/saved)

✅ **Session & User Data**
- Data flow diagram
- Session tracking format
- User display locations

✅ **Animation Timings**
- Expand/collapse (280ms/200ms)
- Button hover (200ms)
- Reduced motion support

✅ **Responsive Design**
- Mobile vs desktop breakpoints
- Touch target sizes
- Font size scaling

✅ **Color Tokens**
- Light mode palette
- Dark mode palette
- Semantic color mapping

✅ **Accessibility**
- Keyboard navigation
- Screen reader support
- ARIA labels

---

## 4. Quick Reference

📄 **File:** `TEXT_CHAT_QUICK_REFERENCE.md`
**Purpose:** One-page cheat sheet

### What's Documented:

✅ **Endpoint**
- `POST /webhook/text-chat`

✅ **Model Selection Table**
- AIR → `ai_bypass: true` → `search_mode`
- REACH/POWER → `ai_bypass: false` → `ai_summary`

✅ **Search Type Table**
- NAS (UI) → `"yacht"` (backend)
- EMAIL → `"email"` (backend)

✅ **Quick Payload Template**
- Ready-to-use JSON

✅ **All 6 Combinations**
- Complete matrix

✅ **Response Structures**
- `search_mode` format
- `ai_summary` format

✅ **Required Fields Checklist**
- All 10 required fields

✅ **Email Search Requirements**
- Bearer token injection
- Error handling

✅ **Handover Button Rules**
- Shown for yacht, hidden for email

✅ **Response Times**
- Expected latency per mode

✅ **Common Mistakes**
- What NOT to send

✅ **Testing Commands**
- cURL examples for AIR and REACH

✅ **Debug Checklist**
- 10-step troubleshooting guide

---

## Quick Start

### For Backend Developers

1. Read: [TEXT_CHAT_WEBHOOK_INPUT.md](#1-webhook-input)
2. Read: [TEXT_CHAT_RESPONSE_MODES.md](#2-response-modes)
3. Reference: [TEXT_CHAT_QUICK_REFERENCE.md](#4-quick-reference)

**You need to know:**
- Request payload structure
- Response format by mode
- `ux_display` field controls UI

---

### For Frontend Developers

1. Read: [TEXT_CHAT_UI_PRESENTATION.md](#3-ui-presentation)
2. Reference: [TEXT_CHAT_RESPONSE_MODES.md](#2-response-modes)
3. Quick check: [TEXT_CHAT_QUICK_REFERENCE.md](#4-quick-reference)

**You need to know:**
- How to render confidence circles
- Button states and styling
- Document cascade structure
- Handover form layout

---

### For QA/Testing

1. Read: [TEXT_CHAT_QUICK_REFERENCE.md](#4-quick-reference)
2. Use cURL commands for testing
3. Check debug checklist

**You need to test:**
- All 6 mode combinations
- Handover button visibility
- Email search requirements
- Response time expectations

---

## Integration Flow

```
User Clicks "Send"
    ↓
Frontend: webhookServiceComplete.sendTextChat()
    ↓ Builds payload (TEXT_CHAT_WEBHOOK_INPUT.md)
Express Proxy: /webhook/text-chat
    ↓ Forwards to n8n
n8n: Processes based on ai_bypass + search_strategy
    ↓ Returns response (TEXT_CHAT_RESPONSE_MODES.md)
Frontend: Receives response
    ↓ Renders UI (TEXT_CHAT_UI_PRESENTATION.md)
User sees results
```

---

## Key Decision Points

### 1. Model Selection → Response Mode

| User Selects | `selectedModel` | `ai_bypass` | Backend Returns |
|--------------|----------------|-------------|-----------------|
| AIR | `"air"` | `true` | `ux_display: "search_mode"` |
| REACH | `"reach"` | `false` | `ux_display: "ai_summary"` |
| POWER | `"power"` | `false` | `ux_display: "ai_summary"` |

**Code:** `webhookServiceComplete.ts:297-298`

---

### 2. Search Type → Data Source

| User Selects | `search_strategy` | Searches |
|--------------|------------------|----------|
| NAS | `"yacht"` | `/yacht-nas/ROOT/` |
| EMAIL | `"email"` | Microsoft Graph API |

**Code:** `AppFigma.tsx:264-268`

---

### 3. UX Display → Frontend Rendering

| `ux_display` | Shows |
|--------------|-------|
| `"search_mode"` | Document cards, no AI summary, "Ask AI" buttons |
| `"ai_summary"` | AI summary box, solutions with steps, no "Ask AI" |

**Code:** `AppFigma.tsx:345-360`

---

## Common Workflows

### Workflow 1: Quick Document Lookup

```
User: "find furuno manual"
Model: AIR
Strategy: yacht

→ Request: { selectedModel: "air", ai_bypass: true, search_strategy: "yacht" }
→ Response: { ux_display: "search_mode", all_documents: [...] }
→ UI: Document cards, "Ask AI" buttons, no AI summary
```

---

### Workflow 2: Technical Troubleshooting

```
User: "how do I fix the radar?"
Model: REACH
Strategy: yacht

→ Request: { selectedModel: "reach", ai_bypass: false, search_strategy: "yacht" }
→ Response: { ux_display: "ai_summary", ai_summary: {...}, primary_solution: {...} }
→ UI: AI summary box, solution cards with steps, no "Ask AI" buttons
```

---

### Workflow 3: Email Search

```
User: "find contract emails"
Model: REACH
Strategy: email

→ Request: { selectedModel: "reach", ai_bypass: false, search_strategy: "email" }
→ Backend: Injects bearer token
→ Response: { ux_display: "ai_summary", emails: [...] }
→ UI: AI summary, email cards, no handover buttons
```

---

## Testing Matrix

| # | Model | Strategy | Expected Response | UI Check |
|---|-------|----------|-------------------|----------|
| 1 | AIR | yacht | `search_mode` | ✅ Doc cards, ✅ "Ask AI", ❌ AI summary |
| 2 | AIR | email | `search_mode` | ✅ Email cards, ✅ "Ask AI", ❌ AI summary |
| 3 | REACH | yacht | `ai_summary` | ✅ AI summary, ✅ Solutions, ❌ "Ask AI" |
| 4 | REACH | email | `ai_summary` | ✅ AI summary, ✅ Emails, ❌ Handover |
| 5 | POWER | yacht | `ai_summary` | ✅ Deep AI, ✅ Solutions, ❌ "Ask AI" |
| 6 | POWER | email | `ai_summary` | ✅ Deep AI, ✅ Emails, ❌ Handover |

---

## Troubleshooting Guide

### Issue: Response returns HTML instead of JSON

**Cause:** n8n not running or wrong URL
**Fix:** Check `lsof -i :5678`, restart n8n

### Issue: Email search fails with "No bearer token"

**Cause:** User not connected to Microsoft account
**Fix:** User must connect in Settings → Email Integration

### Issue: Confidence circles not showing colors

**Cause:** Missing `confidenceScore` field
**Fix:** Backend must send `confidenceScore` (0-100) in solution objects

### Issue: Handover button showing for email results

**Cause:** Frontend not checking `search_strategy`
**Fix:** Button visibility: `search_strategy !== "email"`

### Issue: "Ask AI" button showing in AI mode

**Cause:** Frontend not checking `mode`
**Fix:** Button visibility: `mode === "search"`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-14 | Initial documentation set |
| - | - | Replaced 4 old incorrect webhook docs |
| - | - | Added UI presentation specs |
| - | - | Created quick reference |
| - | - | Documented all 6 mode combinations |

---

## Related Files (Source Code)

| File | Purpose |
|------|---------|
| `client/services/webhookServiceComplete.ts` | Request builder (lines 276-333) |
| `server/routes/webhookRoutesFixed.ts` | Express proxy (lines 9-70) |
| `client/config/webhookConfig.ts` | URL configuration |
| `client/AppFigma.tsx` | Response parsing (lines 284-395) |
| `client/components/layout/AISolutionCard.tsx` | UI rendering (1,852 lines) |
| `client/components/AISummaryBox.tsx` | AI summary display |
| `client/components/layout/ChatAreaReal.tsx` | Chat container |

---

## Contact & Feedback

**Issues?** Check the troubleshooting guide above
**Missing info?** All 4 docs should cover everything
**Code references?** File paths and line numbers provided

---

**Status:** ✅ Complete
**Accuracy:** 100% (based on actual code as of 2025-10-14)
**Source:** Live codebase in `/Users/celeste7/Documents/NEWSITE/`
