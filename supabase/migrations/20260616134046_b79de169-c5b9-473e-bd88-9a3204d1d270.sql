DROP POLICY IF EXISTS "Audit reports public read" ON storage.objects;

CREATE POLICY "Audit reports admin read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'audit-reports' AND public.is_admin());

DROP POLICY IF EXISTS "Anyone can view QA samples" ON public.enrichment_qa_samples;

CREATE POLICY "Admins can view QA samples"
ON public.enrichment_qa_samples
FOR SELECT
TO authenticated
USING (public.is_admin());