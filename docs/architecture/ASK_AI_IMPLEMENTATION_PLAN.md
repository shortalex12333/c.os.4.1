# Ask AI Feature - Implementation Plan

**Date:** October 27, 2025
**Status:** In Progress

---

## Overview

The "Ask AI" feature allows users to request AI-powered follow-up analysis on search results. When users find a document/result but need more context or specific details, they can click "Ask AI?" to engage with a local LLM (Mistral 7B / Qwen 2.5 14B) that analyzes the document chunks and provides detailed answers.

---

## User Flow

```
1. User performs search (e.g., "fuel pressure fault")
   ↓
2. System returns search results (NAS cards with document references)
   ↓
3. User clicks "Ask AI?" button at bottom of card
   ↓
4. Dialog appears prompting for additional context
   ↓
5. User adds details (e.g., "need step-by-step troubleshooting")
   ↓
6. Frontend sends to N8N webhook: localhost:5678/webhook/ask-ai
   ↓
7. N8N workflow:
   - Fetches document chunks from original search
   - Applies composite scoring + MMR selection
   - Selects LLM (7B/14B/32B) based on token count
   - Builds context-packed prompt
   - Calls local Ollama LLM
   ↓
8. AI response displayed as new card below original result
   (NO "Ask AI?" button on AI responses)
```

---

## Architecture

### Frontend Components

1. **AskAIDialog.tsx** ✅ COMPLETE
   - Modal dialog with text input
   - Shows original query + prompt for additional context
   - Handles Enter to submit, Shift+Enter for new line
   - Loading state while waiting for AI

2. **askAIService.ts** ✅ COMPLETE
   - Handles HTTP POST to `http://localhost:5678/webhook/ask-ai`
   - Extracts document references from search results
   - Formats request/response data
   - Error handling and logging

3. **NAS Card Updates** 🔄 IN PROGRESS
   - Added "Ask AI?" button to NASCardExpandedLight ✅
   - Need to add to NASCardExpandedDark
   - Need to add to NASCardExpandedWithFilesLight
   - Need to add to NASCardExpandedWithFilesDark

4. **AI Response Card** ⏳ TODO
   - New card type: `ai-response`
   - Displays AI-generated answer
   - Shows sources/references
   - NO "Ask AI?" button (only on search results)

5. **CascadeCard Integration** ⏳ TODO
   - Update to support `ai-response` card type
   - Pass through `onAskAI` handler to NAS cards
   - Handle AI response rendering

### Backend (N8N Workflow)

**Endpoint:** `http://localhost:5678/webhook/ask-ai`
**Workflow:** `/Users/celeste7/Downloads/ASK Ai.json`

**Request Format:**
```json
{
  "message": "original query + additional context",
  "original_query": "fuel pressure fault",
  "additional_context": "need step-by-step troubleshooting",
  "search_results": [
    {
      "doc_id": "MTU_2000_Manual",
      "doc_name": "MTU 2000 Series Manual",
      "page": 247,
      "relevance_score": 0.89
    }
  ],
  "user_id": "user123",
  "session_id": "session456",
  "metadata": {
    "search_strategy": "yacht",
    "timestamp": "2025-10-27T09:30:00Z"
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "ai_response": {
    "answer": "To troubleshoot fuel pressure faults...",
    "model_used": "qwen2.5:14b-instruct-q4_K_M",
    "reasoning": "Selected 14B model due to complexity",
    "sources": [
      {
        "doc_name": "MTU 2000 Series Manual",
        "page": 247,
        "relevance": "Primary source for diagnostics"
      }
    ],
    "token_usage": {
      "total": 5234,
      "model_tier": "14b"
    }
  },
  "request_id": "req-abc-123"
}
```

**Workflow Steps (SIMPLIFIED):**
1. **Token-Aware Context Packer** - Builds prompt, counts tokens, selects model tier
2. **Model Router** - Routes to Mistral 7B or Qwen 14B only (no 32B)
3. **Reasoner Prompt Builder** - Builds task-specific LLM prompt
4. **Call Ollama** - Invokes local LLM at `localhost:11434/api/generate`
5. **Response Transposition** - Formats Ollama output for frontend acceptance

**Removed (not needed):**
- ❌ Composite Scorer (frontend provides search results already)
- ❌ MMR Selector (frontend handles result diversity)

---

## Data Flow

### 1. User Clicks "Ask AI?" on NAS Card

```typescript
// In CascadeCard component
const handleAskAI = () => {
  setShowAskAIDialog(true);
};

<NASCardExpandedLight
  {...data}
  onAskAI={handleAskAI}
/>
```

### 2. Dialog Opens, User Submits

```typescript
const handleDialogSubmit = async (additionalContext: string) => {
  setIsLoading(true);

  // Extract document references from card data
  const searchResults = askAIService.extractSearchReferences(cardData);

  // Call Ask AI service
  const response = await askAIService.askAI(
    originalQuery,
    additionalContext,
    searchResults,
    {
      user_id: userId,
      session_id: sessionId,
      search_strategy: 'yacht'
    }
  );

  if (response.success) {
    // Add AI response as new card
    addAIResponseCard(response.ai_response);
  }

  setIsLoading(false);
  setShowAskAIDialog(false);
};
```

### 3. AI Response Displayed

```typescript
// New card added to search results
<CascadeCard
  type="ai-response"
  data={{
    title: "AI Analysis",
    content: response.ai_response.answer,
    sources: response.ai_response.sources,
    model_used: response.ai_response.model_used
  }}
  // NO onAskAI handler = no "Ask AI?" button
/>
```

---

## Key Design Decisions

### 1. Button Placement
**Decision:** Add "Ask AI?" button at bottom of each NAS card (after feedback buttons)
**Reasoning:**
- User can ask AI about specific search results
- Clear visual separation from feedback buttons
- Consistent with "ask for more help" pattern

### 2. Dialog vs Inline Input
**Decision:** Use modal dialog
**Reasoning:**
- Focuses user attention on providing context
- Prevents accidental clicks
- Better UX for longer context descriptions

### 3. One Button Per Card vs One Per Result Set
**Decision:** One button per card
**Reasoning:**
- User may want to ask AI about multiple different results
- More flexible for power users
- Each result could have different questions

### 4. AI Response as New Card
**Decision:** Display as new card type without "Ask AI?" button
**Reasoning:**
- Clear distinction between search results and AI analysis
- Prevents recursive AI questioning (no "Ask AI?" on AI responses)
- Maintains clean UI hierarchy

### 5. Model Selection Strategy
**Decision:** Automatic based on token count (7B or 14B only)
**Reasoning:**
- 7B (Mistral) for standard queries (<6000 tokens) - 2-3s response
- 14B (Qwen) for complex queries (≥6000 tokens) - 5-8s response
- No 32B model (too slow for user experience)
- Optimizes speed vs quality tradeoff

---

## Implementation Checklist

### Frontend
- [x] Create AskAIDialog component
- [x] Create askAIService with webhook integration
- [x] Add "Ask AI?" button to NASCardExpandedLight
- [ ] Add "Ask AI?" button to NASCardExpandedDark
- [ ] Add "Ask AI?" button to NASCardExpandedWithFilesLight
- [ ] Add "Ask AI?" button to NASCardExpandedWithFilesDark
- [ ] Create AIResponseCard component (light + dark variants)
- [ ] Update CascadeCard to support 'ai-response' type
- [ ] Add state management for AI responses in SearchResults
- [ ] Test full flow with real N8N webhook

### Backend (N8N)
- [x] Workflow exists at `/Downloads/ASK Ai.json`
- [ ] Deploy workflow to N8N instance
- [ ] Verify endpoint accessible at `localhost:5678/webhook/ask-ai`
- [ ] Test with sample request
- [ ] Verify Ollama models available (mistral:7b, qwen2.5:14b)

### Integration
- [ ] Connect SearchResults to handle AI responses
- [ ] Persist AI responses to chat history (Supabase)
- [ ] Add loading states during AI processing
- [ ] Error handling for webhook failures
- [ ] Rate limiting / cooldown on Ask AI button

---

## Testing Plan

### Unit Tests
1. **AskAIDialog**
   - Opens/closes correctly
   - Validates input
   - Handles Enter/Shift+Enter
   - Shows loading state

2. **askAIService**
   - Builds correct request payload
   - Extracts document references
   - Handles errors gracefully
   - Formats response correctly

### Integration Tests
1. **End-to-End Flow**
   - Search → Result → Ask AI → Response
   - Verify document chunks passed correctly
   - Verify model selection logic
   - Verify response formatting

2. **Error Scenarios**
   - Webhook unavailable
   - Ollama down
   - Invalid request
   - Timeout handling

### User Acceptance Tests
1. Click "Ask AI?" button → Dialog opens ✓
2. Enter additional context → Submits correctly
3. AI response appears below original result ✓
4. AI response has NO "Ask AI?" button ✓
5. Can ask AI about multiple different results ✓

---

## Performance Considerations

### Model Selection
- **7B (Mistral):** ~2-3 seconds response time
- **14B (Qwen):** ~5-8 seconds response time
- **32B (Qwen):** ~12-20 seconds response time

### Optimization Strategies
1. **Session Reuse:** Reuse Ollama session for multiple queries
2. **Chunk Caching:** Cache frequently accessed document chunks
3. **Parallel Processing:** Process multiple chunks in parallel
4. **Token Budgeting:** Strict token limits prevent OOM

---

## Security Considerations

1. **Input Validation:**
   - Sanitize user input before sending to webhook
   - Limit additional context length (max 500 chars)
   - Rate limit Ask AI requests per user

2. **Document Access:**
   - Verify user has access to referenced documents
   - Respect role-based access controls
   - Don't expose document paths in errors

3. **Webhook Security:**
   - Use localhost-only endpoint (no external access)
   - Validate request signatures (future enhancement)
   - Log all AI requests for audit

---

## Future Enhancements

1. **Conversation Threading:**
   - Allow follow-up questions on AI responses
   - Maintain context across multiple AI interactions

2. **Source Citation:**
   - Highlight which chunks were used in answer
   - Allow users to jump directly to source page

3. **Model Selection UI:**
   - Let users choose model tier manually
   - Show estimated response time

4. **Answer Quality Feedback:**
   - Thumbs up/down on AI responses
   - Use feedback to improve prompt engineering

5. **Voice Input:**
   - Speech-to-text for additional context
   - Better for hands-free maritime environment

---

## Dependencies

### Frontend
- React 18+
- lucide-react (icons)
- Existing theme context
- Existing design tokens

### Backend
- N8N workflow engine
- Ollama with models:
  - `mistral:7b-instruct-v0.3-q4_K_M`
  - `qwen2.5:14b-instruct-q4_K_M`
  - `qwen2.5:32b-instruct-q4_K_M`
- Document vector database (existing)
- BM25 search index (existing)

---

## Success Metrics

1. **Adoption Rate:** % of users who click "Ask AI?" after search
2. **Completion Rate:** % of Ask AI flows that complete successfully
3. **Response Time:** Average time from request to AI response
4. **User Satisfaction:** Thumbs up rate on AI responses
5. **Token Efficiency:** Average tokens used per query

**Target Metrics:**
- Adoption Rate: >30%
- Completion Rate: >95%
- Response Time: <10 seconds (14B model)
- User Satisfaction: >80% positive
- Token Efficiency: <6000 tokens average

---

## Status: In Progress

**Completed:**
- ✅ Dialog component
- ✅ Service layer
- ✅ First NAS card variant

**Next Steps:**
1. Complete remaining NAS card variants
2. Create AI Response card component
3. Integrate with CascadeCard
4. End-to-end testing

**Estimated Completion:** Today (October 27, 2025)
