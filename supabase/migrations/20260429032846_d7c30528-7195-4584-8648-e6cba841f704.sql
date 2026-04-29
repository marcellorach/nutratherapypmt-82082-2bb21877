CREATE TABLE IF NOT EXISTS public.pet_clinical_analysis_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  analysis_version TEXT NOT NULL DEFAULT 'v1',
  completed_at TIMESTAMP WITH TIME ZONE,
  confidence_level TEXT,
  recommendation_compounds JSONB NOT NULL DEFAULT '[]'::jsonb,
  predispositions JSONB NOT NULL DEFAULT '[]'::jsonb,
  lab_alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  interaction_alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  clinical_discoveries JSONB NOT NULL DEFAULT '[]'::jsonb,
  kg_triplets JSONB NOT NULL DEFAULT '[]'::jsonb,
  kg_pathways JSONB NOT NULL DEFAULT '[]'::jsonb,
  kg_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT pet_clinical_analysis_snapshots_pet_unique UNIQUE (pet_id),
  CONSTRAINT pet_clinical_analysis_snapshots_status_check CHECK (status IN ('pending','complete','failed'))
);

CREATE INDEX IF NOT EXISTS idx_pcas_pet ON public.pet_clinical_analysis_snapshots(pet_id);
CREATE INDEX IF NOT EXISTS idx_pcas_status ON public.pet_clinical_analysis_snapshots(status);

ALTER TABLE public.pet_clinical_analysis_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins or creators can delete analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR DELETE
  TO authenticated USING (public.is_admin() OR created_by = auth.uid());

CREATE TRIGGER update_pet_clinical_analysis_snapshots_updated_at
  BEFORE UPDATE ON public.pet_clinical_analysis_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();