ALTER TABLE public.study_embeddings
  ADD COLUMN IF NOT EXISTS embedding_model_version TEXT;

UPDATE public.study_embeddings
  SET embedding_model_version = 'gemini-embedding-001@768d'
  WHERE embedding_model_version IS NULL;

ALTER TABLE public.study_embeddings
  ALTER COLUMN embedding_model_version SET DEFAULT 'gemini-embedding-001@768d';

CREATE INDEX IF NOT EXISTS idx_study_embeddings_model_version
  ON public.study_embeddings(embedding_model_version);