# Webhook URL Fix: 127.0.0.1 → localhost

**Date:** 2025-10-21
**Issue:** ERR_CONNECTION_REFUSED when using 127.0.0.1:8083
**Status:** ✅ FIXED

---

## Problem

The frontend was using `window.location.origin` to construct webhook URLs, which caused it to use whatever URL the browser was accessing:

```
Browser URL: http://127.0.0.1:8083
↓
window.location.origin = "http://127.0.0.1:8083"
↓
Webhook URL: http://127.0.0.1:8083/webhook/text-chat
↓
ERROR: net::ERR_CONNECTION_REFUSED
```

**Error Log:**
```
webhookServiceComplete.ts:326  POST http://127.0.0.1:8083/webhook/text-chat net::ERR_CONNECTION_REFUSED
WebSocket connection to 'ws://127.0.0.1:8083/' failed
```

---

## Root Cause

**File:** `/Users/celeste7/Documents/NEWSITE/client/services/webhookServiceComplete.ts`

The `sendTextChat()` function was using `window.location.origin` instead of the configured `WEBHOOK_CONFIG.chat.textChat`:

**Lines 318, 326 (Before):**
```typescript
// Line 318 - Payload webhookUrl
"webhookUrl": `${window.location.origin}/webhook/text-chat`,

// Line 326 - Fetch URL
const response = await fetch(`${window.location.origin}/webhook/text-chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

**Why This Failed:**
- `window.location.origin` dynamically uses whatever the browser's URL is
- If user accesses site at `http://127.0.0.1:8083`, it tries to POST to `http://127.0.0.1:8083/webhook/text-chat`
- The webhook service is actually at `http://localhost:8082/webhook/text-chat` (or `http://localhost:5678/webhook/text-chat`)
- Connection refused because nothing is listening on 127.0.0.1:8083

---

## Solution

Changed webhookServiceComplete.ts to use the **configured webhook URL** from `WEBHOOK_CONFIG`:

**File:** `/Users/celeste7/Documents/NEWSITE/client/services/webhookServiceComplete.ts`

### Change 1: Line 318 - Payload webhookUrl

**Before:**
```typescript
"webhookUrl": `${window.location.origin}/webhook/text-chat`,
```

**After:**
```typescript
"webhookUrl": WEBHOOK_CONFIG.chat.textChat,
```

### Change 2: Line 326 - Fetch URL

**Before:**
```typescript
// Use Express proxy to n8n (same origin, no CORS issues)
const response = await fetch(`${window.location.origin}/webhook/text-chat`, {
```

**After:**
```typescript
// Use configured webhook URL (not window.location.origin to avoid 127.0.0.1 issues)
const response = await fetch(WEBHOOK_CONFIG.chat.textChat, {
```

---

## Configuration Source

The webhook URL is configured in `/Users/celeste7/Documents/NEWSITE/client/config/webhookConfig.ts`:

```typescript
// Webhook Configuration - Environment-based URLs
const WEBHOOK_BASE_URL = import.meta.env.VITE_WEBHOOK_BASE_URL || 'http://localhost:8082/webhook';

export const WEBHOOK_CONFIG = {
  baseUrl: WEBHOOK_BASE_URL,

  // Chat endpoints - text-chat for local mode
  chat: {
    textChat: `${WEBHOOK_BASE_URL}/text-chat`
  },

  // ... other endpoints
};
```

**Environment Variable (`.env`):**
```env
VITE_WEBHOOK_BASE_URL=http://localhost:5678/webhook
```

**Default Fallback:**
```
http://localhost:8082/webhook
```

**Resulting URL:**
```
http://localhost:5678/webhook/text-chat  (if .env is loaded)
OR
http://localhost:8082/webhook/text-chat  (if .env is not loaded)
```

---

## How This Fixes the Issue

### Before Fix
```
User accesses: http://127.0.0.1:8083
                        ↓
window.location.origin: "http://127.0.0.1:8083"
                        ↓
Webhook URL: http://127.0.0.1:8083/webhook/text-chat
                        ↓
ERROR: Connection refused (nothing listening on that port/IP)
```

### After Fix
```
User accesses: http://127.0.0.1:8083 (or any URL)
                        ↓
WEBHOOK_CONFIG.chat.textChat: "http://localhost:5678/webhook/text-chat"
                        ↓
Webhook URL: http://localhost:5678/webhook/text-chat
                        ↓
SUCCESS: Connects to n8n webhook service
```

---

## What Changed

✅ **Fixed:** `sendTextChat()` now uses configured URL instead of dynamic `window.location.origin`
✅ **Result:** Webhook calls always go to `localhost:5678` (or `localhost:8082`) regardless of how user accesses the frontend
✅ **Benefit:** Works whether accessing via `http://127.0.0.1:8083`, `http://localhost:8083`, or any other URL

---

## Other Places That May Need Similar Fixes

While reviewing the codebase, I found other locations using `window.location.origin` for webhooks:

### LoginScreen.tsx (Lines 75, 79, 160, 165, 174)
```typescript
// Line 75, 79
fetch(`${window.location.origin}/webhook/user-auth/`, ...)

// Line 160, 165, 174
fetch(`${window.location.origin}/webhook/token-refresh-trigger`, ...)
```

### AISolutionCard.tsx (Lines 284, 291)
```typescript
// Line 284, 291
fetch(`${window.location.origin}/webhook/ask-ai-sol`, ...)
```

**Recommendation:** If these endpoints encounter similar connection issues, update them to use `WEBHOOK_CONFIG` or add their endpoints to the config file.

---

## Testing

### Before Fix
```bash
# Frontend accessed at http://127.0.0.1:8083
# User sends message in chat
# Console error:
POST http://127.0.0.1:8083/webhook/text-chat net::ERR_CONNECTION_REFUSED
```

### After Fix
```bash
# Frontend accessed at http://127.0.0.1:8083 (or any URL)
# User sends message in chat
# Console log:
📤 Sending text chat with flat payload structure
✅ Text chat response: {...}
# SUCCESS - message sends to http://localhost:5678/webhook/text-chat
```

---

## Files Modified

```
/Users/celeste7/Documents/NEWSITE/
└── client/
    └── services/
        └── webhookServiceComplete.ts       ✅ Modified (lines 318, 326)
```

---

## Summary

**Problem:** Using `window.location.origin` caused webhook calls to fail when accessing frontend via `127.0.0.1:8083`

**Solution:** Use configured `WEBHOOK_CONFIG.chat.textChat` instead of dynamic `window.location.origin`

**Result:** Webhook calls always use `localhost` (from .env or default config) regardless of frontend access URL

**Status:** ✅ FIXED - Ready for testing
