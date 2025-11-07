-- Restore October 13 Schema
-- This migration brings the database from Oct 11 state to Oct 13 state
-- Date: October 14, 2025

-- ============================================
-- 1. ADD MISSING COLUMN TO chat_messages
-- ============================================
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS yacht_id TEXT;

-- ============================================
-- 2. ADD MISSING COLUMNS TO document_yacht
-- ============================================
ALTER TABLE document_yacht
ADD COLUMN IF NOT EXISTS helpful_count INTEGER,
ADD COLUMN IF NOT EXISTS chunk_id TEXT,
ADD COLUMN IF NOT EXISTS chunk_text TEXT,
ADD COLUMN IF NOT EXISTS chunk_index INTEGER,
ADD COLUMN IF NOT EXISTS page_num INTEGER,
ADD COLUMN IF NOT EXISTS entities_found JSONB,
ADD COLUMN IF NOT EXISTS entity_weights JSONB,
ADD COLUMN IF NOT EXISTS query TEXT,
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS score NUMERIC,
ADD COLUMN IF NOT EXISTS chunk_metadata JSONB,
ADD COLUMN IF NOT EXISTS is_chunk BOOLEAN;

-- ============================================
-- 3. REMOVE EXTRA COLUMNS FROM emails_yacht
-- ============================================
ALTER TABLE emails_yacht
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS response_time_hours,
DROP COLUMN IF EXISTS reliability_score,
DROP COLUMN IF EXISTS last_contacted,
DROP COLUMN IF EXISTS times_contacted,
DROP COLUMN IF EXISTS successful_resolutions;

-- ============================================
-- 4. ADD MISSING COLUMNS TO user_microsoft_tokens
-- ============================================
ALTER TABLE user_microsoft_tokens
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_secret TEXT,
ADD COLUMN IF NOT EXISTS yacht_id TEXT;

-- ============================================
-- 5. REMOVE EXTRA COLUMNS FROM users_yacht
-- ============================================
ALTER TABLE users_yacht
DROP COLUMN IF EXISTS preferences,
DROP COLUMN IF EXISTS expertise_areas,
DROP COLUMN IF EXISTS certification_level,
DROP COLUMN IF EXISTS years_experience,
DROP COLUMN IF EXISTS primary_language,
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS last_active,
DROP COLUMN IF EXISTS successful_resolutions,
DROP COLUMN IF EXISTS contribution_score;

-- ============================================
-- 6. CREATE INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for chat_messages.yacht_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_yacht_id ON chat_messages(yacht_id);

-- Index for document_yacht new columns
CREATE INDEX IF NOT EXISTS idx_document_yacht_session_id ON document_yacht(session_id);
CREATE INDEX IF NOT EXISTS idx_document_yacht_chunk_id ON document_yacht(chunk_id);
CREATE INDEX IF NOT EXISTS idx_document_yacht_is_chunk ON document_yacht(is_chunk);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_document_yacht_entities_found_gin ON document_yacht USING GIN (entities_found);
CREATE INDEX IF NOT EXISTS idx_document_yacht_entity_weights_gin ON document_yacht USING GIN (entity_weights);
CREATE INDEX IF NOT EXISTS idx_document_yacht_chunk_metadata_gin ON document_yacht USING GIN (chunk_metadata);

-- Index for user_microsoft_tokens.yacht_id
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_yacht_id ON user_microsoft_tokens(yacht_id);

-- ============================================
-- VERIFICATION QUERIES (commented out)
-- ============================================

/*
-- Verify chat_messages columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Verify document_yacht columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'document_yacht'
ORDER BY ordinal_position;

-- Verify emails_yacht columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emails_yacht'
ORDER BY ordinal_position;

-- Verify user_microsoft_tokens columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_microsoft_tokens'
ORDER BY ordinal_position;

-- Verify users_yacht columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users_yacht'
ORDER BY ordinal_position;
*/
