
-- 1) Deduplicate: keep row with highest risk_factor (then newest)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY breed_id, condition_id
           ORDER BY risk_factor DESC NULLS LAST, created_at DESC NULLS LAST, id
         ) AS rn
  FROM public.breed_predispositions
)
DELETE FROM public.breed_predispositions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2) Unique constraint
ALTER TABLE public.breed_predispositions
  DROP CONSTRAINT IF EXISTS breed_predispositions_breed_condition_unique;
ALTER TABLE public.breed_predispositions
  ADD CONSTRAINT breed_predispositions_breed_condition_unique
  UNIQUE (breed_id, condition_id);

-- 3) Replace fragile URLs in sources jsonb (pubmed -> europepmc; ofa hip-statistics -> ofa diseases root)
UPDATE public.breed_predispositions
SET sources = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'url') LIKE 'https://pubmed.ncbi.nlm.nih.gov/%'
        THEN jsonb_set(
               elem,
               '{url}',
               to_jsonb(
                 'https://europepmc.org/article/MED/' ||
                 regexp_replace(elem->>'url', '^https://pubmed\.ncbi\.nlm\.nih\.gov/(\d+)/?$', '\1')
               )
             )
      WHEN (elem->>'url') = 'https://www.ofa.org/diseases/hip-dysplasia/hip-statistics'
        THEN jsonb_set(elem, '{url}', to_jsonb('https://ofa.org/diseases/hip-dysplasia/'::text))
      WHEN (elem->>'url') LIKE 'https://www.ofa.org/diseases/%/hip-statistics'
        THEN jsonb_set(elem, '{url}', to_jsonb(regexp_replace(elem->>'url', '/hip-statistics$', '/')))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(sources) elem
)
WHERE sources IS NOT NULL
  AND jsonb_typeof(sources) = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(sources) e
    WHERE (e->>'url') LIKE 'https://pubmed.ncbi.nlm.nih.gov/%'
       OR (e->>'url') LIKE 'https://www.ofa.org/diseases/%/hip-statistics'
  );
