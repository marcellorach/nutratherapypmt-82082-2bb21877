-- Re-derive the pure-ghost set from current state and reset synced flag.
-- Pure ghost = synced_to_neo4j=true AND curation_status<>'approved'
-- AND no approved triplet exists for the same (subject,predicate,object).
WITH ghosts AS (
  SELECT id, subject_name, predicate, object_name
  FROM public.triplet_extractions
  WHERE synced_to_neo4j = true AND curation_status <> 'approved'
),
pure AS (
  SELECT g.id FROM ghosts g
  WHERE NOT EXISTS (
    SELECT 1 FROM public.triplet_extractions a
    WHERE a.curation_status = 'approved'
      AND lower(a.subject_name) = lower(g.subject_name)
      AND lower(a.predicate)    = lower(g.predicate)
      AND lower(a.object_name)  = lower(g.object_name)
  )
)
UPDATE public.triplet_extractions t
   SET synced_to_neo4j = false
  FROM pure p
 WHERE t.id = p.id;