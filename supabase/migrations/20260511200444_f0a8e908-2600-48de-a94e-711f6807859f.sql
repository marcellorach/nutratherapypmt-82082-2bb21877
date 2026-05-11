
-- Add birth_date and photo_url to pet_profiles
ALTER TABLE public.pet_profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Storage bucket for pet photos (public so we can render <img>)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of pet photos
DROP POLICY IF EXISTS "Pet photos are publicly readable" ON storage.objects;
CREATE POLICY "Pet photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');

-- Authenticated users can upload to pet-photos under their own folder (uid/...)
DROP POLICY IF EXISTS "Authenticated can upload pet photos" ON storage.objects;
CREATE POLICY "Authenticated can upload pet photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pet-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated can update own pet photos" ON storage.objects;
CREATE POLICY "Authenticated can update own pet photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated can delete own pet photos" ON storage.objects;
CREATE POLICY "Authenticated can delete own pet photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
