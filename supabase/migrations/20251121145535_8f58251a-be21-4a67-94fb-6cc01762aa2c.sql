-- Fase 2: Corrigir estrutura do study_extractions
-- Problema: study_extractions.study_id (TEXT) referencia processed_studies.study_id (TEXT)
-- Solução: Mudar para referenciar processed_studies.id (UUID)

-- 1. Remover foreign key constraint existente
ALTER TABLE public.study_extractions
DROP CONSTRAINT IF EXISTS study_extractions_study_id_fkey;

-- 2. Alterar tipo da coluna study_id de TEXT para UUID
-- Nota: Se houver dados existentes com valores não-UUID, essa conversão falhará
ALTER TABLE public.study_extractions 
ALTER COLUMN study_id TYPE uuid USING study_id::uuid;

-- 3. Adicionar nova foreign key constraint para processed_studies(id)
ALTER TABLE public.study_extractions
ADD CONSTRAINT study_extractions_study_id_fkey 
FOREIGN KEY (study_id) REFERENCES public.processed_studies(id) ON DELETE CASCADE;

-- 4. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_study_extractions_study_id 
ON public.study_extractions(study_id);

-- 5. Adicionar comentário explicativo
COMMENT ON COLUMN public.study_extractions.study_id IS 'Foreign key to processed_studies.id (UUID primary key, not study_id TEXT column)';
