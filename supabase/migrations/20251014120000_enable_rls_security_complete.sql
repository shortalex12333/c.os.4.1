-- Enable Row Level Security on ALL tables - DEFENSIVE VERSION
-- Date: October 14, 2025
-- Purpose: CRITICAL SECURITY FIX - Enable RLS with proper policies

-- Helper function to safely create policy
CREATE OR REPLACE FUNCTION create_policy_if_table_exists(
    table_name text,
    policy_name text,
    policy_sql text
) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
        EXECUTE policy_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all existing tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Users table
SELECT create_policy_if_table_exists(
    'users_yacht',
    'Users can read own data',
    'CREATE POLICY "Users can read own data" ON public.users_yacht FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'users_yacht',
    'Users can update own data',
    'CREATE POLICY "Users can update own data" ON public.users_yacht FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'users_yacht',
    'Service role full access users',
    'CREATE POLICY "Service role full access users" ON public.users_yacht FOR ALL TO service_role USING (true)'
);

-- Emails table
SELECT create_policy_if_table_exists(
    'emails_yacht',
    'Users can read own contacts',
    'CREATE POLICY "Users can read own contacts" ON public.emails_yacht FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'emails_yacht',
    'Users can manage own contacts',
    'CREATE POLICY "Users can manage own contacts" ON public.emails_yacht FOR ALL USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'emails_yacht',
    'Service role full access contacts',
    'CREATE POLICY "Service role full access contacts" ON public.emails_yacht FOR ALL TO service_role USING (true)'
);

-- Chat messages
SELECT create_policy_if_table_exists(
    'chat_messages',
    'Users can read own messages',
    'CREATE POLICY "Users can read own messages" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid()))'
);

SELECT create_policy_if_table_exists(
    'chat_messages',
    'Service role full access messages',
    'CREATE POLICY "Service role full access messages" ON public.chat_messages FOR ALL TO service_role USING (true)'
);

-- Chat sessions
SELECT create_policy_if_table_exists(
    'chat_sessions',
    'Users can read own sessions',
    'CREATE POLICY "Users can read own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'chat_sessions',
    'Users can manage own sessions',
    'CREATE POLICY "Users can manage own sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'chat_sessions',
    'Service role full access sessions',
    'CREATE POLICY "Service role full access sessions" ON public.chat_sessions FOR ALL TO service_role USING (true)'
);

-- Documents
SELECT create_policy_if_table_exists(
    'document_yacht',
    'Users can read own documents',
    'CREATE POLICY "Users can read own documents" ON public.document_yacht FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'document_yacht',
    'Service role full access documents',
    'CREATE POLICY "Service role full access documents" ON public.document_yacht FOR ALL TO service_role USING (true)'
);

-- Fault codes (public read)
SELECT create_policy_if_table_exists(
    'fault_codes',
    'Anyone can read fault codes',
    'CREATE POLICY "Anyone can read fault codes" ON public.fault_codes FOR SELECT TO authenticated USING (true)'
);

SELECT create_policy_if_table_exists(
    'fault_codes',
    'Service role full access fault codes',
    'CREATE POLICY "Service role full access fault codes" ON public.fault_codes FOR ALL TO service_role USING (true)'
);

-- Service role full access for all other tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Service role full access ' || r.tablename, r.tablename);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true)', 'Service role full access ' || r.tablename, r.tablename);
    END LOOP;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS create_policy_if_table_exists;
