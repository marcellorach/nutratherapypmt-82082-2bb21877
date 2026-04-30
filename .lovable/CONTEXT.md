# Project context briefing (auto)
Generated: 2026-04-30T18:00:12.239Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.46.0

## Changes by area (last 14 days)
- **admin**: 8
- **meta**: 7
- **kg**: 4
- **vet-ui**: 3
- **i18n**: 2
- **clinical-pipeline**: 2

## Top 10 recent entries
### 2026-04-30 · [i18n] FIXED — Traduções evidenceGap.log e layout responsivo DT workflow
- Adicionadas 16 chaves de tradução `evidenceGap.log.*` em PT e EN para o painel de log em tempo real da busca de evidências
- DT mini-workflow: trocado `overflow-x-auto` por `flex-wrap` para quebrar em duas linhas em vez de sair do quadro
- Conectores entre etapas ocultados em telas pequenas (`hidden sm:block`)
_files: src/locales/en/translation.json, src/locales/pt/translation.json, src/components/pet/DigitalTwinDog.tsx, src/i18n.ts_

### 2026-04-30 · [clinical-pipeline] FIXED — Pipeline scroll, DT workflow visual, Evidence Gap search fix
- Pipeline workflow card: adicionada barra de rolagem horizontal estilizada para telas menores
- Digital Twin: novo mini-workflow visual com 4 etapas (Snapshot → Trajectory API → Parse → Render) com tempos individuais e total
- Evidence Gap Search: corrigido bug onde `condition_id = NULL` em `pet_conditions` fazia a busca retornar 0 pares — agora usa `condition_name` como fallback
_files: src/components/pet/ClinicalPipelineWorkflow.tsx, src/components/pet/DigitalTwinDog.tsx, supabase/functions/kg-evidence-gap-fill/index.ts, src/locales/pt/translation.json…_

### 2026-04-30 · [clinical-pipeline] ADDED — Pipeline: card sinergias, tempos por etapa, log do Digital Twin
- Novo 7o estágio `stage7_synergies` (ícone Zap) no `ClinicalPipelineWorkflow` com contagem de sinergias entre compostos recomendados
- Tempo de execução exibido abaixo de cada etapa concluída + indicador de tempo total no canto direito do workflow
- Novo `DigitalTwinLogPanel`: console ao vivo no Digital Twin rastreando ciclo de vida da projeção de trajetória (início, chamada AI, resposta, cache, erros) com autoscroll, limpar e exportar
_files: src/components/pet/ClinicalPipelineWorkflow.tsx, src/components/pet/DigitalTwinLogPanel.tsx, src/components/pet/DigitalTwinDog.tsx, src/pages/veterinario/PetProfilePage.tsx…_

### 2026-04-30 · [admin] FIXED — Organograma usa bbox real para centralização e escala
- `useScrollPanZoom` agora mede o bounding box real do conteúdo SVG via `getBBox()` antes de aplicar `fit`, corrigindo o caso em que o Mermaid ficava minúsculo no canto apesar de haver espaço disponível.
- `OrganogramaDiagram` ganhou viewport útil maior (`calc(100vh - 230px)`, `minHeight: 520`) e `svg overflow-visible`, melhorando o aproveitamento horizontal e vertical.
- Files: src/hooks/useScrollPanZoom.ts, src/components/administrador/organograma/OrganogramaDiagram.tsx
_files: src/hooks/useScrollPanZoom.ts, src/components/administrador/organograma/OrganogramaDiagram.tsx_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.