
ALTER TABLE public.cohort_insights
  ADD COLUMN IF NOT EXISTS vet_review_status text NOT NULL DEFAULT 'pending'
    CHECK (vet_review_status IN ('pending','approved','rejected','needs_changes')),
  ADD COLUMN IF NOT EXISTS vet_review_notes text,
  ADD COLUMN IF NOT EXISTS vet_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS vet_reviewed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_cohort_insights_vet_review_status
  ON public.cohort_insights (vet_review_status);
