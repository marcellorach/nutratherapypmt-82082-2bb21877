
-- =========================================================
-- Phase 1+2: Consultations, Nutrition, Pet Food Catalog
-- =========================================================

-- ---------- pet_consultations ----------
CREATE TABLE public.pet_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  veterinarian_id UUID,
  veterinarian_name TEXT,
  chief_complaint TEXT,
  clinical_exam TEXT,
  weight_kg_at_visit NUMERIC,
  body_condition_score INTEGER CHECK (body_condition_score BETWEEN 1 AND 9),
  assessment TEXT,
  plan TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_consultations_pet ON public.pet_consultations(pet_id, consultation_date DESC);
CREATE INDEX idx_pet_consultations_latest ON public.pet_consultations(pet_id) WHERE is_latest;

ALTER TABLE public.pet_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vet/owner/admin can view pet consultations" ON public.pet_consultations
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.pet_profiles pp
  WHERE pp.id = pet_consultations.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE POLICY "Authenticated can insert pet consultations" ON public.pet_consultations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Vet/owner/admin can update pet consultations" ON public.pet_consultations
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.pet_profiles pp
  WHERE pp.id = pet_consultations.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE POLICY "Vet/owner/admin can delete pet consultations" ON public.pet_consultations
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.pet_profiles pp
  WHERE pp.id = pet_consultations.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));

CREATE TRIGGER trg_pet_consultations_updated
BEFORE UPDATE ON public.pet_consultations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- maintain is_latest per pet
CREATE OR REPLACE FUNCTION public.refresh_pet_consultation_latest()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.pet_consultations SET is_latest = false
   WHERE pet_id = COALESCE(NEW.pet_id, OLD.pet_id);
  UPDATE public.pet_consultations SET is_latest = true
   WHERE id = (
     SELECT id FROM public.pet_consultations
      WHERE pet_id = COALESCE(NEW.pet_id, OLD.pet_id)
      ORDER BY consultation_date DESC, created_at DESC LIMIT 1
   );
  RETURN NULL;
END;$$;

CREATE TRIGGER trg_pet_consultations_latest
AFTER INSERT OR UPDATE OF consultation_date OR DELETE
ON public.pet_consultations
FOR EACH ROW EXECUTE FUNCTION public.refresh_pet_consultation_latest();

-- link existing detail tables
ALTER TABLE public.pet_conditions     ADD COLUMN consultation_id UUID REFERENCES public.pet_consultations(id) ON DELETE SET NULL;
ALTER TABLE public.pet_medications    ADD COLUMN consultation_id UUID REFERENCES public.pet_consultations(id) ON DELETE SET NULL;
ALTER TABLE public.pet_exams          ADD COLUMN consultation_id UUID REFERENCES public.pet_consultations(id) ON DELETE SET NULL;
ALTER TABLE public.pet_clinical_notes ADD COLUMN consultation_id UUID REFERENCES public.pet_consultations(id) ON DELETE SET NULL;

-- ---------- pet_food_brands ----------
CREATE TABLE public.pet_food_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  manufacturer TEXT,
  country TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pet_food_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read pet food brands" ON public.pet_food_brands FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can write pet food brands" ON public.pet_food_brands FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_pet_food_brands_updated BEFORE UPDATE ON public.pet_food_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_food_products ----------
CREATE TABLE public.pet_food_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.pet_food_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  line TEXT,
  species TEXT NOT NULL DEFAULT 'dog' CHECK (species IN ('dog','cat','both')),
  life_stage TEXT CHECK (life_stage IN ('puppy','adult','senior','all')),
  size_target TEXT CHECK (size_target IN ('small','medium','large','giant','all')),
  food_form TEXT CHECK (food_form IN ('dry_kibble','wet','semi_moist','raw','freeze_dried')),
  is_prescription BOOLEAN NOT NULL DEFAULT false,
  prescription_indication TEXT[],
  barcode TEXT,
  image_url TEXT,
  manufacturer_url TEXT,
  discontinued BOOLEAN NOT NULL DEFAULT false,
  submission_status TEXT NOT NULL DEFAULT 'approved' CHECK (submission_status IN ('pending','approved','rejected')),
  submitted_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);
CREATE INDEX idx_pet_food_products_brand ON public.pet_food_products(brand_id);
CREATE INDEX idx_pet_food_products_species ON public.pet_food_products(species);
CREATE INDEX idx_pet_food_products_status ON public.pet_food_products(submission_status);
ALTER TABLE public.pet_food_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read approved products" ON public.pet_food_products
FOR SELECT USING (auth.uid() IS NOT NULL AND (submission_status = 'approved' OR submitted_by = auth.uid() OR public.is_admin()));
CREATE POLICY "Authenticated can submit pending products" ON public.pet_food_products
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (submission_status = 'pending' OR public.is_admin()));
CREATE POLICY "Admin can update products" ON public.pet_food_products
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete products" ON public.pet_food_products
FOR DELETE USING (public.is_admin());
CREATE TRIGGER trg_pet_food_products_updated BEFORE UPDATE ON public.pet_food_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_food_nutrition ----------
CREATE TABLE public.pet_food_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.pet_food_products(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manufacturer_label' CHECK (source IN ('manufacturer_label','manufacturer_site','independent_lab','llm_estimated','user_submitted')),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  -- macros
  protein_pct NUMERIC,
  fat_pct NUMERIC,
  fiber_pct NUMERIC,
  moisture_pct NUMERIC,
  ash_pct NUMERIC,
  nfe_pct NUMERIC,
  kcal_per_100g NUMERIC,
  kcal_per_kg NUMERIC,
  -- protein
  primary_protein_source TEXT,
  protein_sources TEXT[],
  is_grain_free BOOLEAN,
  is_hypoallergenic BOOLEAN,
  -- minerals
  calcium_pct NUMERIC,
  phosphorus_pct NUMERIC,
  ca_p_ratio NUMERIC,
  sodium_pct NUMERIC,
  potassium_pct NUMERIC,
  magnesium_pct NUMERIC,
  -- lipids
  omega3_pct NUMERIC,
  omega6_pct NUMERIC,
  omega6_omega3_ratio NUMERIC,
  epa_dha_pct NUMERIC,
  -- functionals
  glucosamine_mg_per_kg NUMERIC,
  chondroitin_mg_per_kg NUMERIC,
  taurine_mg_per_kg NUMERIC,
  l_carnitine_mg_per_kg NUMERIC,
  antioxidants_added BOOLEAN,
  prebiotics TEXT[],
  probiotics TEXT[],
  -- adequacy
  aafco_statement TEXT,
  meets_aafco_complete BOOLEAN,
  fediaf_compliant BOOLEAN,
  raw_label_text TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, revision)
);
CREATE INDEX idx_pet_food_nutrition_product ON public.pet_food_nutrition(product_id);
ALTER TABLE public.pet_food_nutrition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read nutrition" ON public.pet_food_nutrition FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can write nutrition" ON public.pet_food_nutrition FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_pet_food_nutrition_updated BEFORE UPDATE ON public.pet_food_nutrition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_food_ingredients ----------
CREATE TABLE public.pet_food_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.pet_food_products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  ingredient_name TEXT NOT NULL,
  ingredient_canonical_id UUID,
  is_named_meat BOOLEAN,
  is_byproduct BOOLEAN,
  is_preservative BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_food_ingredients_product ON public.pet_food_ingredients(product_id, position);
ALTER TABLE public.pet_food_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read ingredients" ON public.pet_food_ingredients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can write ingredients" ON public.pet_food_ingredients FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- pet_nutrition (per-pet/per-consultation) ----------
CREATE TABLE public.pet_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.pet_consultations(id) ON DELETE SET NULL,
  diet_type TEXT NOT NULL CHECK (diet_type IN ('commercial_dry','commercial_wet','mixed_commercial','home_cooked','raw_barf','prescription','mixed_natural_commercial')),
  daily_amount_g NUMERIC,
  meals_per_day INTEGER,
  treats_frequency TEXT CHECK (treats_frequency IN ('none','occasional','daily')),
  treats_description TEXT,
  water_intake TEXT CHECK (water_intake IN ('low','normal','high')),
  restrictions TEXT[],
  notes TEXT,
  started_at DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_nutrition_pet ON public.pet_nutrition(pet_id);
CREATE INDEX idx_pet_nutrition_current ON public.pet_nutrition(pet_id) WHERE is_current;
ALTER TABLE public.pet_nutrition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vet/owner/admin can view pet nutrition" ON public.pet_nutrition
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.pet_profiles pp
  WHERE pp.id = pet_nutrition.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE POLICY "Authenticated can insert pet nutrition" ON public.pet_nutrition FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Vet/owner/admin can update pet nutrition" ON public.pet_nutrition
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.pet_profiles pp WHERE pp.id = pet_nutrition.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE POLICY "Vet/owner/admin can delete pet nutrition" ON public.pet_nutrition
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.pet_profiles pp WHERE pp.id = pet_nutrition.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE TRIGGER trg_pet_nutrition_updated BEFORE UPDATE ON public.pet_nutrition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_nutrition_items ----------
CREATE TABLE public.pet_nutrition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_id UUID NOT NULL REFERENCES public.pet_nutrition(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.pet_food_products(id) ON DELETE SET NULL,
  raw_brand_text TEXT,
  raw_product_text TEXT,
  share_percent NUMERIC,
  daily_amount_g_per_item NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_nutrition_items_nutrition ON public.pet_nutrition_items(nutrition_id);
ALTER TABLE public.pet_nutrition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vet/owner/admin can view nutrition items" ON public.pet_nutrition_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.pet_nutrition pn
  JOIN public.pet_profiles pp ON pp.id = pn.pet_id
  WHERE pn.id = pet_nutrition_items.nutrition_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE POLICY "Authenticated can insert nutrition items" ON public.pet_nutrition_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Vet/owner/admin can update nutrition items" ON public.pet_nutrition_items
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.pet_nutrition pn JOIN public.pet_profiles pp ON pp.id = pn.pet_id
  WHERE pn.id = pet_nutrition_items.nutrition_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
CREATE POLICY "Vet/owner/admin can delete nutrition items" ON public.pet_nutrition_items
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.pet_nutrition pn JOIN public.pet_profiles pp ON pp.id = pn.pet_id
  WHERE pn.id = pet_nutrition_items.nutrition_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
));
