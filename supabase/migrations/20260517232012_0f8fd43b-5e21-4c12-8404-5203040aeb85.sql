
-- Extend pet_food_nutrition with full AAFCO/FEDIAF composition fields:
-- trace minerals, vitamins, amino acids, fatty acid breakdown, completeness score.
ALTER TABLE public.pet_food_nutrition
  -- Trace minerals (mg/kg)
  ADD COLUMN IF NOT EXISTS iron_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS copper_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS zinc_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS manganese_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS selenium_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS iodine_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS chloride_pct numeric,
  -- Vitamins
  ADD COLUMN IF NOT EXISTS vit_a_iu_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_d3_iu_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_e_iu_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_k_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b1_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b2_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b3_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b5_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b6_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b9_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS vit_b12_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS biotin_mg_per_kg numeric,
  ADD COLUMN IF NOT EXISTS choline_mg_per_kg numeric,
  -- Fatty acid breakdown
  ADD COLUMN IF NOT EXISTS epa_pct numeric,
  ADD COLUMN IF NOT EXISTS dha_pct numeric,
  ADD COLUMN IF NOT EXISTS ara_pct numeric,
  -- Amino acids (%)
  ADD COLUMN IF NOT EXISTS lysine_pct numeric,
  ADD COLUMN IF NOT EXISTS methionine_pct numeric,
  ADD COLUMN IF NOT EXISTS tryptophan_pct numeric,
  ADD COLUMN IF NOT EXISTS threonine_pct numeric,
  ADD COLUMN IF NOT EXISTS arginine_pct numeric,
  -- Completeness tracking
  ADD COLUMN IF NOT EXISTS completeness_score numeric,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS data_filled_at timestamptz;
