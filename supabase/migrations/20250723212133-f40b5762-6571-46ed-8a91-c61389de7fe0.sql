-- Inserir relações diretamente com IDs específicos
INSERT INTO nutraceutical_conditions (
  nutraceutical_id, 
  condition_id,
  relationship_type,
  efficacy_score,
  notes
) VALUES
-- SAMe - Função hepática (prevenção)
('ca86f135-8b02-4db6-9282-3076d9e8cf2a', 
 (SELECT id FROM health_conditions WHERE name = 'Função hepática'),
 'prevention', 4.5, 'Evidências fortes sobre proteção hepática e melhora da função'),
-- SAMe - Hepatopatias crônicas (tratamento)
('ca86f135-8b02-4db6-9282-3076d9e8cf2a',
 (SELECT id FROM health_conditions WHERE name = 'Hepatopatias crônicas'),
 'treatment', 4.5, 'Tratamento eficaz em doenças hepáticas crônicas'),
-- SAMe - Metabolismo (suporte)
('ca86f135-8b02-4db6-9282-3076d9e8cf2a',
 (SELECT id FROM health_conditions WHERE name = 'Metabolismo'),
 'support', 4.0, 'Suporte aos processos metabólicos'),

-- MSM - Artrite (prevenção)
('a66f73bf-3e81-4d34-9c1f-ae46abe43d92',
 (SELECT id FROM health_conditions WHERE name = 'Artrite'),
 'prevention', 4.0, 'Prevenção eficaz de processos artríticos'),
-- MSM - Osteoartrite canina (tratamento)
('a66f73bf-3e81-4d34-9c1f-ae46abe43d92',
 (SELECT id FROM health_conditions WHERE name = 'Osteoartrite canina'),
 'treatment', 4.5, 'Tratamento eficaz da osteoartrite em cães'),
-- MSM - Saúde articular (suporte)
('a66f73bf-3e81-4d34-9c1f-ae46abe43d92',
 (SELECT id FROM health_conditions WHERE name = 'Saúde articular'),
 'support', 4.5, 'Suporte abrangente à saúde das articulações'),

-- Taurina - Cardiomiopatia dilatada (prevenção)
('6839923b-56cb-4bce-84d1-319393ae93e2',
 (SELECT id FROM health_conditions WHERE name = 'Cardiomiopatia dilatada'),
 'prevention', 4.5, 'Prevenção eficaz de cardiomiopatia dilatada'),
-- Taurina - Cardiomiopatia (tratamento)
('6839923b-56cb-4bce-84d1-319393ae93e2',
 (SELECT id FROM health_conditions WHERE name = 'Cardiomiopatia'),
 'treatment', 4.5, 'Tratamento eficaz de cardiomiopatias'),
-- Taurina - Saúde cardiovascular (suporte)
('6839923b-56cb-4bce-84d1-319393ae93e2',
 (SELECT id FROM health_conditions WHERE name = 'Saúde cardiovascular'),
 'support', 4.0, 'Suporte geral à saúde cardiovascular')

ON CONFLICT (nutraceutical_id, condition_id, relationship_type) DO NOTHING;