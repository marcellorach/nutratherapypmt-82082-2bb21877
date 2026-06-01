
DROP FUNCTION IF EXISTS public.decrypt_api_key(text);
DROP FUNCTION IF EXISTS public.encrypt_api_key(text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_key_name text, p_master_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_encrypted bytea;
BEGIN
  SELECT encrypted_value INTO v_encrypted
  FROM public.api_keys
  WHERE key_name = p_key_name;

  IF v_encrypted IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(v_encrypted, p_master_key);
END;
$$;

REVOKE ALL ON FUNCTION public.decrypt_api_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.encrypt_api_key(
  p_key_name text,
  p_source_id text,
  p_value text,
  p_master_key text,
  p_description text DEFAULT NULL,
  p_user uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.api_keys (key_name, source_id, encrypted_value, description, updated_by)
  VALUES (p_key_name, p_source_id, pgp_sym_encrypt(p_value, p_master_key), p_description, p_user)
  ON CONFLICT (key_name) DO UPDATE
  SET encrypted_value = EXCLUDED.encrypted_value,
      source_id = EXCLUDED.source_id,
      description = COALESCE(EXCLUDED.description, public.api_keys.description),
      updated_by = EXCLUDED.updated_by,
      updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_api_key(text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(text, text, text, text, text, uuid) TO service_role;
