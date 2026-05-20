ALTER TABLE public.core_rules
  ADD COLUMN IF NOT EXISTS runtime_effect text NOT NULL DEFAULT 'doc_only'
  CHECK (runtime_effect IN ('active','doc_only','planned'));

COMMENT ON COLUMN public.core_rules.runtime_effect IS
  'active = altera pipeline em runtime; doc_only = governança auditável; planned = ainda não implementada';