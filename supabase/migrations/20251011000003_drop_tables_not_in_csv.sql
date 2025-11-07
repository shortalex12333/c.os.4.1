-- Drop tables NOT in CSV schema
-- CSV tables: chat_messages, chat_session_summaries, chat_sessions, document_yacht,
--             emails_yacht, fault_yacht, handover_yacht, resolution_yacht,
--             user_microsoft_tokens, users_yacht

-- Drop tables not in CSV
DROP TABLE IF EXISTS public.document_effectiveness_yacht CASCADE;
DROP TABLE IF EXISTS public.email_effectiveness_yacht CASCADE;
DROP TABLE IF EXISTS public.fault_codes CASCADE;
DROP TABLE IF EXISTS public.fault_resolutions_yacht CASCADE;
DROP TABLE IF EXISTS public.resolutions_yacht CASCADE;
DROP TABLE IF EXISTS public.sender_reputation_yacht CASCADE;
DROP TABLE IF EXISTS public.user_email_tokens CASCADE;

-- Note: email_contacts_yacht might be emails_yacht from CSV - keeping it
-- If it needs to be renamed, we can do that separately

COMMENT ON DATABASE postgres IS 'Cleaned up - only tables from CSV schema remain';
