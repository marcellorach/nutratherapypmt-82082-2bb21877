-- 1. Helper: approved platform member (signed in AND granted a role)
CREATE OR REPLACE FUNCTION public.is_platform_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_member() TO authenticated, service_role;

-- 2. Replace "signed-in is enough" read policies with member-scoped ones
DROP POLICY IF EXISTS "Anyone authenticated can view benefits" ON public.nutraceutical_benefits;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_benefits" ON public.nutraceutical_benefits;
CREATE POLICY "Platform members can view nutraceutical benefits" ON public.nutraceutical_benefits FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view journal tiers" ON public.journal_prestige_tiers;
CREATE POLICY "Platform members can view journal tiers" ON public.journal_prestige_tiers FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated users can view study embeddings" ON public.study_embeddings;
CREATE POLICY "Platform members can view study embeddings" ON public.study_embeddings FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can view audit prompt versions" ON public.audit_prompt_versions;
CREATE POLICY "Platform members can view audit prompt versions" ON public.audit_prompt_versions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view breed predispositions" ON public.breed_predispositions;
DROP POLICY IF EXISTS "Anyone can view breed_predispositions" ON public.breed_predispositions;
CREATE POLICY "Platform members can view breed predispositions" ON public.breed_predispositions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read nutrition" ON public.pet_food_nutrition;
CREATE POLICY "Platform members can read nutrition" ON public.pet_food_nutrition FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated view suggestions" ON public.cohort_suggestions;
CREATE POLICY "Platform members can view cohort suggestions" ON public.cohort_suggestions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view metadata" ON public.nutraceutical_scientific_metadata;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_scientific_metadata" ON public.nutraceutical_scientific_metadata;
CREATE POLICY "Platform members can view scientific metadata" ON public.nutraceutical_scientific_metadata FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view outcome families" ON public.outcome_families;
DROP POLICY IF EXISTS "Anyone can view outcome_families" ON public.outcome_families;
CREATE POLICY "Platform members can view outcome families" ON public.outcome_families FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view aging curves" ON public.breed_aging_curves;
CREATE POLICY "Platform members can view aging curves" ON public.breed_aging_curves FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical outcomes" ON public.nutraceutical_outcomes;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_outcomes" ON public.nutraceutical_outcomes;
CREATE POLICY "Platform members can view nutraceutical outcomes" ON public.nutraceutical_outcomes FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read pet food brands" ON public.pet_food_brands;
CREATE POLICY "Platform members can read pet food brands" ON public.pet_food_brands FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view technical_audits" ON public.technical_audits;
CREATE POLICY "Platform members can view technical audits" ON public.technical_audits FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical studies" ON public.nutraceutical_studies;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_studies" ON public.nutraceutical_studies;
CREATE POLICY "Platform members can view nutraceutical studies" ON public.nutraceutical_studies FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view taxonomy suggestions" ON public.taxonomy_suggestions;
CREATE POLICY "Platform members can view taxonomy suggestions" ON public.taxonomy_suggestions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view translations" ON public.translations;
CREATE POLICY "Platform members can view translations" ON public.translations FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated users can view evidence_conflicts" ON public.evidence_conflicts;
CREATE POLICY "Platform members can view evidence conflicts" ON public.evidence_conflicts FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical conditions" ON public.nutraceutical_conditions;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_conditions" ON public.nutraceutical_conditions;
CREATE POLICY "Platform members can view nutraceutical conditions" ON public.nutraceutical_conditions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated users can view nutraceutical categories" ON public.nutraceutical_categories;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_categories" ON public.nutraceutical_categories;
CREATE POLICY "Platform members can view nutraceutical categories" ON public.nutraceutical_categories FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can view cohorts" ON public.synthetic_cohorts;
CREATE POLICY "Platform members can view cohorts" ON public.synthetic_cohorts FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view health conditions" ON public.health_conditions;
DROP POLICY IF EXISTS "Anyone can view conditions" ON public.health_conditions;
CREATE POLICY "Platform members can view health conditions" ON public.health_conditions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view breed groups" ON public.breed_groups;
DROP POLICY IF EXISTS "Anyone can view breed_groups" ON public.breed_groups;
CREATE POLICY "Platform members can view breed groups" ON public.breed_groups FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated users can view contraindications" ON public.nutraceutical_contraindications;
DROP POLICY IF EXISTS "Anyone can view nutraceutical_contraindications" ON public.nutraceutical_contraindications;
CREATE POLICY "Platform members can view contraindications" ON public.nutraceutical_contraindications FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated users can view processed studies" ON public.processed_studies;
CREATE POLICY "Platform members can view processed studies" ON public.processed_studies FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read ingredients" ON public.pet_food_ingredients;
CREATE POLICY "Platform members can read ingredients" ON public.pet_food_ingredients FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can view insights" ON public.cohort_insights;
CREATE POLICY "Platform members can view cohort insights" ON public.cohort_insights FOR SELECT TO authenticated USING (public.is_platform_member());

-- 3. Replace remaining "everyone through" (USING true) read policies
DROP POLICY IF EXISTS "Authenticated read aliases" ON public.ai_task_aliases;
CREATE POLICY "Platform members can read task aliases" ON public.ai_task_aliases FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view biological_effect_nodes" ON public.biological_effect_nodes;
CREATE POLICY "Platform members can view biological effect nodes" ON public.biological_effect_nodes FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view breeds" ON public.breeds;
CREATE POLICY "Platform members can view breeds" ON public.breeds FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view canonical_resolutions" ON public.canonical_resolutions;
CREATE POLICY "Platform members can view canonical resolutions" ON public.canonical_resolutions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read dosage reference" ON public.compound_dosage_reference;
CREATE POLICY "Platform members can read dosage reference" ON public.compound_dosage_reference FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view condition_response_curves" ON public.condition_response_curves;
CREATE POLICY "Platform members can view condition response curves" ON public.condition_response_curves FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "core_rule_evidence_select_authenticated" ON public.core_rule_evidence;
CREATE POLICY "Platform members can view core rule evidence" ON public.core_rule_evidence FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "core_rule_modulators_select_authenticated" ON public.core_rule_modulators;
CREATE POLICY "Platform members can view core rule modulators" ON public.core_rule_modulators FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "core_rules_select_authenticated" ON public.core_rules;
CREATE POLICY "Platform members can view core rules" ON public.core_rules FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read drug_brands" ON public.drug_brands;
CREATE POLICY "Platform members can read drug brands" ON public.drug_brands FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read drug_interactions" ON public.drug_interactions;
CREATE POLICY "Platform members can read drug interactions" ON public.drug_interactions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read drug_substances" ON public.drug_substances;
CREATE POLICY "Platform members can read drug substances" ON public.drug_substances FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view evidence_claims" ON public.evidence_claims;
CREATE POLICY "Platform members can view evidence claims" ON public.evidence_claims FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view hierarchical_edges" ON public.hierarchical_edges;
CREATE POLICY "Platform members can view hierarchical edges" ON public.hierarchical_edges FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view lab_reference_ranges" ON public.lab_reference_ranges;
CREATE POLICY "Platform members can view lab reference ranges" ON public.lab_reference_ranges FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view mechanism_nodes" ON public.mechanism_nodes;
CREATE POLICY "Platform members can view mechanism nodes" ON public.mechanism_nodes FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view medical_knowledge_edges" ON public.medical_knowledge_edges;
CREATE POLICY "Platform members can view medical knowledge edges" ON public.medical_knowledge_edges FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view medical_knowledge_graph" ON public.medical_knowledge_graph;
CREATE POLICY "Platform members can view medical knowledge graph" ON public.medical_knowledge_graph FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "meta_studies_select_authenticated" ON public.meta_studies;
CREATE POLICY "Platform members can view meta studies" ON public.meta_studies FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view nutraceuticals" ON public.nutraceuticals;
CREATE POLICY "Platform members can view nutraceuticals" ON public.nutraceuticals FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view pathway_nodes" ON public.pathway_nodes;
CREATE POLICY "Platform members can view pathway nodes" ON public.pathway_nodes FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.permissions;
CREATE POLICY "Platform members can read permissions" ON public.permissions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Authenticated can read role permissions" ON public.role_permissions;
CREATE POLICY "Platform members can read role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view studies" ON public.scientific_studies;
CREATE POLICY "Platform members can view scientific studies" ON public.scientific_studies FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view species" ON public.species;
CREATE POLICY "Platform members can view species" ON public.species FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view extractions" ON public.study_extractions;
CREATE POLICY "Platform members can view extractions" ON public.study_extractions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone authenticated can view taxonomy dictionaries" ON public.taxonomy_dictionaries;
DROP POLICY IF EXISTS "Anyone can view taxonomy_dictionaries" ON public.taxonomy_dictionaries;
CREATE POLICY "Platform members can view taxonomy dictionaries" ON public.taxonomy_dictionaries FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view triplet extractions" ON public.triplet_extractions;
CREATE POLICY "Platform members can view triplet extractions" ON public.triplet_extractions FOR SELECT TO authenticated USING (public.is_platform_member());

DROP POLICY IF EXISTS "Anyone can view veterinary_ontology" ON public.veterinary_ontology;
CREATE POLICY "Platform members can view veterinary ontology" ON public.veterinary_ontology FOR SELECT TO authenticated USING (public.is_platform_member());

-- 4. Storage: bind pet files to their owners, stop public listing
DROP POLICY IF EXISTS "Authenticated users can upload pet exam pdfs" ON storage.objects;
CREATE POLICY "Pet exam pdfs uploadable by owners or admins"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pet_exams_pdfs'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pet_profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND (p.veterinarian_id = auth.uid() OR p.created_by = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Pet photos are publicly readable" ON storage.objects;
CREATE POLICY "Pet photos readable by owners or admins"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pet_profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND (p.veterinarian_id = auth.uid() OR p.created_by = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "meta_study_covers_public_read" ON storage.objects;
CREATE POLICY "meta_study_covers_member_read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'meta-study-covers' AND public.is_platform_member());