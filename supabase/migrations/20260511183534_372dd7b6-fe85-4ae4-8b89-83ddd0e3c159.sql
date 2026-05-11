
-- Create storage bucket for pet exam PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet_exams_pdfs', 'pet_exams_pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for pet_exams_pdfs bucket
-- Path convention: {pet_id}/{filename}
CREATE POLICY "Authenticated users can read pet exam pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pet_exams_pdfs');

CREATE POLICY "Authenticated users can upload pet exam pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pet_exams_pdfs');

CREATE POLICY "Authenticated users can update pet exam pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pet_exams_pdfs');

CREATE POLICY "Authenticated users can delete pet exam pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pet_exams_pdfs');

-- Add structured columns to pet_exams to store extracted data
ALTER TABLE public.pet_exams
  ADD COLUMN IF NOT EXISTS lab_name text,
  ADD COLUMN IF NOT EXISTS clinical_comments text,
  ADD COLUMN IF NOT EXISTS flags_abnormal text[],
  ADD COLUMN IF NOT EXISTS extraction_status text DEFAULT 'pending'
    CHECK (extraction_status IN ('pending','processing','done','failed')),
  ADD COLUMN IF NOT EXISTS extraction_error text,
  ADD COLUMN IF NOT EXISTS raw_extracted jsonb;
