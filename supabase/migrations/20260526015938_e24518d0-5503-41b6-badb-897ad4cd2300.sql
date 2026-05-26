ALTER TABLE public.cohort_suggestions
  ADD COLUMN IF NOT EXISTS originality_score numeric,
  ADD COLUMN IF NOT EXISTS originality_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS originality_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS originality_status text;