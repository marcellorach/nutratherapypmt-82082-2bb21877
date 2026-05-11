ALTER TABLE public.pet_medications ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_pet_medications_status ON public.pet_medications(status);