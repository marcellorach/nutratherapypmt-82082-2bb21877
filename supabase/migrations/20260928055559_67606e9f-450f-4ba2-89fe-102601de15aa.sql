CREATE TABLE public.extraction_item_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.processed_studies(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('condition','dose')),
  item_key text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('correct','incorrect')),
  reviewed_by uuid NOT NULL DEFAULT auth.uid(),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX extraction_item_reviews_active_uq ON public.extraction_item_reviews(study_id,item_type,item_key) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE ON public.extraction_item_reviews TO authenticated;
GRANT ALL ON public.extraction_item_reviews TO service_role;
ALTER TABLE public.extraction_item_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read item reviews" ON public.extraction_item_reviews FOR SELECT TO authenticated USING (public.is_platform_member());
CREATE POLICY "Curators insert item reviews" ON public.extraction_item_reviews FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(),'tab.estudos','edit') AND reviewed_by = auth.uid());
CREATE POLICY "Curators update item reviews" ON public.extraction_item_reviews FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(),'tab.estudos','edit')) WITH CHECK (public.has_permission(auth.uid(),'tab.estudos','edit'));