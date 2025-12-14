-- Add hallucination_flag column to triplet_extractions
ALTER TABLE triplet_extractions 
ADD COLUMN IF NOT EXISTS hallucination_flag boolean DEFAULT false;

-- Add index for filtering hallucinated triplets
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_hallucination 
ON triplet_extractions (hallucination_flag) 
WHERE hallucination_flag = true;

-- Comment
COMMENT ON COLUMN triplet_extractions.hallucination_flag IS 'Flag indicating if the triplet entity names were not found in the original study text';