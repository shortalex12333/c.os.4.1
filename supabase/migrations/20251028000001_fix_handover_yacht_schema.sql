-- Fix handover_yacht schema to match current code requirements
-- Date: October 28, 2025
-- Purpose: Add missing columns for entity-based handover system

-- ============================================
-- 1. Make solution_id NULLABLE (not always available)
-- ============================================
ALTER TABLE handover_yacht
ALTER COLUMN solution_id DROP NOT NULL;

COMMENT ON COLUMN handover_yacht.solution_id IS 'Optional: UUID of related solution/document';

-- ============================================
-- 2. Add document_page if missing (nullable for documents without page numbers)
-- ============================================
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS document_page INTEGER;

COMMENT ON COLUMN handover_yacht.document_page IS 'Optional: Page number for NAS documents';

-- ============================================
-- 3. Add document_source (nas/email/manual)
-- ============================================
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS document_source TEXT DEFAULT 'manual';

COMMENT ON COLUMN handover_yacht.document_source IS 'Source type: nas, email, or manual';

-- ============================================
-- 4. Add entity columns (flexible key-value pairs)
-- ============================================
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS entity_0 JSONB,
ADD COLUMN IF NOT EXISTS entity_1 JSONB,
ADD COLUMN IF NOT EXISTS entity_2 JSONB,
ADD COLUMN IF NOT EXISTS entity_3 JSONB,
ADD COLUMN IF NOT EXISTS entity_4 JSONB,
ADD COLUMN IF NOT EXISTS entity_5 JSONB;

-- Add comments
COMMENT ON COLUMN handover_yacht.entity_0 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_1 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_2 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_3 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_4 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_5 IS 'Flexible key-value pair: {key: string, value: string}';

-- ============================================
-- 5. Create indexes for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_handover_yacht_document_source ON handover_yacht(document_source);
CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_0 ON handover_yacht USING gin(entity_0);
CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_1 ON handover_yacht USING gin(entity_1);

-- ============================================
-- 6. Update old columns to be nullable (backward compatibility)
-- ============================================
ALTER TABLE handover_yacht
ALTER COLUMN system_affected DROP NOT NULL,
ALTER COLUMN fault_code DROP NOT NULL;

COMMENT ON TABLE handover_yacht IS 'Shift handover notes - flexible entity-based schema supporting both old and new formats';
