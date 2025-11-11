-- Add English language fields to health_conditions table
ALTER TABLE public.health_conditions 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS category_en TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.health_conditions.name_en IS 'English translation of condition name';
COMMENT ON COLUMN public.health_conditions.description_en IS 'English translation of condition description';
COMMENT ON COLUMN public.health_conditions.category_en IS 'English translation of condition category';

-- Create index for English name searches
CREATE INDEX IF NOT EXISTS idx_health_conditions_name_en ON public.health_conditions(name_en);

-- Update existing records with English translations (examples - admin will need to fill these)
UPDATE public.health_conditions 
SET 
  name_en = CASE 
    WHEN name ILIKE '%artrite%' THEN 'Arthritis'
    WHEN name ILIKE '%diabetes%' THEN 'Diabetes'
    WHEN name ILIKE '%obesidade%' THEN 'Obesity'
    WHEN name ILIKE '%cardía%' OR name ILIKE '%coração%' THEN 'Heart Disease'
    WHEN name ILIKE '%renal%' OR name ILIKE '%rim%' THEN 'Kidney Disease'
    WHEN name ILIKE '%hepát%' OR name ILIKE '%fígado%' THEN 'Liver Disease'
    WHEN name ILIKE '%dermat%' OR name ILIKE '%pele%' THEN 'Skin Condition'
    WHEN name ILIKE '%digestiv%' OR name ILIKE '%gastro%' THEN 'Digestive Issue'
    WHEN name ILIKE '%respirat%' OR name ILIKE '%pulmon%' THEN 'Respiratory Condition'
    WHEN name ILIKE '%câncer%' OR name ILIKE '%tumor%' THEN 'Cancer'
    ELSE name || ' (translate)'
  END,
  category_en = CASE
    WHEN category ILIKE '%articular%' OR category ILIKE '%ósseo%' THEN 'Joint/Bone'
    WHEN category ILIKE '%metabólic%' THEN 'Metabolic'
    WHEN category ILIKE '%cardio%' OR category ILIKE '%vascular%' THEN 'Cardiovascular'
    WHEN category ILIKE '%renal%' THEN 'Renal'
    WHEN category ILIKE '%hepát%' THEN 'Hepatic'
    WHEN category ILIKE '%dermat%' THEN 'Dermatological'
    WHEN category ILIKE '%digestiv%' OR category ILIKE '%gastro%' THEN 'Digestive'
    WHEN category ILIKE '%respirat%' THEN 'Respiratory'
    WHEN category ILIKE '%oncológ%' THEN 'Oncological'
    WHEN category ILIKE '%neuro%' THEN 'Neurological'
    WHEN category ILIKE '%imuno%' THEN 'Immunological'
    ELSE category
  END,
  description_en = description
WHERE name_en IS NULL;