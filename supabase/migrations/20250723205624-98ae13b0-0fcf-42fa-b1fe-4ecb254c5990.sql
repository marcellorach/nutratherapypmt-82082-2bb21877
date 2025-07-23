
-- Inserir novas condições de saúde para SAMe, MSM e Taurina
INSERT INTO health_conditions (name, description) VALUES
-- Condições para SAMe
('Função hepática', 'Relacionado ao funcionamento e saúde do fígado'),
('Danos hepáticos', 'Lesões ou danos ao tecido hepático'),
('Hepatopatias crônicas', 'Doenças crônicas do fígado'),
('Hepatopatias agudas', 'Doenças agudas do fígado'),
('Disfunção renal', 'Problemas de funcionamento dos rins'),
('Saúde cognitiva', 'Relacionado à função cerebral e cognição'),
('Função mitocondrial', 'Funcionamento das mitocôndrias celulares'),
('Metabolismo', 'Processos metabólicos do organismo'),

-- Condições para MSM
('Artrite', 'Inflamação das articulações'),
('Dor articular', 'Dor nas articulações'),
('Degeneração articular', 'Processo degenerativo das articulações'),
('Osteoartrite canina', 'Osteoartrite específica em cães'),
('Problemas articulares', 'Questões gerais relacionadas às articulações'),
('Inflamação crônica', 'Processo inflamatório persistente'),
('Saúde articular', 'Saúde geral das articulações'),
('Mobilidade articular', 'Capacidade de movimento das articulações'),
('Estrutura cartilaginosa', 'Saúde e integridade da cartilagem'),

-- Condições para Taurina
('Cardiomiopatia dilatada', 'Doença do músculo cardíaco com dilatação'),
('Problemas cardíacos', 'Questões gerais relacionadas ao coração'),
('Insuficiência cardíaca', 'Incapacidade do coração de bombear sangue adequadamente'),
('Cardiomiopatia', 'Doença do músculo cardíaco'),
('Doença cardiovascular', 'Doenças do sistema cardiovascular'),
('Função cardíaca', 'Funcionamento do coração'),
('Metabolismo energético', 'Processos de produção e utilização de energia celular')

ON CONFLICT (name) DO NOTHING;

-- Criar relações para SAMe
INSERT INTO nutraceutical_conditions (
  nutraceutical_id, 
  condition_id,
  relationship_type,
  efficacy_score,
  notes
)
SELECT 
  n.id as nutraceutical_id,
  c.id as condition_id,
  CASE 
    WHEN c.name IN ('Função hepática', 'Danos hepáticos', 'Estresse oxidativo') THEN 'prevention'
    WHEN c.name IN ('Hepatopatias crônicas', 'Hepatopatias agudas', 'Disfunção renal', 'Fadiga') THEN 'treatment'
    WHEN c.name IN ('Metabolismo', 'Saúde cognitiva', 'Função mitocondrial') THEN 'support'
  END as relationship_type,
  CASE 
    WHEN c.name = 'Função hepática' THEN 4.5
    WHEN c.name = 'Danos hepáticos' THEN 4.0
    WHEN c.name = 'Estresse oxidativo' THEN 3.5
    WHEN c.name = 'Hepatopatias crônicas' THEN 4.5
    WHEN c.name = 'Hepatopatias agudas' THEN 4.5
    WHEN c.name = 'Disfunção renal' THEN 3.0
    WHEN c.name = 'Fadiga' THEN 3.5
    WHEN c.name = 'Metabolismo' THEN 4.0
    WHEN c.name = 'Saúde cognitiva' THEN 3.5
    WHEN c.name = 'Função mitocondrial' THEN 3.0
  END as efficacy_score,
  CASE 
    WHEN c.name = 'Função hepática' THEN 'Evidências fortes sobre proteção hepática e melhora da função'
    WHEN c.name = 'Danos hepáticos' THEN 'Proteção contra danos hepáticos e auxílio na regeneração'
    WHEN c.name = 'Estresse oxidativo' THEN 'Propriedades antioxidantes moderadas'
    WHEN c.name = 'Hepatopatias crônicas' THEN 'Tratamento eficaz em doenças hepáticas crônicas'
    WHEN c.name = 'Hepatopatias agudas' THEN 'Benefícios em casos agudos de hepatopatias'
    WHEN c.name = 'Disfunção renal' THEN 'Suporte moderado à função renal'
    WHEN c.name = 'Fadiga' THEN 'Melhora da energia e redução da fadiga'
    WHEN c.name = 'Metabolismo' THEN 'Suporte aos processos metabólicos'
    WHEN c.name = 'Saúde cognitiva' THEN 'Benefícios na função cerebral e cognição'
    WHEN c.name = 'Função mitocondrial' THEN 'Suporte à função mitocondrial'
  END as notes
FROM nutraceuticals n
CROSS JOIN health_conditions c
WHERE n.name = 'SAMe'
  AND c.name IN ('Função hepática', 'Danos hepáticos', 'Estresse oxidativo', 'Hepatopatias crônicas', 'Hepatopatias agudas', 'Disfunção renal', 'Fadiga', 'Metabolismo', 'Saúde cognitiva', 'Função mitocondrial')
ON CONFLICT (nutraceutical_id, condition_id, relationship_type) 
DO UPDATE SET 
  efficacy_score = EXCLUDED.efficacy_score,
  notes = EXCLUDED.notes;

-- Criar relações para MSM
INSERT INTO nutraceutical_conditions (
  nutraceutical_id, 
  condition_id,
  relationship_type,
  efficacy_score,
  notes
)
SELECT 
  n.id as nutraceutical_id,
  c.id as condition_id,
  CASE 
    WHEN c.name IN ('Artrite', 'Dor articular', 'Degeneração articular') THEN 'prevention'
    WHEN c.name IN ('Osteoartrite canina', 'Problemas articulares', 'Inflamação crônica') THEN 'treatment'
    WHEN c.name IN ('Saúde articular', 'Mobilidade articular', 'Estrutura cartilaginosa') THEN 'support'
  END as relationship_type,
  CASE 
    WHEN c.name = 'Artrite' THEN 4.0
    WHEN c.name = 'Dor articular' THEN 4.5
    WHEN c.name = 'Degeneração articular' THEN 4.0
    WHEN c.name = 'Osteoartrite canina' THEN 4.5
    WHEN c.name = 'Problemas articulares' THEN 4.0
    WHEN c.name = 'Inflamação crônica' THEN 3.5
    WHEN c.name = 'Saúde articular' THEN 4.5
    WHEN c.name = 'Mobilidade articular' THEN 4.0
    WHEN c.name = 'Estrutura cartilaginosa' THEN 3.5
  END as efficacy_score,
  CASE 
    WHEN c.name = 'Artrite' THEN 'Prevenção eficaz de processos artríticos'
    WHEN c.name = 'Dor articular' THEN 'Redução significativa da dor articular'
    WHEN c.name = 'Degeneração articular' THEN 'Prevenção de degeneração das articulações'
    WHEN c.name = 'Osteoartrite canina' THEN 'Tratamento eficaz da osteoartrite em cães'
    WHEN c.name = 'Problemas articulares' THEN 'Tratamento de diversos problemas articulares'
    WHEN c.name = 'Inflamação crônica' THEN 'Propriedades anti-inflamatórias moderadas'
    WHEN c.name = 'Saúde articular' THEN 'Suporte abrangente à saúde das articulações'
    WHEN c.name = 'Mobilidade articular' THEN 'Melhora da mobilidade e flexibilidade'
    WHEN c.name = 'Estrutura cartilaginosa' THEN 'Suporte à integridade da cartilagem'
  END as notes
FROM nutraceuticals n
CROSS JOIN health_conditions c
WHERE n.name = 'MSM'
  AND c.name IN ('Artrite', 'Dor articular', 'Degeneração articular', 'Osteoartrite canina', 'Problemas articulares', 'Inflamação crônica', 'Saúde articular', 'Mobilidade articular', 'Estrutura cartilaginosa')
ON CONFLICT (nutraceutical_id, condition_id, relationship_type) 
DO UPDATE SET 
  efficacy_score = EXCLUDED.efficacy_score,
  notes = EXCLUDED.notes;

-- Criar relações para Taurina
INSERT INTO nutraceutical_conditions (
  nutraceutical_id, 
  condition_id,
  relationship_type,
  efficacy_score,
  notes
)
SELECT 
  n.id as nutraceutical_id,
  c.id as condition_id,
  CASE 
    WHEN c.name IN ('Cardiomiopatia dilatada', 'Problemas cardíacos', 'Insuficiência cardíaca') THEN 'prevention'
    WHEN c.name IN ('Cardiomiopatia', 'Doença cardiovascular', 'Função cardíaca') THEN 'treatment'
    WHEN c.name IN ('Saúde cardiovascular', 'Função mitocondrial', 'Metabolismo energético') THEN 'support'
  END as relationship_type,
  CASE 
    WHEN c.name = 'Cardiomiopatia dilatada' THEN 4.5
    WHEN c.name = 'Problemas cardíacos' THEN 4.0
    WHEN c.name = 'Insuficiência cardíaca' THEN 4.0
    WHEN c.name = 'Cardiomiopatia' THEN 4.5
    WHEN c.name = 'Doença cardiovascular' THEN 4.0
    WHEN c.name = 'Função cardíaca' THEN 4.5
    WHEN c.name = 'Saúde cardiovascular' THEN 4.0
    WHEN c.name = 'Função mitocondrial' THEN 3.5
    WHEN c.name = 'Metabolismo energético' THEN 3.0
  END as efficacy_score,
  CASE 
    WHEN c.name = 'Cardiomiopatia dilatada' THEN 'Prevenção eficaz de cardiomiopatia dilatada'
    WHEN c.name = 'Problemas cardíacos' THEN 'Prevenção de diversos problemas cardíacos'
    WHEN c.name = 'Insuficiência cardíaca' THEN 'Prevenção de insuficiência cardíaca'
    WHEN c.name = 'Cardiomiopatia' THEN 'Tratamento eficaz de cardiomiopatias'
    WHEN c.name = 'Doença cardiovascular' THEN 'Tratamento de doenças cardiovasculares'
    WHEN c.name = 'Função cardíaca' THEN 'Melhora significativa da função cardíaca'
    WHEN c.name = 'Saúde cardiovascular' THEN 'Suporte geral à saúde cardiovascular'
    WHEN c.name = 'Função mitocondrial' THEN 'Suporte à função mitocondrial cardíaca'
    WHEN c.name = 'Metabolismo energético' THEN 'Suporte ao metabolismo energético celular'
  END as notes
FROM nutraceuticals n
CROSS JOIN health_conditions c
WHERE n.name = 'Taurina'
  AND c.name IN ('Cardiomiopatia dilatada', 'Problemas cardíacos', 'Insuficiência cardíaca', 'Cardiomiopatia', 'Doença cardiovascular', 'Função cardíaca', 'Saúde cardiovascular', 'Função mitocondrial', 'Metabolismo energético')
ON CONFLICT (nutraceutical_id, condition_id, relationship_type) 
DO UPDATE SET 
  efficacy_score = EXCLUDED.efficacy_score,
  notes = EXCLUDED.notes;

-- Atualizar metadados científicos dos nutracêuticos
INSERT INTO nutraceutical_scientific_metadata (
  nutraceutical_id,
  efficacy_score,
  notes
)
SELECT 
  n.id,
  CASE 
    WHEN n.name = 'SAMe' THEN 4.2
    WHEN n.name = 'MSM' THEN 4.0
    WHEN n.name = 'Taurina' THEN 4.3
  END as efficacy_score,
  CASE 
    WHEN n.name = 'SAMe' THEN 'S-Adenosil-L-metionina com forte evidência científica para saúde hepática e função cognitiva'
    WHEN n.name = 'MSM' THEN 'Metilsulfonilmetano com evidências sólidas para saúde articular e redução da inflamação'
    WHEN n.name = 'Taurina' THEN 'Aminoácido com evidências robustas para saúde cardiovascular e função cardíaca'
  END as notes
FROM nutraceuticals n
WHERE n.name IN ('SAMe', 'MSM', 'Taurina')
ON CONFLICT (nutraceutical_id) 
DO UPDATE SET 
  efficacy_score = EXCLUDED.efficacy_score,
  notes = EXCLUDED.notes;
