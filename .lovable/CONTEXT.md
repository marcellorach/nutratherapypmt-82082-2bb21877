# Project context briefing (auto)
Generated: 2026-05-21T16:37:18.762Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.94.0

## Changes by area (last 14 days)
- **admin**: 31
- **vet-ui**: 15
- **tutor-ui**: 9
- **meta**: 4
- **curation**: 4
- **clinical-pipeline**: 4
- **i18n**: 1

## Top 10 recent entries
### 2026-05-21 · [admin] ADDED — Governança de IA: registro central de Modelos & Prompts por Tarefa (Fase 1)
- Schema `ai_prompt_versions` + `ai_prompt_test_runs` + `ai_model_radar`: novas tabelas (RLS admin-only) para versionar prompts por `(task_id, model_id)`, registrar execuções de teste lado a lado e acumular sugestões automáticas de novos modelos. Trigger `validate_ai_model_radar_status` impede status inválido. Trigger `update_updated_at_column` mantém `updated_at` sincronizado.
- Seed inicial: 8 prompts do sistema (`extraction_stage1/2/3`, `triplet_extraction`, `relations_auditor`, `geroprotector_stack`, `lab_driven_adjustment`, `treatment_proposal_12m`) registrados como v1 ativos, criando baseline histórica.
- Task Registry (`src/config/ai-tasks.ts`): mapeia 11 famílias de tarefa para o modelo recomendado no AI Gateway, modelos candidatos, parâmetros de routing (`reasoning_effort`, `temperature`, `context_caching`) e justificativa bilíngue PT/EN. Decisões registradas: meta-análise / auditoria de Core Rules → `openai/gpt-5.4` com `reasoning=high`; extração massiva de PDF → `google/gemini-3-pro-preview` com context caching; chat clínico factual → `google/gemini-2.5-pro` com caching; chat clínico crítico → `openai/gpt-5.4` reasoning=high.
_files: src/config/ai-tasks.ts, supabase/migrations/20260521160844_233e5785-acfa-4994-8725-7a45895634c0.sql, src/hooks/useAIPromptVersions.ts, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx…_

### 2026-05-20 · [admin] ADDED — Fundamentos: histórico por Core Rule + audit log de governança
- Nova tabela `core_rule_audit_log`: registra cada `stance_detected` produzido pelo LLM e cada ação de governança (`promote`, `attach`, `resolve_keep`, `discard`, `approve_meta_study`) com `actor_user_id`, `created_at`, `justification` (curator notes) e `payload` JSON com snapshot da proposta. RLS: admin-only.
- Aba "Histórico & Auditoria" em Fundamentos Arquiteturais: lista todas as RCs com busca (RC-ID/título/categoria) e filtros por stance (`confirms`/`extends`/`contradicts`/`unrelated`) e por ação. Cada RC expansível mostra evidências vinculadas + log de auditoria com proposta, stance, ator, timestamp e justificativa. Bloco extra para entradas órfãs (rule_code referenciado que não existe mais).
- Approve handler instrumentado: `IngestaoMetaEstudo.approve()` agora grava em lote no audit log (1 entrada por stance detectada + 1 por ação tomada + 1 evento `approve_meta_study` agregado) usando `curatorNotes` como justificativa padrão.
_files: src/components/administrador/fundamentos/CoreRuleHistory.tsx, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, src/pages/administrador/FundamentosTab.tsx_

### 2026-05-20 · [admin] ADDED — Meta-estudo: detecção de conflito com RCs ativas (governança)
- Stance classification em `proposed_rules`: cada candidata agora é classificada pelo LLM como `confirms`, `extends`, `contradicts` ou `unrelated` em relação ao catálogo de Regras-Core ativas, com `conflicts_with[]` listando os `rule_id`s referenciados. Validação server-side rebaixa para `extends` se a stance reivindica conflito mas não cita rule_id válido.
- 3 lanes na UI de Ingestão: 🔴 Conflitos (vermelho, promoção bloqueada — só permite "Manter RC atual" como evidência de governança ou "Descartar") · 🟢 Confirmações (verde, vira `core_rule_evidence` com `relation='supports'` em vez de duplicar a RC) · 🔵 Extensões/Novas (purple, fluxo atual de promoção para nova RC).
- Salvaguarda: o handler `approve` agora bloqueia explicitamente qualquer tentativa de promover proposta com `stance='contradicts'` para nova RC, exigindo resolução humana via "Manter RC atual" ou edição manual.
_files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx_

### 2026-05-20 · [admin] ADDED — Meta-estudo: digestão profunda + RCs deduzidas
- Schema de extração v2: o tool-call `emit_meta_study_draft` agora pede 7 seções tipadas (padrões arquiteturais, receitas metodológicas, vocabulários/padrões, parâmetros quantitativos, anti-padrões, métricas de avaliação, perguntas em aberto) em vez de uma lista plana de "claims". Prompt exige ≥10 lições no total para papers não-triviais.
- Canal para regras deduzidas: novo array `proposed_rules[]` permite ao paper sugerir candidatas a Regra-Core que não mapeiam para nenhuma RC existente, em vez de silenciosamente descartá-las. O prompt orienta gerar ≥2 propostas em papers arquiteturais substantivos.
- Origem epistêmica nas RCs: tabela `core_rules` ganha coluna `origin` (`inductive` / `deductive` / `hybrid`) + provenance (`proposed_from_meta_study`, `promoted_at`, `promoted_by`). RC-001 e RC-002 marcadas como `inductive` (nasceram do chat); novas RCs promovidas via UI ganham `origin='deductive'`.
_files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.