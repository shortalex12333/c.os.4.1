-- Rename email_contacts_yacht to emails_yacht to match CSV schema

ALTER TABLE IF EXISTS public.email_contacts_yacht RENAME TO emails_yacht;

COMMENT ON TABLE public.emails_yacht IS 'Email contacts for yacht - renamed from email_contacts_yacht to match CSV schema';
