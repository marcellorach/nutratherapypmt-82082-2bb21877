
ALTER TABLE public.triplet_verifications
  ADD COLUMN IF NOT EXISTS tool_choice_used boolean,
  ADD COLUMN IF NOT EXISTS abstain_reason text,
  ADD COLUMN IF NOT EXISTS recalled_chunks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recall_similarity_top numeric(5,4);

ALTER TABLE public.triplet_verifications
  DROP CONSTRAINT IF EXISTS triplet_verifications_abstain_reason_check;
ALTER TABLE public.triplet_verifications
  ADD CONSTRAINT triplet_verifications_abstain_reason_check
  CHECK (abstain_reason IS NULL OR abstain_reason = ANY (ARRAY[
    'no_chunks','low_similarity','chunks_off_topic','verifier_error','tool_call_missing','other'
  ]));

CREATE INDEX IF NOT EXISTS idx_triplet_verifications_abstain_reason
  ON public.triplet_verifications (abstain_reason) WHERE abstain_reason IS NOT NULL;

ALTER TABLE public.triplet_verification_runs
  ADD COLUMN IF NOT EXISTS stratification_snapshot jsonb DEFAULT '{}'::jsonb;
