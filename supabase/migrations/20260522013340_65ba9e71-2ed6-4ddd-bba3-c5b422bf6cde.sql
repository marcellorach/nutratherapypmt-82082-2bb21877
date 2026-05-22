-- Fase A: Lifecycle + Confiabilidade para meta_studies

-- 1. Enum lifecycle
DO $$ BEGIN
  CREATE TYPE public.meta_study_lifecycle AS ENUM ('inbox','triaged','in_review','approved','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Colunas
ALTER TABLE public.meta_studies
  ADD COLUMN IF NOT EXISTS lifecycle_status public.meta_study_lifecycle NOT NULL DEFAULT 'inbox',
  ADD COLUMN IF NOT EXISTS reliability_methodology numeric(2,1) CHECK (reliability_methodology IS NULL OR (reliability_methodology >= 0 AND reliability_methodology <= 5)),
  ADD COLUMN IF NOT EXISTS reliability_evidence_base numeric(2,1) CHECK (reliability_evidence_base IS NULL OR (reliability_evidence_base >= 0 AND reliability_evidence_base <= 5)),
  ADD COLUMN IF NOT EXISTS reliability_applicability numeric(2,1) CHECK (reliability_applicability IS NULL OR (reliability_applicability >= 0 AND reliability_applicability <= 5)),
  ADD COLUMN IF NOT EXISTS reliability_reproducibility numeric(2,1) CHECK (reliability_reproducibility IS NULL OR (reliability_reproducibility >= 0 AND reliability_reproducibility <= 5)),
  ADD COLUMN IF NOT EXISTS reliability_relevance numeric(2,1) CHECK (reliability_relevance IS NULL OR (reliability_relevance >= 0 AND reliability_relevance <= 5)),
  ADD COLUMN IF NOT EXISTS reliability_suggested jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reliability_overall numeric(3,2) GENERATED ALWAYS AS (
    CASE
      WHEN reliability_methodology IS NULL
       AND reliability_evidence_base IS NULL
       AND reliability_applicability IS NULL
       AND reliability_reproducibility IS NULL
       AND reliability_relevance IS NULL
      THEN NULL
      ELSE (
        COALESCE(reliability_methodology, 0)
        + COALESCE(reliability_evidence_base, 0)
        + COALESCE(reliability_applicability, 0)
        + COALESCE(reliability_reproducibility, 0)
        + COALESCE(reliability_relevance, 0)
      ) / NULLIF(
        (CASE WHEN reliability_methodology IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN reliability_evidence_base IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN reliability_applicability IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN reliability_reproducibility IS NULL THEN 0 ELSE 1 END)
        + (CASE WHEN reliability_relevance IS NULL THEN 0 ELSE 1 END), 0)
    END
  ) STORED;

-- 3. Índice
CREATE INDEX IF NOT EXISTS meta_studies_lifecycle_idx ON public.meta_studies(lifecycle_status);

-- 4. Backfill: estudos existentes que já têm proposed_rules ou key_claims passam para 'triaged'
UPDATE public.meta_studies
  SET lifecycle_status = 'triaged'
  WHERE lifecycle_status = 'inbox'
    AND (
      jsonb_array_length(COALESCE(proposed_rules, '[]'::jsonb)) > 0
      OR jsonb_array_length(COALESCE(key_claims, '[]'::jsonb)) > 0
    );

-- Estudos que já têm evidências vinculadas a core_rules → 'approved'
UPDATE public.meta_studies ms
  SET lifecycle_status = 'approved'
  WHERE EXISTS (
    SELECT 1 FROM public.core_rule_evidence cre WHERE cre.meta_study_id = ms.id
  );