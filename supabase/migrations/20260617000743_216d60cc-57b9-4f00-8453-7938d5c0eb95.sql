CREATE TABLE IF NOT EXISTS public.neo4j_ghost_edges_backup_20260616 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triplet_id uuid,
  subject_label text,
  subject_name text,
  predicate text,
  object_label text,
  object_name text,
  evidence_count integer,
  study_id text,
  rel_properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.neo4j_ghost_edges_backup_20260616 TO authenticated;
GRANT ALL ON public.neo4j_ghost_edges_backup_20260616 TO service_role;
ALTER TABLE public.neo4j_ghost_edges_backup_20260616 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read backup" ON public.neo4j_ghost_edges_backup_20260616 FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins insert backup" ON public.neo4j_ghost_edges_backup_20260616 FOR INSERT TO authenticated WITH CHECK (public.is_admin());