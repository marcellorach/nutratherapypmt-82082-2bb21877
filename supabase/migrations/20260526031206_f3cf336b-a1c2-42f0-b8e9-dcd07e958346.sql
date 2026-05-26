
ALTER TABLE public.cohort_insights
  ADD COLUMN IF NOT EXISTS originality_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS originality_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS originality_evidence jsonb;

CREATE INDEX IF NOT EXISTS idx_cohort_insights_originality ON public.cohort_insights(originality_status);
