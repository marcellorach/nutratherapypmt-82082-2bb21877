-- Expand breed_predispositions with genetic + source metadata
ALTER TABLE public.breed_predispositions
  ADD COLUMN IF NOT EXISTS genetic_profile TEXT,
  ADD COLUMN IF NOT EXISTS genetic_profile_en TEXT,
  ADD COLUMN IF NOT EXISTS inheritance_pattern TEXT
    CHECK (inheritance_pattern IS NULL OR inheritance_pattern IN
      ('autosomal_recessive','autosomal_dominant','x_linked_recessive','x_linked_dominant','polygenic','mitochondrial','unknown')),
  ADD COLUMN IF NOT EXISTS prevalence_pct NUMERIC(5,2)
    CHECK (prevalence_pct IS NULL OR (prevalence_pct >= 0 AND prevalence_pct <= 100)),
  ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_breed_predispositions_sources_gin
  ON public.breed_predispositions USING GIN (sources);

-- Add sources column to health_conditions
ALTER TABLE public.health_conditions
  ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_health_conditions_sources_gin
  ON public.health_conditions USING GIN (sources);

COMMENT ON COLUMN public.breed_predispositions.sources IS
  'Array of {label, url, type:omia|pubmed|akc|fci|university|consensus, citation}';
COMMENT ON COLUMN public.health_conditions.sources IS
  'Array of {label, url, type:pubmed|merck|wsava|acvim|university|consensus, citation}';