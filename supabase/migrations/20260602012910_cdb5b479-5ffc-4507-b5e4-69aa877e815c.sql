ALTER TABLE public.ai_task_invocations
  ADD COLUMN IF NOT EXISTS missing_variables text[] NULL;

CREATE INDEX IF NOT EXISTS idx_ai_task_invocations_missing_vars
  ON public.ai_task_invocations USING GIN (missing_variables)
  WHERE missing_variables IS NOT NULL;