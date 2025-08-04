-- Classificar outcomes existentes por família

-- Cardiovascular
UPDATE nutraceutical_outcomes 
SET family_id = '5b35db5e-40f0-48a0-b40f-97fdc519c31c'
WHERE name IN (
  'Cardiomiopatia dilatada',
  'Insuficiência cardíaca',
  'Hipertensão arterial',
  'Aterosclerose'
);

-- Neurológico & Cognitivo  
UPDATE nutraceutical_outcomes 
SET family_id = '7ec8d075-0a5d-4990-b144-fefe282f893e'
WHERE name IN (
  'Fadiga crônica',
  'Declínio cognitivo',
  'Demência canina',
  'Epilepsia'
);

-- Musculoesquelético
UPDATE nutraceutical_outcomes 
SET family_id = 'cdf853bf-afe5-4239-b02a-203ec628d589'
WHERE name IN (
  'Osteoartrite canina',
  'Displasia de quadril',
  'Artrite reumatoide',
  'Problemas articulares'
);

-- Imunológico & Inflamatório
UPDATE nutraceutical_outcomes 
SET family_id = 'b5d6a47b-8145-4d13-97b5-478fdd084fc6'
WHERE name IN (
  'Dermatite atópica canina',
  'Imunodeficiência',
  'Infecções respiratórias',
  'Doenças autoimunes',
  'Processos inflamatórios'
);

-- Envelhecimento & Longevidade
UPDATE nutraceutical_outcomes 
SET family_id = '436b5183-3686-42b7-94f2-6afe8ff42c78'
WHERE name IN (
  'All-cause mortality',
  'Envelhecimento precoce',
  'Longevidade',
  'Antioxidação'
);

-- Doenças Sistêmicas Crônicas
UPDATE nutraceutical_outcomes 
SET family_id = '9a6eab92-0c84-42ac-a399-9a23c478cee6'
WHERE name IN (
  'Doença renal crônica',
  'Hepatopatias crônicas e agudas',
  'Insuficiência renal',
  'Diabetes mellitus',
  'Síndrome metabólica'
);