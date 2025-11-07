-- Drop all views that reference query_history_yacht
-- Created: 2025-10-01
-- Purpose: Remove remaining references to deleted query_history_yacht table

-- Drop views in correct order (dependencies first)
DROP VIEW IF EXISTS search_analytics_view CASCADE;
DROP VIEW IF EXISTS user_yacht_activity CASCADE;
DROP VIEW IF EXISTS system_health_overview CASCADE;

-- Verify no remaining references
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE view_definition LIKE '%query_history_yacht%'
      AND table_schema = 'public';

    IF view_count > 0 THEN
        RAISE WARNING 'Still found % views referencing query_history_yacht', view_count;
    ELSE
        RAISE NOTICE '✅ All query_history_yacht view references removed';
    END IF;
END $$;
