
CREATE TABLE IF NOT EXISTS public.ai_configurations_backup_axis2_wave2a (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL,
  config_value jsonb NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_configurations_backup_axis2_wave2a TO service_role;
GRANT SELECT ON public.ai_configurations_backup_axis2_wave2a TO authenticated;
ALTER TABLE public.ai_configurations_backup_axis2_wave2a ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read axis2 wave2a config backup"
  ON public.ai_configurations_backup_axis2_wave2a FOR SELECT TO authenticated
  USING (public.is_admin());

INSERT INTO public.ai_configurations_backup_axis2_wave2a (config_key, config_value)
SELECT config_key, config_value FROM public.ai_configurations
WHERE config_key IN ('prompt_extraction_stage2_system','prompt_extraction_stage2_user');

CREATE TABLE IF NOT EXISTS public.processed_studies_backup_axis2_wave2a (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_row_id uuid NOT NULL,
  analysis_data jsonb,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.processed_studies_backup_axis2_wave2a TO service_role;
GRANT SELECT ON public.processed_studies_backup_axis2_wave2a TO authenticated;
ALTER TABLE public.processed_studies_backup_axis2_wave2a ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read axis2 wave2a study backup"
  ON public.processed_studies_backup_axis2_wave2a FOR SELECT TO authenticated
  USING (public.is_admin());

INSERT INTO public.processed_studies_backup_axis2_wave2a (study_row_id, analysis_data)
SELECT id, analysis_data FROM public.processed_studies
WHERE id IN (
  'b7ce66b7-3f35-47b9-8edc-ffd5aaee01fc',
  'f0ceee4a-190a-480d-94ad-42f796f61de5'
);

UPDATE public.ai_configurations
SET config_value = to_jsonb($SYS$You are a molecular biology AI expert. Stage 2 focuses on RELATIONSHIPS and MECHANISMS.

CRITICAL ANTI-HALLUCINATION RULES (inegociaveis):
1. NEVER return example data from these instructions.
2. ONLY extract information that is EXPLICITLY present in the document text.
3. If a compound, pathway, or interaction is not mentioned in the document, DO NOT include it.

RECALL DIRECTIVE (igualmente inegociavel):
- Extract EVERY molecular mechanism EXPLICITLY described in the document. Do NOT omit a mechanism just because phrasing is technical or indirect.
- A "mechanism" = a compound acting on a molecular target (pathway, enzyme, receptor, gene, protein, mediator, transcription factor) with a DIRECTION (inhibition, activation, modulation) and at least one DOWNSTREAM CONSEQUENCE stated in the text.
- Populate the FULL causal chain: name (the target), type, action, target (the upstream compound or trigger), downstream_effects (the consequences stated in the text), category. An entry without downstream_effects is a SHALLOW mechanism — avoid; prefer to capture the full chain when the text supports it.
- Use [] for molecular_mechanisms ONLY when the document genuinely contains no such causal statement (e.g., pure epidemiology with no molecular content). Empty by default is WRONG when mechanisms exist in the text.

ABSTRACT PATTERN (illustrative format only — never extract this; extract ONLY from the document):
  If the text states "<compound> <action> <target>, leading to <consequence>",
  emit { name: "<target>", type: "<pathway|enzyme|receptor|gene|protein|mediator>",
         action: "<inhibition|activation|modulation>", target: "<compound or upstream trigger>",
         downstream_effects: ["<consequence as stated>"], category: "<inflammatory|oxidative_stress|metabolic|immunomodulatory|neuroprotective|other>" }.

Include BOTH positive (activation) and negative (inhibition) interactions. Focus on HOW things work, not just WHAT they are.$SYS$::text)
WHERE config_key = 'prompt_extraction_stage2_system';

UPDATE public.ai_configurations
SET config_value = to_jsonb($USR$Analyze the following scientific study text and extract:

1. **Molecular Mechanisms** (PRIORIDADE — recall alto):
   - For EACH explicit statement in the text where a compound acts on a molecular target (pathway, enzyme, receptor, gene, protein, mediator) with a direction (inhibition / activation / modulation) AND a downstream consequence, emit ONE mechanism object.
   - Populate: name (target), type, action, target (upstream compound/trigger), downstream_effects (array — the consequences stated in the text), category.
   - Do NOT omit mechanisms because the phrasing is indirect — if the causal claim is in the text, capture it.
   - Use [] only if the document genuinely contains no molecular mechanism (e.g., pure epidemiology). NEVER as a default safety choice.

2. **Synergies**: Compounds that explicitly enhance each other in this document.

3. **Drug Interactions**: Including NEGATIVE interactions explicitly stated.

4. **Biological cascades**: Map the complete chain from molecule to outcome when the text supports it.

HARD RULE: Extract ONLY relationships EXPLICITLY stated in this document. DO NOT invent. But also DO NOT omit explicit mechanisms — both errors are equally bad.

DOCUMENT TEXT:
{{TEXT_CONTENT}}

Previously identified nutraceuticals from Stage 1 (use as anchors when searching for their mechanisms in the text above):
{{STAGE1_NUTRACEUTICALS}}$USR$::text)
WHERE config_key = 'prompt_extraction_stage2_user';
