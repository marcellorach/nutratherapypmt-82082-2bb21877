/** Núcleo PURO: desempenho por estudo (condições, doses, triplas, falha). */
import { listExtractedItems, stage1Model, type ItemCounts, type ReviewRow } from "./extractionItemReviews.pure";

export interface TripletCounts { approved: number; rejected: number; pending: number }
export interface StudyPerfRow {
  studyId: string;
  title: string;
  model: string;
  condition: ItemCounts;
  dose: ItemCounts;
  triplets: TripletCounts;
  error: string | null;
}
export interface StudyInput { id: string; title: string | null; ingestion_stages: Record<string, any> | null; error_message: string | null }

const empty = (): ItemCounts => ({ extracted: 0, correct: 0, incorrect: 0, pending: 0 });

export function buildStudyPerformance(
  studies: StudyInput[],
  extractions: { study_id: string; extracted_data: Record<string, any> | null }[],
  reviews: ReviewRow[],
  triplets: { study_id: string | null; curation_status: string | null }[],
): StudyPerfRow[] {
  const verdicts = new Map<string, string>();
  for (const r of reviews) verdicts.set(`${r.study_id}|${r.item_type}|${r.item_key}`, r.verdict);
  const ext = new Map(extractions.map((e) => [e.study_id, e.extracted_data]));
  const trip = new Map<string, TripletCounts>();
  for (const t of triplets) {
    if (!t.study_id) continue;
    const c = trip.get(t.study_id) ?? { approved: 0, rejected: 0, pending: 0 };
    if (t.curation_status === "approved") c.approved++;
    else if (t.curation_status === "rejected") c.rejected++;
    else c.pending++;
    trip.set(t.study_id, c);
  }
  return studies.map((s) => {
    const row: StudyPerfRow = {
      studyId: s.id,
      title: s.title ?? s.id,
      model: stage1Model(s.ingestion_stages),
      condition: empty(),
      dose: empty(),
      triplets: trip.get(s.id) ?? { approved: 0, rejected: 0, pending: 0 },
      error: s.error_message || null,
    };
    for (const it of listExtractedItems(ext.get(s.id) ?? null)) {
      const c = row[it.type];
      c.extracted++;
      const v = verdicts.get(`${s.id}|${it.type}|${it.key}`);
      if (v === "correct") c.correct++; else if (v === "incorrect") c.incorrect++; else c.pending++;
    }
    return row;
  }).sort((a, b) => a.model.localeCompare(b.model) || a.title.localeCompare(b.title));
}
