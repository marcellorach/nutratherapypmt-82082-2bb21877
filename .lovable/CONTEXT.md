# Project context briefing (auto)
Generated: 2026-05-25T19:12:47.427Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.105.0

## Changes by area (last 14 days)
- **admin**: 40
- **vet-ui**: 16
- **meta**: 7
- **kg**: 6
- **curation**: 4
- **clinical-pipeline**: 4
- **tutor-ui**: 2
- **i18n**: 1

## Top 10 recent entries
### 2026-05-25 · [admin] ADDED — Painel de Priorizações + Camada de Visualização de Papéis
- Nova aba `/administrador?tab=priorizacoes` em "Governança & IA": Kanban com 5 colunas (Backlog · Próximo · Em curso · Em teste · Entregue) seedado com 10 cards ordenados (role-view-layer → meta-kg-phase-b). Cada card declara `area | effort | value[] | dependsOn[] | rationale`. Fonte única do roadmap operacional — substitui na prática `docs/STANFORD_DEMO.md`.
- Sub-tab Gerador de Sugestões de Cohort: formulário guiado (raça, idade, peso, condições, medicação, N-alvo, exclusões, formato de entrega, privacidade) que exporta Markdown copiável / downloadable para enviar à PetLove pedindo recortes específicos do banco histórico (1M+ cães).
- Camada de visualização de papéis (não é segurança — é redução de ruído): `src/config/role-views.ts` declara 5 perfis (`platform_architect`, `rnd_lead`, `vet_curador`, `vet_responsavel`, `tutor`) com `allowedAdminGroups` e `defaultRoute`. `RoleViewContext` persiste seleção em localStorage. `RoleViewSwitcher` no Header só aparece para admin real e filtra grupos da sidebar admin via `AdminSidebarGroups`. RLS real fica para quando entrar o 1º vet PetLove externo (card #9 do board).
_files: src/config/role-views.ts, src/pages/administrador/PriorizacoesTab.tsx, src/data/prioritizationBoard.ts, src/contexts/RoleViewContext.tsx…_

### 2026-05-25 · [meta] ADDED — Roadmap Meta-KG: gatilhos quantitativos para acionar a Fase B
- `MetaKgRoadmapCard` agora exibe 3 métricas vivas que destravam a Fase B: (1) meta-estudos aprovados ≥ 10, (2) lições redundantes entre estudos ≥ 3, (3) conflitos recipe↔anti-padrão ≥ 1. Cada métrica renderiza barra de progresso e selo verde quando o alvo é atingido. Card mostra badge global "Pronto para iniciar" / "Aguardando massa crítica".
- Novo hook `useMetaKgPhaseBMetrics`: query React-Query sobre `meta_studies` (apenas `lifecycle_status='approved'`), normaliza statements de `architectural_patterns`/`methodological_recipes`/`anti_patterns_pitfalls` (lowercase, slice 120 chars) e calcula redundância (mesmo statement em ≥2 estudos por bucket) + conflito (mesmo statement como recipe e anti-padrão).
- i18n: +13 chaves em `fundamentos.roadmap.*` (PT+EN). I18N_VERSION 1.103.0 → 1.104.0.
_files: src/components/administrador/fundamentos/MetaKgRoadmapCard.tsx, src/hooks/useMetaKgPhaseBMetrics.ts, src/i18n.ts_

### 2026-05-22 · [admin] CHANGED — Observatório Clínico v2.1: filtros globais, métricas NNT/HR/TTR, fluxo mensal e caminhos biológicos
- Coorte sintética rebalanceada para totais não-redondos: 8.473 tratados / 13.916 espelho / 8.473 gêmeos digitais (1 twin por tratado). Helpers novos em `syntheticCohort.ts`: `meanTrajectoryWithCI` (IC95%), `computeNNT`, `computeHazardRatio`, `computeTimeToResponse` (mediana + IQR), `computeMonthlyFlow` (active/joined/churned).
- `ClinicalFiltersBar` sticky no topo da tab com 7 filtros (condição, raça, idade, região, adesão, janela de protocolo, resposta) + hook `useFilteredCohort` que propaga a coorte filtrada para todas as sub-abas.
- `CohortObservatory`: novo bloco "Métricas de impacto clínico" (NNT/HR/TTR) e `AdherenceMonthlyStack` substitui o funil 0-3-6m por barras empilhadas mensais (24 meses) com churn negativo abaixo do eixo.
_files: src/data/biologicalPathways.ts, src/utils/syntheticCohort.ts, src/hooks/useFilteredCohort.ts, src/i18n.ts_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.