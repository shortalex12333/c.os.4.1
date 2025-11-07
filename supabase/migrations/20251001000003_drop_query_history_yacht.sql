-- Drop legacy query_history_yacht table
-- Created: 2025-10-01
-- Purpose: Remove query_history_yacht, use chat_messages going forward

-- Drop views that depend on query_history_yacht
DROP VIEW IF EXISTS yacht_query_insights CASCADE;
DROP VIEW IF EXISTS user_yacht_activity CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_query_user_date;
DROP INDEX IF EXISTS idx_query_yacht_id;
DROP INDEX IF EXISTS idx_query_history_yacht_user;
DROP INDEX IF EXISTS idx_query_history_yacht_date;
DROP INDEX IF EXISTS idx_query_history_yacht_type;
DROP INDEX IF EXISTS idx_query_history_yacht_context;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can access own yacht query history" ON query_history_yacht;
DROP POLICY IF EXISTS "Service role can access all yacht queries" ON query_history_yacht;
DROP POLICY IF EXISTS "anon_all_query_history_yacht" ON query_history_yacht;

-- Drop the table
DROP TABLE IF EXISTS query_history_yacht CASCADE;

-- Verify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Dropped query_history_yacht - using chat_messages for all chat data';
END $$;
