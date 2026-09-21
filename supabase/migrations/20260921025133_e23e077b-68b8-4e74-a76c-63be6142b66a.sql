-- Additive SELECT policies gated by tab.pet-management:view
CREATE POLICY "Pet management viewers can read pet exams" ON public.pet_exams FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet conditions" ON public.pet_conditions FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet consultations" ON public.pet_consultations FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet medications" ON public.pet_medications FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet clinical notes" ON public.pet_clinical_notes FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet nutrition" ON public.pet_nutrition FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet nutrition items" ON public.pet_nutrition_items FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet analysis snapshots" ON public.pet_clinical_analysis_snapshots FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet trajectory projections" ON public.pet_trajectory_projections FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read treatment proposals" ON public.treatment_proposals FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read recommendation logs" ON public.recommendation_logs FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read dosage lookup log" ON public.dosage_lookup_log FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'tab.pet-management', 'view'));

-- Storage read access for pet media
CREATE POLICY "Pet management viewers can read pet photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pet-photos' AND has_permission(auth.uid(), 'tab.pet-management', 'view'));
CREATE POLICY "Pet management viewers can read pet exam pdfs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pet_exams_pdfs' AND has_permission(auth.uid(), 'tab.pet-management', 'view'));