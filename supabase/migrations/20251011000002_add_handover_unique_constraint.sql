-- Add unique constraint for UPSERT logic
-- Ensures one handover per user + solution + yacht combination

ALTER TABLE public.handover_yacht
ADD CONSTRAINT handover_yacht_user_solution_yacht_key
UNIQUE (user_id, solution_id, yacht_id);

COMMENT ON CONSTRAINT handover_yacht_user_solution_yacht_key ON public.handover_yacht
IS 'Ensures UPSERT works: one handover per user + solution + yacht';
