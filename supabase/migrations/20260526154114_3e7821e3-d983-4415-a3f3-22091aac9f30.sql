ALTER TABLE public.cohort_suggestions
  ADD COLUMN IF NOT EXISTS pattern_family text,
  ADD COLUMN IF NOT EXISTS value_to_partner text,
  ADD COLUMN IF NOT EXISTS cohort_population text,
  ADD COLUMN IF NOT EXISTS record_requirements jsonb,
  ADD COLUMN IF NOT EXISTS target_model_id text,
  ADD COLUMN IF NOT EXISTS target_model_expected_gain text,
  ADD COLUMN IF NOT EXISTS breadth text;

ALTER TABLE public.cohort_suggestions
  DROP CONSTRAINT IF EXISTS cohort_suggestions_cohort_population_check;
ALTER TABLE public.cohort_suggestions
  ADD CONSTRAINT cohort_suggestions_cohort_population_check
  CHECK (cohort_population IS NULL OR cohort_population IN ('living','deceased','mixed'));

ALTER TABLE public.cohort_suggestions
  DROP CONSTRAINT IF EXISTS cohort_suggestions_breadth_check;
ALTER TABLE public.cohort_suggestions
  ADD CONSTRAINT cohort_suggestions_breadth_check
  CHECK (breadth IS NULL OR breadth IN ('broad','stratified'));

ALTER TABLE public.cohort_suggestions
  DROP CONSTRAINT IF EXISTS cohort_suggestions_target_model_id_check;
ALTER TABLE public.cohort_suggestions
  ADD CONSTRAINT cohort_suggestions_target_model_id_check
  CHECK (target_model_id IS NULL OR target_model_id IN (
    'efficacy-prediction','disease-progression','cost-benefit-analysis',
    'patient-segmentation','mortality-risk-window','treatment-adherence'
  ));