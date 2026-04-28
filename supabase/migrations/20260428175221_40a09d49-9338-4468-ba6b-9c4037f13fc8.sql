-- 1. Aging curves by size category (seeded with Dog Aging Project / Kraus 2013 derived params)
CREATE TABLE IF NOT EXISTS public.breed_aging_curves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size_category TEXT NOT NULL UNIQUE CHECK (size_category IN ('small', 'medium', 'large', 'giant')),
  -- Gompertz: h(t) = alpha * exp(beta * t)
  gompertz_alpha NUMERIC(8,6) NOT NULL,
  gompertz_beta NUMERIC(8,6) NOT NULL,
  median_lifespan_years NUMERIC(4,2) NOT NULL,
  mortality_doubling_years NUMERIC(4,2) NOT NULL,
  aging_acceleration_factor NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL DEFAULT 'Dog Aging Project / Kraus 2013',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.breed_aging_curves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view aging curves"
  ON public.breed_aging_curves FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage aging curves"
  ON public.breed_aging_curves FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_breed_aging_curves_updated_at
  BEFORE UPDATE ON public.breed_aging_curves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed curves (parameters calibrated so median lifespan reproduces empirical values)
INSERT INTO public.breed_aging_curves
  (size_category, gompertz_alpha, gompertz_beta, median_lifespan_years, mortality_doubling_years, aging_acceleration_factor, notes)
VALUES
  ('small',  0.000420, 0.380000, 14.5, 1.82, 0.90, 'Pequenos: maior longevidade, envelhecimento mais lento'),
  ('medium', 0.000680, 0.420000, 12.5, 1.65, 1.05, 'Porte médio: referência'),
  ('large',  0.001100, 0.470000, 10.5, 1.48, 1.25, 'Grandes: aceleração ~25%'),
  ('giant',  0.001800, 0.520000,  8.5, 1.33, 1.45, 'Gigantes: aceleração ~45%, vida média mais curta')
ON CONFLICT (size_category) DO NOTHING;

-- 2. Cache for AI-generated trajectory projections
CREATE TABLE IF NOT EXISTS public.pet_trajectory_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  context_hash TEXT NOT NULL,
  with_intervention BOOLEAN NOT NULL DEFAULT FALSE,
  projection_data JSONB NOT NULL,
  citations JSONB,
  years_gained NUMERIC(4,2),
  baseline_biological_age NUMERIC(4,2),
  baseline_remaining_years NUMERIC(4,2),
  model_used TEXT,
  source TEXT NOT NULL DEFAULT 'ai_kg_grounded' CHECK (source IN ('ai_kg_grounded','heuristic_fallback')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pet_id, context_hash, with_intervention)
);

CREATE INDEX IF NOT EXISTS idx_pet_traj_pet ON public.pet_trajectory_projections(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_traj_expires ON public.pet_trajectory_projections(expires_at);

ALTER TABLE public.pet_trajectory_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trajectory projections"
  ON public.pet_trajectory_projections FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert trajectory projections"
  ON public.pet_trajectory_projections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update trajectory projections"
  ON public.pet_trajectory_projections FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete trajectory projections"
  ON public.pet_trajectory_projections FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_pet_trajectory_projections_updated_at
  BEFORE UPDATE ON public.pet_trajectory_projections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();