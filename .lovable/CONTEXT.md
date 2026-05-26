# Project context briefing (auto)
Generated: 2026-05-26T02:02:18.752Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.111.0

## Changes by area (last 14 days)
- **admin**: 44
- **vet-ui**: 13
- **meta**: 7
- **kg**: 6
- **curation**: 4
- **tutor-ui**: 2
- **clinical-pipeline**: 2

## Top 10 recent entries
### 2026-05-26 · [admin] ADDED — Check de originalidade nas sugestões de cohort
- Cada sugestão de cohort gerada pela IA agora passa por um check automático de originalidade em 3 camadas: base interna (embeddings em `study_embeddings` via `search_study_chunks`), PubMed E-utilities (esearch/esummary) e Perplexity em modo `academic` (opt-in via toggle).
- Score 0–100 com badge (Alta / Média / Já bem estudado), popover com breakdown transparente por fonte (hits, top 3 títulos similares com link para PubMed, query exibida), link clicável para validar manualmente no Google Scholar e botão "Re-rodar".
- Fontes que falham aparecem como "indisponível" em vez de gerar score falso — o usuário sempre sabe se a busca realmente teve sucesso.
_files: supabase/functions/check-cohort-originality/index.ts, supabase/functions/suggest-cohort-ideas/index.ts, src/components/administrador/priorizacoes/CohortOriginalityBadge.tsx, src/components/administrador/priorizacoes/CohortAISuggester.tsx_

### 2026-05-25 · [admin] FIXED — Cohort travado sem heartbeat volta a poder ser destravado
- `CohortAISuggester` agora considera a última atividade disponível (`last_heartbeat_at`, último log ou `created_at`) para detectar travamentos. Isso corrige os cohorts antigos que ficavam presos em `generating` sem heartbeat e nunca exibiam o botão Forçar finalização.
- Após a finalização manual, o card local é atualizado imediatamente para `ready`/`failed`, sem depender do próximo ciclo de polling.
- O cohort travado `SRD sênior (8+) com OA em uso crônico de AINEs vs. Bedinvetmab` foi destravado no backend e marcado como `ready` com 175/200 pets preservados.
_files: src/components/administrador/priorizacoes/CohortAISuggester.tsx_

### 2026-05-25 · [admin] CHANGED — Cohorts sintéticos: geração clínica rica + painel estatístico
- `generate-synthetic-cohort` agora emite pets clinicamente completos: 1-4 condições (com severidade/status/origem), 2-5 exames (com `results_json` e `flags_abnormal`), 1-3 consultas cronológicas (`chief_complaint`, `assessment`, `plan`, peso, BCS, última marcada `is_latest=true`), 0-3 medicações vinculadas à consulta e 1-2 notas clínicas (anamnese livre) — inspirado na geração de pacientes de exemplo.
- Validação descarta e regenera pets sem condições ou sem exames antes do insert; `BATCH_SIZE` reduzido de 25 → 10 para evitar timeout no último batch.
- Novo painel estatístico colapsável dentro de cada card de cohort `ready` (`CohortStatsPanel`): demografia (idade/peso médios, % macho/fêmea, % castrado), top 5 raças, top 8 condições com distribuição de severidade, cobertura clínica (condições/exames/consultas por pet) e flags laboratoriais — alimentado pela nova RPC `get_cohort_stats(p_cohort_id)` (SECURITY DEFINER, admin-only).
_files: supabase/functions/generate-synthetic-cohort/index.ts, supabase/migrations/20260525222733_get_cohort_stats.sql, src/i18n.ts_

### 2026-05-25 · [admin] CHANGED — Cohorts sintéticos: explorador de pacientes por cohort
- Aba Cohorts sintéticos agora tem botão "Ver pacientes" em cada cohort para abrir um dialog com lista pesquisável dos pets gerados naquele cohort e drill-down individual com perfil, condições e exames sintéticos reais gravados no banco.
- O fluxo resolve a lacuna de inspeção operacional: após a geração parcial (ex.: 175/200), já é possível auditar os registros efetivamente persistidos sem sair da aba de priorizações.
- I18N_VERSION 1.109.0 → 1.110.0 com novas chaves `prioritization.syntheticExplorer.*` em PT/EN.
_files: src/i18n.ts_

### 2026-05-25 · [admin] ADDED — Playground Multi-Fonte + SourcePanel (fundação #8)
- Serviço `MultiSourceResolver` (`src/services/multi-source-resolver.ts`) com 5 providers independentes: KG curado (peso 1.0, via RPC `get_relations_graph_data`), histórico do cão (0.95), cohort sintético (0.7), cães tratados (0.6, stub) e internet via Perplexity (0.3). Detecção automática de conflito quando ≥ 2 fontes de peso ≥ 0.6 retornam claims com polaridade divergente.
- Edge function `query-perplexity` (modelo `sonar`, escopo canino restrito, extração de confidence high/medium/low, citações).
- Componente `<SourcePanel />` em `src/components/clinical/SourcePanel.tsx`: visibilidade híbrida por `useRoleView()` — tutor vê só síntese + nota neutra; vet vê painel colapsável com badge de peso, confiança e conflito; arquiteto vê também tags de modelo.
_files: src/services/multi-source-resolver.ts, src/components/clinical/SourcePanel.tsx, src/data/populationInsightsSeed.ts, src/components/administrador/priorizacoes/MultiSourcePlayground.tsx…_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.