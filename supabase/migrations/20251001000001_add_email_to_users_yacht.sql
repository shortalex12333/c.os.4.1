-- Add email column to users_yacht for direct querying
ALTER TABLE public.users_yacht ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_yacht_email ON public.users_yacht(email);

-- Update existing records to populate email from auth.users
UPDATE public.users_yacht
SET email = au.email
FROM auth.users au
WHERE users_yacht.user_id = au.id;