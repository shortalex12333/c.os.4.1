# 🐛 Chat Loading Debug Guide

**Issue:** Chats don't load when page refreshes

---

## 🔍 Quick Diagnostic Steps

### 1. Check Browser Console
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Refresh the page
4. Look for these logs:

**Good signs:**
```
🔍 Fetching chat sessions from chat_session_summaries view...
✅ Fetched 5 chat sessions: [...]
```

**Bad signs:**
```
❌ Error fetching chat sessions: {...}
❌ User not authenticated
```

---

### 2. Visit Debug Page
Navigate to: **http://localhost:8082/test-chats**

This will show:
- ✅ Authentication status
- ✅ Raw database results
- ✅ Chat service results
- ✅ Detailed logs

---

## 🛠️ Common Issues & Solutions

### Issue 1: "No chats in database"
**Symptom:** `Fetched 0 chat sessions`

**Solution:**
1. Click "New Chat" button
2. This should create a chat in the database
3. Refresh the page - chat should appear

**Why:** Database starts empty, need to create chats first

---

### Issue 2: "User not authenticated"
**Symptom:** `❌ User not authenticated` in console

**Solution:**
1. Make sure you're logged in
2. Check if Supabase auth session is valid
3. Try logging out and back in

**Why:** Chat queries require user to be authenticated

---

### Issue 3: "View returns no data"
**Symptom:** Raw query shows chats, but view returns empty

**Possible causes:**
- `deleted = TRUE` - View filters out deleted chats
- `is_archived = TRUE` - getChatSessions filters archived chats

**Solution:**
Check database:
```bash
cd /Users/celeste7/Documents/NEWSITE
npx supabase db reset --local
```

This resets the database and applies all migrations fresh.

---

### Issue 4: "Permission denied / RLS error"
**Symptom:** Error mentions "row level security" or "permission denied"

**Solution:**
RLS should be disabled in testing. Verify migration:
```sql
-- Check if this migration was applied:
-- supabase/migrations/20251001000002_force_disable_all_rls.sql
```

**Fix:**
```bash
npx supabase db reset --local
```

---

### Issue 5: "Chats created but not visible"
**Symptom:** Creating chat succeeds, but doesn't appear in list

**Possible causes:**
1. Chat was marked `deleted = true`
2. Chat has different user_id than logged-in user
3. View filter is too restrictive

**Debug:**
Visit `/test-chats` page and check:
- "Raw Chat Sessions" (all chats in DB)
- vs "Chat Sessions from chatService" (filtered)

Compare the two lists to see what's being filtered out.

---

## 🧪 Manual Database Check

If you have `psql` installed:

```bash
# Check Supabase is running
npx supabase status

# Connect to database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Check all chats
SELECT id, title, deleted, is_archived, user_id, created_at
FROM chat_sessions
ORDER BY created_at DESC;

# Check view
SELECT * FROM chat_session_summaries;

# Check if view exists
\dv chat_session_summaries

# Exit
\q
```

---

## 🔧 Force Fresh Start

If all else fails, reset everything:

```bash
cd /Users/celeste7/Documents/NEWSITE

# Stop Supabase
npx supabase stop

# Reset database (applies all migrations fresh)
npx supabase db reset --local

# Restart
npx supabase start

# Restart app
npm run dev
```

Then:
1. Log in
2. Click "New Chat"
3. Verify chat appears

---

## 📊 Expected Data Flow

```
User clicks "New Chat"
    ↓
chatService.createChatSession()
    ↓
INSERT into chat_sessions table
    ↓
    {
      id: uuid,
      title: "New Chat",
      user_id: auth.user.id,
      deleted: false,
      is_archived: false
    }
    ↓
Component calls loadChatSessions()
    ↓
chatService.getChatSessions()
    ↓
SELECT * FROM chat_session_summaries
WHERE is_archived = false
    ↓
View filters: WHERE deleted = false
    ↓
Returns array of chats
    ↓
setState(chats)
    ↓
UI renders chat list
```

If any step fails, the chain breaks and chats won't appear.

---

## 🔬 Debug Logs Added

I've added comprehensive logging to `chatService.ts`:

### When fetching chats:
```
🔍 Fetching chat sessions from chat_session_summaries view...
✅ Fetched 3 chat sessions: [...]
```

### When creating chat:
```
🆕 Creating new chat session: { title: "New Chat", ... }
👤 Creating chat for user: abc-123-uuid
✅ Chat session created: { id: "...", title: "..." }
```

### If errors occur:
```
❌ Error fetching chat sessions: { message: "...", code: "..." }
```

**Check your browser console for these logs!**

---

## ✅ Verification Checklist

After fixing, verify:
- [ ] Console shows `✅ Fetched X chat sessions`
- [ ] Sidebar shows correct count: `Conversations X`
- [ ] Clicking "New Chat" creates visible chat
- [ ] Refreshing page keeps chats loaded
- [ ] `/test-chats` page shows data in all sections

---

## 🆘 Still Not Working?

If chats still don't load after trying all above:

1. **Share console logs** - Copy/paste browser console output
2. **Visit `/test-chats`** - Take screenshot of diagnostic page
3. **Check Supabase Studio** - Visit http://localhost:54323
   - Go to Table Editor
   - Check `chat_sessions` table
   - Check `chat_session_summaries` view
   - Verify data exists

The issue is likely one of:
- Authentication
- Database query/view
- Filter logic (deleted/archived)
- React state not updating

The debug tools will help identify which one!
