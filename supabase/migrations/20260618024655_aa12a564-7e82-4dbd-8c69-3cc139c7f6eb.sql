
-- Canonical KG integrity predicate (single source of truth).
-- READ-ONLY consumers only. Defines once: "synced but not approved",
-- with a boolean flag indicating whether an approved sibling exists
-- on the SAME lower(subject, predicate, object) triple.

CREATE OR REPLACE VIEW public.v_unapproved_synced_triplets AS
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

COMMENT ON VIEW public.v_unapproved_synced_triplets IS
'KG integrity base set: rows synced to Neo4j whose curation_status is not approved. has_approved_sibling=false => pure ghost; true => mixed (approved twin exists on same lower(s,p,o)). Canonical predicate referenced by audit checks; do not redefine inline.';

-- Convenience views derived from the canonical one (no predicate duplication).
CREATE OR REPLACE VIEW public.v_ghost_triplets AS
  SELECT * FROM public.v_unapproved_synced_triplets WHERE has_approved_sibling = FALSE;

CREATE OR REPLACE VIEW public.v_mixed_unapproved_triplets AS
  SELECT * FROM public.v_unapproved_synced_triplets WHERE has_approved_sibling = TRUE;

GRANT SELECT ON public.v_unapproved_synced_triplets   TO authenticated, service_role;
GRANT SELECT ON public.v_ghost_triplets               TO authenticated, service_role;
GRANT SELECT ON public.v_mixed_unapproved_triplets    TO authenticated, service_role;
