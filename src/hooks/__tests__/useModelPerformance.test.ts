import { describe, it, expect } from "vitest";
import { buildModelPerformance, successRate, approvalRate } from "../useModelPerformance.pure";

describe("buildModelPerformance", () => {
  it("conta acertos e erros por tarefa × modelo", () => {
    const r = buildModelPerformance(
      [
        { task_id: "extraction_stage1", model_id: "a", ok: true, created_at: "2026-09-01T00:00:00Z" },
        { task_id: "extraction_stage1", model_id: "a", ok: false, created_at: "2026-09-01T01:00:00Z" },
        { task_id: "extraction_stage1", model_id: "b", ok: true, created_at: "2026-09-01T02:00:00Z" },
      ], [], [],
    );
    const a = r.rows.find((x) => x.model === "a")!;
    expect([a.ok, a.errors]).toEqual([1, 1]);
    expect(successRate(a)).toBe(50);
  });

  it("lê leitura de PDF e vetorização dos estágios do estudo", () => {
    const r = buildModelPerformance([], [
      { ingestion_stages: { file_search: { status: "ok", model_call1: "g31" }, vectorize: { status: "ok", model: "emb" } } },
      { ingestion_stages: { file_search: { status: "failed", model_call1: "g31" } } },
    ], []);
    const pdf = r.rows.find((x) => x.task === "pdf_reading")!;
    expect([pdf.ok, pdf.errors]).toEqual([1, 1]);
    expect(r.rows.find((x) => x.task === "vectorization")!.ok).toBe(1);
  });

  it("atribui triplets à chamada de extração mais recente dentro de 2 h", () => {
    const r = buildModelPerformance(
      [{ task_id: "extraction_stage3", model_id: "m", ok: true, created_at: "2026-09-01T10:00:00Z" }],
      [],
      [
        { created_at: "2026-09-01T10:05:00Z", curation_status: "approved" },
        { created_at: "2026-09-01T10:06:00Z", curation_status: "rejected" },
        { created_at: "2026-09-01T13:00:00Z", curation_status: "approved" }, // fora da janela
        { created_at: "2026-09-01T09:00:00Z", curation_status: "pending" },  // antes de qualquer chamada
      ],
    );
    const m = r.rows.find((x) => x.model === "m")!;
    expect(m.curation).toEqual({ approved: 1, rejected: 1, pending: 0 });
    expect(approvalRate(m.curation)).toBe(50);
    expect(r.unattributedTriplets).toEqual({ approved: 1, rejected: 0, pending: 1 });
  });

  it("taxas nulas sem dados", () => {
    expect(successRate({ ok: 0, errors: 0 })).toBeNull();
    expect(approvalRate({ approved: 0, rejected: 0, pending: 3 })).toBeNull();
  });
});
