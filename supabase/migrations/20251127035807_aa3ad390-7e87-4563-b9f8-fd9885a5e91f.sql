-- Remover constraint antigo de object_type
ALTER TABLE triplet_extractions 
DROP CONSTRAINT IF EXISTS triplet_extractions_object_type_check;

-- Adicionar novo constraint com tipos expandidos
ALTER TABLE triplet_extractions 
ADD CONSTRAINT triplet_extractions_object_type_check 
CHECK (object_type IN (
  'Nutraceutical',
  'Condition', 
  'HealthCondition',
  'Disease',
  'Mechanism',
  'MolecularMechanism',
  'Pathway',
  'BiologicalProcess',
  'Target',
  'Compound',
  'Symptom',
  'Treatment',
  'Intervention'
));

-- Remover constraint antigo de subject_type
ALTER TABLE triplet_extractions 
DROP CONSTRAINT IF EXISTS triplet_extractions_subject_type_check;

-- Adicionar novo constraint de subject_type com tipos expandidos
ALTER TABLE triplet_extractions 
ADD CONSTRAINT triplet_extractions_subject_type_check 
CHECK (subject_type IN (
  'Nutraceutical',
  'Condition',
  'HealthCondition', 
  'Disease',
  'Mechanism',
  'MolecularMechanism',
  'Pathway',
  'BiologicalProcess',
  'Target',
  'Compound',
  'Symptom',
  'Treatment',
  'Intervention'
));