# Project context briefing (auto)
Generated: 2026-05-20T03:04:09.540Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.88.0

## Changes by area (last 14 days)
- **admin**: 22
- **vet-ui**: 16
- **tutor-ui**: 9
- **meta**: 4
- **curation**: 4
- **clinical-pipeline**: 4
- **i18n**: 1

## Top 10 recent entries
### 2026-05-20 · [admin] ADDED — Timestamps de auditoria, popovers de critérios e i18n de enums LLM (Fase 1 b+c+d)
- (b) Timestamps de auditoria em `processed_studies`: novas colunas `processed_at`, `curated_at` e `curated_by`. Trigger `set_processed_at_on_analysis` preenche `processed_at` automaticamente quando `analysis_data` é gravado pela primeira vez. Backfill aplicado a estudos já processados/aprovados. `useStudyApprovalWorkflow` agora grava `curated_at` + `curated_by = auth.uid()` no momento da aprovação.
- Componente `StudyTimeline` (`src/components/administrador/estudos/StudyTimeline.tsx`) com variantes `compact` (linha do tempo inline em cada card de "Em Curadoria") e `detailed` (lista vertical no topo da aba Visão Geral do detalhe do estudo). Exibe: publicação, ingestão, processamento IA, vetorização RAG (com contagem de chunks) e curadoria final.
- (c) Bilinguismo dos enums vindos do LLM — novo utilitário `src/utils/llmEnumLocalizer.ts` com `localizeEnum`, `localizeDuration` e `localizeList`. Dicionário cobre blinding (`double_blind` → "duplo-cego"), methodology (`rct` → "Ensaio clínico randomizado"), species (`Human` → "Humano", `Canine` → "Cão"), severity (`moderate` → "moderado"), e durações (`12 weeks` → "12 semanas"). Aplicado no `VisaoGeralTab` (badges metodológicas) e no `EstudoCard` (severidade de efeitos colaterais).
_files: src/components/administrador/estudos/StudyTimeline.tsx, src/utils/llmEnumLocalizer.ts, src/hooks/useStudyApprovalWorkflow.ts, src/components/administrador/tags/ScoreCriteriaPopover.tsx…_

### 2026-05-20 · [meta] ADDED — Governança de Regras-Core (RC-001, RC-002, RC-003 planejada)
- Novo arquivo `docs/CORE_RULES.md` como fonte canônica auditável das regras-core do Senex AI. Cada regra tem `id` (RC-NNN), categoria, versão, status, justificativa, aplicação em código e evidências sustentadoras. Substitui o status anterior em que regras-core estavam dispersas entre `.lovable/memory/`, custom-knowledge e CHANGELOG.
- RC-001 — Exclusão de trial ≠ Contraindicação: critério de exclusão indica lacuna de evidência, não risco demonstrado. Aplicada em (a) prompt do Stage 3 em `extract-study-entities` (regra #8 no system prompt), (b) banner amarelo no topo da seção "Contraindicações" do `ExtractedDataVisualization` lembrando o curador. Motivada pelo estudo PQQ humano que listou "Pregnancy and Nursing" e "Serious Chronic Diseases" como contraindicações, quando eram apenas exclusões do trial.
- RC-002 — Eventos adversos: negação explícita ≠ ocorrência: quando estudo declara "no adverse events reported", `side_effects` é normalizado para `[]` e flag `explicitly_no_adverse_events=true` é setada. UI exibe badge verde "Sem eventos adversos reportados" em vez de contador "(1)" enganoso. Filtro via regex `NEGATIVE_AE_REGEX` no pós-Stage 3 + filtro espelhado no componente UI.
_files: .lovable/memory/principles/exclusion-vs-contraindication.md, .lovable/memory/architecture/core-rules-governance.md, supabase/functions/extract-study-entities/index.ts, src/components/administrador/estudos/cards/EstudoCard.tsx…_

### 2026-05-19 · [curation] FIXED — Cards e modal de curadoria consistentes (derivação de triplets)
- Causa-raiz identificada: cards "nus" em "Em Curadoria" (Spermidine, Vet Geroscience) ocorrem quando o Stage 1 do `extract-study-entities` retorna `extractedNutraceuticals/extractedConditions` vazios, mesmo com triplets válidos gerados pelo Stage 2 (14 e 23 triplets, respectivamente). Card e modal "Análise IA" leem só de `analysis_data` → ficam vazios.
- Backfill imediato (data migration via UPDATE): 2 estudos afetados tiveram `extractedNutraceuticals` e `extractedConditions` derivados de `triplet_extractions` (Nutraceutical/Compound/Drug → nutracêuticos; Condition/Disease/Phenotype/Outcome → condições, dedup por nome lowercase, confidence padrão 3).
- Fallback definitivo no pipeline: `extract-study-entities/index.ts` agora deriva as listas a partir dos triplets recém-inseridos quando Stage 1 vier vazio, antes do `UPDATE processed_studies.analysis_data`. Logs `🛟 Fallback: derivados N nutracêuticos/condições`.
_files: supabase/functions/extract-study-entities/index.ts, src/components/administrador/estudos/detalhes/tabs/AnaliseTab.tsx, src/i18n.ts_

### 2026-05-19 · [curation] ADDED — Governança de versão de embedding (Etapa 2 do plano RAG)
- Coluna `embedding_model_version` adicionada a `study_embeddings` com default `gemini-embedding-001@768d` e índice dedicado, permitindo rastrear qual encoder gerou cada chunk vetorial.
- Backfill dos 1.293 chunks legacy com a tag canônica — validado empiricamente pelo smoke test (avg top-similarity = 0.743, verdict PASS) executado na Etapa 1, confirmando compatibilidade com o encoder atual.
- RPC `search_study_chunks` recriado para retornar `embedding_model_version` em cada resultado, sem alterar a assinatura semântica (mesmos filtros/ordenação).
_files: supabase/functions/vectorize-study/index.ts, supabase/functions/document-chat/index.ts_

### 2026-05-18 · [admin] FIXED — Badges do pipeline: Biblioteca conta estudos curados e contadores não congelam
- Biblioteca: badge passa a refletir estudos com `kanban_status='approved'` (status final de curadoria), alinhado ao critério usado pela própria aba `StudiesLibraryTab`. Antes contava estudos com qualquer triplet revisado, divergindo do que a aba mostrava.
- Contadores congelados: as contagens carregavam todos os triplets via `select(...)`, atingindo silenciosamente o cap de 1000 linhas do Supabase e travando os badges em valores antigos. Substituído por queries `count: 'exact', head: true` em `processed_studies.kanban_status` — leves, exatas e atualizadas a cada ciclo de 15s.
- Curadoria: badge agora derivado de `kanban_status in ('parsed','review','processed')` (fonte única).
_files: src/components/administrador/estudos/import/SciImportSection.tsx_

### 2026-05-18 · [curation] CHANGED — Pipeline de embeddings padronizado (Google AI direto + taskType) e modelo do chat configurável
- Auditoria profunda confirmou que gêmeo digital, hybrid-recommendation, breed-predisposition, lab-interpretation e clinical-analysis-pipeline NÃO consomem vetores — operam sobre KG/triplets ou texto literal. Único consumidor real de embedding é `document-chat`. Zero risco de regressão clínica nesta mudança.
- Mismatch crítico corrigido: `document-chat` usava `google/text-embedding-004` (deprecated Jan/2026) via Lovable AI Gateway, enquanto `vectorize-study` indexava com `gemini-embedding-001` direto via Google AI — vetores eram incomparáveis, busca semântica degradada.
- Modelo canônico unificado: `gemini-embedding-001` direto via Google AI, 768d, com `taskType: RETRIEVAL_DOCUMENT` na indexação (`vectorize-study`) e `RETRIEVAL_QUERY` na busca (`document-chat`). Lovable AI Gateway não expõe `taskType` (perde ~10-15% de recall), por isso mantemos Google direto.
_files: supabase/functions/vectorize-study/index.ts, supabase/functions/document-chat/index.ts, src/hooks/useAIConfig.ts, src/components/administrador/estudos/cards/EstudoCard.tsx…_

### 2026-05-18 · [curation] CHANGED — Vetorização pré-curadoria centralizada + badges Curadoria/Biblioteca corretas
- Investigação arquitetural confirmou que a vetorização é passo OBRIGATÓRIO pré-curadoria: `StudyTripletCuration`, `TripletReviewDialog` e a edge `enrich-triplet` leem `study_embeddings.chunk_text` para exibir o "Trecho de Origem" que justifica cada triplet. Sem vetorização → curador decide cego (viola No-Mock Policy + Curation Gatekeeper).
- `extract-study-entities` agora dispara `vectorize-study` em background (`EdgeRuntime.waitUntil`) logo após marcar o estudo como `processed`, garantindo que TODOS os caminhos de ingestão (SciSpace, upload direto, AI Processing queue) resultem em embeddings antes da curadoria. Não bloqueia a resposta nem aborta extração se a vetorização falhar.
- Badge Curadoria (vermelha) agora conta apenas estudos onde NENHUM triplet foi aprovado/rejeitado (curadoria zerada). Estudos com curadoria parcial em andamento migram para Biblioteca.
_files: supabase/functions/extract-study-entities/index.ts, src/components/administrador/estudos/import/SciImportSection.tsx, src/components/administrador/estudos/import/TabNavigation.tsx, src/components/administrador/estudos/cards/EstudoCard.tsx…_

### 2026-05-18 · [vet-ui] CHANGED — Digital Twin: órgãos tingem com a doença e variam no tempo
- Adicionada camada `mix-blend-mode: multiply` sobre cada órgão (cérebro, coração, pulmões, fígado, rins, intestinos, pâncreas, estômago, bexiga, articulações) em `DogAnatomySVG`: o desenho original do PNG anatômico fica tingido de amarelo→laranja→vermelho conforme a intensidade, em vez de uma elipse colorida flutuando por cima.
- `RegionState` ganha campo `intensity` (0-1) que controla opacidade/saturação do tingimento; cor é interpolada (hue 55°→0°, saturação e brilho dinâmicos).
- `buildMarkers` em `DigitalTwinDog` agora calcula intensidade por ano: cenário sem protocolo progride (`base + 0.45 * t`), cenário com protocolo + coberto decai (`base * (1 - 0.7 * t)`), cenário com protocolo + não coberto progride mais devagar (`base + 0.2 * t`). Slider de anos passa a fazer os órgãos escurecerem (sem) ou clarearem (com).
_files: src/components/pet/DogAnatomySVG.tsx, src/components/pet/DigitalTwinDog.tsx_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.