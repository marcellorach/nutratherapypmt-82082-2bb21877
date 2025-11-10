-- =========================================
-- MIGRATION: Add Missing Tables (Outcomes & Related)
-- =========================================

-- Create outcome_families table
CREATE TABLE IF NOT EXISTS public.outcome_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'Target',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.outcome_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view outcome families"
  ON public.outcome_families FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage outcome families"
  ON public.outcome_families FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create nutraceutical_outcomes table
CREATE TABLE IF NOT EXISTS public.nutraceutical_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  outcome_family_id UUID NOT NULL REFERENCES public.outcome_families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  efficacy_score INTEGER CHECK (efficacy_score >= 0 AND efficacy_score <= 5),
  evidence_quality TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nutraceutical_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nutraceutical outcomes"
  ON public.nutraceutical_outcomes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage nutraceutical outcomes"
  ON public.nutraceutical_outcomes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing column to scispace_imports (rename import_date to imported_at for consistency)
ALTER TABLE public.scispace_imports 
  RENAME COLUMN import_date TO imported_at;

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_outcome_families_updated_at BEFORE UPDATE ON public.outcome_families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutraceutical_outcomes_updated_at BEFORE UPDATE ON public.nutraceutical_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default outcome families for testing
INSERT INTO public.outcome_families (name, description, color, icon, sort_order)
VALUES 
  ('Longevidade', 'Promove longevidade e saúde a longo prazo', '#10b981', 'Heart', 1),
  ('Cognição', 'Melhora funções cognitivas e saúde cerebral', '#3b82f6', 'Brain', 2),
  ('Metabolismo', 'Otimiza função metabólica', '#f59e0b', 'Activity', 3),
  ('Imunidade', 'Fortalece o sistema imunológico', '#8b5cf6', 'Shield', 4)
ON CONFLICT (name) DO NOTHING;