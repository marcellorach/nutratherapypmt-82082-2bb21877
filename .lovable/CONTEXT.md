# Project context briefing (auto)
Generated: 2026-06-01T00:33:04.268Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.115.8

## Changes by area (last 14 days)
- **admin**: 46
- **curation**: 7
- **kg**: 6
- **meta**: 5
- **vet-ui**: 4
- **tutor-ui**: 1
- **clinical-pipeline**: 1

## Top 10 recent entries
### 2026-06-01 · [admin] ADDED — Catálogo de prompts com metadados + export PDF + log de auditoria completo
- `ai_system_prompts` ganhou colunas de contexto: `purpose`, `model_default`, `temperature`, `output_format`, `consumers[]`, `tags[]`, `example_input`, `last_used_at`. Os 24 prompts existentes foram seedados com propósito, modelo padrão e tags.
- `SystemPromptsCatalog` agora exibe badges (modelo, temperatura, formato, tags) e propósito de cada prompt, e oferece dois botões de export PDF: catálogo completo (com filtro aplicado) e prompt individual. PDFs são gerados via popup HTML estilizada + `window.print()`, preservando Unicode e dispensando libs externas.
- `sync-system-prompts` atualizado para sincronizar também os novos campos de metadados do manifest (`SystemPromptDef.purpose`, `model_default`, `temperature`, `output_format`, `consumers`, `tags`, `example_input`).
_files: supabase/functions/generate-audit/index.ts, supabase/functions/sync-system-prompts/index.ts, supabase/functions/_shared/system-prompts.ts, src/components/administrador/audits/TechnicalAuditsTab.tsx…_

### 2026-05-31 · [admin] ADDED — Auditoria técnica: auto-bump de versão + bibliografia obrigatória
- Botão "Run new audit" no `TechnicalAuditsTab` agora calcula a próxima versão automaticamente: se `v{SENEX_VERSION}` já existe na tabela `technical_audits`, incrementa o PATCH (7.0.0 → 7.0.1 → 7.0.2...) até achar uma versão livre. Isso permite re-rodar auditorias sem sobrescrever a anterior nem editar manualmente o senex version.
- `generate-audit` passou a anexar uma seção `<section id="references">` ao final dos relatórios PT e EN com bibliografia curada (37 entradas: Hetionet, TxGNN, PrimeKG, ChEBI, MONDO, MeSH, OMIA, Dog Aging Project, Hallmarks of Aging, GMLP/FDA, EMA, AVMA, RAG/Med-PaLM, etc.) ordenada por ano. Os prompts PT/EN exigem agora citações inline no formato (Autor, Ano) em todos os blocos, sem invenção de fontes.
- Files: src/components/administrador/audits/TechnicalAuditsTab.tsx, supabase/functions/generate-audit/index.ts
_files: src/components/administrador/audits/TechnicalAuditsTab.tsx, supabase/functions/generate-audit/index.ts_

### 2026-05-31 · [admin] FIXED — Auditoria técnica agora retoma por checkpoints curtos
- `generate-audit` deixou de depender de uma execução longa única e passou a persistir checkpoints no campo `outline`: outline salvo, blocos renderizados salvos um a um, sumário executivo salvo separadamente e montagem final só no último passo.
- Cada continuação agora é reinvocada internamente com credencial de serviço aceita pela própria função, corrigindo o caso em que o watchdog detectava travamento mas não conseguia retomar a auditoria automaticamente.
- O timeout por chamada de LLM foi reduzido e simplificado para 2 tentativas (primária + fallback), evitando ficar preso vários minutos no mesmo bloco antes de avançar.
_files: supabase/functions/generate-audit/index.ts_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.