/**
 * Bilingual message dictionary for the Clinical Analysis Pipeline.
 * Used by clinical-analysis-pipeline.ts and PetProfilePage.tsx
 * so log messages respect the active locale.
 */

type Locale = 'pt' | 'en';

const msgs: Record<string, Record<Locale, string>> = {
  // Stage 2
  s2_start: {
    pt: 'Buscando predisposições raciais para "{{breed}}"...',
    en: 'Fetching breed predispositions for "{{breed}}"...',
  },
  s2_end: {
    pt: '{{count}} predisposições · {{undiagnosed}} não diagnosticadas ({{time}}s)',
    en: '{{count}} predispositions · {{undiagnosed}} undiagnosed ({{time}}s)',
  },
  // Stage 3
  s3_start: {
    pt: 'Interpretando {{count}} exames vs faixas de referência ({{ageGroup}})...',
    en: 'Interpreting {{count}} exams vs reference ranges ({{ageGroup}})...',
  },
  s3_end: {
    pt: '{{count}} alertas laboratoriais detectados ({{time}}s)',
    en: '{{count}} lab alerts detected ({{time}}s)',
  },
  // Stage 4
  s4_start: {
    pt: 'Consultando Knowledge Graph para {{count}} condições...',
    en: 'Querying Knowledge Graph for {{count}} conditions...',
  },
  s4_end: {
    pt: '{{hits}}/{{total}} condições com evidência no KG · {{nodes}} nós totais ({{time}}s)',
    en: '{{hits}}/{{total}} conditions with KG evidence · {{nodes}} total nodes ({{time}}s)',
  },
  // Stage 4 per-condition
  s4_query: {
    pt: 'Consultando Knowledge Graph para "{{condition}}"...',
    en: 'Querying Knowledge Graph for "{{condition}}"...',
  },
  s4_hit: {
    pt: 'KG: {{nodes}} nós · {{edges}} relações para "{{condition}}" (via "{{candidate}}")',
    en: 'KG: {{nodes}} nodes · {{edges}} relations for "{{condition}}" (via "{{candidate}}")',
  },
  s4_fail: {
    pt: 'Falha ao consultar KG para "{{candidate}}" ({{error}})',
    en: 'Failed to query KG for "{{candidate}}" ({{error}})',
  },
  s4_miss: {
    pt: 'Sem dados no KG para "{{condition}}" após tentar {{count}} variantes',
    en: 'No KG data for "{{condition}}" after trying {{count}} variants',
  },
  // Stage 4b
  s4b_start: {
    pt: 'Extraindo evidência (pathways & projeções) de {{count}} resultados KG...',
    en: 'Extracting evidence (pathways & projections) from {{count}} KG results...',
  },
  s4b_end: {
    pt: '{{triplets}} triplets · {{pathways}} pathways · {{projections}} projeções',
    en: '{{triplets}} triplets · {{pathways}} pathways · {{projections}} projections',
  },
  // Stage 5
  s5_start: {
    pt: 'Verificando interações entre {{compounds}} compostos e {{meds}} medicações...',
    en: 'Checking interactions between {{compounds}} compounds and {{meds}} medications...',
  },
  s5_end: {
    pt: '{{interactions}} interações detectadas · {{triplets}} triplets clínicos extraídos ({{time}}s)',
    en: '{{interactions}} interactions detected · {{triplets}} clinical triplets extracted ({{time}}s)',
  },
  // Stage 6
  s6_start: {
    pt: 'Gerando recomendação híbrida (KG + LLM) para {{name}}...',
    en: 'Generating hybrid recommendation (KG + LLM) for {{name}}...',
  },
  s6_candidates: {
    pt: 'Recomendação base recebida: {{count}} compostos candidatos. Resolvendo posologias...',
    en: 'Base recommendation received: {{count}} candidate compounds. Resolving dosages...',
  },
  s6_end: {
    pt: '{{count}} compostos finais com posologia resolvida ({{time}}s) · pipeline total: {{total}}s',
    en: '{{count}} final compounds with resolved dosage ({{time}}s) · pipeline total: {{total}}s',
  },
  // Stage 1 (PetProfilePage)
  s1_start: {
    pt: 'Coletando perfil clínico de {{name}} ({{breed}}, {{age}}a, {{weight}}kg) · {{points}} pontos de dados',
    en: 'Collecting clinical profile for {{name}} ({{breed}}, {{age}}y, {{weight}}kg) · {{points}} data points',
  },
  s1_end: {
    pt: 'Perfil clínico carregado: {{conditions}} condições, {{meds}} medicações, {{exams}} exames',
    en: 'Clinical profile loaded: {{conditions}} conditions, {{meds}} medications, {{exams}} exams',
  },
  // Stage 7 (PetProfilePage)
  s7_start: {
    pt: '{{label}}: analisando sinergias de compostos',
    en: '{{label}}: analyzing compound synergies',
  },
  s7_end: {
    pt: '{{count}} sinergias identificadas',
    en: '{{count}} synergies identified',
  },
  // Error
  pipeline_error: {
    pt: 'Erro desconhecido no pipeline',
    en: 'Unknown pipeline error',
  },
};

/**
 * Interpolate {{key}} placeholders.
 */
function interpolate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
  }
  return result;
}

/**
 * Return a localized pipeline message.
 */
export function pm(key: string, locale: string, vars: Record<string, string | number> = {}): string {
  const entry = msgs[key];
  if (!entry) return key;
  const lang: Locale = locale.startsWith('en') ? 'en' : 'pt';
  return interpolate(entry[lang], vars);
}