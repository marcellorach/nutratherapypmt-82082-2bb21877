CREATE TABLE public.ai_system_prompts_integrity_check (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_version text NOT NULL,
  manifest_count int NOT NULL,
  db_count int NOT NULL,
  missing_in_db jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra_in_db jsonb NOT NULL DEFAULT '[]'::jsonb,
  out_of_sync jsonb NOT NULL DEFAULT '[]'::jsonb,
  hardcoded_outside_catalog jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL CHECK (status IN ('ok','drift','error')),
  triggered_by text NOT NULL DEFAULT 'manual',
  details jsonb,
  checked_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_system_prompts_integrity_check TO authenticated;
GRANT ALL ON public.ai_system_prompts_integrity_check TO service_role;

ALTER TABLE public.ai_system_prompts_integrity_check ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read integrity checks"
  ON public.ai_system_prompts_integrity_check
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role manages integrity checks"
  ON public.ai_system_prompts_integrity_check
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_ai_prompts_integrity_checked_at
  ON public.ai_system_prompts_integrity_check (checked_at DESC);