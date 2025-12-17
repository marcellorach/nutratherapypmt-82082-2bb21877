-- Drop the existing constraint and add a new one with more valid statuses
ALTER TABLE public.processed_studies 
DROP CONSTRAINT IF EXISTS processed_studies_kanban_status_check;

ALTER TABLE public.processed_studies 
ADD CONSTRAINT processed_studies_kanban_status_check 
CHECK (kanban_status IN ('new', 'processing', 'processed', 'error', 'review', 'approved', 'rejected'));