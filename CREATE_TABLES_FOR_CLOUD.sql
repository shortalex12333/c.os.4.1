-- ============================================
-- COMPREHENSIVE TABLE CREATION FOR CLOUD
-- ============================================
-- Tables: chat_sessions, chat_messages, document_yacht, yacht_emails,
--         user_microsoft_tokens, users_yacht
-- Includes: Full schemas, indexes, triggers, functions, and RLS policies
-- ============================================

-- ============================================
-- 1. CHAT_SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    folder TEXT DEFAULT NULL,
    yacht_id TEXT DEFAULT NULL,
    search_type TEXT CHECK (search_type IN ('yacht', 'email', 'nas')) DEFAULT 'yacht',
    session_metadata JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0
);

-- ============================================
-- 2. CHAT_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_index INTEGER NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    tokens_used INTEGER DEFAULT NULL,
    confidence_score FLOAT DEFAULT NULL
);

-- ============================================
-- 3. USER_MICROSOFT_TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_microsoft_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    microsoft_user_id TEXT,
    original_email TEXT,
    microsoft_email TEXT,
    display_name TEXT,
    microsoft_access_token TEXT NOT NULL,
    microsoft_refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    scopes TEXT[] DEFAULT ARRAY['Mail.Read', 'User.Read'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. DOCUMENT_YACHT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS document_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_name TEXT NOT NULL,
    document_path TEXT NOT NULL,
    document_type TEXT,
    file_hash TEXT,
    file_size_mb NUMERIC(10,2),
    last_modified TIMESTAMP WITH TIME ZONE,
    times_accessed INTEGER DEFAULT 0,
    times_helpful INTEGER DEFAULT 0,
    times_not_helpful INTEGER DEFAULT 0,
    confidence_level NUMERIC(5,4),
    equipment_covered JSONB DEFAULT '[]',
    first_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_embeddings JSONB DEFAULT '{}',
    fault_resolution_map JSONB DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    yacht_id TEXT,
    solutions_tried JSONB DEFAULT '[]',
    document_name_tokens INTEGER,
    equipment_covered_tokens INTEGER,
    fault_resolution_map_tokens INTEGER,
    solutions_tried_tokens INTEGER,
    patterns JSONB DEFAULT '{}',
    total_uses INTEGER DEFAULT 0,
    successful_uses INTEGER DEFAULT 0,
    effectiveness_score NUMERIC(5,4),
    department VARCHAR(100),
    pattern_matches JSONB DEFAULT '{}',
    equipment_specialization JSONB DEFAULT '{}',
    fault_code_matches JSONB DEFAULT '{}',
    last_pattern_update TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id)
);

-- ============================================
-- 5. YACHT_EMAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS yacht_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subject TEXT,
    content TEXT,
    email_type VARCHAR(50),
    email_embedding vector(1536),
    equipment_mentioned TEXT[],
    part_numbers_mentioned TEXT[],
    sender_domain VARCHAR(100),
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- 6. USERS_YACHT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users_yacht (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    yacht_id TEXT NOT NULL,
    role VARCHAR(50), -- 'owner', 'captain', 'engineer', 'crew', 'guest'
    permissions JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    expertise_areas TEXT[],
    certification_level VARCHAR(50),
    years_experience INTEGER,
    primary_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    last_active TIMESTAMP WITH TIME ZONE,
    total_queries INTEGER DEFAULT 0,
    successful_resolutions INTEGER DEFAULT 0,
    contribution_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR CHAT_SESSIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_yacht_id ON chat_sessions(yacht_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder ON chat_sessions(folder);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_metadata_gin ON chat_sessions USING GIN (session_metadata);

-- ============================================
-- INDEXES FOR CHAT_MESSAGES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_index ON chat_messages(session_id, message_index);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sources_gin ON chat_messages USING GIN (sources);
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin ON chat_messages USING GIN (metadata);

-- ============================================
-- INDEXES FOR USER_MICROSOFT_TOKENS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_user_id ON user_microsoft_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_email ON user_microsoft_tokens(microsoft_email);
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_expires ON user_microsoft_tokens(token_expires_at);

-- ============================================
-- INDEXES FOR DOCUMENT_YACHT
-- ============================================
CREATE INDEX IF NOT EXISTS idx_document_yacht_name ON document_yacht(document_name);
CREATE INDEX IF NOT EXISTS idx_document_yacht_yacht_id ON document_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_document_yacht_department ON document_yacht(department);
CREATE INDEX IF NOT EXISTS idx_document_yacht_effectiveness ON document_yacht(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_document_yacht_equipment_gin ON document_yacht USING GIN (equipment_covered);
CREATE INDEX IF NOT EXISTS idx_document_yacht_patterns_gin ON document_yacht USING GIN (patterns);

-- ============================================
-- INDEXES FOR YACHT_EMAILS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_yacht_emails_type ON yacht_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_yacht_emails_created_at ON yacht_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yacht_emails_sender ON yacht_emails(sender_domain);

-- Vector index for yacht_emails (requires pgvector extension)
CREATE INDEX IF NOT EXISTS idx_yacht_emails_vector
ON yacht_emails USING ivfflat (email_embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- INDEXES FOR USERS_YACHT
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_yacht_yacht ON users_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_users_yacht_role ON users_yacht(role);
CREATE INDEX IF NOT EXISTS idx_users_yacht_active ON users_yacht(last_active DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update message count
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_sessions
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_sessions
        SET message_count = GREATEST(message_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain message count
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_message_count();

-- Function to update session timestamp on message insert/update
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session timestamp updates
CREATE TRIGGER trigger_update_session_timestamp
    AFTER INSERT OR UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_microsoft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_yacht ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR CHAT_SESSIONS
-- ============================================

CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all chat sessions" ON chat_sessions
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- ============================================
-- RLS POLICIES FOR CHAT_MESSAGES
-- ============================================

CREATE POLICY "Users can view messages from own sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in own sessions" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in own sessions" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all chat messages" ON chat_messages
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- ============================================
-- RLS POLICIES FOR USER_MICROSOFT_TOKENS
-- ============================================

CREATE POLICY "Users can access own microsoft tokens" ON user_microsoft_tokens
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage microsoft tokens" ON user_microsoft_tokens
    FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================
-- RLS POLICIES FOR DOCUMENT_YACHT
-- ============================================

CREATE POLICY "Users can view yacht documents" ON document_yacht
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users_yacht
            WHERE users_yacht.user_id = auth.uid()
            AND users_yacht.yacht_id = document_yacht.yacht_id
        )
    );

CREATE POLICY "Users can manage own documents" ON document_yacht
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all documents" ON document_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================
-- RLS POLICIES FOR YACHT_EMAILS
-- ============================================

CREATE POLICY "Public read access" ON yacht_emails
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage yacht emails" ON yacht_emails
    FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================
-- RLS POLICIES FOR USERS_YACHT
-- ============================================

CREATE POLICY "Users can view own profile" ON users_yacht
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users_yacht
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users_yacht
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all user profiles" ON users_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE chat_sessions IS 'Persistent chat sessions with folder organization';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE user_microsoft_tokens IS 'Microsoft OAuth tokens for email integration';
COMMENT ON TABLE document_yacht IS 'Yacht-specific documents with effectiveness tracking';
COMMENT ON TABLE yacht_emails IS 'Yacht-related emails with vector embeddings for semantic search';
COMMENT ON TABLE users_yacht IS 'Yacht user profiles with roles and permissions';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ All tables created successfully!';
    RAISE NOTICE '📋 Tables created: chat_sessions, chat_messages, user_microsoft_tokens, document_yacht, yacht_emails, users_yacht';
    RAISE NOTICE '🔐 RLS policies applied to all tables';
    RAISE NOTICE '📊 All indexes created';
    RAISE NOTICE '⚡ Triggers and functions configured';
END $$;
