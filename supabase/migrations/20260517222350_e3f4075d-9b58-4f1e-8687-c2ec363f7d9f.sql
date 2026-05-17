
CREATE TABLE IF NOT EXISTS public.ai_system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL UNIQUE,
  family TEXT NOT NULL,
  function_name TEXT,
  display_name TEXT NOT NULL,
  description TEXT,
  default_content TEXT NOT NULL DEFAULT '',
  override_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  has_override BOOLEAN GENERATED ALWAYS AS (override_content IS NOT NULL AND length(trim(override_content)) > 0) STORED,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_system_prompts_family ON public.ai_system_prompts(family);
CREATE INDEX IF NOT EXISTS idx_ai_system_prompts_function ON public.ai_system_prompts(function_name);

ALTER TABLE public.ai_system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system prompts"
ON public.ai_system_prompts FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert system prompts"
ON public.ai_system_prompts FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update system prompts"
ON public.ai_system_prompts FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete system prompts"
ON public.ai_system_prompts FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER trg_ai_system_prompts_updated_at
BEFORE UPDATE ON public.ai_system_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
