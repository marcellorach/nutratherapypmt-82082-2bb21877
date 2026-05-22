-- Fase 1: Canonical IDs for cross-ontology identity
ALTER TABLE public.health_conditions
  ADD COLUMN IF NOT EXISTS canonical_id text,
  ADD COLUMN IF NOT EXISTS canonical_source text,
  ADD COLUMN IF NOT EXISTS canonical_mapped_at timestamptz;

ALTER TABLE public.nutraceuticals
  ADD COLUMN IF NOT EXISTS canonical_id text,
  ADD COLUMN IF NOT EXISTS canonical_source text,
  ADD COLUMN IF NOT EXISTS canonical_mapped_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS health_conditions_canonical_uniq
  ON public.health_conditions (canonical_source, canonical_id)
  WHERE canonical_source IS NOT NULL AND canonical_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS nutraceuticals_canonical_uniq
  ON public.nutraceuticals (canonical_source, canonical_id)
  WHERE canonical_source IS NOT NULL AND canonical_id IS NOT NULL;

-- Source allowlist (soft via CHECK; null allowed)
ALTER TABLE public.health_conditions
  DROP CONSTRAINT IF EXISTS health_conditions_canonical_source_chk;
ALTER TABLE public.health_conditions
  ADD CONSTRAINT health_conditions_canonical_source_chk
  CHECK (canonical_source IS NULL OR canonical_source IN ('omia','mesh','mondo','snomed','umls','manual'));

ALTER TABLE public.nutraceuticals
  DROP CONSTRAINT IF EXISTS nutraceuticals_canonical_source_chk;
ALTER TABLE public.nutraceuticals
  ADD CONSTRAINT nutraceuticals_canonical_source_chk
  CHECK (canonical_source IS NULL OR canonical_source IN ('chebi','pubchem','mesh','kegg','manual'));

-- Negative-evidence flag on triplets
ALTER TABLE public.triplet_extractions
  ADD COLUMN IF NOT EXISTS evidence_polarity text NOT NULL DEFAULT 'positive';

ALTER TABLE public.triplet_extractions
  DROP CONSTRAINT IF EXISTS triplet_extractions_evidence_polarity_chk;
ALTER TABLE public.triplet_extractions
  ADD CONSTRAINT triplet_extractions_evidence_polarity_chk
  CHECK (evidence_polarity IN ('positive','negative','neutral','inconclusive'));

CREATE INDEX IF NOT EXISTS triplet_extractions_polarity_idx
  ON public.triplet_extractions (evidence_polarity)
  WHERE evidence_polarity <> 'positive';

-- Backfill: any existing FAILS_TO_TREAT-style predicate becomes negative
UPDATE public.triplet_extractions
   SET evidence_polarity = 'negative'
 WHERE evidence_polarity = 'positive'
   AND (
        predicate ILIKE 'fails_to_treat%'
     OR predicate ILIKE 'no_effect%'
     OR predicate ILIKE 'worsens%'
     OR predicate ILIKE 'contraindicat%'
   );