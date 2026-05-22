
ALTER TABLE public.meta_studies
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_generated_at TIMESTAMPTZ;

INSERT INTO storage.buckets (id, name, public)
VALUES ('meta-study-covers', 'meta-study-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "meta_study_covers_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meta-study-covers');

CREATE POLICY "meta_study_covers_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'meta-study-covers' AND public.is_admin());

CREATE POLICY "meta_study_covers_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'meta-study-covers' AND public.is_admin());

CREATE POLICY "meta_study_covers_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'meta-study-covers' AND public.is_admin());
