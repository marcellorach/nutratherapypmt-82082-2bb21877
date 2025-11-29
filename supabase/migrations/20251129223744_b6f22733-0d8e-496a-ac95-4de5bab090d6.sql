-- ============================================
-- VETGRAPHRAG HIERARCHICAL MODEL MIGRATION
-- Fase 1: Expandir entity types, relationship types e criar tabelas hierárquicas
-- ============================================

-- ============================================
-- 1. CRIAR ENUMs EXPANDIDOS
-- ============================================

-- Entity Layer (5 camadas hierárquicas)
DO $$ BEGIN
  CREATE TYPE entity_layer AS ENUM (
    'layer_0_compound',
    'layer_1_target',
    'layer_2_mechanism',
    'layer_3_effect',
    'layer_4_outcome'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Entity Types expandidos (16+ tipos)
DO $$ BEGIN
  CREATE TYPE entity_type_expanded AS ENUM (
    'nutraceutical',
    'drug',
    'chemical_compound',
    'pathway',
    'receptor',
    'enzyme',
    'gene_protein',
    'mechanism',
    'signaling_cascade',
    'biological_effect',
    'side_effect',
    'clinical_outcome',
    'condition',
    'disease',
    'breed',
    'species',
    'age_group',
    'study'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Relationship Types expandidos (20+ relações semânticas)
DO $$ BEGIN
  CREATE TYPE relationship_type_expanded AS ENUM (
    'INHIBITS',
    'ACTIVATES',
    'MODULATES',
    'BINDS_TO',
    'BLOCKS',
    'UPREGULATES',
    'DOWNREGULATES',
    'TRIGGERS',
    'PARTICIPATES_IN',
    'REGULATES',
    'PRODUCES',
    'LEADS_TO',
    'CAUSES',
    'TREATS',
    'PREVENTS',
    'SUPPORTS',
    'AMELIORATES',
    'MANAGES',
    'WORSENS',
    'CONTRAINDICATED_FOR',
    'CAUSES_SIDE_EFFECT',
    'AGGRAVATES',
    'SYNERGIZES_WITH',
    'ANTAGONIZES',
    'ENHANCES_BIOAVAILABILITY',
    'REDUCES_BIOAVAILABILITY',
    'REQUIRES',
    'POTENTIATES',
    'PREDISPOSED_IN',
    'COMMON_IN',
    'CITED_IN',
    'STUDIED_IN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. EXPANDIR triplet_extractions
-- ============================================

ALTER TABLE triplet_extractions 
ADD COLUMN IF NOT EXISTS subject_layer TEXT,
ADD COLUMN IF NOT EXISTS object_layer TEXT,
ADD COLUMN IF NOT EXISTS relationship_category TEXT,
ADD COLUMN IF NOT EXISTS intensity DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS direction TEXT,
ADD COLUMN IF NOT EXISTS evidence_level TEXT,
ADD COLUMN IF NOT EXISTS species_context TEXT[],
ADD COLUMN IF NOT EXISTS dose_dependent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dose_range JSONB,
ADD COLUMN IF NOT EXISTS mechanism_path JSONB,
ADD COLUMN IF NOT EXISTS synergy_data JSONB;

-- Add check constraints
DO $$ BEGIN
  ALTER TABLE triplet_extractions 
  ADD CONSTRAINT chk_direction CHECK (direction IS NULL OR direction IN ('improves', 'worsens', 'neutral', 'bidirectional'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE triplet_extractions 
  ADD CONSTRAINT chk_evidence_level CHECK (evidence_level IS NULL OR evidence_level IN ('meta_analysis', 'rct', 'cohort', 'case_control', 'case_report', 'in_vitro', 'expert_opinion'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. CRIAR TABELA pathway_nodes (Layer 1)
-- ============================================

CREATE TABLE IF NOT EXISTS pathway_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  pathway_type TEXT,
  category TEXT,
  description TEXT,
  description_en TEXT,
  kegg_id TEXT,
  reactome_id TEXT,
  go_term TEXT,
  species_relevance TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT chk_pathway_type CHECK (pathway_type IS NULL OR pathway_type IN ('metabolic', 'signaling', 'regulatory', 'inflammatory', 'oxidative', 'immune', 'neural'))
);

CREATE INDEX IF NOT EXISTS idx_pathway_nodes_name ON pathway_nodes(name);
CREATE INDEX IF NOT EXISTS idx_pathway_nodes_type ON pathway_nodes(pathway_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pathway_nodes_name_unique ON pathway_nodes(LOWER(name));

-- ============================================
-- 4. CRIAR TABELA mechanism_nodes (Layer 2)
-- ============================================

CREATE TABLE IF NOT EXISTS mechanism_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  mechanism_type TEXT,
  target_pathway_id UUID REFERENCES pathway_nodes(id) ON DELETE SET NULL,
  description TEXT,
  description_en TEXT,
  molecular_target TEXT,
  action_type TEXT,
  reversibility TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT chk_mechanism_type CHECK (mechanism_type IS NULL OR mechanism_type IN ('enzymatic', 'receptor_mediated', 'gene_expression', 'ion_channel', 'transport', 'signaling', 'oxidative', 'immune')),
  CONSTRAINT chk_action_type CHECK (action_type IS NULL OR action_type IN ('inhibition', 'activation', 'modulation', 'blocking', 'potentiation')),
  CONSTRAINT chk_reversibility CHECK (reversibility IS NULL OR reversibility IN ('reversible', 'irreversible', 'partially_reversible'))
);

CREATE INDEX IF NOT EXISTS idx_mechanism_nodes_name ON mechanism_nodes(name);
CREATE INDEX IF NOT EXISTS idx_mechanism_nodes_pathway ON mechanism_nodes(target_pathway_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mechanism_nodes_name_unique ON mechanism_nodes(LOWER(name));

-- ============================================
-- 5. CRIAR TABELA biological_effect_nodes (Layer 3)
-- ============================================

CREATE TABLE IF NOT EXISTS biological_effect_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  effect_type TEXT,
  effect_category TEXT,
  description TEXT,
  description_en TEXT,
  onset_time TEXT,
  duration TEXT,
  severity_if_adverse TEXT,
  frequency_if_adverse DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT chk_effect_type CHECK (effect_type IS NULL OR effect_type IN ('therapeutic', 'adverse', 'neutral', 'dose_dependent')),
  CONSTRAINT chk_onset_time CHECK (onset_time IS NULL OR onset_time IN ('immediate', 'minutes', 'hours', 'days', 'weeks', 'months')),
  CONSTRAINT chk_duration CHECK (duration IS NULL OR duration IN ('transient', 'short_term', 'sustained', 'permanent')),
  CONSTRAINT chk_severity CHECK (severity_if_adverse IS NULL OR severity_if_adverse IN ('mild', 'moderate', 'severe', 'life_threatening'))
);

CREATE INDEX IF NOT EXISTS idx_bio_effects_name ON biological_effect_nodes(name);
CREATE INDEX IF NOT EXISTS idx_bio_effects_type ON biological_effect_nodes(effect_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bio_effects_name_unique ON biological_effect_nodes(LOWER(name));

-- ============================================
-- 6. CRIAR TABELA hierarchical_edges
-- ============================================

CREATE TABLE IF NOT EXISTS hierarchical_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  source_layer TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_layer TEXT NOT NULL,
  relationship TEXT NOT NULL,
  
  -- Properties enriquecidas
  intensity DECIMAL(3,2),
  confidence DECIMAL(3,2),
  evidence_level TEXT,
  evidence_count INTEGER DEFAULT 0,
  study_ids UUID[],
  
  -- Metadata científica
  ic50 TEXT,
  ec50 TEXT,
  ki TEXT,
  dose_range JSONB,
  species_validated TEXT[],
  
  -- Curação
  curated BOOLEAN DEFAULT false,
  curated_by UUID,
  curated_at TIMESTAMPTZ,
  
  -- Origem
  triplet_id UUID REFERENCES triplet_extractions(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT chk_intensity CHECK (intensity IS NULL OR (intensity >= 0 AND intensity <= 1)),
  CONSTRAINT chk_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS idx_hier_edges_source ON hierarchical_edges(source_id, source_layer);
CREATE INDEX IF NOT EXISTS idx_hier_edges_target ON hierarchical_edges(target_id, target_layer);
CREATE INDEX IF NOT EXISTS idx_hier_edges_relationship ON hierarchical_edges(relationship);
CREATE INDEX IF NOT EXISTS idx_hier_edges_triplet ON hierarchical_edges(triplet_id);

-- Unique constraint para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_hier_edges_unique 
ON hierarchical_edges(source_id, target_id, relationship);

-- ============================================
-- 7. ENABLE RLS e CRIAR POLICIES
-- ============================================

ALTER TABLE pathway_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanism_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE biological_effect_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchical_edges ENABLE ROW LEVEL SECURITY;

-- Policies para pathway_nodes
CREATE POLICY "Admins can manage pathway_nodes" ON pathway_nodes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view pathway_nodes" ON pathway_nodes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies para mechanism_nodes
CREATE POLICY "Admins can manage mechanism_nodes" ON mechanism_nodes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view mechanism_nodes" ON mechanism_nodes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies para biological_effect_nodes
CREATE POLICY "Admins can manage biological_effect_nodes" ON biological_effect_nodes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view biological_effect_nodes" ON biological_effect_nodes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies para hierarchical_edges
CREATE POLICY "Admins can manage hierarchical_edges" ON hierarchical_edges FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view hierarchical_edges" ON hierarchical_edges FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 8. TRIGGERS para updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_pathway_nodes_updated_at ON pathway_nodes;
CREATE TRIGGER update_pathway_nodes_updated_at
  BEFORE UPDATE ON pathway_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mechanism_nodes_updated_at ON mechanism_nodes;
CREATE TRIGGER update_mechanism_nodes_updated_at
  BEFORE UPDATE ON mechanism_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bio_effects_updated_at ON biological_effect_nodes;
CREATE TRIGGER update_bio_effects_updated_at
  BEFORE UPDATE ON biological_effect_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hier_edges_updated_at ON hierarchical_edges;
CREATE TRIGGER update_hier_edges_updated_at
  BEFORE UPDATE ON hierarchical_edges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();