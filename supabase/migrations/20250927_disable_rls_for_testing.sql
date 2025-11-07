-- Temporarily disable RLS for testing
-- This should be reverted in production

-- Disable RLS on user_microsoft_tokens table
ALTER TABLE user_microsoft_tokens DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role for testing
GRANT SELECT, INSERT, UPDATE, DELETE ON user_microsoft_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_microsoft_tokens TO authenticated;

-- Comment explaining this is temporary
COMMENT ON TABLE user_microsoft_tokens IS 'RLS DISABLED FOR TESTING - RE-ENABLE IN PRODUCTION';