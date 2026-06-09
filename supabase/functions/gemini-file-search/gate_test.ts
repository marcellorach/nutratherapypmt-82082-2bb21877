// Deno tests for the qualitative ingestion gate.
// Run via `supabase test edge-functions` ou `deno test supabase/functions/gemini-file-search/gate_test.ts`.

import {
  assertEquals,
  assertAlmostEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  computeTruncationRatio,
  decideFileSearchGate,
} from "./gate.ts";

const nonEmptyEntities = {
  nutraceuticals: [{ name: "curcumin" }],
  conditions: [],
  mechanisms: [],
  biological_effects: [],
};

const emptyEntities = {
  nutraceuticals: [],
  conditions: [],
  mechanisms: [],
  biological_effects: [],
};

// ---------- computeTruncationRatio ----------

Deno.test("computeTruncationRatio: returns null when parseTotalChars is missing", () => {
  assertEquals(computeTruncationRatio(1000, null), null);
  assertEquals(computeTruncationRatio(1000, 0), null);
});

Deno.test("computeTruncationRatio: rounds to 4 decimals", () => {
  const r = computeTruncationRatio(333, 1000);
  assertEquals(r, 0.333);
});

Deno.test("computeTruncationRatio: ratio > 1 allowed (full_text > parse total)", () => {
  const r = computeTruncationRatio(1200, 1000);
  assertAlmostEquals(r ?? 0, 1.2, 0.0001);
});

// ---------- failed ----------

Deno.test("gate: failed when fullTextLength is 0", () => {
  const d = decideFileSearchGate({
    fullTextLength: 0,
    entities: nonEmptyEntities,
    parseTotalChars: 10000,
    parseSectionsCount: 5,
  });
  assertEquals(d.status, "failed");
  assertEquals(d.reason, "empty_full_text");
});

// ---------- degraded: entities_empty ----------

Deno.test("gate: degraded entities_empty when all 4 key categories are empty", () => {
  const d = decideFileSearchGate({
    fullTextLength: 50000,
    entities: emptyEntities,
    parseTotalChars: 50000,
    parseSectionsCount: 5,
  });
  assertEquals(d.status, "degraded");
  assertEquals(d.reason, "entities_empty");
});

Deno.test("gate: entities_empty takes precedence over truncation", () => {
  // Would also trip truncation, but entities_empty fires first.
  const d = decideFileSearchGate({
    fullTextLength: 100,
    entities: emptyEntities,
    parseTotalChars: 100000,
    parseSectionsCount: 10,
  });
  assertEquals(d.reason, "entities_empty");
});

Deno.test("gate: one populated category is enough to pass entities check", () => {
  const d = decideFileSearchGate({
    fullTextLength: 50000,
    entities: { ...emptyEntities, mechanisms: [{ id: 1 }] },
    parseTotalChars: 50000,
    parseSectionsCount: 5,
  });
  assertEquals(d.status, "ok");
});

// ---------- degraded: truncation_suspected ----------

Deno.test("gate: degraded truncation_suspected when ratio < 0.30 AND sections >= 3", () => {
  const d = decideFileSearchGate({
    fullTextLength: 1000,
    entities: nonEmptyEntities,
    parseTotalChars: 10000, // ratio = 0.10
    parseSectionsCount: 5,
  });
  assertEquals(d.status, "degraded");
  assertEquals(d.reason, "truncation_suspected");
  assertEquals(d.truncationRatio, 0.1);
});

Deno.test("gate: boundary ratio exactly 0.30 is OK (strict less-than)", () => {
  const d = decideFileSearchGate({
    fullTextLength: 3000,
    entities: nonEmptyEntities,
    parseTotalChars: 10000, // ratio = 0.30
    parseSectionsCount: 5,
  });
  assertEquals(d.status, "ok");
});

Deno.test("gate: ratio just below 0.30 trips truncation", () => {
  const d = decideFileSearchGate({
    fullTextLength: 2999,
    entities: nonEmptyEntities,
    parseTotalChars: 10000, // ratio = 0.2999
    parseSectionsCount: 3,
  });
  assertEquals(d.status, "degraded");
  assertEquals(d.reason, "truncation_suspected");
});

Deno.test("gate: sections_count == 3 is the boundary (>= 3 trips)", () => {
  const tripped = decideFileSearchGate({
    fullTextLength: 100,
    entities: nonEmptyEntities,
    parseTotalChars: 10000,
    parseSectionsCount: 3,
  });
  assertEquals(tripped.status, "degraded");

  const safe = decideFileSearchGate({
    fullTextLength: 100,
    entities: nonEmptyEntities,
    parseTotalChars: 10000,
    parseSectionsCount: 2,
  });
  // Sections < 3 — short text is treated as legitimate (position paper).
  assertEquals(safe.status, "ok");
});

Deno.test("gate: short position-paper passes (low chars, but parse also short → high ratio)", () => {
  // 562 chars full_text vs 600 chars in parse-study → ratio ~0.94, sections=2.
  const d = decideFileSearchGate({
    fullTextLength: 562,
    entities: nonEmptyEntities,
    parseTotalChars: 600,
    parseSectionsCount: 2,
  });
  assertEquals(d.status, "ok");
  assertEquals((d.truncationRatio ?? 0) > 0.9, true);
});

Deno.test("gate: NO absolute char-floor — 200-char full_text passes when parse is also tiny", () => {
  const d = decideFileSearchGate({
    fullTextLength: 200,
    entities: nonEmptyEntities,
    parseTotalChars: 220,
    parseSectionsCount: 10, // even with many sections, ratio is ~0.91
  });
  assertEquals(d.status, "ok");
});

Deno.test("gate: missing parse_study (null) does NOT trip truncation", () => {
  const d = decideFileSearchGate({
    fullTextLength: 100,
    entities: nonEmptyEntities,
    parseTotalChars: null,
    parseSectionsCount: null,
  });
  assertEquals(d.status, "ok");
  assertEquals(d.truncationRatio, null);
});

Deno.test("gate: low ratio but sections < 3 stays OK (not enough structural evidence)", () => {
  const d = decideFileSearchGate({
    fullTextLength: 500,
    entities: nonEmptyEntities,
    parseTotalChars: 100000, // ratio 0.005
    parseSectionsCount: 1,
  });
  assertEquals(d.status, "ok");
});

// ---------- ok ----------

Deno.test("gate: ok when full_text present, entities present, ratio healthy", () => {
  const d = decideFileSearchGate({
    fullTextLength: 45000,
    entities: {
      nutraceuticals: [{}, {}],
      conditions: [{}],
      mechanisms: [{}],
      biological_effects: [{}],
    },
    parseTotalChars: 50000,
    parseSectionsCount: 8,
  });
  assertEquals(d.status, "ok");
  assertEquals(d.reason, undefined);
  assertEquals(d.entitiesNonEmpty, true);
});

Deno.test("gate: undefined entity arrays are treated as empty", () => {
  const d = decideFileSearchGate({
    fullTextLength: 10000,
    entities: {},
    parseTotalChars: 10000,
    parseSectionsCount: 5,
  });
  assertEquals(d.status, "degraded");
  assertEquals(d.reason, "entities_empty");
});