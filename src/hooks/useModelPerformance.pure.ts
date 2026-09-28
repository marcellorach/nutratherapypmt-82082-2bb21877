/**
 * Núcleo PURO da tela "Desempenho por modelo" — sem React, sem cliente do banco.
 *
 * Fontes reais:
 *  - ai_task_invocations: cada chamada de IA roteada (ok / erro) por tarefa × modelo.
 *  - processed_studies.ingestion_stages: leitura de PDF (file_search) e
 *    vetorização (vectorize), que não passam pelo roteador.
 *  - triplet_extractions: decisão do curador (aprovado / rejeitado / pendente).
 *    O triplet não guarda o modelo; atribuímos à chamada de extração mais
 *    recente antes dele (janela de 2 h). Sem chamada na janela → "sem atribuição".
 */

export interface InvocationRow { task_id: string; model_id: string; ok: boolean; created_at: string }
export interface StudyStagesRow { ingestion_stages: Record<string, any> | null }
export interface TripletRow { created_at: string; curation_status: string | null }

export interface CurationCounts { approved: number; rejected: number; pending: number }

export interface PerfRow {
  task: string;
  model: string;
  source: "invocations" | "ingestion";
  ok: number;
  errors: number;
  curation: CurationCounts | null;
}

export interface PerfResult {
  rows: PerfRow[];
  /** tarefa → modelo da execução mais recente registrada */
  lastModelByTask: Record<string, string>;
  unattributedTriplets: CurationCounts;
}

/** Tarefas cujas chamadas geram triplets. */
export const TRIPLET_PRODUCING_TASKS = ["triplet_extraction", "extraction_stage3"] as const;
export const ATTRIBUTION_WINDOW_MS = 2 * 60 * 60 * 1000;

const emptyCur = (): CurationCounts => ({ approved: 0, rejected: 0, pending: 0 });

function bumpCuration(c: CurationCounts, status: string | null) {
  if (status === "approved") c.approved += 1;
  else if (status === "rejected") c.rejected += 1;
  else c.pending += 1;
}

export function buildModelPerformance(
  invocations: InvocationRow[],
  studies: StudyStagesRow[],
  triplets: TripletRow[],
): PerfResult {
  const map = new Map<string, PerfRow>();
  const get = (task: string, model: string, source: PerfRow["source"]) => {
    const key = `${task}::${model}`;
    let r = map.get(key);
    if (!r) { r = { task, model, source, ok: 0, errors: 0, curation: null }; map.set(key, r); }
    return r;
  };

  const lastModelByTask: Record<string, string> = {};
  const lastAt: Record<string, number> = {};
  for (const inv of invocations) {
    const t = Date.parse(inv.created_at);
    if (!(inv.task_id in lastAt) || t > lastAt[inv.task_id]) { lastAt[inv.task_id] = t; lastModelByTask[inv.task_id] = inv.model_id; }
    const r = get(inv.task_id, inv.model_id || "?", "invocations");
    if (inv.ok) r.ok += 1; else r.errors += 1;
  }

  for (const s of studies) {
    const st = s.ingestion_stages || {};
    const fs = st.file_search;
    if (fs && typeof fs === "object" && fs.status) {
      const model = fs.model_call1 || fs.model || "não registrado";
      const r = get("pdf_reading", String(model), "ingestion");
      if (fs.status === "ok") r.ok += 1; else if (fs.status === "failed" || fs.status === "error") r.errors += 1;
    }
    const vz = st.vectorize;
    if (vz && typeof vz === "object" && vz.status) {
      const r = get("vectorization", String(vz.model || "não registrado"), "ingestion");
      if (vz.status === "ok") r.ok += 1; else if (vz.status === "failed" || vz.status === "error") r.errors += 1;
    }
  }

  // Atribuição de triplets por horário.
  const producers = invocations
    .filter((i) => (TRIPLET_PRODUCING_TASKS as readonly string[]).includes(i.task_id))
    .map((i) => ({ ...i, t: Date.parse(i.created_at) }))
    .sort((a, b) => a.t - b.t);
  const unattributed = emptyCur();

  for (const tr of triplets) {
    const t = Date.parse(tr.created_at);
    let lo = 0, hi = producers.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (producers[mid].t <= t) { idx = mid; lo = mid + 1; } else hi = mid - 1;
    }
    const p = idx >= 0 ? producers[idx] : null;
    if (!p || t - p.t > ATTRIBUTION_WINDOW_MS) { bumpCuration(unattributed, tr.curation_status); continue; }
    const r = get(p.task_id, p.model_id || "?", "invocations");
    r.curation ??= emptyCur();
    bumpCuration(r.curation, tr.curation_status);
  }

  const rows = [...map.values()].sort((a, b) => a.task.localeCompare(b.task) || (b.ok + b.errors) - (a.ok + a.errors));
  return { rows, lastModelByTask, unattributedTriplets: unattributed };
}

/** Taxa de acerto de execução em %, ou null sem execuções. */
export function successRate(r: Pick<PerfRow, "ok" | "errors">): number | null {
  const n = r.ok + r.errors;
  return n ? Math.round((r.ok / n) * 1000) / 10 : null;
}

/** Aprovação entre triplets já decididos (ignora pendentes), ou null. */
export function approvalRate(c: CurationCounts | null): number | null {
  if (!c) return null;
  const n = c.approved + c.rejected;
  return n ? Math.round((c.approved / n) * 1000) / 10 : null;
}
