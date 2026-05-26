
-- Fase 1: analysis log and re-run tracking on synthetic_cohorts
ALTER TABLE public.synthetic_cohorts
  ADD COLUMN IF NOT EXISTS analysis_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_analyzed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_analysis_insights_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_analysis_model text;

-- Fase 2: prioritization board overrides (drag-and-drop persistence)
CREATE TABLE IF NOT EXISTS public.prioritization_overrides (
  card_id text PRIMARY KEY,
  status text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.prioritization_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read prioritization overrides"
ON public.prioritization_overrides FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins write prioritization overrides"
ON public.prioritization_overrides FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update prioritization overrides"
ON public.prioritization_overrides FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete prioritization overrides"
ON public.prioritization_overrides FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER prioritization_overrides_updated_at
BEFORE UPDATE ON public.prioritization_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
