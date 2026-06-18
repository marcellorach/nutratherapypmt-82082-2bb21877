
CREATE OR REPLACE VIEW public.v_unapproved_synced_triplets
WITH (security_invoker = true) AS
SELECT
  te.id,
  te.subject_name,
  te.predicate,
  te.object_name,
  te.curation_status,
  te.synced_to_neo4j,
  lower(te.subject_name)   AS s_lower,
  lower(te.predicate)      AS p_lower,
  lower(te.object_name)    AS o_lower,
  EXISTS (
    SELECT 1
    FROM public.triplet_extractions a
    WHERE a.curation_status = 'approved'
      AND lower(a.subject_name) = lower(te.subject_name)
      AND lower(a.predicate)    = lower(te.predicate)
      AND lower(a.object_name)  = lower(te.object_name)
  ) AS has_approved_sibling
FROM public.triplet_extractions te
WHERE te.synced_to_neo4j = TRUE
  AND te.curation_status <> 'approved';

CREATE OR REPLACE VIEW public.v_ghost_triplets
WITH (security_invoker = true) AS
  SELECT * FROM public.v_unapproved_synced_triplets WHERE has_approved_sibling = FALSE;

CREATE OR REPLACE VIEW public.v_mixed_unapproved_triplets
WITH (security_invoker = true) AS
  SELECT * FROM public.v_unapproved_synced_triplets WHERE has_approved_sibling = TRUE;
