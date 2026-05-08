
ALTER TABLE public.health_conditions_backup_20251111 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read backup"
  ON public.health_conditions_backup_20251111
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can modify backup"
  ON public.health_conditions_backup_20251111
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER VIEW public.clean_seed_data SET (security_invoker = true);

ALTER FUNCTION public.increment_translation_version() SET search_path = public;
ALTER FUNCTION public.search_study_chunks(vector, uuid, double precision, integer) SET search_path = public;
ALTER FUNCTION public.update_translations_updated_at() SET search_path = public;
ALTER FUNCTION public.update_triplet_extractions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_study_embeddings() SET search_path = public;
