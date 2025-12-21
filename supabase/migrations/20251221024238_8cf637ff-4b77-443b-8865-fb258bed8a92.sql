-- Tabela para persistir sugestões de IA para taxonomia
CREATE TABLE public.taxonomy_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name text NOT NULL,
  suggested_category text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning text,
  alternative_categories text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  source_entity_ids text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.taxonomy_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view taxonomy suggestions"
  ON public.taxonomy_suggestions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage taxonomy suggestions"
  ON public.taxonomy_suggestions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Index for performance
CREATE INDEX idx_taxonomy_suggestions_status ON public.taxonomy_suggestions(status);
CREATE INDEX idx_taxonomy_suggestions_category ON public.taxonomy_suggestions(suggested_category);

-- Trigger for updated_at
CREATE TRIGGER update_taxonomy_suggestions_updated_at
  BEFORE UPDATE ON public.taxonomy_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();