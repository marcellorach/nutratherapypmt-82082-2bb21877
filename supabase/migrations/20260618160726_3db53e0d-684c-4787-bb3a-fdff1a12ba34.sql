CREATE TABLE public.kg_integrity_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  count_r integer,
  count_n integer,
  sync_gap integer,
  ghost_pure integer,
  mixed_triplets integer,
  mixed_groups integer,
  orphans integer,
  stamp_drift integer,
  divergences jsonb NOT NULL DEFAULT '[]'::jsonb,
  threshold_breach boolean NOT NULL DEFAULT false,
  notes text
);
GRANT SELECT ON public.kg_integrity_runs TO authenticated;
GRANT ALL ON public.kg_integrity_runs TO service_role;
ALTER TABLE public.kg_integrity_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_kg_integrity_runs" ON public.kg_integrity_runs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX kg_integrity_runs_ran_at_idx ON public.kg_integrity_runs (ran_at DESC);