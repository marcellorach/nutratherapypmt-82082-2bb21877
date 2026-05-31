ALTER TABLE public.technical_audits
  ADD COLUMN IF NOT EXISTS progress_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_heartbeat timestamptz,
  ADD COLUMN IF NOT EXISTS resume_count integer NOT NULL DEFAULT 0;