-- FASE 1: Estrutura do Banco de Dados para Traduções Dinâmicas

-- Tabela de traduções
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('pt', 'en')),
  value TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(key, locale)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON public.translations(locale);
CREATE INDEX IF NOT EXISTS idx_translations_version ON public.translations(version);
CREATE INDEX IF NOT EXISTS idx_translations_key_locale ON public.translations(key, locale);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_translations_updated_at();

-- Enable Row Level Security
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Todos podem ler traduções
CREATE POLICY "Anyone authenticated can view translations"
  ON public.translations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Admins can insert translations"
  ON public.translations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update translations"
  ON public.translations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete translations"
  ON public.translations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Função para incrementar versão global (cache busting)
CREATE OR REPLACE FUNCTION public.increment_translation_version()
RETURNS INTEGER AS $$
DECLARE
  new_version INTEGER;
BEGIN
  UPDATE public.translations
  SET version = version + 1
  WHERE id IN (SELECT id FROM public.translations LIMIT 1);
  
  SELECT COALESCE(MAX(version), 1) INTO new_version FROM public.translations;
  
  RETURN new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime para a tabela translations
ALTER PUBLICATION supabase_realtime ADD TABLE public.translations;