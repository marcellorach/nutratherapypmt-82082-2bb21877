-- Create recommendation_logs table for storing recommendation confidence and hybrid system data
CREATE TABLE IF NOT EXISTS public.recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID,
  condition_id UUID REFERENCES health_conditions(id),
  
  -- Confidence metrics
  confidence_overall NUMERIC(4,3),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low', 'insufficient')),
  kg_coverage_score NUMERIC(4,3),
  evidence_quality_score NUMERIC(4,3),
  data_freshness_score NUMERIC(4,3),
  
  -- Source tracking
  recommendation_source TEXT CHECK (recommendation_source IN ('knowledge_graph', 'hybrid', 'llm_fallback')),
  triplets_used UUID[],
  studies_referenced UUID[],
  
  -- The recommendation itself
  recommendation_data JSONB,
  disclaimer_shown TEXT,
  warnings TEXT[],
  rationale TEXT,
  
  -- Feedback loop
  veterinarian_reviewed BOOLEAN DEFAULT FALSE,
  outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage recommendation logs"
  ON public.recommendation_logs
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "Authenticated users can view recommendation logs"
  ON public.recommendation_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert recommendation logs"
  ON public.recommendation_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_recommendation_logs_updated_at
  BEFORE UPDATE ON public.recommendation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for common queries
CREATE INDEX idx_recommendation_logs_pet ON public.recommendation_logs(pet_id);
CREATE INDEX idx_recommendation_logs_condition ON public.recommendation_logs(condition_id);
CREATE INDEX idx_recommendation_logs_source ON public.recommendation_logs(recommendation_source);
CREATE INDEX idx_recommendation_logs_confidence ON public.recommendation_logs(confidence_level);
CREATE INDEX idx_recommendation_logs_created ON public.recommendation_logs(created_at DESC);