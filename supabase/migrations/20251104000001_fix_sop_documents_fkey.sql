-- Fix sop_documents foreign key constraint issue
-- Allow user_id to be any value (not constrained to auth.users)
-- This is needed because the cloud SOP system operates independently

-- Drop the existing foreign key constraint
ALTER TABLE sop_documents
DROP CONSTRAINT IF EXISTS sop_documents_user_id_fkey;

-- Also drop from manual_embeddings and sop_edits for consistency
ALTER TABLE manual_embeddings
DROP CONSTRAINT IF EXISTS manual_embeddings_user_id_fkey;

ALTER TABLE sop_edits
DROP CONSTRAINT IF EXISTS sop_edits_user_id_fkey;

-- Optionally, change user_id to TEXT instead of UUID
-- This allows more flexible user identifiers like 'default_user' or 'user_123'
-- Uncomment if you want to support non-UUID user IDs:

-- ALTER TABLE sop_documents ALTER COLUMN user_id TYPE TEXT;
-- ALTER TABLE manual_embeddings ALTER COLUMN user_id TYPE TEXT;
-- ALTER TABLE sop_edits ALTER COLUMN user_id TYPE TEXT;

-- Add indexes for performance (now that we don't have FK indexes)
CREATE INDEX IF NOT EXISTS sop_documents_user_id_idx ON sop_documents(user_id);
CREATE INDEX IF NOT EXISTS manual_embeddings_user_id_idx ON manual_embeddings(user_id);

-- Note: RLS policies will still work as they check the user_id field
-- The only change is that user_id no longer needs to exist in auth.users
