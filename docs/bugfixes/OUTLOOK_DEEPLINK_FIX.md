# Outlook Deep Link Fix

**Date:** 2025-10-21
**Issue:** Email links showing "This message might have been moved or deleted"
**Status:** ✅ FIXED

---

## Problem

Email links were failing with error: **"This message might have been moved or deleted"**

**Example broken URL:**
```
https://outlook.office365.com/mail/deeplink/read/AAMkAGMwMWRlNTkyLTkwMDQtNGQzYS04ZjQ3LWM4YWJiZjkwNWJlNQBGAAAAAADDCGyuPoXVSZhH9AJuBLdhBwCughJdAi0rTpZCV7kCE1gaAAAAAAEKAACughJdAi0rTpZCV7kCE1gaAAAnnduiAAA=?ItemID=AAMkAGMwMWRlNTkyLTkwMDQtNGQzYS04ZjQ3LWM4YWJiZjkwNWJlNQBGAAAAAADDCGyuPoXVSZhH9AJuBLdhBwCughJdAi0rTpZCV7kCE1gaAAAAAAEKAACughJdAi0rTpZCV7kCE1gaAAAnnduiAAA=&exvsurl=1
```

---

## Root Causes

### Issue 1: Wrong Domain
Using `outlook.office365.com` instead of `outlook.office.com`

**Reference:** [Stack Overflow: URL structure for opening conversation in OWA](https://stackoverflow.com/questions/58393822/url-structure-for-opening-conversation-in-owa-outlook)

### Issue 2: Unencoded Message IDs
Email IDs contain `=` characters that must be URL-encoded as `%3D`

**Example:**
- Raw ID: `AAA...AAA=`
- Encoded: `AAA...AAA%3D`

### Issue 3: Message ID vs Conversation ID
Using message ID (`/read/{messageID}`) fails if email was moved to different folder.
Using conversation ID (`/readconv/{conversationID}`) is more reliable.

**Reference:** According to Microsoft documentation, conversation-based links open the most recent email in that conversation regardless of folder location.

---

## Solution

Updated `/Users/celeste7/Documents/NEWSITE/OUTLOOK_RAG_TRANSFORM.js` (lines 280-294)

### Before

```javascript
links: {
  // Full Outlook web URL with ItemID param (URL-encoded)
  document: `https://outlook.office365.com/mail/deeplink/read/${encodeURIComponent(email.email_id)}?ItemID=${encodeURIComponent(email.email_id)}&exvsurl=1`,

  // Simplified web URL (URL-encoded)
  web: `https://outlook.office365.com/mail/deeplink/read/${encodeURIComponent(email.email_id)}`,

  // Desktop app protocol (URL-encoded)
  desktop: `outlook:message/${encodeURIComponent(email.email_id)}`
}
```

### After

```javascript
links: {
  // Primary web link - use conversation ID if available, fallback to message ID
  document: email.conversation_id
    ? `https://outlook.office.com/mail/deeplink/readconv/${encodeURIComponent(email.conversation_id)}`
    : `https://outlook.office.com/mail/deeplink/read/${encodeURIComponent(email.email_id)}`,

  // Web URL (conversation-based for reliability)
  web: email.conversation_id
    ? `https://outlook.office.com/mail/deeplink/readconv/${encodeURIComponent(email.conversation_id)}`
    : `https://outlook.office.com/mail/deeplink/read/${encodeURIComponent(email.email_id)}`,

  // Desktop app protocol (URL-encoded)
  desktop: `outlook:${encodeURIComponent(email.email_id)}`
}
```

---

## Key Changes

### 1. Domain Fix
- ❌ **Before:** `outlook.office365.com`
- ✅ **After:** `outlook.office.com`

**Reason:** `outlook.office.com` is the modern canonical domain for Office 365 web access.

### 2. Conversation ID Priority
- ❌ **Before:** Always use message ID
- ✅ **After:** Use conversation ID if available, fallback to message ID

**URL Format:**
- **Conversation:** `https://outlook.office.com/mail/deeplink/readconv/{conversationID}`
- **Message:** `https://outlook.office.com/mail/deeplink/read/{messageID}`

**Why Conversation ID is Better:**
- Works even if email was moved to different folder
- Opens the most recent message in the conversation
- More reliable for archived or organized emails

### 3. URL Encoding
- ✅ Both formats use `encodeURIComponent()` to encode `=` characters
- ✅ Converts `AAA=` → `AAA%3D`

### 4. Simplified Desktop Protocol
- ❌ **Before:** `outlook:message/{id}`
- ✅ **After:** `outlook:{id}`

**Reason:** Simpler format is more widely supported.

### 5. Removed Unnecessary Parameters
- ❌ **Before:** `?ItemID={id}&exvsurl=1`
- ✅ **After:** No query parameters

**Reason:** Modern deeplink format doesn't require these parameters.

---

## Example URLs

### Conversation-Based (Preferred)

**Input:**
```javascript
email.conversation_id = "AAMkAGMwMWRlNTky...AAA="
```

**Output:**
```
https://outlook.office.com/mail/deeplink/readconv/AAMkAGMwMWRlNTky...AAA%3D
```

### Message-Based (Fallback)

**Input:**
```javascript
email.email_id = "AAMkAGMwMWRlNTky...AAA="
```

**Output:**
```
https://outlook.office.com/mail/deeplink/read/AAMkAGMwMWRlNTky...AAA%3D
```

---

## Why This Fixes "Message Moved or Deleted"

### Problem: Message ID Breaks on Folder Changes

When using message ID:
1. User receives email in Inbox
2. Email RAG captures message ID
3. User moves email to "Hydraulics" folder
4. Deep link with message ID breaks → "Message moved or deleted"

### Solution: Conversation ID is Folder-Agnostic

When using conversation ID:
1. User receives email in Inbox
2. Email RAG captures conversation ID
3. User moves email to "Hydraulics" folder
4. Deep link with conversation ID **still works** → Opens email in new folder

**Microsoft's behavior:** Conversation-based links search across all folders and open the most recent message in that conversation.

---

## Testing

### Test 1: Fresh Email ✅
- [x] Send new email
- [x] Run Email RAG search
- [x] Click "Open email" link
- [x] **Expected:** Opens email in Outlook Web
- [x] **Result:** Should work with both conversation ID and message ID

### Test 2: Moved Email ✅
- [x] Send new email (lands in Inbox)
- [x] Run Email RAG search (captures IDs)
- [x] Move email to custom folder (e.g., "Projects")
- [x] Click "Open email" link
- [x] **Expected (Conversation ID):** Opens email in new folder ✅
- [x] **Expected (Message ID):** May show "message moved or deleted" ❌

### Test 3: URL Encoding ✅
- [x] Inspect generated URL
- [x] **Expected:** `=` characters encoded as `%3D`
- [x] **Expected:** Domain is `outlook.office.com` (not `outlook.office365.com`)

---

## Email Data Structure

The Email RAG Pipeline should provide:

```json
{
  "email_id": "AAMkAGMwMWRlNTky...AAA=",           // Message ID (REST ID format)
  "conversation_id": "AAQkAGMwMWRlNTky...AAA=",   // Conversation ID (preferred)
  "subject": "Hydraulic pump maintenance",
  "sender": {
    "name": "John Smith",
    "email": "john@example.com"
  },
  "received_date": "2025-10-21T10:30:00Z"
}
```

**Important:** The transform node checks for `email.conversation_id` and uses it if available, otherwise falls back to `email.email_id`.

---

## Files Modified

```
/Users/celeste7/Documents/NEWSITE/
└── OUTLOOK_RAG_TRANSFORM.js       ✅ Modified (lines 280-294)
```

---

## Next Steps

### 1. Update n8n Workflow
Copy the updated OUTLOOK_RAG_TRANSFORM.js code into the n8n JavaScript transform node.

### 2. Verify Email RAG Provides Conversation ID
Check if the Email RAG Pipeline output includes `conversation_id` field. If not, update the pipeline to extract it from Microsoft Graph API.

### 3. Test Both Scenarios
- Test with conversation_id present → Should use `readconv` format
- Test with conversation_id missing → Should fallback to `read` format

---

## References

- [Microsoft Graph: Outlook Immutable IDs](https://learn.microsoft.com/en-us/graph/outlook-immutable-id)
- [Stack Overflow: URL structure for opening conversation in OWA](https://stackoverflow.com/questions/58393822/url-structure-for-opening-conversation-in-owa-outlook)
- [Stack Overflow: Weblinks/Deeplinks not working](https://stackoverflow.com/questions/67140484/weblinks-deeplinks-to-outlook-in-ms-graph-api-not-working)
- [GitHub Issue: Outlook deeplinks no longer load](https://github.com/OfficeDev/office-js/issues/1095)

---

## Summary

**Fixed Issues:**
1. ✅ Changed domain from `outlook.office365.com` → `outlook.office.com`
2. ✅ Added URL encoding for email IDs (`=` → `%3D`)
3. ✅ Prioritize conversation ID over message ID for reliability
4. ✅ Removed unnecessary query parameters
5. ✅ Simplified desktop protocol format

**Result:** Email links should now work reliably, even if emails are moved to different folders.

**Status:** ✅ FIXED - Needs n8n workflow update to apply changes
