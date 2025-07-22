
-- 1. Identificar e consolidar nutracêuticos Ômega-3 duplicados
-- Primeiro, vamos ver quais temos
SELECT id, name, created_at, 
       (SELECT COUNT(*) FROM nutraceutical_conditions WHERE nutraceutical_id = n.id) as condition_count
FROM nutraceuticals n 
WHERE name ILIKE '%ômega%' OR name ILIKE '%omega%'
ORDER BY name, created_at;

-- 2. Identificar o nutracêutico "Ômega-3" mais completo para manter
WITH omega_nutraceuticals AS (
  SELECT id, name, created_at,
         (SELECT COUNT(*) FROM nutraceutical_conditions WHERE nutraceutical_id = n.id) as condition_count
  FROM nutraceuticals n 
  WHERE name IN ('Ômega 3', 'Ômega-3')
),
keep_nutraceutical AS (
  SELECT id as keep_id 
  FROM omega_nutraceuticals 
  WHERE name = 'Ômega-3'
  ORDER BY condition_count DESC, created_at ASC 
  LIMIT 1
),
remove_nutraceuticals AS (
  SELECT id as remove_id
  FROM omega_nutraceuticals o, keep_nutraceutical k
  WHERE o.id != k.keep_id
)
-- 3. Remover condições duplicadas mantendo apenas relações únicas
DELETE FROM nutraceutical_conditions 
WHERE id IN (
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY nutraceutical_id, condition_id, relationship_type 
             ORDER BY created_at
           ) as rn
    FROM nutraceutical_conditions nc
    WHERE nutraceutical_id IN (
      SELECT id FROM nutraceuticals 
      WHERE name IN ('Ômega 3', 'Ômega-3')
    )
  )
  SELECT id FROM duplicates WHERE rn > 1
);

-- 4. Transferir condições únicas do nutracêutico a ser removido para o que será mantido
WITH keep_nutraceutical AS (
  SELECT id as keep_id 
  FROM nutraceuticals 
  WHERE name = 'Ômega-3'
  LIMIT 1
),
remove_nutraceutical AS (
  SELECT id as remove_id
  FROM nutraceuticals 
  WHERE name = 'Ômega 3'
  LIMIT 1
)
UPDATE nutraceutical_conditions 
SET nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
WHERE nutraceutical_id = (SELECT remove_id FROM remove_nutraceutical)
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc2 
  WHERE nc2.nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
  AND nc2.condition_id = nutraceutical_conditions.condition_id
  AND nc2.relationship_type = nutraceutical_conditions.relationship_type
);

-- 5. Remover estudos duplicados
DELETE FROM nutraceutical_studies 
WHERE id IN (
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY nutraceutical_id, study_id 
             ORDER BY created_at
           ) as rn
    FROM nutraceutical_studies ns
    WHERE nutraceutical_id IN (
      SELECT id FROM nutraceuticals 
      WHERE name IN ('Ômega 3', 'Ômega-3')
    )
  )
  SELECT id FROM duplicates WHERE rn > 1
);

-- 6. Transferir estudos únicos
WITH keep_nutraceutical AS (
  SELECT id as keep_id 
  FROM nutraceuticals 
  WHERE name = 'Ômega-3'
  LIMIT 1
),
remove_nutraceutical AS (
  SELECT id as remove_id
  FROM nutraceuticals 
  WHERE name = 'Ômega 3'
  LIMIT 1
)
UPDATE nutraceutical_studies 
SET nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
WHERE nutraceutical_id = (SELECT remove_id FROM remove_nutraceutical)
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_studies ns2 
  WHERE ns2.nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
  AND ns2.study_id = nutraceutical_studies.study_id
);

-- 7. Transferir benefícios únicos
WITH keep_nutraceutical AS (
  SELECT id as keep_id 
  FROM nutraceuticals 
  WHERE name = 'Ômega-3'
  LIMIT 1
),
remove_nutraceutical AS (
  SELECT id as remove_id
  FROM nutraceuticals 
  WHERE name = 'Ômega 3'
  LIMIT 1
)
UPDATE nutraceutical_benefits 
SET nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
WHERE nutraceutical_id = (SELECT remove_id FROM remove_nutraceutical)
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_benefits nb2 
  WHERE nb2.nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
  AND nb2.benefit = nutraceutical_benefits.benefit
);

-- 8. Transferir metadados científicos únicos
WITH keep_nutraceutical AS (
  SELECT id as keep_id 
  FROM nutraceuticals 
  WHERE name = 'Ômega-3'
  LIMIT 1
),
remove_nutraceutical AS (
  SELECT id as remove_id
  FROM nutraceuticals 
  WHERE name = 'Ômega 3'
  LIMIT 1
)
UPDATE nutraceutical_scientific_metadata 
SET nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
WHERE nutraceutical_id = (SELECT remove_id FROM remove_nutraceutical)
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_scientific_metadata nsm2 
  WHERE nsm2.nutraceutical_id = (SELECT keep_id FROM keep_nutraceutical)
);

-- 9. Remover o nutracêutico duplicado
DELETE FROM nutraceuticals 
WHERE name = 'Ômega 3';

-- 10. Verificar outros possíveis duplicados por nome similar
SELECT name, COUNT(*) as count
FROM nutraceuticals 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 11. Verificar resultado final para Ômega-3
SELECT 
  n.name,
  COUNT(DISTINCT nc.id) as total_conditions,
  COUNT(DISTINCT CASE WHEN nc.relationship_type = 'prevention' THEN nc.id END) as prevention_count,
  COUNT(DISTINCT CASE WHEN nc.relationship_type = 'treatment' THEN nc.id END) as treatment_count,
  COUNT(DISTINCT CASE WHEN nc.relationship_type = 'support' THEN nc.id END) as support_count,
  COUNT(DISTINCT ns.id) as studies_count,
  COUNT(DISTINCT nb.id) as benefits_count
FROM nutraceuticals n
LEFT JOIN nutraceutical_conditions nc ON n.id = nc.nutraceutical_id
LEFT JOIN nutraceutical_studies ns ON n.id = ns.nutraceutical_id
LEFT JOIN nutraceutical_benefits nb ON n.id = nb.nutraceutical_id
WHERE n.name ILIKE '%ômega%'
GROUP BY n.id, n.name
ORDER BY n.name;
