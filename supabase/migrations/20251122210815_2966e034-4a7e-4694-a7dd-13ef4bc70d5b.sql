-- SPRINT 1: Sistema RAG Médico Completo
-- Adicionar suporte para texto completo, embeddings vetoriais e grafos de conhecimento

-- 1. Adicionar campos de texto completo à tabela existente
ALTER TABLE processed_studies
ADD COLUMN IF NOT EXISTS full_text_content TEXT,
ADD COLUMN IF NOT EXISTS full_text_metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN processed_studies.full_text_content IS 'Texto completo extraído do PDF para RAG';
COMMENT ON COLUMN processed_studies.full_text_metadata IS 'Metadados do texto (sections, word_count, etc)';

-- 2. Habilitar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 3. Criar tabela de embeddings vetoriais
CREATE TABLE IF NOT EXISTS public.study_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES processed_studies(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_metadata JSONB DEFAULT '{}',
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_study_chunk UNIQUE(study_id, chunk_index)
);

COMMENT ON TABLE public.study_embeddings IS 'Chunks de texto vetorizados para busca semântica RAG';
COMMENT ON COLUMN public.study_embeddings.embedding IS 'Embedding Gemini text-embedding-004 (768 dimensões)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_study_embeddings_study_id ON study_embeddings(study_id);
CREATE INDEX IF NOT EXISTS idx_study_embeddings_created ON study_embeddings(created_at DESC);

-- Índice vetorial para busca por similaridade cosseno
CREATE INDEX IF NOT EXISTS idx_study_embeddings_vector 
ON study_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- RLS Policies para study_embeddings
ALTER TABLE study_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage embeddings"
ON study_embeddings FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can view embeddings"
ON study_embeddings FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- 4. Criar tabela de grafo de conhecimento médico
CREATE TABLE IF NOT EXISTS public.medical_knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('nutraceutical', 'condition', 'mechanism', 'interaction', 'side_effect')),
  entity_name TEXT NOT NULL,
  entity_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_medical_entity UNIQUE(entity_type, entity_name)
);

COMMENT ON TABLE public.medical_knowledge_graph IS 'Entidades médicas extraídas de estudos (nutracêuticos, condições, mecanismos)';

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_type ON medical_knowledge_graph(entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_name ON medical_knowledge_graph(entity_name);

-- 5. Criar tabela de arestas do grafo (relações entre entidades)
CREATE TABLE IF NOT EXISTS public.medical_knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES medical_knowledge_graph(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES medical_knowledge_graph(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('treats', 'causes', 'prevents', 'interacts_with', 'enhances', 'reduces', 'requires')),
  relationship_strength FLOAT DEFAULT 1.0 CHECK (relationship_strength >= 0 AND relationship_strength <= 5),
  supporting_study_ids UUID[] DEFAULT '{}',
  evidence_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medical_knowledge_edges IS 'Relações entre entidades médicas (ex: Curcumin --enhances--> Piperine)';

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON medical_knowledge_edges(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON medical_knowledge_edges(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON medical_knowledge_edges(relationship_type);

-- RLS Policies para knowledge graph
ALTER TABLE medical_knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_knowledge_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge graph"
ON medical_knowledge_graph FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can view knowledge graph"
ON medical_knowledge_graph FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can manage knowledge edges"
ON medical_knowledge_edges FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can view knowledge edges"
ON medical_knowledge_edges FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- 6. Função SQL para busca vetorial semântica
CREATE OR REPLACE FUNCTION search_study_chunks(
  query_embedding vector(768),
  match_study_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  study_id UUID,
  chunk_text TEXT,
  chunk_index INT,
  similarity FLOAT,
  chunk_metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    study_embeddings.id AS chunk_id,
    study_embeddings.study_id,
    study_embeddings.chunk_text,
    study_embeddings.chunk_index,
    1 - (study_embeddings.embedding <=> query_embedding) AS similarity,
    study_embeddings.chunk_metadata
  FROM study_embeddings
  WHERE
    (match_study_id IS NULL OR study_embeddings.study_id = match_study_id)
    AND study_embeddings.embedding IS NOT NULL
    AND 1 - (study_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY study_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_study_chunks IS 'Busca semântica de chunks por similaridade cosseno usando pgvector';

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_study_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_study_embeddings_updated_at
BEFORE UPDATE ON study_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_study_embeddings();

CREATE TRIGGER trigger_update_knowledge_graph_updated_at
BEFORE UPDATE ON medical_knowledge_graph
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_knowledge_edges_updated_at
BEFORE UPDATE ON medical_knowledge_edges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();