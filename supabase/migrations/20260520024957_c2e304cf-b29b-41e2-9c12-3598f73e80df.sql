
ALTER TABLE public.processed_studies
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS curated_at timestamptz,
  ADD COLUMN IF NOT EXISTS curated_by uuid;

-- Backfill
UPDATE public.processed_studies
SET processed_at = updated_at
WHERE processed_at IS NULL AND analysis_data IS NOT NULL;

UPDATE public.processed_studies
SET curated_at = updated_at
WHERE curated_at IS NULL AND kanban_status = 'approved';

-- Trigger to set processed_at automatically when analysis_data is first populated
CREATE OR REPLACE FUNCTION public.set_processed_at_on_analysis()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.analysis_data IS NOT NULL
     AND (OLD.analysis_data IS NULL OR OLD.processed_at IS NULL)
     AND NEW.processed_at IS NULL THEN
    NEW.processed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_processed_at ON public.processed_studies;
CREATE TRIGGER trg_set_processed_at
BEFORE UPDATE ON public.processed_studies
FOR EACH ROW
EXECUTE FUNCTION public.set_processed_at_on_analysis();
