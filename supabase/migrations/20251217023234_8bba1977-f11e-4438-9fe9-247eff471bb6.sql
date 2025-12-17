-- Tabela de Ontologia Veterinária Base para VetGraphRAG 2.0
-- Esta tabela serve como a camada fundamental de conhecimento veterinário

CREATE TABLE public.veterinary_ontology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT UNIQUE NOT NULL,
  entity_name TEXT NOT NULL,
  entity_name_en TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('species', 'breed', 'condition', 'compound', 'mechanism', 'pathway', 'effect')),
  canonical_name TEXT NOT NULL,
  synonyms TEXT[] DEFAULT '{}',
  description TEXT,
  description_en TEXT,
  parent_id TEXT REFERENCES public.veterinary_ontology(entity_id),
  layer TEXT NOT NULL DEFAULT 'ontology_base',
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'VeNOM', 'SNOMED-CT', 'UMLS', 'ChEBI', 'PubChem')),
  external_ids JSONB DEFAULT '{}',
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_veterinary_ontology_entity_type ON public.veterinary_ontology(entity_type);
CREATE INDEX idx_veterinary_ontology_parent_id ON public.veterinary_ontology(parent_id);
CREATE INDEX idx_veterinary_ontology_layer ON public.veterinary_ontology(layer);
CREATE INDEX idx_veterinary_ontology_canonical_name ON public.veterinary_ontology(canonical_name);
CREATE INDEX idx_veterinary_ontology_synonyms ON public.veterinary_ontology USING GIN(synonyms);

-- Enable RLS
ALTER TABLE public.veterinary_ontology ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage veterinary_ontology"
ON public.veterinary_ontology
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "Anyone authenticated can view veterinary_ontology"
ON public.veterinary_ontology
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_veterinary_ontology_updated_at
BEFORE UPDATE ON public.veterinary_ontology
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.veterinary_ontology IS 'Base layer for VetGraphRAG 2.0 - fundamental veterinary knowledge entities';
COMMENT ON COLUMN public.veterinary_ontology.entity_id IS 'Unique identifier for the entity (e.g., BREED:golden_retriever, COMPOUND:glucosamine)';
COMMENT ON COLUMN public.veterinary_ontology.entity_type IS 'Type of entity: species, breed, condition, compound, mechanism, pathway, effect';
COMMENT ON COLUMN public.veterinary_ontology.canonical_name IS 'Standard/official name for the entity';
COMMENT ON COLUMN public.veterinary_ontology.layer IS 'Knowledge layer: ontology_base, meta_graph, study_specific';
COMMENT ON COLUMN public.veterinary_ontology.external_ids IS 'External database IDs (ChEBI, PubChem, SNOMED, etc.)';