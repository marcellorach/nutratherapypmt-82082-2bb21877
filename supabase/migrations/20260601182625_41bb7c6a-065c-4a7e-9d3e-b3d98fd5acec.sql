
-- pgcrypto for symmetric encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- API keys table (encrypted, admin-only)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  source_id text NOT NULL,
  encrypted_value bytea NOT NULL,
  description text,
  last_tested_at timestamptz,
  last_test_status text,
  last_test_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read api_keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins insert api_keys"
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admins update api_keys"
  ON public.api_keys FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admins delete api_keys"
  ON public.api_keys FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public view: NO encrypted_value, just metadata + is_set flag
CREATE VIEW public.api_keys_public
WITH (security_invoker = true) AS
SELECT
  id, key_name, source_id, description,
  last_tested_at, last_test_status, last_test_message,
  created_at, updated_at,
  (encrypted_value IS NOT NULL) AS is_set
FROM public.api_keys;

GRANT SELECT ON public.api_keys_public TO authenticated;

-- Decryption function: callable only by service_role (used by edge functions)
CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_key_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_encrypted bytea;
  v_master_key text;
BEGIN
  v_master_key := current_setting('app.api_keys_encryption_key', true);
  IF v_master_key IS NULL OR v_master_key = '' THEN
    RAISE EXCEPTION 'API_KEYS_ENCRYPTION_KEY not provided';
  END IF;

  SELECT encrypted_value INTO v_encrypted
  FROM public.api_keys
  WHERE key_name = p_key_name;

  IF v_encrypted IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(v_encrypted, v_master_key);
END;
$$;

REVOKE ALL ON FUNCTION public.decrypt_api_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(text) TO service_role;

-- Encryption helper (also service_role only)
CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key_name text, p_source_id text, p_value text, p_description text DEFAULT NULL, p_user uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_master_key text;
BEGIN
  v_master_key := current_setting('app.api_keys_encryption_key', true);
  IF v_master_key IS NULL OR v_master_key = '' THEN
    RAISE EXCEPTION 'API_KEYS_ENCRYPTION_KEY not provided';
  END IF;

  INSERT INTO public.api_keys (key_name, source_id, encrypted_value, description, updated_by)
  VALUES (p_key_name, p_source_id, pgp_sym_encrypt(p_value, v_master_key), p_description, p_user)
  ON CONFLICT (key_name) DO UPDATE
  SET encrypted_value = EXCLUDED.encrypted_value,
      source_id = EXCLUDED.source_id,
      description = COALESCE(EXCLUDED.description, public.api_keys.description),
      updated_by = EXCLUDED.updated_by,
      updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_api_key(text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(text, text, text, text, uuid) TO service_role;
