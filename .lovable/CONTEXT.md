# Project context briefing (auto)
Generated: 2026-06-01T01:02:17.709Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: -

## Changes by area (last 14 days)
- **admin**: 48
- **curation**: 7
- **kg**: 6
- **meta**: 5
- **vet-ui**: 4
- **clinical-pipeline**: 2
- **tutor-ui**: 1

## Top 10 recent entries
### 2026-06-01 · [clinical-pipeline] CHANGED — Migração `hybrid-recommendation` para registro único de prompts
- `hybrid-recommendation` agora consome `hybrid_recommendation` (modo enrich) e `hybrid_recommendation_fallback` (modo fallback) via `fetchSystemPrompt`.
- Adicionada telemetria via `logPromptUsage` (latência, tokens, sucesso/erro) em `ai_prompt_usage_log`.
- Strings antigas preservadas como fallback verbatim caso o registro DB esteja inacessível.
_files: supabase/functions/hybrid-recommendation/index.ts, supabase/functions/_shared/system-prompts.ts_

### 2026-06-01 · [admin] CHANGED — Migração `generate-audit` para registro único de prompts
- `generate-audit` agora carrega o prompt-base PT/EN via `fetchSystemPrompt('audit_base_system_{pt,en}')` (manifest em `_shared/system-prompts.ts`).
- Override legado por `audit_prompt_versions` preservado; fallback verbatim mantém comportamento atual se o DB estiver offline.
- Compliance lint: 2/24 funções no registro (`generate-audit`, `relations-auditor`); 22 pendentes na fila de migração (Sprint 1 → 2 → 3 → 4).
_files: supabase/functions/generate-audit/index.ts, supabase/functions/_shared/system-prompts.ts_

### 2026-06-01 · [admin] ADDED — Telemetria de uso de prompts + lint de compliance do registro
_status: parcial_
- Nova tabela `ai_prompt_usage_log` (prompt_key, function_name, model, latency_ms, tokens_in, tokens_out, success, error). Leitura admin-only via RLS; insert via service role.
- Helper `supabase/functions/_shared/prompt-usage.ts` (`logPromptUsage`) — não-bloqueante, REST direta, zero deps. Pode ser chamado por qualquer edge function logo após a chamada LLM.
- Script `scripts/audit-prompt-registry.mjs` (npm: `audit:prompts`) detecta edge functions com `role: 'system'` hardcoded que ainda não usam `fetchSystemPrompt`/`getSystemPrompt`. Suporta `--json` e `--strict` (CI-friendly).
_files: supabase/functions/_shared/prompt-usage.ts, scripts/audit-prompt-registry.mjs, .lovable/plan.md_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.