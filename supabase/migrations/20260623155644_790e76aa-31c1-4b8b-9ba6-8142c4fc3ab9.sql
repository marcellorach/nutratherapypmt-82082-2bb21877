
-- Axis 1 backup tables for analysis_data deep-merge fix.
-- Read-only snapshots. Internal/admin-only.
CREATE TABLE IF NOT EXISTS public.processed_studies_backup_axis1 (
  id uuid PRIMARY KEY,
  analysis_data jsonb,
  ingestion_stages jsonb,
  backed_up_at timestamptz NOT NULL DEFAULT now(),
  note text
);
GRANT SELECT ON public.processed_studies_backup_axis1 TO authenticated;
GRANT ALL ON public.processed_studies_backup_axis1 TO service_role;
ALTER TABLE public.processed_studies_backup_axis1 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "axis1 ps backup admin read" ON public.processed_studies_backup_axis1
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.study_extractions_backup_axis1 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  extracted_data jsonb,
  extraction_status text,
  extraction_quality_score numeric,
  backed_up_at timestamptz NOT NULL DEFAULT now(),
  note text
);
GRANT SELECT ON public.study_extractions_backup_axis1 TO authenticated;
GRANT ALL ON public.study_extractions_backup_axis1 TO service_role;
ALTER TABLE public.study_extractions_backup_axis1 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "axis1 se backup admin read" ON public.study_extractions_backup_axis1
  FOR SELECT TO authenticated USING (public.is_admin());
