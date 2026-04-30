# Project context briefing (auto)
Generated: 2026-04-30T15:08:11.945Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.42.0

## Changes by area (last 14 days)
- **admin**: 7
- **meta**: 7
- **kg**: 4
- **vet-ui**: 3
- **i18n**: 1

## Top 10 recent entries
### 2026-04-30 · [i18n] ADDED — Internacionalização completa do Organograma do Projeto
- 7 arquivos corrigidos: OrganogramaTab, OrganogramaCards, OrganogramaDiagram, OrganogramaForceGraph, ChangelogTimeline, AreaMiniTimeline — todos agora usam `useTranslation()` + `t()` para textos visíveis.
- projectOrganograma.ts bilíngue: todas as ~60 entidades (áreas, filhos, convenções) agora possuem campos `title_en`, `description_en`, `label_en`, `value_en`.
- ~50 chaves i18n criadas no namespace `organograma` em ambos `translation.json` (PT/EN).
_files: src/pages/administrador/OrganogramaTab.tsx, src/data/projectOrganograma.ts_

### 2026-04-30 · [kg] ADDED — Diagnóstico Gap-Fill e detalhamento de fontes no EvidenceGapCard
- EvidenceGapCard expandido: agora exibe breakdown por fonte (Perplexity / PubMed) com contagem de consultas, sucessos, falhas e motivos de ausência de evidências. Erros inline e flag de "sem chave Perplexity" nos detalhes de cada par.
- Nova tab admin "Diagnóstico Gap-Fill": tela completa para inspecionar health_conditions (name_en), nutraceuticals (name_en), links pet_conditions ↔ condition_id, e todos os triplets gerados pelo gap-fill. Badges visuais indicam dados faltantes que impedem a pipeline.
- Files: src/components/pet/EvidenceGapCard.tsx, src/components/administrador/diagnostics/GapFillDiagnosticsTab.tsx, src/config/admin-tabs.ts
_files: src/components/pet/EvidenceGapCard.tsx, src/components/administrador/diagnostics/GapFillDiagnosticsTab.tsx, src/config/admin-tabs.ts_

### 2026-04-30 · [kg] FIXED — Restauração do pipeline de evidências (gap-fill → projeção → gêmeo digital)
- Deploy das Edge Functions: `kg-evidence-gap-fill`, `kg-missing-triplets`, `perplexity-health`, `provider-health` e `project-pet-trajectory` estavam retornando 404 (não publicadas). Agora todas estão ativas no backend.
- Backfill canônico: migração preencheu `pet_conditions.condition_id` (match por nome em `health_conditions`) e `nutraceuticals.name_en` para os 22 compostos que estavam sem nome inglês — requisito para o gap-fill montar pares de busca.
- Auth do gap-fill: substituído `getClaims` (indisponível na versão do SDK) por `getUser` para autenticação robusta do admin.
_files: supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/project-pet-trajectory/index.ts, src/components/pet/EvidenceGapCard.tsx, src/i18n.ts…_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.