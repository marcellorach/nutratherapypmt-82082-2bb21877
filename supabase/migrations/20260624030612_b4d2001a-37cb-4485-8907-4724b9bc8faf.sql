CREATE TABLE IF NOT EXISTS public.processed_studies_backup_axis2_wave2b_guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  analysis_data jsonb,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.processed_studies_backup_axis2_wave2b_guards TO service_role;
ALTER TABLE public.processed_studies_backup_axis2_wave2b_guards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_guards_backup" ON public.processed_studies_backup_axis2_wave2b_guards FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.study_extractions_backup_axis2_wave2b_guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  extracted_data jsonb,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.study_extractions_backup_axis2_wave2b_guards TO service_role;
ALTER TABLE public.study_extractions_backup_axis2_wave2b_guards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_extr_guards_backup" ON public.study_extractions_backup_axis2_wave2b_guards FOR SELECT TO authenticated USING (public.is_admin());

INSERT INTO public.processed_studies_backup_axis2_wave2b_guards (study_id, analysis_data)
SELECT id, analysis_data FROM public.processed_studies
WHERE id IN ('b7ce66b7-3f35-47b9-8edc-ffd5aaee01fc','f0ceee4a-190a-480d-94ad-42f796f61de5','7b151ae8-f9a0-47c1-8b86-20c2daade9bc');

INSERT INTO public.study_extractions_backup_axis2_wave2b_guards (study_id, extracted_data)
SELECT study_id, extracted_data FROM public.study_extractions
WHERE study_id IN ('b7ce66b7-3f35-47b9-8edc-ffd5aaee01fc','f0ceee4a-190a-480d-94ad-42f796f61de5','7b151ae8-f9a0-47c1-8b86-20c2daade9bc');