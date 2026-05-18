
CREATE TABLE IF NOT EXISTS public.pet_food_bulk_enrich_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed int NOT NULL DEFAULT 0,
  succeeded int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  skipped int NOT NULL DEFAULT 0,
  error text,
  details jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.pet_food_bulk_enrich_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bulk enrich runs"
  ON public.pet_food_bulk_enrich_runs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert bulk enrich runs"
  ON public.pet_food_bulk_enrich_runs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bulk enrich runs"
  ON public.pet_food_bulk_enrich_runs FOR UPDATE
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_pet_food_bulk_enrich_runs_started
  ON public.pet_food_bulk_enrich_runs(started_at DESC);
