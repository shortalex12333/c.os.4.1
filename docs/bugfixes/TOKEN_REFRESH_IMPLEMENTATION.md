# JWT Token Refresh System - Implementation Guide

## Problem Solved

When users reopen old chats, document links contain expired JWT tokens (5 min TTL). This prevents users from accessing documents from previous conversations.

## Solution

Automatic token refresh system that:
1. Detects expired JWT tokens when chat is loaded
2. Creates a new session (or reuses valid one)
3. Generates fresh JWT tokens for all document links
4. Updates chat history with new tokens transparently

---

## Files Created

1. `/client/services/tokenRefreshService.ts` - Core token refresh logic
2. `/client/hooks/useTokenRefresh.ts` - React hooks for easy integration

---

## How It Works

### Flow Diagram

```
User Opens Old Chat
  ↓
Hook: useTokenRefresh loads
  ↓
Check: Any JWT URLs in chat?  → No → Return original chat
  ↓ Yes
Check: Any tokens expired? → No → Return original chat
  ↓ Yes
Extract document paths from JWTs
  ↓
Create/Reuse Session (30 min)
  ↓
Generate fresh JWTs (5 min each)
  ↓
Update chat history with new URLs
  ↓
User can access documents ✅
```

### Token Expiry Detection

```typescript
// Decodes JWT (client-side only for expiry check)
// Checks exp field: Date.now() > (exp - 30 seconds)
// Returns true if expired or invalid
```

### Batch Refresh

```typescript
// Refreshes multiple document links in parallel
// Uses existing documentJWTService for JWT generation
// Maps old URLs → new URLs
// Updates chat history automatically
```

---

## Usage Examples

### Example 1: Chat Component (Automatic)

```tsx
import { useTokenRefresh } from '../hooks/useTokenRefresh';

function ChatView({ chatId, messages, userId, userRole }) {
  // Automatically refreshes expired tokens when chat loads
  const { refreshedHistory, isRefreshing, wasRefreshed } = useTokenRefresh(
    messages,
    {
      userId: userId,
      userRole: userRole || 'chief_engineer',
      enabled: true // Can disable for read-only mode
    }
  );

  if (isRefreshing) {
    return <div>Refreshing document access...</div>;
  }

  return (
    <div>
      {wasRefreshed && (
        <div className="alert">
          Document links have been refreshed for security
        </div>
      )}

      {refreshedHistory.map((message, idx) => (
        <MessageComponent
          key={idx}
          message={message}
          onDocumentClick={(link) => window.open(link.url, '_blank')}
        />
      ))}
    </div>
  );
}
```

### Example 2: Simple Mount-Only Refresh

```tsx
import { useTokenRefreshOnMount } from '../hooks/useTokenRefresh';

function SimpleChatView({ messages, userId }) {
  // Refreshes once on component mount
  const { refreshedHistory, isRefreshing } = useTokenRefreshOnMount(
    messages,
    userId,
    'chief_engineer'
  );

  return (
    <div>
      {refreshedHistory.map(msg => (
        <Message key={msg.id} data={msg} />
      ))}
    </div>
  );
}
```

### Example 3: Manual Refresh Button

```tsx
import { useTokenRefresh } from '../hooks/useTokenRefresh';

function ChatWithRefreshButton({ messages, userId }) {
  const { refreshedHistory, isRefreshing, manualRefresh } = useTokenRefresh(
    messages,
    { userId, enabled: false } // Disabled auto-refresh
  );

  return (
    <div>
      <button onClick={manualRefresh} disabled={isRefreshing}>
        {isRefreshing ? 'Refreshing...' : 'Refresh Document Access'}
      </button>

      <ChatMessages messages={refreshedHistory} />
    </div>
  );
}
```

### Example 4: Programmatic Refresh

```typescript
import { refreshChatTokens } from '../services/tokenRefreshService';

// In any function/component
async function reopenOldChat(chatHistory, userId) {
  const refreshed = await refreshChatTokens(
    chatHistory,
    userId,
    'chief_engineer'
  );

  // Use refreshed chat history
  setChatMessages(refreshed);
}
```

---

## Integration with Existing Chat System

### Supabase Integration Example

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

function ChatHistory({ userId, userRole }) {
  const [chatHistory, setChatHistory] = useState([]);

  // Load chat from Supabase
  useEffect(() => {
    async function loadChat() {
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      setChatHistory(data || []);
    }
    loadChat();
  }, [userId]);

  // Auto-refresh expired tokens
  const { refreshedHistory, wasRefreshed } = useTokenRefresh(
    chatHistory,
    { userId, userRole }
  );

  // Save refreshed chat back to Supabase (optional)
  useEffect(() => {
    if (wasRefreshed && refreshedHistory.length > 0) {
      // Update database with refreshed URLs
      refreshedHistory.forEach(async (message) => {
        if (message.document_links) {
          await supabase
            .from('chat_history')
            .update({ document_links: message.document_links })
            .eq('id', message.id);
        }
      });
    }
  }, [wasRefreshed, refreshedHistory]);

  return (
    <div>
      {refreshedHistory.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

---

## Message Format Expected

The service expects chat messages in this format:

```typescript
interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  document_links?: Array<{
    url: string;           // JWT URL: http://localhost:8098/api/documents/stream/eyJ...
    document_path: string; // Original path: /ROOT/02_ENGINEERING/manual.pdf
    page?: number;         // Optional page number
    title?: string;        // Optional display title
    doc?: string;          // Alternative field for document_path
  }>;
}
```

---

## Backend Service (Already Running)

**Port 8098** - JWT Service (`celeste_real_yacht_security.py`)

### Endpoints Used:
1. **POST `/api/auth/session`** - Create/reuse session
   - Requ: `{crew_id, role}`
   - Resp: `{session_id, expires_in: 1800, allowed_paths}`

2. **POST `/api/documents/request`** - Generate JWT
   - Req: `{session_id, document_path, page_range?}`
   - Resp: `{projection_token, expires_in: 300}`

3. **GET `/api/documents/stream/{jwt}`** - Stream document
   - Returns: PDF binary with security headers

---

## Security Features Maintained

✅ **Device Binding** - JWT tied to device fingerprint
✅ **IP Binding** - JWT tied to IP address
✅ **Role-Based Access** - Document access per user role
✅ **Session Management** - 30 min sessions
✅ **Short-lived JWTs** - 5 min JWT expiry
✅ **Audit Logging** - All access logged

The refresh service maintains all security by:
- Creating new sessions with same role
- Generating fresh JWTs with same security bindings
- Respecting role-based document access
- Not bypassing any security checks

---

## Performance Considerations

### Optimization 1: Parallel Refresh
```typescript
// Refreshes multiple links in parallel
const results = await Promise.all(
  links.map(link => refreshLink(link))
);
```

### Optimization 2: Conditional Refresh
```typescript
// Only refreshes if tokens are actually expired
if (!hasExpiredLinks) {
  return { refreshed: false, chatHistory };
}
```

### Optimization 3: Session Reuse
```typescript
// Reuses active session if valid (30 min TTL)
if (this.sessionId && Date.now() < this.sessionExpiry) {
  return this.sessionId; // No new session needed
}
```

---

## Testing

### Test 1: Expired Token Detection
```typescript
import { tokenRefreshService } from '../services/tokenRefreshService';

// Create expired JWT URL
const expiredUrl = 'http://localhost:8098/api/documents/stream/eyJ...';

// Should return true
const isExpired = tokenRefreshService['isTokenExpired'](expiredUrl);
console.assert(isExpired === true);
```

### Test 2: Document Path Extraction
```typescript
const jwtUrl = 'http://localhost:8098/api/documents/stream/eyJ...';
const path = await tokenRefreshService['extractDocumentPath'](jwtUrl);

console.assert(path === '/ROOT/02_ENGINEERING/manual.pdf');
```

### Test 3: Full Refresh Flow
```typescript
const oldChat = [{
  id: '1',
  text: 'Here are the engine specs',
  document_links: [{
    url: 'http://localhost:8098/api/documents/stream/EXPIRED_JWT',
    document_path: '/ROOT/02_ENGINEERING/engine.pdf'
  }]
}];

const refreshed = await refreshChatTokens(oldChat, 'user123', 'chief_engineer');

// Should have new JWT URL
console.assert(refreshed[0].document_links[0].url !== oldChat[0].document_links[0].url);
console.assert(refreshed[0].document_links[0].refreshed_at !== undefined);
```

---

## Deployment Checklist

- [x] Token refresh service deployed to `/client/services/`
- [x] React hooks deployed to `/client/hooks/`
- [x] JWT service running on port 8098
- [x] Frontend can access port 8098 (CORS configured)
- [ ] User authentication provides userId and userRole
- [ ] Chat messages include document_links field
- [x] Integration tests passing (8/8)
- [ ] Test with old chat (>5 min old) in production
- [ ] Verify tokens refresh automatically
- [ ] Check audit logs show token regeneration

## Integration Testing

Comprehensive integration tests have been created and verified:

- ✅ Test 1: Fresh JWT token creation
- ✅ Test 2: Token expiry detection
- ✅ Test 3: Document path extraction from JWT
- ✅ Test 4: Single document link refresh
- ✅ Test 5: Batch document link refresh (parallel processing)
- ✅ Test 6: Chat history refresh with expired tokens
- ✅ Test 7: Auto-refresh with mixed expired/valid tokens
- ✅ Test 8: Performance test (100 links in <30s)

Run tests: `npx tsx test_token_refresh.ts`

---

## Troubleshooting

### Issue 1: "Could not extract document path"
**Cause:** JWT token format changed or corrupted
**Fix:** Ensure JWT payload includes `document_path` field

### Issue 2: "Session creation failed"
**Cause:** Port 8098 not accessible or invalid role
**Fix:** Check JWT service is running, verify CORS, check role is valid

### Issue 3: Tokens not refreshing
**Cause:** Hook not detecting expiry
**Fix:** Check `isTokenExpired()` logic, verify JWT exp field format

### Issue 4: "Access denied" after refresh
**Cause:** User role doesn't have access to document path
**Fix:** Verify user role matches original access permissions

---

## Future Enhancements

1. **Bulk Refresh Endpoint** - Backend endpoint to refresh multiple tokens at once
2. **Refresh Indicator** - UI indicator showing which links were refreshed
3. **Selective Refresh** - Only refresh links user is likely to click
4. **Background Refresh** - Preemptively refresh tokens before expiry
5. **Token Cache** - Cache tokens to avoid redundant requests

---

## Summary

✅ **Automatic** - Refreshes tokens when chat loads
✅ **Transparent** - User doesn't notice expiry
✅ **Secure** - Maintains all security checks
✅ **Performant** - Batch parallel refresh
✅ **Simple** - One-line integration via hook

**Result:** Users can access documents from old chats regardless of JWT expiry!
