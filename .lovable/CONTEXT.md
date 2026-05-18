# Project context briefing (auto)
Generated: 2026-05-18T01:24:24.091Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.82.0

## Changes by area (last 14 days)
- **vet-ui**: 14
- **admin**: 13
- **tutor-ui**: 9
- **clinical-pipeline**: 4
- **meta**: 2
- **i18n**: 1
- **curation**: 1

## Top 10 recent entries
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

### 2026-05-17 · [admin] ADDED — Carga nutricional completa (AAFCO/FEDIAF) no catálogo de rações
- `pet_food_nutrition` estendida: novas colunas para minerais traço (Fe, Cu, Zn, Mn, Se, I, Cl), vitaminas (A, D3, E, K, B1–B12, biotina, colina), EPA/DHA/ARA separados, aminoácidos essenciais (lisina, metionina, triptofano, treonina, arginina) e tracking (`completeness_score`, `confidence`, `data_filled_at`).
- `enrich-pet-food-product`: prompt expandido para schema AAFCO/FEDIAF completo com instrução explícita "nunca invente — prefira null". Parser normaliza `%`, `mg/kg` e `UI/kg` com clamps de plausibilidade. Calcula `completeness_score` (fração de campos numéricos preenchidos) automaticamente em cada insert.
- UI do catálogo (`PetFoodCatalogTab`): card de produto agora mostra barra de completude + % e confiança da IA; novo botão Composição abre dialog com a composição completa agrupada por (Macros / Minerais maiores / Minerais traço / Vitaminas / Ácidos graxos / Aminoácidos / Articulares), badges AAFCO/FEDIAF e statement quando presente.
_files: supabase/functions/enrich-pet-food-product/index.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx_

### 2026-05-17 · [admin] ADDED — Fix diagrama + catálogo de System Prompts + traduções
- Diagrama do organograma (fotos 1 e 2): fix definitivo. Após renderizar, o SVG do Mermaid agora recebe `width`/`height` reais lidos do `viewBox` (antes vinha só `style="max-width:100%"`, colapsando dentro do container `max-content`). `useScrollPanZoom.measureNatural` agora prioriza `viewBox.baseVal` sobre `getBBox` (mais estável antes do layout). `ResizeObserver` também observa o `innerRef` para refazer `fit()` quando o SVG aparece. `fitMin` 0.1 → 0.2 (evita escala microscópica).
- Catálogo de System Prompts: nova tabela `ai_system_prompts` com 24 prompts agrupados em 13 famílias (Clinical Extraction, Study Ingestion, RAG/Embeddings, Recommendation Orchestration, KG Enrichment, KG Governance, KG Gap-Fill, Clinical Reasoning, Translation, External Lookup, Taxonomy, Conversational). Nova aba System Prompts dentro de "Prompts da IA" lista catálogo com busca, agrupamento por família, badge "override ativo", editor inline e botão "Restaurar default". RLS admin-only. Conteúdo `default_content` ainda vazio em todos (preenchimento via leitura das edge functions vem em rodadas seguintes).
- Traduções (foto 4): "Organograma", "Conformidade FDA/EMA/AVMA" e "Auditorias Técnicas" estavam hardcoded no `ConfigurationGroup.tsx` — agora usam `t('admin.sidebar.configuration.{organograma,complianceDashboard,technicalAudits}')`. Chaves espelhadas PT/EN. `I18N_VERSION` 1.78.9 → 1.79.0.
_files: src/components/administrador/organograma/OrganogramaDiagram.tsx, src/hooks/useScrollPanZoom.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/ConfiguracoesIATab.tsx…_

### 2026-05-17 · [admin] CHANGED — Sidebar: reposicionar Triplet Quality + catálogo Mars
- Sidebar "Base de Conhecimento": item Triplet Quality movido para entre Triplet Curation e Evidence Conflicts (antes ficava isolado no fim do grupo). Apenas reordenação visual; rota, ícone e tradução inalterados.
- Catálogo de Rações: adicionadas 8 marcas do conglomerado Mars Petcare que faltavam — IAMS, Nutro, Cesar, Sheba, Greenies, Crave, Perfect Fit e Temptations. Royal Canin, Pedigree, Eukanuba e Whiskas já estavam cadastradas. Garante prioridade absoluta da Mars na lista de marcas.
- Files: src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, public.pet_food_brands (8 inserts).
_files: src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx_

### 2026-05-17 · [admin] CHANGED — Organograma: corrigir diagrama em branco e simplificar acesso ao Gap-Fill
- Diagrama Mermaid do organograma voltou a renderizar: removida a manipulação de `width`/`height` do `<svg>` que colapsava o conteúdo, e `fitMin` reduzido de 0.4 para 0.1 para evitar telas em branco quando o diagrama é maior que o container.
- Tab "Diagnóstico Gap-Fill" removida do menu lateral (Knowledge Base) — virou diagnóstico avançado acessível por botão "Ver diagnóstico avançado" dentro da tela de Mapeamento SNOMED/UMLS. A rota `?tab=gapfill-diagnostics` continua válida; só a entrada de menu foi escondida para reduzir ruído na sidebar.
- Página "Relações e Conexões" e o force-graph do organograma intencionalmente não foram tocados — auditoria do histórico (commits `385859f4`, `33454cc9`, `bb7d8e39`) confirmou que não houve regressão recente; o volume aparente (28 nós · 1000 edges) é dado real e não complexidade adicionada.
_files: src/components/administrador/organograma/OrganogramaDiagram.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/components/administrador/OntologyMappingTab.tsx, src/i18n.ts_

### 2026-05-17 · [admin] CHANGED — Sidebar admin: restauração de órfãos e limpeza de tabs sem propósito
- Knowledge Base recebeu 7 links restaurados/realocados: Curadoria de Triplets, Conflitos de Evidência, Mapeamento SNOMED/UMLS, Catálogo de Rações, Curadoria de Doses, Qualidade de Triplets e Diagnóstico Gap-Fill.
- Configuration recebeu 3 links novos: Gerenciar Traduções, Convenções de Design e Solicitações de Acesso.
- Removidas 4 tabs sem propósito de `admin-tabs.ts`: `acompanhamento` (marketing fora do escopo clínico), `fontes` e `analysis` (steps legados do wizard antigo de ingestão) e import órfão de `MicrobiomeAnalysisTab`.
_files: src/config/admin-tabs.ts, src/components/lazy/LazyComponents.tsx, src/i18n.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.