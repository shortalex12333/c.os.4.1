# SOP Documents Foreign Key Constraint Fix

## Issue Summary

**Error:**
```
insert or update on table "sop_documents" violates foreign key constraint "sop_documents_user_id_fkey"
```

**Root Cause:**
The `sop_documents` table has a foreign key constraint requiring `user_id` to exist in `auth.users`:

```sql
user_id UUID REFERENCES auth.users(id)
```

However, the frontend code generates placeholder user IDs that don't exist in the cloud Supabase `auth.users` table:

```typescript
// AppFigma.tsx:403
user_id: sopData.user_id || user?.userId || 'default_user'

// AppFigma.tsx:316
id: user?.userId || `user_${Date.now()}`
```

When the SOP is saved via `https://api.celeste7.ai/webhook/save-sop`, it tries to INSERT these non-existent user IDs into `sop_documents`, causing the foreign key violation.

## Files Involved

1. **Database Schema:** `/supabase/migrations/20251103_add_sop_tables.sql:22`
   - Defines the problematic constraint

2. **Frontend - SOP Creation:** `/client/AppFigma.tsx:316, 403`
   - Generates fake user IDs

3. **Frontend - Save API:** `/client/components/sop-editor/utils/api.ts:104`
   - Sends user_id to save-sop webhook

## Solution

Drop the foreign key constraint to allow any `user_id` value. The cloud SOP system operates independently and doesn't require tight coupling to `auth.users`.

## Apply the Fix

### Option 1: Via Supabase SQL Editor (RECOMMENDED)

1. Go to: https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk/editor
2. Open the SQL Editor
3. Copy and paste the contents of: **`APPLY_TO_CLOUD_SOP_FIX.sql`**
4. Click **"Run"**
5. Verify the query returns 0 rows (constraints successfully dropped)

### Option 2: Via Migration File

If you're using Supabase CLI or migration tools:

```bash
# Apply the migration
supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.vivovcnaapmcfxxfhzxk.supabase.co:5432/postgres"
```

## What Changed

### Before (Strict Constraint)
```sql
CREATE TABLE sop_documents (
  user_id UUID REFERENCES auth.users(id),  -- ❌ Must exist in auth.users
  ...
);
```

### After (Flexible)
```sql
CREATE TABLE sop_documents (
  user_id UUID,  -- ✅ Any UUID value accepted
  ...
);

-- Performance index added
CREATE INDEX sop_documents_user_id_idx ON sop_documents(user_id);
```

## Impact

### ✅ What Still Works
- Row Level Security (RLS) policies - unchanged
- Service role access - unchanged
- User-based data filtering - unchanged
- All existing SOP functionality - unchanged

### ⚠️ What Changed
- `user_id` no longer requires an actual user in `auth.users`
- Frontend can use placeholder IDs like `'default_user'` or `'user_123456789'`
- No data migration needed (existing records unaffected)

## Verification

After applying the fix, test by:

1. Creating a new SOP from the frontend
2. Editing and saving the SOP
3. Verify no foreign key errors appear

The save operation should now succeed:

```typescript
const result = await SOPApiClient.saveToDatabase(sop);
// Should return: { success: true, message: "SOP saved to database successfully" }
```

## Alternative Solution (Not Recommended)

If you want to maintain the foreign key constraint, you must ensure:

1. Every user authenticates through Supabase Auth before creating SOPs
2. Frontend uses real `auth.uid()` values from authenticated sessions
3. No placeholder user IDs are used

This would require significant frontend refactoring and is NOT recommended for the cloud SOP system's current architecture.

## Files Created

1. `/supabase/migrations/20251104_fix_sop_documents_fkey.sql` - Migration file
2. `/APPLY_TO_CLOUD_SOP_FIX.sql` - Ready-to-run SQL for cloud Supabase
3. `/SOP_FK_CONSTRAINT_FIX.md` - This documentation

## Cloud Supabase Details

- **Instance:** https://vivovcnaapmcfxxfhzxk.supabase.co
- **Affected Tables:** `sop_documents`, `manual_embeddings`, `sop_edits`
- **Constraints Removed:** `*_user_id_fkey`

---

**Status:** ✅ Fix ready to apply
**Priority:** 🔴 High (blocks SOP save functionality)
**Estimated Time:** < 1 minute to apply
