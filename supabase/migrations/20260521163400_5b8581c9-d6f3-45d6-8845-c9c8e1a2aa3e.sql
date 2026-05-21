-- Phase 2: ensure single active prompt version per (task_id, model_id) and provide RPC to activate
CREATE OR REPLACE FUNCTION public.ai_prompt_versions_enforce_single_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.ai_prompt_versions
       SET is_active = false
     WHERE task_id = NEW.task_id
       AND COALESCE(model_id, '') = COALESCE(NEW.model_id, '')
       AND id <> NEW.id
       AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apv_single_active ON public.ai_prompt_versions;
CREATE TRIGGER trg_apv_single_active
AFTER INSERT OR UPDATE OF is_active ON public.ai_prompt_versions
FOR EACH ROW WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.ai_prompt_versions_enforce_single_active();

-- RPC to atomically activate a version (admin only)
CREATE OR REPLACE FUNCTION public.activate_ai_prompt_version(p_version_id uuid)
RETURNS public.ai_prompt_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ai_prompt_versions;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can activate prompt versions';
  END IF;

  UPDATE public.ai_prompt_versions
     SET is_active = true, updated_at = now()
   WHERE id = p_version_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Prompt version not found: %', p_version_id;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_ai_prompt_version(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_ai_prompt_version(uuid) TO authenticated;