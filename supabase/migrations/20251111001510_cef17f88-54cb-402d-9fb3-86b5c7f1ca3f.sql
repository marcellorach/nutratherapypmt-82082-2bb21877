-- Create nutraceutical_categories table
CREATE TABLE IF NOT EXISTS public.nutraceutical_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nutraceutical_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all categories
CREATE POLICY "Admins can manage nutraceutical categories"
ON public.nutraceutical_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Authenticated users can view categories
CREATE POLICY "Authenticated users can view nutraceutical categories"
ON public.nutraceutical_categories
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_nutraceutical_categories_updated_at
  BEFORE UPDATE ON public.nutraceutical_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Performance index on name column
CREATE INDEX idx_nutraceutical_categories_name 
ON public.nutraceutical_categories(name);

-- Comment on table
COMMENT ON TABLE public.nutraceutical_categories IS 'Stores unique categories for nutraceuticals (extracted from condition field)';