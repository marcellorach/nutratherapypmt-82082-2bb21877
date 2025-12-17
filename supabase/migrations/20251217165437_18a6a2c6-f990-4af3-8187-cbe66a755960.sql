-- Add confidence_rationale column to triplet_extractions table
-- This column stores the LLM's explanation for the confidence score calculation
ALTER TABLE public.triplet_extractions 
ADD COLUMN IF NOT EXISTS confidence_rationale TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.triplet_extractions.confidence_rationale IS 'LLM-generated explanation for the confidence score calculation (e.g., "Base: RCT (0.85) + p<0.01 (+0.05) + canine (+0.05) = 0.95")';