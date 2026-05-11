ALTER TABLE public.pet_exams ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.pet_exams ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.pet_exams ADD COLUMN IF NOT EXISTS approved_by uuid;
CREATE INDEX IF NOT EXISTS idx_pet_exams_consultation ON public.pet_exams(consultation_id);
CREATE INDEX IF NOT EXISTS idx_pet_exams_approved ON public.pet_exams(pet_id, approved);