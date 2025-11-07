-- ========================================
-- FIX: sop_documents Foreign Key Constraint
-- ========================================
-- Apply this to CLOUD Supabase ONLY
-- Instance: https://vivovcnaapmcfxxfhzxk.supabase.co
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk/editor
-- 2. Paste this entire file into SQL Editor
-- 3. Click "Run"
-- ========================================

-- Drop foreign key constraints that require user_id to exist in auth.users
-- This allows the cloud SOP system to work with any user_id value

ALTER TABLE sop_documents
DROP CONSTRAINT IF EXISTS sop_documents_user_id_fkey;

ALTER TABLE manual_embeddings
DROP CONSTRAINT IF EXISTS manual_embeddings_user_id_fkey;

ALTER TABLE sop_edits
DROP CONSTRAINT IF EXISTS sop_edits_user_id_fkey;

-- Add indexes for query performance (replacing FK indexes)
CREATE INDEX IF NOT EXISTS sop_documents_user_id_idx ON sop_documents(user_id);
CREATE INDEX IF NOT EXISTS manual_embeddings_user_id_idx ON manual_embeddings(user_id);
CREATE INDEX IF NOT EXISTS sop_edits_user_id_idx ON sop_edits(user_id);

-- Verify the constraints are dropped
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname LIKE '%user_id_fkey%'
  AND conrelid::regclass::text IN ('sop_documents', 'manual_embeddings', 'sop_edits');

-- Should return 0 rows if successful
