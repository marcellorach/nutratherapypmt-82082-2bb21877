CREATE TABLE public.ai_prompt_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_key text NOT NULL,
  function_name text NOT NULL,
  model text,
  latency_ms integer,
  tokens_in integer,
  tokens_out integer,
  success boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_prompt_usage_log TO authenticated;
GRANT ALL ON public.ai_prompt_usage_log TO service_role;

ALTER TABLE public.ai_prompt_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view prompt usage log"
ON public.ai_prompt_usage_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::text
  )
);

CREATE INDEX idx_ai_prompt_usage_log_key ON public.ai_prompt_usage_log (prompt_key, created_at DESC);
CREATE INDEX idx_ai_prompt_usage_log_function ON public.ai_prompt_usage_log (function_name, created_at DESC);
CREATE INDEX idx_ai_prompt_usage_log_created ON public.ai_prompt_usage_log (created_at DESC);