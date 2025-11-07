# Ask AI - Simplified N8N Workflow

**Endpoint:** `http://localhost:5678/webhook/ask-ai`
**Date:** October 27, 2025

---

## Simplified Flow

```
Webhook Trigger
  ↓
Token-Aware Context Packer (builds prompt, counts tokens)
  ↓
Model Router (7B vs 14B only)
  ↓
Reasoner Prompt Builder (task-specific instructions)
  ↓
Call Ollama
  ↓
Response Transposition (format for frontend)
  ↓
Return JSON
```

**Removed:**
- ❌ Composite Scorer (not needed - we already have search results)
- ❌ MMR Selector (not needed - frontend passes relevant docs)

**Kept:**
- ✅ Token-Aware Context Packer
- ✅ Model Router (simplified: 7B or 14B only)
- ✅ Reasoner Prompt Builder
- ✅ Call Ollama
- ✅ Response Transposition (NEW - formats for frontend)

---

## Node 1: Webhook Trigger

**Type:** Webhook (POST)
**Path:** `/webhook/ask-ai`

**Input:**
```json
{
  "message": "original query + additional context",
  "original_query": "fuel pressure fault",
  "additional_context": "need step-by-step troubleshooting",
  "search_results": [
    {
      "doc_id": "MTU_2000_Manual",
      "doc_name": "MTU 2000 Series Manual",
      "doc_path": "/ROOT/02_ENGINEERING/MTU/manual.pdf",
      "page": 247,
      "chunk_id": "chunk_123",
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

---

## Node 2: Token-Aware Context Packer

**Type:** Code (JavaScript)

```javascript
// TOKEN-AWARE CONTEXT PACKER
// Builds prompt and counts tokens to select appropriate model

const items = [];
const data = $input.first().json;

// Token counting function (rough estimate: 1 token ≈ 4 characters)
function countTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Model token budgets (70% of actual capacity for safety)
const MODEL_BUDGETS = {
  '7b': 6000,   // Mistral 7B
  '14b': 6500   // Qwen 2.5 14B
};

// Extract data from webhook
const originalQuery = data.original_query || '';
const additionalContext = data.additional_context || '';
const searchResults = data.search_results || [];
const message = data.message || '';

// Build query section
const querySection = `User Query: "${originalQuery}"${
  additionalContext ? `\n\nAdditional Details: ${additionalContext}` : ''
}`;

// Build document context from search results
function buildDocumentContext(results) {
  if (!results || results.length === 0) {
    return 'No documents provided.';
  }

  return results.map((result, idx) => {
    const docName = result.doc_name || result.doc_id || 'Unknown Document';
    const page = result.page ? ` (Page ${result.page})` : '';
    const path = result.doc_path || '';

    return `[Document ${idx + 1}: ${docName}${page}]
Path: ${path}
Relevance: ${(result.relevance_score * 100).toFixed(0)}%`;
  }).join('\n\n');
}

const documentContext = buildDocumentContext(searchResults);

// Calculate token usage
const tokenUsage = {
  system_instructions: 300,  // Fixed overhead for system prompt
  query: countTokens(querySection),
  documents: countTokens(documentContext),
  output_reserve: 1000  // Reserve for model output
};

tokenUsage.total = Object.values(tokenUsage).reduce((sum, val) => sum + val, 0);

// Select model tier based on token count
let selectedTier = '7b';
if (tokenUsage.total > MODEL_BUDGETS['7b']) {
  selectedTier = '14b';
}

// If still over budget, trim document context
if (tokenUsage.total > MODEL_BUDGETS[selectedTier]) {
  console.log('⚠️ Over budget, trimming documents...');
  const maxDocs = Math.floor(searchResults.length / 2);
  const trimmedResults = searchResults.slice(0, Math.max(1, maxDocs));
  const trimmedContext = buildDocumentContext(trimmedResults);

  tokenUsage.documents = countTokens(trimmedContext);
  tokenUsage.total = tokenUsage.system_instructions +
                    tokenUsage.query +
                    tokenUsage.documents +
                    tokenUsage.output_reserve;
}

// Build complete context
const packedContext = {
  query: querySection,
  documents: documentContext,
  token_usage: tokenUsage,
  selected_tier: selectedTier,
  search_result_count: searchResults.length
};

items.push({
  json: {
    ...data,
    packed_context: packedContext
  }
});

return items;
```

---

## Node 3: Model Router

**Type:** Code (JavaScript)

```javascript
// MODEL ROUTER - Select between 7B and 14B only

const items = [];
const data = $input.first().json;

const packedContext = data.packed_context || {};
const selectedTier = packedContext.selected_tier || '7b';
const tokenCount = packedContext.token_usage?.total || 0;

// Model configurations
const MODEL_CONFIG = {
  '7b': {
    name: 'mistral:7b-instruct-v0.3-q4_K_M',
    temperature: 0.3,  // Lower for factual responses
    top_p: 0.7,
    top_k: 20,
    repeat_penalty: 1.1,
    num_ctx: 8192
  },
  '14b': {
    name: 'qwen2.5:14b-instruct-q4_K_M',
    temperature: 0.5,  // Slightly higher for complex reasoning
    top_p: 0.8,
    top_k: 30,
    repeat_penalty: 1.05,
    num_ctx: 8192
  }
};

const selectedConfig = MODEL_CONFIG[selectedTier];

console.log(`🤖 Selected ${selectedTier} model (${tokenCount} tokens)`);

items.push({
  json: {
    ...data,
    model_config: {
      tier: selectedTier,
      model_name: selectedConfig.name,
      parameters: selectedConfig,
      routing_reason: tokenCount > 6000 ? 'high_complexity' : 'standard'
    }
  }
});

return items;
```

---

## Node 4: Reasoner Prompt Builder

**Type:** Code (JavaScript)

```javascript
// REASONER PROMPT BUILDER
// Builds task-specific prompt for LLM

const items = [];
const data = $input.first().json;

const packedContext = data.packed_context || {};
const modelConfig = data.model_config || {};

// System instructions
const systemPrompt = `You are a maritime technical assistant specializing in yacht systems and equipment.

Your role:
- Answer questions about yacht equipment, manuals, and troubleshooting
- Provide clear, step-by-step instructions when needed
- Cite specific document names and page numbers
- Be precise with technical specifications

Important:
- Base your answer ONLY on the provided documents
- If information is missing, clearly state that
- Include safety warnings when relevant
- Use professional maritime terminology`;

// User prompt with query and documents
const userPrompt = `${packedContext.query}

AVAILABLE DOCUMENTS:
${packedContext.documents}

Please provide a comprehensive answer based on the documents above. Be specific and cite page numbers when referencing information.`;

// Complete prompt
const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

items.push({
  json: {
    ...data,
    llm_prompt: fullPrompt,
    prompt_metadata: {
      query_tokens: packedContext.token_usage?.query || 0,
      document_tokens: packedContext.token_usage?.documents || 0,
      total_tokens: packedContext.token_usage?.total || 0
    }
  }
});

return items;
```

---

## Node 5: Call Ollama

**Type:** HTTP Request
**Method:** POST
**URL:** `http://localhost:11434/api/generate`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "model": "={{ $json.model_config.model_name }}",
  "prompt": "={{ $json.llm_prompt }}",
  "stream": false,
  "options": {
    "temperature": "={{ $json.model_config.parameters.temperature }}",
    "top_p": "={{ $json.model_config.parameters.top_p }}",
    "top_k": "={{ $json.model_config.parameters.top_k }}",
    "num_ctx": "={{ $json.model_config.parameters.num_ctx }}",
    "repeat_penalty": "={{ $json.model_config.parameters.repeat_penalty }}",
    "stop": ["```", "\n\n\n"]
  }
}
```

**Timeout:** 60000ms (60 seconds)

---

## Node 6: Response Transposition (NEW)

**Type:** Code (JavaScript)

```javascript
// RESPONSE TRANSPOSITION
// Formats Ollama response for frontend consumption

const items = [];
const data = $input.first().json;
const inputData = $input.first().json;

// Extract Ollama response
const ollamaResponse = data.response || '';
const modelUsed = inputData.model_config?.model_name || 'unknown';
const searchResults = inputData.search_results || [];

// Extract sources from search results
const sources = searchResults.map(result => ({
  doc_name: result.doc_name || result.doc_id || 'Unknown',
  page: result.page,
  relevance: result.relevance_score ? `${(result.relevance_score * 100).toFixed(0)}%` : 'N/A'
}));

// Format token usage
const tokenUsage = {
  total: inputData.packed_context?.token_usage?.total || 0,
  model_tier: inputData.model_config?.tier || '7b'
};

// Build frontend-compatible response
const frontendResponse = {
  success: true,
  ai_response: {
    answer: ollamaResponse,
    model_used: modelUsed,
    reasoning: `Selected ${tokenUsage.model_tier.toUpperCase()} model based on query complexity`,
    sources: sources,
    token_usage: tokenUsage
  },
  request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  metadata: {
    original_query: inputData.original_query,
    additional_context: inputData.additional_context,
    search_result_count: searchResults.length
  }
};

items.push({ json: frontendResponse });

return items;
```

**Output Format:**
```json
{
  "success": true,
  "ai_response": {
    "answer": "To troubleshoot fuel pressure faults on MTU engines...",
    "model_used": "qwen2.5:14b-instruct-q4_K_M",
    "reasoning": "Selected 14B model based on query complexity",
    "sources": [
      {
        "doc_name": "MTU 2000 Series Manual",
        "page": 247,
        "relevance": "89%"
      }
    ],
    "token_usage": {
      "total": 5234,
      "model_tier": "14b"
    }
  },
  "request_id": "req-1698765432-abc123",
  "timestamp": "2025-10-27T09:30:45Z",
  "metadata": {
    "original_query": "fuel pressure fault",
    "additional_context": "need step-by-step troubleshooting",
    "search_result_count": 3
  }
}
```

---

## Error Handling

Add error handling nodes after each step:

### Ollama Error Handler
```javascript
// If Ollama fails, return graceful error

const items = [];

items.push({
  json: {
    success: false,
    error: "AI model is currently unavailable. Please try again later.",
    error_code: "OLLAMA_UNAVAILABLE",
    request_id: `req-${Date.now()}`
  }
});

return items;
```

---

## Deployment Steps

1. **Import Workflow to N8N:**
   - Open N8N: `http://localhost:5678`
   - Create new workflow
   - Add nodes in order: Webhook → Context Packer → Model Router → Prompt Builder → Ollama → Transposition

2. **Configure Webhook:**
   - Set path: `/webhook/ask-ai`
   - Method: POST
   - Enable: ON

3. **Test Ollama Connection:**
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "mistral:7b-instruct-v0.3-q4_K_M",
     "prompt": "Test",
     "stream": false
   }'
   ```

4. **Verify Models Available:**
   ```bash
   curl http://localhost:11434/api/tags
   # Should show: mistral:7b-instruct-v0.3-q4_K_M
   #              qwen2.5:14b-instruct-q4_K_M
   ```

5. **Test Webhook:**
   ```bash
   curl -X POST http://localhost:5678/webhook/ask-ai \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What is fuel pressure fault?",
       "original_query": "fuel pressure fault",
       "additional_context": "",
       "search_results": [{
         "doc_name": "Test Manual",
         "page": 100,
         "relevance_score": 0.9
       }]
     }'
   ```

---

## Performance Expectations

| Model | Token Budget | Response Time | Use Case |
|-------|--------------|---------------|----------|
| Mistral 7B | <6000 tokens | 2-3 seconds | Simple queries, quick facts |
| Qwen 2.5 14B | <6500 tokens | 5-8 seconds | Complex troubleshooting, multi-step |

---

## Summary

**Simplified from 7 nodes → 6 nodes:**
1. ✅ Webhook Trigger
2. ✅ Token-Aware Context Packer (counts tokens, selects tier)
3. ✅ Model Router (7B vs 14B only)
4. ✅ Reasoner Prompt Builder (task-specific)
5. ✅ Call Ollama
6. ✅ Response Transposition (NEW - frontend format)

**Removed:**
- ❌ Composite Scorer (redundant - frontend provides search results)
- ❌ MMR Selector (redundant - frontend handles diversity)

**Result:** Faster, simpler workflow focused on the core task: take query + docs → generate AI answer → format for frontend.
