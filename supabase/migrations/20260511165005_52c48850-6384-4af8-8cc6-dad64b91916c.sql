
CREATE TABLE public.technical_audits (
  id text PRIMARY KEY,
  version text NOT NULL,
  audit_date date NOT NULL,
  system_version text NOT NULL,
  system_changelog_date date,
  scope text NOT NULL,
  scope_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  html_path text,
  pdf_path text,
  docx_path text,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  system_version text NOT NULL,
  system_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  fulfilled_audit_id text REFERENCES public.technical_audits(id) ON DELETE SET NULL,
  requested_by uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.technical_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage technical_audits"
  ON public.technical_audits FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone authenticated can view technical_audits"
  ON public.technical_audits FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage audit_requests"
  ON public.audit_requests FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_technical_audits_updated
  BEFORE UPDATE ON public.technical_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_audit_requests_updated
  BEFORE UPDATE ON public.audit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.technical_audits
  (id, version, audit_date, system_version, system_changelog_date, scope, html_path, pdf_path, docx_path, summary)
VALUES (
  'v3',
  '3.0.0',
  '2026-05-11',
  'i18n 1.63.0',
  CURRENT_DATE,
  'Auditoria técnica completa do VetGraphRAG cobrindo: arquitetura do pipeline de curadoria de 7 estágios; modelo de dados do Knowledge Graph (5 camadas: Compostos → Mecanismos → Pathways → Condições → Outcomes); políticas RLS e governança de dados; conformidade regulatória FDA/EMA/AVMA; sistema bilingue PT/EN; motor de recomendação híbrida com 8 compostos sinérgicos; Digital Twin e projeções de longevidade; pipeline de gap-fill com PubMed; integração SNOMED-CT VetSCT e UMLS; auditoria de tradução; e os 9 infográficos de fluxo do sistema.',
  '/audits/v3/index.html',
  '/audits/v3/auditoria.pdf',
  '/audits/v3/auditoria.docx',
  '{"strengths": 18, "gaps": 7, "risks": 4, "pages": 27, "infographics": 9}'::jsonb
);
