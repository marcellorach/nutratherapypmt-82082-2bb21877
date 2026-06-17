
CREATE TABLE public.ai_system_prompts_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  prompt_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('override_set','override_cleared','default_changed','manifest_synced')),
  changed_by UUID,
  old_content TEXT,
  new_content TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_system_prompts_audit_log TO authenticated;
GRANT ALL ON public.ai_system_prompts_audit_log TO service_role;

ALTER TABLE public.ai_system_prompts_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit log"
  ON public.ai_system_prompts_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role writes audit log"
  ON public.ai_system_prompts_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_ai_prompts_audit_prompt_id ON public.ai_system_prompts_audit_log(prompt_id, created_at DESC);
CREATE INDEX idx_ai_prompts_audit_key ON public.ai_system_prompts_audit_log(prompt_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_ai_system_prompt_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_old TEXT;
  v_new TEXT;
BEGIN
  IF COALESCE(OLD.override_content,'') IS DISTINCT FROM COALESCE(NEW.override_content,'') THEN
    IF NEW.override_content IS NULL THEN
      v_action := 'override_cleared';
    ELSE
      v_action := 'override_set';
    END IF;
    v_old := OLD.override_content;
    v_new := NEW.override_content;
  ELSIF COALESCE(OLD.default_content,'') IS DISTINCT FROM COALESCE(NEW.default_content,'') THEN
    v_action := 'default_changed';
    v_old := OLD.default_content;
    v_new := NEW.default_content;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.ai_system_prompts_audit_log
    (prompt_id, prompt_key, action, changed_by, old_content, new_content)
  VALUES
    (NEW.id, NEW.prompt_key, v_action, auth.uid(), v_old, v_new);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ai_system_prompts_audit
AFTER UPDATE ON public.ai_system_prompts
FOR EACH ROW
EXECUTE FUNCTION public.log_ai_system_prompt_change();
