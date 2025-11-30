-- Add fields to scientific_studies to track source and simulation status
ALTER TABLE public.scientific_studies 
ADD COLUMN IF NOT EXISTS source_api TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS pmid TEXT,
ADD COLUMN IF NOT EXISTS openalex_id TEXT;

-- Create index for external IDs
CREATE INDEX IF NOT EXISTS idx_scientific_studies_pmid ON public.scientific_studies(pmid);
CREATE INDEX IF NOT EXISTS idx_scientific_studies_openalex_id ON public.scientific_studies(openalex_id);
CREATE INDEX IF NOT EXISTS idx_scientific_studies_is_simulated ON public.scientific_studies(is_simulated);

-- Update existing studies to mark as simulated (seed data)
UPDATE public.scientific_studies 
SET is_simulated = true, source_api = 'seed_data'
WHERE source_api IS NULL OR source_api = 'manual';

-- Add comment to document the fields
COMMENT ON COLUMN public.scientific_studies.source_api IS 'Source of the study: manual, pubmed, openalex, seed_data';
COMMENT ON COLUMN public.scientific_studies.is_simulated IS 'Whether this is simulated/demo data';
COMMENT ON COLUMN public.scientific_studies.pmid IS 'PubMed ID if imported from PubMed';
COMMENT ON COLUMN public.scientific_studies.openalex_id IS 'OpenAlex ID if imported from OpenAlex';