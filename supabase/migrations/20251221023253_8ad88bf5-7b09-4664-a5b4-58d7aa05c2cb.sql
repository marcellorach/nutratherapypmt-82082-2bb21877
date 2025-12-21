-- Create taxonomy_dictionaries table for managing entity classification dictionaries
CREATE TABLE public.taxonomy_dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'nutraceutical', 'drug', 'enzyme', 'receptor', 'pathway', 'gene_protein', 'mechanism', 'biological_process', 'clinical_outcome', 'species', 'breed', 'cell_type'
  term text NOT NULL,
  term_normalized text NOT NULL, -- lowercase, normalized version for matching
  added_by uuid REFERENCES auth.users(id),
  source text DEFAULT 'manual', -- 'manual', 'imported', 'ai_suggested', 'initial_seed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, term_normalized)
);

-- Enable RLS
ALTER TABLE public.taxonomy_dictionaries ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone authenticated can read, only admins can manage
CREATE POLICY "Anyone authenticated can view taxonomy dictionaries"
ON public.taxonomy_dictionaries
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage taxonomy dictionaries"
ON public.taxonomy_dictionaries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_taxonomy_dictionaries_category ON public.taxonomy_dictionaries(category);
CREATE INDEX idx_taxonomy_dictionaries_term_normalized ON public.taxonomy_dictionaries(term_normalized);

-- Create trigger for updated_at
CREATE TRIGGER update_taxonomy_dictionaries_updated_at
  BEFORE UPDATE ON public.taxonomy_dictionaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();