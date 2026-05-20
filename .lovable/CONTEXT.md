# Project context briefing (auto)
Generated: 2026-05-20T04:33:03.586Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.93.0

## Changes by area (last 14 days)
- **admin**: 27
- **vet-ui**: 16
- **tutor-ui**: 9
- **meta**: 4
- **curation**: 4
- **clinical-pipeline**: 4
- **i18n**: 1

## Top 10 recent entries
### 2026-05-20 · [admin] FIXED — Meta-estudo: fallback automático para PDF grande
- Edge `extract-meta-study` agora tenta fallback automático para PDFs acima do limite inline do gateway usando upload dedicado no Google AI File API, preservando o estudo completo sem truncamento silencioso.
- Fluxo de análise: PDFs pequenos continuam no gateway atual; PDFs grandes passam por upload dedicado + chamada direta ao Gemini 3 Pro com o mesmo schema estruturado e o mesmo `trace[]` por estágio.
- Falhas reais de PDF grande agora explicam se o bloqueio foi no fallback automático (upload/processamento do arquivo) antes de sugerir alternativas manuais.
_files: supabase/functions/extract-meta-study/index.ts_

### 2026-05-20 · [admin] CHANGED — Sidebar admin: nova família "Governança & IA"
- Removido link órfão "Base de Conhecimento" (tab `knowledge-base-settings`) que não tinha conteúdo.
- Criada nova seção lateral "Governança & IA" (`GovernanceAIGroup`) separada de Configuração, agrupando: AI Config, AI Prompts, Organograma, Conformidade FDA/EMA/AVMA, Auditorias Técnicas, About Senex AI e Fundamentos Arquiteturais.
- Configuração mantém apenas: Ações, Analytics, Análise de ROI, Traduções, Design, Solicitações de Acesso.
_files: src/components/administrador/sidebar/groups/GovernanceAIGroup.tsx, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/sidebar/AdminSidebarGroups.tsx, src/i18n.ts_

### 2026-05-20 · [admin] CHANGED — Ingestão de meta-estudos: Gemini 3 + drag&drop + log de digestão
- Edge `extract-meta-study`: trocado modelo para `google/gemini-3-pro-preview`; PDFs agora são enviados nativamente como anexo multimodal (não mais string-placeholder); aceita `curator_notes` como diretriz vinculante separada do conteúdo do estudo; retorna `trace[]` com telemetria por estágio (extraction · rules_catalog · llm_analysis · structuring) e mensagens de erro acionáveis por HTTP code (429/402/413/422).
- UI `IngestaoMetaEstudo.tsx`: dropzone drag&drop com PDF/.md/.txt/.docx obrigatório (até 20MB); campo "Notas do curador" (até 4000 chars, markdown) substitui o textarea genérico de texto; DOI/URL movido para `<details>` colapsado; painel "Log de digestão" sempre visível com 5 estágios (upload + os 4 do edge), ícones de status, duração e detalhe — espelha o padrão do pipeline clínico.
- Schema: nova coluna `meta_studies.curator_notes TEXT` persiste as diretrizes do curador junto com o estudo aprovado.
_files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, src/i18n.ts_

### 2026-05-20 · [admin] ADDED — Ingestão curada de meta-estudos arquiteturais (Fase 3.3)
- Edge function `extract-meta-study`: recebe texto colado e/ou PDF do bucket `meta_studies_pdfs`, busca o catálogo atual de Regras-Core no DB e usa Gemini 2.5 Pro (tool-calling estruturado) para emitir um rascunho com `title/authors/year/kind/summary/key_claims[]` + `suggested_links[]` para RCs existentes (relations: `supports|contradicts|modulates_weight|inspires`). Não grava nada — apenas devolve o draft.
- Componente `IngestaoMetaEstudo`: nova sub-aba "Ingestão" em Fundamentos. Permite colar texto/`.md` (mín. 50 chars) e/ou anexar PDF; faz upload em `meta_studies_pdfs`, chama a edge function, renderiza rascunho totalmente editável (todos os campos + checkbox por vínculo sugerido) e, ao aprovar, insere em `meta_studies` + `core_rule_evidence` (resolvendo `rule_id` texto → uuid). Recarrega a lista de fundamentos depois de salvar.
- Política: estudos arquiteturais NÃO entram no KG clínico; ficam isolados no Meta-KG. Banner em destaque reforça que a aprovação é manual.
_files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, src/pages/administrador/FundamentosTab.tsx, src/i18n.ts_

### 2026-05-20 · [admin] ADDED — Score explainability, harvest de RCs e Justificativas por regra (Fase 3.1+3.2+3.4)
- (7) Score explainability: `ScoreCriteriaPopover` agora mostra coluna de peso relativo (%) por critério, penalidades parciais (ex.: "n<100 → potência limitada", "<6 meses → desfechos crônicos não capturados", "evidência humana → cão modulada por RC-003") e bloco "Por que este score?" com rationale heurística (ou LLM se `study_assessment.score_rationale` estiver presente). Resposta explícita a "por que 4.0/5 com todos os checks ✓".
- (1) Harvest de Regras-Core: 15 RCs já vigentes promovidas para `core_rules` (RC-004 a RC-018) — Canonical IDs, Bilinguismo, No-Mock, Curation Gatekeeper, Taxonomia SNOMED+UMLS, Cap Terapêutico=8, Escopo Metabólico/Degenerativo, Soft Delete, Vetorização pré-curadoria, Tiered Confidence, Predicate Normalization, Chunking, Sigmoid Engine, Condition Canonicalization, Demo Data. Todas com justificativa bilíngue PT/EN e referência ao código.
- Schema: nova coluna `core_rules.runtime_effect` (`active` | `doc_only` | `planned`) tornando explícito quais RCs alteram pipeline em runtime vs. quais são governança auditável apenas. Renderizada como badge azul/cinza/âmbar em cada card.
_files: src/components/administrador/tags/ScoreCriteriaPopover.tsx, src/pages/administrador/FundamentosTab.tsx, src/i18n.ts_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.