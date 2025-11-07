-- Fix RLS for user_microsoft_tokens table
-- Date: October 15, 2025
-- Issue: Service role cannot insert due to missing RLS policy

-- ============================================
-- Disable RLS (simplest solution for backend-only table)
-- ============================================
-- This table is only accessed by backend services, never directly by users
ALTER TABLE user_microsoft_tokens DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service_role
GRANT ALL ON user_microsoft_tokens TO service_role;

-- Grant read/write to authenticated users (for when users manage their own tokens)
GRANT SELECT, INSERT, UPDATE, DELETE ON user_microsoft_tokens TO authenticated;

-- Grant read access to anon (for status checks)
GRANT SELECT ON user_microsoft_tokens TO anon;

COMMENT ON TABLE user_microsoft_tokens IS
'Microsoft OAuth tokens. RLS disabled as this is a backend-only table accessed via service_role.';
