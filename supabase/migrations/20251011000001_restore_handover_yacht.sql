-- Restore handover_yacht table with original schema
-- From: /Users/celeste7/Downloads/Supabase Snippet SQL Query (3).csv

CREATE TABLE IF NOT EXISTS public.handover_yacht (
    handover_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    yacht_id TEXT NOT NULL,
    solution_id UUID NOT NULL,
    document_name TEXT,
    document_path TEXT,
    document_page NUMERIC,
    system_affected TEXT,
    fault_code TEXT,
    symptoms JSONB,
    actions_taken JSONB,
    duration_minutes INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_handover_user_yacht ON public.handover_yacht(user_id, yacht_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handover_solution ON public.handover_yacht(solution_id);
CREATE INDEX IF NOT EXISTS idx_handover_status ON public.handover_yacht(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_handover_yacht_updated_at
    BEFORE UPDATE ON public.handover_yacht
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE public.handover_yacht TO anon;
GRANT ALL ON TABLE public.handover_yacht TO authenticated;
GRANT ALL ON TABLE public.handover_yacht TO service_role;

COMMENT ON TABLE public.handover_yacht IS 'Shift handover notes - users annotate search results for next shift';
