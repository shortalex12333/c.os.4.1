# Text-Chat Webhook Input Structure

**Endpoint:** `/webhook/text-chat`
**Method:** POST
**Actual Implementation:** `client/services/webhookServiceComplete.ts:276-333`

---

## Complete Request Payload

```json
{
  "action": "text_chat",
  "userId": "user_123",
  "userName": "Alex Short",
  "message": "find furuno radar manual",
  "search_strategy": "yacht",
  "conversation_id": "conversation_1728567890",
  "sessionId": "session_1728567890",
  "selectedModel": "air",
  "ai_bypass": true,
  "timestamp": "2025-10-14T12:30:00.000Z",
  "source": "celesteos_modern_local_ux",
  "client_info": {
    "user_agent": "Mozilla/5.0...",
    "platform": "MacIntel",
    "language": "en-US"
  },
  "webhookUrl": "http://localhost:5678/webhook/text-chat",
  "executionMode": "production"
}
```

---

## Field Definitions

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `action` | string | Always `"text_chat"` | `"text_chat"` |
| `userId` | string | User identifier | `"user_123"` |
| `userName` | string | User's display name | `"Alex Short"` |
| `message` | string | User's query text | `"find furuno manual"` |
| `search_strategy` | string | Where to search: `"yacht"` or `"email"` | `"yacht"` |
| `conversation_id` | string | Conversation tracking ID | `"conversation_1728567890"` |
| `sessionId` | string | Session tracking ID | `"session_1728567890"` |
| `selectedModel` | string | Model: `"air"`, `"reach"`, or `"power"` | `"air"` |
| `ai_bypass` | boolean | Skip AI processing? (true for AIR) | `true` |
| `timestamp` | string | ISO 8601 timestamp | `"2025-10-14T12:30:00.000Z"` |
| `source` | string | Request source identifier | `"celesteos_modern_local_ux"` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `client_info` | object | Browser/platform info | `{"user_agent": "...", "platform": "...", "language": "..."}` |
| `webhookUrl` | string | Target webhook URL | `"http://localhost:5678/webhook/text-chat"` |
| `executionMode` | string | Environment: `"production"` or `"test"` | `"production"` |

---

## Key Parameters Explained

### 1. `selectedModel` (UI Selection)

Determines response mode and AI processing level:

| Model | Description | `ai_bypass` Value | Response Mode |
|-------|-------------|-------------------|---------------|
| `"air"` | Fast search only, no AI | `true` | `search_mode` |
| `"reach"` | Balanced AI analysis | `false` | `ai_summary` |
| `"power"` | Deep AI analysis | `false` | `ai_summary` |

**Code Reference:** `webhookServiceComplete.ts:297-298`
```typescript
const ai_bypass = selectedModel === 'air';
```

### 2. `search_strategy` (Data Source)

Determines where to search for documents:

| Strategy | Description | Data Source |
|----------|-------------|-------------|
| `"yacht"` | Search yacht NAS documents | `/Users/celeste7/Documents/yacht-nas/ROOT/` |
| `"email"` | Search Microsoft Outlook emails | Microsoft Graph API |

**Note:** The frontend shows this as "NAS" in the UI but sends `"yacht"` in the payload.

### 3. `ai_bypass` (Backend Control)

Automatically set based on `selectedModel`:

| Value | Meaning | Backend Behavior |
|-------|---------|------------------|
| `true` | Skip AI processing | Return raw search results only |
| `false` | Enable AI processing | Generate summaries, solutions, analysis |

---

## Request Flow

```
User Interface
    ↓ (selects model + search type)
webhookServiceComplete.ts
    ↓ (builds payload)
Express Proxy (:3000/webhook/text-chat)
    ↓ (forwards to n8n)
n8n (:5678/webhook/text-chat)
    ↓ (processes based on ai_bypass + search_strategy)
Backend Services
    ↓ (returns response)
Frontend (renders based on ux_display)
```

---

## Example Payloads

### Example 1: AIR Model + Yacht Search (Fast Search)

**User Action:** Select AIR model, search NAS for "furuno manual"

```json
{
  "action": "text_chat",
  "userId": "user_123",
  "userName": "Alex Short",
  "message": "find furuno radar manual",
  "search_strategy": "yacht",
  "selectedModel": "air",
  "ai_bypass": true,
  "conversation_id": "conversation_1728567890",
  "sessionId": "session_1728567890",
  "timestamp": "2025-10-14T12:30:00.000Z",
  "source": "celesteos_modern_local_ux",
  "webhookUrl": "http://localhost:5678/webhook/text-chat",
  "executionMode": "production"
}
```

**Expected Response:** `ux_display: "search_mode"` with document list

---

### Example 2: REACH Model + Yacht Search (AI Analysis)

**User Action:** Select REACH model, search NAS for troubleshooting help

```json
{
  "action": "text_chat",
  "userId": "user_123",
  "userName": "Alex Short",
  "message": "how do I calibrate the radar?",
  "search_strategy": "yacht",
  "selectedModel": "reach",
  "ai_bypass": false,
  "conversation_id": "conversation_1728567890",
  "sessionId": "session_1728567890",
  "timestamp": "2025-10-14T12:30:00.000Z",
  "source": "celesteos_modern_local_ux",
  "webhookUrl": "http://localhost:5678/webhook/text-chat",
  "executionMode": "production"
}
```

**Expected Response:** `ux_display: "ai_summary"` with AI analysis + solutions + documents

---

### Example 3: REACH Model + Email Search

**User Action:** Select REACH model, search emails for "contract"

```json
{
  "action": "text_chat",
  "userId": "user_123",
  "userName": "Alex Short",
  "message": "find emails about yacht contract",
  "search_strategy": "email",
  "selectedModel": "reach",
  "ai_bypass": false,
  "conversation_id": "conversation_1728567890",
  "sessionId": "session_1728567890",
  "timestamp": "2025-10-14T12:30:00.000Z",
  "source": "celesteos_modern_local_ux",
  "webhookUrl": "http://localhost:5678/webhook/text-chat",
  "executionMode": "production"
}
```

**Expected Response:** `ux_display: "ai_summary"` or `"email_results"` with email list

**Note:** Email search requires bearer token to be added by backend proxy before reaching n8n.

---

## Important Notes

### ⚠️ What's NOT Sent

The following fields are **NOT** sent by the frontend despite appearing in some old documentation:

- ❌ `email` (standalone field)
- ❌ `user_email`
- ❌ `user_id` (uses `userId` instead)
- ❌ `email_integration` object (not sent in request, only in response)
- ❌ `bearer_token` (added by backend proxy for email searches)

### ✅ Session Tracking

The `conversation_id` and `sessionId` are used for:
- Tracking conversation history
- Linking multiple queries together
- Analytics and logging

Format:
```typescript
conversationId: `conversation_${Date.now()}`
sessionId: `session_${Date.now()}`
```

### 🔄 Model to Mode Mapping

```
selectedModel: "air"    → ai_bypass: true  → Response: search_mode
selectedModel: "reach"  → ai_bypass: false → Response: ai_summary
selectedModel: "power"  → ai_bypass: false → Response: ai_summary
```

---

## Validation Rules

### Backend Must Validate:

1. **Required fields present:**
   - `userId`, `message`, `search_strategy`, `selectedModel`, `conversation_id`, `sessionId`

2. **Valid enum values:**
   - `search_strategy`: Only `"yacht"` or `"email"`
   - `selectedModel`: Only `"air"`, `"reach"`, or `"power"`
   - `ai_bypass`: Must be boolean

3. **Field types:**
   - `userId`, `userName`, `message`: strings (min 1 char)
   - `timestamp`: Valid ISO 8601 format
   - `ai_bypass`: boolean

4. **Email search special case:**
   - If `search_strategy === "email"`, backend must inject bearer token before forwarding to n8n

---

## Related Files

| File | Purpose |
|------|---------|
| `client/services/webhookServiceComplete.ts` | Frontend webhook service (lines 276-333) |
| `server/routes/webhookRoutesFixed.ts` | Express proxy routes (lines 9-70) |
| `client/config/webhookConfig.ts` | Webhook URL configuration |

---

**Last Updated:** 2025-10-14
**Source of Truth:** `webhookServiceComplete.ts:sendTextChat()` method
