# Project context briefing (auto)
Generated: 2026-06-01T01:28:51.288Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: n/a

## Changes by area (last 14 days)
- **admin**: 48
- **kg**: 7
- **curation**: 7
- **meta**: 6
- **clinical-pipeline**: 4
- **vet-ui**: 4
- **infra**: 3
- **tutor-ui**: 1

## Top 10 recent entries
### 2026-06-01 · [infra] CHANGED — Sprint 4 cohorts: 6 funções de geração/análise/originalidade no registro único
- Manifesto: 8 novas entradas em `_shared/system-prompts.ts` cobrindo todo o pipeline de cohorts sintéticos:
- `analyze_cohort_patterns` (gemini-3.5-flash, tool-call) — insights bilíngues por cohort com evidência quantitativa obrigatória.
- `analyze_all_cohorts_patterns` (gemini-3.5-flash, tool-call) — insights pan-populacionais cruzando múltiplos cohorts.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/analyze-cohort-patterns/index.ts, supabase/functions/analyze-all-cohorts-patterns/index.ts, supabase/functions/check-cohort-originality/index.ts…_

### 2026-06-01 · [infra] CHANGED — Sprint 3 utilitários: `enrich-pet-food-product`, `document-chat`, `suggest-taxonomy-terms` no registro único
- `enrich_pet_food_product`: entrada do manifesto reescrita com o prompt PT-BR real (schema AAFCO/FEDIAF verbatim) + metadata completa (model/temp/output/consumers/tags).
- `suggest_taxonomy_terms`: entrada reescrita como persona-base; a função concatena dinamicamente o `context` e a lista de categorias (`TAXONOMY_CATEGORIES`).
- Novo `document_chat_persona`: persona Markdown do chat sobre estudo (RAG + GraphRAG), com regras de citação literal e formato de seções.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/enrich-pet-food-product/index.ts, supabase/functions/suggest-taxonomy-terms/index.ts, supabase/functions/document-chat/index.ts_

### 2026-06-01 · [infra] CHANGED — Perplexity trio (`query-perplexity`, `perplexity-health`, `web-dosage-lookup`) no registro único
- Adicionados `query_perplexity_chat` e `perplexity_health_ping` ao manifesto `_shared/system-prompts.ts`; `web_dosage_lookup` recebeu metadata completa (model/temperature/output_format/consumers/tags).
- `query-perplexity`: prompt agora via `fetchSystemPrompt('query_perplexity_chat', SYSTEM_FALLBACK)`. Telemetria com `logPromptUsage` em sucesso (tokens_in/out do payload Perplexity) e em erro HTTP.
- `perplexity-health`: ping "ok" agora via `fetchSystemPrompt('perplexity_health_ping', …)`. Telemetria registra latência do ping e status.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/query-perplexity/index.ts, supabase/functions/perplexity-health/index.ts, supabase/functions/web-dosage-lookup/index.ts_

### 2026-06-01 · [meta] CHANGED — Meta-studies: `chat-meta-study` e `evaluate-meta-study-reliability` no registro único
- Adicionados `chat_meta_study_persona` e `evaluate_meta_study_reliability` ao manifesto `_shared/system-prompts.ts`.
- `chat-meta-study`: persona estática agora vem do registro (com fallback verbatim); contexto dinâmico do paper (claims/regras/evidências) preservado. Telemetria via `logPromptUsage` em sucesso e erro HTTP.
- `evaluate-meta-study-reliability`: prompt do sistema (curador sênior, tool-call `rate_study_reliability`) movido para o registro; carregado uma vez por chamada e reutilizado no loop sequencial. `logPromptUsage` em sucesso, erro HTTP e tool-call ausente.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/chat-meta-study/index.ts, supabase/functions/evaluate-meta-study-reliability/index.ts_

### 2026-06-01 · [kg] CHANGED — `kg-evidence-gap-fill` migrado para o registro único de prompts
- Adicionados `kg_gap_fill_gemini` e `kg_gap_fill_perplexity` ao manifesto `_shared/system-prompts.ts` (com metadata, consumers e tags).
- `assessWithGemini` e `assessWithPerplexity` agora carregam o system prompt via `fetchSystemPrompt(...)` com fallback verbatim para garantir continuidade quando o DB está indisponível.
- Telemetria via `logPromptUsage` em ambos os caminhos (success/erro/HTTP-fail), com latência e tokens quando disponíveis.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/kg-evidence-gap-fill/index.ts_

### 2026-06-01 · [clinical-pipeline] CHANGED — Sprint 1 (Clinical) concluído: registro único de prompts
- `project-pet-trajectory` → `project_pet_trajectory` (Gompertz + KG, modelo gemini-2.5-pro, output via tool-call). Smoke test 400 ok.
- `translate-and-categorize-conditions` → `translate_text`. Teste end-to-end retornou 200 (60 categorizadas).
- Telemetria `logPromptUsage` ativada em ambas (latência, tokens, erros).
_files: supabase/functions/project-pet-trajectory/index.ts, supabase/functions/translate-and-categorize-conditions/index.ts, supabase/functions/_shared/system-prompts.ts_

### 2026-06-01 · [clinical-pipeline] CHANGED — Migração `parse-pet-exam-pdf` para registro único de prompts
- `parse-pet-exam-pdf` agora consome `parse_pet_exam_pdf` via `fetchSystemPrompt` (manifesto atualizado para refletir o schema analyte-keyed real consumido por `pet_exams.analysis_data`).
- Telemetria via `logPromptUsage` (latência, tokens, sucesso/erro).
- Smoke test 400 (payload inválido) passou — boot sem erros.
_files: supabase/functions/parse-pet-exam-pdf/index.ts, supabase/functions/_shared/system-prompts.ts_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.