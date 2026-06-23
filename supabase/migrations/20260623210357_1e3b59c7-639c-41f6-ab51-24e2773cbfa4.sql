-- Axis 2 Wave 1: restore TEXT_CONTENT + STAGE1_NUTRACEUTICALS placeholders in Stage 3
-- and align clinical_outcomes shape with the tool schema (array).

CREATE TABLE IF NOT EXISTS public.ai_configurations_backup_axis2_wave1 (
  backed_up_at timestamptz NOT NULL DEFAULT now(),
  config_key text NOT NULL,
  config_value jsonb,
  description text,
  is_active boolean,
  original_id uuid
);

ALTER TABLE public.ai_configurations_backup_axis2_wave1 ENABLE ROW LEVEL SECURITY;

DO $pol$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_configurations_backup_axis2_wave1' AND policyname='admins_select_backup_axis2_wave1') THEN
    CREATE POLICY admins_select_backup_axis2_wave1 ON public.ai_configurations_backup_axis2_wave1
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
END $pol$;

GRANT SELECT ON public.ai_configurations_backup_axis2_wave1 TO authenticated;
GRANT ALL ON public.ai_configurations_backup_axis2_wave1 TO service_role;

INSERT INTO public.ai_configurations_backup_axis2_wave1
  (config_key, config_value, description, is_active, original_id)
SELECT config_key, config_value, description, is_active, id
FROM public.ai_configurations
WHERE config_key IN ('prompt_extraction_stage3_user','prompt_extraction_stage3_system');

UPDATE public.ai_configurations
SET config_value = to_jsonb(
'Extract detailed clinical information from the study below.

📚 STAGE 1 NUTRACEUTICALS (already identified — use as anchor for compound names):
{{STAGE1_NUTRACEUTICALS}}

📄 STUDY TEXT (extract ONLY from this — do NOT use prior knowledge or examples):
---BEGIN STUDY---
{{TEXT_CONTENT}}
---END STUDY---

EXTRACT THE FOLLOWING:

1. **Dosages**: Amount, unit, frequency, route, duration
   - Species-specific dosages with condition context
   ⚠️ ONLY use dosages EXPLICITLY stated in the STUDY TEXT above

2. **Biomarkers**: Measured outcomes with baseline and final values
   - Include p-values and statistical significance

3. **Side Effects**: Name, severity, frequency, dose-dependency, reversibility
   - Include management strategies

4. **Contraindications**: Conditions where use is NOT recommended (RC-001 — proven harm only)
   - Include reason and severity

5. **Clinical Outcomes**: Each measured outcome reported in the study, as a flat list.
   - One entry per outcome (primary AND secondary as separate items).
   - Distinguish primary vs secondary via `outcome_type`.
   - If the study reports an outcome with no p-value, still include it with `significance: "not_reported"`.

📋 REQUIRED JSON OUTPUT FORMAT (shape MUST match the tool schema — clinical_outcomes is an ARRAY):
```json
{
  "structured_dosages": [
    {
      "compound": "<compound name from STAGE 1 above>",
      "dose": 0.3,
      "unit": "mg/kg",
      "frequency": "once daily",
      "route": "oral",
      "duration": "16 weeks",
      "species": "canine",
      "condition": "<condition>"
    }
  ],
  "biomarkers": [
    {
      "name": "<biomarker>",
      "baseline": 10.5,
      "final": 15.2,
      "unit": "U/mL",
      "p_value": 0.01,
      "significance": "significant",
      "direction": "increased"
    }
  ],
  "detailed_side_effects": [
    {
      "name": "<adverse event>",
      "severity": "low",
      "frequency_percent": 8,
      "dose_related": false,
      "reversible": true
    }
  ],
  "contraindications": [
    {
      "condition": "<condition>",
      "reason": "<reason>",
      "severity": "moderate",
      "is_absolute": false
    }
  ],
  "clinical_outcomes": [
    {
      "outcome": "<name of the outcome measured, e.g. CBPI pain score>",
      "outcome_type": "primary",
      "p_value": "0.001",
      "effect_size": "<effect size or change reported, e.g. -2.3 points>",
      "significance": "significant"
    },
    {
      "outcome": "<secondary outcome>",
      "outcome_type": "secondary",
      "p_value": "0.04",
      "effect_size": "<...>",
      "significance": "significant"
    }
  ]
}
```

⚠️ CRITICAL:
- The JSON above is a FORMAT TEMPLATE, NOT data. Do NOT copy its placeholder values.
- `clinical_outcomes` is an ARRAY of outcome objects, never an object with `primary`/`secondary` keys.
- `outcome_type` ∈ {"primary","secondary"}.
- `significance` ∈ {"significant","not_significant","not_reported"}.
- Be PRECISE with numbers and SPECIFIC with context drawn from the STUDY TEXT only.
- Include BOTH positive and NEGATIVE findings.
- If the study reports no clinical outcomes (e.g. pure in-vitro), return `clinical_outcomes: []`.
'::text),
    updated_at = now()
WHERE config_key = 'prompt_extraction_stage3_user';