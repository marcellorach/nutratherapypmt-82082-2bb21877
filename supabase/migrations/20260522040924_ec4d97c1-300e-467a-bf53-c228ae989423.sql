
INSERT INTO storage.buckets (id, name, public)
VALUES ('ontology-indexes', 'ontology-indexes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read ontology-indexes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ontology-indexes' AND public.is_admin());

CREATE POLICY "Admins can upload ontology-indexes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ontology-indexes' AND public.is_admin());

CREATE POLICY "Admins can update ontology-indexes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ontology-indexes' AND public.is_admin());

CREATE POLICY "Admins can delete ontology-indexes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ontology-indexes' AND public.is_admin());
