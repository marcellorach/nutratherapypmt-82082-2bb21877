-- Drop the existing CHECK constraint on source column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'veterinary_ontology_source_check' 
    AND conrelid = 'public.veterinary_ontology'::regclass
  ) THEN
    ALTER TABLE public.veterinary_ontology DROP CONSTRAINT veterinary_ontology_source_check;
  END IF;
END $$;

-- Add new CHECK constraint that accepts all existing and new source values
ALTER TABLE public.veterinary_ontology 
ADD CONSTRAINT veterinary_ontology_source_check 
CHECK (source IN ('manual', 'seed', 'import', 'gemini_extraction', 'ai_extraction', 'pubmed', 'openalex', 'external', 'ChEBI'));