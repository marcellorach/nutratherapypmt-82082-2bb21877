# ARCHITECTURE_LIVE — Capacidade afirmada × Implementação real

> **DO NOT EDIT.** Gerado por `npm run docs:architecture`
> (scripts/generate-architecture-live.mjs). Última geração: 2026-06-05.

## Propósito

Este arquivo é a **única verdade-base** sobre o que o motor Senex AI realmente faz hoje.
Toda capacidade que aparece em material público (AboutSenexTab, admin-tabs-info-bilingual,
GRAPHRAG_ARCHITECTURE.md, complianceData) DEVE existir aqui com status e ponteiro para
o código que sustenta o status.

**Regras de honestidade aplicadas:**

1. Sem créditos emprestados: nomes como "GRRA", "U-Retrieval", "TransE" só aparecem
   marcados como `🟠 inspiration only` enquanto o mecanismo não estiver implementado.
2. Benchmarks de literatura (ex.: ~87% do KGARevion, ~40% do MedGraphRAG) NUNCA são
   apresentados como métricas do Senex AI.
3. Toda recomendação clínica pública deve traçar de volta a um KG record real ou ser
   explicitamente marcada como `source: 'llm_fallback'` + `disclaimer: 'no_kg_data'`.

## Resumo

- 🟢 implemented: **9**
- 🟡 partial: **0**
- 🟠 inspiration only: **3**
- ⚪ planned: **3**
- **Total:** 15

## Matriz

| Claimed Capability | Status | Honest Name (what runs today) | Pointer | Claimed in | Notes |
|---|---|---|---|---|---|
| Triple Graph Construction (Document → Chunk → Entity → Mechanism) | 🟢 implemented | L0–L4 + ontology anchoring (MedGraphRAG as inspiration, not a port) | `supabase/functions/extract-study-entities/, supabase/functions/generate-triplets/` | `AboutSenexTab`<br/>`admin-tabs-info-bilingual:estudos`<br/>`GRAPHRAG_ARCHITECTURE.md` | L0–L4 chains persist in pgvector + Supabase tables. The literal `[dado→fonte→definição]` triple is NOT implemented as such. |
| GRRA cycle (Generate → Review → Revise → Answer) | 🟠 inspiration only | Generate + heuristic scoring + HITL (no independent Reviewer, no Revise step) | `supabase/functions/generate-triplets/index.ts (scoring around heuristic thresholds; no independent Reviewer model)` | `AboutSenexTab pillar #2`<br/>`admin-tabs-info-bilingual:estudos.workflow[3]`<br/>`GRAPHRAG_ARCHITECTURE.md`<br/>`ConfiguracoesIATab Neo4j tab` | No independent Review model. No Revise step. Auto-approve threshold + admin curation play the role of the cycle. |
| U-Retrieval (bidirectional top-down + bottom-up) | 🟠 inspiration only | Hybrid retrieval: Cypher (Neo4j) + pgvector (Supabase) | `supabase/functions/graph-rag-search/index.ts, supabase/functions/hybrid-recommendation/index.ts` | `AboutSenexTab pillar #1`<br/>`admin-tabs-info-bilingual:estudos.workflow[5]`<br/>`GRAPHRAG_ARCHITECTURE.md`<br/>`ConfiguracoesIATab Neo4j tab` | No top-down/bottom-up fusion. Each surface picks Cypher OR vector; results are concatenated, not merged hierarchically. |
| TransE link prediction (h + r ≈ t) | 🟠 inspiration only | PubMed E-utilities + Gemini structuring | `supabase/functions/kg-evidence-gap-fill/index.ts` | `AboutSenexTab pillar #3`<br/>`admin-tabs-info-bilingual:estudos.benefits[3]`<br/>`GRAPHRAG_ARCHITECTURE.md` | Gap-fill is PubMed-based, not embedding-based. No TransE training/inference exists in the codebase. |
| PubMed gap-fill (compound × condition) | 🟢 implemented | PubMed gap-fill via E-utilities + Gemini | `supabase/functions/kg-evidence-gap-fill/index.ts` | `admin-tabs-info-bilingual:estudos.workflow[6]`<br/>`AboutSenexTab diagram` | Emits pending triplets when Digital Twin shows low years_gained. |
| Hybrid storage Supabase (pgvector) + Neo4j AuraDB (live sync) | 🟢 implemented | Supabase pgvector + L0–L4 tables + Neo4j sync edge functions | `supabase/functions/neo4j-sync/, supabase/functions/sync-approved-triplets/, supabase/functions/sync-study-to-neo4j/` | `AboutSenexTab diagram`<br/>`admin-tabs-info-bilingual:estudos.workflow[4]` | Sync triggered on curation approval; status tracked by synced_to_neo4j flag. |
| Two-tier confidence governance (auto-approve ≥ 0.50 + HITL) | 🟢 implemented | Code path: auto-approve when extractionConfidence ≥ 0.85 AND kgMatchScore ≥ 0.50 + manual curation board. THREE SOURCES NOT RECONCILED: code (≥0.85 & ≥0.50), RC-013 (single ≥0.70), ADR/CONTEXT (loose ≥0.50). | `supabase/functions/generate-triplets/index.ts:1110 ; src/components/administrador/estudos/curation/ ; docs/CORE_RULES.md (RC-013)` | `admin-tabs-info-bilingual:estudos.benefits[4]`<br/>`mem://architecture/clinical-data-quality-two-tier-governance` | CONFLICT pending reconciliation — do not pick a single number until RC-013/code/CONTEXT agree. |
| Digital Twin (sigmoid severity × time, years_gained) | 🟢 implemented | Sigmoid projection engine (1/(1+exp(-k·(t−t50)))) | `src/services/condition-progression-engine.ts:86, src/hooks/usePetTrajectoryProjection.ts` | `AboutSenexTab diagram`<br/>`admin-tabs-info-bilingual:estudos.objective` | Code IS sigmoid. Any doc claiming Gompertz or "never invents a sigmoid" is wrong and must be corrected. |
| Recommendation stack ≤ 8 synergistic compounds | 🟢 implemented | Hybrid Cypher + vector + Gemini synthesis with cap of 8 | `supabase/functions/hybrid-recommendation/index.ts` | `AboutSenexTab diagram`<br/>`admin-tabs-info-bilingual:estudos.benefits` | Dedup by alphanumeric key. AI-fallback path is explicitly labeled with source=llm_fallback + disclaimer=no_kg_data. |
| Honest-failure abstain envelope (3 buckets) | 🟢 implemented | validation_status ∈ { model_unavailable \| model_response_invalid \| clinical_signal_insufficient }; parse-failure bucket → ~0 is the thermometer | `src/types/recommendation-confidence.ts + callers` | `Bloco 1 card #3` | Distinct buckets prevent infra/parse/honest-abstain from polluting the same metric. |
| tool_choice forced on clinical callers (no JSON parse path) | 🟢 implemented | tool_choice="required" on 3 callers: hybrid-recommendation, extract-pet-clinical-data, parse-pet-exam-pdf | `supabase/functions/hybrid-recommendation/, supabase/functions/extract-pet-clinical-data/, supabase/functions/parse-pet-exam-pdf/` | `Bloco 1 card #1` | Preserves the envelope schema from Bloco 1 card #3. |
| validation_status + abstained telemetry | 🟢 implemented | Single measurement spine: ai_task_invocations.validation_status + abstained | `ai_task_invocations (DB) + callers` | `Bloco 1 card #2` | Lets honest abstain be distinguished from parse failure in dashboards. |
| Translational weighting human → dog (RC-003 modulator ×0.7) | ⚪ planned | core_rule_modulators row, currently off | `docs/CORE_RULES.md:80` | `docs/CORE_RULES.md:80 (RC-003)` | Distinct from RC-013 (auto-approve threshold). Modulator not yet wired into scoring. |
| Real-world post-deploy outcome tracking | ⚪ planned | outcome_observations table + dashboard | `— (not yet implemented)` | `complianceData.ts (FDA gap)` | Identified as P0 gap in compliance matrix. |
| Cross-species (feline/equine) extrapolation guard | ⚪ planned | species=canine tag enforcement | `— (not yet implemented)` | `complianceData.ts (AVMA gap)` | Identified as P0 gap in compliance matrix. |

## Como atualizar

1. Edite `scripts/generate-architecture-live.mjs` (constante `MATRIX`).
2. Rode `npm run docs:architecture`.
3. Commit do `docs/generated/ARCHITECTURE_LIVE.md` regenerado.

## Quando uma linha muda de status

- `inspiration → implemented`: também remova/atualize a marcação "(inspiração)" nos
  artefatos estáticos (AboutSenexTab pillar status, admin-tabs-info-bilingual workflow,
  GRAPHRAG_ARCHITECTURE.md banner).
- `implemented → partial`: registre no CHANGELOG e atualize o ponteiro.
- `planned → implemented`: também remova o item da matriz de compliance gaps se aplicável.
