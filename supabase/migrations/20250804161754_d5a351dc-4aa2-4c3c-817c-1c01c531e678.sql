-- Criar tabela para famílias de outcomes
CREATE TABLE public.outcome_families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '🏥',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna family_id à tabela nutraceutical_outcomes
ALTER TABLE public.nutraceutical_outcomes 
ADD COLUMN family_id UUID REFERENCES public.outcome_families(id);

-- Habilitar RLS na tabela outcome_families
ALTER TABLE public.outcome_families ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para outcome_families
CREATE POLICY "Acesso público para visualização famílias" 
ON public.outcome_families 
FOR SELECT 
USING (true);

CREATE POLICY "Acesso público para inserção famílias" 
ON public.outcome_families 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Acesso público para atualização famílias" 
ON public.outcome_families 
FOR UPDATE 
USING (true);

CREATE POLICY "Acesso público para deleção famílias" 
ON public.outcome_families 
FOR DELETE 
USING (true);

-- Inserir as famílias iniciais
INSERT INTO public.outcome_families (name, description, color, icon, sort_order) VALUES
('Cardiovascular', 'Condições relacionadas ao sistema cardiovascular e circulatório', '#EF4444', '🫀', 1),
('Neurológico & Cognitivo', 'Condições do sistema nervoso e funções cognitivas', '#8B5CF6', '🧠', 2),
('Musculoesquelético', 'Condições dos músculos, ossos e articulações', '#F59E0B', '🦴', 3),
('Imunológico & Inflamatório', 'Condições do sistema imunológico e processos inflamatórios', '#10B981', '🛡️', 4),
('Envelhecimento & Longevidade', 'Condições relacionadas ao envelhecimento e longevidade', '#6366F1', '⏳', 5),
('Doenças Sistêmicas Crônicas', 'Doenças crônicas que afetam múltiplos sistemas', '#EC4899', '🏥', 6);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_outcome_families_updated_at
BEFORE UPDATE ON public.outcome_families
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();