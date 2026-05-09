
-- Princípios ativos (DCI)
CREATE TABLE public.drug_substances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inn_name text NOT NULL UNIQUE,
  inn_name_en text,
  drug_class text,
  drug_class_en text,
  atc_vet_code text,
  mechanism text,
  mechanism_en text,
  common_routes text[] DEFAULT '{}'::text[],
  pediatric_geriatric_notes text,
  contraindicated_breeds text[] DEFAULT '{}'::text[],
  contraindicated_conditions text[] DEFAULT '{}'::text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_drug_substances_inn ON public.drug_substances (lower(inn_name));
CREATE INDEX idx_drug_substances_class ON public.drug_substances (drug_class);

ALTER TABLE public.drug_substances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read drug_substances"
  ON public.drug_substances FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage drug_substances"
  ON public.drug_substances FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_drug_substances_updated_at
  BEFORE UPDATE ON public.drug_substances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marcas comerciais (Brasil + globais)
CREATE TABLE public.drug_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  manufacturer text,
  country text NOT NULL DEFAULT 'BR',
  substance_id uuid NOT NULL REFERENCES public.drug_substances(id) ON DELETE CASCADE,
  dose_form text,
  strengths text[] DEFAULT '{}'::text[],
  vet_label boolean NOT NULL DEFAULT true,
  registration_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_name, country, substance_id)
);

CREATE INDEX idx_drug_brands_name ON public.drug_brands (lower(brand_name));
CREATE INDEX idx_drug_brands_substance ON public.drug_brands (substance_id);
CREATE INDEX idx_drug_brands_country ON public.drug_brands (country);

ALTER TABLE public.drug_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read drug_brands"
  ON public.drug_brands FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage drug_brands"
  ON public.drug_brands FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_drug_brands_updated_at
  BEFORE UPDATE ON public.drug_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Interações (droga↔droga / droga↔nutracêutico / droga↔condição)
CREATE TABLE public.drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substance_a_id uuid NOT NULL REFERENCES public.drug_substances(id) ON DELETE CASCADE,
  substance_b_id uuid REFERENCES public.drug_substances(id) ON DELETE CASCADE,
  nutraceutical_id uuid,
  condition_id uuid,
  severity text NOT NULL CHECK (severity IN ('info','caution','major','contraindicated')),
  mechanism text,
  recommendation text,
  evidence_grade text,
  citations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (substance_b_id IS NOT NULL OR nutraceutical_id IS NOT NULL OR condition_id IS NOT NULL)
);

CREATE INDEX idx_drug_interactions_a ON public.drug_interactions (substance_a_id);
CREATE INDEX idx_drug_interactions_b ON public.drug_interactions (substance_b_id);
CREATE INDEX idx_drug_interactions_nutra ON public.drug_interactions (nutraceutical_id);
CREATE INDEX idx_drug_interactions_cond ON public.drug_interactions (condition_id);

ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read drug_interactions"
  ON public.drug_interactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage drug_interactions"
  ON public.drug_interactions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_drug_interactions_updated_at
  BEFORE UPDATE ON public.drug_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vincular pet_medications ao catálogo
ALTER TABLE public.pet_medications
  ADD COLUMN IF NOT EXISTS substance_id uuid REFERENCES public.drug_substances(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.drug_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS raw_input text;

CREATE INDEX IF NOT EXISTS idx_pet_medications_substance ON public.pet_medications (substance_id);
CREATE INDEX IF NOT EXISTS idx_pet_medications_brand ON public.pet_medications (brand_id);
