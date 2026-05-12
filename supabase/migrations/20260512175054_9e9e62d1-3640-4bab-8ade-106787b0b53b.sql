ALTER TABLE public.pet_consultations
  ADD COLUMN IF NOT EXISTS assessment_interpretation jsonb,
  ADD COLUMN IF NOT EXISTS machine_summary text;