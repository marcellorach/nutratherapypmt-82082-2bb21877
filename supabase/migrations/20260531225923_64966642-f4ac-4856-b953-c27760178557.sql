-- 1) Bilingual support on technical_audits
ALTER TABLE public.technical_audits
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt',
  ADD COLUMN IF NOT EXISTS language_group_id uuid;

ALTER TABLE public.technical_audits
  DROP CONSTRAINT IF EXISTS technical_audits_language_check;
ALTER TABLE public.technical_audits
  ADD CONSTRAINT technical_audits_language_check CHECK (language IN ('pt','en'));

CREATE INDEX IF NOT EXISTS idx_technical_audits_language_group
  ON public.technical_audits(language_group_id);

-- 2) Prompt versions table
CREATE TABLE IF NOT EXISTS public.audit_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  kind text NOT NULL,
  language text NOT NULL,
  prompt text NOT NULL,
  notes text,
  gaps_detected jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_prompt_versions_kind_check CHECK (kind IN ('system','per_block','close','meta_gaps')),
  CONSTRAINT audit_prompt_versions_language_check CHECK (language IN ('pt','en'))
);

GRANT SELECT ON public.audit_prompt_versions TO authenticated;
GRANT ALL ON public.audit_prompt_versions TO service_role;

ALTER TABLE public.audit_prompt_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view audit prompt versions" ON public.audit_prompt_versions;
CREATE POLICY "Authenticated can view audit prompt versions"
  ON public.audit_prompt_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins manage audit prompt versions" ON public.audit_prompt_versions;
CREATE POLICY "Admins manage audit prompt versions"
  ON public.audit_prompt_versions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE UNIQUE INDEX IF NOT EXISTS uniq_audit_prompt_versions_active
  ON public.audit_prompt_versions(kind, language)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_audit_prompt_versions_version
  ON public.audit_prompt_versions(version);

DROP TRIGGER IF EXISTS trg_audit_prompt_versions_updated ON public.audit_prompt_versions;
CREATE TRIGGER trg_audit_prompt_versions_updated
  BEFORE UPDATE ON public.audit_prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed placeholders (real prompts injected by generate-audit on first run)
INSERT INTO public.audit_prompt_versions (version, kind, language, prompt, is_active, notes)
VALUES
  ('v7.0', 'system', 'pt', '__SEED_FALLBACK__', true, 'Seed inicial; conteúdo real vem do fallback hardcoded do generate-audit.'),
  ('v7.0', 'per_block', 'pt', '__SEED_FALLBACK__', true, 'Seed inicial; conteúdo real vem do fallback hardcoded do generate-audit.'),
  ('v7.0', 'close', 'pt', '__SEED_FALLBACK__', true, 'Seed inicial; conteúdo real vem do fallback hardcoded do generate-audit.'),
  ('v7.0', 'system', 'en', '__SEED_FALLBACK__', true, 'Initial seed; real content comes from generate-audit hardcoded fallback.'),
  ('v7.0', 'per_block', 'en', '__SEED_FALLBACK__', true, 'Initial seed; real content comes from generate-audit hardcoded fallback.'),
  ('v7.0', 'close', 'en', '__SEED_FALLBACK__', true, 'Initial seed; real content comes from generate-audit hardcoded fallback.')
ON CONFLICT DO NOTHING;