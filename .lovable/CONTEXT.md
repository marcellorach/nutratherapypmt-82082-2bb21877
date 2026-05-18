# Project context briefing (auto)
Generated: 2026-05-18T05:20:46.929Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.86.6

## Changes by area (last 14 days)
- **admin**: 21
- **vet-ui**: 15
- **tutor-ui**: 9
- **clinical-pipeline**: 4
- **meta**: 3
- **i18n**: 1
- **curation**: 1

## Top 10 recent entries
### 2026-05-18 · [vet-ui] CHANGED — Digital Twin: doenças atingem órgãos internos
- Substituída a silhueta opaca + bolinhas flutuantes do `DigitalTwinDog` por uma ilustração anatômica transparente do Golden Retriever (`src/assets/dog-anatomy.png`) com órgãos internos visíveis (cérebro, coração, pulmões, fígado, rins, intestinos, bexiga, articulações, coluna).
- Cada doença agora ilumina o órgão correspondente *dentro* do corpo (via `DogAnatomySVG` + `mapConditionToRegions`), com pulso/halo proporcional à severidade e estrela verde quando o protocolo protege a região.
- Coordenadas anatômicas (`REGION_COORDS`) recalibradas para o novo asset; `BiologicalTimeline` herda automaticamente o novo visual.
_files: src/components/pet/DogAnatomySVG.tsx, src/components/pet/DigitalTwinDog.tsx_

### 2026-05-18 · [admin] CHANGED — Extraction Prompts: ações movidas para o topo
- Removido o rodapé "Restaurar Padrões do {{stage}}" / "Testar com estudo real" do `ExtractionPromptsEditor` — agora ambos os botões aparecem no cabeçalho do card de stages, ficando contextuais ao stage ativo (Stage 1…Triplets).
- Validadas as duas primeiras edge functions migradas para `fetchSystemPrompt`: `extract-pet-clinical-data` e `relations-auditor` (status 200, prompts resolvidos via DB `default_content`).
- Files: src/components/administrador/configuracoes/ExtractionPromptsEditor.tsx
_files: src/components/administrador/configuracoes/ExtractionPromptsEditor.tsx_

### 2026-05-18 · [admin] FIXED — System Prompts: catálogo populado + sync com o código
- Causa raiz: os 24 registros em `ai_system_prompts` existiam mas com `default_content` vazio, gerando o badge "sem conteúdo" em todos os cards.
- Novo manifest `supabase/functions/_shared/system-prompts.ts` com o texto real de produção dos 24 prompts (Clinical Extraction, Clinical Reasoning, Conversational, External Lookup, KG Enrichment, KG Gap-Fill, KG Governance, RAG/Embeddings, Recommendation Orchestration, Study Ingestion, Taxonomy, Translation) + helper `getSystemPrompt(supabase, key)` no padrão override → default → manifest.
- Nova edge function `sync-system-prompts` faz `UPDATE` em `default_content` a partir do manifest, sem tocar em `override_content`. Executada agora: 24/24 atualizados.
_files: supabase/functions/_shared/system-prompts.ts, supabase/functions/sync-system-prompts/index.ts, src/components/administrador/configuracoes/SystemPromptsCatalog.tsx, src/components/administrador/PromptConfigurationTab.tsx…_

### 2026-05-18 · [admin] CHANGED — Landing: AdminFooter unificado + scroll-indicator na 1ª dobra
- `AdminFooter` agora renderiza o mesmo `Footer` da landing (versão Senex auto-lida, badge `Veterinary Geroscience`, copyright bilíngue, powered-by completo). Antes era um clone hardcoded em EN sem versão.
- Index hero: reduzido espaço acima do botão "Scroll to discover our vision" (`mt-16` → `mt-4`, `mt-3` → `mt-2`) para caber na 1ª dobra.
- Files: src/components/administrador/layout/AdminFooter.tsx, src/pages/Index.tsx
_files: src/components/administrador/layout/AdminFooter.tsx, src/pages/Index.tsx_

### 2026-05-18 · [admin] CHANGED — TranslationsHub: Audit + Manage em uma só aba; Knowledge Graph reposicionado
- Novo `TranslationsHub.tsx` (sub-tabs Audit/Manage) substitui os 2 itens separados na sidebar Configuration. Ids legados `translation-audit` e `translation-manager` continuam funcionando como alias do hub (deep-link no sub-tab Manage preservado).
- Sidebar Knowledge Base: `Knowledge Graph` movido para logo abaixo de `Triplets` e acima de `Evidence Conflicts`.
- I18n bump 1.86.3 → 1.86.4 (nova chave `admin.sidebar.configuration.translationsHub`).
_files: src/components/administrador/TranslationsHub.tsx, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx…_

### 2026-05-18 · [meta] CHANGED — Header/Footer: versão Senex auto-lida do CHANGELOG
- `scripts/sync-changelog.mjs` agora extrai `<!-- senex: x.y.z -->` do bloco `[Unreleased]` e emite `senexVersion` em `projectChangelog.generated.ts`.
- `src/config/senex-version.ts` consome `senexVersion` + `lastChangelogDate` — sem mais hardcode. Header e Footer atualizam sozinhos.
- Sidebar: ícone "configurado" do item FDA/EMA/AVMA Compliance agora fica inline ao lado da palavra, igual aos demais (deixou de ficar centrado à direita quando o texto quebra em 2 linhas).
_files: scripts/sync-changelog.mjs, src/config/senex-version.ts, src/data/projectChangelog.generated.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx_

### 2026-05-18 · [admin] ADDED — Compliance: i18n PT/EN + renovação manual com log
- Compliance Dashboard agora 100% bilíngue (UI + dados em `complianceData.ts` com `_en`).
- Novo botão "Rodar verificação de compliance" + tabela `compliance_audit_runs` (totals, per_authority, diff melhorou/piorou/novo) com RLS admin-only.
- Histórico de verificações colapsável com chips de delta e diff item-a-item.
_files: src/components/administrador/compliance/ComplianceDashboard.tsx, src/components/administrador/compliance/complianceData.ts, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/locales/pt/translation.json…_

### 2026-05-18 · [admin] ADDED — Aba "About Senex AI" + badge de versão
- Nova aba `about-senex` no grupo Configuration com diagrama Mermaid detalhado do motor (6 fases: ingestion → 3-stage extraction → KG L0–L4 → validation/gap-fill → hybrid storage Supabase + Neo4j → U-Retrieval + Digital Twin), pilares científicos e métricas chave.
- Badge `v{SENEX_VERSION} · {SENEX_LAST_UPDATE}` ao lado de "Senex AI" no Header e Footer (fonte única em `src/config/senex-version.ts`).
- Files: src/components/administrador/AboutSenexTab.tsx, src/config/senex-version.ts, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/layout/Header.tsx, src/components/layout/Footer.tsx, src/locales/{pt,en}/translation.json
_files: src/config/senex-version.ts, src/components/administrador/AboutSenexTab.tsx, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx…_

### 2026-05-18 · [admin] CHANGED — Modal de Estudos Científicos v5.1.0 (Neo4j ativo)
- Corrigido o conteúdo desatualizado: Neo4j AuraDB já está integrado (edge functions `neo4j-sync`, `sync-approved-triplets`, `sync-study-to-neo4j`). Removido item "Migrate KG to Neo4j" dos planejados e ajustada a limitação para refletir que o read-path clínico ainda usa RPC Postgres.
- Workflow step 5 atualizado para "sync ativo" em vez de "planejado". Bump de 5.0.0 → 5.1.0.
- Files: src/data/admin-tabs-info-bilingual.ts
_files: src/data/admin-tabs-info-bilingual.ts_

### 2026-05-18 · [admin] ADDED — Fase 5: Cobertura e enriquecimento em lote do catálogo de rações
- Nova tabela `pet_food_bulk_enrich_runs` (RLS admin-only) para registrar parâmetros, contagens e detalhes por execução do job.
- Edge `bulk-enrich-pet-food`: seleciona produtos `approved` sem nutrição ou com `completeness_score < min_completeness`, dispara `enrich-pet-food-product` em chunks com concorrência configurável (default 4) e grava o resultado no log. Requer admin (verificado via `is_admin()` no cliente do usuário).
- Nova aba admin `Cobertura de Rações` (`pet-food-coverage`, grupo `knowledge-base`): KPIs (total, com nutrição, completude ≥60%, confiança ≥70%), heatmap por marca (piores primeiro), tabela priorizada por completude com botão "Re-enriquecer" por linha e formulário de execução em lote, mais log das últimas 20 execuções com auto-refresh.
_files: supabase/functions/bulk-enrich-pet-food/index.ts, src/components/administrador/pet-food/PetFoodCoverageTab.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/config/admin-tabs.ts…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.