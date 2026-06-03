# STATE_REAL_VS_MOCK — O que é dado real vs sintético

> **Curado, não gerado.** Derivado da matriz LIVE + `mem://architecture/system-cleanup-and-data-integrity-standard` (No-Mock Policy). Última revisão: 2026-06-03.
>
> Regra: qualquer ponto da plataforma com dado sintético DEVE estar listado aqui e rotulado na UI. Nada de mock silencioso.

## ✅ REAL (lê de DB / Edge Function / KG)

| Superfície | Fonte real | Notas |
|---|---|---|
| Knowledge Graph (nodes + edges) | Supabase (`medical_knowledge_graph*`) + Neo4j sync | IDs canônicos via Supabase UUID; nada inventado. |
| Triplet bank / curadoria | `extracted_triplets` + curation UI | Auto-aprovação ≥0.85+0.50 (ver matriz, conflito pendente). |
| Extração de PDF de estudos | `extract-study-entities` + `generate-triplets` | PDF SHA-256 + Levenshtein título para dedupe. |
| Vetorização (pgvector) | pré-requisito de curadoria | Disparada via `EdgeRuntime.waitUntil` em `extract-study-entities`. |
| Gap-fill PubMed | `kg-evidence-gap-fill` (E-utilities + Gemini) | Emite triplets pending quando Digital Twin mostra `years_gained` baixo. |
| Digital Twin (projeção sigmoide) | `src/services/condition-progression-engine.ts:86` | `1/(1+exp(-k·(t−t50)))`. Coberto por testes. |
| Recomendação clínica (stack ≤8) | `hybrid-recommendation` | Cypher + pgvector + Gemini; dedup alfanumérico. |
| Fallback sem KG | mesma função | Marcado `source='llm_fallback' + disclaimer='no_kg_data'` — não é "recomendação científica". |
| Auditoria técnica | `generate-audit` + `technical_audits` | Heartbeat + watchdog (`audit-watchdog`); SVG/HTML real. |
| Compliance dashboard | `complianceData.ts` | Matriz FDA/AVMA estática; gaps P0 explícitos. |
| Pets demo (5 perfis) | seed + `is_demo` flag | Bulk delete exige digitar `DELETE` (audit). |
| Telemetria de invocação IA | `ai_task_invocations` | `validation_status` + `abstained` (Bloco 1 card #2). |

## 🟡 PARCIAL (real + reforço heurístico)

| Superfície | Real | Sintético / heurístico | O que fazer |
|---|---|---|---|
| Scoring de triplets | `extractionConfidence` (LLM) + `kgMatchScore` | Pesos heurísticos 0.65–0.75 | RC-013 quer single ≥0.70; reconciliar. |
| Predisposições por raça | base curada + ontology | Mapping ainda em sandbox para algumas raças | ver `docs/BREED_PREDISPOSITIONS_AUDIT.md`. |
| Interpretação de exames | referências caninas reais | Faixas de severidade ajustadas à mão | mover para tabela `lab_reference_ranges` configurável. |

## 🟠 INSPIRAÇÃO (NÃO IMPLEMENTADO — não usar como atributo do Senex)

| Termo | O que roda no lugar |
|---|---|
| GRRA (Generate→Review→Revise→Answer) | Generate + scoring heurístico + HITL. Sem Reviewer independente. Sem Revise. |
| U-Retrieval (top-down + bottom-up fusion) | Cypher OU pgvector, concatenados. Sem fusão hierárquica. |
| TransE link prediction | Gap-fill via PubMed E-utilities + Gemini. Nenhum embedding TransE existe. |

## ⚪ PLANNED (não existe ainda — não pode aparecer como pronto)

- `outcome_observations` (tracking pós-deploy) — P0 FDA gap.
- Guarda `species=canine` para impedir extrapolação felino/equino — P0 AVMA gap.
- Modulador RC-003 (ponderação humano→cão ×0.7) — definido em CORE_RULES, off no scoring.

## Onde a UI ainda pode confundir

- **AboutSenexTab / admin-tabs-info-bilingual / GRAPHRAG_ARCHITECTURE.md**: rebaixados nesta sessão (v5.2.0) para "inspiração" nos 3 termos acima. Banner de honestidade no `GRAPHRAG_ARCHITECTURE.md`.
- **Cabeçalho de `condition-progression-engine.ts`** diz "nunca inventa sigmoide" — código É sigmoide. Corrigir no próximo turno (item Now do ROADMAP).

## Como atualizar

1. Para mover item de 🟠/⚪ → 🟢: primeiro mude a linha em `scripts/generate-architecture-live.mjs`, rode `npm run docs:architecture`, depois ajuste este arquivo.
2. Toda mudança aqui exige entrada em `CHANGELOG.md` `[Unreleased]` + `npm run sync:changelog`.