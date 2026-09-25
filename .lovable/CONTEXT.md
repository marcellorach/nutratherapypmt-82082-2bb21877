# Project context briefing (auto)
Generated: 2026-09-25T16:10:59.137Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.135.0

## Changes by area (last 14 days)
- **auth**: 3
- **admin**: 2
- **curation**: 1

## Top 10 recent entries
### 2026-09-25 · [admin] ADDED — Governança de modelos, Fase 1: tela única e inventário honesto
- "Modelos & Prompts por Tarefa" passa a ser a única tela de modelos; a tela simples (5 chaves genéricas, das quais só `ai_model_chat` era lida) foi removida.
- Cada tarefa mostra modelo escolhido × realmente usado (`ai_task_invocations`, 30 dias), alerta de divergência, onde é usada, chamadas, taxa de erro, tempo médio e custo.
- Status real calculado do código (não do registro): inventório gerado por `scripts/generate-ai-inventory.mjs` → 42 rotinas: 11 obedecem à tela, 10 com modelo fixo, 14 sem tarefa registrada, 7 de diagnóstico. O registro dizia "conectado" para `relations_auditor` e `geroprotector_stack`, mas o código não obedece; a tela agora avisa.
_files: scripts/generate-ai-inventory.mjs, scripts/__tests__/ai-inventory.test.mjs, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx, src/hooks/useTaskModelUsage.ts…_

### 2026-09-23 · [admin] CHANGED — Modelo de leitura de PDF escolhido na tela de modelos por tarefa
- Nova tarefa "Leitura de PDF" em Modelos de IA por tarefa (`ai_configurations.ai_model_pdf_reading`); `gemini-file-search` resolve o modelo a cada execução (cache 30 s), com padrão `gemini-3.1-pro-preview`.
- Trava: ao salvar, o modelo é testado no Google (`action: validate_model`); nome inexistente é recusado com mensagem clara. Se o modelo gravado der 404, a leitura volta ao padrão e registra `model_source`.
- Corrigido o identificador para `gemini-3.1-pro-preview` (o nome sem sufixo dava 404); estudo do ácido ursólico reprocessado até a curadoria (65.103 caracteres, 344 trechos, 31 relações).
_files: supabase/functions/gemini-file-search/index.ts, supabase/functions/gemini-file-search/pdf-model.ts, src/components/administrador/configuracoes/AIModelSelector.tsx, src/components/administrador/settings/panels/EnginesPromptsPanel.tsx…_

### 2026-09-23 · [curation] FIXED — Resultado real do processamento assíncrono de estudos
- A fila e o card do estudo agora aguardam o resultado final do File Search, em vez de interpretar o aceite HTTP 202 do trabalho em segundo plano como sucesso.
- Falhas assíncronas impedem o envio à curadoria, encerram a fila com erro e mostram uma mensagem específica quando os créditos do provedor de IA estão esgotados.
- O início de cada tentativa grava `file_search.status = 'processing'`, evitando reutilizar o resultado de uma tentativa anterior.
_files: supabase/functions/gemini-file-search/index.ts, src/services/study-file-search-status.ts, src/services/__tests__/study-file-search-status.test.ts, src/hooks/ntai/useProcessingLogic.ts…_

### 2026-09-21 · [auth] FIXED — Papel correto no cabeçalho
- O cabeçalho agora exibe todos os seis papéis canônicos, incluindo Cientista, em vez de tratar papéis não administrativos como Tutor.
- Files: src/components/layout/Header.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json
_files: src/components/layout/Header.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json_

### 2026-09-13 · [auth] FIXED — Endurecimento das permissões antes do deploy
- `forwardIdentity()` deixa de degradar para `system`: sem token reconhecível (ou chave de serviço sem `x-initiator-id`) devolve 401; `system` só vale quando declarado explicitamente
- `enrich-knowledge-graph` ganhou gate `authorize()` com a nova chave `op.enrich_knowledge_graph` e `verify_jwt = true`; `batch-reprocess-triplets` gateado com `op.generate_triplets`
- Catálogo de permissões versionado em migração idempotente (57 chaves + grade admin 57 × edit), rodada duas vezes sem duplicar
_files: supabase/functions/_shared/authorization.ts, supabase/functions/enrich-knowledge-graph/index.ts, supabase/functions/batch-reprocess-triplets/index.ts, src/config/permission-catalog.ts…_

### 2026-09-13 · [auth] ADDED — Permissões editáveis por papel e por pessoa
- Catálogo `permissions` (47 abas + 8 operações + `admin.access`), grade `role_permissions`, exceções `user_permission_overrides` e histórico `permission_audit_log`; `has_permission` é a única fonte de verdade (15 políticas RLS de 02/09 reescritas sobre ela)
- Trava de último administrador no banco (`prevent_last_admin_removal`), validada em execução com rollback
- Gates server-side em `parse-study` (`op.parse_study`), `gemini-file-search` (`op.gemini_file_search`), `extract-study-entities` (`op.extract_study_entities`) e `generate-triplets` (`op.generate_triplets`), com propagação de identidade via `x-initiator-id` nas cadeias (`gemini-file-search`, `enrich-knowledge-graph`, `batch-reprocess-triplets`) e mecanismo explícito `system` para chamadas agendadas
_files: supabase/functions/_shared/authorization.ts, supabase/functions/parse-study/index.ts, supabase/functions/gemini-file-search/index.ts, supabase/functions/extract-study-entities/index.ts…_

### 2026-08-31 · [infra] ADDED — Telemetria e retry com backoff em imports dinâmicos
- Novo `src/lib/assetFailureTelemetry.ts`: registro compartilhado de falhas de asset (URL, nome do chunk, tentativa, willReload, build, timestamp) em `sessionStorage` + evento `asset-preload-failure`.
- `lazyWithRetry` agora expõe `loadWithRetry` com 2 retries em backoff (300ms/900ms), telemetria por tentativa e um único reload protegido por flag de sessão.
- Todos os imports dinâmicos restantes do admin passaram a usar `lazyWithRetry` (AdminPainel, OntologyHub, TranslationsHub, TripletsHub, VisualizationCard, LazyComponents).
_files: src/lib/assetFailureTelemetry.ts, src/lib/__tests__/lazyWithRetry.test.ts, src/lib/lazyWithRetry.ts, src/components/system/AssetFailureBanner.tsx…_

### 2026-08-23 · [curation] ADDED — Re-extração forçada por estudo (UI + auditoria)
- Painel "Re-extração forçada" no detalhe do estudo (aba Análise) com contagens atuais de mecanismos/desfechos, diálogo de confirmação e histórico das últimas 10 execuções.
- Cada disparo chama `extract-study-entities` com `force_reextract: true` e grava evento em `study_audit_logs` (`action_type: force_reextract`) com contagens antes/depois.
- Files: src/components/administrador/estudos/detalhes/ForceReextractPanel.tsx, src/components/administrador/estudos/detalhes/tabs/AnaliseTab.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts
_files: src/components/administrador/estudos/detalhes/ForceReextractPanel.tsx, src/components/administrador/estudos/detalhes/tabs/AnaliseTab.tsx, src/locales/pt/translation.json, src/locales/en/translation.json…_

### 2026-08-23 · [curation] FIXED — Guarda de ownership nos demais escritores de analysis_data
- `mergeAnalysisDataFromOtherWriter` / `mergeExtractedDataFromOtherWriter`: merge na direção oposta — preserva campos extract-owned com conteúdo real e deixa o escritor atualizar os próprios campos.
- Aplicado em `gemini-file-search`, `parse-study` e `generate-triplets` (todos passam a reler o estado antes de escrever).
- Shim de conditions do gemini movido de `clinical_outcomes` para `condition_efficacy_shim`, eliminando a colisão semântica na origem.
_files: supabase/functions/_shared/analysisDataMerge.ts, supabase/functions/gemini-file-search/index.ts, supabase/functions/parse-study/index.ts, supabase/functions/generate-triplets/index.ts…_

### 2026-06-18 · [admin] ADDED — Inventário de modelos + Aliases por tarefa (Configurações → Prompts)
- Nova tabela `ai_task_aliases` (PK `task_id`, com `alias_label_pt`, `alias_label_en`, `real_model`, `description`) — RLS: select para `authenticated`, write somente `is_admin()`. Seed inicial com 25 aliases cobrindo todas as tarefas governadas + entradas `__embeddings__` e `__perplexity_search__`.
- Nova tabela `ai_model_inventory_snapshots` (jsonb + timestamps) para histórico do inventário resolvido. RLS admin-only.
- Nova edge function `model-inventory` (read-only por padrão; POST persiste snapshot) — resolve modelo ativo por `task_id` como o runtime: 1) override em `ai_configurations`, 2) `ai_prompt_versions` ativo, 3) fallback inline. Marca `governed=false` para overrides hard-coded (`extract-meta-study`, `kg-evidence-gap-fill`, `web-dosage-lookup`, `vectorize-study`, Perplexity).
_files: supabase/functions/_shared/model-alias.ts, src/hooks/useTaskAlias.ts, supabase/migrations/...ai_model_inventory_and_aliases.sql, supabase/functions/model-inventory/index.ts…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.