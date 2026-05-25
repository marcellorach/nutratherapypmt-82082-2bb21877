ALTER TABLE public.synthetic_cohorts
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;