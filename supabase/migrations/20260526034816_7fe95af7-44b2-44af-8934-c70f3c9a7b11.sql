
-- Fix pet_profiles: enforce created_by = auth.uid() on insert (synthetic admin insert kept)
DROP POLICY IF EXISTS "Authenticated users can insert pet profiles" ON public.pet_profiles;
CREATE POLICY "Users can insert their own pet profiles"
ON public.pet_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND (is_synthetic IS NOT TRUE)
);

-- Fix prioritization_history: restrict to authenticated admins
DROP POLICY IF EXISTS "Anyone can insert prioritization history" ON public.prioritization_history;
DROP POLICY IF EXISTS "Anyone can view prioritization history" ON public.prioritization_history;
CREATE POLICY "Admins can insert prioritization history"
ON public.prioritization_history
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
CREATE POLICY "Admins can view prioritization history"
ON public.prioritization_history
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Fix dosage_lookup_log: require user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated can insert dosage log" ON public.dosage_lookup_log;
CREATE POLICY "Users insert own dosage log"
ON public.dosage_lookup_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix pet_consultations: require pet ownership
DROP POLICY IF EXISTS "Authenticated can insert pet consultations" ON public.pet_consultations;
CREATE POLICY "Vet/owner/admin can insert pet consultations"
ON public.pet_consultations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pet_profiles pp
    WHERE pp.id = pet_consultations.pet_id
      AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
  )
);

-- Fix pet_nutrition: require pet ownership
DROP POLICY IF EXISTS "Authenticated can insert pet nutrition" ON public.pet_nutrition;
CREATE POLICY "Vet/owner/admin can insert pet nutrition"
ON public.pet_nutrition
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pet_profiles pp
    WHERE pp.id = pet_nutrition.pet_id
      AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
  )
);

-- Fix pet_nutrition_items: require ownership via join
DROP POLICY IF EXISTS "Authenticated can insert nutrition items" ON public.pet_nutrition_items;
CREATE POLICY "Vet/owner/admin can insert nutrition items"
ON public.pet_nutrition_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pet_nutrition pn
    JOIN public.pet_profiles pp ON pp.id = pn.pet_id
    WHERE pn.id = pet_nutrition_items.nutrition_id
      AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
  )
);

-- Fix recommendation_logs: require pet ownership
DROP POLICY IF EXISTS "Authenticated users can insert recommendation logs" ON public.recommendation_logs;
CREATE POLICY "Vet/owner/admin can insert recommendation logs"
ON public.recommendation_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pet_profiles pp
    WHERE pp.id = recommendation_logs.pet_id
      AND (pp.veterinarian_id = auth.uid() OR pp.created_by = auth.uid() OR public.is_admin())
  )
);

-- core_rule_audit_log: add explicit deny-by-default SELECT policy (admin-only via existing ALL)
-- The existing admin ALL policy already covers SELECT for admins. Add an explicit restrictive comment by
-- ensuring no permissive SELECT exists for non-admins (already the case). No-op safety: re-assert admin SELECT.
DROP POLICY IF EXISTS "Admins can view core rule audit log" ON public.core_rule_audit_log;
CREATE POLICY "Admins can view core rule audit log"
ON public.core_rule_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin());
