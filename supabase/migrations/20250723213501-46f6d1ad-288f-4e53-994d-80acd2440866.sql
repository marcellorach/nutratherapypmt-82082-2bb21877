
-- Remover entradas inválidas com condition_id NULL
DELETE FROM nutraceutical_conditions 
WHERE condition_id IS NULL;

-- Remover duplicatas de health_conditions se houver
DELETE FROM health_conditions a USING health_conditions b 
WHERE a.id > b.id AND a.name = b.name;

-- Garantir que as relações corretas existam
INSERT INTO nutraceutical_conditions (
  nutraceutical_id, 
  condition_id,
  relationship_type,
  efficacy_score,
  notes
) VALUES
-- SAMe - Relações corretas
('ca86f135-8b02-4db6-9282-3076d9e8cf2a', 
 (SELECT id FROM health_conditions WHERE name = 'Função hepática' LIMIT 1),
 'prevention', 4.5, 'Evidências fortes sobre proteção hepática'),
('ca86f135-8b02-4db6-9282-3076d9e8cf2a',
 (SELECT id FROM health_conditions WHERE name = 'Hepatopatias crônicas' LIMIT 1),
 'treatment', 4.5, 'Tratamento eficaz em hepatopatias crônicas'),
('ca86f135-8b02-4db6-9282-3076d9e8cf2a',
 (SELECT id FROM health_conditions WHERE name = 'Metabolismo' LIMIT 1),
 'support', 4.0, 'Suporte metabólico'),

-- MSM - Relações corretas
('a66f73bf-3e81-4d34-9c1f-ae46abe43d92',
 (SELECT id FROM health_conditions WHERE name = 'Artrite' LIMIT 1),
 'prevention', 4.0, 'Prevenção de artrite'),
('a66f73bf-3e81-4d34-9c1f-ae46abe43d92',
 (SELECT id FROM health_conditions WHERE name = 'Osteoartrite canina' LIMIT 1),
 'treatment', 4.5, 'Tratamento de osteoartrite canina'),
('a66f73bf-3e81-4d34-9c1f-ae46abe43d92',
 (SELECT id FROM health_conditions WHERE name = 'Saúde articular' LIMIT 1),
 'support', 4.5, 'Suporte à saúde articular'),

-- Taurina - Relações corretas
('6839923b-56cb-4bce-84d1-319393ae93e2',
 (SELECT id FROM health_conditions WHERE name = 'Cardiomiopatia dilatada' LIMIT 1),
 'prevention', 4.5, 'Prevenção de cardiomiopatia dilatada'),
('6839923b-56cb-4bce-84d1-319393ae93e2',
 (SELECT id FROM health_conditions WHERE name = 'Cardiomiopatia' LIMIT 1),
 'treatment', 4.5, 'Tratamento de cardiomiopatias'),
('6839923b-56cb-4bce-84d1-319393ae93e2',
 (SELECT id FROM health_conditions WHERE name = 'Saúde cardiovascular' LIMIT 1),
 'support', 4.0, 'Suporte cardiovascular')

ON CONFLICT (nutraceutical_id, condition_id, relationship_type) DO UPDATE SET
  efficacy_score = EXCLUDED.efficacy_score,
  notes = EXCLUDED.notes;
