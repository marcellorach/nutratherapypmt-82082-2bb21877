
-- 1) Synthetic cohorts registry
CREATE TABLE public.synthetic_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('prevention','treatment_validation','exploratory')),
  rationale text,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_n integer NOT NULL DEFAULT 200,
  generated_n integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generating','ready','failed','archived')),
  generation_error text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.synthetic_cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view cohorts"
  ON public.synthetic_cohorts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage cohorts insert"
  ON public.synthetic_cohorts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage cohorts update"
  ON public.synthetic_cohorts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins manage cohorts delete"
  ON public.synthetic_cohorts FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER trg_synthetic_cohorts_updated_at
  BEFORE UPDATE ON public.synthetic_cohorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Mark synthetic pets
ALTER TABLE public.pet_profiles
  ADD COLUMN IF NOT EXISTS is_synthetic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.synthetic_cohorts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pet_profiles_cohort_id ON public.pet_profiles(cohort_id);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_is_synthetic ON public.pet_profiles(is_synthetic) WHERE is_synthetic = true;

-- Allow admins to delete synthetic pets in bulk
CREATE POLICY "Admins can delete synthetic pets"
  ON public.pet_profiles FOR DELETE
  USING (is_synthetic = true AND public.is_admin());

-- Allow admins to insert pets without RLS owner check when seeding cohorts
CREATE POLICY "Admins can insert synthetic pets"
  ON public.pet_profiles FOR INSERT
  WITH CHECK (public.is_admin() AND is_synthetic = true);

-- 3) Cohort-derived insights for Population Insights v0
CREATE TABLE public.cohort_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES public.synthetic_cohorts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('discovery','hypothesis','proposed_meta_study','approved')),
  stage text NOT NULL DEFAULT 'discovery' CHECK (stage IN ('discovery','hypothesis','proposed_meta_study','approved')),
  title text NOT NULL,
  title_en text,
  summary text NOT NULL,
  summary_en text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(4,3) DEFAULT 0.0,
  signals jsonb DEFAULT '[]'::jsonb,
  source_model text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cohort_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view insights"
  ON public.cohort_insights FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins insert insights"
  ON public.cohort_insights FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update insights"
  ON public.cohort_insights FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins delete insights"
  ON public.cohort_insights FOR DELETE
  USING (public.is_admin());

CREATE INDEX idx_cohort_insights_cohort ON public.cohort_insights(cohort_id);
CREATE INDEX idx_cohort_insights_stage ON public.cohort_insights(stage);

CREATE TRIGGER trg_cohort_insights_updated_at
  BEFORE UPDATE ON public.cohort_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
