-- Force disable all RLS policies and RLS itself
-- Disable RLS on all tables in public schema (excluding views)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable RLS on all tables in public schema (BASE TABLE only, not views)
    FOR r IN SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.table_name);
        RAISE NOTICE 'Disabled RLS on public.%', r.table_name;
    END LOOP;
END $$;

-- Grant full permissions to anon role on all tables (excluding views)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO anon', r.table_name);
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO authenticated', r.table_name);
        RAISE NOTICE 'Granted all privileges on public.% to anon and authenticated', r.table_name;
    END LOOP;
END $$;