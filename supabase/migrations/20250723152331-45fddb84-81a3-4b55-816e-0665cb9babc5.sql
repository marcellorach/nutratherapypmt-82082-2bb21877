
-- 1. Verificar IDs dos nutracêuticos
WITH target_nutraceuticals AS (
  SELECT id, name
  FROM nutraceuticals
  WHERE name IN ('Taurina', 'Urolitina A', 'Vitamina E')
)

-- 2. Verificar condições existentes ou criar novas
, existing_conditions AS (
  SELECT id, name 
  FROM health_conditions
  WHERE name IN ('Saúde cardiovascular', 'Estresse oxidativo', 'Fadiga', 'Sistema imunológico', 
                'Envelhecimento', 'Envelhecimento celular', 'Saúde da pele e pelagem',
                'Sarcopenia', 'Função muscular')
)

-- 3. Inserir novas condições de saúde que ainda não existem
, insert_new_conditions AS (
  INSERT INTO health_conditions (name, description)
  VALUES 
    ('Saúde cardiovascular', 'Relacionado à saúde e função do coração e sistema circulatório'),
    ('Estresse oxidativo', 'Condição relacionada ao desequilíbrio entre radicais livres e antioxidantes no corpo'),
    ('Fadiga', 'Estado de exaustão e redução de energia física ou mental'),
    ('Sistema imunológico', 'Relacionado ao funcionamento das defesas naturais do organismo'),
    ('Envelhecimento', 'Processos relacionados ao envelhecimento natural'),
    ('Envelhecimento celular', 'Processos específicos de envelhecimento a nível celular'),
    ('Saúde da pele e pelagem', 'Condições relacionadas à saúde da pele e qualidade da pelagem'),
    ('Sarcopenia', 'Perda progressiva de massa e função muscular relacionada ao envelhecimento'),
    ('Função muscular', 'Relacionado à saúde e desempenho da musculatura')
  ON CONFLICT (name) DO NOTHING
  RETURNING id, name
)

-- 4. Criar relações nutracêutico-condição para Taurina
, taurine_relations AS (
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
      WHEN c.name = 'Saúde cardiovascular' THEN 'treatment'
      WHEN c.name = 'Estresse oxidativo' THEN 'prevention'
      WHEN c.name = 'Fadiga' THEN 'support'
      WHEN c.name = 'Sistema imunológico' THEN 'support'
    END as relationship_type,
    CASE 
      WHEN c.name = 'Saúde cardiovascular' THEN 4.2
      WHEN c.name = 'Estresse oxidativo' THEN 4.0
      WHEN c.name = 'Fadiga' THEN 3.8
      WHEN c.name = 'Sistema imunológico' THEN 3.5
    END as efficacy_score,
    CASE 
      WHEN c.name = 'Saúde cardiovascular' THEN 'Estudos recentes demonstram efeitos positivos na função cardíaca e pressão arterial'
      WHEN c.name = 'Estresse oxidativo' THEN 'Propriedades antioxidantes bem documentadas'
      WHEN c.name = 'Fadiga' THEN 'Melhora da performance física e redução da fadiga muscular'
      WHEN c.name = 'Sistema imunológico' THEN 'Suporte à função imunológica via estabilização de membranas celulares'
    END as notes
  FROM nutraceuticals n
  CROSS JOIN (
    SELECT id, name FROM health_conditions 
    WHERE name IN ('Saúde cardiovascular', 'Estresse oxidativo', 'Fadiga', 'Sistema imunológico')
  ) c
  WHERE n.name = 'Taurina'
  ON CONFLICT (nutraceutical_id, condition_id, relationship_type) 
  DO UPDATE SET 
    efficacy_score = EXCLUDED.efficacy_score,
    notes = EXCLUDED.notes
)

-- 5. Criar relações para Urolitina A
, urolithin_relations AS (
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
      WHEN c.name = 'Envelhecimento' THEN 'prevention'
      WHEN c.name = 'Envelhecimento celular' THEN 'prevention'
      WHEN c.name = 'Saúde cardiovascular' THEN 'support'
      WHEN c.name = 'Fadiga' THEN 'treatment'
    END as relationship_type,
    CASE 
      WHEN c.name = 'Envelhecimento' THEN 4.5
      WHEN c.name = 'Envelhecimento celular' THEN 4.3
      WHEN c.name = 'Saúde cardiovascular' THEN 3.7
      WHEN c.name = 'Fadiga' THEN 4.1
    END as efficacy_score,
    CASE 
      WHEN c.name = 'Envelhecimento' THEN 'Evidências fortes sobre efeitos anti-envelhecimento pela indução da mitofagia'
      WHEN c.name = 'Envelhecimento celular' THEN 'Melhora da função mitocondrial e redução de danos celulares'
      WHEN c.name = 'Saúde cardiovascular' THEN 'Redução do estresse oxidativo no sistema cardiovascular'
      WHEN c.name = 'Fadiga' THEN 'Aumento da biogênese mitocondrial e melhora da energia celular'
    END as notes
  FROM nutraceuticals n
  CROSS JOIN (
    SELECT id, name FROM health_conditions 
    WHERE name IN ('Envelhecimento', 'Envelhecimento celular', 'Saúde cardiovascular', 'Fadiga')
  ) c
  WHERE n.name = 'Urolitina A'
  ON CONFLICT (nutraceutical_id, condition_id, relationship_type) 
  DO UPDATE SET 
    efficacy_score = EXCLUDED.efficacy_score,
    notes = EXCLUDED.notes
)

-- 6. Criar relações para Vitamina E
, vitamin_e_relations AS (
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
      WHEN c.name = 'Estresse oxidativo' THEN 'prevention'
      WHEN c.name = 'Sistema imunológico' THEN 'support'
      WHEN c.name = 'Saúde da pele e pelagem' THEN 'treatment'
      WHEN c.name = 'Saúde cardiovascular' THEN 'prevention'
    END as relationship_type,
    CASE 
      WHEN c.name = 'Estresse oxidativo' THEN 4.7
      WHEN c.name = 'Sistema imunológico' THEN 3.8
      WHEN c.name = 'Saúde da pele e pelagem' THEN 4.2
      WHEN c.name = 'Saúde cardiovascular' THEN 3.6
    END as efficacy_score,
    CASE 
      WHEN c.name = 'Estresse oxidativo' THEN 'Potente antioxidante que neutraliza radicais livres'
      WHEN c.name = 'Sistema imunológico' THEN 'Modulador da função imune e resposta inflamatória'
      WHEN c.name = 'Saúde da pele e pelagem' THEN 'Melhora a hidratação, elasticidade e brilho da pelagem'
      WHEN c.name = 'Saúde cardiovascular' THEN 'Proteção dos vasos sanguíneos contra danos oxidativos'
    END as notes
  FROM nutraceuticals n
  CROSS JOIN (
    SELECT id, name FROM health_conditions 
    WHERE name IN ('Estresse oxidativo', 'Sistema imunológico', 'Saúde da pele e pelagem', 'Saúde cardiovascular')
  ) c
  WHERE n.name = 'Vitamina E'
  ON CONFLICT (nutraceutical_id, condition_id, relationship_type) 
  DO UPDATE SET 
    efficacy_score = EXCLUDED.efficacy_score,
    notes = EXCLUDED.notes
)

-- 7. Atualizar metadados científicos
, update_scientific_metadata AS (
  INSERT INTO nutraceutical_scientific_metadata (
    nutraceutical_id,
    efficacy_score,
    notes
  )
  SELECT 
    n.id,
    CASE 
      WHEN n.name = 'Taurina' THEN 4.0
      WHEN n.name = 'Urolitina A' THEN 4.3
      WHEN n.name = 'Vitamina E' THEN 4.5
    END as efficacy_score,
    CASE 
      WHEN n.name = 'Taurina' THEN 'Aminoácido com forte evidência científica para saúde cardíaca e função muscular'
      WHEN n.name = 'Urolitina A' THEN 'Composto bioativo com significativas evidências em longevidade celular e função mitocondrial'
      WHEN n.name = 'Vitamina E' THEN 'Vitamina essencial bem estudada com propriedades antioxidantes comprovadas'
    END as notes
  FROM nutraceuticals n
  WHERE n.name IN ('Taurina', 'Urolitina A', 'Vitamina E')
  ON CONFLICT (nutraceutical_id) 
  DO UPDATE SET 
    efficacy_score = EXCLUDED.efficacy_score,
    notes = EXCLUDED.notes
)

-- 8. Verificar resultados
SELECT 'Condições adicionadas com sucesso!' as result;
