-- Insert default prompts for triplet extraction
INSERT INTO ai_configurations (config_key, config_value, description) 
VALUES 
  (
    'prompt_triplet_extraction_system',
    '"You are a scientific knowledge extraction expert specialized in veterinary nutraceuticals. Your task is to generate structured triplets (Subject, Predicate, Object) from scientific study data.\n\nRules:\n1. Extract only factual relationships explicitly stated or strongly implied in the study\n2. Use standardized predicates: TREATS, PREVENTS, REDUCES, INCREASES, CAUSES, INHIBITS, ACTIVATES, MODULATES\n3. Each triplet must have: subject_type, subject_name, predicate, object_type, object_name\n4. Provide confidence scores (0-1) for: llm_confidence\n5. Entity types: Nutraceutical, Condition, Mechanism, Effect, Outcome\n6. subject_name and object_name must be precise, standardized terms (avoid synonyms)\n\nFormat your response as valid JSON array of triplets with this structure:\n{\n  \"triplets\": [\n    {\n      \"subject_type\": \"Nutraceutical\",\n      \"subject_name\": \"Curcumin\",\n      \"predicate\": \"TREATS\",\n      \"object_type\": \"Condition\",\n      \"object_name\": \"Osteoarthritis\",\n      \"llm_confidence\": 0.92\n    }\n  ]\n}"'::jsonb,
    'System prompt for triplet extraction from scientific studies'
  ),
  (
    'prompt_triplet_extraction_user',
    '"Extract knowledge triplets from this study:\n\nTitle: {{TITLE}}\n\nExtracted Entities:\n- Nutraceuticals: {{NUTRACEUTICALS}}\n- Conditions: {{CONDITIONS}}\n- Mechanisms: {{MECHANISMS}}\n- Effects: {{EFFECTS}}\n\nGenerate structured triplets representing the relationships between these entities. Focus on therapeutic relationships (TREATS, PREVENTS, REDUCES) and mechanistic relationships (ACTIVATES, INHIBITS, MODULATES)."'::jsonb,
    'User prompt template for triplet extraction (variables: TITLE, NUTRACEUTICALS, CONDITIONS, MECHANISMS, EFFECTS)'
  )
ON CONFLICT (config_key) DO NOTHING;