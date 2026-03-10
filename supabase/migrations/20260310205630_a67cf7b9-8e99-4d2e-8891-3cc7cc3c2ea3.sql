
-- Create lab_reference_ranges table
CREATE TABLE public.lab_reference_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'canine',
  unit TEXT,
  min_normal NUMERIC,
  max_normal NUMERIC,
  age_group TEXT DEFAULT 'adult',
  clinical_significance TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_reference_ranges ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view lab_reference_ranges"
ON public.lab_reference_ranges FOR SELECT
USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage lab_reference_ranges"
ON public.lab_reference_ranges FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));
