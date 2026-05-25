ALTER TABLE public.synthetic_cohorts
  ADD COLUMN IF NOT EXISTS progress_log jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.cohort_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  rationale text,
  suggested_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  discoverable text,
  kind text NOT NULL CHECK (kind IN ('prevention','treatment_validation','exploratory')),
  impact_score numeric,
  viability_score numeric,
  source_model text,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','dismissed','used')),
  used_cohort_id uuid REFERENCES public.synthetic_cohorts(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cohort_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated view suggestions" ON public.cohort_suggestions;
CREATE POLICY "Authenticated view suggestions" ON public.cohort_suggestions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins insert suggestions" ON public.cohort_suggestions;
CREATE POLICY "Admins insert suggestions" ON public.cohort_suggestions
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins update suggestions" ON public.cohort_suggestions;
CREATE POLICY "Admins update suggestions" ON public.cohort_suggestions
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins delete suggestions" ON public.cohort_suggestions;
CREATE POLICY "Admins delete suggestions" ON public.cohort_suggestions
  FOR DELETE USING (is_admin());

DROP TRIGGER IF EXISTS trg_cohort_suggestions_updated_at ON public.cohort_suggestions;
CREATE TRIGGER trg_cohort_suggestions_updated_at
  BEFORE UPDATE ON public.cohort_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cohort_suggestions_created_at ON public.cohort_suggestions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_suggestions_status ON public.cohort_suggestions (status);