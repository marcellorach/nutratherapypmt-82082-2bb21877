CREATE TABLE IF NOT EXISTS public.ai_configurations_backup_axis2_wave2b (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL,
  config_value jsonb,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_configurations_backup_axis2_wave2b TO service_role;
ALTER TABLE public.ai_configurations_backup_axis2_wave2b ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read backup wave2b" ON public.ai_configurations_backup_axis2_wave2b FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.processed_studies_backup_axis2_wave2b (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  analysis_data jsonb,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.processed_studies_backup_axis2_wave2b TO service_role;
ALTER TABLE public.processed_studies_backup_axis2_wave2b ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read ps backup wave2b" ON public.processed_studies_backup_axis2_wave2b FOR SELECT TO authenticated USING (public.is_admin());