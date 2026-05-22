# Project context briefing (auto)
Generated: 2026-05-22T16:38:55.042Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.102.0

## Changes by area (last 14 days)
- **admin**: 39
- **vet-ui**: 16
- **kg**: 6
- **meta**: 6
- **curation**: 4
- **clinical-pipeline**: 4
- **tutor-ui**: 2
- **i18n**: 1

## Top 10 recent entries
### 2026-05-22 · [admin] CHANGED — Monitoramento Clínico vira Observatório Longitudinal (coorte sintética 10k+16k+10k)
- `ClinicalMonitoringTab` reescrita em 5 abas: Observatório da Coorte, Trajetórias Longitudinais, Explorador de Pacientes, Sinais de Descoberta e Loop de Modelos.
- Novo `src/utils/syntheticCohort.ts`: gerador determinístico (PRNG mulberry32, seed fixa) de 10.000 cães tratados + 16.000 pares observacionais (coorte-espelho) + 10.000 gêmeos digitais projetados. Todos os registros carregam `is_synthetic: true` e IDs `#A-NNNNN` / `#M-NNNNN`. Modelagem por 8 condições (OA, DRC, CDS, hepato, cardio, obesidade, IBD, sarcopenia) com curva sigmoide amortecida por adesão.
- `PatientDetailDialog`: drill-down com snapshot T0, stack Senex aprovado, proposta ao tutor (custo/anos ganhos/ROE), trajetória real × gêmeo digital × espelho, tabela de pares observacionais e linha do tempo de ajustes de protocolo.
_files: src/utils/syntheticCohort.ts, src/i18n.ts_

### 2026-05-22 · [admin] CHANGED — Depósito de estudos arquiteturais ganha citações ricas; ilustrações do Kanban removidas
- Novo `MetaStudyDetailedCard.tsx` na aba "Estudos Arquiteturais": exibe selo de confiabilidade ★ X/5 (popover com as 5 dimensões), links Fonte + DOI + chat contextual, e seção colapsável "Citações & excertos detalhados" que renderiza `quantitative_parameters` (fórmulas/λ/thresholds), `evaluation_metrics`, `architectural_patterns`, `methodological_recipes` e `anti_patterns_pitfalls` — cada item com statement, quote literal, `applies_to` e weight.
- Kanban: ilustrações geradas por IA removidas (não representavam o conteúdo dos papers). `CoverThumb` agora sempre renderiza ícone temático por `kind` sobre gradiente. Botões "Gerar capas" (header) e "capa" (por card) eliminados.
- Edge function `generate-meta-study-cover` e coluna `cover_image_url` permanecem no banco (sem uso na UI), permitindo reativação futura caso queiramos diagramas reais do conteúdo.
_files: src/components/administrador/fundamentos/MetaStudyDetailedCard.tsx, src/pages/administrador/FundamentosTab.tsx, src/components/administrador/fundamentos/MetaStudyKanban.tsx, src/i18n.ts_

### 2026-05-22 · [admin] ADDED — Meta-Estudos "Stanford-grade": capas IA, badge de Core Rules e chat contextual
- Coluna `meta_studies.cover_image_url` + bucket público `meta-study-covers`. Style-guide fixo (paleta navy/gold/parchment, isométrico editorial) garante consistência visual entre papers.
- Edge function `generate-meta-study-cover` (Gemini image): gera 1x por paper, bucket público, com tema derivado do `kind`. Backfill via botão "Gerar capas" no Kanban (5/5 papers atuais já cobertos).
- Edge function `chat-meta-study`: chat streaming com contexto = summary + key_claims + proposed_rules + core_rule_evidence do próprio registro (sem RAG novo).
_files: supabase/functions/generate-meta-study-cover/index.ts, supabase/functions/chat-meta-study/index.ts, src/components/administrador/fundamentos/MetaStudyChatDialog.tsx, src/components/administrador/fundamentos/CoreRulesEvidenceBadge.tsx…_

### 2026-05-22 · [admin] CHANGED — Kanban Meta-Estudos: breakdown de confiabilidade inline
- Card do Kanban agora exibe breakdown das 5 dimensões de confiabilidade com sliders inline (expansível) e recálculo do `reliability_overall` em tempo real (mesma fórmula da coluna gerada no DB).
- Mini barra de contribuição colorida por dimensão + chips com nº de tripletes vinculados (`core_rule_evidence.meta_study_id`), nº de propostas e idade do estudo.
- Salvamento inline (Salvar/Descartar) com aviso de drift se overall salvo divergir do preview local.
_files: src/components/administrador/fundamentos/MetaStudyKanban.tsx_

### 2026-05-22 · [kg] ADDED — Fase 1: identidade canônica + evidência negativa
_status: parcial_
- Colunas `canonical_id` + `canonical_source` em `health_conditions` e `nutraceuticals` (com índice único parcial e CHECK de fonte).
- Coluna `evidence_polarity` em `triplet_extractions` (`positive` default; aceita `negative`, `neutral`, `inconclusive`). Backfill marca tripletes com predicates `fails_to_treat*`/`no_effect*`/`worsens*`/`contraindicat*` como `negative`.
- Documento `docs/ONTOLOGY_SOURCES.md` com URLs oficiais de OMIA, MeSH, ChEBI, Mondo + licenças + procedimento de import + lista de papers de fundamentação.
_files: scripts/import-ontology-dump.ts, src/i18n.ts_

### 2026-05-22 · [admin] ADDED — Fundamentos: Sandbox (lifecycle) + Confiabilidade dos meta-estudos (Fase A)
- `meta_studies` ganhou coluna `lifecycle_status` (enum `meta_study_lifecycle`: inbox / triaged / in_review / approved / archived). Novos uploads caem em `inbox` por padrão.
- 5 dimensões de confiabilidade 0–5 (`reliability_methodology`, `reliability_evidence_base`, `reliability_applicability`, `reliability_reproducibility`, `reliability_relevance`) + `reliability_suggested` JSONB + `reliability_overall` (coluna gerada = média das notas preenchidas).
- Backfill seguro: estudos com `proposed_rules`/`key_claims` → `triaged`; estudos já com `core_rule_evidence` vinculada → `approved`.
_files: src/components/administrador/fundamentos/MetaStudyKanban.tsx, src/components/administrador/fundamentos/MetaKgRoadmapCard.tsx, src/pages/administrador/FundamentosTab.tsx, src/i18n.ts_

### 2026-05-21 · [meta] CHANGED — Docs: contrato `callAITask` em TECHNICAL_DECISIONS + GRAPHRAG
- `docs/TECHNICAL_DECISIONS.md` v1.1.0: nova seção AI Task Router (`callAITask`) com contrato de chamada (taskId, caller, messages/input, tools+tool_choice, fallback, reasoning_effort, temperature), ordem de resolução (override em `ai_configurations` → prompt ativo em `ai_prompt_versions` → fallback do caller → default), telemetria automática (`ai_task_invocations` + `ai_task_status`), tratamento de 429/402/413/404/502 e regras de quando NÃO usar o router (Google AI File API direto: `gemini-file-search` e PDF > 7 MB do `extract-meta-study`). Entrada no Histórico de Decisões.
- `docs/GRAPHRAG_ARCHITECTURE.md` v2.1.0: bloco de governança LLM no topo de Edge Functions com tabela das 4 funções Curadoria/KG roteadas via `callAITask` e a função fora de escopo.
- Files: docs/TECHNICAL_DECISIONS.md, docs/GRAPHRAG_ARCHITECTURE.md

### 2026-05-21 · [meta] CHANGED — Consolidação Curadoria/KG no `ai-task-router` (relatório)
- Fechamento do ciclo de migração Curadoria/KG. Funções roteadas via `callAITask`: `kg-evidence-gap-fill` (`kg_gap_fill`), `extract-meta-study` (`meta_study_analysis`, caminho Google AI File API mantido fora do router), `extract-study-entities` (`extraction_stage1/2/3`, com `tools`+`tool_choice` e fallback `google/gemini-3-pro-preview` temp=0.1), `generate-triplets` (`triplet_extraction`, Phase 1 discovery + Phase 2 tool calling, resposta reconstruída para preservar parser downstream, tratamento 429/402 reintroduzido).
- `gemini-file-search` auditada e formalmente fora do escopo: usa Google AI Direct API com `fileData.fileUri` + corpora `file_search` nativos, incompatíveis com o Gateway.
- Estado final em `src/config/ai-tasks.ts`: 13 connected · 7 legacy · 3 planned (23 tasks). `lab_driven_adjustment` e `treatment_proposal_12m` respondem no router (healthcheck OK) mas seguem `planned` porque os consumidores clínicos ainda usam o caminho legado — alvo do próximo lote.
_files: src/config/ai-tasks.ts_

### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG: fechamento (gemini-file-search fica fora do router)
- `gemini-file-search` auditada: todas as chamadas LLM usam a Google AI Direct API (`generativelanguage.googleapis.com`) com `fileData.fileUri` referenciando arquivos da File API + corpora/file_search nativos. O Lovable Gateway não aceita esses URIs nem expõe File Search nativo, então a função permanece fora do escopo do router por design — análogo ao caminho Google AI File API do `extract-meta-study`. Sem mudanças de código.
- Healthcheck pós-migração (Curadoria/KG): `ai-task-healthcheck` retornou 8/8 OK — `extraction_stage1` (815ms), `extraction_stage2` (851ms), `extraction_stage3` (851ms), `triplet_extraction` (820ms), `relations_auditor` (2470ms), `geroprotector_stack` (812ms), `lab_driven_adjustment` (784ms), `treatment_proposal_12m` (864ms).
- Vitest: 94/94 passando (1 suite com falha pré-existente de `localStorage` em Node, alheia ao router).

### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG: generate-triplets no router
_status: parcial_
- `generate-triplets` (Phase 1 discovery por chunk + Phase 2 structuring com tool calling) migrada para `callAITask('triplet_extraction', ...)`. Phase 2 preserva `tools=[extractTripletsToolDef]` + `tool_choice` forçado; resposta reconstruída no shape `phase2Data.choices[0].message.{content, tool_calls}` para manter o parser downstream intacto. Tratamento de 429/402 reintroduzido a partir das mensagens de erro do router.
- Status reconciliado em `src/config/ai-tasks.ts`: `triplet_extraction` passa de `legacy` para `connected` (13 connected · 7 legacy · 3 planned).
- Smoke test: `ai-task-healthcheck {triplet_extraction}` → 200 OK (827 ms).
_files: src/config/ai-tasks.ts, supabase/functions/generate-triplets/index.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.