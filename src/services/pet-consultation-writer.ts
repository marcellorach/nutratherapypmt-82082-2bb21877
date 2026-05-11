import { supabase } from '@/integrations/supabase/client';

export interface ConsultationConditionInput {
  condition_name: string;
  severity?: string;
  status?: string;
  origin?: string;
  notes?: string;
}

export interface ConsultationMedicationInput {
  medication_name: string;
  dosage?: string;
  frequency?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface ConsultationExamInput {
  exam_type: string;
  results?: Record<string, any>;
  flags_abnormal?: string[];
  notes?: string;
}

export interface ConsultationNoteInput {
  note_type: string;
  content: string;
}

export interface ConsultationBundle {
  /** ISO date YYYY-MM-DD */
  consultation_date: string;
  chief_complaint?: string;
  clinical_exam?: string;
  weight_kg_at_visit?: number;
  body_condition_score?: number;
  assessment?: string;
  plan?: string;
  conditions?: ConsultationConditionInput[];
  medications?: ConsultationMedicationInput[];
  exams?: ConsultationExamInput[];
  notes?: ConsultationNoteInput[];
}

/**
 * Inserts a single consultation and fans out its conditions / medications /
 * exams / clinical notes with the resulting `consultation_id`.
 * The DB trigger `refresh_pet_consultation_latest` will mark the most
 * recent consultation as `is_latest=true` automatically.
 */
export async function writeConsultationBundle(
  petId: string,
  bundle: ConsultationBundle,
  userId?: string | null,
): Promise<{ consultation_id: string }> {
  const { data: consult, error } = await (supabase as any)
    .from('pet_consultations')
    .insert({
      pet_id: petId,
      consultation_date: bundle.consultation_date,
      veterinarian_id: userId ?? null,
      chief_complaint: bundle.chief_complaint ?? null,
      clinical_exam: bundle.clinical_exam ?? null,
      weight_kg_at_visit: bundle.weight_kg_at_visit ?? null,
      body_condition_score: bundle.body_condition_score ?? null,
      assessment: bundle.assessment ?? null,
      plan: bundle.plan ?? null,
      created_by: userId ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const consultationId = consult.id as string;

  if (bundle.conditions?.length) {
    const { error: condErr } = await (supabase as any)
      .from('pet_conditions')
      .insert(bundle.conditions.map((c) => ({
        pet_id: petId,
        consultation_id: consultationId,
        condition_name: c.condition_name,
        severity: c.severity ?? 'mild',
        status: c.status ?? 'active',
        origin: c.origin ?? 'vet_diagnosis',
        notes: c.notes ?? null,
      })));
    if (condErr) throw condErr;
  }

  if (bundle.medications?.length) {
    const { error: medErr } = await (supabase as any)
      .from('pet_medications')
      .insert(bundle.medications.map((m) => ({
        pet_id: petId,
        consultation_id: consultationId,
        medication_name: m.medication_name,
        dosage: m.dosage ?? null,
        frequency: m.frequency ?? null,
        status: m.status ?? 'active',
        start_date: m.start_date ?? null,
        end_date: m.end_date ?? null,
      })));
    if (medErr) throw medErr;
  }

  if (bundle.exams?.length) {
    const { error: examErr } = await (supabase as any)
      .from('pet_exams')
      .insert(bundle.exams.map((e) => ({
        pet_id: petId,
        consultation_id: consultationId,
        exam_type: e.exam_type,
        results: e.results ?? {},
        exam_date: bundle.consultation_date,
        extraction_status: 'done',
        raw_extracted: e.results ?? {},
        flags_abnormal: e.flags_abnormal ?? null,
        clinical_comments: e.notes ?? null,
        approved: true,
      })));
    if (examErr) throw examErr;
  }

  if (bundle.notes?.length) {
    const { error: noteErr } = await (supabase as any)
      .from('pet_clinical_notes')
      .insert(bundle.notes.map((n) => ({
        pet_id: petId,
        consultation_id: consultationId,
        note_type: n.note_type,
        content: n.content,
        created_by: userId ?? null,
      })));
    if (noteErr) throw noteErr;
  }

  return { consultation_id: consultationId };
}

/**
 * Bulk-write multiple consultations in chronological order
 * (oldest first → newest last) so the trigger marks the latest correctly.
 */
export async function writeConsultationsChronological(
  petId: string,
  bundles: ConsultationBundle[],
  userId?: string | null,
): Promise<string[]> {
  const sorted = [...bundles].sort((a, b) =>
    a.consultation_date.localeCompare(b.consultation_date),
  );
  const ids: string[] = [];
  for (const b of sorted) {
    const { consultation_id } = await writeConsultationBundle(petId, b, userId);
    ids.push(consultation_id);
  }
  return ids;
}