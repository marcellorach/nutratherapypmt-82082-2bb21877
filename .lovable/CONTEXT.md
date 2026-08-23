# Project context briefing (auto)
Generated: 2026-08-23T04:58:39.298Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.126.0

## Changes by area (last 14 days)
- **curation**: 2

## Top 10 recent entries
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

### 2026-06-17 · [admin] ADDED — Frente C: migração dos prompts hardcoded para o catálogo (com auditoria honesta)
- Auditoria caso-a-caso da lista de 12 funções: revelou que só 5 funções têm prompt próprio — as outras 7 são orquestradores/pass-through/algorítmicas sem LLM dedicado.
- 6 novas chaves no manifest (`supabase/functions/_shared/system-prompts.ts`) — todas com `purpose`, `model_default`, `temperature`, `output_format`, `consumers`, `tags` preenchidos:
- `generate_triplets_phase1_discovery` — Phase 1 (free discovery) bioquímico veterinário.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/generate-triplets/index.ts, supabase/functions/extract-meta-study/index.ts, supabase/functions/generate-showcase/index.ts…_

### 2026-06-17 · [admin] ADDED — System Prompts: versão Senex (7.2.4), selo unificado nas 3 abas e audit log
- Versão sincronizada: `APP_VERSION` agora reflete a versão do Senex AI (`7.2.4`) + novo `PROMPTS_REVISION` (4º dígito) que incrementa apenas quando o manifest de prompts muda. Selo exibido: "Sistema 7.2.4 · Prompts rev. 1". Reseta para 0 a cada bump de APP_VERSION.
- Selo unificado em todas as abas de prompts: `IntegrityBadge` extraído de `SystemPromptsCatalog` para novo componente `PromptsIntegrityBadge.tsx`, reutilizado nas abas Recomendações, Extração e System (modo `compact` para as duas primeiras). Mensagem clara separa dois sinais distintos: "Última modificação dos prompts" (max `updated_at` em `ai_system_prompts`) vs "Última verificação" (`checked_at` em `ai_system_prompts_integrity_check`) — resolve a confusão "verificado hoje mas desatualizado".
- Auto-verificação por revisão: chave do localStorage agora é `${APP_VERSION}.${PROMPTS_REVISION}` — qualquer bump de prompts dispara verificação na próxima visita, mesmo sem mudar a versão do sistema.
_files: src/config/app-version.ts, src/components/administrador/configuracoes/PromptsIntegrityBadge.tsx, src/components/administrador/configuracoes/SystemPromptsCatalog.tsx, src/components/administrador/PromptConfigurationTab.tsx…_

### 2026-06-17 · [admin] ADDED — Catálogo de System Prompts: seed completo + verificação contínua de integridade
- Frente A (seed): 21 chaves do manifest (`supabase/functions/_shared/system-prompts.ts`) que nunca tinham sido propagadas ao banco agora estão em `ai_system_prompts`. Catálogo passou de 24 → 45 linhas (alinhado 1:1 com o manifest).
- Frente B (`sync-system-prompts` idempotente): edge function trocada de `UPDATE`-only para `INSERT-or-UPDATE`. Toda nova chave adicionada ao manifest entra no DB automaticamente no próximo "Sincronizar com o código". Novo status `inserted` no relatório. Family/display_name das novas linhas são derivados automaticamente da chave; admin pode renomear.
- Frente E (verificação contínua + selo na UI):
_files: supabase/functions/_shared/system-prompts.ts, src/config/app-version.ts, supabase/functions/sync-system-prompts/index.ts, supabase/functions/verify-system-prompts/index.ts…_

### 2026-06-15 · [kg] FIXED — Playground multi-fonte: KG busca por termo real + cohort canônico + diagrama de mecanismo
- Root cause (KG vazio para curcumina): `kgProvider` em `src/services/multi-source-resolver.ts` chamava `get_relations_graph_data(p_limit:500)` e filtrava as keywords client-side. Curcumina existe (127 triplets em `triplet_extractions`), mas não nas 500 primeiras edges — daí "Knowledge Graph curado: —" em uma pergunta que o KG cobre amplamente.
- Fix KG: nova RPC `public.search_relations_by_term(p_terms text[], p_limit int)` faz `ILIKE` direto em `subject_name`/`object_name` filtrando `curation_status='approved' OR auto_approved=true`, ordenando por `llm_confidence`. Provider passa a chamar a RPC. Validado: pergunta de curcumina retorna 10+ relações (Curcumin ⊣ NF-κB, ↑ Nrf2, ↓ TLR4, previne Alzheimer/Parkinson).
- Fix cohort (eco lexical): `cohortProvider` parou de fazer substring de palavras da query em `notes`. Agora detecta entidade canônica (raça via `pet_profiles.breed`, condição via `pet_conditions.condition_name`) presente no texto da pergunta e filtra a contagem real. Sem entidade reconhecida → claim explícito ("sem entidade clínica reconhecida"), nunca eco da query.
_files: src/services/multi-source-resolver.ts, src/components/clinical/MechanismDiagram.tsx, src/components/clinical/SourcePanel.tsx, src/i18n.ts_

### 2026-06-09 · [curation] FIXED — Ingestão: gate qualitativo + truncamento relativo + Call 1 dedicada
- Root cause: chamada monolítica do `gemini-file-search` competia `full_text` com 22 outras propriedades clínicas no mesmo tool call (`gemini-3-pro-preview`), causando truncamento progressivo do texto completo e queda na análise — sintoma do estudo Spermine (09/06) com `analysis_data` zerado mas `kanban_status='processed'`, e do CoQ10 (22/05) caindo no fallback `structured_data_enhanced` com 0 nutracêuticos.
- Fix estrutural — split em 2 calls no `gemini-file-search`: nova função `acquireFullText()` (Call 1, `gemini-2.5-flash`, schema minimal `{ full_text: string }`) roda em paralelo conceitual e sobrescreve `extractedData.full_text` quando entrega texto maior; a Call 2 existente (`extractWithFileSearch`) preserva as 22 propriedades clínicas. Metadados bibliográficos seguem propriedade exclusiva do `parse-study` (Call 1 nunca grava em title/authors/year/abstract/doi).
- Gate de 3 estados (qualitativo, SEM char-floor absoluto) persistido em nova coluna `processed_studies.ingestion_stages jsonb`:
_files: supabase/functions/parse-study/index.ts, supabase/functions/gemini-file-search/index.ts, supabase/functions/extract-study-entities/index.ts, supabase/functions/vectorize-study/index.ts…_

### 2026-06-08 · [admin] FIXED — Auditorias: tag CONFIDENCIAL sem encavalamento + propriedade PetMoreTime reforçada
- `audit-pdf-generator.ts`: banner CONFIDENCIAL agora usa layout flex real (tag em `<span>` com `flex-shrink:0`), eliminando a sobreposição do pseudo-elemento `::before` sobre o texto observada em PT/EN.
- Footer discreto fixado em todas as páginas no `@media print` (`position:fixed; bottom:0`, 9px italic, "CONFIDENCIAL" em vermelho sóbrio inline), mantendo aparição única em tela.
- Copy do banner e do rodapé reforçam propriedade exclusiva: "Plataforma Senex AI · Engine Senex AI v7 · © PetMoreTime. Todos os direitos reservados. Tecnologia, modelos e conteúdo são propriedade exclusiva da PetMoreTime." (PT/EN equivalentes). Vale para os relatórios técnicos e showcase, tanto em download quanto em print.
_files: src/components/administrador/audits/audit-pdf-generator.ts_

### 2026-06-08 · [admin] CHANGED — Pilares científicos: TxGNN e Hetionet adicionados como PARTIAL
- AboutSenexTab: incluídos TxGNN (Huang 2024, Nature Medicine) e Hetionet/DWPC (Himmelstein 2017, eLife) no card "Pilares científicos (inspiração × implementação)" com status `PARTIAL`, refletindo `core_rule_evidence` já existente: TxGNN → RC-001 (doc-only), RC-008 e RC-013 (ativas); Hetionet → RC-008 e RC-014 (ativas). Inspirações ainda fora de runtime (zero-shot via metric learning + GraphMask; DWPC + permutação de rede) explicitadas.
- Diagrama do engine: nota em `O3` (Recommendation engine) marca TxGNN zero-shot + Hetionet DWPC como inspirações não-runtime. Banner de "Honestidade arquitetural" amplia a lista de inspirações/planejado.
- Esclarecimento: a lista de Pilares não é gerada por LLM — é um array TypeScript curado em `AboutSenexTab.tsx`. A fonte dinâmica papel↔RC continua sendo `core_rule_evidence` (consumida pela aba Fundamentos Arquiteturais).
_files: src/components/administrador/AboutSenexTab.tsx_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.