# Project context briefing (auto)
Generated: 2026-05-31T04:26:52.593Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.115.8

## Changes by area (last 14 days)
- **admin**: 52
- **curation**: 7
- **kg**: 6
- **meta**: 5
- **vet-ui**: 4
- **tutor-ui**: 2
- **clinical-pipeline**: 1

## Top 10 recent entries
### 2026-05-31 · [admin] FIXED — Auditorias futuras travadas no padrão standalone da v5.2.0
- A edge function `generate-audit` agora rejeita relatórios simplificados e força regeneração quando o HTML vier abaixo do baseline estrutural da v5.2.0 (densidade mínima, seções-chave, tabelas e ausência de rótulos como "teste rápido" ou "paridade parcial").
- O prompt passou a tratar qualquer escopo curto como ênfase adicional, nunca como permissão para gerar auditoria reduzida; o padrão obrigatório agora é standalone + cumulativo.
- `TechnicalAuditsTab` deixou de usar uma versão i18n hardcoded antiga e passou a ler `I18N_VERSION` diretamente de `src/i18n.ts`, evitando novos relatórios com metadado retrocedido.
_files: src/i18n.ts, supabase/functions/generate-audit/index.ts, src/components/administrador/audits/TechnicalAuditsTab.tsx_

### 2026-05-27 · [curation] CHANGED — Evidência quantitativa obrigatória + re-análise por insight
- `analyze-cohort-patterns`: schema de `evidence` agora exige campos estruturados (`n_supporting`, `n_total`, `prevalence`, `comparison_baseline`, `effect_size`, `notes`). Prompt reforçado para derivar números dos agregados ou não emitir o insight.
- Edge function aceita `insight_id` para re-analisar 1 insight existente (UPDATE in-place com a melhor evidência quantitativa).
- Novo botão "🧪" em cada card de Population Insights chama a re-análise individual.
_files: supabase/functions/analyze-cohort-patterns/index.ts, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/i18n.ts_

### 2026-05-27 · [admin] CHANGED — Rebatizar "Priorizações" → "AI Scientist" e mover para Research & Development
- Aba `priorizacoes` renomeada para AI Scientist e movida do grupo `governance-ai` para `research` (primeira posição da sidebar de R&D).
- Sidebar: removido item de Governance & AI, adicionado em `ResearchGroup` com ícone `Sparkles`.
- Header da página `PriorizacoesTab` atualizado; nova chave i18n `admin.sidebar.research.aiScientist` (PT/EN = "AI Scientist").
_files: src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ResearchGroup.tsx, src/components/administrador/sidebar/groups/GovernanceAIGroup.tsx, src/pages/administrador/PriorizacoesTab.tsx…_

### 2026-05-27 · [curation] CHANGED — Painel de evidência no dialog de validação vet-curador
- Problema identificado: o dialog de validação mostrava só título/resumo/confiança/sinais, sem expor os dados que sustentariam a decisão. O campo `evidence` dos insights gerados por `analyze-cohort-patterns` veio vazio (`{}`) — a confiança 80% era auto-declarada pelo LLM, sem nada auditável.
- Painel "Evidência disponível" embutido no `VetCuratorReviewDialog`, computado em tempo real a partir de `pet_profiles` + `pet_conditions` + `pet_exams` da cohort de origem (sem chamada de LLM):
- Suporte populacional: N/total pets que casam com os sinais + barra de progresso; aviso âmbar automático se N<10 ou suporte<20%; aviso vermelho se zero matches.
_files: src/hooks/useInsightEvidence.ts, src/components/administrador/priorizacoes/VetCuratorReviewDialog.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/data/prioritizationBoard.ts_

### 2026-05-27 · [curation] ADDED — Validação vet-curador de insights de cohort
- Governança clínica fechada: cada `cohort_insights` ganhou `vet_review_status` (`pending`/`approved`/`rejected`/`needs_changes`), `vet_review_notes`, `vet_reviewed_by` e `vet_reviewed_at`. Default `pending`, com check constraint e índice no status.
- Badge no card do kanban Population Insights v0 mostra o status com cor (cinza/verde/vermelho/âmbar) e abre o dialog de revisão ao clicar.
- Botão "validar" em cada card abre `VetCuratorReviewDialog`: exibe título, resumo, confiança, sinais, model e o status atual; campo de notas clínicas; três ações — Aprovar (verde), Rejeitar (vermelho), Requer ajustes (âmbar).
_files: src/components/administrador/priorizacoes/VetCuratorReviewDialog.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/data/prioritizationBoard.ts_

### 2026-05-27 · [admin] FIXED — Cohort stats: canonicalização PT/EN + ref não-numérico
- Duplicação de taxonomia resolvida no agregador de cohort stats: "Osteoarthritis" + "Osteoartrite" agora somam como uma só condição (e idem para os demais mapas EN↔PT já existentes em `condition-name-localizer`). Novo helper `canonicalConditionKey` faz o lookup reverso PT→EN antes da contagem; nome exibido respeita o idioma ativo via `localizeConditionName`.
- Top flags laboratoriais normalizadas: novo `lab-flag-canonicalizer.ts` unifica abreviaturas/PT (HCT↔Hematócrito, PLT↔Plt, ALT↔TGP, AST↔TGO, FA↔ALP, Ureia↔BUN, Creatinina↔Creatinine, etc.). Counts somados, top-12 mantido.
- `ref ?–?` ocultado: `formatLabValue` em `InsightDrillDownDialog` agora só emite a faixa de referência quando ao menos um dos limites é numérico — exames qualitativos (citologia de linfoma linfoblástico) ficam sem o bloco feio.
_files: src/services/condition-name-localizer.ts, src/services/lab-flag-canonicalizer.ts, src/components/administrador/priorizacoes/CohortStatsPanel.tsx, src/components/administrador/priorizacoes/InsightDrillDownDialog.tsx…_

### 2026-05-27 · [admin] ADDED — Painel de Priorizações: 2 cards novos + tag "Valida vet-curador"
- Novo card `cohort-suggester-hardening` (in_test) representando o trabalho do dia: edge function `suggest-cohort-ideas` com gemini-3.1-pro-preview, validação server-side e fallback gpt-5.4.
- Novo card `cohort-suggestions-clinical-review` (next) para a revisão clínica das 6 sugestões geradas pela vet-curadora — bloqueia o envio do documento ao parceiro clínico sem validação.
- Novo campo `requiresVetCuratorValidation` no tipo `PrioritizationCard` + badge rosa "Valida vet-curador" (ícone estetoscópio) no `PrioritizationCardItem`. Aplicado inicialmente ao card de revisão clínica.
_files: src/data/prioritizationBoard.ts, src/components/administrador/priorizacoes/PrioritizationCard.tsx_

### 2026-05-26 · [admin] FIXED — suggest-cohort-ideas: modelo + validação + retry/fallback
- Trocado modelo primário de `gemini-3.5-flash` (ignorava o JSON Schema do tool-call: devolvia 5 cohorts sem `target_model_id` nem `record_requirements`) para `google/gemini-3.1-pro-preview`.
- Adicionada validação server-side das 4 regras duras: exatamente 6 cohorts, 6 `target_model_id` distintos cobrindo todos os modelos, `record_requirements` não-vazio em todos, ≥2 cohorts com `cohort_population` deceased/mixed.
- Pipeline com 3 camadas: tentativa primária → retry no primário com mensagem de correção apontando as `issues` → fallback automático para `openai/gpt-5.4`. 429/402 do primário disparam fallback direto.
_files: supabase/functions/suggest-cohort-ideas/index.ts_

### 2026-05-26 · [admin] ADDED — 6 modelos preditivos + cohorts ancorados (amplo × estratificado, vivos × falecidos)
- Catálogo de modelos preditivos expandido de 4 → 6: adicionados `mortality-risk-window` (Risco de Mortalidade e Janela de Intervenção — 100% treinado em cães já falecidos como gold label) e `treatment-adherence` (Previsão de Adesão ao Tratamento — sinais operacionais PetLove de recompra/agendamentos/check-ins). Ambos entram com status `initial`, `totalPetsMonitored=0` e `nextMilestone` apontando para o primeiro cohort-âncora — sem mock inflado.
- Sugestões de cohort reorientadas para VALOR PetLove (não preenchimento de KG): novo system prompt em `suggest-cohort-ideas` orienta o LLM a propor exatamente 6 cohorts (1 por modelo), com pelo menos 2 cohorts de cães falecidos (`deceased`/`mixed`) para alimentar Disease Progression e Mortality Risk com trajetórias completas pré-óbito.
- Duas larguras por cohort: `broad` (N=1000–2500, padrão diluído, viabilidade alta) e `stratified` (N=150–400, padrão nítido, impacto alto) — mistura livre entre os 6 cohorts.
_files: src/components/administrador/modelosPreditivos/data/predictiveModelsData.ts, src/components/administrador/priorizacoes/CohortAISuggester.tsx, supabase/functions/suggest-cohort-ideas/index.ts, src/locales/pt/translation.json…_

### 2026-05-26 · [admin] ADDED — Senex 7.0: Painel de Priorizações com histórico + Population Insights com proveniência
- Kanban de Priorizações com log de movimentações: nova tabela `prioritization_history` (card_id, from_status, to_status, moved_at, note) — toda movimentação de card no Kanban grava entrada automaticamente. Card mostra "Criado dd/mm/aa · N mov." com expansão completa do histórico (origem → destino + data).
- Card #1 (Role visualization layer) marcado como entregue via override no banco, com histórico semeado.
- Seed do histórico dos 10 cards do roadmap em 25/05/26 para servir de baseline.
_files: src/data/prioritizationBoard.ts, src/components/administrador/priorizacoes/PrioritizationBoard.tsx, src/components/administrador/priorizacoes/PrioritizationCard.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.