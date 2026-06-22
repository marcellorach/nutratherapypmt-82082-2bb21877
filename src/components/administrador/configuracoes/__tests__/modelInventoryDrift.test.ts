import { describe, it, expect } from "vitest";
import { enrichItemsWithDrift, countDrift } from "../modelInventoryDrift";

/**
 * Regression test: a contagem de itens com `drift` precisa ser idêntica para
 * qualquer formato exportado (CSV, JSON, PDF). Os três compartilham a mesma
 * função de enriquecimento (`enrichItemsWithDrift`) — se alguém divergir um
 * dos formatos no futuro, este teste pega antes do build.
 */
describe("model-inventory drift parity", () => {
  const raw = [
    { task_id: "a", real_model: "google/gemini-3.5-flash" },
    { task_id: "b", real_model: "openai/gpt-5.4" },
    { task_id: "c", real_model: "google/gemini-2.5-pro" },
    { task_id: "d", real_model: "google/gemini-2.5-pro" }, // sem stored
  ];
  const stored = new Map<string, string>([
    ["a", "google/gemini-2.5-pro"],   // drift
    ["b", "openai/gpt-5.4"],          // ok
    ["c", "openai/gpt-5"],            // drift
  ]);

  const enriched = enrichItemsWithDrift(raw, stored);

  // simula o que cada exportador consome
  const csvRows = enriched.map((i) => ({ ...i }));
  const jsonItems = enriched.map((i) => ({ ...i }));
  const pdfRows = enriched.map((i) => ({ task_id: i.task_id, drift: i.drift }));

  it("conta o mesmo número de drift em CSV, JSON e PDF", () => {
    const csvDrift = countDrift(csvRows);
    const jsonDrift = countDrift(jsonItems);
    const pdfDrift = countDrift(pdfRows);
    expect(csvDrift).toBe(2);
    expect(jsonDrift).toBe(csvDrift);
    expect(pdfDrift).toBe(csvDrift);
  });

  it("preserva drift_note só quando drift=true", () => {
    const drifted = enriched.filter((i) => i.drift);
    expect(drifted.every((i) => i.drift_note.length > 0)).toBe(true);
    const ok = enriched.filter((i) => !i.drift);
    expect(ok.every((i) => i.drift_note === "")).toBe(true);
  });

  it("não marca drift quando não existe valor armazenado", () => {
    const d = enriched.find((i) => i.task_id === "d")!;
    expect(d.drift).toBe(false);
    expect(d.stored_real_model).toBeNull();
  });
});