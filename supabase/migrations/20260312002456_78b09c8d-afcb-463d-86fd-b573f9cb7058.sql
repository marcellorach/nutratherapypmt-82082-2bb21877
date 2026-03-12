
CREATE OR REPLACE FUNCTION public.get_relations_graph_data(p_limit integer DEFAULT 2000)
RETURNS TABLE(
  source_name text,
  source_type text,
  target_name text,
  target_type text,
  relationship text,
  confidence numeric,
  evidence_count integer,
  evidence_level text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(te.subject_name, he.source_type || '_' || LEFT(he.source_id::text, 8)) as source_name,
    he.source_type,
    COALESCE(te.object_name, he.target_type || '_' || LEFT(he.target_id::text, 8)) as target_name,
    he.target_type,
    he.relationship,
    he.confidence,
    COALESCE(he.evidence_count, 0)::integer as evidence_count,
    he.evidence_level
  FROM hierarchical_edges he
  LEFT JOIN triplet_extractions te ON he.triplet_id = te.id
  ORDER BY COALESCE(he.evidence_count, 0) DESC, he.confidence DESC
  LIMIT p_limit;
$$;
