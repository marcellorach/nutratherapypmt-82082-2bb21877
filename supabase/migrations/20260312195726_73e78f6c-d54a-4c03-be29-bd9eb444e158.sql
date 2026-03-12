
CREATE TABLE public.treatment_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pet_profiles(id) ON DELETE CASCADE NOT NULL,
  veterinarian_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  conditions JSONB NOT NULL DEFAULT '[]',
  compounds JSONB NOT NULL DEFAULT '[]',
  scientific_summary JSONB,
  confidence_level TEXT,
  rationale TEXT,
  monthly_price_brl NUMERIC(10,2) NOT NULL,
  subscription_months INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.treatment_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view treatment_proposals"
  ON public.treatment_proposals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert treatment_proposals"
  ON public.treatment_proposals FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update treatment_proposals"
  ON public.treatment_proposals FOR UPDATE
  TO public
  USING (auth.uid() IS NOT NULL);
