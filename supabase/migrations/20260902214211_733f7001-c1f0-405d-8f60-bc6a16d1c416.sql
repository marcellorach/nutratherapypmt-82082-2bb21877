-- 1. Role validation (role column is TEXT)
CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN ('admin','scientist','vet_coordinator','veterinarian','tutor','user') THEN
    RAISE EXCEPTION 'Invalid role: %', NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_user_role ON public.user_roles;
CREATE TRIGGER trg_validate_user_role
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.validate_user_role();

-- 2. Role predicates (security definer, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_scientist()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'scientist'); $$;

CREATE OR REPLACE FUNCTION public.is_vet_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'vet_coordinator'); $$;

-- writers of the scientific pipeline (no delete rights)
CREATE OR REPLACE FUNCTION public.can_write_science()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.is_admin() OR public.is_scientist(); $$;

-- curation (triplets/extractions) + clinical coordination
CREATE OR REPLACE FUNCTION public.can_curate()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.is_admin() OR public.is_scientist() OR public.is_vet_coordinator(); $$;

-- 3. Role assignment audit log
CREATE TABLE IF NOT EXISTS public.user_role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  role text NOT NULL,
  action text NOT NULL,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_role_audit_log TO authenticated;
GRANT ALL ON public.user_role_audit_log TO service_role;

ALTER TABLE public.user_role_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view role audit log" ON public.user_role_audit_log;
CREATE POLICY "Admins can view role audit log"
ON public.user_role_audit_log FOR SELECT TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_role_audit_log (target_user_id, role, action, performed_by)
    VALUES (NEW.user_id, NEW.role, 'granted', auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.user_role_audit_log (target_user_id, role, action, performed_by)
    VALUES (OLD.user_id, OLD.role, 'revoked', auth.uid());
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_user_role_change ON public.user_roles;
CREATE TRIGGER trg_log_user_role_change
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();

-- 4. Only admins manage role assignments
DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Writer permissions on the scientific pipeline
-- processed_studies
DROP POLICY IF EXISTS "Science writers can insert processed studies" ON public.processed_studies;
CREATE POLICY "Science writers can insert processed studies"
ON public.processed_studies FOR INSERT TO authenticated
WITH CHECK (public.can_write_science());

DROP POLICY IF EXISTS "Science writers can update processed studies" ON public.processed_studies;
CREATE POLICY "Science writers can update processed studies"
ON public.processed_studies FOR UPDATE TO authenticated
USING (public.can_write_science())
WITH CHECK (public.can_write_science());

-- study_extractions
DROP POLICY IF EXISTS "Curators can insert extractions" ON public.study_extractions;
CREATE POLICY "Curators can insert extractions"
ON public.study_extractions FOR INSERT TO authenticated
WITH CHECK (public.can_curate());

DROP POLICY IF EXISTS "Curators can update extractions" ON public.study_extractions;
CREATE POLICY "Curators can update extractions"
ON public.study_extractions FOR UPDATE TO authenticated
USING (public.can_curate())
WITH CHECK (public.can_curate());

-- triplet_extractions
DROP POLICY IF EXISTS "Curators can insert triplets" ON public.triplet_extractions;
CREATE POLICY "Curators can insert triplets"
ON public.triplet_extractions FOR INSERT TO authenticated
WITH CHECK (public.can_curate());

DROP POLICY IF EXISTS "Curators can update triplets" ON public.triplet_extractions;
CREATE POLICY "Curators can update triplets"
ON public.triplet_extractions FOR UPDATE TO authenticated
USING (public.can_curate())
WITH CHECK (public.can_curate());

-- meta_studies
DROP POLICY IF EXISTS "Science writers can insert meta studies" ON public.meta_studies;
CREATE POLICY "Science writers can insert meta studies"
ON public.meta_studies FOR INSERT TO authenticated
WITH CHECK (public.can_write_science());

DROP POLICY IF EXISTS "Science writers can update meta studies" ON public.meta_studies;
CREATE POLICY "Science writers can update meta studies"
ON public.meta_studies FOR UPDATE TO authenticated
USING (public.can_write_science())
WITH CHECK (public.can_write_science());

-- hierarchical_edges
DROP POLICY IF EXISTS "Science writers can insert hierarchical edges" ON public.hierarchical_edges;
CREATE POLICY "Science writers can insert hierarchical edges"
ON public.hierarchical_edges FOR INSERT TO authenticated
WITH CHECK (public.can_write_science());

DROP POLICY IF EXISTS "Science writers can update hierarchical edges" ON public.hierarchical_edges;
CREATE POLICY "Science writers can update hierarchical edges"
ON public.hierarchical_edges FOR UPDATE TO authenticated
USING (public.can_write_science())
WITH CHECK (public.can_write_science());

-- pet_profiles: vet coordinators manage any patient (no delete)
DROP POLICY IF EXISTS "Vet coordinators can insert patients" ON public.pet_profiles;
CREATE POLICY "Vet coordinators can insert patients"
ON public.pet_profiles FOR INSERT TO authenticated
WITH CHECK (public.is_vet_coordinator() AND is_synthetic IS NOT TRUE);

DROP POLICY IF EXISTS "Vet coordinators can update patients" ON public.pet_profiles;
CREATE POLICY "Vet coordinators can update patients"
ON public.pet_profiles FOR UPDATE TO authenticated
USING (public.is_vet_coordinator())
WITH CHECK (public.is_vet_coordinator());

DROP POLICY IF EXISTS "Vet coordinators can view patients" ON public.pet_profiles;
CREATE POLICY "Vet coordinators can view patients"
ON public.pet_profiles FOR SELECT TO authenticated
USING (public.is_vet_coordinator());

-- study_audit_logs: curators can read and append their own events
DROP POLICY IF EXISTS "Curators can view study audit logs" ON public.study_audit_logs;
CREATE POLICY "Curators can view study audit logs"
ON public.study_audit_logs FOR SELECT TO authenticated
USING (public.can_curate());

DROP POLICY IF EXISTS "Curators can insert study audit logs" ON public.study_audit_logs;
CREATE POLICY "Curators can insert study audit logs"
ON public.study_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.can_curate());