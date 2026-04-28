CREATE TABLE IF NOT EXISTS public.compound_dosage_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_name_en text NOT NULL,
  condition_name_en text,
  species text NOT NULL DEFAULT 'canine',
  min_mg_per_kg numeric,
  max_mg_per_kg numeric,
  unit text NOT NULL DEFAULT 'mg/kg',
  frequency_per_day numeric,
  route text,
  max_daily_mg numeric,
  source_type text NOT NULL CHECK (source_type IN (
    'kg_triplet', 'curated_study', 'web_authoritative', 'llm_estimate', 'manual'
  )),
  source_url text,
  source_citation text,
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  needs_review boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  curated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  curated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_compound_dosage_ref
  ON public.compound_dosage_reference (
    lower(compound_name_en),
    lower(coalesce(condition_name_en, '__any__')),
    species
  );

CREATE INDEX IF NOT EXISTS idx_compound_dosage_ref_compound
  ON public.compound_dosage_reference (lower(compound_name_en));
CREATE INDEX IF NOT EXISTS idx_compound_dosage_ref_review
  ON public.compound_dosage_reference (needs_review) WHERE needs_review = true;

CREATE TRIGGER trg_compound_dosage_ref_updated
  BEFORE UPDATE ON public.compound_dosage_reference
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.compound_dosage_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read dosage reference"
  ON public.compound_dosage_reference
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert dosage reference"
  ON public.compound_dosage_reference
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update dosage reference"
  ON public.compound_dosage_reference
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete dosage reference"
  ON public.compound_dosage_reference
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.dosage_lookup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_name text NOT NULL,
  condition_name text,
  species text NOT NULL DEFAULT 'canine',
  pet_weight_kg numeric,
  pet_id uuid,
  resolved_source text NOT NULL,
  resolved_min_per_kg numeric,
  resolved_max_per_kg numeric,
  resolved_recommended_mg_total numeric,
  reference_id uuid REFERENCES public.compound_dosage_reference(id) ON DELETE SET NULL,
  fallback_reason text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dosage_lookup_log_compound
  ON public.dosage_lookup_log (lower(compound_name), lower(coalesce(condition_name, '')));
CREATE INDEX IF NOT EXISTS idx_dosage_lookup_log_created
  ON public.dosage_lookup_log (created_at DESC);

ALTER TABLE public.dosage_lookup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read dosage log"
  ON public.dosage_lookup_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert dosage log"
  ON public.dosage_lookup_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can delete dosage log"
  ON public.dosage_lookup_log
  FOR DELETE TO authenticated USING (public.is_admin());