# Project context briefing (auto)
Generated: 2026-04-30T12:39:46.442Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.41.7

## Changes by area (last 14 days)
- **admin**: 7
- **meta**: 7
- **vet-ui**: 3
- **kg**: 2

## Top 10 recent entries
### 2026-04-30 · [admin] ADDED — Seletor de modelo Perplexity + tester genérico de provedores
- `perplexity-health` agora retorna `supported_models` (catálogo Sonar) e aceita `model` no body/querystring para pingar o modelo selecionado; em falha, devolve `status`, `status_text`, `provider_error`, `hint` (401 chave inválida, 403 modelo fora do plano, 429 quota, 5xx provedor) e ecoa `model` testado.
- Nova edge function `provider-health` (verify_jwt) que valida autenticação e escopo das chaves OpenAI / Claude / Gemini / Grok / Perplexity contra o endpoint real de chat de cada provedor e expõe HTTP status, mensagem de erro do upstream e dica acionável.
- `kg-evidence-gap-fill` lê `ai_configurations.perplexity_gap_fill_model` (com override via body `perplexity_model`) e propaga a escolha para `assessWithPerplexity` em vez do hard-coded `sonar-reasoning-pro`.
_files: supabase/functions/perplexity-health/index.ts, supabase/functions/provider-health/index.ts, supabase/functions/kg-evidence-gap-fill/index.ts, src/components/administrador/configuracoes/PerplexityStatusCard.tsx…_

### 2026-04-29 · [admin] ADDED — Monitor de saúde + aba de API key para Perplexity
- Nova edge function `perplexity-health` (verify_jwt) que executa um ping `sonar` ("ping" → "ok", `max_tokens: 5`) e retorna `{ configured, connected, latency_ms, model, checked_at, error? }`. Detecta ausência de `PERPLEXITY_API_KEY`, falhas HTTP do upstream e mede latência real do round-trip.
- Novo componente `PerplexityStatusCard` em Configurações IA: roda o health-check no mount + botão "Testar", mostra badges Conectado/Falha/Não configurado/Verificando com modelo e latência, exibindo `checked_at` formatado.
- `ConfiguracoesIATab`: adicionada aba Perplexity (TabsList agora `grid-cols-8`) com `ApiKeyForm` + validador (`pplx-` + ≥ 20 chars) + card explicativo do uso no KG Gap-Fill, novo `ApiStatusItem` ✨ "Perplexity – Sonar Academic – KG Gap-Fill" no painel "Status das Conexões", e `<PerplexityStatusCard />` montado abaixo do Neo4jStatusCard.
_files: supabase/functions/perplexity-health/index.ts, src/components/administrador/configuracoes/PerplexityStatusCard.tsx, src/components/administrador/ConfiguracoesIATab.tsx, src/i18n.ts_

### 2026-04-29 · [vet-ui] ADDED — Auto-preview da projeção e arestas provisórias no subgrafo após gap-fill
- `EvidenceGapCard`: novo callback `onTripletsAdded(count)` disparado quando o gap-fill (Perplexity → PubMed) retorna `triplets_pending > 0`. Antes o vet precisava ativar manualmente o toggle "Pré-visualizar com pendentes" no Digital Twin para ver o impacto.
- `DigitalTwinDog`: ao receber `onTripletsAdded`, liga `previewPending=true` e invalida `['pet-trajectory-projection', petId]` + `['patient-pending-gap-fill-triplets', petId]` — a projeção é re-fetchada incluindo os triplets recém-importados e o KPI "Ganho com protocolo" reage instantaneamente.
- `usePatientPendingGapFillTriplets`: novo hook que busca triplets `pending` cujo `approval_chain.source ∈ {pubmed_gap_fill, perplexity_gap_fill}` filtrando client-side por compostos do stack OU condições do pet (matching `subject_name`/`object_name`).
_files: src/components/pet/EvidenceGapCard.tsx, src/components/pet/DigitalTwinDog.tsx, src/components/pet/PatientKnowledgeSubgraph.tsx, src/hooks/useKgEvidenceGapFill.ts…_

### 2026-04-29 · [kg] ADDED — Perplexity-first no Gap-Fill + busca a partir do diálogo de triplets faltantes
- `kg-evidence-gap-fill`: nova estratégia em duas passadas — Perplexity Sonar (academic, json_schema) primeiro, PubMed E-utilities + Gemini como fallback. Perplexity retorna JSON estruturado com `efficacy_0_5`, `evidence_level`, `species_context`, `cited_pmids`, `cited_dois`, `cited_urls`, `llm_confidence`. PMIDs citados pelo Perplexity são validados via NCBI esummary antes de virarem `scientific_studies` (anti-alucinação). `source_api` distingue `perplexity_gap_fill` × `pubmed_gap_fill`; `approval_chain` registra `cited_urls` e provider.
- `kg-evidence-gap-fill`: aceita lista direta `pairs: [{ compound_en, condition_en, condition_id? }]` no body, permitindo o `MissingTripletsDialog` mandar exatamente os pares que ele já calculou em vez de o gap-fill recalcular.
- `kg-missing-triplets` + `kg-evidence-gap-fill`: declarados em `supabase/config.toml` (`verify_jwt = true`) — ambos não estavam no toml e por isso não tinham logs no servidor (causa do `Failed to send a request to the Edge Function` no botão "Ver triplets faltantes"). Adicionado log de boot + early-return 500 com mensagem clara se faltar `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
_files: supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/kg-missing-triplets/index.ts, src/components/pet/MissingTripletsDialog.tsx, src/components/pet/EvidenceGapCard.tsx…_

### 2026-04-29 · [vet-ui] FIXED — Gap-Fill robusto + preview de pendentes + lista de condições no Digital Twin
- `kg-evidence-gap-fill`: logging detalhado em todas as etapas (auth, discovery, busca, geração de triplets); shortlist de compounds prioriza o stack recomendado do pet (snapshot `pet_clinical_analysis_snapshots`) antes do fallback geriátrico; busca PubMed em duas passadas (estrita canine → relaxada `unspecified`) com `species_hint` registrado no triplet; CORS/`Cache-Control: no-store` garantidos em todos os retornos.
- `EvidenceGapCard`: toasts diferenciados (sucesso, sem pares, sem triplets, erro) e card inline com breakdown da última busca (pairs/studies/pending + lista por par com status `ok | no_pubmed_results | assessment_failed | error | dry_run` e `species_hint`).
- `project-pet-trajectory`: aceita flag `include_pending_gap_fill` e, quando ativo, inclui triplets `pending` originados de `pubmed_gap_fill` no cálculo de cobertura/years_gained, marcando contribuições como `provisional: true`.
_files: supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/project-pet-trajectory/index.ts, src/hooks/usePetTrajectoryProjection.ts, src/hooks/useKgEvidenceGapFill.ts…_

### 2026-04-29 · [kg] ADDED — Pipeline KG Evidence Gap-Fill (PubMed → triplets pendentes)
- Nova edge function `kg-evidence-gap-fill`: para cada par (composto canônico × condição do pet) sem evidência forte no KG (`approved` com `extraction_confidence ≥ 0.6`), busca o PubMed via NCBI E-utilities (`esearch` + `efetch`), extrai abstracts e usa Gemini (`google/gemini-3-flash-preview`, tool-calling) para gerar `efficacy_0_5`, `evidence_level`, `rationale` e `cited_pmids`.
- Persiste estudos em `scientific_studies` (`source_api='pubmed_gap_fill'`, dedup por `pmid`) e cria triplets em `triplet_extractions` SEMPRE como `curation_status='pending'` (mesmo com alta confiança — protocolo Curation Gatekeeper). `approval_chain` registra `{source: 'pubmed_gap_fill', cited_pmids}` para rastreabilidade.
- Acesso restrito a admin (validação via `getClaims` + `user_roles`). Rate limit serial: 360ms entre chamadas PubMed (110ms se `NCBI_API_KEY` for configurada).
_files: supabase/functions/kg-evidence-gap-fill/index.ts, src/hooks/useKgEvidenceGapFill.ts, src/components/pet/EvidenceGapCard.tsx, src/components/pet/DigitalTwinDog.tsx…_

### 2026-04-29 · [vet-ui] CHANGED — Digital Twin agora compara cenários ao longo dos anos
- `DigitalTwinDog` reescrito para consumir `usePetTrajectoryProjection` (mesma fonte do `BiologicalTimeline`): renderiza duas silhuetas lado a lado (Sem protocolo × Com protocolo) e um slider 0–8 anos. Antes só mostrava o estado atual, sem variação temporal nem cenário comparativo.
- Para cada ano projetado, os marcadores anatômicos refletem severidade real (`existing_conditions[].projected_severity_label`), risco emergente (`new_conditions[].probability` ≥ 20% com anel tracejado âmbar) e cobertura do stack (`coverage_by_condition[].kg_covered` → estrela ★ verde no marcador).
- KPIs alinhados com o `BiologicalTimeline`: idade biológica, cronológica, anos restantes e ganho com protocolo (`years_gained` da edge function `project-pet-trajectory`).
_files: src/components/pet/DigitalTwinDog.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts, src/locales/pt/translation.json…_

### 2026-04-29 · [admin] ADDED — Testes de inferArea e ordenação real do parser
- 17 novos testes em `scripts/__tests__/sync-changelog.test.mjs` cobrindo: prioridade `kg > infra` em `supabase/functions/kg-*`, `triplet`/`process-pdf`/`extract` → `curation`, `biomedical-taxonomy` e qualquer path com `knowledge-graph|neo4j` → `kg`, `base-knowledge` antes de regras genéricas, `i18n` para `src/locales/` e `src/i18n.ts`, `auth` para `AuthContext`/`pages/Auth`, `projectOrganograma`/`projectChangelog` → `admin`, ordem-importa quando múltiplos paths casam, fallback `meta`
- Testes de ordenação validando: data desc estrita com seções intercaladas (`## [Unreleased]` × `## [1.0.0]`), cabeçalhos `### Added - YYYY-MM-DD 🗺️ Título` (emoji direto, sem separador), múltiplas linhas em branco e bullets indentados, datas duplicadas mantendo entradas distintas, `## [versão]` não confundido com cabeçalho de entrada, fallback para `inferArea` quando metadata não declara área
- Bugs corrigidos no parser (descobertos pelos testes):
_files: scripts/__tests__/sync-changelog.test.mjs, src/i18n.ts, scripts/sync-changelog.mjs_

### 2026-04-29 · [admin] ADDED — Testes automatizados do parser do CHANGELOG (vitest)
- Setup mínimo de Vitest (`vitest.config.ts`, `src/test/setup.ts`, scripts `test` / `test:watch` em `package.json`) — inclui `scripts//*.test.mjs` no glob
- Refactor de `scripts/sync-changelog.mjs`: `parseMetaComment`, `extractFiles`, `inferArea`, `parseChangelog`, `KIND_MAP` e `AREA_RULES` agora são exportados; `main()` só roda quando o script é chamado como CLI (detecção via `import.meta.url` × `process.argv[1]`)
- 22 testes em `scripts/__tests__/sync-changelog.test.mjs` cobrindo: separadores variados (`·`, `,`, `;`, `|`), `commit:` no metadata-comment, captura de paths em prosa/listas/crases, dedup, todas as extensões suportadas, inferência de área por path, ordenação por data, fallback de `status`/`area`, limpeza de ✅/``/emoji, hífen e em-dash em cabeçalhos, mapping `deprecated → changed`
_files: src/test/setup.ts, scripts/sync-changelog.mjs, scripts/__tests__/sync-changelog.test.mjs_

### 2026-04-29 · [admin] ADDED — Mini-timeline por área no Organograma com links de arquivos e commits
- Novo `src/components/administrador/organograma/AreaMiniTimeline.tsx`: timeline vertical com bolinhas coloridas por tipo (added=verde, changed=âmbar, fixed=azul, removed=vermelho, security=roxo), expandir/recolher por entrada, filtros toggle por tipo e botão "Ver mais" (3 → 8)
- Cada entrada expandida mostra bullets resumidos (até 3), chips de arquivos (até 8) e — quando presente — chip de commit com hash curto e ícone `GitCommit`
- Arquivos e commits viram links externos quando `REPO_CONFIG.baseUrl` está configurado em `src/data/repoConfig.ts` (default vazio = chips estáticos seguros). Quando o GitHub estiver conectado via Connectors, basta preencher `baseUrl` para ativar todos os links
_files: src/components/administrador/organograma/AreaMiniTimeline.tsx, src/data/repoConfig.ts, scripts/sync-changelog.mjs, src/data/changelogQuery.ts…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.