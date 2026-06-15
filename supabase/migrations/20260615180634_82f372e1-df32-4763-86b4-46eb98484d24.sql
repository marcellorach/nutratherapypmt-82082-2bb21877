
CREATE OR REPLACE FUNCTION public.search_relations_by_term(p_terms text[], p_limit integer DEFAULT 25)
RETURNS TABLE(
  id uuid,
  subject_name text,
  predicate text,
  object_name text,
  subject_layer text,
  object_layer text,
  intensity text,
  direction text,
  evidence_level text,
  llm_confidence numeric,
  extraction_confidence numeric,
  mechanism_path jsonb,
  study_id uuid,
  curation_status text,
  auto_approved boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH terms AS (
    SELECT unnest(p_terms) AS term
  )
  SELECT DISTINCT
    te.id,
    te.subject_name,
    te.predicate,
    te.object_name,
    te.subject_layer,
    te.object_layer,
    te.intensity,
    te.direction,
    te.evidence_level,
    te.llm_confidence,
    te.extraction_confidence,
    te.mechanism_path,
    te.study_id,
    te.curation_status,
    te.auto_approved
  FROM public.triplet_extractions te
  WHERE (te.curation_status = 'approved' OR te.auto_approved = true)
    AND EXISTS (
      SELECT 1 FROM terms t
      WHERE te.subject_name ILIKE '%' || t.term || '%'
         OR te.object_name  ILIKE '%' || t.term || '%'
    )
  ORDER BY te.llm_confidence DESC NULLS LAST, te.extraction_confidence DESC NULLS LAST
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_relations_by_term(text[], integer) TO authenticated, anon, service_role;
