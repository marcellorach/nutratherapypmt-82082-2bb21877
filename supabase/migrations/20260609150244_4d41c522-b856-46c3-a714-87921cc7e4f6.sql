ALTER TABLE public.processed_studies
  ADD COLUMN IF NOT EXISTS ingestion_stages jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS processed_studies_ingestion_stages_gin
  ON public.processed_studies USING gin (ingestion_stages);

COMMENT ON COLUMN public.processed_studies.ingestion_stages IS
  'Per-stage ingestion telemetry. Keys: parse_study, file_search, extract_entities, vectorize. Each value: { status: ok|degraded|failed|skipped, reason?, error_message?, finished_at, ...metrics }';