-- Remove extra columns from document_yacht to match Oct 13 schema exactly
-- Date: October 14, 2025

ALTER TABLE document_yacht
DROP COLUMN IF EXISTS confidence_level,
DROP COLUMN IF EXISTS context_embeddings,
DROP COLUMN IF EXISTS document_name_tokens,
DROP COLUMN IF EXISTS equipment_covered_tokens,
DROP COLUMN IF EXISTS equipment_specialization,
DROP COLUMN IF EXISTS fault_resolution_map,
DROP COLUMN IF EXISTS fault_resolution_map_tokens,
DROP COLUMN IF EXISTS file_hash,
DROP COLUMN IF EXISTS file_size_mb,
DROP COLUMN IF EXISTS first_accessed,
DROP COLUMN IF EXISTS last_modified,
DROP COLUMN IF EXISTS last_pattern_update,
DROP COLUMN IF EXISTS pattern_matches,
DROP COLUMN IF EXISTS patterns,
DROP COLUMN IF EXISTS solutions_tried,
DROP COLUMN IF EXISTS solutions_tried_tokens;

-- Drop indexes for removed columns
DROP INDEX IF EXISTS idx_document_yacht_patterns_gin;
DROP INDEX IF EXISTS idx_document_yacht_equipment_gin;
