
ALTER TABLE public.ai_system_prompts
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS model_default text,
  ADD COLUMN IF NOT EXISTS temperature numeric,
  ADD COLUMN IF NOT EXISTS output_format text,
  ADD COLUMN IF NOT EXISTS consumers text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS example_input text,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
