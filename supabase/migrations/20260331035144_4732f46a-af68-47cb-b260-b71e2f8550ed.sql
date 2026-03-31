-- Add SNOMED-CT and UMLS standardized nomenclature columns with audit trail
-- health_conditions
ALTER TABLE public.health_conditions
  ADD COLUMN IF NOT EXISTS snomed_code TEXT,
  ADD COLUMN IF NOT EXISTS umls_cui TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ontology_mapped_by TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapping_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_snomed_unique 
  ON public.health_conditions(snomed_code) WHERE snomed_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_umls_unique 
  ON public.health_conditions(umls_cui) WHERE umls_cui IS NOT NULL;

-- nutraceuticals
ALTER TABLE public.nutraceuticals
  ADD COLUMN IF NOT EXISTS snomed_code TEXT,
  ADD COLUMN IF NOT EXISTS umls_cui TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ontology_mapped_by TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapping_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nutra_snomed_unique 
  ON public.nutraceuticals(snomed_code) WHERE snomed_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutra_umls_unique 
  ON public.nutraceuticals(umls_cui) WHERE umls_cui IS NOT NULL;