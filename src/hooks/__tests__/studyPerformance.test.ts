import { describe, it, expect } from "vitest";
import { buildStudyPerformance } from "../studyPerformance.pure";
import { itemKey, UNRECORDED_MODEL } from "../extractionItemReviews.pure";

describe("buildStudyPerformance", () => {
  it("conta itens, vereditos, triplas e falha por estudo", () => {
    const rows = buildStudyPerformance(
      [{ id: "s1", title: "A", ingestion_stages: null, error_message: "402" }],
      [{ study_id: "s1", extracted_data: { conditions: [{ name: "Obesity" }], dosages: [] } }],
      [{ study_id: "s1", item_type: "condition", item_key: itemKey("Obesity", 0), verdict: "correct" }],
      [{ study_id: "s1", curation_status: "approved" }, { study_id: "s1", curation_status: "pending" }],
    );
    expect(rows[0].model).toBe(UNRECORDED_MODEL);
    expect(rows[0].condition).toEqual({ extracted: 1, correct: 1, incorrect: 0, pending: 0 });
    expect(rows[0].triplets).toEqual({ approved: 1, rejected: 0, pending: 1 });
    expect(rows[0].error).toBe("402");
  });
});
