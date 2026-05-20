-- Add epistemic origin tracking to core_rules
ALTER TABLE public.core_rules
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'inductive',
  ADD COLUMN IF NOT EXISTS proposed_from_meta_study uuid REFERENCES public.meta_studies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS promoted_by uuid;

ALTER TABLE public.core_rules
  DROP CONSTRAINT IF EXISTS core_rules_origin_check;

ALTER TABLE public.core_rules
  ADD CONSTRAINT core_rules_origin_check
  CHECK (origin IN ('inductive','deductive','hybrid'));

-- Extend meta_studies with structured lesson sections (additive; key_claims kept for back-compat).
ALTER TABLE public.meta_studies
  ADD COLUMN IF NOT EXISTS architectural_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS methodological_recipes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vocabularies_standards jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quantitative_parameters jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS anti_patterns_pitfalls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS open_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposed_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extraction_schema_version text NOT NULL DEFAULT 'v1';