-- Create storage bucket for study PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study_pdfs',
  'study_pdfs',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- Create RLS policies for study_pdfs bucket
CREATE POLICY "Admins can upload study PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study_pdfs' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can read study PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study_pdfs' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete study PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study_pdfs' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create table for study extractions (LLM output buffer)
CREATE TABLE IF NOT EXISTS public.study_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id TEXT NOT NULL REFERENCES processed_studies(study_id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending_review',
  extraction_quality_score INTEGER CHECK (extraction_quality_score >= 0 AND extraction_quality_score <= 100),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(study_id)
);

-- Add trigger for updated_at
CREATE TRIGGER update_study_extractions_updated_at
BEFORE UPDATE ON public.study_extractions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_study_extractions_status ON public.study_extractions(extraction_status);
CREATE INDEX idx_study_extractions_study_id ON public.study_extractions(study_id);

-- Enable RLS
ALTER TABLE public.study_extractions ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_extractions
CREATE POLICY "Admins can view all extractions"
ON public.study_extractions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert extractions"
ON public.study_extractions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update extractions"
ON public.study_extractions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert initial Unstructured API key configuration
INSERT INTO public.ai_configurations (config_key, config_value, description, is_active)
VALUES (
  'unstructured_api_key',
  '{"key": ""}',
  'API key for Unstructured.io document parsing service',
  true
)
ON CONFLICT (config_key) DO NOTHING;