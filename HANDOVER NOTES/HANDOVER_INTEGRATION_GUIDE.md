# 🤝 Handover Integration Guide

## ✅ Integration Complete

The front-end is now fully wired to save handover data to the `feedback_handover` table in Supabase.

---

## 🎯 What Was Implemented

### 1. **Supabase Service** (`client/services/handoverService.ts`)
- `saveHandover()` - Main function to upsert handover data
- `saveHandoverField()` - Save individual field updates
- `getHandover()` - Retrieve existing handover data
- `getOrCreateSessionId()` - Session tracking utility

### 2. **AISolutionCard Component** (Updated)
- Integrated with Supabase via `handoverService`
- Tracks user context: `user_id`, `session_id`, `conversation_id`, `yacht_id`
- Save button now writes to Supabase instead of console.log
- Loading states + error handling
- Automatic session ID generation

### 3. **ChatAreaReal Component** (Updated)
- Passes context to AISolutionCard:
  - `conversationId` - Message ID
  - `queryText` - User's original query
  - `yachtId` - (TODO: Get from app context)

### 4. **Solution Provenance Tracking** (NEW)
- Main solution "Add to Handover" button saves with `sol_id = solution.id`
- Each document in "Other docs" gets a "+ Handover" button
- Document handovers save with parent solution's `sol_id`
- Tracks which AI solution family the user engaged with
- Enables analytics on solution effectiveness and user preferences

---

## 🔄 User Flow

### Main Solution Handover:
1. **User clicks "Add to Handover" on main solution**
   - Form expands with editable key:value fields
   - Session ID auto-generated (stored in localStorage)

2. **User edits a field**
   - Types in the input
   - Field tracks changes vs. original value

3. **User clicks Save (✓)**
   - Shows loading spinner
   - Calls `saveHandoverField()` with `sol_id = solution.id`
   - Supabase upsert to `feedback_handover` table
   - Button shows "Saved" state (grayed out checkmark)

### Alternative Document Handover:
1. **User expands "Other related documents"**
   - Each document shows a "+ Handover" button

2. **User clicks "+ Handover" on a specific document**
   - Document handover form expands below
   - Shows document name header (e.g., "📄 Engine Manual 3512B.pdf")
   - Uses parent solution's handover_fields

3. **User edits and saves**
   - Same save flow as main solution
   - Saves with `sol_id = parent_solution.id`

4. **Data Saved to Supabase**
   ```json
   {
     "session_id": "session_1696348800000_xyz123",
     "conversation_id": "msg_abc123",
     "user_id": "user_uuid_from_auth",
     "yacht_id": null,
     "sol_id": "sol_123",
     "query_text": "How to bleed hydraulic line?",
     "handover_data": [
       { "key": "System", "value": "Hydraulics" },
       { "key": "Fault Code", "value": "32A" },
       { "key": "Symptoms", "value": "Low pressure alarm" },
       { "key": "Actions Taken", "value": "Bled line" },
       { "key": "Duration (mins)", "value": "45" }
     ],
     "created_at": "2025-10-02T11:30:00.000Z",
     "updated_at": "2025-10-02T11:30:00.000Z"
   }
   ```

---

## 🧪 Testing Instructions

### Step 1: Start Supabase
```bash
cd /Users/celeste7/Documents/NEWSITE
supabase start
```

### Step 2: Check Table Exists
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT * FROM feedback_handover LIMIT 1;"
```

Expected: Table exists (may be empty)

### Step 3: Start App
```bash
npm run dev
# Open http://localhost:8082
```

### Step 4: Test Handover Save

1. **Open the app** (http://localhost:8082)
2. **Log in** (if auth is required)
3. **Start a conversation** with the AI
4. **Wait for solution cards** to appear
5. **Click "Add to Handover"** on any solution
6. **Edit a field** (e.g., change "Symptoms" to "Pressure dropping")
7. **Click the checkmark (✓) button**
8. **Watch console** for success log:
   ```
   ✅ Handover field saved to Supabase: {
     solution_id: "sol_xyz",
     session_id: "session_1696348800000_xyz123",
     conversation_id: "msg_abc123",
     user_id: "user_uuid",
     key: "Symptoms",
     value: "Pressure dropping"
   }
   ```

### Step 5: Verify in Supabase

**Option A: SQL Query**
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT session_id, conversation_id, handover_data, created_at FROM feedback_handover ORDER BY created_at DESC LIMIT 5;"
```

**Option B: Supabase Studio**
1. Open http://localhost:54323
2. Navigate to **Table Editor**
3. Select `feedback_handover` table
4. See your saved data!

---

## 📊 Database Schema (Reference)

```sql
CREATE TABLE feedback_handover (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Context IDs
  yacht_id UUID REFERENCES users_yacht(id),
  user_id UUID REFERENCES auth.users(id),
  conversation_id TEXT,
  session_id TEXT NOT NULL,
  sol_id TEXT, -- Solution ID for provenance tracking

  -- Query context
  query_text TEXT,
  ai_intent TEXT,
  ai_confidence NUMERIC,

  -- Core payload (editable fields)
  handover_data JSONB NOT NULL,

  -- Document provenance
  document_used TEXT,
  other_documents TEXT[],

  -- Tags
  system_inferred_tags TEXT[],
  user_confirmed_tags TEXT[],

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint (allows multiple handovers per conversation for different solutions)
  UNIQUE(session_id, conversation_id, sol_id)
);
```

---

## 🔧 What Gets Saved

### Required Fields
- ✅ `session_id` - Browser session (auto-generated)
- ✅ `handover_data` - Array of `{key, value}` objects

### Context Fields (Automatic)
- ✅ `user_id` - From AuthContext (if logged in)
- ✅ `conversation_id` - From message ID
- ✅ `query_text` - User's original query
- ⚠️ `yacht_id` - TODO: Need to add yacht context to app

### Optional Fields (Not Yet Implemented)
- ⏳ `ai_intent` - Backend will populate
- ⏳ `ai_confidence` - Backend will populate
- ⏳ `document_used` - Backend will populate
- ⏳ `other_documents` - Backend will populate
- ⏳ `system_inferred_tags` - Backend will populate
- ⏳ `user_confirmed_tags` - User interaction (future)

---

## 🐛 Troubleshooting

### Error: "Table feedback_handover does not exist"
```bash
# Run migrations
cd /Users/celeste7/Documents/NEWSITE
supabase db reset --local
```

### Error: "session_id is required"
This shouldn't happen - session ID is auto-generated. Check console for errors.

### Error: "Failed to save: ..."
- Check Supabase is running: `supabase status`
- Check table exists: `psql ... -c "\dt feedback_handover"`
- Check RLS policies (currently disabled for testing)

### Save button shows loading forever
- Check browser console for error messages
- Check Supabase logs: `supabase logs`
- Verify network requests in DevTools

### Data not appearing in Supabase
- Refresh Supabase Studio
- Check you're querying the right database (port 54322)
- Verify INSERT permissions (RLS currently disabled)

---

## 📝 Console Logs

### On Save Success
```
✅ Handover field saved to Supabase: {
  solution_id: "sol_12345",
  session_id: "session_1696348800000_xyz123",
  conversation_id: "msg_abc123",
  user_id: "auth_user_uuid",
  yacht_id: undefined,
  key: "Symptoms",
  value: "Low pressure alarm"
}
```

### On Save Error
```
❌ Failed to save handover field: [error message]
```

### On Supabase Insert
```
✅ Handover saved to Supabase: [{
  id: "uuid...",
  session_id: "session_...",
  handover_data: [...],
  created_at: "2025-10-02T11:30:00.000Z"
}]
```

---

## 🎨 UI States

### Save Button States

| State | Appearance | Tooltip |
|-------|-----------|---------|
| **Ready to save** | Gray square with dark checkmark | "Save to Supabase" |
| **Saving...** | Blue square with spinner | "Saving..." |
| **Saved** | Light gray with muted checkmark | "Saved to Supabase" |
| **Disabled** | Grayed out, cursor: wait | Cannot click while saving |

---

## 🚀 Next Steps (Backend Integration)

### 1. Add Yacht Context
Update app to track current yacht:
```typescript
// In AppFigma.tsx or context
const [currentYachtId, setCurrentYachtId] = useState<string>();

// Pass to ChatAreaReal
<ChatAreaReal yachtId={currentYachtId} />

// Pass to AISolutionCard
<AISolutionCard yachtId={yachtId} />
```

### 2. Backend AI Inference
When backend sends solution, include:
```json
{
  "solution": { ... },
  "handover_fields": [
    { "key": "System", "value": "Hydraulics" },
    { "key": "Fault Code", "value": "32A" }
  ],
  "ai_intent": "troubleshooting",
  "ai_confidence": 0.87,
  "document_used": "Hydraulic_Manual_v3.pdf"
}
```

Frontend will automatically save these when user clicks "Add to Handover".

### 3. Tags Implementation
Add tag UI:
```typescript
// Future feature
const [tags, setTags] = useState<string[]>([]);

// In handover form
<TagInput
  systemTags={systemInferredTags}
  userTags={userConfirmedTags}
  onChange={setTags}
/>
```

---

## ✅ Verification Checklist

- [x] `handoverService.ts` created
- [x] `AISolutionCard` uses handover service
- [x] Session ID auto-generated
- [x] User ID from AuthContext
- [x] Conversation ID from message
- [x] Save button shows loading state
- [x] Save button disabled while saving
- [x] Error handling implemented
- [x] Console logs for debugging
- [x] Supabase upsert on conflict
- [x] JSONB handover_data format
- [ ] Yacht ID from app context (TODO)
- [ ] Backend AI inference fields (TODO)
- [ ] User tag UI (TODO)

---

## 🎯 Quick Test Commands

```bash
# 1. Start everything
cd /Users/celeste7/Documents/NEWSITE
supabase start
npm run dev

# 2. Check table
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT COUNT(*) as total_handovers FROM feedback_handover;"

# 3. View recent handovers
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT session_id, jsonb_pretty(handover_data), created_at FROM feedback_handover ORDER BY created_at DESC LIMIT 3;"

# 4. Clear test data
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "DELETE FROM feedback_handover WHERE session_id LIKE 'session_%';"
```

---

## 🎉 Result

**The front-end is fully wired!** When a user:
1. Clicks "Add to Handover"
2. Edits any field
3. Clicks Save (✓)

The data is immediately saved to Supabase's `feedback_handover` table with:
- ✅ Session tracking
- ✅ User identification
- ✅ Conversation context
- ✅ Editable key:value pairs
- ✅ Timestamps
- ✅ Upsert on conflict

**Next:** Backend team can populate AI inference fields and document provenance.
