-- Criar tabela para histórico de chat com documentos
CREATE TABLE IF NOT EXISTS public.study_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.processed_studies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_study_chat_history_study_id ON public.study_chat_history(study_id);
CREATE INDEX IF NOT EXISTS idx_study_chat_history_user_id ON public.study_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_study_chat_history_created_at ON public.study_chat_history(created_at DESC);

-- RLS Policies
ALTER TABLE public.study_chat_history ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todo histórico
CREATE POLICY "Admins can view all chat history"
  ON public.study_chat_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Admins podem inserir chat
CREATE POLICY "Admins can insert chat"
  ON public.study_chat_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Usuários podem ver seu próprio histórico
CREATE POLICY "Users can view their own chat history"
  ON public.study_chat_history FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_study_chat_history_updated_at
  BEFORE UPDATE ON public.study_chat_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.study_chat_history IS 'Armazena histórico de conversas com documentos/estudos via AI';
COMMENT ON COLUMN public.study_chat_history.context_used IS 'Metadados sobre quais partes do estudo foram usadas na resposta';