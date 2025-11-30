-- Add PDF storage columns to scientific_studies table
ALTER TABLE public.scientific_studies 
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
ADD COLUMN IF NOT EXISTS pdf_filename TEXT,
ADD COLUMN IF NOT EXISTS pdf_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on studies with PDFs
CREATE INDEX IF NOT EXISTS idx_scientific_studies_pdf_path ON public.scientific_studies(pdf_storage_path) WHERE pdf_storage_path IS NOT NULL;