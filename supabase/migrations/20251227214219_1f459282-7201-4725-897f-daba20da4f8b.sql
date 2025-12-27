-- Create table for storing candidate entities from external sources
CREATE TABLE public.base_knowledge_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity identification
  entity_name TEXT NOT NULL,
  entity_name_en TEXT,
  entity_type TEXT NOT NULL, -- 'nutraceutical', 'condition', 'compound', 'pathway', 'mechanism'
  
  -- External source info
  external_source TEXT NOT NULL, -- 'ChEBI', 'PubChem', 'KEGG', 'MeSH', 'AI_suggested', 'manual'
  external_id TEXT, -- ID in source (e.g., 'CHEBI:27732', 'CID:969516')
  external_url TEXT,
  
  -- Enriched data
  chemical_formula TEXT,
  molecular_weight DECIMAL,
  description TEXT,
  description_en TEXT,
  synonyms TEXT[] DEFAULT '{}',
  
  -- Source metadata
  source_metadata JSONB DEFAULT '{}',
  
  -- Curation status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'merged'
  target_table TEXT, -- 'nutraceuticals', 'health_conditions', 'veterinary_ontology'
  target_id UUID, -- ID after approval
  
  -- Harmonization
  matched_existing_id UUID, -- If duplicate detected
  similarity_score DECIMAL, -- Similarity score with existing
  harmonization_suggestion TEXT,
  
  -- Audit
  created_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_base_knowledge_candidates_status ON public.base_knowledge_candidates(status);
CREATE INDEX idx_base_knowledge_candidates_entity_type ON public.base_knowledge_candidates(entity_type);
CREATE INDEX idx_base_knowledge_candidates_external_source ON public.base_knowledge_candidates(external_source);
CREATE INDEX idx_base_knowledge_candidates_entity_name ON public.base_knowledge_candidates(entity_name);

-- Enable RLS
ALTER TABLE public.base_knowledge_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage base_knowledge_candidates"
ON public.base_knowledge_candidates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "Anyone authenticated can view base_knowledge_candidates"
ON public.base_knowledge_candidates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_base_knowledge_candidates_updated_at
BEFORE UPDATE ON public.base_knowledge_candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();