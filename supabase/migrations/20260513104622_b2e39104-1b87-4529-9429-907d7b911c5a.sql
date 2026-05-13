
-- 1. Remove public SELECT policies
DROP POLICY IF EXISTS "Anyone can view pet_profiles" ON public.pet_profiles;
DROP POLICY IF EXISTS "Anyone can view recommendation_logs" ON public.recommendation_logs;
DROP POLICY IF EXISTS "Anyone can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view study_chat_history" ON public.study_chat_history;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view ai_configurations" ON public.ai_configurations;
DROP POLICY IF EXISTS "Anyone can view treatment_proposals" ON public.treatment_proposals;

-- 2. pet_clinical_analysis_snapshots: restrict SELECT and UPDATE
DROP POLICY IF EXISTS "Authenticated users can view analysis snapshots" ON public.pet_clinical_analysis_snapshots;
DROP POLICY IF EXISTS "Authenticated users can update analysis snapshots" ON public.pet_clinical_analysis_snapshots;
DROP POLICY IF EXISTS "Authenticated users can insert analysis snapshots" ON public.pet_clinical_analysis_snapshots;

CREATE POLICY "View own pet analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR SELECT
  USING (
    is_admin() OR created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_clinical_analysis_snapshots.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

CREATE POLICY "Insert own pet analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM public.pet_profiles pp
        WHERE pp.id = pet_clinical_analysis_snapshots.pet_id
          AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Update own pet analysis snapshots"
  ON public.pet_clinical_analysis_snapshots FOR UPDATE
  USING (
    is_admin() OR created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_clinical_analysis_snapshots.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

-- 3. pet_trajectory_projections: restrict SELECT and UPDATE
DROP POLICY IF EXISTS "Authenticated users can view trajectory projections" ON public.pet_trajectory_projections;
DROP POLICY IF EXISTS "Authenticated users can update trajectory projections" ON public.pet_trajectory_projections;
DROP POLICY IF EXISTS "Authenticated users can insert trajectory projections" ON public.pet_trajectory_projections;

CREATE POLICY "View own pet trajectory projections"
  ON public.pet_trajectory_projections FOR SELECT
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_trajectory_projections.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

CREATE POLICY "Insert own pet trajectory projections"
  ON public.pet_trajectory_projections FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM public.pet_profiles pp
        WHERE pp.id = pet_trajectory_projections.pet_id
          AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Update own pet trajectory projections"
  ON public.pet_trajectory_projections FOR UPDATE
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_trajectory_projections.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

-- 4. dosage_lookup_log: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can read dosage log" ON public.dosage_lookup_log;
CREATE POLICY "Users read own dosage log"
  ON public.dosage_lookup_log FOR SELECT
  USING (is_admin() OR user_id = auth.uid());

-- 5. Tighten INSERT on per-pet tables
DROP POLICY IF EXISTS "Authenticated users can insert pet conditions" ON public.pet_conditions;
CREATE POLICY "Insert pet conditions for own patients"
  ON public.pet_conditions FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_conditions.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert pet medications" ON public.pet_medications;
CREATE POLICY "Insert pet medications for own patients"
  ON public.pet_medications FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_medications.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert pet exams" ON public.pet_exams;
CREATE POLICY "Insert pet exams for own patients"
  ON public.pet_exams FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_exams.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert pet clinical notes" ON public.pet_clinical_notes;
CREATE POLICY "Insert pet clinical notes for own patients"
  ON public.pet_clinical_notes FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = pet_clinical_notes.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

-- 6. treatment_proposals: tighten INSERT and UPDATE to vet/admin
DROP POLICY IF EXISTS "Authenticated users can insert treatment_proposals" ON public.treatment_proposals;
DROP POLICY IF EXISTS "Authenticated users can update treatment_proposals" ON public.treatment_proposals;

CREATE POLICY "View treatment proposals for own patients"
  ON public.treatment_proposals FOR SELECT
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = treatment_proposals.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

CREATE POLICY "Insert treatment proposals for own patients"
  ON public.treatment_proposals FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = treatment_proposals.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

CREATE POLICY "Update treatment proposals for own patients"
  ON public.treatment_proposals FOR UPDATE
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.pet_profiles pp
      WHERE pp.id = treatment_proposals.pet_id
        AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid())
    )
  );

-- 7. Storage: add UPDATE policy on study_pdfs for admins
CREATE POLICY "Admins can update study PDFs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'study_pdfs' AND public.is_admin())
  WITH CHECK (bucket_id = 'study_pdfs' AND public.is_admin());

-- 8. Stop broadcasting access_requests via realtime (sensitive PII)
ALTER PUBLICATION supabase_realtime DROP TABLE public.access_requests;
