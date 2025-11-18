-- FASE 3: Tabela para armazenar relatórios de audit

CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índice para buscar relatórios mais recentes
CREATE INDEX IF NOT EXISTS idx_audit_reports_created_at ON public.audit_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can view audit reports"
  ON public.audit_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit reports"
  ON public.audit_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );