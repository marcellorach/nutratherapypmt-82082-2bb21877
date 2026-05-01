ALTER TABLE public.triplet_extractions
  ADD COLUMN IF NOT EXISTS enrichment_source text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS enrichment_confidence numeric,
  ADD COLUMN IF NOT EXISTS enrichment_needs_review boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrichment_at timestamp with time zone;

ALTER TABLE public.triplet_extractions
  DROP CONSTRAINT IF EXISTS chk_enrichment_source;
ALTER TABLE public.triplet_extractions
  ADD CONSTRAINT chk_enrichment_source
  CHECK (enrichment_source IN ('none','extracted','llm','human','llm_low_confidence'));

CREATE INDEX IF NOT EXISTS idx_triplet_enrichment_review
  ON public.triplet_extractions (enrichment_needs_review)
  WHERE enrichment_needs_review = true;

CREATE INDEX IF NOT EXISTS idx_triplet_enrichment_source
  ON public.triplet_extractions (enrichment_source);

CREATE TABLE IF NOT EXISTS public.enrichment_qa_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triplet_id uuid NOT NULL REFERENCES public.triplet_extractions(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL,
  ai_evidence_level text,
  ai_intensity numeric,
  ai_confidence numeric,
  ai_rationale text,
  human_evidence_level_ok boolean,
  human_intensity_ok boolean,
  human_overall_ok boolean,
  human_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_samples_batch ON public.enrichment_qa_samples (batch_id);
CREATE INDEX IF NOT EXISTS idx_qa_samples_pending ON public.enrichment_qa_samples (reviewed_at) WHERE reviewed_at IS NULL;

ALTER TABLE public.enrichment_qa_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage QA samples"
  ON public.enrichment_qa_samples
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view QA samples"
  ON public.enrichment_qa_samples
  FOR SELECT
  USING (true);