-- Fix search_path for the new trigger function
CREATE OR REPLACE FUNCTION reset_neo4j_sync_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes from approved to something else, reset synced flag
  IF OLD.curation_status = 'approved' AND NEW.curation_status != 'approved' THEN
    NEW.synced_to_neo4j = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;