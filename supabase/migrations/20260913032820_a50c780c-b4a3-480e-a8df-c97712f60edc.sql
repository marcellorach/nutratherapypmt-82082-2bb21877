-- Rewrite the 2026-09-02 RBAC policies on top of has_permission (single source of truth)

-- processed_studies
DROP POLICY IF EXISTS "Science writers can insert processed studies" ON public.processed_studies;
CREATE POLICY "Science writers can insert processed studies"
ON public.processed_studies FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

DROP POLICY IF EXISTS "Science writers can update processed studies" ON public.processed_studies;
CREATE POLICY "Science writers can update processed studies"
ON public.processed_studies FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'tab.estudos', 'edit'))
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

-- study_extractions
DROP POLICY IF EXISTS "Curators can insert extractions" ON public.study_extractions;
CREATE POLICY "Curators can insert extractions"
ON public.study_extractions FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

DROP POLICY IF EXISTS "Curators can update extractions" ON public.study_extractions;
CREATE POLICY "Curators can update extractions"
ON public.study_extractions FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'tab.estudos', 'edit'))
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

-- triplet_extractions
DROP POLICY IF EXISTS "Curators can insert triplets" ON public.triplet_extractions;
CREATE POLICY "Curators can insert triplets"
ON public.triplet_extractions FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.triplet-curation', 'edit'));

DROP POLICY IF EXISTS "Curators can update triplets" ON public.triplet_extractions;
CREATE POLICY "Curators can update triplets"
ON public.triplet_extractions FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'tab.triplet-curation', 'edit'))
WITH CHECK (public.has_permission(auth.uid(), 'tab.triplet-curation', 'edit'));

-- meta_studies
DROP POLICY IF EXISTS "Science writers can insert meta studies" ON public.meta_studies;
CREATE POLICY "Science writers can insert meta studies"
ON public.meta_studies FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

DROP POLICY IF EXISTS "Science writers can update meta studies" ON public.meta_studies;
CREATE POLICY "Science writers can update meta studies"
ON public.meta_studies FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'tab.estudos', 'edit'))
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

-- hierarchical_edges
DROP POLICY IF EXISTS "Science writers can insert hierarchical edges" ON public.hierarchical_edges;
CREATE POLICY "Science writers can insert hierarchical edges"
ON public.hierarchical_edges FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.triplet-curation', 'edit'));

DROP POLICY IF EXISTS "Science writers can update hierarchical edges" ON public.hierarchical_edges;
CREATE POLICY "Science writers can update hierarchical edges"
ON public.hierarchical_edges FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'tab.triplet-curation', 'edit'))
WITH CHECK (public.has_permission(auth.uid(), 'tab.triplet-curation', 'edit'));

-- pet_profiles
DROP POLICY IF EXISTS "Vet coordinators can insert patients" ON public.pet_profiles;
CREATE POLICY "Vet coordinators can insert patients"
ON public.pet_profiles FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.pet-management', 'edit') AND is_synthetic IS NOT TRUE);

DROP POLICY IF EXISTS "Vet coordinators can update patients" ON public.pet_profiles;
CREATE POLICY "Vet coordinators can update patients"
ON public.pet_profiles FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'tab.pet-management', 'edit'))
WITH CHECK (public.has_permission(auth.uid(), 'tab.pet-management', 'edit'));

DROP POLICY IF EXISTS "Vet coordinators can view patients" ON public.pet_profiles;
CREATE POLICY "Vet coordinators can view patients"
ON public.pet_profiles FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'tab.pet-management', 'view'));

-- study_audit_logs
DROP POLICY IF EXISTS "Curators can view study audit logs" ON public.study_audit_logs;
CREATE POLICY "Curators can view study audit logs"
ON public.study_audit_logs FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'tab.estudos', 'view'));

DROP POLICY IF EXISTS "Curators can insert study audit logs" ON public.study_audit_logs;
CREATE POLICY "Curators can insert study audit logs"
ON public.study_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'tab.estudos', 'edit'));

-- No parallel authorization paths survive: drop the 2026-09-02 helpers
DROP FUNCTION IF EXISTS public.can_write_science();
DROP FUNCTION IF EXISTS public.can_curate();
DROP FUNCTION IF EXISTS public.is_scientist();
DROP FUNCTION IF EXISTS public.is_vet_coordinator();
DROP FUNCTION IF EXISTS public.has_role(uuid, text);