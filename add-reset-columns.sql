ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reset_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reset_code_expires timestamptz;
