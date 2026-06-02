# ARCHITECTURE_LIVE — Capacidade afirmada × Implementação real

> **DO NOT EDIT.** Gerado por `npm run docs:architecture`
> (scripts/generate-architecture-live.mjs). Última geração: 2026-06-02.

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

- 🟢 implemented: **6**
- 🟡 partial: **0**
- 🟠 inspiration only: **3**
- ⚪ planned: **2**
- **Total:** 11

## Matriz

| Claimed Capability | Status | Honest Name (what runs today) | Pointer | Claimed in | Notes |
|---|---|---|---|---|---|
| Triple Graph Construction (Document → Chunk → Entity → Mechanism) | 🟢 implemented | Triple Graph Construction (MedGraphRAG-style) | `supabase/functions/extract-study-entities/, supabase/functions/generate-triplets/` | `AboutSenexTab`<br/>`admin-tabs-info-bilingual:estudos`<br/>`GRAPHRAG_ARCHITECTURE.md` | Document/chunk/entity hierarchy persists in pgvector + L0–L4 tables. |
| GRRA cycle (Generate → Review → Revise → Answer) | 🟠 inspiration only | Generate + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL | `supabase/functions/generate-triplets/index.ts (scoring around heuristic thresholds; no independent Reviewer model)` | `AboutSenexTab pillar #2`<br/>`admin-tabs-info-bilingual:estudos.workflow[3]`<br/>`GRAPHRAG_ARCHITECTURE.md`<br/>`ConfiguracoesIATab Neo4j tab` | No independent Review model. No Revise step. Auto-approve threshold + admin curation play the role of the cycle. |
| U-Retrieval (bidirectional top-down + bottom-up) | 🟠 inspiration only | Hybrid retrieval: Cypher (Neo4j) + pgvector (Supabase) | `supabase/functions/graph-rag-search/index.ts, supabase/functions/hybrid-recommendation/index.ts` | `AboutSenexTab pillar #1`<br/>`admin-tabs-info-bilingual:estudos.workflow[5]`<br/>`GRAPHRAG_ARCHITECTURE.md`<br/>`ConfiguracoesIATab Neo4j tab` | No top-down/bottom-up fusion. Each surface picks Cypher OR vector; results are concatenated, not merged hierarchically. |
| TransE link prediction (h + r ≈ t) | 🟠 inspiration only | PubMed E-utilities + Gemini structuring | `supabase/functions/kg-evidence-gap-fill/index.ts` | `AboutSenexTab pillar #3`<br/>`admin-tabs-info-bilingual:estudos.benefits[3]`<br/>`GRAPHRAG_ARCHITECTURE.md` | Gap-fill is PubMed-based, not embedding-based. No TransE training/inference exists in the codebase. |
| PubMed gap-fill (compound × condition) | 🟢 implemented | PubMed gap-fill via E-utilities + Gemini | `supabase/functions/kg-evidence-gap-fill/index.ts` | `admin-tabs-info-bilingual:estudos.workflow[6]`<br/>`AboutSenexTab diagram` | Emits pending triplets when Digital Twin shows low years_gained. |
| Hybrid storage Supabase (pgvector) + Neo4j AuraDB (live sync) | 🟢 implemented | Supabase pgvector + L0–L4 tables + Neo4j sync edge functions | `supabase/functions/neo4j-sync/, supabase/functions/sync-approved-triplets/, supabase/functions/sync-study-to-neo4j/` | `AboutSenexTab diagram`<br/>`admin-tabs-info-bilingual:estudos.workflow[4]` | Sync triggered on curation approval; status tracked by synced_to_neo4j flag. |
| Two-tier confidence governance (auto-approve ≥ 0.50 + HITL) | 🟢 implemented | Auto-approve ≥ 0.50 + manual curation board | `supabase/functions/generate-triplets/, src/components/administrador/estudos/curation/` | `admin-tabs-info-bilingual:estudos.benefits[4]`<br/>`mem://architecture/clinical-data-quality-two-tier-governance` | Threshold currently hard-coded; future work makes it admin-configurable. |
| Digital Twin (sigmoid severity × time, years_gained) | 🟢 implemented | Sigmoid projection engine | `src/services/condition-progression-engine.ts, src/hooks/usePetTrajectoryProjection.ts` | `AboutSenexTab diagram`<br/>`admin-tabs-info-bilingual:estudos.objective` | Severity weighted by baseline; covered by unit tests. |
| Recommendation stack ≤ 8 synergistic compounds | 🟢 implemented | Hybrid Cypher + vector + Gemini synthesis with cap of 8 | `supabase/functions/hybrid-recommendation/index.ts` | `AboutSenexTab diagram`<br/>`admin-tabs-info-bilingual:estudos.benefits` | Dedup by alphanumeric key. AI-fallback path is explicitly labeled with source=llm_fallback + disclaimer=no_kg_data. |
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
