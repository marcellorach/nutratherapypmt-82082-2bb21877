CREATE OR REPLACE FUNCTION public.list_platform_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.current_has_permission('op.manage_users', 'edit')) THEN
    RAISE EXCEPTION 'insufficient_privilege: op.manage_users required';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.avatar_url,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(array_agg(r.role ORDER BY r.role) FILTER (WHERE r.role IS NOT NULL), '{}')::text[]
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  GROUP BY u.id, u.email, p.full_name, p.avatar_url, u.created_at, u.last_sign_in_at
  ORDER BY u.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.list_platform_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_platform_users() TO authenticated, service_role;