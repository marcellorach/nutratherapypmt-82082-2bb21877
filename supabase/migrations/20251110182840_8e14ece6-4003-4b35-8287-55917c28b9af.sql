-- =========================================
-- MIGRATION: Create Core Database Schema
-- =========================================

-- Create profiles table (user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'tutor' CHECK (role IN ('admin', 'veterinarian', 'tutor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create health_conditions table
CREATE TABLE IF NOT EXISTS public.health_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.health_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view health conditions"
  ON public.health_conditions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert health conditions"
  ON public.health_conditions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update health conditions"
  ON public.health_conditions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create nutraceuticals table
CREATE TABLE IF NOT EXISTS public.nutraceuticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  chemical_compound TEXT,
  source TEXT,
  dosage TEXT,
  outcome_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nutraceuticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nutraceuticals"
  ON public.nutraceuticals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert nutraceuticals"
  ON public.nutraceuticals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update nutraceuticals"
  ON public.nutraceuticals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create scientific_studies table
CREATE TABLE IF NOT EXISTS public.scientific_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT,
  year INTEGER,
  journal TEXT,
  abstract TEXT,
  doi TEXT,
  authors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scientific_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view studies"
  ON public.scientific_studies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert studies"
  ON public.scientific_studies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update studies"
  ON public.scientific_studies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create nutraceutical_conditions (junction table)
CREATE TABLE IF NOT EXISTS public.nutraceutical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES public.health_conditions(id) ON DELETE CASCADE,
  relationship_type TEXT,
  efficacy_score INTEGER CHECK (efficacy_score >= 0 AND efficacy_score <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(nutraceutical_id, condition_id)
);

ALTER TABLE public.nutraceutical_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nutraceutical conditions"
  ON public.nutraceutical_conditions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage nutraceutical conditions"
  ON public.nutraceutical_conditions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create nutraceutical_studies (junction table)
CREATE TABLE IF NOT EXISTS public.nutraceutical_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  study_id UUID NOT NULL REFERENCES public.scientific_studies(id) ON DELETE CASCADE,
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(nutraceutical_id, study_id)
);

ALTER TABLE public.nutraceutical_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nutraceutical studies"
  ON public.nutraceutical_studies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage nutraceutical studies"
  ON public.nutraceutical_studies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create nutraceutical_benefits table
CREATE TABLE IF NOT EXISTS public.nutraceutical_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  benefit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nutraceutical_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view benefits"
  ON public.nutraceutical_benefits FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage benefits"
  ON public.nutraceutical_benefits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create nutraceutical_scientific_metadata table
CREATE TABLE IF NOT EXISTS public.nutraceutical_scientific_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutraceutical_id UUID NOT NULL UNIQUE REFERENCES public.nutraceuticals(id) ON DELETE CASCADE,
  efficacy_score INTEGER CHECK (efficacy_score >= 0 AND efficacy_score <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 0 AND safety_rating <= 5),
  evidence_quality TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nutraceutical_scientific_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view metadata"
  ON public.nutraceutical_scientific_metadata FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage metadata"
  ON public.nutraceutical_scientific_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create scispace_imports table
CREATE TABLE IF NOT EXISTS public.scispace_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_summary_filename TEXT,
  meta_summary_storage_path TEXT,
  base_studies_filename TEXT,
  base_studies_storage_path TEXT,
  consenso_name TEXT,
  consenso_comments TEXT,
  import_type TEXT NOT NULL DEFAULT 'manual',
  scispace_status TEXT DEFAULT 'pending',
  is_deleted BOOLEAN DEFAULT false,
  imported_by UUID,
  import_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scispace_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all imports"
  ON public.scispace_imports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage imports"
  ON public.scispace_imports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create processed_studies table
CREATE TABLE IF NOT EXISTS public.processed_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id TEXT NOT NULL UNIQUE,
  source_import_id UUID REFERENCES public.scispace_imports(id) ON DELETE SET NULL,
  import_type TEXT NOT NULL DEFAULT 'manual',
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  kanban_status TEXT DEFAULT 'new' CHECK (kanban_status IN ('new', 'processing', 'processed', 'error')),
  processed_by TEXT DEFAULT 'system',
  title TEXT,
  description TEXT,
  journal TEXT,
  year INTEGER,
  authors TEXT[],
  analysis_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.processed_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all processed studies"
  ON public.processed_studies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage processed studies"
  ON public.processed_studies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create ai_configurations table
CREATE TABLE IF NOT EXISTS public.ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI configs"
  ON public.ai_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage AI configs"
  ON public.ai_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_conditions_updated_at BEFORE UPDATE ON public.health_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutraceuticals_updated_at BEFORE UPDATE ON public.nutraceuticals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scientific_studies_updated_at BEFORE UPDATE ON public.scientific_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutraceutical_conditions_updated_at BEFORE UPDATE ON public.nutraceutical_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutraceutical_studies_updated_at BEFORE UPDATE ON public.nutraceutical_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutraceutical_scientific_metadata_updated_at BEFORE UPDATE ON public.nutraceutical_scientific_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scispace_imports_updated_at BEFORE UPDATE ON public.scispace_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processed_studies_updated_at BEFORE UPDATE ON public.processed_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON public.ai_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();