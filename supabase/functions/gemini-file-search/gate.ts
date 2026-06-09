// Pure helpers for the qualitative ingestion gate used by gemini-file-search.
// Extracted so unit tests can validate the decision logic without spinning up
// the full edge function / Supabase client.
//
// Gate contract (mirrors plan.md, Fases 1+2):
// - failed:    full_text vazio/ausente.
// - degraded:  (a) entities_empty — todas as 4 categorias-chave vazias, OU
//              (b) truncation_suspected — truncation_ratio < 0.30 E
//                  parse_study.sections_count >= 3.
// - ok:        full_text presente E pelo menos uma categoria-chave populada.
// chars e truncation_ratio são INFORMATIVOS — nunca gatilho isolado.
// Não existe char-floor absoluto.

export type GateStatus = "ok" | "degraded" | "failed";
export type GateReason =
  | "empty_full_text"
  | "entities_empty"
  | "truncation_suspected";

// Thresholds — single source of truth so tests + telemetry stay in sync.
export const GATE_THRESHOLDS = {
  /** Strict less-than. ratio < TRUNCATION_RATIO_MIN trips truncation. */
  TRUNCATION_RATIO_MIN: 0.30,
  /** Minimum sections in parse_study required to even consider truncation. */
  MIN_SECTIONS_FOR_TRUNCATION: 3,
} as const;

export interface GateEntities {
  nutraceuticals?: unknown[] | null;
  conditions?: unknown[] | null;
  mechanisms?: unknown[] | null;
  biological_effects?: unknown[] | null;
}

export interface GateInput {
  fullTextLength: number;
  entities: GateEntities;
  parseTotalChars: number | null;
  parseSectionsCount: number | null;
}

export interface GateDecision {
  status: GateStatus;
  reason?: GateReason;
  truncationRatio: number | null;
  entitiesNonEmpty: boolean;
}

export interface GateMetrics {
  event: "file_search_gate";
  status: GateStatus;
  reason: GateReason | null;
  truncation_ratio: number | null;
  entities_non_empty: boolean;
  entities_counts: {
    nutraceuticals: number;
    conditions: number;
    mechanisms: number;
    biological_effects: number;
  };
  full_text_length: number;
  parse_total_chars: number | null;
  parse_sections_count: number | null;
  thresholds: typeof GATE_THRESHOLDS;
  /** True iff sections_count >= MIN_SECTIONS_FOR_TRUNCATION (i.e. truncation rule was eligible). */
  truncation_eligible: boolean;
  /** True iff truncation_ratio < TRUNCATION_RATIO_MIN (regardless of sections). */
  truncation_ratio_below_threshold: boolean;
}

export function computeTruncationRatio(
  fullTextLength: number,
  parseTotalChars: number | null,
): number | null {
  if (!parseTotalChars || parseTotalChars <= 0) return null;
  return Number((fullTextLength / parseTotalChars).toFixed(4));
}

export function decideFileSearchGate(input: GateInput): GateDecision {
  const { fullTextLength, entities, parseTotalChars, parseSectionsCount } = input;

  const entitiesNonEmpty =
    (entities.nutraceuticals?.length || 0) +
      (entities.conditions?.length || 0) +
      (entities.mechanisms?.length || 0) +
      (entities.biological_effects?.length || 0) >
    0;

  const truncationRatio = computeTruncationRatio(fullTextLength, parseTotalChars);

  if (!fullTextLength || fullTextLength === 0) {
    return {
      status: "failed",
      reason: "empty_full_text",
      truncationRatio,
      entitiesNonEmpty,
    };
  }

  if (!entitiesNonEmpty) {
    return {
      status: "degraded",
      reason: "entities_empty",
      truncationRatio,
      entitiesNonEmpty,
    };
  }

  if (
    truncationRatio !== null &&
    truncationRatio < GATE_THRESHOLDS.TRUNCATION_RATIO_MIN &&
    (parseSectionsCount ?? 0) >= GATE_THRESHOLDS.MIN_SECTIONS_FOR_TRUNCATION
  ) {
    return {
      status: "degraded",
      reason: "truncation_suspected",
      truncationRatio,
      entitiesNonEmpty,
    };
  }

  return { status: "ok", truncationRatio, entitiesNonEmpty };
}

/**
 * Build a structured metrics object for logs / observability.
 * Pure — no I/O, no side effects, safe to assert on in tests.
 */
export function buildGateMetrics(
  input: GateInput,
  decision: GateDecision,
): GateMetrics {
  const counts = {
    nutraceuticals: input.entities.nutraceuticals?.length || 0,
    conditions: input.entities.conditions?.length || 0,
    mechanisms: input.entities.mechanisms?.length || 0,
    biological_effects: input.entities.biological_effects?.length || 0,
  };
  return {
    event: "file_search_gate",
    status: decision.status,
    reason: decision.reason ?? null,
    truncation_ratio: decision.truncationRatio,
    entities_non_empty: decision.entitiesNonEmpty,
    entities_counts: counts,
    full_text_length: input.fullTextLength,
    parse_total_chars: input.parseTotalChars,
    parse_sections_count: input.parseSectionsCount,
    thresholds: GATE_THRESHOLDS,
    truncation_eligible:
      (input.parseSectionsCount ?? 0) >= GATE_THRESHOLDS.MIN_SECTIONS_FOR_TRUNCATION,
    truncation_ratio_below_threshold:
      decision.truncationRatio !== null &&
      decision.truncationRatio < GATE_THRESHOLDS.TRUNCATION_RATIO_MIN,
  };
}