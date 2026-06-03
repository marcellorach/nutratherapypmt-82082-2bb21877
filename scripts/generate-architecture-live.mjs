#!/usr/bin/env node
/**
 * generate-architecture-live.mjs
 *
 * Gera docs/generated/ARCHITECTURE_LIVE.md a partir de uma matriz declarada
 * inline (Claimed Capability × Status × Pointer). É a **verdade-base** sobre
 * o que o motor faz hoje vs o que é apenas inspiração científica.
 *
 * Regras:
 *  - Toda capacidade afirmada em material público (AboutSenexTab,
 *    admin-tabs-info-bilingual, GRAPHRAG_ARCHITECTURE.md) DEVE ter linha aqui.
 *  - Cada linha aponta para arquivo:linha do código que sustenta o status.
 *  - Status: implemented · partial · inspiration · planned.
 *
 * Regenerar:
 *    npm run docs:architecture
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../docs/generated/ARCHITECTURE_LIVE.md');

/** @type {{capability:string, claimed_in:string[], status:'implemented'|'partial'|'inspiration'|'planned', honest_name:string, pointer:string, notes:string}[]} */
const MATRIX = [
  {
    capability: 'Triple Graph Construction (Document → Chunk → Entity → Mechanism)',
    claimed_in: ['AboutSenexTab', 'admin-tabs-info-bilingual:estudos', 'GRAPHRAG_ARCHITECTURE.md'],
    status: 'implemented',
    honest_name: 'L0–L4 + ontology anchoring (MedGraphRAG as inspiration, not a port)',
    pointer: 'supabase/functions/extract-study-entities/, supabase/functions/generate-triplets/',
    notes: 'L0–L4 chains persist in pgvector + Supabase tables. The literal `[dado→fonte→definição]` triple is NOT implemented as such.',
  },
  {
    capability: 'GRRA cycle (Generate → Review → Revise → Answer)',
    claimed_in: ['AboutSenexTab pillar #2', 'admin-tabs-info-bilingual:estudos.workflow[3]', 'GRAPHRAG_ARCHITECTURE.md', 'ConfiguracoesIATab Neo4j tab'],
    status: 'inspiration',
    honest_name: 'Generate + heuristic scoring + HITL (no independent Reviewer, no Revise step)',
    pointer: 'supabase/functions/generate-triplets/index.ts (scoring around heuristic thresholds; no independent Reviewer model)',
    notes: 'No independent Review model. No Revise step. Auto-approve threshold + admin curation play the role of the cycle.',
  },
  {
    capability: 'U-Retrieval (bidirectional top-down + bottom-up)',
    claimed_in: ['AboutSenexTab pillar #1', 'admin-tabs-info-bilingual:estudos.workflow[5]', 'GRAPHRAG_ARCHITECTURE.md', 'ConfiguracoesIATab Neo4j tab'],
    status: 'inspiration',
    honest_name: 'Hybrid retrieval: Cypher (Neo4j) + pgvector (Supabase)',
    pointer: 'supabase/functions/graph-rag-search/index.ts, supabase/functions/hybrid-recommendation/index.ts',
    notes: 'No top-down/bottom-up fusion. Each surface picks Cypher OR vector; results are concatenated, not merged hierarchically.',
  },
  {
    capability: 'TransE link prediction (h + r ≈ t)',
    claimed_in: ['AboutSenexTab pillar #3', 'admin-tabs-info-bilingual:estudos.benefits[3]', 'GRAPHRAG_ARCHITECTURE.md'],
    status: 'inspiration',
    honest_name: 'PubMed E-utilities + Gemini structuring',
    pointer: 'supabase/functions/kg-evidence-gap-fill/index.ts',
    notes: 'Gap-fill is PubMed-based, not embedding-based. No TransE training/inference exists in the codebase.',
  },
  {
    capability: 'PubMed gap-fill (compound × condition)',
    claimed_in: ['admin-tabs-info-bilingual:estudos.workflow[6]', 'AboutSenexTab diagram'],
    status: 'implemented',
    honest_name: 'PubMed gap-fill via E-utilities + Gemini',
    pointer: 'supabase/functions/kg-evidence-gap-fill/index.ts',
    notes: 'Emits pending triplets when Digital Twin shows low years_gained.',
  },
  {
    capability: 'Hybrid storage Supabase (pgvector) + Neo4j AuraDB (live sync)',
    claimed_in: ['AboutSenexTab diagram', 'admin-tabs-info-bilingual:estudos.workflow[4]'],
    status: 'implemented',
    honest_name: 'Supabase pgvector + L0–L4 tables + Neo4j sync edge functions',
    pointer: 'supabase/functions/neo4j-sync/, supabase/functions/sync-approved-triplets/, supabase/functions/sync-study-to-neo4j/',
    notes: 'Sync triggered on curation approval; status tracked by synced_to_neo4j flag.',
  },
  {
    capability: 'Two-tier confidence governance (auto-approve ≥ 0.50 + HITL)',
    claimed_in: ['admin-tabs-info-bilingual:estudos.benefits[4]', 'mem://architecture/clinical-data-quality-two-tier-governance'],
    status: 'implemented',
    honest_name: 'Code path: auto-approve when extractionConfidence ≥ 0.85 AND kgMatchScore ≥ 0.50 + manual curation board. THREE SOURCES NOT RECONCILED: code (≥0.85 & ≥0.50), RC-013 (single ≥0.70), ADR/CONTEXT (loose ≥0.50).',
    pointer: 'supabase/functions/generate-triplets/index.ts:1110 ; src/components/administrador/estudos/curation/ ; docs/CORE_RULES.md (RC-013)',
    notes: 'CONFLICT pending reconciliation — do not pick a single number until RC-013/code/CONTEXT agree.',
  },
  {
    capability: 'Digital Twin (sigmoid severity × time, years_gained)',
    claimed_in: ['AboutSenexTab diagram', 'admin-tabs-info-bilingual:estudos.objective'],
    status: 'implemented',
    honest_name: 'Sigmoid projection engine (1/(1+exp(-k·(t−t50))))',
    pointer: 'src/services/condition-progression-engine.ts:86, src/hooks/usePetTrajectoryProjection.ts',
    notes: 'Code IS sigmoid. Any doc claiming Gompertz or "never invents a sigmoid" is wrong and must be corrected.',
  },
  {
    capability: 'Recommendation stack ≤ 8 synergistic compounds',
    claimed_in: ['AboutSenexTab diagram', 'admin-tabs-info-bilingual:estudos.benefits'],
    status: 'implemented',
    honest_name: 'Hybrid Cypher + vector + Gemini synthesis with cap of 8',
    pointer: 'supabase/functions/hybrid-recommendation/index.ts',
    notes: 'Dedup by alphanumeric key. AI-fallback path is explicitly labeled with source=llm_fallback + disclaimer=no_kg_data.',
  },
  {
    capability: 'Honest-failure abstain envelope (3 buckets)',
    claimed_in: ['Bloco 1 card #3'],
    status: 'implemented',
    honest_name: 'validation_status ∈ { model_unavailable | model_response_invalid | clinical_signal_insufficient }; parse-failure bucket → ~0 is the thermometer',
    pointer: 'src/types/recommendation-confidence.ts + callers',
    notes: 'Distinct buckets prevent infra/parse/honest-abstain from polluting the same metric.',
  },
  {
    capability: 'tool_choice forced on clinical callers (no JSON parse path)',
    claimed_in: ['Bloco 1 card #1'],
    status: 'implemented',
    honest_name: 'tool_choice="required" on 3 callers: hybrid-recommendation, extract-pet-clinical-data, parse-pet-exam-pdf',
    pointer: 'supabase/functions/hybrid-recommendation/, supabase/functions/extract-pet-clinical-data/, supabase/functions/parse-pet-exam-pdf/',
    notes: 'Preserves the envelope schema from Bloco 1 card #3.',
  },
  {
    capability: 'validation_status + abstained telemetry',
    claimed_in: ['Bloco 1 card #2'],
    status: 'implemented',
    honest_name: 'Single measurement spine: ai_task_invocations.validation_status + abstained',
    pointer: 'ai_task_invocations (DB) + callers',
    notes: 'Lets honest abstain be distinguished from parse failure in dashboards.',
  },
  {
    capability: 'Translational weighting human → dog (RC-003 modulator ×0.7)',
    claimed_in: ['docs/CORE_RULES.md:80 (RC-003)'],
    status: 'planned',
    honest_name: 'core_rule_modulators row, currently off',
    pointer: 'docs/CORE_RULES.md:80',
    notes: 'Distinct from RC-013 (auto-approve threshold). Modulator not yet wired into scoring.',
  },
  {
    capability: 'Real-world post-deploy outcome tracking',
    claimed_in: ['complianceData.ts (FDA gap)'],
    status: 'planned',
    honest_name: 'outcome_observations table + dashboard',
    pointer: '— (not yet implemented)',
    notes: 'Identified as P0 gap in compliance matrix.',
  },
  {
    capability: 'Cross-species (feline/equine) extrapolation guard',
    claimed_in: ['complianceData.ts (AVMA gap)'],
    status: 'planned',
    honest_name: 'species=canine tag enforcement',
    pointer: '— (not yet implemented)',
    notes: 'Identified as P0 gap in compliance matrix.',
  },
];

const STATUS_BADGE = {
  implemented: '🟢 implemented',
  partial: '🟡 partial',
  inspiration: '🟠 inspiration only',
  planned: '⚪ planned',
};

function table() {
  const header =
    '| Claimed Capability | Status | Honest Name (what runs today) | Pointer | Claimed in | Notes |\n' +
    '|---|---|---|---|---|---|';
  const rows = MATRIX.map(
    (r) =>
      `| ${esc(r.capability)} | ${STATUS_BADGE[r.status]} | ${esc(r.honest_name)} | \`${esc(r.pointer)}\` | ${r.claimed_in.map((c) => `\`${esc(c)}\``).join('<br/>')} | ${esc(r.notes)} |`,
  );
  return [header, ...rows].join('\n');
}

function esc(s) {
  return String(s).replace(/\|/g, '\\|');
}

function counts() {
  const acc = { implemented: 0, partial: 0, inspiration: 0, planned: 0 };
  for (const r of MATRIX) acc[r.status]++;
  return acc;
}

const now = new Date().toISOString().slice(0, 10);
const c = counts();

const body = `# ARCHITECTURE_LIVE — Capacidade afirmada × Implementação real

> **DO NOT EDIT.** Gerado por \`npm run docs:architecture\`
> (scripts/generate-architecture-live.mjs). Última geração: ${now}.

## Propósito

Este arquivo é a **única verdade-base** sobre o que o motor Senex AI realmente faz hoje.
Toda capacidade que aparece em material público (AboutSenexTab, admin-tabs-info-bilingual,
GRAPHRAG_ARCHITECTURE.md, complianceData) DEVE existir aqui com status e ponteiro para
o código que sustenta o status.

**Regras de honestidade aplicadas:**

1. Sem créditos emprestados: nomes como "GRRA", "U-Retrieval", "TransE" só aparecem
   marcados como \`🟠 inspiration only\` enquanto o mecanismo não estiver implementado.
2. Benchmarks de literatura (ex.: ~87% do KGARevion, ~40% do MedGraphRAG) NUNCA são
   apresentados como métricas do Senex AI.
3. Toda recomendação clínica pública deve traçar de volta a um KG record real ou ser
   explicitamente marcada como \`source: 'llm_fallback'\` + \`disclaimer: 'no_kg_data'\`.

## Resumo

- 🟢 implemented: **${c.implemented}**
- 🟡 partial: **${c.partial}**
- 🟠 inspiration only: **${c.inspiration}**
- ⚪ planned: **${c.planned}**
- **Total:** ${MATRIX.length}

## Matriz

${table()}

## Como atualizar

1. Edite \`scripts/generate-architecture-live.mjs\` (constante \`MATRIX\`).
2. Rode \`npm run docs:architecture\`.
3. Commit do \`docs/generated/ARCHITECTURE_LIVE.md\` regenerado.

## Quando uma linha muda de status

- \`inspiration → implemented\`: também remova/atualize a marcação "(inspiração)" nos
  artefatos estáticos (AboutSenexTab pillar status, admin-tabs-info-bilingual workflow,
  GRAPHRAG_ARCHITECTURE.md banner).
- \`implemented → partial\`: registre no CHANGELOG e atualize o ponteiro.
- \`planned → implemented\`: também remova o item da matriz de compliance gaps se aplicável.
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, body, 'utf8');
console.log(`[architecture-live] wrote ${OUT} (${MATRIX.length} rows)`);