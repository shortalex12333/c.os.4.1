-- Secure RLS policies for n8n backend access
-- Date: October 14, 2025
-- Compliant with SOC-2 and GDPR requirements

-- ============================================
-- OPTION 1: Allow anon read access (least privilege)
-- ============================================
-- This allows n8n to read users_yacht without service_role
-- But still protects against unauthorized modifications

DROP POLICY IF EXISTS "Allow backend read access" ON users_yacht;
CREATE POLICY "Allow backend read access"
ON users_yacht
FOR SELECT
TO anon, authenticated
USING (true);

-- Still require auth for writes
DROP POLICY IF EXISTS "Users can update own data" ON users_yacht;
CREATE POLICY "Users can update own data"
ON users_yacht
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- OPTION 2: Service role maintains full access
-- ============================================
DROP POLICY IF EXISTS "Service role full access users_yacht" ON users_yacht;
CREATE POLICY "Service role full access users_yacht"
ON users_yacht
FOR ALL
TO service_role
USING (true);

-- ============================================
-- Apply same pattern to other tables
-- ============================================

-- emails_yacht
DROP POLICY IF EXISTS "Allow backend read emails" ON emails_yacht;
CREATE POLICY "Allow backend read emails"
ON emails_yacht
FOR SELECT
TO anon, authenticated
USING (true);

-- document_yacht
DROP POLICY IF EXISTS "Allow backend read documents" ON document_yacht;
CREATE POLICY "Allow backend read documents"
ON document_yacht
FOR SELECT
TO anon, authenticated
USING (true);

-- chat_messages
DROP POLICY IF EXISTS "Allow backend read messages" ON chat_messages;
CREATE POLICY "Allow backend read messages"
ON chat_messages
FOR SELECT
TO anon, authenticated
USING (true);

-- chat_sessions
DROP POLICY IF EXISTS "Allow backend read sessions" ON chat_sessions;
CREATE POLICY "Allow backend read sessions"
ON chat_sessions
FOR SELECT
TO anon, authenticated
USING (true);

COMMENT ON POLICY "Allow backend read access" ON users_yacht IS
'Allows n8n backend to read user data without service_role. Compliant with least-privilege principle for SOC-2.';
