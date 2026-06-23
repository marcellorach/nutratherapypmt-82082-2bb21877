CREATE TABLE IF NOT EXISTS public.processed_studies_backup_axis2_wave1 (
  backed_up_at timestamptz NOT NULL DEFAULT now(),
  study_id text NOT NULL,
  analysis_data jsonb,
  extracted_data_extract jsonb
);
ALTER TABLE public.processed_studies_backup_axis2_wave1 ENABLE ROW LEVEL SECURITY;
DO $p$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='processed_studies_backup_axis2_wave1' AND policyname='admins_select_psbackup_axis2_w1') THEN
    CREATE POLICY admins_select_psbackup_axis2_w1 ON public.processed_studies_backup_axis2_wave1
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
END $p$;
GRANT SELECT ON public.processed_studies_backup_axis2_wave1 TO authenticated;
GRANT ALL ON public.processed_studies_backup_axis2_wave1 TO service_role;

INSERT INTO public.processed_studies_backup_axis2_wave1 (study_id, analysis_data, extracted_data_extract)
SELECT ps.study_id, ps.analysis_data, se.extracted_data
FROM public.processed_studies ps
LEFT JOIN public.study_extractions se ON se.study_id::text = ps.study_id
WHERE ps.study_id IN (
  '3587be64-df96-4f81-8039-12fdea7c8443',
  '5d4daee5-50a7-449e-bd62-1ecfa82eec96',
  '4d17beda-a81f-4c66-9744-ca9521fd88a0'
);