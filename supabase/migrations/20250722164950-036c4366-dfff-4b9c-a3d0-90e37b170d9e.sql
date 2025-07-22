-- 1. Remover duplicatas das relações nutracêutico-condições
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY nutraceutical_id, condition_id, relationship_type 
      ORDER BY created_at
    ) as rn
  FROM nutraceutical_conditions
  WHERE nutraceutical_id IN (
    SELECT id FROM nutraceuticals 
    WHERE name IN ('Curcumina', 'L-Carnitina', 'Ômega-3')
  )
)
DELETE FROM nutraceutical_conditions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Adicionar condições que faltaram para Curcumina (usando nomes corretos)
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'prevention' as relationship_type,
    4.2 as efficacy_score,
    'Potente anti-inflamatório natural' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name = 'Curcumina' 
AND hc.name IN ('Inflamação crônica')
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc 
  WHERE nc.nutraceutical_id = n.id 
  AND nc.condition_id = hc.id 
  AND nc.relationship_type = 'prevention'
);

-- 3. Adicionar condições de suporte para Curcumina
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'support' as relationship_type,
    4.0 as efficacy_score,
    'Suporte anti-inflamatório sistêmico' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name = 'Curcumina' 
AND hc.name IN ('Saúde Digestiva')
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc 
  WHERE nc.nutraceutical_id = n.id 
  AND nc.condition_id = hc.id 
  AND nc.relationship_type = 'support'
);

-- 4. Adicionar condições para L-Carnitina
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'prevention' as relationship_type,
    3.8 as efficacy_score,
    'Prevenção cardiovascular' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name = 'L-Carnitina' 
AND hc.name IN ('Saúde cardiovascular', 'Problemas cardíacos')
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc 
  WHERE nc.nutraceutical_id = n.id 
  AND nc.condition_id = hc.id 
  AND nc.relationship_type = 'prevention'
);

INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'support' as relationship_type,
    3.5 as efficacy_score,
    'Suporte metabólico e energético' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name = 'L-Carnitina' 
AND hc.name IN ('Energia', 'Metabolismo energético')
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc 
  WHERE nc.nutraceutical_id = n.id 
  AND nc.condition_id = hc.id 
  AND nc.relationship_type = 'support'
);

-- 5. Adicionar condições para Ômega-3
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'prevention' as relationship_type,
    4.5 as efficacy_score,
    'Prevenção cardiovascular e anti-inflamatória' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name ILIKE '%Ômega%' 
AND hc.name IN ('Saúde cardiovascular', 'Inflamação crônica')
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc 
  WHERE nc.nutraceutical_id = n.id 
  AND nc.condition_id = hc.id 
  AND nc.relationship_type = 'prevention'
);

INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'support' as relationship_type,
    4.0 as efficacy_score,
    'Suporte cognitivo e imunológico' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name ILIKE '%Ômega%' 
AND hc.name IN ('Saúde cognitiva', 'Função imune')
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_conditions nc 
  WHERE nc.nutraceutical_id = n.id 
  AND nc.condition_id = hc.id 
  AND nc.relationship_type = 'support'
);

-- 6. Verificar resultado final
SELECT 
  n.name as nutraceutical_name,
  COUNT(DISTINCT nc.id) as total_unique_relations,
  COUNT(DISTINCT CASE WHEN nc.relationship_type = 'prevention' THEN nc.id END) as prevention_count,
  COUNT(DISTINCT CASE WHEN nc.relationship_type = 'treatment' THEN nc.id END) as treatment_count,
  COUNT(DISTINCT CASE WHEN nc.relationship_type = 'support' THEN nc.id END) as support_count
FROM nutraceuticals n
LEFT JOIN nutraceutical_conditions nc ON n.id = nc.nutraceutical_id
WHERE n.name IN ('Curcumina', 'L-Carnitina', 'Ômega-3')
GROUP BY n.id, n.name
ORDER BY n.name;