-- Add soft delete support for chat sessions
-- Created: 2025-10-02
-- Purpose: Allow users to "delete" chats without permanently removing them

-- Add deleted column to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Create index for filtering non-deleted sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_deleted ON chat_sessions(deleted) WHERE deleted = FALSE;

-- Drop existing view before recreating with new column
DROP VIEW IF EXISTS chat_session_summaries;

-- Recreate the chat_session_summaries view to include deleted column
CREATE VIEW chat_session_summaries AS
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
    cs.deleted,
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
WHERE cs.deleted = FALSE -- Only show non-deleted chats
ORDER BY cs.updated_at DESC;

-- Comment on column
COMMENT ON COLUMN chat_sessions.deleted IS 'Soft delete flag - allows users to delete chats without permanently removing data';
