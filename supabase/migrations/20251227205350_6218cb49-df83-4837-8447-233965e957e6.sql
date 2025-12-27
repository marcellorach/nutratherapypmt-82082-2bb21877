-- =====================================================
-- PHASE 1: Evidence Conflict Detection & Canonical Resolutions
-- =====================================================

-- Table to store individual evidence claims from each study
CREATE TABLE public.evidence_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship identification
  subject_name TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID,
  predicate TEXT NOT NULL,
  object_name TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id UUID,
  
  -- Context (do not aggregate!)
  species_context TEXT[] DEFAULT '{}',
  breed_context TEXT[] DEFAULT '{}',
  age_context TEXT,
  
  -- Study-specific data
  study_id UUID REFERENCES public.processed_studies(id) ON DELETE SET NULL,
  study_quality_score DECIMAL(3,2),
  study_year INTEGER,
  
  -- Dosage data (specific to this study)
  dose_value DECIMAL,
  dose_min DECIMAL,
  dose_max DECIMAL,
  dose_unit TEXT,
  dose_frequency TEXT,
  dose_duration TEXT,
  dose_route TEXT,
  
  -- Extraction metadata
  extraction_confidence DECIMAL(3,2),
  triplet_id UUID REFERENCES public.triplet_extractions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for grouping claims by relationship
CREATE INDEX idx_evidence_claims_relationship ON public.evidence_claims(
  subject_name, predicate, object_name
);

CREATE INDEX idx_evidence_claims_species ON public.evidence_claims USING GIN(species_context);
CREATE INDEX idx_evidence_claims_study ON public.evidence_claims(study_id);
CREATE INDEX idx_evidence_claims_triplet ON public.evidence_claims(triplet_id);

-- Table to store canonical resolutions (expert decisions)
CREATE TABLE public.canonical_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship identification (what was resolved)
  subject_name TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object_name TEXT NOT NULL,
  object_type TEXT NOT NULL,
  
  -- Context scope (null = applies to all)
  species_context TEXT[] DEFAULT '{}',
  breed_context TEXT[] DEFAULT '{}',
  
  -- Resolution details
  resolution_type TEXT NOT NULL CHECK (resolution_type IN ('single_study', 'weighted_average', 'context_specific', 'manual_value')),
  
  -- Canonical value (structured)
  canonical_value JSONB NOT NULL DEFAULT '{}',
  -- Example: {"dose_min": 100, "dose_max": 200, "dose_unit": "mg/kg", "dose_frequency": "daily"}
  
  -- Source studies used in resolution
  source_study_ids UUID[] DEFAULT '{}',
  source_claim_ids UUID[] DEFAULT '{}',
  
  -- Expert decision metadata
  rationale TEXT NOT NULL,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ DEFAULT now(),
  
  -- Validity and review
  is_active BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES public.canonical_resolutions(id),
  review_due_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookups
CREATE INDEX idx_canonical_resolutions_relationship ON public.canonical_resolutions(
  subject_name, predicate, object_name
) WHERE is_active = true;

CREATE INDEX idx_canonical_resolutions_species ON public.canonical_resolutions USING GIN(species_context);

-- Conflict tracking table (pending conflicts awaiting resolution)
CREATE TABLE public.evidence_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship identification
  subject_name TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object_name TEXT NOT NULL,
  object_type TEXT NOT NULL,
  
  -- Context
  species_context TEXT[] DEFAULT '{}',
  
  -- Conflict metrics
  claim_count INTEGER NOT NULL DEFAULT 0,
  study_count INTEGER NOT NULL DEFAULT 0,
  conflict_level TEXT NOT NULL CHECK (conflict_level IN ('none', 'low', 'moderate', 'high')),
  variance_coefficient DECIMAL(5,4),
  agreement_score DECIMAL(3,2),
  
  -- Related claims
  claim_ids UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  resolution_id UUID REFERENCES public.canonical_resolutions(id),
  
  -- AI suggestion
  ai_suggestion TEXT,
  ai_recommended_action TEXT,
  
  -- Review tracking
  assigned_to UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint to prevent duplicate conflicts
  UNIQUE(subject_name, predicate, object_name, species_context)
);

CREATE INDEX idx_evidence_conflicts_status ON public.evidence_conflicts(status) WHERE status = 'pending';
CREATE INDEX idx_evidence_conflicts_level ON public.evidence_conflicts(conflict_level);

-- Add conflict tracking columns to hierarchical_edges
ALTER TABLE public.hierarchical_edges 
ADD COLUMN IF NOT EXISTS conflict_level TEXT DEFAULT 'none' CHECK (conflict_level IN ('none', 'low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS canonical_resolution_id UUID REFERENCES public.canonical_resolutions(id),
ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claim_ids UUID[] DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.evidence_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_conflicts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evidence_claims
CREATE POLICY "Admins can manage evidence_claims"
ON public.evidence_claims FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view evidence_claims"
ON public.evidence_claims FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for canonical_resolutions
CREATE POLICY "Admins can manage canonical_resolutions"
ON public.canonical_resolutions FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view canonical_resolutions"
ON public.canonical_resolutions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for evidence_conflicts
CREATE POLICY "Admins can manage evidence_conflicts"
ON public.evidence_conflicts FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone authenticated can view evidence_conflicts"
ON public.evidence_conflicts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_evidence_claims_updated_at
BEFORE UPDATE ON public.evidence_claims
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canonical_resolutions_updated_at
BEFORE UPDATE ON public.canonical_resolutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_conflicts_updated_at
BEFORE UPDATE ON public.evidence_conflicts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();