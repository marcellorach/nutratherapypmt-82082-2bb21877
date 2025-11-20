-- Tabela para registrar uso de APIs de IA
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  api_provider TEXT NOT NULL, -- 'google_gemini', 'openai', 'claude', etc
  model TEXT NOT NULL, -- 'gemini-2.5-flash', 'gpt-4', etc
  operation TEXT NOT NULL, -- 'file_search', 'extraction', 'chat', etc
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd NUMERIC(10, 6), -- Custo em USD com 6 casas decimais
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb, -- Dados adicionais (study_id, duration, etc)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_provider ON public.api_usage_logs(api_provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);

-- RLS Policies
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all API usage logs"
  ON public.api_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Admins podem inserir logs
CREATE POLICY "Admins can insert API usage logs"
  ON public.api_usage_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_api_usage_logs_updated_at
  BEFORE UPDATE ON public.api_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();