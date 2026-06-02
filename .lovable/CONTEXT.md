# Project context briefing (auto)
Generated: 2026-06-02T03:04:10.126Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.118.1

## Changes by area (last 14 days)
- **admin**: 42
- **clinical-pipeline**: 7
- **kg**: 7
- **infra**: 5
- **meta**: 5
- **curation**: 5
- **vet-ui**: 1

## Top 10 recent entries
### 2026-06-02 · [clinical-pipeline] CHANGED — IA Hardening Card #5c: hybrid-recommendation migrado para tool_choice (último do Card #5)
- Migração #1 do Card #5 (hybrid-recommendation) — última e mais sensível: substituído free-text JSON (regex `match(/```json/)` + `JSON.parse`) por `tools: [recommend_nutraceuticals]` + `tool_choice: { type: "function", function: { name: "recommend_nutraceuticals" } }`. O parse-via-regex era o ponto mais frágil dos 3 callers; com tool_choice o `model_response_invalid` deve cair próximo de zero.
- Schema único cobre ambos os modos (enrich / fallback): `nutraceuticals[]` com `{name, dosage, mechanism, evidenceLevel('AI-enriched'|'AI-generated'), condition, targetCondition?, closes_gaps?[]}` + `rationale` + `precautions[]` + envelope `abstain/abstain_reason('clinical_signal_insufficient')/abstain_detail`. `additionalProperties:false`. System prompt orienta qual `evidenceLevel` usar por modo.
- Card #3 PRESERVADO bit-a-bit (não desfeito):
_files: supabase/functions/hybrid-recommendation/index.ts_

### 2026-06-02 · [clinical-pipeline] CHANGED — IA Hardening Card #5b: extract-pet-clinical-data migrado para tool_choice (Gateway + abstain tipado)
- Migração #2 do Card #5 (extract-pet-clinical-data): substituído `responseMimeType: 'application/json'` (Gemini direto) por `tools: [extract_clinical_entities]` + `tool_choice: { type: "function", function: { name: "extract_clinical_entities" } }` via Lovable AI Gateway. Unifica o caminho com o #3 (parse-pet-exam-pdf) já migrado — uma única autenticação (`LOVABLE_API_KEY`), uma única semântica de tool-calling.
- GUARDRAIL Card #4 preservado: o schema do tool INCLUI `abstain: boolean`, `abstain_reason` (enum), `abstain_detail`. `abstain=true` com 5 listas vazias é resposta VÁLIDA do tool, não erro de parse. Pré-flight de abstain (texto curto, key ausente) PERMANECE — agora roda ANTES da chamada ao Gateway.
- Buckets de abstain desambiguados (essencial para a verificação ANTES/DEPOIS pedida):
_files: src/types/recommendation-confidence.ts, supabase/functions/extract-pet-clinical-data/index.ts_

### 2026-06-02 · [clinical-pipeline] CHANGED — IA Hardening Card #5a: parse-pet-exam-pdf migrado para tool_choice (schema fechado)
- Migração #3 do Card #5 (parse-pet-exam-pdf): substituído `response_format: { type: "json_object" }` por tool-calling forçado (`tools: [extract_exam_data]` + `tool_choice: { type: "function", function: { name: "extract_exam_data" } }`). `json_object` garantia apenas "é JSON válido", não "tem os campos certos" — agora o schema dos analitos (analyte/value/unit/ref_min/ref_max/flag) é parte do contrato com o modelo. Risco mitigado: unidade/valor no campo errado = interpretação clínica errada (ALT em mg/dL vs U/L muda a leitura).
- Schema fechado: `results` migrou de dict `{ analyte: { ... } }` para `array [{ analyte, value, unit, ref_min, ref_max, flag }]` no contrato do modelo. `additionalProperties: false` no item. Tipos opcionais expressos como `["number","null"]` para evitar inferência ambígua. `normalizeResults` ganhou compat dupla (aceita dict legado E array novo) — nenhum exame antigo persistido quebra.
- Extração de resposta: lê de `choices[0].message.tool_calls[0].function.arguments` (forçado pelo `tool_choice`). Fallback para `message.content` mantido por defesa, mas não deve ser exercido.
_files: supabase/functions/parse-pet-exam-pdf/index.ts_

### 2026-06-02 · [clinical-pipeline] ADDED — IA Hardening Cards #3+#4: abstain válido + provenance tipada + remoção do simpleExtraction
- Card #3 (envelope abstain + carimbo de proveniência em `hybrid-recommendation`): pré-flight de abstenção dispara SOMENTE por falta de sinal de entrada (sem `condition` OU sem qualquer sinal de pet/clínico). KG vazio NUNCA aciona abstain — gera resposta marcada com `source:'llm_fallback' + disclaimer:'no_kg_data'` (preservada). Toda resposta agora carrega envelope `{ source, disclaimer, abstain }`. Branch `llm_fallback` passa a carimbar `evidenceLevel:'AI-enriched'` por composto (antes ficava sem marca de origem, abrindo brecha para tutor receber recomendação sem tarja).
- Card #4 (remoção do `simpleExtraction`): `supabase/functions/extract-pet-clinical-data/index.ts` perdeu o fallback regex rule-based que fabricava entidades silenciosamente quando a chave do modelo estava ausente, o modelo retornava erro/vazio, ou o parse JSON falhava. Todos esses caminhos agora retornam envelope abstain (`clinical_signal_insufficient`) com arrays vazios — comportamento honesto, mensurável e rastreável pela telemetria do card #2.
- Tipos centralizados (Eixo B — proveniência): novo `CompoundProvenance = 'KG-backed' | 'AI-enriched' | 'AI-generated'` e `AbstainEnvelope` em `src/types/recommendation-confidence.ts`. Valores MANTIDOS em PascalCase/kebab por compatibilidade de UI — Bloco 2(e) do plano fica responsável por normalizar para snake_case e separar value↔label (evita dois churns no mesmo campo). Eixo A (qualidade científica em `src/rules/general/evidence-levels.ts`) permanece ortogonal e intocado.
_files: supabase/functions/extract-pet-clinical-data/index.ts, src/types/recommendation-confidence.ts, src/rules/general/evidence-levels.ts, supabase/functions/hybrid-recommendation/index.ts_

### 2026-06-02 · [infra] ADDED — IA Hardening Card #1: interpolate blindado + telemetria de variáveis ausentes
- `interpolate(tpl, vars, missing?)` em `supabase/functions/_shared/ai-task-router.ts` agora coleta toda chave `{{var}}` cujo valor cai para `undefined`/`null`/`""` em vez de substituir silenciosamente. Comportamento legado preservado (ainda retorna `""`), mas as ocorrências são registradas.
- `callAITask` agora emite `console.warn` por invocação com variáveis ausentes (`task=… caller=… missing_variables=[…]`) e persiste o array em `ai_task_invocations.missing_variables` (nova coluna `text[]` + índice GIN parcial via migração).
- Pré-requisito do card #6 (auditoria de `required_variables` por task) — sem este log, "variável nunca ausente" é indistinguível de "task nunca exercitada".
_files: supabase/functions/_shared/ai-task-router.ts_

### 2026-06-01 · [admin] SECURITY — Endurece ai-config: admin-only + segredos mascarados
- `supabase/functions/ai-config/index.ts` agora valida `Authorization: Bearer <jwt>` via `getClaims` e checa `user_roles.role = 'admin'` em TODAS as chamadas (GET, POST `get`/`set`/`test-neo4j`). Sem token → 401; sem admin → 403.
- GET deixa de devolver valores crus de segredos (`*_api_key`, `*_password`, `*_secret`, `*_token`): retorna apenas máscara `"••••XXXX"` (últimos 4) e um objeto `_meta` por chave com `{ is_set, last4, updated_at }`. Chaves não-sensíveis (URI, username, prompts) seguem retornando cruas para admins.
- POST `action='get'` bloqueia (403) leitura individual de chave sensível.
_files: supabase/functions/ai-config/index.ts, src/components/administrador/ConfiguracoesIATab.tsx_

### 2026-06-01 · [admin] ADDED — Gerenciamento in-app de chaves de API (sem Lovable Cloud)
- Nova tabela criptografada `public.api_keys` (pgcrypto) + view `api_keys_public` (somente metadados) + funções `encrypt_api_key`/`decrypt_api_key` (SECURITY DEFINER, restritas a `service_role`).
- Nova edge function `api-keys-manage` (admin-only, valida JWT + role) com ações `set` / `delete` / `test` — encripta o valor antes de gravar e faz ping real ao provedor para registrar `last_test_status` / `last_test_message`.
- Novo helper `supabase/functions/_shared/get-api-key.ts` — resolve chave do DB primeiro, fallback para `Deno.env`. `external-sources-status` já consome via helper, então UMLS/NCBI/Perplexity passam a refletir chaves cadastradas pelo UI.
_files: supabase/functions/_shared/get-api-key.ts, src/hooks/useApiKeys.ts, supabase/functions/api-keys-manage/index.ts, supabase/functions/external-sources-status/index.ts…_

### 2026-06-01 · [admin] ADDED — Hub unificado de Fontes Externas
- Nova aba `Knowledge Base → Fontes Externas` (`src/components/administrador/external-sources/ExternalSourcesHub.tsx`) consolida tudo que estava espalhado: status, chaves, mapeamento SNOMED/UMLS, importação de IDs (OMIA/MeSH/ChEBI), busca externa ao vivo e auditoria de ontologia em sub-abas (`?tab=external-sources&sub=...`).
- Sub-aba "Visão Geral" nova: cards por fonte (UMLS, SNOMED, MeSH, OMIA, ChEBI, PubMed, Perplexity) com configured/reachable/latência/entries, painel de chaves (`NLM_UMLS_API_KEY`, `NCBI_API_KEY`, `PERPLEXITY_API_KEY`) com links "Como obter", e mapa de impacto mostrando para cada fonte os pipelines e tabelas consumidores.
- Edge function `external-sources-status` (`verify_jwt = true`) faz ping ao vivo em todas as fontes públicas + endpoints autenticados e devolve contagens reais de `health_conditions.snomed_code`/`umls_cui`.
_files: src/components/administrador/external-sources/ExternalSourcesHub.tsx, supabase/functions/external-sources-status/index.ts, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx…_

### 2026-06-01 · [admin] CHANGED — Versionamento unificado: SENEX_VERSION como fonte única
- Novo `<VersionBadge />` (`src/components/system/VersionBadge.tsx`) — lê de `SENEX_VERSION`, `I18N_VERSION` e `lastChangelogDate` e é usado em header de Auditorias, Compliance e Organograma. Divergência entre superfícies fica visualmente impossível.
- `ComplianceDashboard`: removido `i18n_version: '1.86.3'` hardcoded — agora persiste `I18N_VERSION` real. Botão renomeado para "Snapshot compliance (v… · i18n …)" com badge da versão acima, deixando explícito que é snapshot da checklist curada amarrado à versão atual.
- `TechnicalAuditsTab`: removido auto-bump de PATCH. A auditoria SEMPRE herda exatamente `v{SENEX_VERSION}` — não inventa versão. Se já existe auditoria para a versão atual, o botão "Run new audit" fica desabilitado com tooltip instruindo a bumpar o marker `<!-- senex: x.y.z -->` em CHANGELOG.md + `npm run sync:changelog`.
_files: src/components/system/VersionBadge.tsx, src/components/administrador/compliance/ComplianceDashboard.tsx, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/pages/administrador/OrganogramaTab.tsx…_

### 2026-06-01 · [infra] CHANGED — Sprint 5 (final) — registro único 24/24: healthcheck, harness e planilha de nutracêuticos
- Manifesto: 2 novas entradas em `_shared/system-prompts.ts`:
- `ai_task_healthcheck_ping` (gemini-3-flash-preview, text) — ping mínimo "ok" usado pelo cron de healthcheck por task×model.
- `process_nutraceutical_spreadsheet` (gpt-4o-mini, json) — extração estruturada preservando notas de eficácia EXATAS de planilhas CSV/XLSX.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/ai-task-healthcheck/index.ts, supabase/functions/ai-task-test/index.ts, supabase/functions/process-nutraceutical-spreadsheet/aiProcessor.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.