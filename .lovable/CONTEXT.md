# Project context briefing (auto)
Generated: 2026-05-18T04:04:01.243Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.86.3

## Changes by area (last 14 days)
- **admin**: 17
- **vet-ui**: 14
- **tutor-ui**: 9
- **clinical-pipeline**: 4
- **meta**: 3
- **i18n**: 1
- **curation**: 1

## Top 10 recent entries
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

### 2026-05-18 · [tutor-ui] ADDED — Fase 4b: Provenance gap→composto no card do tutor
- Edge `hybrid-recommendation`: schema JSON dos prompts ENRICH e FALLBACK agora exige `closes_gaps: string[]` por composto (rótulos exatos do bloco `NUTRITION_GAPS` que o composto fecha; `[]` quando não fecha nenhum). Sem alteração de prompt além do schema.
- `clinical-analysis-pipeline.ts`: cada composto materializado ganha `closesGaps: string[]` propagado verbatim do LLM.
- `PetProfilePage.handleApproveStack`: persiste `closes_gaps` dentro de `treatment_proposals.compounds[]` (jsonb), sem mudanças no resto do "patient analysis".
_files: supabase/functions/hybrid-recommendation/index.ts, src/services/clinical-analysis-pipeline.ts, src/pages/veterinario/PetProfilePage.tsx, src/components/tutor/TreatmentProposalCard.tsx…_

### 2026-05-18 · [vet-ui] ADDED — Fase 4: Evolução longitudinal dos gaps nutricionais
- Novo serviço `src/services/nutrition-gap-timeline.ts`: reconstrói déficits/excessos para cada snapshot histórico de `pet_nutrition` reutilizando `analyzeNutritionGaps` (mesma metodologia FEDIAF/AAFCO). Sem mocks — snapshots sem produtos linkados ficam fora do gráfico.
- `analyzeNutritionGaps` aceita `nutritionId?: string` opcional para forçar análise de um snapshot específico (necessário para timeline).
- Novo componente `NutritionGapEvolutionChart.tsx` (Recharts ComposedChart): áreas de déficit/excesso + linha de adequados ao longo do tempo, badge de tendência (Δ desde o primeiro snapshot) e tabela "Top 5 nutrientes com maior variação" (antes → depois, Δ percentual em pontos).
_files: src/services/nutrition-gap-timeline.ts, src/services/nutrition-gap-analyzer.ts, src/components/pet/NutritionGapEvolutionChart.tsx, src/components/pet/PetNutritionPanel.tsx…_

### 2026-05-18 · [clinical-pipeline] ADDED — Bridge Nutrition Gaps → Engine de Recomendação
- `buildLongitudinalContext` (frontend) agora roda `analyzeNutritionGaps` para o pet ativo e envia os gaps quantitativos não-adequados (até 10) dentro de `dietProfile.gaps` para a edge function `hybrid-recommendation`.
- Edge `hybrid-recommendation`: novo bloco `NUTRITION_GAPS [WEIGHT: 0.8]` renderizado no prompt com `observed / target / delta_pct / rationale / source` por nutriente em déficit/excesso.
- Prompts ENRICH e FALLBACK atualizados: o LLM PRECISA selecionar pelo menos um composto que feche cada nutriente DEFICIENT listado e NÃO pode recomendar nutrientes já ADEQUATE/EXCESS na dieta; o "mechanism" deve citar explicitamente o gap fechado.
_files: supabase/functions/hybrid-recommendation/index.ts, src/services/hybrid-recommendation-service.ts_

### 2026-05-18 · [admin] CHANGED — Aba "Catálogo de Rações" vira "Nutrition" com tags inline + auto-enrich + tabela AAFCO
- Nutrientes como tags inline: o card de produto agora renderiza TODOS os campos nutricionais não-nulos (Prot, Gord, Fibra, Ca, P, Ca:P, n6:n3, EPA, DHA, Lis, Tau, Vit A/D3/E, Zn, Fe, Cu, etc.) como `<Badge>` compactos no padrão visual já usado para `species`/`life_stage`. Sem clique, sem dialog secundário.
- Auto-enriquecimento: `useEffect` na query identifica produtos sem nutrição ou com `completeness_score < 0.4` e invoca `enrich-pet-food-product` em background (batches de 3, guard `useRef<Set>` contra loops). Novo produto cadastrado dispara enrichment imediatamente. Botão manual "Enriquecer com IA" e dialog "Composição" foram removidos.
- Renomeação: aba do menu lateral passa a se chamar Nutrição/Nutrition (chave `admin.sidebar.knowledgeBase.petFoodCatalog`, id da rota `pet-food-catalog` preservado).
_files: src/data/nutritionRequirementsCanine.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx, src/i18n.ts_

### 2026-05-17 · [admin] FIXED — Nutrition: kcal as-fed para ração úmida + cache PostgREST
- Edge `enrich-pet-food-product`: converte `kcal_per_kg` reportado em base seca para as-fed quando moisture ≥ 50% (resolve Cesar/Sheba mostrando ~9000 kcal/kg).
- `NOTIFY pgrst, 'reload schema'` para liberar gravação de `confidence`, `completeness_score` e `data_filled_at` em `pet_food_nutrition` (estavam silenciosamente sendo descartados pelo cache do PostgREST).
- Reprocessados os 19 produtos das marcas Mars recém-adicionadas com a lógica corrigida.
_files: supabase/functions/enrich-pet-food-product/index.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.