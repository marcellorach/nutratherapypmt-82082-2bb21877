
-- ============================================================
-- META-KG: Governance tables for architectural Core Rules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.core_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id text NOT NULL UNIQUE,              -- e.g. 'RC-001'
  title text NOT NULL,
  title_en text,
  category text NOT NULL,                    -- e.g. 'data-integrity', 'curation', 'translation'
  status text NOT NULL DEFAULT 'active',     -- 'active' | 'planned' | 'deprecated'
  version text NOT NULL DEFAULT '1.0.0',
  justification text NOT NULL,
  justification_en text,
  application text,                          -- where in the codebase it is enforced
  application_en text,
  evidence_summary text,
  doc_anchor text,                           -- anchor in docs/CORE_RULES.md (e.g. '#rc-001')
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meta_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text,
  year int,
  journal text,
  doi text,
  source_url text,
  pdf_storage_path text,
  kind text NOT NULL DEFAULT 'architectural',  -- 'translational' | 'architectural' | 'methodological' | 'inspiration'
  summary text,
  key_claims jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{claim, page, quote, weight}]
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.core_rule_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.core_rules(id) ON DELETE CASCADE,
  meta_study_id uuid NOT NULL REFERENCES public.meta_studies(id) ON DELETE CASCADE,
  relation text NOT NULL,                    -- 'supports' | 'contradicts' | 'modulates_weight' | 'inspires'
  weight numeric NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  quote text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, meta_study_id, relation)
);

CREATE TABLE IF NOT EXISTS public.core_rule_modulators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.core_rules(id) ON DELETE CASCADE,
  domain text NOT NULL,                      -- e.g. 'metabolic', 'degenerative', 'cognitive'
  source_species text NOT NULL,              -- e.g. 'human', 'rat', 'canine'
  target_species text NOT NULL,              -- e.g. 'canine'
  weight numeric NOT NULL CHECK (weight >= 0 AND weight <= 1),
  rationale text,
  is_active boolean NOT NULL DEFAULT false,  -- feature-flagged: off until validated
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, domain, source_species, target_species)
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_core_rules_updated_at ON public.core_rules;
CREATE TRIGGER trg_core_rules_updated_at BEFORE UPDATE ON public.core_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_meta_studies_updated_at ON public.meta_studies;
CREATE TRIGGER trg_meta_studies_updated_at BEFORE UPDATE ON public.meta_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_core_rule_modulators_updated_at ON public.core_rule_modulators;
CREATE TRIGGER trg_core_rule_modulators_updated_at BEFORE UPDATE ON public.core_rule_modulators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.core_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_rule_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_rule_modulators ENABLE ROW LEVEL SECURITY;

-- core_rules: signed-in read, admin write
CREATE POLICY "core_rules_select_authenticated" ON public.core_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "core_rules_admin_all" ON public.core_rules
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- meta_studies: signed-in read, admin write
CREATE POLICY "meta_studies_select_authenticated" ON public.meta_studies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "meta_studies_admin_all" ON public.meta_studies
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- evidence + modulators: admin-only (internal governance)
CREATE POLICY "core_rule_evidence_admin_all" ON public.core_rule_evidence
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "core_rule_evidence_select_authenticated" ON public.core_rule_evidence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "core_rule_modulators_admin_all" ON public.core_rule_modulators
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "core_rule_modulators_select_authenticated" ON public.core_rule_modulators
  FOR SELECT TO authenticated USING (true);

-- Storage bucket for meta-study PDFs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meta_studies_pdfs', 'meta_studies_pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "meta_studies_pdfs_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'meta_studies_pdfs' AND public.is_admin())
  WITH CHECK (bucket_id = 'meta_studies_pdfs' AND public.is_admin());
