/**
 * Contrato A — lista de condições com origem, lida de analysis_data.
 * "pdf" = leitura do PDF (analysis_data.conditions);
 * "stage1" = Stage 1 da extração (analysis_data.extractedConditions).
 * Com conflito registrado em ingestion_stages.extract_entities.consistency,
 * a lista do PDF vem primeiro. Nada é descartado.
 */
export type ConditionOrigin = 'pdf' | 'stage1';

export interface ConditionWithOrigin {
  name: string;
  origin: ConditionOrigin;
  score: number | null;
}

export interface ConditionsByOrigin {
  items: ConditionWithOrigin[];
  conflict: boolean;
}

function toScore(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function readConsistencyConflict(ingestionStages: unknown): boolean {
  const s = ingestionStages as any;
  return s?.extract_entities?.consistency?.status === 'conflict';
}

export function buildConditionsByOrigin(analysisData: unknown, ingestionStages: unknown): ConditionsByOrigin {
  const ad = (analysisData || {}) as Record<string, any>;
  const pdf: ConditionWithOrigin[] = (Array.isArray(ad.conditions) ? ad.conditions : [])
    .filter((c: any) => typeof c?.name === 'string' && c.name.trim())
    .map((c: any) => ({ name: c.name, origin: 'pdf' as const, score: toScore(c.treatability_score) }));
  const stage1: ConditionWithOrigin[] = (Array.isArray(ad.extractedConditions) ? ad.extractedConditions : [])
    .filter((c: any) => typeof c?.name === 'string' && c.name.trim())
    .map((c: any) => ({ name: c.name, origin: 'stage1' as const, score: toScore(c.confidence) }));
  const conflict = readConsistencyConflict(ingestionStages);
  return { items: [...pdf, ...stage1], conflict };
}
