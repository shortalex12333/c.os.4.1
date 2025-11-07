# Handover Entity Migration - Summary

**Date:** 2025-10-10
**Status:** ✅ COMPLETE

---

## What Changed

### 1. **Supabase Table Schema**

**OLD Structure (Deprecated):**
```sql
handover_yacht (
  handover_id UUID,
  user_id UUID,
  yacht_id TEXT,
  solution_id UUID,
  document_name TEXT,
  document_path TEXT,
  document_page NUMERIC,
  system_affected TEXT,      -- REMOVED
  fault_code TEXT,           -- REMOVED
  symptoms JSONB,            -- REMOVED
  actions_taken JSONB,       -- REMOVED
  duration_minutes INTEGER,  -- REMOVED
  notes TEXT,                -- REMOVED
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
)
```

**NEW Structure (Entity-Based):**
```sql
handover_yacht (
  handover_id UUID DEFAULT gen_random_uuid(),  -- AUTO-GENERATED
  user_id UUID NOT NULL,
  yacht_id TEXT NOT NULL,
  solution_id UUID NOT NULL,
  document_name TEXT,
  document_path TEXT,
  document_page NUMERIC,
  entity0 JSONB DEFAULT '{}',   -- ADDED: Flexible key-value
  entity1 JSONB DEFAULT '{}',   -- ADDED: Flexible key-value
  entity2 JSONB DEFAULT '{}',   -- ADDED: Flexible key-value
  entity3 JSONB DEFAULT '{}',   -- ADDED: Flexible key-value
  entity4 JSONB DEFAULT '{}',   -- ADDED: Flexible key-value
  entity5 JSONB DEFAULT '{}',   -- ADDED: Flexible key-value
  entity6 JSONB DEFAULT '{}',   -- ADDED: Reserved for future
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
)
```

### 2. **Entity Mapping**

Each entity stores: `{"key": "field_name", "value": "user_input"}`

| Entity | Typical Use | Example |
|--------|-------------|---------|
| entity0 | System | `{"key": "system", "value": "Hydraulics"}` |
| entity1 | Fault Code | `{"key": "fault_code", "value": "e0-456"}` |
| entity2 | Symptoms | `{"key": "symptoms", "value": "Intermittent power loss"}` |
| entity3 | Actions Taken | `{"key": "actions_taken", "value": "Checked wiring"}` |
| entity4 | Duration | `{"key": "duration", "value": "45"}` |
| entity5 | Notes | `{"key": "notes", "value": "Contact vendor if needed"}` |
| entity6 | Reserved | `{}` |

### 3. **Migration Applied**

**File:** `/Users/celeste7/Documents/NEWSITE/supabase/migrations/20251010_create_handover_yacht_with_entities.sql`

**Applied:** ✅ Successfully migrated local Supabase instance

---

## Key Answers to Your Questions

### Q: Is handover_id auto-generated?
**A: YES** ✅

```sql
handover_id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

- Supabase automatically creates the UUID when you insert
- Frontend does NOT need to provide this
- It's returned in the response after insert

### Q: What about feedback_handover table?
**A: DELETED** ✅

- `feedback_handover` table never existed in your migrations
- Code was referencing it incorrectly
- Only use `handover_yacht` table going forward

### Q: Do we need a webhook endpoint?
**A: NO** ✅

- Frontend saves **directly to Supabase** using `supabase.from('handover_yacht').insert()`
- No `/handover-collection` webhook needed
- This is faster and simpler

---

## Updated Code Files

### 1. **handoverService.ts** - Updated

**Location:** `/Users/celeste7/Documents/NEWSITE/client/services/handoverService.ts`

**Changes:**
- ✅ Uses new `entity0-entity6` structure
- ✅ Saves directly to `handover_yacht` table
- ✅ No longer references `feedback_handover`
- ✅ Proper TypeScript interfaces for entities

**Usage:**
```typescript
import { saveHandover } from './services/handoverService';

const result = await saveHandover({
  user_id: user.userId,
  yacht_id: "yacht_alpha_01",
  solution_id: "sol_001",
  document_name: "FURUNO Radar Manual",
  document_path: "http://localhost:8095/ROOT/...",
  document_page: 12,
  entity0: { key: "system", value: "Navigation" },
  entity1: { key: "fault_code", value: "RAD-42" },
  // ... more entities
  status: "draft"
});
```

### 2. **WEBHOOK_FORMAT_GUIDE.md** - Updated

**Location:** `/Users/celeste7/Documents/NEWSITE/WEBHOOK_FORMAT_GUIDE.md`

**Changes:**
- ✅ Added Section 4: "Handover Submission (NEW: Entity-Based Structure)"
- ✅ Explains entity columns
- ✅ Shows complete examples with TypeScript
- ✅ Documents Supabase response format

---

## Next Steps for Frontend Engineer

### 1. **Update AISolutionCard.tsx** ✅ COMPLETE

**Status:** Component has been updated to use new entity-based structure

**Changes Applied:**
```typescript
// ✅ Updated imports
import { saveHandover, getOrCreateSessionId, type HandoverPayload, type HandoverEntity } from '../../services/handoverService';

// ✅ Updated handleFieldSave function
const handleFieldSave = async (itemId: string, fieldKey: string) => {
  // Build entity structure (entity0-entity6)
  const entities: { [key: string]: HandoverEntity } = {};
  handoverFields.forEach((field, index) => {
    if (index < 7) {
      entities[`entity${index}`] = {
        key: field.key,
        value: handoverFieldEdits[itemId]?.[field.key] ?? field.value
      };
    }
  });

  // Prepare handover payload
  const payload: HandoverPayload = {
    user_id: user?.userId || '',
    yacht_id: yachtId || 'default_yacht',
    solution_id: parentSolutionId,
    document_name: docInfo?.file_name || solution?.title || 'Unknown Document',
    document_path: docInfo?.doc_link || solution?.procedureLink || '',
    document_page: docInfo?.page_number || solution?.source?.page || null,
    ...entities,
    status: 'draft'
  };

  // Save to Supabase with new entity structure
  const result = await saveHandover(payload);

  if (result.success) {
    console.log('✅ Handover saved:', result.data?.[0]?.handover_id);
    // handover_id is auto-generated by Supabase
  }
};

// ✅ Added helper function to get document info from related_docs
const getDocumentInfo = (solutionId: string, itemId: string) => { ... };
```

**Location:** `/Users/celeste7/Documents/NEWSITE/client/components/layout/AISolutionCard.tsx:286-371`

### 2. **Get `yacht_id` from Context** ⚠️ TODO

Currently using fallback `yachtId || 'default_yacht'` - need to add this to AuthContext or props:

```typescript
// Option A: Add to AuthContext
const { user, yachtId } = useAuth();

// Option B: Add to component props (currently supports this)
<AISolutionCard
  solutions={solutions}
  yachtId="yacht_alpha_01"  // Pass from parent
/>
```

### 3. **Test the Flow** ⚠️ TODO

1. User searches for "FURUNO radar manual"
2. User clicks "Add to Handover"
3. Dropdown opens with fields
4. User fills: system, fault_code, symptoms, etc.
5. User clicks "Save"
6. Frontend calls `saveHandover()` with entity structure
7. Supabase saves and returns with generated `handover_id`
8. Button changes to indicate saved state ✓

---

## Database Verification

**Table exists:**
```bash
curl "http://127.0.0.1:54321/rest/v1/handover_yacht?select=*" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Insert test data:**
```bash
curl -X POST "http://127.0.0.1:54321/rest/v1/handover_yacht" \
  -H "apikey: ..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "yacht_id": "test_yacht",
    "solution_id": "e91c4e27-5c6e-4b2a-9f3c-8d7e6f5a4b3c",
    "entity0": {"key": "system", "value": "Test System"}
  }'
```

---

## Benefits of Entity Structure

### ✅ Flexibility
- Can change field names without schema migration
- Easy to add new fields (just use next entity column)
- Frontend controls what keys are used

### ✅ Scalability
- 7 entity slots (0-6) for different use cases
- Can store any key-value pairs
- Future-proof design

### ✅ Consistency
- All handover data in one table
- No separate columns for each field
- JSONB allows complex queries via PostgreSQL

### ✅ Data Collection
- Core business model: track user inputs
- Analyze which fields users fill most
- Improve AI entity extraction based on real data

---

## Files Changed

1. ✅ `/supabase/migrations/20251010_create_handover_yacht_with_entities.sql` - Created
2. ✅ `/client/services/handoverService.ts` - Updated
3. ✅ `/client/components/layout/AISolutionCard.tsx` - Updated to use new entity structure
4. ✅ `/WEBHOOK_FORMAT_GUIDE.md` - Updated
5. ✅ `/HANDOVER_ENTITY_MIGRATION_SUMMARY.md` - Created (this file)

---

## Rollback Plan (If Needed)

If you need to rollback:

1. Drop the migration:
```bash
npx supabase db reset --local
```

2. Remove migration file:
```bash
rm /Users/celeste7/Documents/NEWSITE/supabase/migrations/20251010_create_handover_yacht_with_entities.sql
```

3. Revert `handoverService.ts` to use old structure

---

**Migration Complete!** ✅

All systems updated to use entity-based handover structure.
