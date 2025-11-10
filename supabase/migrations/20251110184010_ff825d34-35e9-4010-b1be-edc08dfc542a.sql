-- Fix infinite recursion in user_roles RLS policies
-- Drop ALL existing policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Create a security definer function to safely check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Create new policies without recursion
-- Policy for users to view their own roles
CREATE POLICY "user_roles_select_own"
ON user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admins to view all roles
CREATE POLICY "user_roles_select_admin"
ON user_roles
FOR SELECT
USING (public.is_admin());

-- Policy for admins to insert roles
CREATE POLICY "user_roles_insert_admin"
ON user_roles
FOR INSERT
WITH CHECK (public.is_admin());

-- Policy for admins to update roles
CREATE POLICY "user_roles_update_admin"
ON user_roles
FOR UPDATE
USING (public.is_admin());

-- Policy for admins to delete roles
CREATE POLICY "user_roles_delete_admin"
ON user_roles
FOR DELETE
USING (public.is_admin());