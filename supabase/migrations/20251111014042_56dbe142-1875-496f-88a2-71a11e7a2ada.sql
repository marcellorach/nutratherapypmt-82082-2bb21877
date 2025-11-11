-- Migration: Add bilingual fields (_en columns) to all entities for automatic translation

-- 1. Nutraceuticals
ALTER TABLE nutraceuticals 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS source_en TEXT,
ADD COLUMN IF NOT EXISTS dosage_en TEXT;

-- 2. Scientific Studies
ALTER TABLE scientific_studies 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS abstract_en TEXT,
ADD COLUMN IF NOT EXISTS journal_en TEXT;

-- 3. Outcome Families
ALTER TABLE outcome_families 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 4. Nutraceutical Categories
ALTER TABLE nutraceutical_categories 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 5. Nutraceutical Benefits
ALTER TABLE nutraceutical_benefits 
ADD COLUMN IF NOT EXISTS benefit_en TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nutraceuticals_name_en ON nutraceuticals(name_en);
CREATE INDEX IF NOT EXISTS idx_scientific_studies_title_en ON scientific_studies(title_en);
CREATE INDEX IF NOT EXISTS idx_outcome_families_name_en ON outcome_families(name_en);
CREATE INDEX IF NOT EXISTS idx_nutraceutical_categories_name_en ON nutraceutical_categories(name_en);