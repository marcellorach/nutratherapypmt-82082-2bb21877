
-- Drop restrictive SELECT policies and replace with public access

-- processed_studies
DROP POLICY IF EXISTS "Admins can view all processed studies" ON public.processed_studies;
CREATE POLICY "Anyone can view processed studies" ON public.processed_studies FOR SELECT USING (true);

-- scientific_studies
DROP POLICY IF EXISTS "Anyone authenticated can view studies" ON public.scientific_studies;
CREATE POLICY "Anyone can view studies" ON public.scientific_studies FOR SELECT USING (true);

-- triplet_extractions
DROP POLICY IF EXISTS "Anyone authenticated can view triplet extractions" ON public.triplet_extractions;
CREATE POLICY "Anyone can view triplet extractions" ON public.triplet_extractions FOR SELECT USING (true);

-- hierarchical_edges
DROP POLICY IF EXISTS "Anyone authenticated can view hierarchical_edges" ON public.hierarchical_edges;
CREATE POLICY "Anyone can view hierarchical_edges" ON public.hierarchical_edges FOR SELECT USING (true);

-- veterinary_ontology
DROP POLICY IF EXISTS "Anyone authenticated can view veterinary_ontology" ON public.veterinary_ontology;
CREATE POLICY "Anyone can view veterinary_ontology" ON public.veterinary_ontology FOR SELECT USING (true);

-- evidence_claims
DROP POLICY IF EXISTS "Anyone authenticated can view evidence_claims" ON public.evidence_claims;
CREATE POLICY "Anyone can view evidence_claims" ON public.evidence_claims FOR SELECT USING (true);

-- evidence_conflicts
DROP POLICY IF EXISTS "Anyone authenticated can view evidence_conflicts" ON public.evidence_conflicts;
CREATE POLICY "Anyone can view evidence_conflicts" ON public.evidence_conflicts FOR SELECT USING (true);

-- canonical_resolutions
DROP POLICY IF EXISTS "Anyone authenticated can view canonical_resolutions" ON public.canonical_resolutions;
CREATE POLICY "Anyone can view canonical_resolutions" ON public.canonical_resolutions FOR SELECT USING (true);

-- scispace_imports
DROP POLICY IF EXISTS "Admins can view all imports" ON public.scispace_imports;
CREATE POLICY "Anyone can view imports" ON public.scispace_imports FOR SELECT USING (true);

-- study_embeddings
DROP POLICY IF EXISTS "Admins can view embeddings" ON public.study_embeddings;
CREATE POLICY "Anyone can view embeddings" ON public.study_embeddings FOR SELECT USING (true);

-- study_extractions
DROP POLICY IF EXISTS "Admins can view all extractions" ON public.study_extractions;
CREATE POLICY "Anyone can view extractions" ON public.study_extractions FOR SELECT USING (true);

-- Also open other key tables for reading
-- health_conditions
DROP POLICY IF EXISTS "Anyone authenticated can view conditions" ON public.health_conditions;
CREATE POLICY "Anyone can view conditions" ON public.health_conditions FOR SELECT USING (true);

-- nutraceuticals
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceuticals" ON public.nutraceuticals;
CREATE POLICY "Anyone can view nutraceuticals" ON public.nutraceuticals FOR SELECT USING (true);

-- breeds
DROP POLICY IF EXISTS "Anyone authenticated can view breeds" ON public.breeds;
CREATE POLICY "Anyone can view breeds" ON public.breeds FOR SELECT USING (true);

-- breed_groups
DROP POLICY IF EXISTS "Anyone authenticated can view breed_groups" ON public.breed_groups;
CREATE POLICY "Anyone can view breed_groups" ON public.breed_groups FOR SELECT USING (true);

-- species
DROP POLICY IF EXISTS "Anyone authenticated can view species" ON public.species;
CREATE POLICY "Anyone can view species" ON public.species FOR SELECT USING (true);

-- nutraceutical_conditions
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_conditions" ON public.nutraceutical_conditions;
CREATE POLICY "Anyone can view nutraceutical_conditions" ON public.nutraceutical_conditions FOR SELECT USING (true);

-- nutraceutical_benefits
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_benefits" ON public.nutraceutical_benefits;
CREATE POLICY "Anyone can view nutraceutical_benefits" ON public.nutraceutical_benefits FOR SELECT USING (true);

-- breed_predispositions
DROP POLICY IF EXISTS "Anyone authenticated can view breed_predispositions" ON public.breed_predispositions;
CREATE POLICY "Anyone can view breed_predispositions" ON public.breed_predispositions FOR SELECT USING (true);

-- pathway_nodes
DROP POLICY IF EXISTS "Anyone authenticated can view pathway_nodes" ON public.pathway_nodes;
CREATE POLICY "Anyone can view pathway_nodes" ON public.pathway_nodes FOR SELECT USING (true);

-- mechanism_nodes
DROP POLICY IF EXISTS "Anyone authenticated can view mechanism_nodes" ON public.mechanism_nodes;
CREATE POLICY "Anyone can view mechanism_nodes" ON public.mechanism_nodes FOR SELECT USING (true);

-- biological_effect_nodes
DROP POLICY IF EXISTS "Anyone authenticated can view biological_effect_nodes" ON public.biological_effect_nodes;
CREATE POLICY "Anyone can view biological_effect_nodes" ON public.biological_effect_nodes FOR SELECT USING (true);

-- outcome_families
DROP POLICY IF EXISTS "Anyone authenticated can view outcome_families" ON public.outcome_families;
CREATE POLICY "Anyone can view outcome_families" ON public.outcome_families FOR SELECT USING (true);

-- nutraceutical_categories
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_categories" ON public.nutraceutical_categories;
CREATE POLICY "Anyone can view nutraceutical_categories" ON public.nutraceutical_categories FOR SELECT USING (true);

-- recommendation_logs
DROP POLICY IF EXISTS "Anyone authenticated can view recommendation_logs" ON public.recommendation_logs;
CREATE POLICY "Anyone can view recommendation_logs" ON public.recommendation_logs FOR SELECT USING (true);

-- auto_discoveries
DROP POLICY IF EXISTS "Anyone authenticated can view auto_discoveries" ON public.auto_discoveries;
CREATE POLICY "Anyone can view auto_discoveries" ON public.auto_discoveries FOR SELECT USING (true);

-- base_knowledge_candidates  
DROP POLICY IF EXISTS "Anyone authenticated can view base_knowledge_candidates" ON public.base_knowledge_candidates;
CREATE POLICY "Anyone can view base_knowledge_candidates" ON public.base_knowledge_candidates FOR SELECT USING (true);

-- study_chat_history
DROP POLICY IF EXISTS "Anyone authenticated can view study_chat_history" ON public.study_chat_history;
CREATE POLICY "Anyone can view study_chat_history" ON public.study_chat_history FOR SELECT USING (true);

-- pet_profiles
DROP POLICY IF EXISTS "Anyone authenticated can view pet_profiles" ON public.pet_profiles;
CREATE POLICY "Anyone can view pet_profiles" ON public.pet_profiles FOR SELECT USING (true);

-- nutraceutical_outcomes
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_outcomes" ON public.nutraceutical_outcomes;
CREATE POLICY "Anyone can view nutraceutical_outcomes" ON public.nutraceutical_outcomes FOR SELECT USING (true);

-- nutraceutical_scientific_metadata
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_scientific_metadata" ON public.nutraceutical_scientific_metadata;
CREATE POLICY "Anyone can view nutraceutical_scientific_metadata" ON public.nutraceutical_scientific_metadata FOR SELECT USING (true);

-- nutraceutical_studies
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_studies" ON public.nutraceutical_studies;
CREATE POLICY "Anyone can view nutraceutical_studies" ON public.nutraceutical_studies FOR SELECT USING (true);

-- nutraceutical_contraindications
DROP POLICY IF EXISTS "Anyone authenticated can view nutraceutical_contraindications" ON public.nutraceutical_contraindications;
CREATE POLICY "Anyone can view nutraceutical_contraindications" ON public.nutraceutical_contraindications FOR SELECT USING (true);

-- medical_knowledge_graph
DROP POLICY IF EXISTS "Anyone authenticated can view medical_knowledge_graph" ON public.medical_knowledge_graph;
CREATE POLICY "Anyone can view medical_knowledge_graph" ON public.medical_knowledge_graph FOR SELECT USING (true);

-- medical_knowledge_edges
DROP POLICY IF EXISTS "Anyone authenticated can view medical_knowledge_edges" ON public.medical_knowledge_edges;
CREATE POLICY "Anyone can view medical_knowledge_edges" ON public.medical_knowledge_edges FOR SELECT USING (true);

-- taxonomy_dictionaries
DROP POLICY IF EXISTS "Anyone authenticated can view taxonomy_dictionaries" ON public.taxonomy_dictionaries;
CREATE POLICY "Anyone can view taxonomy_dictionaries" ON public.taxonomy_dictionaries FOR SELECT USING (true);

-- taxonomy_suggestions
DROP POLICY IF EXISTS "Anyone authenticated can view taxonomy_suggestions" ON public.taxonomy_suggestions;
CREATE POLICY "Anyone can view taxonomy_suggestions" ON public.taxonomy_suggestions FOR SELECT USING (true);

-- ai_configurations
DROP POLICY IF EXISTS "Anyone authenticated can view ai_configurations" ON public.ai_configurations;
CREATE POLICY "Anyone can view ai_configurations" ON public.ai_configurations FOR SELECT USING (true);

-- user_roles
DROP POLICY IF EXISTS "Anyone authenticated can view user_roles" ON public.user_roles;
CREATE POLICY "Anyone can view user_roles" ON public.user_roles FOR SELECT USING (true);

-- profiles
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
