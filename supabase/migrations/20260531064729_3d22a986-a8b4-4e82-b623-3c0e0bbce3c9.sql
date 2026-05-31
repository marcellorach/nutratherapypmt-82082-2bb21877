-- Remove failed v7.0.0 placeholder so the next regeneration starts clean
DELETE FROM public.technical_audits WHERE id = 'v7.0.0';

-- Allow the edge function to persist the outline for retomada por bloco
ALTER TABLE public.technical_audits
  ADD COLUMN IF NOT EXISTS outline jsonb;