-- Create nutraceutical_contraindications table
CREATE TABLE IF NOT EXISTS public.nutraceutical_contraindications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  contraindication TEXT NOT NULL,
  severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(nutraceutical_id, contraindication)
);

-- Enable Row Level Security
ALTER TABLE public.nutraceutical_contraindications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage contraindications
CREATE POLICY "Admins can manage contraindications"
ON public.nutraceutical_contraindications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Authenticated users can view contraindications
CREATE POLICY "Authenticated users can view contraindications"
ON public.nutraceutical_contraindications
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_nutraceutical_contraindications_updated_at
  BEFORE UPDATE ON public.nutraceutical_contraindications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Performance index
CREATE INDEX idx_nutraceutical_contraindications_nutra_id 
ON public.nutraceutical_contraindications(nutraceutical_id);

-- Comment on table
COMMENT ON TABLE public.nutraceutical_contraindications IS 'Stores contraindications for nutraceuticals with optional severity levels';