-- Axis 2 Wave 1: restore TEXT_CONTENT + STAGE1_NUTRACEUTICALS placeholders in Stage 3
-- and align clinical_outcomes shape with the tool schema (array).

-- 1) Backup table (idempotent)
CREATE TABLE IF NOT EXISTS public.ai_configurations_backup_axis2_wave1 (
  backed_up_at timestamptz NOT NULL DEFAULT now(),
  config_key text NOT NULL,
  config_value jsonb,
  description text,
  is_active boolean,
  original_id uuid
);

ALTER TABLE public.ai_configurations_backup_axis2_wave1 ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_configurations_backup_axis2_wave1' AND policyname='admins_select_backup_axis2_wave1') THEN
    CREATE POLICY admins_select_backup_axis2_wave1 ON public.ai_configurations_backup_axis2_wave1
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT ON public.ai_configurations_backup_axis2_wave1 TO authenticated;
GRANT ALL ON public.ai_configurations_backup_axis2_wave1 TO service_role;

-- 2) Snapshot current rows BEFORE update
INSERT INTO public.ai_configurations_backup_axis2_wave1
  (config_key, config_value, description, is_active, original_id)
SELECT config_key, config_value, description, is_active, id
FROM public.ai_configurations
WHERE config_key IN ('prompt_extraction_stage3_user','prompt_extraction_stage3_system');

-- 3) Update Stage 3 user prompt with TEXT_CONTENT + STAGE1_NUTRACEUTICALS placeholders
--    and array-shape clinical_outcomes aligned with getStage3Tools().
UPDATE public.ai_configurations
SET config_value = "Extract detailed clinical information from the study below.\n\n\ud83d\udcda STAGE 1 NUTRACEUTICALS (already identified \u2014 use as anchor for compound names):\n{{STAGE1_NUTRACEUTICALS}}\n\n\ud83d\udcc4 STUDY TEXT (extract ONLY from this \u2014 do NOT use prior knowledge or examples):\n---BEGIN STUDY---\n{{TEXT_CONTENT}}\n---END STUDY---\n\nEXTRACT THE FOLLOWING:\n\n1. **Dosages**: Amount, unit, frequency, route, duration\n   - Species-specific dosages with condition context\n   \u26a0\ufe0f ONLY use dosages EXPLICITLY stated in the STUDY TEXT above\n\n2. **Biomarkers**: Measured outcomes with baseline and final values\n   - Include p-values and statistical significance\n\n3. **Side Effects**: Name, severity, frequency, dose-dependency, reversibility\n   - Include management strategies\n\n4. **Contraindications**: Conditions where use is NOT recommended (RC-001 \u2014 proven harm only)\n   - Include reason and severity\n\n5. **Clinical Outcomes**: Each measured outcome reported in the study, as a flat list.\n   - One entry per outcome (primary AND secondary as separate items).\n   - Distinguish primary vs secondary via `outcome_type`.\n   - If the study reports an outcome with no p-value, still include it with `significance: \"not_reported\"`.\n\n\ud83d\udccb REQUIRED JSON OUTPUT FORMAT (shape MUST match the tool schema \u2014 clinical_outcomes is an ARRAY):\n```json\n{\n  \"structured_dosages\": [\n    {\n      \"compound\": \"<compound name from STAGE 1 above>\",\n      \"dose\": 0.3,\n      \"unit\": \"mg/kg\",\n      \"frequency\": \"once daily\",\n      \"route\": \"oral\",\n      \"duration\": \"16 weeks\",\n      \"species\": \"canine\",\n      \"condition\": \"<condition>\"\n    }\n  ],\n  \"biomarkers\": [\n    {\n      \"name\": \"<biomarker>\",\n      \"baseline\": 10.5,\n      \"final\": 15.2,\n      \"unit\": \"U/mL\",\n      \"p_value\": 0.01,\n      \"significance\": \"significant\",\n      \"direction\": \"increased\"\n    }\n  ],\n  \"detailed_side_effects\": [\n    {\n      \"name\": \"<adverse event>\",\n      \"severity\": \"low\",\n      \"frequency_percent\": 8,\n      \"dose_related\": false,\n      \"reversible\": true\n    }\n  ],\n  \"contraindications\": [\n    {\n      \"condition\": \"<condition>\",\n      \"reason\": \"<reason>\",\n      \"severity\": \"moderate\",\n      \"is_absolute\": false\n    }\n  ],\n  \"clinical_outcomes\": [\n    {\n      \"outcome\": \"<name of the outcome measured, e.g. CBPI pain score>\",\n      \"outcome_type\": \"primary\",\n      \"p_value\": \"0.001\",\n      \"effect_size\": \"<effect size or change reported, e.g. -2.3 points>\",\n      \"significance\": \"significant\"\n    },\n    {\n      \"outcome\": \"<secondary outcome>\",\n      \"outcome_type\": \"secondary\",\n      \"p_value\": \"0.04\",\n      \"effect_size\": \"<...>\",\n      \"significance\": \"significant\"\n    }\n  ]\n}\n```\n\n\u26a0\ufe0f CRITICAL:\n- The JSON above is a FORMAT TEMPLATE, NOT data. Do NOT copy its placeholder values.\n- `clinical_outcomes` is an ARRAY of outcome objects, never an object with `primary`/`secondary` keys.\n- `outcome_type` \u2208 {\"primary\",\"secondary\"}.\n- `significance` \u2208 {\"significant\",\"not_significant\",\"not_reported\"}.\n- Be PRECISE with numbers and SPECIFIC with context drawn from the STUDY TEXT only.\n- Include BOTH positive and NEGATIVE findings.\n- If the study reports no clinical outcomes (e.g. pure in-vitro), return `clinical_outcomes: []`.\n"::jsonb,
    updated_at = now()
WHERE config_key = 'prompt_extraction_stage3_user';
