
-- ===== Block 2 — Triplet Verification Infrastructure =====

-- 1. Verification runs (batch-level metadata)
CREATE TABLE public.triplet_verification_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text,
  sampling_strategy jsonb NOT NULL DEFAULT '{}'::jsonb,
  verifier_model_id text NOT NULL,
  n_triplets int NOT NULL DEFAULT 0,
  n_controls int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','aborted')),
  started_at timestamptz,
  finished_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.triplet_verification_runs TO authenticated;
GRANT ALL ON public.triplet_verification_runs TO service_role;
ALTER TABLE public.triplet_verification_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read runs" ON public.triplet_verification_runs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage runs" ON public.triplet_verification_runs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Verification controls (negative + gold-set bank, layered)
-- layer values document the layered design:
--   backbone_swap          → real triplet + real chunk that does NOT support it (provenance mismatch)
--   pubmed_null            → null-result PubMed abstract, claim phrased as positive
--   realistic_cross_species→ rodent/human finding asserted as canine (RC-003 trigger)
--   realistic_breed_general→ breed-specific finding generalised to all dogs
--   realistic_preliminary  → preliminary/in-vitro finding asserted as established clinical
--   synthetic_floor        → hand-built sanity-check pairs (cap ~5–8)
--   gold_set               → REAL triplets manually labelled by a vet (highest value)
CREATE TABLE public.verification_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer text NOT NULL CHECK (layer IN (
    'backbone_swap','pubmed_null','realistic_cross_species',
    'realistic_breed_general','realistic_preliminary','synthetic_floor','gold_set'
  )),
  subject_name text NOT NULL,
  predicate text NOT NULL,
  object_name text NOT NULL,
  source_study_id uuid REFERENCES public.processed_studies(id) ON DELETE SET NULL,
  source_chunk_id uuid REFERENCES public.study_embeddings(id) ON DELETE SET NULL,
  source_text text,
  expected_verdict text NOT NULL CHECK (expected_verdict IN ('keep','discard','unverifiable')),
  -- For gold_set: triplet_id references the real triplet that was hand-labelled.
  source_triplet_id uuid REFERENCES public.triplet_extractions(id) ON DELETE SET NULL,
  -- For backbone_swap: must be human-reviewed to confirm the swap did NOT
  -- accidentally produce a true relation. Defaults to false → excluded from runs.
  swap_validated boolean NOT NULL DEFAULT false,
  label text,
  notes text,
  control_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_verification_controls_layer ON public.verification_controls(layer) WHERE active;
CREATE INDEX idx_verification_controls_active ON public.verification_controls(active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_controls TO authenticated;
GRANT ALL ON public.verification_controls TO service_role;
ALTER TABLE public.verification_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read controls" ON public.verification_controls
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage controls" ON public.verification_controls
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_verification_controls_updated_at
  BEFORE UPDATE ON public.verification_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Verifications (one row per {triplet|control} × run)
CREATE TABLE public.triplet_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.triplet_verification_runs(id) ON DELETE CASCADE,
  -- Exactly one of triplet_id / control_id is set.
  triplet_id uuid REFERENCES public.triplet_extractions(id) ON DELETE CASCADE,
  control_id uuid REFERENCES public.verification_controls(id) ON DELETE CASCADE,
  verifier_task_id text NOT NULL DEFAULT 'triplet_verification',
  verifier_model_id text NOT NULL,
  source_chunk_ids uuid[] NOT NULL DEFAULT '{}',
  chunk_recall_method text NOT NULL DEFAULT 'embedding_top_k' CHECK (
    chunk_recall_method IN ('embedding_top_k','ilike_fallback','direct_chunk','manual')
  ),
  verdict text NOT NULL CHECK (verdict IN ('keep','correct','discard','unverifiable')),
  rationale text,
  confidence numeric(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  expected_verdict text, -- copied from control for convenience
  matched_expected boolean,
  ai_task_invocation_id uuid REFERENCES public.ai_task_invocations(id) ON DELETE SET NULL,
  latency_ms int,
  cost_estimate numeric(10,6),
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_target_xor CHECK (
    (triplet_id IS NOT NULL AND control_id IS NULL) OR
    (triplet_id IS NULL AND control_id IS NOT NULL)
  )
);
CREATE INDEX idx_triplet_verifications_run ON public.triplet_verifications(run_id);
CREATE INDEX idx_triplet_verifications_triplet ON public.triplet_verifications(triplet_id) WHERE triplet_id IS NOT NULL;
CREATE INDEX idx_triplet_verifications_control ON public.triplet_verifications(control_id) WHERE control_id IS NOT NULL;
CREATE INDEX idx_triplet_verifications_verdict ON public.triplet_verifications(verdict);

GRANT SELECT, INSERT, UPDATE ON public.triplet_verifications TO authenticated;
GRANT ALL ON public.triplet_verifications TO service_role;
ALTER TABLE public.triplet_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read verifications" ON public.triplet_verifications
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Service role writes verifications" ON public.triplet_verifications
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
