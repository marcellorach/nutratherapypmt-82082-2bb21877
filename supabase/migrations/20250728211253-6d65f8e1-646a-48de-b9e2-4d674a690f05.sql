-- Fase 1: Correções Críticas de Segurança

-- 1. Habilitar RLS na tabela nutraceutical_imports (correção do ERROR 12)
ALTER TABLE public.nutraceutical_imports ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas RLS para nutraceutical_imports
CREATE POLICY "Authenticated users can view imports" 
ON public.nutraceutical_imports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can create imports" 
ON public.nutraceutical_imports 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update imports" 
ON public.nutraceutical_imports 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete imports" 
ON public.nutraceutical_imports 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 2. Corrigir search_path em todas as funções para melhorar segurança
CREATE OR REPLACE FUNCTION public.update_exam_uploads_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_design_conventions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_onboarding_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_user_onboarding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO user_onboarding_progress (user_id, current_state, progress_percentage)
  VALUES (NEW.id, 'new', 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clean_seed_data(batch_id_param text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
    result_text TEXT := '';
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Limpar nutraceuticals
    IF batch_id_param IS NULL THEN
        DELETE FROM nutraceuticals WHERE data_type = 'seed';
    ELSE
        DELETE FROM nutraceuticals WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    result_text := result_text || 'Nutracêuticos: ' || deleted_count || ' removidos. ';
    
    -- Limpar scientific_studies
    IF batch_id_param IS NULL THEN
        DELETE FROM scientific_studies WHERE data_type = 'seed';
    ELSE
        DELETE FROM scientific_studies WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    result_text := result_text || 'Estudos: ' || deleted_count || ' removidos. ';
    
    -- Limpar health_conditions
    IF batch_id_param IS NULL THEN
        DELETE FROM health_conditions WHERE data_type = 'seed';
    ELSE
        DELETE FROM health_conditions WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    result_text := result_text || 'Condições: ' || deleted_count || ' removidas. ';
    
    -- Limpar relacionamentos
    IF batch_id_param IS NULL THEN
        DELETE FROM nutraceutical_conditions WHERE data_type = 'seed';
        DELETE FROM nutraceutical_studies WHERE data_type = 'seed';
        DELETE FROM nutraceutical_scientific_metadata WHERE data_type = 'seed';
    ELSE
        DELETE FROM nutraceutical_conditions WHERE data_type = 'seed' AND batch_id = batch_id_param;
        DELETE FROM nutraceutical_studies WHERE data_type = 'seed' AND batch_id = batch_id_param;
        DELETE FROM nutraceutical_scientific_metadata WHERE data_type = 'seed' AND batch_id = batch_id_param;
    END IF;
    
    result_text := result_text || 'Total de ' || total_deleted || ' registros principais removidos.';
    
    RETURN result_text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_data_management_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    email = NEW.email;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_scispace_imports_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    UPDATE public.scispace_imports
    SET is_deleted = TRUE,
        deleted_at = NOW()
    WHERE id = OLD.id;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_timestamp_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$function$;