
-- Tighten RLS on internal/curation tables: remove public-read "USING (true)" SELECT policies
DROP POLICY IF EXISTS "Anyone can view auto_discoveries" ON public.auto_discoveries;
DROP POLICY IF EXISTS "Anyone can view base_knowledge_candidates" ON public.base_knowledge_candidates;
DROP POLICY IF EXISTS "Anyone can view evidence_conflicts" ON public.evidence_conflicts;
DROP POLICY IF EXISTS "Anyone can view processed studies" ON public.processed_studies;
DROP POLICY IF EXISTS "Anyone can view imports" ON public.scispace_imports;
DROP POLICY IF EXISTS "Anyone can view embeddings" ON public.study_embeddings;
DROP POLICY IF EXISTS "Anyone can view taxonomy_suggestions" ON public.taxonomy_suggestions;

-- Authenticated-only read replacements (admins still covered by their ALL policy)
CREATE POLICY "Authenticated users can view evidence_conflicts"
  ON public.evidence_conflicts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view processed studies"
  ON public.processed_studies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view study embeddings"
  ON public.study_embeddings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- (auto_discoveries, base_knowledge_candidates, scispace_imports, taxonomy_suggestions
--  retain their existing admin/veterinarian/authenticated policies.)

-- Restrict recommendation_logs SELECT to owners of the pet (vet or creator) or admin
DROP POLICY IF EXISTS "Authenticated users can view recommendation logs" ON public.recommendation_logs;

CREATE POLICY "Owners and admins can view recommendation logs"
  ON public.recommendation_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR pet_id IN (
      SELECT id FROM public.pet_profiles
      WHERE veterinarian_id = auth.uid() OR created_by = auth.uid()
    )
  );

-- Storage: pet_exams_pdfs — restrict read/update/delete to admins or the veterinarian/creator
-- of the pet whose exam references the file (file_url stores the object name).
DROP POLICY IF EXISTS "Authenticated users can read pet exam pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pet exam pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pet exam pdfs" ON storage.objects;

CREATE POLICY "Pet exam pdfs readable by owners or admins"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'pet_exams_pdfs'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
      OR EXISTS (
        SELECT 1
        FROM public.pet_exams e
        JOIN public.pet_profiles p ON p.id = e.pet_id
        WHERE (e.file_url = storage.objects.name OR e.file_url LIKE '%' || storage.objects.name)
          AND (p.veterinarian_id = auth.uid() OR p.created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Pet exam pdfs updatable by owners or admins"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pet_exams_pdfs'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
      OR EXISTS (
        SELECT 1
        FROM public.pet_exams e
        JOIN public.pet_profiles p ON p.id = e.pet_id
        WHERE (e.file_url = storage.objects.name OR e.file_url LIKE '%' || storage.objects.name)
          AND (p.veterinarian_id = auth.uid() OR p.created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Pet exam pdfs deletable by owners or admins"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pet_exams_pdfs'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
      OR EXISTS (
        SELECT 1
        FROM public.pet_exams e
        JOIN public.pet_profiles p ON p.id = e.pet_id
        WHERE (e.file_url = storage.objects.name OR e.file_url LIKE '%' || storage.objects.name)
          AND (p.veterinarian_id = auth.uid() OR p.created_by = auth.uid())
      )
    )
  );
