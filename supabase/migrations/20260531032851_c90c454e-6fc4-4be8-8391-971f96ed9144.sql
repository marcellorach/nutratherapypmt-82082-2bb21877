
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-reports', 'audit-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Audit reports public read" ON storage.objects;
DROP POLICY IF EXISTS "Audit reports admin write" ON storage.objects;
DROP POLICY IF EXISTS "Audit reports admin update" ON storage.objects;
DROP POLICY IF EXISTS "Audit reports admin delete" ON storage.objects;

CREATE POLICY "Audit reports public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'audit-reports');

CREATE POLICY "Audit reports admin write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audit-reports' AND public.is_admin());

CREATE POLICY "Audit reports admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audit-reports' AND public.is_admin());

CREATE POLICY "Audit reports admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audit-reports' AND public.is_admin());

UPDATE public.technical_audits
SET summary = (summary - 'generator')
  || jsonb_build_object(
       'generator',
       CASE
         WHEN summary->>'generator' ILIKE '%lovable%'
           THEN regexp_replace(summary->>'generator', 'lovable-agent', 'senex-ai', 'gi')
         ELSE COALESCE(summary->>'generator', 'senex-ai')
       END
     )
WHERE summary ? 'generator';
