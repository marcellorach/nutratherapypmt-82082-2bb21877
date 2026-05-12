ALTER TABLE public.pet_consultations
  ADD COLUMN IF NOT EXISTS physical_exam jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';