-- =========================================
-- MIGRATION: Add Import Management Tables
-- =========================================

-- Create nutraceutical_imports table
CREATE TABLE IF NOT EXISTS public.nutraceutical_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_data JSONB,
  import_status TEXT DEFAULT 'pending' CHECK (import_status IN ('pending', 'processing', 'completed', 'error')),
  imported_by UUID,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nutraceutical_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all nutraceutical imports"
  ON public.nutraceutical_imports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage nutraceutical imports"
  ON public.nutraceutical_imports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create data_management_settings table
CREATE TABLE IF NOT EXISTS public.data_management_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.data_management_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view data settings"
  ON public.data_management_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage data settings"
  ON public.data_management_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_nutraceutical_imports_updated_at BEFORE UPDATE ON public.nutraceutical_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_management_settings_updated_at BEFORE UPDATE ON public.data_management_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for clean seed data
CREATE OR REPLACE VIEW public.clean_seed_data AS
SELECT 
  'nutraceutical' as data_type,
  n.id,
  n.name,
  n.description,
  n.created_at
FROM public.nutraceuticals n
UNION ALL
SELECT 
  'health_condition' as data_type,
  hc.id,
  hc.name,
  hc.description,
  hc.created_at
FROM public.health_conditions hc
UNION ALL
SELECT 
  'scientific_study' as data_type,
  ss.id,
  ss.title as name,
  ss.abstract as description,
  ss.created_at
FROM public.scientific_studies ss;