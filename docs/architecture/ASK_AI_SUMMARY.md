# Ask AI Feature - Implementation Summary

**Status:** Ready for Development
**Date:** October 27, 2025

---

## 🎯 What We're Building

An "Ask AI?" button on search result cards that lets users get AI-powered detailed answers using local LLMs.

**User clicks "Ask AI?"** → **Adds context** → **AI analyzes documents** → **Detailed answer appears**

---

## ✅ Completed

### 1. Frontend Components

**AskAIDialog.tsx** - Beautiful modal dialog
- Prompts for additional context
- Shows original query
- Enter to submit, Shift+Enter for new line
- Loading states while AI thinks

**askAIService.ts** - Service layer
- POST to `http://localhost:5678/webhook/ask-ai`
- Extracts document references from cards
- Formats requests/responses
- Error handling

**All NAS Card Variants** - Updated with "Ask AI?" button
- ✅ NASCardExpandedLight.tsx
- ✅ NASCardExpandedDark.tsx
- ✅ NASCardExpandedWithFilesLight.tsx
- ✅ NASCardExpandedWithFilesDark.tsx
- Purple button with ✨ Sparkles icon
- Placed below feedback buttons
- Smooth hover effects

**AI Response Cards** - Display AI-generated answers
- ✅ AIResponseCardLight.tsx
- ✅ AIResponseCardDark.tsx
- "AI Analysis" badge with model tier display
- Shows AI answer with sources
- Lists referenced documents with page numbers
- NO "Ask AI?" button (only on search results)
- Feedback buttons for answer quality

### 2. Simplified N8N Workflow Design

**6-Node Flow:**
1. Webhook Trigger (`/webhook/ask-ai`)
2. Token-Aware Context Packer (counts tokens, selects model)
3. Model Router (7B vs 14B only)
4. Reasoner Prompt Builder (task-specific instructions)
5. Call Ollama (`localhost:11434`)
6. **Response Transposition** (formats for frontend)

**What We Removed:**
- ❌ Composite Scorer (not needed - frontend provides results)
- ❌ MMR Selector (not needed - frontend handles diversity)

---

## 🔄 In Progress

- [ ] Integrate Ask AI with SearchResults component
- [ ] Implement N8N workflow (6 nodes)

---

## ⏳ TODO

1. **SearchResults Integration**
   - Add state management for AI response cards
   - Implement handleAskAI function
   - Show AskAIDialog when button clicked
   - Call askAIService and display response

3. **Implement N8N Workflow**
   - Build 6-node workflow in N8N
   - Test with Ollama
   - Verify response format

4. **End-to-End Testing**
   - Search → Ask AI → Response
   - Error handling
   - Loading states

---

## 📊 Simplified Workflow

```
┌─────────────────────────────────────────────────┐
│  Frontend: User clicks "Ask AI?"                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Dialog: User adds context                     │
│  "I need step-by-step instructions"            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  POST http://localhost:5678/webhook/ask-ai     │
│  {                                              │
│    original_query: "fuel pressure fault",      │
│    additional_context: "step-by-step",         │
│    search_results: [ ... docs ... ]            │
│  }                                              │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  N8N Workflow                                   │
│                                                 │
│  1. Token Counter: 5234 tokens → Use 14B      │
│  2. Model Router: qwen2.5:14b selected         │
│  3. Prompt Builder: Task-specific instructions │
│  4. Ollama Call: Generate answer               │
│  5. Transposition: Format for frontend         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Response                                       │
│  {                                              │
│    success: true,                               │
│    ai_response: {                               │
│      answer: "To troubleshoot...",             │
│      model_used: "qwen2.5:14b",                │
│      sources: [ ... ],                          │
│      token_usage: { total: 5234 }              │
│    }                                            │
│  }                                              │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Display AI Response Card            │
│  (Below original search result)                │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Complete Card Variants** (10 minutes)
   - Add button to 3 remaining NAS card variants

2. **Create AI Response Card** (30 minutes)
   - Light + Dark variants
   - Display answer, sources, model info
   - No "Ask AI?" button

3. **Build N8N Workflow** (20 minutes)
   - 6 nodes as specified
   - Test with sample data

4. **Integration** (30 minutes)
   - Wire up CascadeCard
   - Add state management
   - Test end-to-end

**Total Estimated Time:** ~90 minutes

---

## 📝 Key Files

**Created:**
- `/client/components/dialogs/AskAIDialog.tsx` ✅
- `/client/services/askAIService.ts` ✅
- `/client/components/ux/AIResponseCardLight.tsx` ✅
- `/client/components/ux/AIResponseCardDark.tsx` ✅
- `/ASK_AI_WORKFLOW_SIMPLIFIED.md` (N8N workflow spec) ✅
- `/ASK_AI_IMPLEMENTATION_PLAN.md` (full plan) ✅
- `/ASK_AI_INTEGRATION_GUIDE.md` (integration guide) ✅

**Modified:**
- `/client/components/ux/NASCardExpandedLight.tsx` ✅
- `/client/components/ux/NASCardExpandedDark.tsx` ✅
- `/client/components/ux/NASCardExpandedWithFilesLight.tsx` ✅
- `/client/components/ux/NASCardExpandedWithFilesDark.tsx` ✅
- `/client/components/CascadeCard.tsx` ✅ (added ai-response type, onAskAI handler)

**TODO:**
- Integrate with SearchResults.tsx (see ASK_AI_INTEGRATION_GUIDE.md)
- Deploy N8N workflow (see ASK_AI_WORKFLOW_SIMPLIFIED.md)
- End-to-end testing

---

## 🎨 Design Specs

**"Ask AI?" Button:**
- Color: Purple (#7C3AED)
- Background: Light purple (#F5F3FF)
- Icon: Sparkles (✨)
- Border: 2px solid purple
- Shadow: Subtle purple glow
- Placement: Below feedback buttons, with top border divider

**AI Response Card:**
- Similar to NAS card but distinct styling
- Shows "AI Analysis" badge
- Lists sources with page numbers
- Shows model used (7B/14B)
- NO "Ask AI?" button

---

## 🔧 Model Selection Logic

```
Token Count < 6000 tokens
  ↓
  Use Mistral 7B (2-3 seconds)
  
Token Count ≥ 6000 tokens
  ↓
  Use Qwen 2.5 14B (5-8 seconds)
```

**No 32B model** - too slow for user experience

---

## ✨ Success Criteria

- [x] User can click "Ask AI?" on search results
- [x] Dialog opens and accepts additional context
- [ ] Request sent to N8N webhook correctly
- [ ] AI response formatted properly
- [ ] Response displays in new card below original
- [ ] AI response has NO "Ask AI?" button
- [ ] Loading states work smoothly
- [ ] Errors handled gracefully

---

## 📚 Documentation

**Full Details:** `ASK_AI_IMPLEMENTATION_PLAN.md`
**Workflow Guide:** `ASK_AI_WORKFLOW_SIMPLIFIED.md`
**This Summary:** `ASK_AI_SUMMARY.md`

---

**Ready to proceed with implementation!**
