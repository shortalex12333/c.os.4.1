# Text-Chat Webhook Quick Reference

**One-page cheat sheet for the text-chat endpoint**

---

## Endpoint

```
POST /webhook/text-chat
```

---

## Model Selection → Response Mode

| UI Selection | `selectedModel` | `ai_bypass` | Backend Returns |
|--------------|----------------|-------------|-----------------|
| **AIR** (fast) | `"air"` | `true` | `ux_display: "search_mode"` |
| **REACH** (balanced) | `"reach"` | `false` | `ux_display: "ai_summary"` |
| **POWER** (deep) | `"power"` | `false` | `ux_display: "ai_summary"` |

---

## Search Type → Data Source

| UI Label | `search_strategy` | Searches |
|----------|------------------|----------|
| **NAS** | `"yacht"` | Yacht NAS documents at `/yacht-nas/ROOT/` |
| **EMAIL** | `"email"` | Microsoft Outlook via Graph API |

---

## Quick Payload Template

```json
{
  "action": "text_chat",
  "userId": "user_123",
  "userName": "Alex",
  "message": "YOUR QUERY HERE",
  "search_strategy": "yacht",
  "selectedModel": "air",
  "ai_bypass": true,
  "conversation_id": "conversation_1728567890",
  "sessionId": "session_1728567890",
  "timestamp": "2025-10-14T12:30:00Z",
  "source": "celesteos_modern_local_ux",
  "webhookUrl": "http://localhost:5678/webhook/text-chat",
  "executionMode": "production"
}
```

---

## All Combinations

| # | Model | Search | `ai_bypass` | `ux_display` | UI Shows |
|---|-------|--------|-------------|--------------|----------|
| 1 | AIR | yacht | ✅ true | `search_mode` | Doc cards only |
| 2 | AIR | email | ✅ true | `search_mode` | Email cards only |
| 3 | REACH | yacht | ❌ false | `ai_summary` | AI + solutions + docs |
| 4 | REACH | email | ❌ false | `ai_summary` | AI + emails |
| 5 | POWER | yacht | ❌ false | `ai_summary` | Deep AI + docs |
| 6 | POWER | email | ❌ false | `ai_summary` | Deep AI + emails |

---

## Response Structure by Mode

### search_mode (AIR)
```json
{
  "ux_display": "search_mode",
  "ui_payload": {
    "all_documents": [...],
    "handover_section": {...}
  }
}
```

### ai_summary (REACH/POWER)
```json
{
  "ux_display": "ai_summary",
  "ui_payload": {
    "ai_summary": {...},
    "primary_solution": {...},
    "other_solutions": [...],
    "all_documents": [...],
    "handover_section": {...}
  }
}
```

---

## Required Fields Checklist

- ✅ `action` = `"text_chat"`
- ✅ `userId` (string)
- ✅ `userName` (string)
- ✅ `message` (string, min 1 char)
- ✅ `search_strategy` (`"yacht"` or `"email"`)
- ✅ `selectedModel` (`"air"`, `"reach"`, or `"power"`)
- ✅ `ai_bypass` (boolean)
- ✅ `conversation_id` (string)
- ✅ `sessionId` (string)
- ✅ `timestamp` (ISO 8601)

---

## Email Search Special Requirements

**If** `search_strategy: "email"`:

1. ⚠️ Backend proxy must inject bearer token before forwarding to n8n
2. ⚠️ User must have connected Microsoft account
3. ⚠️ Token must not be expired

**Error if missing:**
```json
{
  "success": false,
  "error": "Email search requires Microsoft account connection",
  "error_code": "NO_BEARER_TOKEN"
}
```

---

## Handover Button Rules

| Search Strategy | Show "Add to Handover" Button? |
|----------------|--------------------------------|
| `yacht` | ✅ Yes |
| `email` | ❌ No |

**Reason:** Handover logs are for yacht technical work, not email correspondence.

---

## Response Times (Typical)

| Mode | Search | Response Time |
|------|--------|---------------|
| AIR | yacht | 0.5 - 2s |
| AIR | email | 1 - 3s |
| REACH | yacht | 3 - 8s |
| REACH | email | 4 - 10s |
| POWER | yacht | 8 - 20s |
| POWER | email | 10 - 25s |

---

## Common Mistakes to Avoid

❌ **Sending `email` field** → Not used, use `userId` instead
❌ **Sending `email_integration` object** → Not sent by frontend
❌ **Sending bearer token from frontend** → Security risk, backend injects it
❌ **Wrapping payload in array** → Send as single object
❌ **Wrong enum values** → Must be exact: `"yacht"` not `"nas"`, `"air"` not `"AIR"`

---

## Testing Commands

### Test AIR + Yacht (Fast Search)
```bash
curl -X POST http://localhost:3000/webhook/text-chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text_chat",
    "userId": "test_user",
    "userName": "Test",
    "message": "find furuno manual",
    "search_strategy": "yacht",
    "selectedModel": "air",
    "ai_bypass": true,
    "conversation_id": "test_conv",
    "sessionId": "test_session",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": "test",
    "webhookUrl": "http://localhost:5678/webhook/text-chat",
    "executionMode": "test"
  }'
```

### Test REACH + Yacht (AI Mode)
```bash
curl -X POST http://localhost:3000/webhook/text-chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text_chat",
    "userId": "test_user",
    "userName": "Test",
    "message": "how do I fix the radar?",
    "search_strategy": "yacht",
    "selectedModel": "reach",
    "ai_bypass": false,
    "conversation_id": "test_conv",
    "sessionId": "test_session",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": "test",
    "webhookUrl": "http://localhost:5678/webhook/text-chat",
    "executionMode": "test"
  }'
```

---

## Code References

| File | Lines | Purpose |
|------|-------|---------|
| `client/services/webhookServiceComplete.ts` | 276-333 | Builds request payload |
| `server/routes/webhookRoutesFixed.ts` | 9-70 | Express proxy to n8n |
| `client/config/webhookConfig.ts` | 1-61 | Webhook URL configuration |
| `client/AppFigma.tsx` | 437-454 | Response mode detection |

---

## Debug Checklist

If webhook fails, check:

1. ✅ Is n8n running? (`lsof -i :5678`)
2. ✅ Is Express proxy running? (`lsof -i :3000`)
3. ✅ Is NAS file server running? (`lsof -i :8095`)
4. ✅ For email: Is bearer token valid?
5. ✅ Are all required fields present?
6. ✅ Is `ai_bypass` a boolean, not string?
7. ✅ Is timestamp in ISO 8601 format?
8. ✅ Check browser console for errors
9. ✅ Check n8n execution logs
10. ✅ Check Express proxy logs

---

## Related Documentation

- 📄 `TEXT_CHAT_WEBHOOK_INPUT.md` - Complete request structure
- 📄 `TEXT_CHAT_RESPONSE_MODES.md` - Response formats explained

---

**Last Updated:** 2025-10-14
**Version:** 1.0
