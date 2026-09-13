-- ============ 1. BACKUPS (before any write) ============
CREATE TABLE IF NOT EXISTS public.user_roles_backup_20260913 AS
SELECT * FROM public.user_roles;

ALTER TABLE public.user_roles_backup_20260913 ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles_backup_20260913 TO authenticated;
GRANT ALL ON public.user_roles_backup_20260913 TO service_role;
DROP POLICY IF EXISTS "admin_read_user_roles_backup" ON public.user_roles_backup_20260913;
CREATE POLICY "admin_read_user_roles_backup" ON public.user_roles_backup_20260913
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.rls_policies_backup_20260913 AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check, now() AS captured_at
FROM pg_policies WHERE schemaname = 'public';

ALTER TABLE public.rls_policies_backup_20260913 ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.rls_policies_backup_20260913 TO authenticated;
GRANT ALL ON public.rls_policies_backup_20260913 TO service_role;
DROP POLICY IF EXISTS "admin_read_policies_backup" ON public.rls_policies_backup_20260913;
CREATE POLICY "admin_read_policies_backup" ON public.rls_policies_backup_20260913
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============ 2. PERMISSION CATALOG ============
CREATE TABLE IF NOT EXISTS public.permissions (
  key text PRIMARY KEY,
  category text NOT NULL,
  label_pt text NOT NULL,
  label_en text NOT NULL,
  description_pt text,
  description_en text,
  supports_edit boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.permissions;
CREATE POLICY "Authenticated can read permissions"
  ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage permissions" ON public.permissions;
CREATE POLICY "Admins manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_permissions_updated_at ON public.permissions;
CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. ROLE GRID ============
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('view','edit')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_key)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated can read role permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON public.role_permissions;
CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_role_name()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.role NOT IN ('admin','scientist','vet_coordinator','veterinarian','tutor','user') THEN
    RAISE EXCEPTION 'Invalid role: %', NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_role_permissions_role ON public.role_permissions;
CREATE TRIGGER trg_validate_role_permissions_role
  BEFORE INSERT OR UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_name();

-- ============ 4. PER-USER OVERRIDES ============
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  effect text NOT NULL CHECK (effect IN ('allow','deny')),
  level text NOT NULL CHECK (level IN ('view','edit')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);

GRANT SELECT ON public.user_permission_overrides TO authenticated;
GRANT ALL ON public.user_permission_overrides TO service_role;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own overrides" ON public.user_permission_overrides;
CREATE POLICY "Users read their own overrides"
  ON public.user_permission_overrides FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage overrides" ON public.user_permission_overrides;
CREATE POLICY "Admins manage overrides"
  ON public.user_permission_overrides FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_user_permission_overrides_updated_at ON public.user_permission_overrides;
CREATE TRIGGER trg_user_permission_overrides_updated_at
  BEFORE UPDATE ON public.user_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 5. PERMISSION AUDIT LOG ============
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('role','user','catalog')),
  subject_id text NOT NULL,
  permission_key text,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.permission_audit_log TO authenticated;
GRANT ALL ON public.permission_audit_log TO service_role;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read permission audit log" ON public.permission_audit_log;
CREATE POLICY "Admins read permission audit log"
  ON public.permission_audit_log FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_role_permission_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit_log (subject_type, subject_id, permission_key, action, old_value, new_value, performed_by)
    VALUES ('role', OLD.role, OLD.permission_key, 'revoked', jsonb_build_object('level', OLD.level), NULL, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_log (subject_type, subject_id, permission_key, action, old_value, new_value, performed_by)
    VALUES ('role', NEW.role, NEW.permission_key, 'changed', jsonb_build_object('level', OLD.level), jsonb_build_object('level', NEW.level), auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.permission_audit_log (subject_type, subject_id, permission_key, action, old_value, new_value, performed_by)
    VALUES ('role', NEW.role, NEW.permission_key, 'granted', NULL, jsonb_build_object('level', NEW.level), auth.uid());
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_role_permission_change ON public.role_permissions;
CREATE TRIGGER trg_log_role_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_role_permission_change();

CREATE OR REPLACE FUNCTION public.log_user_override_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit_log (subject_type, subject_id, permission_key, action, old_value, new_value, performed_by)
    VALUES ('user', OLD.user_id::text, OLD.permission_key, 'override_removed', jsonb_build_object('effect', OLD.effect, 'level', OLD.level), NULL, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_log (subject_type, subject_id, permission_key, action, old_value, new_value, performed_by)
    VALUES ('user', NEW.user_id::text, NEW.permission_key, 'override_changed', jsonb_build_object('effect', OLD.effect, 'level', OLD.level), jsonb_build_object('effect', NEW.effect, 'level', NEW.level), auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.permission_audit_log (subject_type, subject_id, permission_key, action, old_value, new_value, performed_by)
    VALUES ('user', NEW.user_id::text, NEW.permission_key, 'override_added', NULL, jsonb_build_object('effect', NEW.effect, 'level', NEW.level), auth.uid());
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_user_override_change ON public.user_permission_overrides;
CREATE TRIGGER trg_log_user_override_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.log_user_override_change();

-- ============ 6. SINGLE SOURCE OF TRUTH: has_permission ============
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _key text, _level text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH req AS (
    SELECT CASE WHEN _level = 'edit' THEN 2 ELSE 1 END AS rank
  ),
  ov AS (
    SELECT effect, CASE WHEN level = 'edit' THEN 2 ELSE 1 END AS rank
    FROM public.user_permission_overrides
    WHERE user_id = _user_id AND permission_key = _key
  )
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM ov, req WHERE ov.effect = 'deny' AND ov.rank <= req.rank) THEN false
    WHEN EXISTS (SELECT 1 FROM ov, req WHERE ov.effect = 'allow' AND ov.rank >= req.rank) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      JOIN public.user_roles ur ON ur.role = rp.role
      CROSS JOIN req
      WHERE ur.user_id = _user_id
        AND rp.permission_key = _key
        AND (CASE WHEN rp.level = 'edit' THEN 2 ELSE 1 END) >= req.rank
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.current_has_permission(_key text, _level text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_permission(auth.uid(), _key, _level); $$;

CREATE OR REPLACE FUNCTION public.my_effective_permissions()
RETURNS TABLE(permission_key text, level text, source text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_grants AS (
    SELECT rp.permission_key,
           MAX(CASE WHEN rp.level = 'edit' THEN 2 ELSE 1 END) AS rank
    FROM public.role_permissions rp
    JOIN public.user_roles ur ON ur.role = rp.role
    WHERE ur.user_id = auth.uid()
    GROUP BY rp.permission_key
  ),
  ov AS (
    SELECT permission_key, effect, CASE WHEN level = 'edit' THEN 2 ELSE 1 END AS rank
    FROM public.user_permission_overrides
    WHERE user_id = auth.uid()
  ),
  merged AS (
    SELECT p.key AS permission_key,
           COALESCE(o.rank, r.rank) AS rank,
           CASE
             WHEN o.effect = 'deny' THEN 'deny'
             WHEN o.effect = 'allow' THEN 'override'
             WHEN r.rank IS NOT NULL THEN 'role'
             ELSE 'none'
           END AS source,
           o.effect AS effect
    FROM public.permissions p
    LEFT JOIN role_grants r ON r.permission_key = p.key
    LEFT JOIN ov o ON o.permission_key = p.key
  )
  SELECT permission_key,
         CASE WHEN rank = 2 THEN 'edit' ELSE 'view' END AS level,
         source
  FROM merged
  WHERE source IN ('role','override')
    AND rank IS NOT NULL
    AND COALESCE(effect, 'allow') <> 'deny';
$$;

-- ============ 7. LAST-ADMIN LOCK (database level) ============
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  admin_count integer;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'admin')
     OR (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') THEN
    SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last administrator';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_removal ON public.user_roles;
CREATE TRIGGER trg_prevent_last_admin_removal
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();

-- ============ 8. RESTRICT EXECUTION OF AUTHORIZATION FUNCTIONS ============
REVOKE ALL ON FUNCTION public.has_permission(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_has_permission(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_has_permission(text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.my_effective_permissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_effective_permissions() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_user_role_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_role_name() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_last_admin_removal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_role_permission_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_user_override_change() FROM PUBLIC, anon, authenticated;