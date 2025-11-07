-- ============================================
-- CRITICAL: Fix handover_yacht schema
-- ============================================
-- This migration adds missing columns needed for "Add to handover" functionality
-- Copy and paste this entire file into Supabase Studio SQL Editor

-- 1. Make solution_id NULLABLE (not always available)
ALTER TABLE handover_yacht
ALTER COLUMN solution_id DROP NOT NULL;

-- 2. Add document_page if missing (nullable for documents without page numbers)
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS document_page INTEGER;

-- 3. Add document_source (nas/email/manual)
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS document_source TEXT DEFAULT 'manual';

-- 4. Add entity columns (flexible key-value pairs)
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS entity_0 JSONB,
ADD COLUMN IF NOT EXISTS entity_1 JSONB,
ADD COLUMN IF NOT EXISTS entity_2 JSONB,
ADD COLUMN IF NOT EXISTS entity_3 JSONB,
ADD COLUMN IF NOT EXISTS entity_4 JSONB,
ADD COLUMN IF NOT EXISTS entity_5 JSONB;

-- 5. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_handover_yacht_document_source ON handover_yacht(document_source);
CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_0 ON handover_yacht USING gin(entity_0);
CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_1 ON handover_yacht USING gin(entity_1);

-- 6. Update old columns to be nullable (backward compatibility)
ALTER TABLE handover_yacht
ALTER COLUMN system_affected DROP NOT NULL,
ALTER COLUMN fault_code DROP NOT NULL;

-- Done! Your "Add to handover" button should now work.
