/**
 * Contrato A — "Placeholder nunca vira dado".
 *
 * Funções PURAS (sem Deno, sem supabase) usadas por extract-study-entities
 * e pelos testes vitest:
 *  - buildStage1UserPrompt: garante que o documento chegue ao modelo mesmo
 *    quando o prompt salvo não tem o marcador {{TEXT_CONTENT}}.
 *  - filterEntitiesInText: descarta entidades do Stage 1 cujo nome não
 *    aparece no texto do artigo (guarda anti-placeholder determinística).
 *  - compareWriters: verificador de consistência entre a leitura do PDF e o
 *    Stage 1, por nome normalizado. Sem LLM.
 */

export const TEXT_PLACEHOLDER = '{{TEXT_CONTENT}}';

export function normalizeEntityName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function buildStage1UserPrompt(
  template: string,
  text: string,
): { prompt: string; placeholderMissing: boolean } {
  if (template.includes(TEXT_PLACEHOLDER)) {
    return { prompt: template.replace(TEXT_PLACEHOLDER, text), placeholderMissing: false };
  }
  return {
    prompt: `${template}\n\nDocument to analyze:\n${text}`,
    placeholderMissing: true,
  };
}

/** Nome aparece no texto? Compara formas normalizadas (acentos/pontuação ignorados). */
export function nameAppearsInText(name: unknown, normalizedText: string): boolean {
  const n = normalizeEntityName(name);
  if (n.length < 2) return false;
  return (` ${normalizedText} `).includes(` ${n} `);
}

export function filterEntitiesInText<T extends { name?: unknown }>(
  entities: T[] | undefined | null,
  text: string,
): { kept: T[]; dropped: string[] } {
  const normText = normalizeEntityName(text);
  const kept: T[] = [];
  const dropped: string[] = [];
  for (const e of entities || []) {
    if (e && nameAppearsInText(e.name, normText)) kept.push(e);
    else dropped.push(String(e?.name ?? ''));
  }
  return { kept, dropped };
}

function namesOf(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    const name = typeof item === 'string' ? item : (item as any)?.name;
    if (typeof name === 'string' && name.trim()) out.push(name.trim());
  }
  return out;
}

function overlaps(a: string[], b: string[]): boolean {
  const na = a.map(normalizeEntityName).filter(Boolean);
  const nb = b.map(normalizeEntityName).filter(Boolean);
  return na.some((x) => nb.some((y) => x === y || x.includes(y) || y.includes(x)));
}

export type ConsistencyStatus = 'ok' | 'conflict' | 'insufficient';

export interface WriterConsistency {
  status: ConsistencyStatus;
  conditions: { status: ConsistencyStatus; pdf: string[]; stage1: string[] };
  nutraceuticals: { status: ConsistencyStatus; pdf: string[]; stage1: string[] };
  pdf: string[];
  stage1: string[];
  checked_at: string;
}

function compareSets(pdf: string[], stage1: string[]): ConsistencyStatus {
  if (pdf.length === 0 || stage1.length === 0) return 'insufficient';
  return overlaps(pdf, stage1) ? 'ok' : 'conflict';
}

export function compareWriters(input: {
  pdfConditions: unknown;
  pdfNutraceuticals: unknown;
  stage1Conditions: unknown;
  stage1Nutraceuticals: unknown;
  now?: string;
}): WriterConsistency {
  const pc = namesOf(input.pdfConditions);
  const pn = namesOf(input.pdfNutraceuticals);
  const sc = namesOf(input.stage1Conditions);
  const sn = namesOf(input.stage1Nutraceuticals);
  const c = compareSets(pc, sc);
  const n = compareSets(pn, sn);
  const status: ConsistencyStatus =
    c === 'conflict' || n === 'conflict' ? 'conflict'
      : c === 'ok' || n === 'ok' ? 'ok'
      : 'insufficient';
  return {
    status,
    conditions: { status: c, pdf: pc, stage1: sc },
    nutraceuticals: { status: n, pdf: pn, stage1: sn },
    pdf: [...pc, ...pn],
    stage1: [...sc, ...sn],
    checked_at: input.now ?? new Date().toISOString(),
  };
}
