
-- Inserir estudos científicos adicionais
INSERT INTO scientific_studies (title, journal, year, authors, abstract, link, data_type) VALUES
('Curcumin supplementation and cardiovascular disease prevention', 'Journal of Nutritional Biochemistry', 2023, ARRAY['Smith, J.', 'Johnson, M.', 'Brown, K.'], 'This study examines the cardioprotective effects of curcumin supplementation in middle-aged adults over a 12-month period.', 'https://example.com/study1', 'seed'),
('Omega-3 fatty acids and cognitive function in elderly population', 'Neurology Research International', 2022, ARRAY['Davis, L.', 'Wilson, R.'], 'A randomized controlled trial investigating the impact of omega-3 supplementation on cognitive performance in seniors.', 'https://example.com/study2', 'seed'),
('Resveratrol and longevity: A comprehensive meta-analysis', 'Aging Cell', 2023, ARRAY['Martinez, A.', 'Garcia, P.', 'Rodriguez, S.'], 'Meta-analysis of 25 studies examining resveratrol effects on cellular aging and longevity markers.', 'https://example.com/study3', 'seed'),
('Vitamin D3 supplementation in autoimmune conditions', 'Autoimmunity Reviews', 2022, ARRAY['Thompson, E.', 'Anderson, C.'], 'Clinical trial results showing vitamin D3 effects on autoimmune disease progression and symptoms.', 'https://example.com/study4', 'seed'),
('Probiotics and gastrointestinal health: Recent findings', 'Gastroenterology Research', 2023, ARRAY['Lee, H.', 'Kim, S.', 'Park, J.'], 'Comprehensive review of probiotic effects on gut microbiome and digestive health outcomes.', 'https://example.com/study5', 'seed'),
('Magnesium deficiency and metabolic syndrome', 'Metabolic Syndrome and Related Disorders', 2022, ARRAY['Williams, T.', 'Jones, M.'], 'Cross-sectional study examining magnesium levels in patients with metabolic syndrome.', 'https://example.com/study6', 'seed'),
('Coenzyme Q10 in heart failure management', 'European Journal of Heart Failure', 2023, ARRAY['Mueller, K.', 'Schmidt, F.'], 'Randomized trial of CoQ10 supplementation in chronic heart failure patients.', 'https://example.com/study7', 'seed'),
('Ashwagandha and stress reduction: Clinical evidence', 'Stress and Health', 2022, ARRAY['Patel, N.', 'Sharma, R.'], 'Double-blind study on ashwagandha extract effects on cortisol levels and stress markers.', 'https://example.com/study8', 'seed'),
('Turmeric extract in inflammatory joint conditions', 'Journal of Inflammation Research', 2023, ARRAY['Chen, L.', 'Wang, X.'], 'Clinical trial evaluating turmeric extract efficacy in rheumatoid arthritis patients.', 'https://example.com/study9', 'seed'),
('Green tea polyphenols and cancer prevention', 'Cancer Prevention Research', 2022, ARRAY['Taylor, B.', 'White, D.'], 'Prospective cohort study on green tea consumption and cancer risk reduction.', 'https://example.com/study10', 'seed'),
('Zinc supplementation and immune function', 'Immunology Today', 2023, ARRAY['Brown, A.', 'Miller, S.'], 'Meta-analysis of zinc supplementation effects on immune system markers.', 'https://example.com/study11', 'seed'),
('Spirulina and antioxidant capacity', 'Antioxidants', 2022, ARRAY['Lopez, C.', 'Gonzalez, M.'], 'Randomized controlled trial examining spirulina supplementation and oxidative stress markers.', 'https://example.com/study12', 'seed');

-- Criar associações entre estudos e nutracêuticos existentes
-- Primeiro, vamos buscar alguns nutracêuticos existentes e associá-los aos estudos
WITH nutra_ids AS (
  SELECT id, name FROM nutraceuticals 
  WHERE name IN ('Cúrcuma', 'Ômega-3', 'Resveratrol', 'Vitamina D3', 'Magnésio', 'Coenzima Q10', 'Ashwagandha', 'Açafrão', 'Zinco', 'Spirulina')
  LIMIT 10
),
study_ids AS (
  SELECT id, title FROM scientific_studies 
  WHERE data_type = 'seed'
)
INSERT INTO nutraceutical_studies (nutraceutical_id, study_id, relevance_score, data_type)
SELECT 
  n.id,
  s.id,
  CASE 
    WHEN s.title LIKE '%Curcumin%' AND n.name LIKE '%Cúrcuma%' THEN 5
    WHEN s.title LIKE '%Omega-3%' AND n.name LIKE '%Ômega-3%' THEN 5
    WHEN s.title LIKE '%Resveratrol%' AND n.name LIKE '%Resveratrol%' THEN 5
    WHEN s.title LIKE '%Vitamin D3%' AND n.name LIKE '%Vitamina D3%' THEN 5
    WHEN s.title LIKE '%Magnesium%' AND n.name LIKE '%Magnésio%' THEN 5
    WHEN s.title LIKE '%Coenzyme Q10%' AND n.name LIKE '%Coenzima Q10%' THEN 5
    WHEN s.title LIKE '%Ashwagandha%' AND n.name LIKE '%Ashwagandha%' THEN 5
    WHEN s.title LIKE '%Turmeric%' AND n.name LIKE '%Açafrão%' THEN 4
    WHEN s.title LIKE '%Zinc%' AND n.name LIKE '%Zinco%' THEN 5
    WHEN s.title LIKE '%Spirulina%' AND n.name LIKE '%Spirulina%' THEN 5
    ELSE 3
  END,
  'seed'
FROM nutra_ids n
CROSS JOIN study_ids s
WHERE 
  (s.title LIKE '%Curcumin%' AND n.name LIKE '%Cúrcuma%') OR
  (s.title LIKE '%Omega-3%' AND n.name LIKE '%Ômega-3%') OR
  (s.title LIKE '%Resveratrol%' AND n.name LIKE '%Resveratrol%') OR
  (s.title LIKE '%Vitamin D3%' AND n.name LIKE '%Vitamina D3%') OR
  (s.title LIKE '%Magnesium%' AND n.name LIKE '%Magnésio%') OR
  (s.title LIKE '%Coenzyme Q10%' AND n.name LIKE '%Coenzima Q10%') OR
  (s.title LIKE '%Ashwagandha%' AND n.name LIKE '%Ashwagandha%') OR
  (s.title LIKE '%Turmeric%' AND n.name LIKE '%Açafrão%') OR
  (s.title LIKE '%Zinc%' AND n.name LIKE '%Zinco%') OR
  (s.title LIKE '%Spirulina%' AND n.name LIKE '%Spirulina%');

-- Adicionar algumas associações adicionais para nutracêuticos que podem se beneficiar de estudos gerais
INSERT INTO nutraceutical_studies (nutraceutical_id, study_id, relevance_score, data_type)
SELECT 
  n.id,
  s.id,
  3,
  'seed'
FROM nutraceuticals n
CROSS JOIN scientific_studies s
WHERE s.data_type = 'seed'
AND n.data_type != 'seed'
AND NOT EXISTS (
  SELECT 1 FROM nutraceutical_studies ns 
  WHERE ns.nutraceutical_id = n.id AND ns.study_id = s.id
)
LIMIT 20;
