
-- ============================================
-- FASE 2: SISTEMA DE REGISTRO DE PACIENTES CANINOS
-- ============================================

-- 1. Tabela principal: pet_profiles
CREATE TABLE public.pet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'canine',
  breed TEXT NOT NULL,
  age_years NUMERIC NOT NULL,
  weight_kg NUMERIC NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  neutered BOOLEAN NOT NULL DEFAULT false,
  chip_number TEXT,
  photo_url TEXT,
  owner_name TEXT,
  owner_email TEXT,
  veterinarian_id UUID,
  created_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;

-- Veterinários veem pacientes atribuídos a eles
CREATE POLICY "Vets can view their own patients"
ON public.pet_profiles FOR SELECT
USING (
  veterinarian_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Authenticated users can insert pet profiles"
ON public.pet_profiles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Vets can update their own patients"
ON public.pet_profiles FOR UPDATE
USING (
  veterinarian_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Vets can delete their own patients"
ON public.pet_profiles FOR DELETE
USING (
  veterinarian_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- 2. Tabela: pet_conditions
CREATE TABLE public.pet_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  condition_id UUID REFERENCES public.health_conditions(id),
  diagnosis_date DATE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pet conditions for their patients"
ON public.pet_conditions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_conditions.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Authenticated users can insert pet conditions"
ON public.pet_conditions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update pet conditions for their patients"
ON public.pet_conditions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_conditions.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Users can delete pet conditions for their patients"
ON public.pet_conditions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_conditions.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

-- 3. Tabela: pet_medications
CREATE TABLE public.pet_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribing_vet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pet medications for their patients"
ON public.pet_medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_medications.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Authenticated users can insert pet medications"
ON public.pet_medications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update pet medications for their patients"
ON public.pet_medications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_medications.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Users can delete pet medications for their patients"
ON public.pet_medications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_medications.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

-- 4. Tabela: pet_exams
CREATE TABLE public.pet_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  exam_date DATE,
  results JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pet exams for their patients"
ON public.pet_exams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_exams.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Authenticated users can insert pet exams"
ON public.pet_exams FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update pet exams for their patients"
ON public.pet_exams FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_exams.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Users can delete pet exams for their patients"
ON public.pet_exams FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_exams.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

-- 5. Tabela: pet_clinical_notes
CREATE TABLE public.pet_clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'manual' CHECK (note_type IN ('chat_extracted', 'manual', 'symptom', 'observation')),
  content TEXT NOT NULL,
  extracted_entities JSONB DEFAULT '{}'::jsonb,
  source_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pet clinical notes for their patients"
ON public.pet_clinical_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_clinical_notes.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Authenticated users can insert pet clinical notes"
ON public.pet_clinical_notes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update pet clinical notes for their patients"
ON public.pet_clinical_notes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_clinical_notes.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

CREATE POLICY "Users can delete pet clinical notes for their patients"
ON public.pet_clinical_notes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pet_profiles pp
    WHERE pp.id = pet_clinical_notes.pet_id
    AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  )
);

-- 6. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_pet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pet_profiles_updated_at
  BEFORE UPDATE ON public.pet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();

CREATE TRIGGER update_pet_conditions_updated_at
  BEFORE UPDATE ON public.pet_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();

CREATE TRIGGER update_pet_medications_updated_at
  BEFORE UPDATE ON public.pet_medications
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();

CREATE TRIGGER update_pet_exams_updated_at
  BEFORE UPDATE ON public.pet_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();

-- 7. Índices para performance
CREATE INDEX idx_pet_profiles_vet_id ON public.pet_profiles(veterinarian_id);
CREATE INDEX idx_pet_profiles_created_by ON public.pet_profiles(created_by);
CREATE INDEX idx_pet_conditions_pet_id ON public.pet_conditions(pet_id);
CREATE INDEX idx_pet_medications_pet_id ON public.pet_medications(pet_id);
CREATE INDEX idx_pet_exams_pet_id ON public.pet_exams(pet_id);
CREATE INDEX idx_pet_clinical_notes_pet_id ON public.pet_clinical_notes(pet_id);
