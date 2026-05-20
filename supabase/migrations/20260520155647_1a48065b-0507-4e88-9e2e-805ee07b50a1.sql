
CREATE TABLE IF NOT EXISTS public.core_rule_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.core_rules(id) ON DELETE SET NULL,
  rule_code text,
  meta_study_id uuid REFERENCES public.meta_studies(id) ON DELETE SET NULL,
  action text NOT NULL,
  stance text,
  actor_user_id uuid,
  justification text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.core_rule_audit_log
  DROP CONSTRAINT IF EXISTS core_rule_audit_log_action_check;
ALTER TABLE public.core_rule_audit_log
  ADD CONSTRAINT core_rule_audit_log_action_check
  CHECK (action IN (
    'stance_detected','promote','attach','resolve_keep','discard',
    'approve_meta_study','manual_note'
  ));

ALTER TABLE public.core_rule_audit_log
  DROP CONSTRAINT IF EXISTS core_rule_audit_log_stance_check;
ALTER TABLE public.core_rule_audit_log
  ADD CONSTRAINT core_rule_audit_log_stance_check
  CHECK (stance IS NULL OR stance IN ('confirms','extends','contradicts','unrelated'));

CREATE INDEX IF NOT EXISTS idx_core_rule_audit_log_rule_id ON public.core_rule_audit_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_core_rule_audit_log_rule_code ON public.core_rule_audit_log(rule_code);
CREATE INDEX IF NOT EXISTS idx_core_rule_audit_log_meta_study_id ON public.core_rule_audit_log(meta_study_id);
CREATE INDEX IF NOT EXISTS idx_core_rule_audit_log_created_at ON public.core_rule_audit_log(created_at DESC);

ALTER TABLE public.core_rule_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS core_rule_audit_log_admin_all ON public.core_rule_audit_log;
CREATE POLICY core_rule_audit_log_admin_all ON public.core_rule_audit_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
