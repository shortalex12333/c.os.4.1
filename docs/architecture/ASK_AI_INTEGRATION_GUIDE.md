# Ask AI Feature - Integration Guide

**Date:** October 27, 2025
**Status:** Frontend Complete - Ready for SearchResults Integration

---

## 🎉 What's Been Completed

### Frontend Components (100% Complete)
- ✅ AskAIDialog.tsx - Modal for user input
- ✅ askAIService.ts - Service layer for N8N webhook
- ✅ All 4 NAS card variants with "Ask AI?" button
- ✅ AIResponseCardLight.tsx - Display AI answers
- ✅ AIResponseCardDark.tsx - Dark mode AI answers
- ✅ CascadeCard.tsx - Updated to support 'ai-response' type

### Backend Design (100% Complete)
- ✅ Simplified 6-node N8N workflow specification
- ✅ Response Transposition node for frontend format
- ✅ Token-aware model selection (7B vs 14B)

---

## 🔌 Integration Steps for SearchResults Component

### Step 1: Import Required Components and Services

```typescript
import AskAIDialog from './dialogs/AskAIDialog';
import { askAIService, AskAIResponse } from '../services/askAIService';
```

### Step 2: Add State Management

```typescript
const [showAskAIDialog, setShowAskAIDialog] = useState(false);
const [isLoadingAI, setIsLoadingAI] = useState(false);
const [selectedCard, setSelectedCard] = useState<any>(null);
const [aiResponses, setAiResponses] = useState<Map<string, any>>(new Map());
```

### Step 3: Implement handleAskAI Function

```typescript
const handleAskAI = (cardData: any, originalQuery: string) => {
  setSelectedCard({ data: cardData, query: originalQuery });
  setShowAskAIDialog(true);
};
```

### Step 4: Implement Dialog Submit Handler

```typescript
const handleDialogSubmit = async (additionalContext: string) => {
  if (!selectedCard) return;

  setIsLoadingAI(true);

  try {
    // Extract document references from card data
    const searchResults = askAIService.extractSearchReferences(selectedCard.data);

    // Call Ask AI service
    const response: AskAIResponse = await askAIService.askAI(
      selectedCard.query,
      additionalContext,
      searchResults,
      {
        user_id: currentUserId, // Get from auth context
        session_id: sessionId,   // Get from session context
        search_strategy: 'yacht' // or 'email' based on search type
      }
    );

    if (response.success && response.ai_response) {
      // Create unique ID for this AI response
      const responseId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Add AI response to state
      setAiResponses(prev => {
        const newResponses = new Map(prev);
        newResponses.set(responseId, {
          id: responseId,
          type: 'ai-response',
          originalQuery: selectedCard.query,
          additionalContext: additionalContext,
          ...response.ai_response
        });
        return newResponses;
      });

      // Optional: Persist to chat history
      // await chatService.saveMessage({
      //   type: 'ai-response',
      //   content: response.ai_response.answer,
      //   metadata: {
      //     model: response.ai_response.model_used,
      //     sources: response.ai_response.sources,
      //     request_id: response.request_id
      //   }
      // });
    } else {
      // Handle error
      console.error('AI request failed:', response.error);
      // Show error toast/notification to user
    }
  } catch (error) {
    console.error('Error calling Ask AI:', error);
    // Show error toast/notification to user
  } finally {
    setIsLoadingAI(false);
    setShowAskAIDialog(false);
    setSelectedCard(null);
  }
};
```

### Step 5: Render CascadeCards with onAskAI Handler

```typescript
// For NAS search results
{searchResults.map((result, index) => (
  <CascadeCard
    key={result.id || index}
    type="nas"
    data={{
      title: result.title,
      description: result.description,
      source: result.source,
      diagnostics: result.diagnostics,
      partsList: result.partsList,
      files: result.files
    }}
    onClose={() => handleRemoveResult(result.id)}
    onAskAI={() => handleAskAI(result, currentSearchQuery)}
    onHelpful={() => handleFeedback(result.id, 'helpful')}
    onNotHelpful={() => handleFeedback(result.id, 'not_helpful')}
  />
))}

{/* Render AI response cards below search results */}
{Array.from(aiResponses.values()).map(aiResponse => (
  <CascadeCard
    key={aiResponse.id}
    type="ai-response"
    data={{
      title: 'AI Analysis',
      answer: aiResponse.answer,
      sources: aiResponse.sources,
      modelUsed: aiResponse.model_used,
      reasoning: aiResponse.reasoning
    }}
    onClose={() => {
      setAiResponses(prev => {
        const newResponses = new Map(prev);
        newResponses.delete(aiResponse.id);
        return newResponses;
      });
    }}
    onHelpful={() => handleAIFeedback(aiResponse.id, 'helpful')}
    onNotHelpful={() => handleAIFeedback(aiResponse.id, 'not_helpful')}
    // NOTE: No onAskAI handler - AI responses cannot trigger "Ask AI?"
  />
))}
```

### Step 6: Render AskAIDialog

```typescript
{showAskAIDialog && selectedCard && (
  <AskAIDialog
    isOpen={showAskAIDialog}
    originalQuery={selectedCard.query}
    onClose={() => {
      setShowAskAIDialog(false);
      setSelectedCard(null);
    }}
    onSubmit={handleDialogSubmit}
    isLoading={isLoadingAI}
  />
)}
```

---

## 🔧 Complete SearchResults Integration Example

```typescript
import React, { useState } from 'react';
import CascadeCard from './CascadeCard';
import AskAIDialog from './dialogs/AskAIDialog';
import { askAIService, AskAIResponse } from '../services/askAIService';

interface SearchResultsProps {
  results: any[];
  currentQuery: string;
  userId: string;
  sessionId: string;
}

export default function SearchResults({
  results,
  currentQuery,
  userId,
  sessionId
}: SearchResultsProps) {
  // State management
  const [showAskAIDialog, setShowAskAIDialog] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [aiResponses, setAiResponses] = useState<Map<string, any>>(new Map());

  // Handle "Ask AI?" button click
  const handleAskAI = (cardData: any, originalQuery: string) => {
    setSelectedCard({ data: cardData, query: originalQuery });
    setShowAskAIDialog(true);
  };

  // Handle dialog submission
  const handleDialogSubmit = async (additionalContext: string) => {
    if (!selectedCard) return;

    setIsLoadingAI(true);

    try {
      const searchResults = askAIService.extractSearchReferences(selectedCard.data);

      const response: AskAIResponse = await askAIService.askAI(
        selectedCard.query,
        additionalContext,
        searchResults,
        {
          user_id: userId,
          session_id: sessionId,
          search_strategy: 'yacht'
        }
      );

      if (response.success && response.ai_response) {
        const responseId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        setAiResponses(prev => {
          const newResponses = new Map(prev);
          newResponses.set(responseId, {
            id: responseId,
            type: 'ai-response',
            originalQuery: selectedCard.query,
            additionalContext: additionalContext,
            ...response.ai_response
          });
          return newResponses;
        });
      } else {
        console.error('AI request failed:', response.error);
      }
    } catch (error) {
      console.error('Error calling Ask AI:', error);
    } finally {
      setIsLoadingAI(false);
      setShowAskAIDialog(false);
      setSelectedCard(null);
    }
  };

  // Feedback handlers
  const handleFeedback = (resultId: string, type: 'helpful' | 'not_helpful') => {
    console.log('Search result feedback:', resultId, type);
    // Implement feedback tracking
  };

  const handleAIFeedback = (responseId: string, type: 'helpful' | 'not_helpful') => {
    console.log('AI response feedback:', responseId, type);
    // Implement AI feedback tracking
  };

  return (
    <div className="search-results-container">
      {/* Search Results */}
      {results.map((result, index) => (
        <CascadeCard
          key={result.id || index}
          type={result.type} // 'nas' or 'email'
          data={result}
          onClose={() => console.log('Close result', result.id)}
          onAskAI={() => handleAskAI(result, currentQuery)}
          onHelpful={() => handleFeedback(result.id, 'helpful')}
          onNotHelpful={() => handleFeedback(result.id, 'not_helpful')}
        />
      ))}

      {/* AI Response Cards */}
      {Array.from(aiResponses.values()).map(aiResponse => (
        <CascadeCard
          key={aiResponse.id}
          type="ai-response"
          data={{
            title: 'AI Analysis',
            answer: aiResponse.answer,
            sources: aiResponse.sources,
            modelUsed: aiResponse.model_used,
            reasoning: aiResponse.reasoning
          }}
          onClose={() => {
            setAiResponses(prev => {
              const newResponses = new Map(prev);
              newResponses.delete(aiResponse.id);
              return newResponses;
            });
          }}
          onHelpful={() => handleAIFeedback(aiResponse.id, 'helpful')}
          onNotHelpful={() => handleAIFeedback(aiResponse.id, 'not_helpful')}
        />
      ))}

      {/* Ask AI Dialog */}
      {showAskAIDialog && selectedCard && (
        <AskAIDialog
          isOpen={showAskAIDialog}
          originalQuery={selectedCard.query}
          onClose={() => {
            setShowAskAIDialog(false);
            setSelectedCard(null);
          }}
          onSubmit={handleDialogSubmit}
          isLoading={isLoadingAI}
        />
      )}
    </div>
  );
}
```

---

## 🚀 N8N Workflow Deployment

### Prerequisites
- N8N running at `http://localhost:5678`
- Ollama running at `http://localhost:11434`
- Models available:
  - `mistral:7b-instruct-v0.3-q4_K_M`
  - `qwen2.5:14b-instruct-q4_K_M`

### Deployment Steps

1. **Open N8N**
   ```bash
   # Ensure N8N is running
   open http://localhost:5678
   ```

2. **Create New Workflow**
   - Click "+ New Workflow"
   - Name it "Ask AI - Search Assistant"

3. **Add 6 Nodes** (see ASK_AI_WORKFLOW_SIMPLIFIED.md for complete code)
   1. Webhook Trigger (`/webhook/ask-ai`)
   2. Token-Aware Context Packer (JavaScript)
   3. Model Router (JavaScript)
   4. Reasoner Prompt Builder (JavaScript)
   5. Call Ollama (HTTP Request)
   6. Response Transposition (JavaScript)

4. **Test Webhook**
   ```bash
   curl -X POST http://localhost:5678/webhook/ask-ai \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What is fuel pressure fault?",
       "original_query": "fuel pressure fault",
       "additional_context": "need troubleshooting steps",
       "search_results": [{
         "doc_name": "MTU 2000 Series Manual",
         "page": 247,
         "relevance_score": 0.89
       }]
     }'
   ```

5. **Verify Response Format**
   Should return:
   ```json
   {
     "success": true,
     "ai_response": {
       "answer": "...",
       "model_used": "qwen2.5:14b-instruct-q4_K_M",
       "reasoning": "Selected 14B model based on query complexity",
       "sources": [...],
       "token_usage": { "total": 5234, "model_tier": "14b" }
     },
     "request_id": "req-...",
     "timestamp": "2025-10-27T..."
   }
   ```

---

## ✅ Testing Checklist

### Frontend Tests
- [ ] Click "Ask AI?" button on NAS card
- [ ] Dialog opens with original query displayed
- [ ] Can type additional context in textarea
- [ ] Enter key submits (Shift+Enter adds new line)
- [ ] Loading state shows during AI processing
- [ ] AI response card appears below search result
- [ ] AI response card has NO "Ask AI?" button
- [ ] Sources are displayed with page numbers
- [ ] Model tier (7B/14B) is shown
- [ ] Feedback buttons work on AI responses
- [ ] Can close AI response cards

### Backend Tests
- [ ] Webhook endpoint accessible at localhost:5678/webhook/ask-ai
- [ ] Token counting works correctly
- [ ] Model selection: <6000 tokens → 7B, ≥6000 tokens → 14B
- [ ] Ollama returns response successfully
- [ ] Response formatted correctly for frontend
- [ ] Error handling works (Ollama down, timeout, etc.)

### Integration Tests
- [ ] Search → Ask AI → Response (full flow)
- [ ] Document references passed correctly
- [ ] Multiple Ask AI requests work
- [ ] Different users can use Ask AI simultaneously
- [ ] AI responses persist in chat history (optional)

---

## 🐛 Troubleshooting

### Issue: Webhook 404 Not Found
**Cause:** N8N workflow not activated or webhook path incorrect
**Fix:**
- Check N8N workflow is active (toggle in top right)
- Verify webhook path is `/webhook/ask-ai`
- Check N8N logs for errors

### Issue: Ollama Connection Failed
**Cause:** Ollama not running or wrong port
**Fix:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

### Issue: Token Count Too High
**Cause:** Too many document chunks passed
**Fix:** Token-Aware Context Packer will automatically trim documents if over budget

### Issue: AI Response Not Displaying
**Cause:** Response format mismatch
**Fix:** Check Response Transposition node output matches frontend expectations

---

## 📊 Expected Performance

| Scenario | Model | Tokens | Response Time |
|----------|-------|--------|---------------|
| Simple query, 1-2 docs | Mistral 7B | <6000 | 2-3 seconds |
| Complex query, 3-5 docs | Qwen 14B | 6000-6500 | 5-8 seconds |
| Error handling | N/A | N/A | <500ms |

---

## 🔐 Security Notes

- Webhook only accessible on localhost (not exposed to internet)
- Rate limiting recommended (max 10 requests/minute per user)
- Document access control: Only pass documents user has access to
- No sensitive data in error messages
- Log all AI requests for audit trail

---

## 📚 Related Documentation

- **ASK_AI_WORKFLOW_SIMPLIFIED.md** - Complete N8N workflow specification
- **ASK_AI_IMPLEMENTATION_PLAN.md** - Full feature specification
- **ASK_AI_SUMMARY.md** - Quick reference guide

---

**Status:** Ready for SearchResults integration and N8N deployment!
