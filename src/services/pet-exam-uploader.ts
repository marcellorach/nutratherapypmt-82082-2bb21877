import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a single exam PDF for a pet, registers a `pet_exams` row in
 * `pending` state and triggers the `parse-pet-exam-pdf` edge function.
 * Returns the inserted exam id.
 */
export async function uploadPetExamPdf(
  petId: string,
  file: File,
  consultationId?: string | null,
): Promise<string | null> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${petId}/${Date.now()}_${safe}`;
  const { error: upErr } = await supabase.storage
    .from('pet_exams_pdfs')
    .upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (upErr) {
    console.error('Exam PDF upload failed', upErr);
    return null;
  }

  const { data: ins, error: insErr } = await supabase
    .from('pet_exams')
    .insert({
      pet_id: petId,
      exam_type: 'Aguardando extração',
      file_url: path,
      extraction_status: 'pending',
      consultation_id: consultationId ?? null,
    })
    .select('id')
    .single();
  if (insErr || !ins) {
    console.error('Exam row insert failed', insErr);
    return null;
  }

  const { error: fnErr } = await supabase.functions.invoke('parse-pet-exam-pdf', {
    body: { exam_id: ins.id, file_url: path },
  });
  if (fnErr) console.error('parse-pet-exam-pdf invoke failed', fnErr);
  return ins.id;
}

export async function uploadPetExamPdfs(
  petId: string,
  files: File[],
  consultationId?: string | null,
  concurrency = 3,
): Promise<Array<string | null>> {
  const results: Array<string | null> = [];
  for (let i = 0; i < files.length; i += concurrency) {
    const slice = files.slice(i, i + concurrency);
    const ids = await Promise.all(
      slice.map((f) => uploadPetExamPdf(petId, f, consultationId)),
    );
    results.push(...ids);
  }
  return results;
}