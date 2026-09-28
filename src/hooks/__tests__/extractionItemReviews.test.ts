import { describe, it, expect } from "vitest";
import { buildItemPerformance, itemAccuracy, itemKey, listExtractedItems, stage1Model, UNRECORDED_MODEL } from "../extractionItemReviews.pure";

const ex = { conditions: [{ name: "Obesity" }, { name: " Sarcopenia " }], dosages: [{ compound: "NMN", dose_string: "250 mg" }] };

describe("extraction item reviews", () => {
  it("keys are stable and normalized", () => {
    expect(itemKey(" Sarcopenia ", 1)).toBe("sarcopenia#1");
    const items = listExtractedItems(ex);
    expect(items.map((i) => i.type)).toEqual(["condition", "condition", "dose"]);
    expect(items[2].label).toBe("NMN — 250 mg");
  });

  it("reads stage1 model or marks unrecorded", () => {
    expect(stage1Model({ extract_entities: { stage1: { model: "google/x" } } })).toBe("google/x");
    expect(stage1Model(null)).toBe(UNRECORDED_MODEL);
  });

  it("counts verdicts per model and item type", () => {
    const rows = buildItemPerformance(
      [
        { study_id: "a", ingestion_stages: { extract_entities: { stage1: { model: "m1" } } }, extracted_data: ex },
        { study_id: "b", ingestion_stages: null, extracted_data: ex },
      ],
      [
        { study_id: "a", item_type: "condition", item_key: "obesity#0", verdict: "correct" },
        { study_id: "a", item_type: "condition", item_key: "sarcopenia#1", verdict: "incorrect" },
        { study_id: "a", item_type: "dose", item_key: listExtractedItems(ex)[2].key, verdict: "correct" },
      ],
    );
    expect(rows[0].model).toBe("m1");
    expect(rows[0].condition).toEqual({ extracted: 2, correct: 1, incorrect: 1, pending: 0 });
    expect(rows[0].dose.correct).toBe(1);
    expect(rows[1].model).toBe(UNRECORDED_MODEL);
    expect(rows[1].condition.pending).toBe(2);
    expect(itemAccuracy(rows[0].condition)).toBe(50);
    expect(itemAccuracy(rows[1].condition)).toBeNull();
  });
});
