-- Add 4 new pet food products with verified nutritional data from manufacturer pages
-- Sources: 
--   Pro Plan Adult Large Breed Chicken & Rice: purina.com PDF label
--   Royal Canin Maxi Adult 5+: royalcanin.com Argentina product page
--   Royal Canin Renal Small Dog: royalcanin.com PT product page
--   Hill's Prescription Diet Metabolic + Mobility: hillspet.com product page (DM basis converted to as-fed via *0.9)

DO $$
DECLARE
  v_proplan_id UUID;
  v_rc_id UUID;
  v_hills_id UUID;
  v_pid UUID;
BEGIN
  SELECT id INTO v_proplan_id FROM public.pet_food_brands WHERE name = 'Pro Plan';
  SELECT id INTO v_rc_id FROM public.pet_food_brands WHERE name = 'Royal Canin';
  SELECT id INTO v_hills_id FROM public.pet_food_brands WHERE name = 'Hill''s';

  -- 1. Pro Plan Adult Large Breed Chicken & Rice
  INSERT INTO public.pet_food_products (brand_id, name, line, species, life_stage, size_target, food_form, is_prescription, manufacturer_url, submission_status)
  VALUES (v_proplan_id, 'Adult Large Breed Chicken & Rice', 'Specialized Large Breed', 'dog', 'adult', 'large', 'dry_kibble', false,
    'https://www.purina.com/sites/default/files/product-label-deck-file/2024-10/4451_n445123_pro_plan_large_breed_chicken_rice_formula_dog_food_547.pdf', 'approved')
  ON CONFLICT (brand_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_pid;
  
  INSERT INTO public.pet_food_nutrition (product_id, source, verified, protein_pct, fat_pct, fiber_pct, moisture_pct, kcal_per_100g, kcal_per_kg, primary_protein_source, calcium_pct, phosphorus_pct, ca_p_ratio, omega3_pct, omega6_pct, omega6_omega3_ratio, epa_dha_pct, glucosamine_mg_per_kg, taurine_mg_per_kg, antioxidants_added, meets_aafco_complete, raw_data)
  VALUES (v_pid, 'manufacturer_label', true, 26.0, 12.0, 4.5, 12.0, 327, 3270, 'chicken', 1.0, 0.8, 1.25, 0.4, 1.8, 4.5, 0.26, 500, 1500, true, true,
    jsonb_build_object('linoleic_acid_pct', 1.7, 'epa_pct', 0.14, 'dha_pct', 0.12, 'vitamin_a_iu_per_kg', 15000, 'vitamin_e_iu_per_kg', 460, 'vitamin_c_mg_per_kg', 70, 'kcal_calculation', 'modified Atwater (P*3.5 + F*8.5 + NFE*3.5), Ash assumed 7%', 'source_url', 'https://www.purina.com/sites/default/files/product-label-deck-file/2024-10/4451_n445123_pro_plan_large_breed_chicken_rice_formula_dog_food_547.pdf'))
  ON CONFLICT (product_id, revision) DO NOTHING;

  -- 2. Royal Canin Maxi Adult 5+
  INSERT INTO public.pet_food_products (brand_id, name, line, species, life_stage, size_target, food_form, is_prescription, manufacturer_url, submission_status)
  VALUES (v_rc_id, 'Maxi Adult 5+', 'Size Health Nutrition', 'dog', 'adult', 'large', 'dry_kibble', false,
    'https://www.royalcanin.com/ar/dogs/products/retail-products/maxi-adult-5%2B-3008', 'approved')
  ON CONFLICT (brand_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_pid;
  
  INSERT INTO public.pet_food_nutrition (product_id, source, verified, protein_pct, fat_pct, fiber_pct, moisture_pct, ash_pct, kcal_per_100g, kcal_per_kg, primary_protein_source, calcium_pct, phosphorus_pct, ca_p_ratio, sodium_pct, antioxidants_added, meets_aafco_complete, raw_data)
  VALUES (v_pid, 'manufacturer_label', true, 24.0, 15.0, 4.7, 11.0, 6.5, 389, 3890, 'chicken', 0.84, 0.70, 1.20, 0.42, true, true,
    jsonb_build_object('calcium_min_pct', 0.48, 'calcium_max_pct', 1.2, 'phosphorus_min_pct', 0.42, 'phosphorus_max_pct', 0.98, 'vitamin_a_iu_per_kg', 21800, 'vitamin_e_mg_per_kg', 500, 'vitamin_c_mg_per_kg', 300, 'l_carnitine_added', true, 'glucosamine_chondroitin_added', true, 'green_tea_polyphenols_added', true, 'lutein_added', true, 'source_url', 'https://www.royalcanin.com/ar/dogs/products/retail-products/maxi-adult-5%2B-3008'))
  ON CONFLICT (product_id, revision) DO NOTHING;

  -- 3. Royal Canin Renal Small Dog
  INSERT INTO public.pet_food_products (brand_id, name, line, species, life_stage, size_target, food_form, is_prescription, prescription_indication, manufacturer_url, submission_status)
  VALUES (v_rc_id, 'Veterinary Diet Renal Small Dog', 'Veterinary Health Nutrition', 'dog', 'adult', 'small', 'dry_kibble', true, ARRAY['chronic_kidney_disease', 'acute_kidney_injury'],
    'https://www.royalcanin.com/pt/dogs/products/vet-products/renal-small-dog-1249', 'approved')
  ON CONFLICT (brand_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_pid;
  
  INSERT INTO public.pet_food_nutrition (product_id, source, verified, protein_pct, fat_pct, fiber_pct, ash_pct, primary_protein_source, calcium_pct, phosphorus_pct, ca_p_ratio, potassium_pct, sodium_pct, omega6_pct, epa_dha_pct, antioxidants_added, meets_aafco_complete, raw_data)
  VALUES (v_pid, 'manufacturer_label', true, 14.0, 18.0, 2.4, 4.0, 'poultry_hydrolysate', 0.4, 0.2, 2.0, 0.6, 0.35, 4.0, 0.55, true, true,
    jsonb_build_object('linoleic_acid_pct', 4.0, 'protein_sources_note', 'corn gluten 8%, hydrolysed poultry 4.7%, wheat gluten 2.5%', 'vitamin_a_iu_per_kg', 15500, 'vitamin_d3_iu_per_kg', 1000, 'low_phosphorus_renal_diet', true, 'source_url', 'https://www.royalcanin.com/pt/dogs/products/vet-products/renal-small-dog-1249', 'kcal_not_published_on_label', true))
  ON CONFLICT (product_id, revision) DO NOTHING;

  -- 4. Hill's Prescription Diet Metabolic + Mobility (values converted from DM basis on hillspet.com to as-fed via *0.9)
  INSERT INTO public.pet_food_products (brand_id, name, line, species, life_stage, size_target, food_form, is_prescription, prescription_indication, manufacturer_url, submission_status)
  VALUES (v_hills_id, 'Prescription Diet Metabolic + Mobility', 'Prescription Diet', 'dog', 'adult', 'all', 'dry_kibble', true, ARRAY['obesity', 'osteoarthritis', 'joint_disease'],
    'https://www.hillspet.com/dog-food/pd-metabolic-plus-mobility-canine-dry', 'approved')
  ON CONFLICT (brand_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_pid;
  
  INSERT INTO public.pet_food_nutrition (product_id, source, verified, protein_pct, fat_pct, fiber_pct, moisture_pct, kcal_per_100g, kcal_per_kg, primary_protein_source, calcium_pct, phosphorus_pct, ca_p_ratio, potassium_pct, sodium_pct, magnesium_pct, omega3_pct, omega6_pct, omega6_omega3_ratio, glucosamine_mg_per_kg, l_carnitine_mg_per_kg, antioxidants_added, meets_aafco_complete, raw_data)
  VALUES (v_pid, 'manufacturer_site', true, 25.7, 12.5, 12.5, 10.0, 322, 3223, 'chicken_meal', 0.86, 0.65, 1.32, 0.89, 0.34, 0.136, 3.27, 2.19, 0.67, NULL, NULL, true, true,
    jsonb_build_object('basis_note', 'Hill''s site reports values on Dry Matter basis: Protein 28.5%, Fat 13.9%, Fiber 13.9%, Ca 0.95%, P 0.72%, K 0.99%, Na 0.38%, Mg 0.151%, Omega3 3.63%, Omega6 2.43%. Converted to as-fed assuming 10% moisture (multiply by 0.9).', 'kcal_per_kg_dry_matter', 3223, 'kcal_per_cup', 292, 'l_carnitine_in_ingredients', true, 'glucosamine_in_ingredients', true, 'chondroitin_in_ingredients', true, 'lipoic_acid_added', true, 'beta_carotene_added', true, 'source_url', 'https://www.hillspet.com/dog-food/pd-metabolic-plus-mobility-canine-dry'))
  ON CONFLICT (product_id, revision) DO NOTHING;
END $$;