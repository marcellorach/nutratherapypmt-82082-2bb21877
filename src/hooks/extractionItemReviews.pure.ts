/**
 * Núcleo PURO da marcação do curador em condições e doses extraídas.
 * Chave estável por item: nome normalizado + índice na lista extraída.
 */

export type ItemType = "condition" | "dose";
export type Verdict = "correct" | "incorrect";

export interface ExtractedItem { type: ItemType; key: string; label: string }
export interface ReviewRow { study_id: string; item_type: ItemType; item_key: string; verdict: Verdict }
export interface StudyItemsRow {
  study_id: string;
  ingestion_stages: Record<string, any> | null;
  extracted_data: Record<string, any> | null;
}
export interface ItemCounts { extracted: number; correct: number; incorrect: number; pending: number }
export interface ItemPerfRow { model: string; condition: ItemCounts; dose: ItemCounts }

export const UNRECORDED_MODEL = "__unrecorded__";

const norm = (s: unknown) => String(s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

export function itemKey(name: unknown, index: number): string {
  return `${norm(name)}#${index}`;
}

export function doseLabel(d: any): string {
  const dose = d?.dose_string || [d?.amount, d?.unit].filter((x) => x != null && x !== "").join(" ");
  return [d?.compound, dose].filter(Boolean).join(" — ");
}

export function listExtractedItems(extracted: Record<string, any> | null): ExtractedItem[] {
  const out: ExtractedItem[] = [];
  const conds: any[] = Array.isArray(extracted?.conditions) ? extracted!.conditions : [];
  conds.forEach((c, i) => out.push({ type: "condition", key: itemKey(c?.name, i), label: String(c?.name ?? "") }));
  const doses: any[] = Array.isArray(extracted?.dosages) ? extracted!.dosages : [];
  doses.forEach((d, i) => out.push({ type: "dose", key: itemKey(`${d?.compound ?? ""} ${d?.dose_string ?? d?.amount ?? ""}`, i), label: doseLabel(d) }));
  return out;
}

/** Modelo do Stage 1 registrado no estudo, ou marcador de "não registrado". */
export function stage1Model(stages: Record<string, any> | null): string {
  const m = stages?.extract_entities?.stage1?.model ?? stages?.stage1?.model;
  return typeof m === "string" && m ? m : UNRECORDED_MODEL;
}

const empty = (): ItemCounts => ({ extracted: 0, correct: 0, incorrect: 0, pending: 0 });

export function buildItemPerformance(studies: StudyItemsRow[], reviews: ReviewRow[]): ItemPerfRow[] {
  const verdicts = new Map<string, Verdict>();
  for (const r of reviews) verdicts.set(`${r.study_id}|${r.item_type}|${r.item_key}`, r.verdict);
  const byModel = new Map<string, ItemPerfRow>();
  for (const s of studies) {
    const model = stage1Model(s.ingestion_stages);
    let row = byModel.get(model);
    if (!row) { row = { model, condition: empty(), dose: empty() }; byModel.set(model, row); }
    for (const it of listExtractedItems(s.extracted_data)) {
      const c = row[it.type];
      c.extracted += 1;
      const v = verdicts.get(`${s.study_id}|${it.type}|${it.key}`);
      if (v === "correct") c.correct += 1; else if (v === "incorrect") c.incorrect += 1; else c.pending += 1;
    }
  }
  return [...byModel.values()].sort((a, b) =>
    (a.model === UNRECORDED_MODEL ? 1 : 0) - (b.model === UNRECORDED_MODEL ? 1 : 0) || a.model.localeCompare(b.model));
}

/** Acerto entre itens já decididos, em %, ou null. */
export function itemAccuracy(c: ItemCounts): number | null {
  const n = c.correct + c.incorrect;
  return n ? Math.round((c.correct / n) * 1000) / 10 : null;
}
