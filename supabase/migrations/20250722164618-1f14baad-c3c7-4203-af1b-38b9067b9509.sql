
-- 1. Remover a duplicata da Urolitina A (manter apenas o primeiro registro)
DELETE FROM nutraceuticals 
WHERE id = 'c4429f4d-16e9-48ab-90c4-318ef3b1b665' 
AND name = 'Urolitina A';

-- 2. Adicionar condições faltantes para a Curcumina
-- Primeiro, vamos encontrar o ID da Curcumina e das condições relevantes
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'prevention' as relationship_type,
    4.2 as efficacy_score,
    'Potente anti-inflamatório natural com ampla aplicação clínica' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name = 'Curcumina' 
AND hc.name IN ('Inflamação', 'Artrite', 'Dor articular');

-- Adicionar condições de suporte para Curcumina
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
AND hc.name IN ('Saúde digestiva', 'Sistema imunológico', 'Função hepática');

-- 3. Adicionar condições para L-Carnitina
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'prevention' as relationship_type,
    3.8 as efficacy_score,
    'Suporte cardiovascular e metabólico' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE n.name = 'L-Carnitina' 
AND hc.name IN ('Cardiovascular', 'Cardiomiopatia dilatada');

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
AND hc.name IN ('Metabolismo', 'Função cardíaca', 'Energia celular');

-- 4. Adicionar condições para Ômega-3
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
AND hc.name IN ('Cardiovascular', 'Inflamação', 'Artrite');

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
AND hc.name IN ('Função cognitiva', 'Sistema imunológico', 'Saúde da pele');

-- 5. Adicionar condições para Prebióticos/Probióticos
INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'prevention' as relationship_type,
    4.0 as efficacy_score,
    'Prevenção de distúrbios digestivos' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE (n.name ILIKE '%Prebiótico%' OR n.name ILIKE '%Probiótico%')
AND hc.name IN ('Saúde digestiva', 'Microbiota intestinal');

INSERT INTO nutraceutical_conditions (nutraceutical_id, condition_id, relationship_type, efficacy_score, notes)
SELECT 
    n.id as nutraceutical_id,
    hc.id as condition_id,
    'support' as relationship_type,
    3.8 as efficacy_score,
    'Suporte imunológico através da saúde intestinal' as notes
FROM nutraceuticals n
CROSS JOIN health_conditions hc
WHERE (n.name ILIKE '%Prebiótico%' OR n.name ILIKE '%Probiótico%')
AND hc.name IN ('Sistema imunológico', 'Função digestiva');

-- 6. Verificar se há outras duplicatas
SELECT name, COUNT(*) as count
FROM nutraceuticals
GROUP BY name
HAVING COUNT(*) > 1;
