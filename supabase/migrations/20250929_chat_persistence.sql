-- Chat Persistence Tables for CelesteOS
-- Created: 2025-09-29
-- Purpose: Enable persistent chat history for yacht crew

-- Create chat_sessions table
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

-- Create chat_messages table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_yacht_id ON chat_sessions(yacht_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder ON chat_sessions(folder);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_index ON chat_messages(session_id, message_index);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_chat_sessions_metadata_gin ON chat_sessions USING GIN (session_metadata);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sources_gin ON chat_messages USING GIN (sources);
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin ON chat_messages USING GIN (metadata);

-- Create function to update message count
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

-- Create trigger to maintain message count
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_message_count();

-- Create function to update session updated_at on message insert/update
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session timestamp updates
CREATE TRIGGER trigger_update_session_timestamp
    AFTER INSERT OR UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all chat sessions
CREATE POLICY "Service role can manage all chat sessions" ON chat_sessions
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- RLS Policies for chat_messages
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

-- Service role can manage all messages
CREATE POLICY "Service role can manage all messages" ON chat_messages
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- Create view for chat session summaries
CREATE OR REPLACE VIEW chat_session_summaries AS
SELECT
    cs.id,
    cs.user_id,
    cs.title,
    cs.created_at,
    cs.updated_at,
    cs.folder,
    cs.yacht_id,
    cs.search_type,
    cs.message_count,
    cs.is_archived,
    -- Get first user message as preview
    (SELECT content FROM chat_messages cm
     WHERE cm.session_id = cs.id AND cm.role = 'user'
     ORDER BY cm.message_index ASC
     LIMIT 1) as first_message_preview,
    -- Get last message timestamp
    (SELECT timestamp FROM chat_messages cm
     WHERE cm.session_id = cs.id
     ORDER BY cm.timestamp DESC
     LIMIT 1) as last_message_at
FROM chat_sessions cs
ORDER BY cs.updated_at DESC;

-- Grant necessary permissions
GRANT ALL ON chat_sessions TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT SELECT ON chat_session_summaries TO authenticated;

-- Comment on tables
COMMENT ON TABLE chat_sessions IS 'Stores chat session metadata for CelesteOS yacht system';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON VIEW chat_session_summaries IS 'Provides summary view of chat sessions with message previews';

-- Sample data will be created when users first log in and create chats
-- No need to insert test data here as it requires existing users