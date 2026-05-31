
ALTER TABLE public.technical_audits
  ADD COLUMN IF NOT EXISTS superseded_by TEXT REFERENCES public.technical_audits(id) ON DELETE SET NULL;

ALTER TABLE public.audit_requests
  ADD COLUMN IF NOT EXISTS auto_triggered BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.audit_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  change_threshold INTEGER NOT NULL DEFAULT 6,
  watched_areas TEXT[] NOT NULL DEFAULT ARRAY['curation','kg','clinical-pipeline','infra','base-knowledge'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.audit_settings TO authenticated;
GRANT ALL ON public.audit_settings TO service_role;

ALTER TABLE public.audit_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit settings"
  ON public.audit_settings FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins upsert audit settings"
  ON public.audit_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update audit settings"
  ON public.audit_settings FOR UPDATE TO authenticated
  USING (public.is_admin());

INSERT INTO public.audit_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
