-- Fix chat_messages and chat_sessions RLS policies
-- Issue: Missing INSERT/UPDATE/DELETE policies causing 403 errors
-- Date: November 4, 2025

-- ========================================
-- 1. Drop existing restrictive policies
-- ========================================

-- Drop all existing chat_messages policies
DROP POLICY IF EXISTS "Users can read own messages" ON chat_messages;
DROP POLICY IF EXISTS "Service role full access messages" ON chat_messages;
DROP POLICY IF EXISTS "Service role full access chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages from own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages in own sessions" ON chat_messages;

-- Drop all existing chat_sessions policies
DROP POLICY IF EXISTS "Users can read own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role full access sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role full access chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

-- ========================================
-- 2. Create comprehensive policies for chat_sessions
-- ========================================

-- Allow authenticated users to SELECT their own sessions
CREATE POLICY "authenticated_select_own_sessions" ON chat_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to INSERT their own sessions
CREATE POLICY "authenticated_insert_own_sessions" ON chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own sessions
CREATE POLICY "authenticated_update_own_sessions" ON chat_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to DELETE their own sessions
CREATE POLICY "authenticated_delete_own_sessions" ON chat_sessions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow anon users full access (for testing/development)
CREATE POLICY "anon_full_access_sessions" ON chat_sessions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "service_role_full_access_sessions" ON chat_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 3. Create comprehensive policies for chat_messages
-- ========================================

-- Allow authenticated users to SELECT messages from their sessions
CREATE POLICY "authenticated_select_own_messages" ON chat_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow authenticated users to INSERT messages in their sessions
CREATE POLICY "authenticated_insert_own_messages" ON chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow authenticated users to UPDATE messages in their sessions
CREATE POLICY "authenticated_update_own_messages" ON chat_messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow authenticated users to DELETE messages in their sessions
CREATE POLICY "authenticated_delete_own_messages" ON chat_messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow anon users full access (for testing/development)
CREATE POLICY "anon_full_access_messages" ON chat_messages
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "service_role_full_access_messages" ON chat_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 4. Ensure RLS is enabled
-- ========================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. Grant necessary table permissions
-- ========================================

GRANT ALL ON chat_sessions TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_sessions TO anon;
GRANT ALL ON chat_messages TO anon;

-- ========================================
-- 6. Verification query
-- ========================================

-- Check policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('chat_sessions', 'chat_messages')
ORDER BY tablename, policyname;
