-- ============================================================================
-- MIGRATION: Sistema de Curadoria Completo para Triplets e Auto-Discoveries
-- Versão: 1.0.0
-- Data: 2025-11-26
-- ============================================================================

-- TABELA 1: triplet_extractions
-- Armazena triplets (subject-predicate-object) extraídos por IA de estudos científicos
-- Requer aprovação humana ou atinge threshold de auto-aprovação

CREATE TABLE IF NOT EXISTS public.triplet_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID REFERENCES public.processed_studies(id) ON DELETE CASCADE,
  
  -- O triplet extraído
  subject_type TEXT NOT NULL CHECK (subject_type IN ('nutraceutical', 'drug', 'breed', 'condition', 'outcome')),
  subject_id UUID,
  subject_name TEXT NOT NULL,
  predicate TEXT NOT NULL, -- 'TREATS', 'MODULATES', 'SYNERGIZES', 'PREVENTS', etc.
  object_type TEXT NOT NULL CHECK (object_type IN ('nutraceutical', 'drug', 'breed', 'condition', 'outcome')),
  object_id UUID,
  object_name TEXT NOT NULL,
  
  -- Scores da IA (0.00-1.00)
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  kg_match_score DECIMAL(3,2) CHECK (kg_match_score >= 0 AND kg_match_score <= 1),
  llm_confidence DECIMAL(3,2) CHECK (llm_confidence >= 0 AND llm_confidence <= 1),
  
  -- Workflow de curadoria
  curation_status TEXT DEFAULT 'pending' CHECK (curation_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  auto_approved BOOLEAN DEFAULT false,
  
  -- Human curation
  reviewed_by UUID REFERENCES auth.users(id),
  review_date TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Approval chain (JSON para flexibilidade)
  approval_chain JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_study_id ON public.triplet_extractions(study_id);
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_curation_status ON public.triplet_extractions(curation_status);
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_confidence ON public.triplet_extractions(extraction_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_subject ON public.triplet_extractions(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_object ON public.triplet_extractions(object_type, object_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_triplet_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_triplet_extractions_updated_at
  BEFORE UPDATE ON public.triplet_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_triplet_extractions_updated_at();

-- RLS Policies para triplet_extractions
ALTER TABLE public.triplet_extractions ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar tudo
CREATE POLICY "Admins can manage triplet extractions"
  ON public.triplet_extractions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Veterinários podem visualizar aprovados
CREATE POLICY "Veterinarians can view approved triplets"
  ON public.triplet_extractions
  FOR SELECT
  USING (
    curation_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'veterinarian')
    )
  );

-- ============================================================================
-- TABELA 2: auto_discoveries
-- Armazena links preditos pelo TransE (Auto-Discoveries)
-- Requer validação científica em cadeia de aprovação
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auto_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- O link predito pelo TransE
  head_entity_type TEXT NOT NULL CHECK (head_entity_type IN ('nutraceutical', 'drug', 'breed', 'condition', 'outcome')),
  head_entity_id UUID,
  head_entity_name TEXT NOT NULL,
  predicted_relation TEXT NOT NULL,
  tail_entity_type TEXT NOT NULL CHECK (tail_entity_type IN ('nutraceutical', 'drug', 'breed', 'condition', 'outcome')),
  tail_entity_id UUID,
  tail_entity_name TEXT NOT NULL,
  
  -- Scores de descoberta (0.00-1.00)
  transe_score DECIMAL(3,2) CHECK (transe_score >= 0 AND transe_score <= 1),
  evidence_multiplier DECIMAL(3,2) CHECK (evidence_multiplier >= 0 AND evidence_multiplier <= 1),
  novelty_factor DECIMAL(3,2) CHECK (novelty_factor >= 0 AND novelty_factor <= 1),
  discovery_score DECIMAL(3,2) CHECK (discovery_score >= 0 AND discovery_score <= 1), -- Score final calculado
  
  -- Evidências indiretas que suportam
  supporting_paths JSONB DEFAULT '[]'::jsonb, -- Caminhos no KG que suportam indiretamente
  
  -- Workflow de aprovação científica
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'under_review', 'validated', 'rejected')),
  approval_chain JSONB DEFAULT '[]'::jsonb, -- [{ stage, approved, date, reviewer }]
  
  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  validation_notes TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_auto_discoveries_status ON public.auto_discoveries(status);
CREATE INDEX IF NOT EXISTS idx_auto_discoveries_score ON public.auto_discoveries(discovery_score DESC);
CREATE INDEX IF NOT EXISTS idx_auto_discoveries_head ON public.auto_discoveries(head_entity_type, head_entity_id);
CREATE INDEX IF NOT EXISTS idx_auto_discoveries_tail ON public.auto_discoveries(tail_entity_type, tail_entity_id);
CREATE INDEX IF NOT EXISTS idx_auto_discoveries_discovered_at ON public.auto_discoveries(discovered_at DESC);

-- RLS Policies para auto_discoveries
ALTER TABLE public.auto_discoveries ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar tudo
CREATE POLICY "Admins can manage auto discoveries"
  ON public.auto_discoveries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Veterinários podem visualizar validados
CREATE POLICY "Veterinarians can view validated discoveries"
  ON public.auto_discoveries
  FOR SELECT
  USING (
    status = 'validated' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'veterinarian')
    )
  );

-- Comentários para documentação
COMMENT ON TABLE public.triplet_extractions IS 'Stores AI-extracted triplets (subject-predicate-object) from scientific studies requiring human curation';
COMMENT ON TABLE public.auto_discoveries IS 'Stores TransE-predicted links (Auto-Discoveries) requiring scientific validation';

COMMENT ON COLUMN public.triplet_extractions.kg_match_score IS 'Score de validação contra Knowledge Graph existente (KGARevion)';
COMMENT ON COLUMN public.triplet_extractions.llm_confidence IS 'Confiança do LLM na extração';
COMMENT ON COLUMN public.triplet_extractions.approval_chain IS 'JSON array com histórico de aprovações: [{stage, user_id, date, action}]';

COMMENT ON COLUMN public.auto_discoveries.transe_score IS 'Score do modelo TransE para o link predito';
COMMENT ON COLUMN public.auto_discoveries.evidence_multiplier IS 'Multiplicador baseado em evidências indiretas no KG';
COMMENT ON COLUMN public.auto_discoveries.novelty_factor IS 'Fator de novidade: 1.0 para descobertas inéditas';
COMMENT ON COLUMN public.auto_discoveries.supporting_paths IS 'JSON array com caminhos no KG que suportam a predição: [{path, confidence}]';