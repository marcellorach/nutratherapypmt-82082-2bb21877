ALTER TABLE public.triplet_extractions DROP CONSTRAINT IF EXISTS chk_evidence_level;

ALTER TABLE public.triplet_extractions ADD CONSTRAINT chk_evidence_level
  CHECK (
    evidence_level IS NULL OR evidence_level = ANY (ARRAY[
      'meta_analysis'::text,
      'rct'::text,
      'cohort'::text,
      'case_control'::text,
      'case_report'::text,
      'in_vivo'::text,
      'in_vitro'::text,
      'expert_opinion'::text
    ])
  );