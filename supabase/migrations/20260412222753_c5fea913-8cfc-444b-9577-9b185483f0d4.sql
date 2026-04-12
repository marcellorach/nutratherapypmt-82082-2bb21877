ALTER TABLE public.pet_conditions 
ADD COLUMN origin TEXT NOT NULL DEFAULT 'vet_diagnosis';

COMMENT ON COLUMN public.pet_conditions.origin IS 'Source of condition entry: vet_diagnosis, exam_suggested, breed_predisposition, kg_inference';