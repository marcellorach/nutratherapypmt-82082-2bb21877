-- Add synced_to_neo4j column to triplet_extractions
ALTER TABLE triplet_extractions 
ADD COLUMN IF NOT EXISTS synced_to_neo4j boolean DEFAULT false;

-- Add index for faster queries on approved and unsynced triplets
CREATE INDEX IF NOT EXISTS idx_triplet_extractions_sync_status 
ON triplet_extractions(curation_status, synced_to_neo4j);

-- Add trigger to update synced_to_neo4j when status changes
CREATE OR REPLACE FUNCTION reset_neo4j_sync_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes from approved to something else, reset synced flag
  IF OLD.curation_status = 'approved' AND NEW.curation_status != 'approved' THEN
    NEW.synced_to_neo4j = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER triplet_status_sync_reset
BEFORE UPDATE ON triplet_extractions
FOR EACH ROW
EXECUTE FUNCTION reset_neo4j_sync_on_status_change();