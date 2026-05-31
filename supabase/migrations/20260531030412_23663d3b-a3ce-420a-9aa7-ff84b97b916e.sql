
CREATE OR REPLACE FUNCTION public.auto_fulfill_audit_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.audit_requests
     SET status = 'fulfilled',
         fulfilled_audit_id = NEW.id
   WHERE status = 'pending'
     AND fulfilled_audit_id IS NULL
     AND requested_at::date <= NEW.audit_date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_fulfill_audit_requests ON public.technical_audits;
CREATE TRIGGER trg_auto_fulfill_audit_requests
AFTER INSERT ON public.technical_audits
FOR EACH ROW EXECUTE FUNCTION public.auto_fulfill_audit_requests();
