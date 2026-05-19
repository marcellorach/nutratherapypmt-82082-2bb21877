DROP FUNCTION IF EXISTS public.search_study_chunks(vector, uuid, double precision, integer);

CREATE OR REPLACE FUNCTION public.search_study_chunks(
  query_embedding vector,
  match_study_id uuid DEFAULT NULL::uuid,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5
)
RETURNS TABLE(
  chunk_id uuid,
  study_id uuid,
  chunk_text text,
  chunk_index integer,
  similarity double precision,
  chunk_metadata jsonb,
  embedding_model_version text
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    study_embeddings.id AS chunk_id,
    study_embeddings.study_id,
    study_embeddings.chunk_text,
    study_embeddings.chunk_index,
    1 - (study_embeddings.embedding <=> query_embedding) AS similarity,
    study_embeddings.chunk_metadata,
    study_embeddings.embedding_model_version
  FROM study_embeddings
  WHERE
    (match_study_id IS NULL OR study_embeddings.study_id = match_study_id)
    AND study_embeddings.embedding IS NOT NULL
    AND 1 - (study_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY study_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;