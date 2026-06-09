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
    truncationRatio < 0.30 &&
    (parseSectionsCount ?? 0) >= 3
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