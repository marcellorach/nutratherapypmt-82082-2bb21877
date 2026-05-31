# 📝 Changelog - NutraTherapy

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> **Formato estruturado (parseável)** — adicione novas entradas no topo de `[Unreleased]` assim:
>
> ```
 > ### Added - YYYY-MM-DD — Título curto
 > <!-- area: admin · status: entregue · i18n: 1.40.0 · commit: a1b2c3d -->
> - bullet 1
> - bullet 2
> - Files: src/foo.tsx, supabase/functions/bar/index.ts
> ```
>
> Áreas válidas: `auth`, `curation`, `kg`, `base-knowledge`, `clinical-pipeline`, `vet-ui`, `tutor-ui`, `admin`, `i18n`, `infra`, `meta`.
> Status: `entregue` (default), `parcial`, `revertido`.
> Após editar este arquivo, rode `npm run sync:changelog` para regenerar o organograma + briefing.

---

## [Unreleased]
<!-- senex: 7.0.0 -->

### Added - 2026-05-31 — Auditoria técnica: auto-bump de versão + bibliografia obrigatória
<!-- area: admin · status: entregue · i18n: 1.115.8 -->
- Botão "Run new audit" no `TechnicalAuditsTab` agora calcula a próxima versão automaticamente: se `v{SENEX_VERSION}` já existe na tabela `technical_audits`, incrementa o PATCH (7.0.0 → 7.0.1 → 7.0.2...) até achar uma versão livre. Isso permite re-rodar auditorias sem sobrescrever a anterior nem editar manualmente o senex version.
- `generate-audit` passou a anexar uma seção `<section id="references">` ao final dos relatórios PT e EN com bibliografia curada (37 entradas: Hetionet, TxGNN, PrimeKG, ChEBI, MONDO, MeSH, OMIA, Dog Aging Project, Hallmarks of Aging, GMLP/FDA, EMA, AVMA, RAG/Med-PaLM, etc.) ordenada por ano. Os prompts PT/EN exigem agora citações inline no formato (Autor, Ano) em todos os blocos, sem invenção de fontes.
- Files: src/components/administrador/audits/TechnicalAuditsTab.tsx, supabase/functions/generate-audit/index.ts

### Fixed - 2026-05-31 — Auditoria técnica agora retoma por checkpoints curtos
<!-- area: admin · status: entregue · i18n: 1.115.8 -->
- `generate-audit` deixou de depender de uma execução longa única e passou a persistir checkpoints no campo `outline`: outline salvo, blocos renderizados salvos um a um, sumário executivo salvo separadamente e montagem final só no último passo.
- Cada continuação agora é reinvocada internamente com credencial de serviço aceita pela própria função, corrigindo o caso em que o watchdog detectava travamento mas não conseguia retomar a auditoria automaticamente.
- O timeout por chamada de LLM foi reduzido e simplificado para 2 tentativas (primária + fallback), evitando ficar preso vários minutos no mesmo bloco antes de avançar.
- Files: supabase/functions/generate-audit/index.ts, ARCHITECTURE.md, docs/CURRENT_STATE.md

### Fixed - 2026-05-31 — Auditorias futuras travadas no padrão standalone da v5.2.0
<!-- area: admin · status: entregue · i18n: 1.115.8 -->
- A edge function `generate-audit` agora rejeita relatórios simplificados e força regeneração quando o HTML vier abaixo do baseline estrutural da v5.2.0 (densidade mínima, seções-chave, tabelas e ausência de rótulos como "teste rápido" ou "paridade parcial").
- O prompt passou a tratar qualquer escopo curto como ênfase adicional, nunca como permissão para gerar auditoria reduzida; o padrão obrigatório agora é standalone + cumulativo.
- `TechnicalAuditsTab` deixou de usar uma versão i18n hardcoded antiga e passou a ler `I18N_VERSION` diretamente de `src/i18n.ts`, evitando novos relatórios com metadado retrocedido.
- Files: supabase/functions/generate-audit/index.ts, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/i18n.ts

### Changed - 2026-05-27 — Evidência quantitativa obrigatória + re-análise por insight
<!-- area: curation · status: entregue · i18n: 1.115.6 -->
- `analyze-cohort-patterns`: schema de `evidence` agora exige campos estruturados (`n_supporting`, `n_total`, `prevalence`, `comparison_baseline`, `effect_size`, `notes`). Prompt reforçado para derivar números dos agregados ou não emitir o insight.
- Edge function aceita `insight_id` para re-analisar 1 insight existente (UPDATE in-place com a melhor evidência quantitativa).
- Novo botão "🧪" em cada card de Population Insights chama a re-análise individual.
- Files: supabase/functions/analyze-cohort-patterns/index.ts, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/i18n.ts

### Changed - 2026-05-27 — Rebatizar "Priorizações" → "AI Scientist" e mover para Research & Development
<!-- area: admin · status: entregue · i18n: 1.115.0 -->
- Aba `priorizacoes` renomeada para **AI Scientist** e movida do grupo `governance-ai` para `research` (primeira posição da sidebar de R&D).
- Sidebar: removido item de Governance & AI, adicionado em `ResearchGroup` com ícone `Sparkles`.
- Header da página `PriorizacoesTab` atualizado; nova chave i18n `admin.sidebar.research.aiScientist` (PT/EN = "AI Scientist").
- Files: src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ResearchGroup.tsx, src/components/administrador/sidebar/groups/GovernanceAIGroup.tsx, src/pages/administrador/PriorizacoesTab.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts, src/data/projectOrganograma.ts

### Changed - 2026-05-27 — Painel de evidência no dialog de validação vet-curador
<!-- area: curation · status: entregue -->
- **Problema identificado**: o dialog de validação mostrava só título/resumo/confiança/sinais, sem expor os dados que sustentariam a decisão. O campo `evidence` dos insights gerados por `analyze-cohort-patterns` veio vazio (`{}`) — a confiança 80% era auto-declarada pelo LLM, sem nada auditável.
- **Painel "Evidência disponível"** embutido no `VetCuratorReviewDialog`, computado em tempo real a partir de `pet_profiles` + `pet_conditions` + `pet_exams` da cohort de origem (sem chamada de LLM):
  - Suporte populacional: N/total pets que casam com os sinais + barra de progresso; aviso âmbar automático se N<10 ou suporte<20%; aviso vermelho se zero matches.
  - Estratificação dos pets que sustentam: top 5 raças, idade média ± dp, split de severidade.
  - Top alterações laboratoriais nos pets matched, frequência absoluta + percentual, flags normalizadas via `canonicalLabFlag`.
  - Provenance: nome da cohort + modelo gerador + bloco JSON do `evidence` do LLM (ou aviso âmbar explícito quando vazio).
- **Atalho "Drill-down completo"** no canto do painel fecha o dialog de revisão e abre o `InsightDrillDownDialog` para inspeção profunda (gráficos individuais por pet, lab values).
- **Novo hook** `src/hooks/useInsightEvidence.ts` centraliza a query + agregações, base para futura unificação com o drill-down.
- Files: src/hooks/useInsightEvidence.ts, src/components/administrador/priorizacoes/VetCuratorReviewDialog.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/data/prioritizationBoard.ts

### Added - 2026-05-27 — Validação vet-curador de insights de cohort
<!-- area: curation · status: entregue · i18n: 1.114.0 -->
- **Governança clínica fechada**: cada `cohort_insights` ganhou `vet_review_status` (`pending`/`approved`/`rejected`/`needs_changes`), `vet_review_notes`, `vet_reviewed_by` e `vet_reviewed_at`. Default `pending`, com check constraint e índice no status.
- **Badge no card** do kanban Population Insights v0 mostra o status com cor (cinza/verde/vermelho/âmbar) e abre o dialog de revisão ao clicar.
- **Botão "validar"** em cada card abre `VetCuratorReviewDialog`: exibe título, resumo, confiança, sinais, model e o status atual; campo de notas clínicas; três ações — Aprovar (verde), Rejeitar (vermelho), Requer ajustes (âmbar).
- **Aprovação move automaticamente** o insight para a coluna `approved` do kanban — só após esta assinatura o insight pode virar regra clínica ou meta-estudo proposto.
- Card adicionado ao Painel de Priorizações (`vet-curator-insight-validation`, order 14, status `done`, com flag `requiresVetCuratorValidation`).
- Files: supabase/migrations/* (alter cohort_insights), src/components/administrador/priorizacoes/VetCuratorReviewDialog.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/data/prioritizationBoard.ts

### Fixed - 2026-05-27 — Cohort stats: canonicalização PT/EN + ref não-numérico
<!-- area: admin · status: entregue · i18n: 1.114.0 -->
- **Duplicação de taxonomia resolvida** no agregador de cohort stats: "Osteoarthritis" + "Osteoartrite" agora somam como uma só condição (e idem para os demais mapas EN↔PT já existentes em `condition-name-localizer`). Novo helper `canonicalConditionKey` faz o lookup reverso PT→EN antes da contagem; nome exibido respeita o idioma ativo via `localizeConditionName`.
- **Top flags laboratoriais normalizadas**: novo `lab-flag-canonicalizer.ts` unifica abreviaturas/PT (HCT↔Hematócrito, PLT↔Plt, ALT↔TGP, AST↔TGO, FA↔ALP, Ureia↔BUN, Creatinina↔Creatinine, etc.). Counts somados, top-12 mantido.
- **`ref ?–?` ocultado**: `formatLabValue` em `InsightDrillDownDialog` agora só emite a faixa de referência quando ao menos um dos limites é numérico — exames qualitativos (citologia de linfoma linfoblástico) ficam sem o bloco feio.
- Files: src/services/condition-name-localizer.ts, src/services/lab-flag-canonicalizer.ts, src/components/administrador/priorizacoes/CohortStatsPanel.tsx, src/components/administrador/priorizacoes/InsightDrillDownDialog.tsx, src/data/prioritizationBoard.ts

### Added - 2026-05-27 — Painel de Priorizações: 2 cards novos + tag "Valida vet-curador"
<!-- area: admin · status: entregue · i18n: 1.114.0 -->
- Novo card `cohort-suggester-hardening` (in_test) representando o trabalho do dia: edge function `suggest-cohort-ideas` com gemini-3.1-pro-preview, validação server-side e fallback gpt-5.4.
- Novo card `cohort-suggestions-clinical-review` (next) para a revisão clínica das 6 sugestões geradas pela vet-curadora — bloqueia o envio do documento ao parceiro clínico sem validação.
- Novo campo `requiresVetCuratorValidation` no tipo `PrioritizationCard` + badge rosa "Valida vet-curador" (ícone estetoscópio) no `PrioritizationCardItem`. Aplicado inicialmente ao card de revisão clínica.
- Reordenação de `order` para acomodar os novos cards (1–12).
- Files: src/data/prioritizationBoard.ts, src/components/administrador/priorizacoes/PrioritizationCard.tsx

### Fixed - 2026-05-26 — suggest-cohort-ideas: modelo + validação + retry/fallback
<!-- area: admin · status: entregue · i18n: 1.114.0 -->
- Trocado modelo primário de `gemini-3.5-flash` (ignorava o JSON Schema do tool-call: devolvia 5 cohorts sem `target_model_id` nem `record_requirements`) para `google/gemini-3.1-pro-preview`.
- Adicionada **validação server-side** das 4 regras duras: exatamente 6 cohorts, 6 `target_model_id` distintos cobrindo todos os modelos, `record_requirements` não-vazio em todos, ≥2 cohorts com `cohort_population` deceased/mixed.
- Pipeline com 3 camadas: tentativa primária → retry no primário com mensagem de correção apontando as `issues` → fallback automático para `openai/gpt-5.4`. 429/402 do primário disparam fallback direto.
- Reforço inline da estrutura JSON esperada no user prompt (modelos respeitam melhor o schema quando ele aparece também no prompt).
- Resposta passa a expor `attempts[]` e `validation_warnings` para diagnóstico, sem quebrar a UI atual.
- Files: supabase/functions/suggest-cohort-ideas/index.ts

### Added - 2026-05-26 — 6 modelos preditivos + cohorts ancorados (amplo × estratificado, vivos × falecidos)
<!-- area: admin · status: entregue · i18n: 1.114.0 -->
- **Catálogo de modelos preditivos expandido de 4 → 6**: adicionados `mortality-risk-window` (Risco de Mortalidade e Janela de Intervenção — 100% treinado em cães já falecidos como gold label) e `treatment-adherence` (Previsão de Adesão ao Tratamento — sinais operacionais PetLove de recompra/agendamentos/check-ins). Ambos entram com status `initial`, `totalPetsMonitored=0` e `nextMilestone` apontando para o primeiro cohort-âncora — sem mock inflado.
- **Sugestões de cohort reorientadas para VALOR PetLove (não preenchimento de KG)**: novo system prompt em `suggest-cohort-ideas` orienta o LLM a propor exatamente 6 cohorts (1 por modelo), com pelo menos 2 cohorts de cães falecidos (`deceased`/`mixed`) para alimentar Disease Progression e Mortality Risk com trajetórias completas pré-óbito.
- **Duas larguras por cohort**: `broad` (N=1000–2500, padrão diluído, viabilidade alta) e `stratified` (N=150–400, padrão nítido, impacto alto) — mistura livre entre os 6 cohorts.
- **Migration**: novas colunas em `cohort_suggestions` — `pattern_family`, `value_to_partner`, `cohort_population` (`living`/`deceased`/`mixed`), `record_requirements` (jsonb), `target_model_id` (enum dos 6 modelos), `target_model_expected_gain`, `breadth` (`broad`/`stratified`).
- **Card de sugestão enriquecido em `CohortAISuggester`**: tag de população (🟢 Vivos · ⚫ Falecidos · ⚪ Misto), badge de largura (Amplo/Estratificado), chip "🎯 Treina: [Modelo]" fechando o loop com o catálogo de modelos preditivos, bloco "Por que sugerimos isto" com `discoverable_pattern`, `value_to_partner`, `record_requirements` e `target_model_expected_gain`, e rótulos dos scores re-explicados ("Impacto = ganho operacional · Viabilidade = dado já existe na PetLove").
- **Bilingual all layers**: novas chaves `predictiveModels.models.mortality-risk-window.*` e `predictiveModels.models.treatment-adherence.*` em PT e EN; I18N_VERSION 1.113.0 → 1.114.0.
- Files: src/components/administrador/modelosPreditivos/data/predictiveModelsData.ts, src/components/administrador/priorizacoes/CohortAISuggester.tsx, supabase/functions/suggest-cohort-ideas/index.ts, supabase/migrations/*cohort_suggestions_expanded*.sql, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-26 — Senex 7.0: Painel de Priorizações com histórico + Population Insights com proveniência
<!-- area: admin · status: entregue · i18n: 1.113.0 -->
- **Kanban de Priorizações com log de movimentações**: nova tabela `prioritization_history` (card_id, from_status, to_status, moved_at, note) — toda movimentação de card no Kanban grava entrada automaticamente. Card mostra "Criado dd/mm/aa · N mov." com expansão completa do histórico (origem → destino + data).
- **Card #1 (Role visualization layer) marcado como entregue** via override no banco, com histórico semeado.
- **Seed do histórico** dos 10 cards do roadmap em 25/05/26 para servir de baseline.
- **Tag de origem nos insights de Population Insights**: cada card de descoberta/hipótese agora mostra de qual cohort sintético veio (badge azul-indigo com nome) ou se é resultado da análise cruzada pan-cohort (badge roxo "Pan-cohort (todos)").
- **Lista de insights por cohort** em `SyntheticCohortsManager`: bloco verde "Insights gerados (N)" lista os títulos dos insights extraídos com score de confiança lado a lado de cada cohort.
- **OriginalityDialog separado**: badge "✦ inédito / ~ parcial / ⌖ já publicado" agora abre dialog dedicado com evidências da literatura (Perplexity + Gemini + citações PubMed clicáveis), separado do drill-down de evidência do cohort.
- **InsightDrillDownDialog enxuto**: foco exclusivo em evidência do cohort — gráficos Recharts + lista expansível de pets sustentando o insight com condições/exames/medicações reais (formatação de exames `valor unidade (ref min–max)` em vez de JSON cru).
- **Análise pan-cohort** (`analyze-all-cohorts-patterns`): edge function dedicada que cruza padrões entre todos os cohorts prontos e gera insights com `cohort_id=null`.
- **Log de Análise renomeado e auto-expandido** durante execução em `CohortProgressLog`.
- Files: src/data/prioritizationBoard.ts, src/components/administrador/priorizacoes/PrioritizationBoard.tsx, src/components/administrador/priorizacoes/PrioritizationCard.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/components/administrador/priorizacoes/SyntheticCohortsManager.tsx, src/components/administrador/priorizacoes/OriginalityDialog.tsx, src/components/administrador/priorizacoes/InsightDrillDownDialog.tsx, src/components/administrador/priorizacoes/CohortProgressLog.tsx, supabase/functions/analyze-all-cohorts-patterns/index.ts, supabase/functions/check-insight-originality/index.ts, supabase/migrations/*prioritization_history*.sql

### Added - 2026-05-26 — Observabilidade e DnD na análise de cohorts
<!-- area: admin · status: entregue · i18n: 1.112.0 -->
- Log de execução estruturado em `analyze-cohort-patterns` persistido em `synthetic_cohorts.analysis_log` e exibido no card do cohort (paralelo ao log de geração).
- Botão "Analisar padrões" agora vira "Re-analisar (N)" após primeira execução, com tooltip + confirmação. Backend devolve 409 sem `force=true` se análise < 24h, evitando duplicação acidental.
- Badge do modelo (`google/gemini-3.5-flash`) visível durante e após a análise, e em cada card do Population Insights — atende ao princípio de transparência clínica.
- Drag-and-drop com `@dnd-kit/core` no Kanban de Priorizações (persistido em nova tabela `prioritization_overrides`, RLS admin-only) e no Population Insights v0 (atualiza `cohort_insights.stage` direto na DB).
- Files: supabase/functions/analyze-cohort-patterns/index.ts, src/components/administrador/priorizacoes/SyntheticCohortsManager.tsx, src/components/administrador/priorizacoes/PrioritizationBoard.tsx, src/components/administrador/priorizacoes/PopulationInsightsV0.tsx, src/components/administrador/priorizacoes/dnd/KanbanDnd.tsx

### Added - 2026-05-26 — Check de originalidade nas sugestões de cohort
<!-- area: admin · status: entregue · i18n: 1.111.0 -->
- Cada sugestão de cohort gerada pela IA agora passa por um check automático de originalidade em 3 camadas: base interna (embeddings em `study_embeddings` via `search_study_chunks`), PubMed E-utilities (esearch/esummary) e Perplexity em modo `academic` (opt-in via toggle).
- Score 0–100 com badge (Alta / Média / Já bem estudado), popover com breakdown transparente por fonte (hits, top 3 títulos similares com link para PubMed, query exibida), link clicável para validar manualmente no Google Scholar e botão "Re-rodar".
- Fontes que falham aparecem como "indisponível" em vez de gerar score falso — o usuário sempre sabe se a busca realmente teve sucesso.
- Persistência em `cohort_suggestions` (novas colunas `originality_score`, `originality_status`, `originality_breakdown`, `originality_checked_at`). Disparado em background por `suggest-cohort-ideas` via `EdgeRuntime.waitUntil`; UI faz polling enquanto pendente.
- Files: supabase/functions/check-cohort-originality/index.ts, supabase/functions/suggest-cohort-ideas/index.ts, src/components/administrador/priorizacoes/CohortOriginalityBadge.tsx, src/components/administrador/priorizacoes/CohortAISuggester.tsx, supabase/migrations/20260526015941_*.sql

### Fixed - 2026-05-25 — Cohort travado sem heartbeat volta a poder ser destravado
<!-- area: admin · status: entregue · i18n: 1.111.0 -->
- `CohortAISuggester` agora considera a última atividade disponível (`last_heartbeat_at`, último log ou `created_at`) para detectar travamentos. Isso corrige os cohorts antigos que ficavam presos em `generating` sem heartbeat e nunca exibiam o botão **Forçar finalização**.
- Após a finalização manual, o card local é atualizado imediatamente para `ready`/`failed`, sem depender do próximo ciclo de polling.
- O cohort travado `SRD sênior (8+) com OA em uso crônico de AINEs vs. Bedinvetmab` foi destravado no backend e marcado como `ready` com 175/200 pets preservados.
- Files: src/components/administrador/priorizacoes/CohortAISuggester.tsx

### Changed - 2026-05-25 — Cohorts sintéticos: geração clínica rica + painel estatístico
<!-- area: admin · status: entregue · i18n: 1.111.0 -->
- `generate-synthetic-cohort` agora emite pets clinicamente completos: 1-4 condições (com severidade/status/origem), 2-5 exames (com `results_json` e `flags_abnormal`), 1-3 **consultas** cronológicas (`chief_complaint`, `assessment`, `plan`, peso, BCS, última marcada `is_latest=true`), 0-3 **medicações** vinculadas à consulta e 1-2 **notas clínicas** (anamnese livre) — inspirado na geração de pacientes de exemplo.
- Validação descarta e regenera pets sem condições ou sem exames antes do insert; `BATCH_SIZE` reduzido de 25 → 10 para evitar timeout no último batch.
- Novo **painel estatístico** colapsável dentro de cada card de cohort `ready` (`CohortStatsPanel`): demografia (idade/peso médios, % macho/fêmea, % castrado), top 5 raças, top 8 condições com distribuição de severidade, cobertura clínica (condições/exames/consultas por pet) e flags laboratoriais — alimentado pela nova RPC `get_cohort_stats(p_cohort_id)` (SECURITY DEFINER, admin-only).
- `CohortPatientsDialog` agora exibe consultas e medicações além de perfil/condições/exames.
- I18N_VERSION 1.110.0 → 1.111.0 com chaves `prioritization.syntheticExplorer.stats.*` em PT/EN.
- Files: supabase/functions/generate-synthetic-cohort/index.ts, supabase/migrations/20260525222733_get_cohort_stats.sql, src/components/administrador/priorizacoes/{CohortStatsPanel,CohortPatientsDialog,SyntheticCohortsManager}.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-25 — Cohorts sintéticos: explorador de pacientes por cohort
<!-- area: admin · status: entregue · i18n: 1.110.0 -->
- Aba **Cohorts sintéticos** agora tem botão **"Ver pacientes"** em cada cohort para abrir um dialog com lista pesquisável dos pets gerados naquele cohort e drill-down individual com perfil, condições e exames sintéticos reais gravados no banco.
- O fluxo resolve a lacuna de inspeção operacional: após a geração parcial (ex.: 175/200), já é possível auditar os registros efetivamente persistidos sem sair da aba de priorizações.
- I18N_VERSION 1.109.0 → 1.110.0 com novas chaves `prioritization.syntheticExplorer.*` em PT/EN.
- Files: src/components/administrador/priorizacoes/{SyntheticCohortsManager,CohortPatientsDialog}.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Added - 2026-05-25 — Playground Multi-Fonte + SourcePanel (fundação #8)
<!-- area: admin · status: entregue · i18n: 1.108.0 -->
- Serviço `MultiSourceResolver` (`src/services/multi-source-resolver.ts`) com 5 providers independentes: KG curado (peso 1.0, via RPC `get_relations_graph_data`), histórico do cão (0.95), cohort sintético (0.7), cães tratados (0.6, stub) e internet via Perplexity (0.3). Detecção automática de conflito quando ≥ 2 fontes de peso ≥ 0.6 retornam claims com polaridade divergente.
- Edge function `query-perplexity` (modelo `sonar`, escopo canino restrito, extração de confidence high/medium/low, citações).
- Componente `<SourcePanel />` em `src/components/clinical/SourcePanel.tsx`: visibilidade híbrida por `useRoleView()` — tutor vê só síntese + nota neutra; vet vê painel colapsável com badge de peso, confiança e conflito; arquiteto vê também tags de modelo.
- Nova sub-aba **"Playground multi-fonte"** em `/administrador?tab=priorizacoes` para validar a fundação antes de plugar nas telas clínicas reais.
- Chaves i18n PT/EN sob `prioritization.multiSource.*` + `prioritization.tabs.{synthetic,population,roles,playground}`. I18N_VERSION → 1.108.0.
- Remoção do `src/data/populationInsightsSeed.ts` (não usado desde a migração para `cohort_insights`).
- Files: src/services/multi-source-resolver.ts, src/components/clinical/SourcePanel.tsx, src/components/administrador/priorizacoes/MultiSourcePlayground.tsx, src/pages/administrador/PriorizacoesTab.tsx, supabase/functions/query-perplexity/index.ts, supabase/config.toml, src/i18n.ts, src/locales/{pt,en}/translation.json, src/data/projectOrganograma.ts

### Added - 2026-05-25 — Painel de Priorizações + Camada de Visualização de Papéis
<!-- area: admin · status: entregue · i18n: 1.105.0 -->
- Nova aba `/administrador?tab=priorizacoes` em "Governança & IA": Kanban com 5 colunas (Backlog · Próximo · Em curso · Em teste · Entregue) seedado com 10 cards ordenados (role-view-layer → meta-kg-phase-b). Cada card declara `area | effort | value[] | dependsOn[] | rationale`. Fonte única do roadmap operacional — substitui na prática `docs/STANFORD_DEMO.md`.
- Sub-tab **Gerador de Sugestões de Cohort**: formulário guiado (raça, idade, peso, condições, medicação, N-alvo, exclusões, formato de entrega, privacidade) que exporta Markdown copiável / downloadable para enviar à PetLove pedindo recortes específicos do banco histórico (1M+ cães).
- **Camada de visualização de papéis** (não é segurança — é redução de ruído): `src/config/role-views.ts` declara 5 perfis (`platform_architect`, `rnd_lead`, `vet_curador`, `vet_responsavel`, `tutor`) com `allowedAdminGroups` e `defaultRoute`. `RoleViewContext` persiste seleção em localStorage. `RoleViewSwitcher` no Header só aparece para admin real e filtra grupos da sidebar admin via `AdminSidebarGroups`. RLS real fica para quando entrar o 1º vet PetLove externo (card #9 do board).
- i18n: +~40 chaves em `prioritization.*` + `admin.sidebar.governanceAI.priorizacoes` (PT+EN). I18N_VERSION 1.104.0 → 1.105.0.
- Organograma: novo nó "Painel de Priorizações + Camada de Visualização de Papéis" sob `admin`.
- Files: src/pages/administrador/PriorizacoesTab.tsx, src/components/administrador/priorizacoes/{PrioritizationBoard,PrioritizationCard,CohortRequestGenerator}.tsx, src/data/prioritizationBoard.ts, src/config/role-views.ts, src/contexts/RoleViewContext.tsx, src/components/layout/{RoleViewSwitcher,Header}.tsx, src/components/administrador/sidebar/{AdminSidebarGroups,groups/GovernanceAIGroup}.tsx, src/config/admin-tabs.ts, src/App.tsx, src/i18n.ts, src/locales/{pt,en}/translation.json, src/data/projectOrganograma.ts

### Added - 2026-05-25 — Roadmap Meta-KG: gatilhos quantitativos para acionar a Fase B
<!-- area: meta · status: entregue · i18n: 1.104.0 -->
- `MetaKgRoadmapCard` agora exibe 3 métricas vivas que destravam a Fase B: (1) meta-estudos aprovados ≥ 10, (2) lições redundantes entre estudos ≥ 3, (3) conflitos recipe↔anti-padrão ≥ 1. Cada métrica renderiza barra de progresso e selo verde quando o alvo é atingido. Card mostra badge global "Pronto para iniciar" / "Aguardando massa crítica".
- Novo hook `useMetaKgPhaseBMetrics`: query React-Query sobre `meta_studies` (apenas `lifecycle_status='approved'`), normaliza statements de `architectural_patterns`/`methodological_recipes`/`anti_patterns_pitfalls` (lowercase, slice 120 chars) e calcula redundância (mesmo statement em ≥2 estudos por bucket) + conflito (mesmo statement como recipe e anti-padrão).
- i18n: +13 chaves em `fundamentos.roadmap.*` (PT+EN). I18N_VERSION 1.103.0 → 1.104.0.
- Files: src/components/administrador/fundamentos/MetaKgRoadmapCard.tsx, src/hooks/useMetaKgPhaseBMetrics.ts, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-22 — Observatório Clínico v2.1: filtros globais, métricas NNT/HR/TTR, fluxo mensal e caminhos biológicos
<!-- area: admin · status: entregue · i18n: 1.103.0 -->
- Coorte sintética rebalanceada para totais não-redondos: 8.473 tratados / 13.916 espelho / 8.473 gêmeos digitais (1 twin por tratado). Helpers novos em `syntheticCohort.ts`: `meanTrajectoryWithCI` (IC95%), `computeNNT`, `computeHazardRatio`, `computeTimeToResponse` (mediana + IQR), `computeMonthlyFlow` (active/joined/churned).
- `ClinicalFiltersBar` sticky no topo da tab com 7 filtros (condição, raça, idade, região, adesão, janela de protocolo, resposta) + hook `useFilteredCohort` que propaga a coorte filtrada para todas as sub-abas.
- `CohortObservatory`: novo bloco "Métricas de impacto clínico" (NNT/HR/TTR) e `AdherenceMonthlyStack` substitui o funil 0-3-6m por barras empilhadas mensais (24 meses) com churn negativo abaixo do eixo.
- `LongitudinalTrajectories`: banda IC 95% nas trajetórias de tratados (Area + média).
- `ModelFeedbackLoop` agora conversa com os 4 modelos reais de `predictiveModelsData`: tabela com acurácia atual, drift sintético derivado do gemeo×real, Δ aprendizado mensal e link "Ver evolução" → `/administrador?tab=modelos-preditivos`. Cards superiores reagem aos modelos (média de acurácia).
- Nova 6ª aba **Caminhos Biológicos** (`BiologicalPathways.tsx` + `src/data/biologicalPathways.ts`): SVG nativo com 4 trilhas (Composto → Mecanismo → Processo → Desfecho) para 8 condições, largura da seta ∝ evidência sintética, notação `→ ⊣ ⇢`.
- i18n: +~60 chaves em `clinicalMonitoring.v2.{filters, metrics, monthlyFlow, pathways, loopModels}` (PT+EN). I18N_VERSION 1.102.0 → 1.103.0.
- Files: src/utils/syntheticCohort.ts, src/hooks/useFilteredCohort.ts, src/data/biologicalPathways.ts, src/components/administrador/clinical-monitoring/{ClinicalMonitoringTab,ClinicalFiltersBar,CohortObservatory,AdherenceMonthlyStack,LongitudinalTrajectories,ModelFeedbackLoop,BiologicalPathways}.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-22 — Monitoramento Clínico vira Observatório Longitudinal (coorte sintética 10k+16k+10k)
<!-- area: admin · status: entregue · i18n: 1.102.0 -->
- `ClinicalMonitoringTab` reescrita em 5 abas: Observatório da Coorte, Trajetórias Longitudinais, Explorador de Pacientes, Sinais de Descoberta e Loop de Modelos.
- Novo `src/utils/syntheticCohort.ts`: gerador determinístico (PRNG mulberry32, seed fixa) de 10.000 cães tratados + 16.000 pares observacionais (coorte-espelho) + 10.000 gêmeos digitais projetados. Todos os registros carregam `is_synthetic: true` e IDs `#A-NNNNN` / `#M-NNNNN`. Modelagem por 8 condições (OA, DRC, CDS, hepato, cardio, obesidade, IBD, sarcopenia) com curva sigmoide amortecida por adesão.
- `PatientDetailDialog`: drill-down com snapshot T0, stack Senex aprovado, proposta ao tutor (custo/anos ganhos/ROE), trajetória real × gêmeo digital × espelho, tabela de pares observacionais e linha do tempo de ajustes de protocolo.
- `DiscoverySignals` cruza coorte sintética com `meta_studies` reais (candidatos a reposicionamento puxados do banco curado).
- `ModelFeedbackLoop` exibe drift previsto × observado, acurácia do gêmeo digital, atualizações no KG e lacunas detectadas.
- `SyntheticDataBadge` ostensivo no topo + chip "Sintético" em cada card de paciente.
- i18n: adicionado namespace completo `clinicalMonitoring.v2.*` em PT/EN (88 chaves novas). I18N_VERSION 1.101.0 → 1.102.0.
- Files: src/utils/syntheticCohort.ts, src/components/administrador/clinical-monitoring/*, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-22 — Depósito de estudos arquiteturais ganha citações ricas; ilustrações do Kanban removidas
<!-- area: admin · status: entregue · i18n: 1.101.0 -->
- Novo `MetaStudyDetailedCard.tsx` na aba "Estudos Arquiteturais": exibe selo de confiabilidade ★ X/5 (popover com as 5 dimensões), links Fonte + DOI + chat contextual, e seção colapsável "Citações & excertos detalhados" que renderiza `quantitative_parameters` (fórmulas/λ/thresholds), `evaluation_metrics`, `architectural_patterns`, `methodological_recipes` e `anti_patterns_pitfalls` — cada item com statement, quote literal, `applies_to` e weight.
- Kanban: ilustrações geradas por IA removidas (não representavam o conteúdo dos papers). `CoverThumb` agora sempre renderiza ícone temático por `kind` sobre gradiente. Botões "Gerar capas" (header) e "capa" (por card) eliminados.
- Edge function `generate-meta-study-cover` e coluna `cover_image_url` permanecem no banco (sem uso na UI), permitindo reativação futura caso queiramos diagramas reais do conteúdo.
- Files: src/components/administrador/fundamentos/MetaStudyDetailedCard.tsx, src/pages/administrador/FundamentosTab.tsx, src/components/administrador/fundamentos/MetaStudyKanban.tsx, src/i18n.ts

### Added - 2026-05-22 — Meta-Estudos "Stanford-grade": capas IA, badge de Core Rules e chat contextual
<!-- area: admin · status: entregue · i18n: 1.100.0 -->
- Coluna `meta_studies.cover_image_url` + bucket público `meta-study-covers`. Style-guide fixo (paleta navy/gold/parchment, isométrico editorial) garante consistência visual entre papers.
- Edge function `generate-meta-study-cover` (Gemini image): gera 1x por paper, bucket público, com tema derivado do `kind`. Backfill via botão "Gerar capas" no Kanban (5/5 papers atuais já cobertos).
- Edge function `chat-meta-study`: chat streaming com contexto = summary + key_claims + proposed_rules + core_rule_evidence do próprio registro (sem RAG novo).
- Componente `CoreRulesEvidenceBadge`: popover com agregação por relação (`supports`/`contradicts`/`modulates_weight`) listando regras impactadas + citações textuais.
- Card do Kanban redesenhado: thumbnail de capa 56×56, badges de Core Rules, botões inline `paper` (link externo) e `chat`.
- Files: supabase/functions/generate-meta-study-cover/index.ts, supabase/functions/chat-meta-study/index.ts, src/components/administrador/fundamentos/MetaStudyChatDialog.tsx, src/components/administrador/fundamentos/CoreRulesEvidenceBadge.tsx, src/components/administrador/fundamentos/MetaStudyKanban.tsx

### Changed - 2026-05-22 — Kanban Meta-Estudos: breakdown de confiabilidade inline
<!-- area: admin · status: entregue · i18n: 1.99.0 -->
- Card do Kanban agora exibe breakdown das 5 dimensões de confiabilidade com sliders inline (expansível) e recálculo do `reliability_overall` em tempo real (mesma fórmula da coluna gerada no DB).
- Mini barra de contribuição colorida por dimensão + chips com nº de tripletes vinculados (`core_rule_evidence.meta_study_id`), nº de propostas e idade do estudo.
- Salvamento inline (Salvar/Descartar) com aviso de drift se overall salvo divergir do preview local.
- Files: src/components/administrador/fundamentos/MetaStudyKanban.tsx

### Added - 2026-05-22 — Fase 1: identidade canônica + evidência negativa
<!-- area: kg · status: parcial · i18n: 1.99.0 -->
- Colunas `canonical_id` + `canonical_source` em `health_conditions` e `nutraceuticals` (com índice único parcial e CHECK de fonte).
- Coluna `evidence_polarity` em `triplet_extractions` (`positive` default; aceita `negative`, `neutral`, `inconclusive`). Backfill marca tripletes com predicates `fails_to_treat*`/`no_effect*`/`worsens*`/`contraindicat*` como `negative`.
- Documento `docs/ONTOLOGY_SOURCES.md` com URLs oficiais de OMIA, MeSH, ChEBI, Mondo + licenças + procedimento de import + lista de papers de fundamentação.
- Script `scripts/import-ontology-dump.ts` (skeleton): parser do `omia.txt` filtrando taxonomy 9615 (Canis), gancho para parser MeSH XML.
- Pendente nesta fase: parser MeSH completo (precisa lib `sax`), UI de badge "Evidência negativa" nos cards de triplete, seed manual dos 5–10 pares `FAILS_TO_TREAT` canônicos, integração da polaridade no scoring de recomendação.
- Files: supabase/migrations/*, docs/ONTOLOGY_SOURCES.md, scripts/import-ontology-dump.ts, src/i18n.ts

### Added - 2026-05-22 — Fundamentos: Sandbox (lifecycle) + Confiabilidade dos meta-estudos (Fase A)
<!-- area: admin · status: entregue · i18n: 1.98.0 -->

- `meta_studies` ganhou coluna `lifecycle_status` (enum `meta_study_lifecycle`: inbox / triaged / in_review / approved / archived). Novos uploads caem em `inbox` por padrão.
- 5 dimensões de confiabilidade 0–5 (`reliability_methodology`, `reliability_evidence_base`, `reliability_applicability`, `reliability_reproducibility`, `reliability_relevance`) + `reliability_suggested` JSONB + `reliability_overall` (coluna gerada = média das notas preenchidas).
- Backfill seguro: estudos com `proposed_rules`/`key_claims` → `triaged`; estudos já com `core_rule_evidence` vinculada → `approved`.
- Nova aba "Sandbox / Kanban" em Fundamentos com 4 colunas (Inbox · Triados · Em revisão · Aprovados) + filtro de arquivados. Cards mostram título, ano, kind, nº de regras propostas e badge de confiabilidade colorida.
- Diálogo de edição: 5 sliders 0–5 com descrição por dimensão, botões para avançar/voltar estado, recálculo automático da nota geral.
- Card "Roadmap do Meta-KG" fixo no topo da aba Ingestão lembrando Fase B (lições como entidades + tripletes arquiteturais + RC↔lição) e Fase C (RAG do meta-KG quando ≥30 estudos).
- Promoção a `approved` permanece bloqueada pela curadoria das `proposed_rules` existente (regra de segurança preservada).
- I18N_VERSION: 1.97.0 → 1.98.0.
- Files: supabase/migrations/<lifecycle+reliability>, src/components/administrador/fundamentos/MetaStudyKanban.tsx, src/components/administrador/fundamentos/MetaKgRoadmapCard.tsx, src/pages/administrador/FundamentosTab.tsx, src/i18n.ts

### Changed - 2026-05-21 — Docs: contrato `callAITask` em TECHNICAL_DECISIONS + GRAPHRAG
<!-- area: meta · status: entregue · i18n: 1.97.0 -->

- `docs/TECHNICAL_DECISIONS.md` v1.1.0: nova seção **AI Task Router (`callAITask`)** com contrato de chamada (taskId, caller, messages/input, tools+tool_choice, fallback, reasoning_effort, temperature), ordem de resolução (override em `ai_configurations` → prompt ativo em `ai_prompt_versions` → fallback do caller → default), telemetria automática (`ai_task_invocations` + `ai_task_status`), tratamento de 429/402/413/404/502 e regras de quando NÃO usar o router (Google AI File API direto: `gemini-file-search` e PDF > 7 MB do `extract-meta-study`). Entrada no Histórico de Decisões.
- `docs/GRAPHRAG_ARCHITECTURE.md` v2.1.0: bloco de governança LLM no topo de Edge Functions com tabela das 4 funções Curadoria/KG roteadas via `callAITask` e a função fora de escopo.
- Files: docs/TECHNICAL_DECISIONS.md, docs/GRAPHRAG_ARCHITECTURE.md

### Changed - 2026-05-21 — Consolidação Curadoria/KG no `ai-task-router` (relatório)
<!-- area: meta · status: entregue · i18n: 1.97.0 -->

- Fechamento do ciclo de migração Curadoria/KG. Funções roteadas via `callAITask`: `kg-evidence-gap-fill` (`kg_gap_fill`), `extract-meta-study` (`meta_study_analysis`, caminho Google AI File API mantido fora do router), `extract-study-entities` (`extraction_stage1/2/3`, com `tools`+`tool_choice` e fallback `google/gemini-3-pro-preview` temp=0.1), `generate-triplets` (`triplet_extraction`, Phase 1 discovery + Phase 2 tool calling, resposta reconstruída para preservar parser downstream, tratamento 429/402 reintroduzido).
- **`gemini-file-search`** auditada e formalmente fora do escopo: usa Google AI Direct API com `fileData.fileUri` + corpora `file_search` nativos, incompatíveis com o Gateway.
- Estado final em `src/config/ai-tasks.ts`: **13 connected · 7 legacy · 3 planned** (23 tasks). `lab_driven_adjustment` e `treatment_proposal_12m` respondem no router (healthcheck OK) mas seguem `planned` porque os consumidores clínicos ainda usam o caminho legado — alvo do próximo lote.
- Validação: `ai-task-healthcheck` **8/8 OK** (815/851/851/820/2470/812/784/864 ms); Vitest **94/94** passando (falha pré-existente de `localStorage` em Node ignorada).
- Relatório consolidado gerado em `/mnt/documents/RELATORIO_MIGRACAO_AI_ROUTER_2026-05-21.md` com padrão `callAITask` de referência para os próximos lotes (Clínico + legados a deprecar).
- Files: CHANGELOG.md, /mnt/documents/RELATORIO_MIGRACAO_AI_ROUTER_2026-05-21.md

### Changed - 2026-05-21 — Migração Curadoria/KG: fechamento (gemini-file-search fica fora do router)
<!-- area: kg · status: entregue · i18n: 1.97.0 -->

- **`gemini-file-search`** auditada: todas as chamadas LLM usam a **Google AI Direct API** (`generativelanguage.googleapis.com`) com `fileData.fileUri` referenciando arquivos da File API + corpora/file_search nativos. O Lovable Gateway não aceita esses URIs nem expõe File Search nativo, então a função permanece **fora do escopo do router** por design — análogo ao caminho Google AI File API do `extract-meta-study`. Sem mudanças de código.
- Healthcheck pós-migração (Curadoria/KG): `ai-task-healthcheck` retornou **8/8 OK** — `extraction_stage1` (815ms), `extraction_stage2` (851ms), `extraction_stage3` (851ms), `triplet_extraction` (820ms), `relations_auditor` (2470ms), `geroprotector_stack` (812ms), `lab_driven_adjustment` (784ms), `treatment_proposal_12m` (864ms).
- Vitest: 94/94 passando (1 suite com falha pré-existente de `localStorage` em Node, alheia ao router).
- Files: CHANGELOG.md

### Changed - 2026-05-21 — Migração Curadoria/KG: generate-triplets no router
<!-- area: kg · status: parcial · i18n: 1.97.0 -->

- **`generate-triplets`** (Phase 1 discovery por chunk + Phase 2 structuring com tool calling) migrada para `callAITask('triplet_extraction', ...)`. Phase 2 preserva `tools=[extractTripletsToolDef]` + `tool_choice` forçado; resposta reconstruída no shape `phase2Data.choices[0].message.{content, tool_calls}` para manter o parser downstream intacto. Tratamento de 429/402 reintroduzido a partir das mensagens de erro do router.
- Status reconciliado em `src/config/ai-tasks.ts`: `triplet_extraction` passa de `legacy` para `connected` (13 connected · 7 legacy · 3 planned).
- Smoke test: `ai-task-healthcheck {triplet_extraction}` → **200 OK** (827 ms).
- Files: supabase/functions/generate-triplets/index.ts, src/config/ai-tasks.ts

### Changed - 2026-05-21 — Migração Curadoria/KG (lote 3/3): extract-study-entities no router
<!-- area: kg · status: parcial · i18n: 1.97.0 -->

- **`extract-study-entities`** (Stage 1 + Stage 2 + Stage 3 + extração de título) migrada para `callAITask` via `ai-task-router`. Helper `callLovableAI` agora recebe `taskId` e roteia respectivamente para `extraction_stage1`, `extraction_stage2`, `extraction_stage3` (título reusa `extraction_stage1`). Preserva `tools` + `tool_choice` forçado e fallback (`google/gemini-3-pro-preview`, temp=0.1).
- Status reconciliado em `src/config/ai-tasks.ts`: `extraction_stage1/2/3` passam de `legacy` para `connected` (12 connected · 8 legacy · 3 planned).
- Smoke test: `ai-task-healthcheck {extraction_stage1, extraction_stage2, extraction_stage3}` → **200 OK** (825/910/781 ms).
- Files: supabase/functions/extract-study-entities/index.ts, src/config/ai-tasks.ts

### Changed - 2026-05-21 — Migração Curadoria/KG (lote 2/3): extract-meta-study no router
<!-- area: kg · status: parcial · i18n: 1.97.0 -->

- **`extract-meta-study`** (caminho gateway) migrada para `callAITask('meta_study_analysis', ...)`, preservando `tools=[TOOL_V2]` + `tool_choice` forçado e fallback explícito (`google/gemini-3-pro-preview`, reasoning=high, temp=0.2). Caminho Google AI File API (PDFs > 7MB) mantido fora do router por usar `generativelanguage.googleapis.com` diretamente — fora do escopo do gateway.
- Erros do gateway são re-mapeados (`429`/`402`/`413`/`404`/`502`) com a mesma UX anterior (mensagens e `options[]` no payload de falha).
- Smoke test: `ai-task-healthcheck {meta_study_analysis}` → **200 OK em 907ms**.
- Files: supabase/functions/extract-meta-study/index.ts

### Changed - 2026-05-21 — Migração Curadoria/KG (lote 1/3): kg-evidence-gap-fill plugada no router
<!-- area: kg · status: parcial · i18n: 1.97.0 -->

- **`kg-evidence-gap-fill`** migrada para `callAITask('kg_gap_fill', ...)` preservando tool calling (`assess_evidence`) e fallback explícito para `google/gemini-3-flash-preview`. Troca de modelo no painel Governança IA agora afeta esta tarefa em runtime, e cada invocação é registrada em `ai_task_invocations` + `ai_task_status` com latência, tokens e custo estimado.
- **Smoke test em produção**: deploy + healthcheck POST `{task_ids:["kg_gap_fill"]}` → 200 OK em 870 ms.
- **Status atualizado** em `src/config/ai-tasks.ts`: `kg_gap_fill` agora `connected`. Real: **9 connected · 11 legacy · 3 planned**.
- **Análise** do lote Curadoria/KG restante: `consolidate-knowledge-graph` (380 linhas) não faz nenhuma chamada LLM — apenas metadata/Neo4j, fica fora do escopo do router. `extract-meta-study` (720 linhas) tem dupla via (Google AI File API direto para PDFs grandes + Lovable Gateway para pequenos) com tratamento de erro muito específico (413/429/402, friendly messages, abort signals) — migração precisa de turno dedicado para preservar essa semântica. `extract-study-entities` (1201), `generate-triplets` (1362) e `gemini-file-search` (2602) idem — cada um é trabalho de meio turno isolado.
- Files: supabase/functions/kg-evidence-gap-fill/index.ts, src/config/ai-tasks.ts

### Fixed - 2026-05-21 — Healthcheck IA validado em produção + reconciliação de status
<!-- area: admin · status: entregue · i18n: 1.97.0 -->

- **Smoke test do `ai-task-healthcheck` em produção**: deploy + POST `{task_ids:["translation_conditions"]}` → 200 OK em 884 ms (`google/gemini-3-flash-preview`). Pipeline ponta-a-ponta validado (router resolve modelo + prompt ativo, grava em `ai_task_status`, retorna telemetria).
- **Reconciliação `ai-tasks.ts`**: `translation_conditions` marcado como `connected` (a função `translate-conditions` já chama `callAITask()` desde a Fase 2.5 — status estava desatualizado). Contagem real agora: **8 connected · 12 legacy · 3 planned**.
- Files: src/config/ai-tasks.ts

### Added - 2026-05-21 — Senex 6.0: skin anatômica em camadas completa + componente DogAnatomyLayered
<!-- area: vet-ui · status: entregue · i18n: 1.97.0 -->

- **4 novas camadas anatômicas** geradas com Imagen premium em estilo ilustração científica clean (1024×768, PNG): `dog_digestive.png` (digestivo - estômago, intestinos, fígado), `dog_urinary.png` (rins + ureteres + bexiga), `dog_skeleton.png` (esqueleto completo lateral) e `dog_nervous.png` (cérebro + medula + nervos periféricos).
- **Componente `DogAnatomyLayered`** (`src/components/pet/DogAnatomyLayered.tsx`): viewer empilhado que faz cross-fade entre camadas via CSS opacity (500ms transition) sobre a silhueta base. API: `activeLayers={['cardio', 'urinary']}`, `layerOpacity`, `showLegend`. Sem dependências 3D — substituível por `react-three-fiber` na fase 6.1 sem mudar a API consumidora.
- Stack agora cobre os 6 sistemas mais usados no Gêmeo Digital (silhueta, cardio, digestivo, urinário, esquelético, nervoso). Próximos sistemas (endócrino/pâncreas, pele/pelo, linfático) ficam para 6.1 junto com o modo 3D opcional via Sketchfab CC-BY.
- Files: src/components/pet/DogAnatomyLayered.tsx, src/assets/anatomy/dog_digestive.png, src/assets/anatomy/dog_urinary.png, src/assets/anatomy/dog_skeleton.png, src/assets/anatomy/dog_nervous.png

### Added - 2026-05-21 — Senex 6.0: Healthcheck de tarefas IA (Fase 4) + skin anatômica em camadas (primeira leva)
<!-- area: admin · status: parcial · i18n: 1.97.0 -->

- **Edge function `ai-task-healthcheck`** (cron-ready, `verify_jwt=false` + `x-cron-secret` opcional): para cada tarefa com prompt ativo, pinga o modelo configurado no Lovable AI Gateway com prompt mínimo, mede latência e grava em `ai_task_status` (já existente). Suporta override por `task_ids[]` no body.
- **Painel de Governança IA** ganha banner "X de Y tarefas conectadas saudáveis · N falhando", botão **Rodar healthcheck** manual, badge vermelho **Falhando** (com erro no tooltip) e badge verde de latência em cada task card. Hooks `useAITaskStatus` + `useRunHealthcheck`.
- **Skin anatômica em camadas (Gêmeo Digital)** — primeira leva: silhueta canina lateral (`dog_silhouette.png`) e sistema cardio-respiratório (`dog_heart_lungs.png`) gerados com Imagen premium em estilo de ilustração científica clean (1536×1024 PNG transparente), salvos em `src/assets/anatomy/`. Próximas camadas (fígado/GI, rins/urinário, articulações, cérebro/espinha, pâncreas, pele/pelo) e o componente `DogAnatomyLayered` que faz cross-fade conforme doença ativa ficam para a próxima volta.
- **Bump versão pública** Senex AI → **6.0.0** (mudança estrutural: eixo de Fundamentos Arquiteturais + eixo de Governança IA por Tarefa consolidados).
- **Diferido para a próxima volta** (escopo do plano 6.0 ainda em aberto): migração das 13 edge functions legacy para `callAITask()` (trabalho mecânico, fallback preservado garante zero regressão); 7 camadas anatômicas restantes; componente `DogAnatomyLayered`; documentação dos arquivos `ARCHITECTURE.md` / `docs/CURRENT_STATE.md` / `docs/STANFORD_DEMO.md` (revisão completa após fechar migrações).
- Files: supabase/functions/ai-task-healthcheck/index.ts, supabase/config.toml, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx, src/hooks/useAITaskStatus.ts, src/assets/anatomy/dog_silhouette.png, src/assets/anatomy/dog_heart_lungs.png, .lovable/plan.md

### Added - 2026-05-21 — Governança de IA: editor de prompts por modelo, troca de modelo e testes lado a lado (Fase 2)
<!-- area: admin · status: entregue · i18n: 1.95.0 -->

- **Edge function `ai-task-test`** (admin-only, `verify_jwt=true`): executa um prompt × modelo contra o Lovable AI Gateway, mede latência, tokens e custo estimado e grava em `ai_prompt_test_runs`. Suporta substituição de `{{input}}` no user prompt e passagem de `reasoning_effort` / `temperature`.
- **RPC `activate_ai_prompt_version` + trigger `trg_apv_single_active`**: garantem que apenas uma versão fique ativa por `(task_id, model_id)`. Ativação atômica restrita a admins (SECURITY DEFINER + `is_admin()`).
- **Componente `TaskDetailSheet`**: sheet lateral com 4 abas (Prompt, Modelo, Testar, Histórico). Editor com **highlighting heurístico** de segmentos model-specific (`<thinking>`, `reasoning_effort`, `context_caching`, delimitadores `===`, templates `{{var}}`). Botões "Salvar nova versão" e "Ativar" usam a RPC. Aba Testar roda Modelo A vs B em paralelo e exibe latência/tokens/custo. Histórico mostra as últimas 20 execuções da tarefa.
- **Hooks novos**: `useCreatePromptVersion`, `useActivatePromptVersion`, `useTaskTestRun`, `useTaskTestHistory` (React Query, invalidação automática).
- Files: supabase/functions/ai-task-test/index.ts, supabase/config.toml, src/components/administrador/configuracoes/TaskDetailSheet.tsx, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx, src/hooks/useAIPromptVersions.ts, src/i18n.ts

### Added - 2026-05-21 — Governança de IA: registro central de Modelos & Prompts por Tarefa (Fase 1)
<!-- area: admin · status: entregue · i18n: 1.94.0 -->

- **Schema `ai_prompt_versions` + `ai_prompt_test_runs` + `ai_model_radar`**: novas tabelas (RLS admin-only) para versionar prompts por `(task_id, model_id)`, registrar execuções de teste lado a lado e acumular sugestões automáticas de novos modelos. Trigger `validate_ai_model_radar_status` impede status inválido. Trigger `update_updated_at_column` mantém `updated_at` sincronizado.
- **Seed inicial**: 8 prompts do sistema (`extraction_stage1/2/3`, `triplet_extraction`, `relations_auditor`, `geroprotector_stack`, `lab_driven_adjustment`, `treatment_proposal_12m`) registrados como v1 ativos, criando baseline histórica.
- **Task Registry (`src/config/ai-tasks.ts`)**: mapeia 11 famílias de tarefa para o modelo recomendado no AI Gateway, modelos candidatos, parâmetros de routing (`reasoning_effort`, `temperature`, `context_caching`) e justificativa bilíngue PT/EN. Decisões registradas: meta-análise / auditoria de Core Rules → `openai/gpt-5.4` com `reasoning=high`; extração massiva de PDF → `google/gemini-3-pro-preview` com context caching; chat clínico factual → `google/gemini-2.5-pro` com caching; chat clínico crítico → `openai/gpt-5.4` reasoning=high.
- **Painel "Modelos & Prompts por Tarefa"** (read-only) em `/administrador?tab=ai-config`, posicionado acima do `AIModelSelector` legado: KPIs (tarefas registradas, prompts semeados, roteadas para GPT-5.4, com reasoning=high), filtro por categoria (extração, meta-análise, inferência clínica, chat, auditoria) e accordion expansível com modelo recomendado, badges de routing, modelos candidatos, consumidores (edge functions) e justificativa.
- **Hooks `useAIPromptVersions` / `useActiveAIPrompt`**: leitura via React Query da nova tabela, com staleTime de 30s.
- Files: supabase/migrations/20260521160844_233e5785-acfa-4994-8725-7a45895634c0.sql, src/config/ai-tasks.ts, src/hooks/useAIPromptVersions.ts, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx, src/components/administrador/ConfiguracoesIATab.tsx, src/i18n.ts

### Added - 2026-05-20 — Fundamentos: histórico por Core Rule + audit log de governança
<!-- area: admin · status: entregue · i18n: 1.93.0 -->

- **Nova tabela `core_rule_audit_log`**: registra cada `stance_detected` produzido pelo LLM e cada ação de governança (`promote`, `attach`, `resolve_keep`, `discard`, `approve_meta_study`) com `actor_user_id`, `created_at`, `justification` (curator notes) e `payload` JSON com snapshot da proposta. RLS: admin-only.
- **Aba "Histórico & Auditoria" em Fundamentos Arquiteturais**: lista todas as RCs com busca (RC-ID/título/categoria) e filtros por stance (`confirms`/`extends`/`contradicts`/`unrelated`) e por ação. Cada RC expansível mostra evidências vinculadas + log de auditoria com proposta, stance, ator, timestamp e justificativa. Bloco extra para entradas órfãs (rule_code referenciado que não existe mais).
- **Approve handler instrumentado**: `IngestaoMetaEstudo.approve()` agora grava em lote no audit log (1 entrada por stance detectada + 1 por ação tomada + 1 evento `approve_meta_study` agregado) usando `curatorNotes` como justificativa padrão.
- Files: supabase/migrations/*core_rule_audit_log*.sql, src/components/administrador/fundamentos/CoreRuleHistory.tsx, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, src/pages/administrador/FundamentosTab.tsx

### Added - 2026-05-20 — Meta-estudo: detecção de conflito com RCs ativas (governança)
<!-- area: admin · status: entregue · i18n: 1.93.0 -->

- **Stance classification em `proposed_rules`**: cada candidata agora é classificada pelo LLM como `confirms`, `extends`, `contradicts` ou `unrelated` em relação ao catálogo de Regras-Core ativas, com `conflicts_with[]` listando os `rule_id`s referenciados. Validação server-side rebaixa para `extends` se a stance reivindica conflito mas não cita rule_id válido.
- **3 lanes na UI de Ingestão**: 🔴 Conflitos (vermelho, promoção bloqueada — só permite "Manter RC atual" como evidência de governança ou "Descartar") · 🟢 Confirmações (verde, vira `core_rule_evidence` com `relation='supports'` em vez de duplicar a RC) · 🔵 Extensões/Novas (purple, fluxo atual de promoção para nova RC).
- **Salvaguarda**: o handler `approve` agora **bloqueia explicitamente** qualquer tentativa de promover proposta com `stance='contradicts'` para nova RC, exigindo resolução humana via "Manter RC atual" ou edição manual.
- Files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx
- Próxima fase (não incluída): versionamento de RCs (`version`, `superseded_by`, `rc_revisions`) para permitir as ações "Substituir RC atual" e "Coexistir com escopo diferente".

### Added - 2026-05-20 — Meta-estudo: digestão profunda + RCs deduzidas
<!-- area: admin · status: entregue · i18n: 1.93.0 -->

- **Schema de extração v2**: o tool-call `emit_meta_study_draft` agora pede 7 seções tipadas (padrões arquiteturais, receitas metodológicas, vocabulários/padrões, parâmetros quantitativos, anti-padrões, métricas de avaliação, perguntas em aberto) em vez de uma lista plana de "claims". Prompt exige ≥10 lições no total para papers não-triviais.
- **Canal para regras deduzidas**: novo array `proposed_rules[]` permite ao paper sugerir candidatas a Regra-Core que não mapeiam para nenhuma RC existente, em vez de silenciosamente descartá-las. O prompt orienta gerar ≥2 propostas em papers arquiteturais substantivos.
- **Origem epistêmica nas RCs**: tabela `core_rules` ganha coluna `origin` (`inductive` / `deductive` / `hybrid`) + provenance (`proposed_from_meta_study`, `promoted_at`, `promoted_by`). RC-001 e RC-002 marcadas como `inductive` (nasceram do chat); novas RCs promovidas via UI ganham `origin='deductive'`.
- **UI Fundamentos > Ingestão**: rascunho agora exibe seções tipadas (collapsibles coloridos por categoria) + bloco "Novas Regras-Core propostas" com ações **Promover** / **Descartar** por candidata. Promover gera RC ativa com `RC-NNN` auto-incrementado e link de volta ao meta-estudo.
- **Governança**: `docs/CORE_RULES.md` ganha seção "Origem epistêmica" + template atualizado; novo `docs/CORE_RULES_PROPOSED.md` documenta o ciclo de promoção; campo `extraction_schema_version='v2'` em `meta_studies` permite identificar estudos digeridos com schema antigo para re-digestão futura.
- Files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, docs/CORE_RULES.md, docs/CORE_RULES_PROPOSED.md, supabase/migrations/*core_rules_origin*.sql

### Fixed - 2026-05-20 — Meta-estudo: fallback automático para PDF grande
<!-- area: admin · status: entregue · i18n: 1.93.0 -->

- **Edge `extract-meta-study`** agora tenta fallback automático para PDFs acima do limite inline do gateway usando upload dedicado no Google AI File API, preservando o estudo completo sem truncamento silencioso.
- **Fluxo de análise**: PDFs pequenos continuam no gateway atual; PDFs grandes passam por upload dedicado + chamada direta ao Gemini 3 Pro com o mesmo schema estruturado e o mesmo `trace[]` por estágio.
- **Falhas reais** de PDF grande agora explicam se o bloqueio foi no fallback automático (upload/processamento do arquivo) antes de sugerir alternativas manuais.
- Files: supabase/functions/extract-meta-study/index.ts

### Changed - 2026-05-20 — Sidebar admin: nova família "Governança & IA"
<!-- area: admin · status: entregue · i18n: 1.93.0 -->

- Removido link órfão "Base de Conhecimento" (tab `knowledge-base-settings`) que não tinha conteúdo.
- Criada nova seção lateral **"Governança & IA"** (`GovernanceAIGroup`) separada de Configuração, agrupando: AI Config, AI Prompts, Organograma, Conformidade FDA/EMA/AVMA, Auditorias Técnicas, About Senex AI e Fundamentos Arquiteturais.
- Configuração mantém apenas: Ações, Analytics, Análise de ROI, Traduções, Design, Solicitações de Acesso.
- i18n: `admin.sidebar.governanceAI.title` (PT/EN) + chave `configuration.fundamentos` formalizada; bump 1.92.0 → 1.93.0.
- Files: src/components/administrador/sidebar/groups/GovernanceAIGroup.tsx, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/sidebar/AdminSidebarGroups.tsx, src/i18n.ts, src/locales/{pt,en}/translation.json

### Changed - 2026-05-20 — Ingestão de meta-estudos: Gemini 3 + drag&drop + log de digestão
<!-- area: admin · status: entregue · i18n: 1.92.0 -->

- **Edge `extract-meta-study`**: trocado modelo para `google/gemini-3-pro-preview`; PDFs agora são enviados nativamente como anexo multimodal (não mais string-placeholder); aceita `curator_notes` como diretriz vinculante separada do conteúdo do estudo; retorna `trace[]` com telemetria por estágio (extraction · rules_catalog · llm_analysis · structuring) e mensagens de erro acionáveis por HTTP code (429/402/413/422).
- **UI `IngestaoMetaEstudo.tsx`**: dropzone drag&drop com PDF/.md/.txt/.docx **obrigatório** (até 20MB); campo "Notas do curador" (até 4000 chars, markdown) substitui o textarea genérico de texto; DOI/URL movido para `<details>` colapsado; painel "Log de digestão" sempre visível com 5 estágios (upload + os 4 do edge), ícones de status, duração e detalhe — espelha o padrão do pipeline clínico.
- **Schema**: nova coluna `meta_studies.curator_notes TEXT` persiste as diretrizes do curador junto com o estudo aprovado.
- Files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, src/i18n.ts, supabase/migrations/*_curator_notes.sql

### Added - 2026-05-20 — Ingestão curada de meta-estudos arquiteturais (Fase 3.3)
<!-- area: admin · status: entregue · i18n: 1.91.0 -->

- **Edge function `extract-meta-study`**: recebe texto colado e/ou PDF do bucket `meta_studies_pdfs`, busca o catálogo atual de Regras-Core no DB e usa Gemini 2.5 Pro (tool-calling estruturado) para emitir um rascunho com `title/authors/year/kind/summary/key_claims[]` + `suggested_links[]` para RCs existentes (relations: `supports|contradicts|modulates_weight|inspires`). Não grava nada — apenas devolve o draft.
- **Componente `IngestaoMetaEstudo`**: nova sub-aba "Ingestão" em Fundamentos. Permite colar texto/`.md` (mín. 50 chars) e/ou anexar PDF; faz upload em `meta_studies_pdfs`, chama a edge function, renderiza rascunho **totalmente editável** (todos os campos + checkbox por vínculo sugerido) e, ao aprovar, insere em `meta_studies` + `core_rule_evidence` (resolvendo `rule_id` texto → uuid). Recarrega a lista de fundamentos depois de salvar.
- **Política**: estudos arquiteturais NÃO entram no KG clínico; ficam isolados no Meta-KG. Banner em destaque reforça que a aprovação é manual.
- Files: supabase/functions/extract-meta-study/index.ts, src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx, src/pages/administrador/FundamentosTab.tsx, src/i18n.ts

### Added - 2026-05-20 — Score explainability, harvest de RCs e Justificativas por regra (Fase 3.1+3.2+3.4)
<!-- area: admin · status: entregue · i18n: 1.90.0 -->

- **(7) Score explainability**: `ScoreCriteriaPopover` agora mostra coluna de **peso relativo (%)** por critério, **penalidades parciais** (ex.: "n<100 → potência limitada", "<6 meses → desfechos crônicos não capturados", "evidência humana → cão modulada por RC-003") e bloco "Por que este score?" com rationale heurística (ou LLM se `study_assessment.score_rationale` estiver presente). Resposta explícita a "por que 4.0/5 com todos os checks ✓".
- **(1) Harvest de Regras-Core**: 15 RCs já vigentes promovidas para `core_rules` (RC-004 a RC-018) — Canonical IDs, Bilinguismo, No-Mock, Curation Gatekeeper, Taxonomia SNOMED+UMLS, Cap Terapêutico=8, Escopo Metabólico/Degenerativo, Soft Delete, Vetorização pré-curadoria, Tiered Confidence, Predicate Normalization, Chunking, Sigmoid Engine, Condition Canonicalization, Demo Data. Todas com justificativa bilíngue PT/EN e referência ao código.
- **Schema**: nova coluna `core_rules.runtime_effect` (`active` | `doc_only` | `planned`) tornando explícito quais RCs alteram pipeline em runtime vs. quais são governança auditável apenas. Renderizada como badge azul/cinza/âmbar em cada card.
- **(3) Aba "Mapa de Influências" → "Justificativas"**: reorganizada por regra (modo "Por Regra" como default). Cada RC mostra suas evidências vinculadas com quote literal + peso; RCs sem evidência mostram aviso explícito "governança por convenção (documentada em CORE_RULES.md)".
- **Files**: src/components/administrador/tags/ScoreCriteriaPopover.tsx, src/pages/administrador/FundamentosTab.tsx, src/i18n.ts (→ 1.90.0), CHANGELOG.md + migration runtime_effect + seed 15 RCs.

### Added - 2026-05-20 — Timestamps de auditoria, popovers de critérios e i18n de enums LLM (Fase 1 b+c+d)
<!-- area: admin · status: entregue · i18n: 1.88.0 -->
- **(b) Timestamps de auditoria** em `processed_studies`: novas colunas `processed_at`, `curated_at` e `curated_by`. Trigger `set_processed_at_on_analysis` preenche `processed_at` automaticamente quando `analysis_data` é gravado pela primeira vez. Backfill aplicado a estudos já processados/aprovados. `useStudyApprovalWorkflow` agora grava `curated_at` + `curated_by = auth.uid()` no momento da aprovação.
- **Componente `StudyTimeline`** (`src/components/administrador/estudos/StudyTimeline.tsx`) com variantes `compact` (linha do tempo inline em cada card de "Em Curadoria") e `detailed` (lista vertical no topo da aba Visão Geral do detalhe do estudo). Exibe: publicação, ingestão, processamento IA, vetorização RAG (com contagem de chunks) e curadoria final.
- **(c) Bilinguismo dos enums vindos do LLM** — novo utilitário `src/utils/llmEnumLocalizer.ts` com `localizeEnum`, `localizeDuration` e `localizeList`. Dicionário cobre blinding (`double_blind` → "duplo-cego"), methodology (`rct` → "Ensaio clínico randomizado"), species (`Human` → "Humano", `Canine` → "Cão"), severity (`moderate` → "moderado"), e durações (`12 weeks` → "12 semanas"). Aplicado no `VisaoGeralTab` (badges metodológicas) e no `EstudoCard` (severidade de efeitos colaterais).
- **(d) Cards de score clicáveis** — novo `ScoreCriteriaPopover` envolve cada `ScoreSummaryCard` da Visão Geral (Qualidade Metodológica, Relevância Clínica, Novidade Científica). Ao clicar, abre popover listando os critérios detectados (RCT? n≥30? randomização? placebo? p<0,05? cegamento? duração? espécies? translacional? mecanismo novo? gap-filling?) com ✓ / ✗ / "não informado", lidos diretamente de `analysis_data.study_assessment`.
- **i18n versão 1.88.0** — novas chaves `studies.timeline.*` (7 chaves) e `studies.criteria.*` (20 chaves) em PT e EN.
- Files: supabase migration (processed_studies columns + trigger), src/hooks/useStudyApprovalWorkflow.ts, src/utils/llmEnumLocalizer.ts, src/components/administrador/estudos/StudyTimeline.tsx, src/components/administrador/tags/ScoreCriteriaPopover.tsx, src/components/administrador/estudos/detalhes/tabs/VisaoGeralTab.tsx, src/components/administrador/estudos/cards/EstudoCard.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts.

### Added - 2026-05-20 — Governança de Regras-Core (RC-001, RC-002, RC-003 planejada)
<!-- area: meta · status: entregue · i18n: 1.87.0 -->
- **Novo arquivo `docs/CORE_RULES.md`** como fonte canônica auditável das regras-core do Senex AI. Cada regra tem `id` (RC-NNN), categoria, versão, status, justificativa, aplicação em código e evidências sustentadoras. Substitui o status anterior em que regras-core estavam dispersas entre `.lovable/memory/`, custom-knowledge e CHANGELOG.
- **RC-001 — Exclusão de trial ≠ Contraindicação**: critério de exclusão indica lacuna de evidência, não risco demonstrado. Aplicada em (a) prompt do Stage 3 em `extract-study-entities` (regra #8 no system prompt), (b) banner amarelo no topo da seção "Contraindicações" do `ExtractedDataVisualization` lembrando o curador. Motivada pelo estudo PQQ humano que listou "Pregnancy and Nursing" e "Serious Chronic Diseases" como contraindicações, quando eram apenas exclusões do trial.
- **RC-002 — Eventos adversos: negação explícita ≠ ocorrência**: quando estudo declara "no adverse events reported", `side_effects` é normalizado para `[]` e flag `explicitly_no_adverse_events=true` é setada. UI exibe badge verde "Sem eventos adversos reportados" em vez de contador "(1)" enganoso. Filtro via regex `NEGATIVE_AE_REGEX` no pós-Stage 3 + filtro espelhado no componente UI.
- **RC-003 — Translational Weighting Humano→Cão** (planejada, Fase 2): registrada como `status: planned` com pesos sugeridos por domínio (cognição 0.7, metabolismo hepático 0.4, articular/inflamação 0.8). Implementação no `hybrid-recommendation` virá após criação da tabela `core_rule_modulators` + ingestão de meta-estudos.
- **Renomeação de label**: badge "Sem trechos indexados" → "RAG não indexado" (PT) / "RAG not indexed" (EN), com tooltip mais explícito sobre impacto na curadoria e no chat semântico. Clique continua disparando reprocessamento de vetorização.
- **Memórias internas**: novas em `.lovable/memory/principles/exclusion-vs-contraindication.md` e `.lovable/memory/architecture/core-rules-governance.md`.
- **i18n**: novas chaves `studies.card.ragNotIndexed`, `ragNotIndexedTooltip`, `studies.extraction.noAdverseEventsReported`, `noAdverseEventsHint`, `rc001Title`, `rc001Hint` (fallback inline). `I18N_VERSION` 1.86.11 → 1.87.0.
- Files: `docs/CORE_RULES.md` (novo), `supabase/functions/extract-study-entities/index.ts`, `src/components/administrador/estudos/cards/EstudoCard.tsx`, `src/components/administrador/estudos/visualization/ExtractedDataVisualization.tsx`, `src/locales/{pt,en}/translation.json`, `src/i18n.ts`, 2 arquivos em `.lovable/memory/`.
- **Não incluído neste turno** (próximas fases): timestamps timeline (1.2), scores clicáveis com critérios (1.4), tabela `core_rules` espelhada (2.2), tab "Fundamentos Arquiteturais" (2.3), ingestão do PDF "Anti-aging strategies for dogs" como meta-estudo (2.4), translational weighting no `hybrid-recommendation` (2.5).

### Fixed - 2026-05-19 — Cards e modal de curadoria consistentes (derivação de triplets)
<!-- area: curation · status: entregue · i18n: 1.86.11 -->
- **Causa-raiz identificada**: cards "nus" em "Em Curadoria" (Spermidine, Vet Geroscience) ocorrem quando o Stage 1 do `extract-study-entities` retorna `extractedNutraceuticals/extractedConditions` vazios, mesmo com triplets válidos gerados pelo Stage 2 (14 e 23 triplets, respectivamente). Card e modal "Análise IA" leem só de `analysis_data` → ficam vazios.
- **Backfill imediato** (data migration via UPDATE): 2 estudos afetados tiveram `extractedNutraceuticals` e `extractedConditions` derivados de `triplet_extractions` (Nutraceutical/Compound/Drug → nutracêuticos; Condition/Disease/Phenotype/Outcome → condições, dedup por nome lowercase, confidence padrão 3).
- **Fallback definitivo no pipeline**: `extract-study-entities/index.ts` agora deriva as listas a partir dos triplets recém-inseridos quando Stage 1 vier vazio, antes do `UPDATE processed_studies.analysis_data`. Logs `🛟 Fallback: derivados N nutracêuticos/condições`.
- **Fallback no modal "Análise IA"**: `AnaliseTab.tsx` consulta `triplet_extractions` quando `analysis_data` não tem dados estruturados de Stage 3 e renderiza um resumo agrupado por `predicate` (até 50 triplets, top 12 por grupo) com badges `subject → object`. Mensagem deixa claro que dosagens/biomarcadores requerem reprocessamento.
- **i18n**: novas chaves `studies.analysis.tripletFallbackTitle` e `tripletFallbackHint` em PT/EN. `I18N_VERSION` 1.86.10 → 1.86.11.
- Files: `supabase/functions/extract-study-entities/index.ts`, `src/components/administrador/estudos/detalhes/tabs/AnaliseTab.tsx`, `src/locales/{pt,en}/translation.json`, `src/i18n.ts`, data migration via UPDATE em `processed_studies`.

### Added - 2026-05-19 — Governança de versão de embedding (Etapa 2 do plano RAG)
<!-- area: curation · status: entregue · i18n: - -->
- **Coluna `embedding_model_version`** adicionada a `study_embeddings` com default `gemini-embedding-001@768d` e índice dedicado, permitindo rastrear qual encoder gerou cada chunk vetorial.
- **Backfill** dos 1.293 chunks legacy com a tag canônica — validado empiricamente pelo smoke test (avg top-similarity = 0.743, verdict PASS) executado na Etapa 1, confirmando compatibilidade com o encoder atual.
- **RPC `search_study_chunks`** recriado para retornar `embedding_model_version` em cada resultado, sem alterar a assinatura semântica (mesmos filtros/ordenação).
- **`vectorize-study`** passa a gravar `embedding_model_version` em cada linha inserida (além da metadata já existente em `processed_studies.full_text_metadata`), garantindo proveniência por chunk.
- **`document-chat`** loga `EMBEDDING_MODEL_MISMATCH` (warning) sempre que um chunk recuperado vem de versão diferente do encoder atual — alerta automático para regressões futuras de pipeline.
- **Etapa 3 (re-vetorização em massa) descartada:** smoke test confirmou que o índice legacy não precisa ser regenerado. Re-vetorização ficará disponível como ferramenta opcional caso o aviso de mismatch comece a aparecer no futuro.
- Files: supabase/functions/vectorize-study/index.ts, supabase/functions/document-chat/index.ts, supabase/migrations (study_embeddings + search_study_chunks)

### Fixed - 2026-05-18 — Badges do pipeline: Biblioteca conta estudos curados e contadores não congelam
<!-- area: admin · status: entregue · i18n: - -->
- **Biblioteca**: badge passa a refletir estudos com `kanban_status='approved'` (status final de curadoria), alinhado ao critério usado pela própria aba `StudiesLibraryTab`. Antes contava estudos com qualquer triplet revisado, divergindo do que a aba mostrava.
- **Contadores congelados**: as contagens carregavam todos os triplets via `select(...)`, atingindo silenciosamente o cap de 1000 linhas do Supabase e travando os badges em valores antigos. Substituído por queries `count: 'exact', head: true` em `processed_studies.kanban_status` — leves, exatas e atualizadas a cada ciclo de 15s.
- **Curadoria**: badge agora derivado de `kanban_status in ('parsed','review','processed')` (fonte única).
- **AI Queue**: mantida lógica "kanban_status='new' sem triplets", mas com paginação explícita de IDs para escapar do cap de 1000.
- Files: src/components/administrador/estudos/import/SciImportSection.tsx

### Changed - 2026-05-18 — Pipeline de embeddings padronizado (Google AI direto + taskType) e modelo do chat configurável
<!-- area: curation · status: entregue · i18n: 1.86.10 -->
- **Auditoria profunda** confirmou que gêmeo digital, hybrid-recommendation, breed-predisposition, lab-interpretation e clinical-analysis-pipeline **NÃO consomem vetores** — operam sobre KG/triplets ou texto literal. Único consumidor real de embedding é `document-chat`. Zero risco de regressão clínica nesta mudança.
- **Mismatch crítico corrigido:** `document-chat` usava `google/text-embedding-004` (deprecated Jan/2026) via Lovable AI Gateway, enquanto `vectorize-study` indexava com `gemini-embedding-001` direto via Google AI — vetores eram incomparáveis, busca semântica degradada.
- **Modelo canônico unificado:** `gemini-embedding-001` direto via Google AI, 768d, com `taskType: RETRIEVAL_DOCUMENT` na indexação (`vectorize-study`) e `RETRIEVAL_QUERY` na busca (`document-chat`). Lovable AI Gateway não expõe `taskType` (perde ~10-15% de recall), por isso mantemos Google direto.
- **Tag de versão:** `processed_studies.full_text_metadata.embedding_model_version = "gemini-embedding-001@768d"` para detectar futuras divergências de modelo.
- **Modelo do chat LLM (geração da resposta) tornou-se configurável** via `ai_configurations.ai_model_chat` (admin escolhe entre `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`, `google/gemini-2.5-pro`, `openai/gpt-5`, etc.). Default: `google/gemini-3-flash-preview`. `document-chat` lê esta chave a cada chamada. Inclui tratamento explícito de 402 (créditos esgotados) e 429 (rate limit).
- Badge "Sem RAG" renomeado para "Sem trechos indexados" / "No indexed excerpts" com tooltip atualizado explicando que a curadoria continua funcionando, apenas o chat do estudo perde precisão semântica.
- `useAIConfig`: defaults atualizados (`chat: google/gemini-3-flash-preview`, `embeddings: gemini-embedding-001@768d`) + display names para modelos novos.
- Files: supabase/functions/vectorize-study/index.ts, supabase/functions/document-chat/index.ts, src/hooks/useAIConfig.ts, src/components/administrador/estudos/cards/EstudoCard.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts, mem://architecture/vectorization-is-pre-curation

### Changed - 2026-05-18 — Vetorização pré-curadoria centralizada + badges Curadoria/Biblioteca corretas
<!-- area: curation · status: entregue · i18n: 1.86.9 -->
- Investigação arquitetural confirmou que a vetorização é passo OBRIGATÓRIO pré-curadoria: `StudyTripletCuration`, `TripletReviewDialog` e a edge `enrich-triplet` leem `study_embeddings.chunk_text` para exibir o "Trecho de Origem" que justifica cada triplet. Sem vetorização → curador decide cego (viola No-Mock Policy + Curation Gatekeeper).
- `extract-study-entities` agora dispara `vectorize-study` em background (`EdgeRuntime.waitUntil`) logo após marcar o estudo como `processed`, garantindo que TODOS os caminhos de ingestão (SciSpace, upload direto, AI Processing queue) resultem em embeddings antes da curadoria. Não bloqueia a resposta nem aborta extração se a vetorização falhar.
- Badge **Curadoria** (vermelha) agora conta apenas estudos onde NENHUM triplet foi aprovado/rejeitado (curadoria zerada). Estudos com curadoria parcial em andamento migram para Biblioteca.
- Badge **Biblioteca** (verde) adicionada à tab `curated-library`: conta estudos com ≥1 triplet aprovado ou rejeitado, alinhando com a definição de "curado" usada na própria tab Biblioteca.
- Botão **"Vetorizar pendentes (N)"** adicionado no header da Curadoria quando há estudos com triplets sem embeddings (backfill manual dos 10 estudos órfãos detectados no banco).
- `EstudoCard`: badge "Sem RAG" agora aparece sempre que o estudo tem triplets mas não tem embeddings (não só quando kanban_status='processed'), com tooltip explicativo. Link "Ver original" (DOI ou Google Scholar por título) adicionado ao rodapé do card.
- Files: supabase/functions/extract-study-entities/index.ts, src/components/administrador/estudos/import/SciImportSection.tsx, src/components/administrador/estudos/import/TabNavigation.tsx, src/components/administrador/estudos/cards/EstudoCard.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Changed - 2026-05-18 — Digital Twin: órgãos tingem com a doença e variam no tempo
<!-- area: vet-ui · status: entregue -->
- Adicionada camada `mix-blend-mode: multiply` sobre cada órgão (cérebro, coração, pulmões, fígado, rins, intestinos, pâncreas, estômago, bexiga, articulações) em `DogAnatomySVG`: o desenho original do PNG anatômico fica tingido de amarelo→laranja→vermelho conforme a intensidade, em vez de uma elipse colorida flutuando por cima.
- `RegionState` ganha campo `intensity` (0-1) que controla opacidade/saturação do tingimento; cor é interpolada (hue 55°→0°, saturação e brilho dinâmicos).
- `buildMarkers` em `DigitalTwinDog` agora calcula intensidade por ano: cenário **sem protocolo** progride (`base + 0.45 * t`), cenário **com protocolo + coberto** decai (`base * (1 - 0.7 * t)`), cenário **com protocolo + não coberto** progride mais devagar (`base + 0.2 * t`). Slider de anos passa a fazer os órgãos escurecerem (sem) ou clarearem (com).
- Removido o fallback silencioso que copiava `yearWith` para `yearWithout`: agora os dois cães mostram intensidades diferentes mesmo quando o backend retorna só uma curva.
- Halo verde discreto (multiply) é aplicado sobre órgãos protegidos quando `showProtectionAura=true`, além da estrela existente.
- Files: src/components/pet/DogAnatomySVG.tsx, src/components/pet/DigitalTwinDog.tsx

### Changed - 2026-05-18 — Digital Twin: doenças atingem órgãos internos
<!-- area: vet-ui · status: entregue -->
- Substituída a silhueta opaca + bolinhas flutuantes do `DigitalTwinDog` por uma ilustração anatômica transparente do Golden Retriever (`src/assets/dog-anatomy.png`) com órgãos internos visíveis (cérebro, coração, pulmões, fígado, rins, intestinos, bexiga, articulações, coluna).
- Cada doença agora ilumina o órgão correspondente *dentro* do corpo (via `DogAnatomySVG` + `mapConditionToRegions`), com pulso/halo proporcional à severidade e estrela verde quando o protocolo protege a região.
- Coordenadas anatômicas (`REGION_COORDS`) recalibradas para o novo asset; `BiologicalTimeline` herda automaticamente o novo visual.
- Files: src/assets/dog-anatomy.png, src/components/pet/DogAnatomySVG.tsx, src/components/pet/DigitalTwinDog.tsx

### Changed - 2026-05-18 — Extraction Prompts: ações movidas para o topo
<!-- area: admin · status: entregue -->
- Removido o rodapé "Restaurar Padrões do {{stage}}" / "Testar com estudo real" do `ExtractionPromptsEditor` — agora ambos os botões aparecem no cabeçalho do card de stages, ficando contextuais ao stage ativo (Stage 1…Triplets).
- Validadas as duas primeiras edge functions migradas para `fetchSystemPrompt`: `extract-pet-clinical-data` e `relations-auditor` (status 200, prompts resolvidos via DB `default_content`).
- Files: src/components/administrador/configuracoes/ExtractionPromptsEditor.tsx

### Fixed - 2026-05-18 — System Prompts: catálogo populado + sync com o código
<!-- area: admin · status: entregue · i18n: 1.86.6 -->
- Causa raiz: os 24 registros em `ai_system_prompts` existiam mas com `default_content` vazio, gerando o badge "sem conteúdo" em todos os cards.
- Novo manifest `supabase/functions/_shared/system-prompts.ts` com o texto real de produção dos 24 prompts (Clinical Extraction, Clinical Reasoning, Conversational, External Lookup, KG Enrichment, KG Gap-Fill, KG Governance, RAG/Embeddings, Recommendation Orchestration, Study Ingestion, Taxonomy, Translation) + helper `getSystemPrompt(supabase, key)` no padrão override → default → manifest.
- Nova edge function `sync-system-prompts` faz `UPDATE` em `default_content` a partir do manifest, **sem tocar em `override_content`**. Executada agora: 24/24 atualizados.
- `SystemPromptsCatalog`: botão "Sincronizar com o código" no header + auto-sync silencioso ao montar quando há prompts vazios.
- `PromptConfigurationTab`: removido o botão "Gerar Prompts de Exemplo" (e o gerador de mocks `generateRandomPrompts`) que violava o No-Mock Policy. Estado vazio agora aponta o admin para a aba System Prompts.
- i18n: removidas chaves `generateExample` / `generateExamples`; adicionada `systemHint` (PT/EN). I18N_VERSION → 1.86.6.
- Files: supabase/functions/_shared/system-prompts.ts, supabase/functions/sync-system-prompts/index.ts, src/components/administrador/configuracoes/SystemPromptsCatalog.tsx, src/components/administrador/PromptConfigurationTab.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-18 — Landing: AdminFooter unificado + scroll-indicator na 1ª dobra
<!-- area: admin · status: entregue -->
- `AdminFooter` agora renderiza o mesmo `Footer` da landing (versão Senex auto-lida, badge `Veterinary Geroscience`, copyright bilíngue, powered-by completo). Antes era um clone hardcoded em EN sem versão.
- Index hero: reduzido espaço acima do botão "Scroll to discover our vision" (`mt-16` → `mt-4`, `mt-3` → `mt-2`) para caber na 1ª dobra.
- Files: src/components/administrador/layout/AdminFooter.tsx, src/pages/Index.tsx

### Changed - 2026-05-18 — TranslationsHub: Audit + Manage em uma só aba; Knowledge Graph reposicionado
<!-- area: admin · status: entregue · i18n: 1.86.4 -->
- Novo `TranslationsHub.tsx` (sub-tabs Audit/Manage) substitui os 2 itens separados na sidebar Configuration. Ids legados `translation-audit` e `translation-manager` continuam funcionando como alias do hub (deep-link no sub-tab Manage preservado).
- Sidebar Knowledge Base: `Knowledge Graph` movido para logo abaixo de `Triplets` e acima de `Evidence Conflicts`.
- I18n bump 1.86.3 → 1.86.4 (nova chave `admin.sidebar.configuration.translationsHub`).
- Files: src/components/administrador/TranslationsHub.tsx, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts, src/data/projectOrganograma.ts

### Changed - 2026-05-18 — Header/Footer: versão Senex auto-lida do CHANGELOG
<!-- area: meta · status: entregue -->
- `scripts/sync-changelog.mjs` agora extrai `<!-- senex: x.y.z -->` do bloco `[Unreleased]` e emite `senexVersion` em `projectChangelog.generated.ts`.
- `src/config/senex-version.ts` consome `senexVersion` + `lastChangelogDate` — sem mais hardcode. Header e Footer atualizam sozinhos.
- Sidebar: ícone "configurado" do item FDA/EMA/AVMA Compliance agora fica inline ao lado da palavra, igual aos demais (deixou de ficar centrado à direita quando o texto quebra em 2 linhas).
- Files: scripts/sync-changelog.mjs, src/config/senex-version.ts, src/data/projectChangelog.generated.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx

### Added - 2026-05-18 — Compliance: i18n PT/EN + renovação manual com log
<!-- area: admin · status: entregue · i18n: 1.86.3 -->
- Compliance Dashboard agora 100% bilíngue (UI + dados em `complianceData.ts` com `_en`).
- Novo botão "Rodar verificação de compliance" + tabela `compliance_audit_runs` (totals, per_authority, diff melhorou/piorou/novo) com RLS admin-only.
- Histórico de verificações colapsável com chips de delta e diff item-a-item.
- Auditorias Técnicas: strings PT migradas para `t('audits.*')`.
- Files: src/components/administrador/compliance/ComplianceDashboard.tsx, src/components/administrador/compliance/complianceData.ts, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts, supabase/migrations/

### Added - 2026-05-18 — Aba "About Senex AI" + badge de versão
<!-- area: admin · status: entregue · i18n: 1.85.0 -->
- Nova aba `about-senex` no grupo Configuration com diagrama Mermaid detalhado do motor (6 fases: ingestion → 3-stage extraction → KG L0–L4 → validation/gap-fill → hybrid storage Supabase + Neo4j → U-Retrieval + Digital Twin), pilares científicos e métricas chave.
- Badge `v{SENEX_VERSION} · {SENEX_LAST_UPDATE}` ao lado de "Senex AI" no Header e Footer (fonte única em `src/config/senex-version.ts`).
- Files: src/components/administrador/AboutSenexTab.tsx, src/config/senex-version.ts, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/layout/Header.tsx, src/components/layout/Footer.tsx, src/locales/{pt,en}/translation.json

### Changed - 2026-05-18 — Modal de Estudos Científicos v5.1.0 (Neo4j ativo)
<!-- area: admin · status: entregue · i18n: 1.85.0 -->
- Corrigido o conteúdo desatualizado: Neo4j AuraDB já está integrado (edge functions `neo4j-sync`, `sync-approved-triplets`, `sync-study-to-neo4j`). Removido item "Migrate KG to Neo4j" dos planejados e ajustada a limitação para refletir que o read-path clínico ainda usa RPC Postgres.
- Workflow step 5 atualizado para "sync ativo" em vez de "planejado". Bump de 5.0.0 → 5.1.0.
- Files: src/data/admin-tabs-info-bilingual.ts


### Added - 2026-05-18 — Fase 5: Cobertura e enriquecimento em lote do catálogo de rações
<!-- area: admin · status: entregue · i18n: 1.83.0 -->
- Nova tabela `pet_food_bulk_enrich_runs` (RLS admin-only) para registrar parâmetros, contagens e detalhes por execução do job.
- Edge `bulk-enrich-pet-food`: seleciona produtos `approved` sem nutrição ou com `completeness_score < min_completeness`, dispara `enrich-pet-food-product` em chunks com concorrência configurável (default 4) e grava o resultado no log. Requer admin (verificado via `is_admin()` no cliente do usuário).
- Nova aba admin `Cobertura de Rações` (`pet-food-coverage`, grupo `knowledge-base`): KPIs (total, com nutrição, completude ≥60%, confiança ≥70%), heatmap por marca (piores primeiro), tabela priorizada por completude com botão "Re-enriquecer" por linha e formulário de execução em lote, mais log das últimas 20 execuções com auto-refresh.
- Item adicionado ao `KnowledgeBaseGroup.tsx` e ao `admin-tabs.ts`; organograma atualizado (área `admin`).
- i18n: namespace `petFoodCoverage.*` (PT/EN) + label `admin.sidebar.knowledgeBase.petFoodCoverage`. `I18N_VERSION` → 1.83.0.
- Files: supabase/functions/bulk-enrich-pet-food/index.ts, src/components/administrador/pet-food/PetFoodCoverageTab.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/config/admin-tabs.ts, src/data/projectOrganograma.ts, src/i18n.ts, src/locales/{pt,en}/translation.json

### Added - 2026-05-18 — Fase 4b: Provenance gap→composto no card do tutor
<!-- area: tutor-ui · status: entregue · i18n: 1.82.0 -->
- Edge `hybrid-recommendation`: schema JSON dos prompts ENRICH e FALLBACK agora exige `closes_gaps: string[]` por composto (rótulos exatos do bloco `NUTRITION_GAPS` que o composto fecha; `[]` quando não fecha nenhum). Sem alteração de prompt além do schema.
- `clinical-analysis-pipeline.ts`: cada composto materializado ganha `closesGaps: string[]` propagado verbatim do LLM.
- `PetProfilePage.handleApproveStack`: persiste `closes_gaps` dentro de `treatment_proposals.compounds[]` (jsonb), sem mudanças no resto do "patient analysis".
- `TreatmentProposalCard` (tutor): renderiza badge esmeralda "Fecha déficit: {nutriente}" abaixo do mecanismo de cada composto que cobre um gap quantitativo da dieta.
- I18n: `tutor.proposal.closesGap` em PT/EN; bump `I18N_VERSION` 1.81.0 → 1.82.0.
- Files: supabase/functions/hybrid-recommendation/index.ts, src/services/clinical-analysis-pipeline.ts, src/pages/veterinario/PetProfilePage.tsx, src/components/tutor/TreatmentProposalCard.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-18 — Fase 4: Evolução longitudinal dos gaps nutricionais
<!-- area: vet-ui · status: entregue · i18n: 1.81.0 -->
- Novo serviço `src/services/nutrition-gap-timeline.ts`: reconstrói déficits/excessos para **cada snapshot histórico** de `pet_nutrition` reutilizando `analyzeNutritionGaps` (mesma metodologia FEDIAF/AAFCO). Sem mocks — snapshots sem produtos linkados ficam fora do gráfico.
- `analyzeNutritionGaps` aceita `nutritionId?: string` opcional para forçar análise de um snapshot específico (necessário para timeline).
- Novo componente `NutritionGapEvolutionChart.tsx` (Recharts ComposedChart): áreas de déficit/excesso + linha de adequados ao longo do tempo, badge de tendência (Δ desde o primeiro snapshot) e tabela "Top 5 nutrientes com maior variação" (antes → depois, Δ percentual em pontos).
- Mount em `PetNutritionPanel.tsx` (perfil do pet vet): só renderiza quando há ≥2 snapshots, evitando ruído em pets novos.
- I18n: bloco `nutritionGapTimeline.*` em PT/EN; bump `I18N_VERSION` 1.80.0 → 1.81.0.
- Files: src/services/nutrition-gap-analyzer.ts, src/services/nutrition-gap-timeline.ts, src/components/pet/NutritionGapEvolutionChart.tsx, src/components/pet/PetNutritionPanel.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-18 — Bridge Nutrition Gaps → Engine de Recomendação
<!-- area: clinical-pipeline · status: entregue · i18n: none -->
- `buildLongitudinalContext` (frontend) agora roda `analyzeNutritionGaps` para o pet ativo e envia os gaps quantitativos não-adequados (até 10) dentro de `dietProfile.gaps` para a edge function `hybrid-recommendation`.
- Edge `hybrid-recommendation`: novo bloco `NUTRITION_GAPS [WEIGHT: 0.8]` renderizado no prompt com `observed / target / delta_pct / rationale / source` por nutriente em déficit/excesso.
- Prompts ENRICH e FALLBACK atualizados: o LLM PRECISA selecionar pelo menos um composto que feche cada nutriente DEFICIENT listado e NÃO pode recomendar nutrientes já ADEQUATE/EXCESS na dieta; o "mechanism" deve citar explicitamente o gap fechado.
- Sem mocks — se não houver `pet_food_nutrition` linkada ou pet sem peso, o bloco é simplesmente omitido (analyzer já trata `no_linked_products`).
- Files: supabase/functions/hybrid-recommendation/index.ts, src/services/hybrid-recommendation-service.ts

### Fixed - 2026-05-17 — Nutrition: kcal as-fed para ração úmida + cache PostgREST
<!-- area: admin · status: entregue · i18n: 1.80.0 -->
- Edge `enrich-pet-food-product`: converte `kcal_per_kg` reportado em base seca para as-fed quando moisture ≥ 50% (resolve Cesar/Sheba mostrando ~9000 kcal/kg).
- `NOTIFY pgrst, 'reload schema'` para liberar gravação de `confidence`, `completeness_score` e `data_filled_at` em `pet_food_nutrition` (estavam silenciosamente sendo descartados pelo cache do PostgREST).
- Reprocessados os 19 produtos das marcas Mars recém-adicionadas com a lógica corrigida.
- UI: badge "Rótulo" (verde) vs "IA" (âmbar) no card de cada ração na aba Nutrition → Rações.
- Files: supabase/functions/enrich-pet-food-product/index.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx

### Changed - 2026-05-18 — Aba "Catálogo de Rações" vira "Nutrition" com tags inline + auto-enrich + tabela AAFCO
<!-- area: admin · status: entregue · i18n: 1.80.0 -->
- **Nutrientes como tags inline**: o card de produto agora renderiza TODOS os campos nutricionais não-nulos (Prot, Gord, Fibra, Ca, P, Ca:P, n6:n3, EPA, DHA, Lis, Tau, Vit A/D3/E, Zn, Fe, Cu, etc.) como `<Badge>` compactos no padrão visual já usado para `species`/`life_stage`. Sem clique, sem dialog secundário.
- **Auto-enriquecimento**: `useEffect` na query identifica produtos sem nutrição ou com `completeness_score < 0.4` e invoca `enrich-pet-food-product` em background (batches de 3, guard `useRef<Set>` contra loops). Novo produto cadastrado dispara enrichment imediatamente. Botão manual "Enriquecer com IA" e dialog "Composição" foram removidos.
- **Renomeação**: aba do menu lateral passa a se chamar **Nutrição/Nutrition** (chave `admin.sidebar.knowledgeBase.petFoodCatalog`, id da rota `pet-food-catalog` preservado).
- **Sub-aba "Tabela nutricional (raça · porte · idade)"**: nova `RequirementsTable` carrega `CANINE_NUTRIENT_REQUIREMENTS` (AAFCO 2024 + FEDIAF 2024 + NRC 2006) com filtros por estágio (filhote/adulto/gestação-lactação/sênior) e porte (pequeno/médio/grande/gigante). Inclui caps específicos para raças grandes/gigantes (Ca máx 1.5–1.6% para prevenir DOD/displasia) e perfil sênior expandido (proteína ≥25% MS, P 0.4–0.8%, EPA+DHA ≥0.1%, L-carnitina ≥300 mg/kg).
- **Sub-aba "Outras questões nutricionais"**: 7 cards estáticos bilíngues sobre hidratação, frequência de refeições, restrição renal/hepática, taurina e DCM, razão n6:n3 e sinais clínicos de deficiências.
- **Bilíngue**: novo `src/data/nutritionRequirementsCanine.ts` carrega labels PT/EN para nutrientes, estágios, portes e tópicos. `I18N_VERSION` 1.79.0 → 1.80.0.
- Files: src/components/administrador/pet-food/PetFoodCatalogTab.tsx, src/data/nutritionRequirementsCanine.ts, src/locales/{pt,en}/translation.json, src/i18n.ts.

### Added - 2026-05-17 — Carga nutricional completa (AAFCO/FEDIAF) no catálogo de rações
<!-- area: admin · status: entregue · i18n: 1.79.0 -->
- **`pet_food_nutrition` estendida**: novas colunas para minerais traço (Fe, Cu, Zn, Mn, Se, I, Cl), vitaminas (A, D3, E, K, B1–B12, biotina, colina), EPA/DHA/ARA separados, aminoácidos essenciais (lisina, metionina, triptofano, treonina, arginina) e tracking (`completeness_score`, `confidence`, `data_filled_at`).
- **`enrich-pet-food-product`**: prompt expandido para schema AAFCO/FEDIAF completo com instrução explícita "nunca invente — prefira null". Parser normaliza `%`, `mg/kg` e `UI/kg` com clamps de plausibilidade. Calcula `completeness_score` (fração de campos numéricos preenchidos) automaticamente em cada insert.
- **UI do catálogo (`PetFoodCatalogTab`)**: card de produto agora mostra barra de completude + % e confiança da IA; novo botão **Composição** abre dialog com a composição completa agrupada por (Macros / Minerais maiores / Minerais traço / Vitaminas / Ácidos graxos / Aminoácidos / Articulares), badges AAFCO/FEDIAF e statement quando presente.
- Files: supabase/migrations/20260517232015_*.sql, supabase/functions/enrich-pet-food-product/index.ts, src/components/administrador/pet-food/PetFoodCatalogTab.tsx

### Added - 2026-05-17 — Fix diagrama + catálogo de System Prompts + traduções
<!-- area: admin · status: entregue · i18n: 1.79.0 -->
- **Diagrama do organograma (fotos 1 e 2):** fix definitivo. Após renderizar, o SVG do Mermaid agora recebe `width`/`height` reais lidos do `viewBox` (antes vinha só `style="max-width:100%"`, colapsando dentro do container `max-content`). `useScrollPanZoom.measureNatural` agora prioriza `viewBox.baseVal` sobre `getBBox` (mais estável antes do layout). `ResizeObserver` também observa o `innerRef` para refazer `fit()` quando o SVG aparece. `fitMin` 0.1 → 0.2 (evita escala microscópica).
- **Catálogo de System Prompts:** nova tabela `ai_system_prompts` com 24 prompts agrupados em 13 famílias (Clinical Extraction, Study Ingestion, RAG/Embeddings, Recommendation Orchestration, KG Enrichment, KG Governance, KG Gap-Fill, Clinical Reasoning, Translation, External Lookup, Taxonomy, Conversational). Nova aba **System Prompts** dentro de "Prompts da IA" lista catálogo com busca, agrupamento por família, badge "override ativo", editor inline e botão "Restaurar default". RLS admin-only. Conteúdo `default_content` ainda vazio em todos (preenchimento via leitura das edge functions vem em rodadas seguintes).
- **Traduções (foto 4):** "Organograma", "Conformidade FDA/EMA/AVMA" e "Auditorias Técnicas" estavam hardcoded no `ConfigurationGroup.tsx` — agora usam `t('admin.sidebar.configuration.{organograma,complianceDashboard,technicalAudits}')`. Chaves espelhadas PT/EN. `I18N_VERSION` 1.78.9 → 1.79.0.
- **Badge Perplexity (foto 5):** `ConfiguracoesIATab` agora chama `perplexity-health` no mount e marca o card como "Configured" quando o secret do connector (`PERPLEXITY_API_KEY`) está disponível, mesmo se a chave não estiver salva em `ai_configurations`. Descrição vira "via connector" nesse caso.
- **Próxima rodada (não entregue ainda):** composição nutricional completa (AAFCO) das rações com tabela `pet_food_nutrients` 1:1 com produto; preenchimento dos `default_content` dos 24 system prompts a partir do código das edge functions.
- Files: src/components/administrador/organograma/OrganogramaDiagram.tsx, src/hooks/useScrollPanZoom.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, src/components/administrador/ConfiguracoesIATab.tsx, src/components/administrador/PromptConfigurationTab.tsx, src/components/administrador/configuracoes/SystemPromptsCatalog.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts, public.ai_system_prompts (nova tabela + 24 seeds).

### Changed - 2026-05-17 — Sidebar: reposicionar Triplet Quality + catálogo Mars
<!-- area: admin · status: entregue · i18n: 1.78.9 -->
- Sidebar "Base de Conhecimento": item **Triplet Quality** movido para entre **Triplet Curation** e **Evidence Conflicts** (antes ficava isolado no fim do grupo). Apenas reordenação visual; rota, ícone e tradução inalterados.
- Catálogo de Rações: adicionadas 8 marcas do conglomerado **Mars Petcare** que faltavam — IAMS, Nutro, Cesar, Sheba, Greenies, Crave, Perfect Fit e Temptations. Royal Canin, Pedigree, Eukanuba e Whiskas já estavam cadastradas. Garante prioridade absoluta da Mars na lista de marcas.
- Files: src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, public.pet_food_brands (8 inserts).

### Changed - 2026-05-17 — Organograma: corrigir diagrama em branco e simplificar acesso ao Gap-Fill
<!-- area: admin · status: entregue · i18n: 1.78.9 -->
- Diagrama Mermaid do organograma voltou a renderizar: removida a manipulação de `width`/`height` do `<svg>` que colapsava o conteúdo, e `fitMin` reduzido de 0.4 para 0.1 para evitar telas em branco quando o diagrama é maior que o container.
- Tab "Diagnóstico Gap-Fill" removida do menu lateral (Knowledge Base) — virou diagnóstico avançado acessível por botão "Ver diagnóstico avançado" dentro da tela de Mapeamento SNOMED/UMLS. A rota `?tab=gapfill-diagnostics` continua válida; só a entrada de menu foi escondida para reduzir ruído na sidebar.
- Página "Relações e Conexões" e o force-graph do organograma intencionalmente não foram tocados — auditoria do histórico (commits `385859f4`, `33454cc9`, `bb7d8e39`) confirmou que não houve regressão recente; o volume aparente (28 nós · 1000 edges) é dado real e não complexidade adicionada.
- Files: src/components/administrador/organograma/OrganogramaDiagram.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/components/administrador/OntologyMappingTab.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-17 — Sidebar admin: restauração de órfãos e limpeza de tabs sem propósito
<!-- area: admin · status: entregue · i18n: 1.78.8 -->
- Knowledge Base recebeu 7 links restaurados/realocados: Curadoria de Triplets, Conflitos de Evidência, Mapeamento SNOMED/UMLS, Catálogo de Rações, Curadoria de Doses, Qualidade de Triplets e Diagnóstico Gap-Fill.
- Configuration recebeu 3 links novos: Gerenciar Traduções, Convenções de Design e Solicitações de Acesso.
- Removidas 4 tabs sem propósito de `admin-tabs.ts`: `acompanhamento` (marketing fora do escopo clínico), `fontes` e `analysis` (steps legados do wizard antigo de ingestão) e import órfão de `MicrobiomeAnalysisTab`.
- Removido item "Gestão de Campanhas" do ActionsGroup.
- Files: src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/{KnowledgeBaseGroup,ConfigurationGroup,ActionsGroup}.tsx, src/components/lazy/LazyComponents.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-17 — Home: destaque Painel de Controle + footer/header rebranding
<!-- area: tutor-ui · status: entregue · i18n: 1.78.0 -->
- Home autenticada: Painel de Controle agora usa botão primário com seta vermelha "visite aqui!" (bilingual); cards Vet Portal e Owner Portal mostram badge "Em breve / Coming soon" e botão desabilitado "Em desenvolvimento / In development".
- Footer: copyright atualizado para "Senex AI © 2025–2026 — developed by PetMoreTime. All rights reserved by PetMoreTime." em Footer.tsx e AdminFooter.tsx.
- Tagline "Veterinary Geroscience" adicionada sob a referência PetMoreTime no header e em ambos os footers.
- Header: subtítulo "Extending Lives & Preventing Degenerative Disease" quebrado em duas linhas e alinhado à esquerda com o logo.
- Files: src/pages/Index.tsx, src/components/layout/Header.tsx, src/components/layout/Footer.tsx, src/components/administrador/layout/AdminFooter.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Fixed - 2026-05-17 — Links quebrados e duplicatas em predisposições raciais
<!-- area: admin · status: entregue · i18n: 1.77.1 -->
- Removidas 26 duplicatas em `breed_predispositions` (mesmo par raça×condição inserido 2x pelo seed v2).
- Adicionada constraint única `(breed_id, condition_id)` para impedir reincidência.
- Substituídos URLs `pubmed.ncbi.nlm.nih.gov/<id>` por `europepmc.org/article/MED/<id>` (sem bloqueio de referer no preview).
- Corrigido 404 da OFA: `/diseases/hip-dysplasia/hip-statistics` → `/diseases/hip-dysplasia/`.
- Files: supabase/migrations/*_dedup_predispositions.sql

### Added - 2026-05-17 — Predisposições para 48 raças sem dados (catálogo +139 registros)
<!-- area: admin · status: entregue · i18n: 1.77.1 -->
- 22 novas condições clínicas (Luxação Patelar, Hidrocefalia, Colapso Traqueal, MMVD, HCM Felina, PKD, DRC Felina, Hipertireoidismo Felino, Atopia, Polimiosite, Legg-Calvé-Perthes, Amiloidose Renal, Seio Dermóide, Surdez Congênita, Glaucoma Primário, Cushing, IVDD, DCM, Linfoma, Mastocitoma, Megaesôfago, GDV) com PT/EN, categoria e fontes (OMIA, EuropePMC, ACVS, IRIS, ACVIM).
- 133 novas predisposições raciais cobrindo Bullmastiff, Mastim Inglês, Tibetan Mastiff, Dogue de Bordeaux, Fila Brasileiro, Terra Nova, Pastor de Anatólia, Schnauzer Gigante/Miniatura, Vizsla, Weimaraner, Setter Irlandês, Spinone, Sussex, Chihuahua, Maltês, Papillon, Pinscher Min., Poodle Toy/Standard, Bichon, Lhasa Apso, Jack Russell, Bull Terrier, Border/Cairn/Kerry Blue/Norfolk Terrier, Basset Hound, Buldogue Americano/Australiano, Pit Bull, Pastor Belga Malinois, Pastor de Shetland, Old English Sheepdog, Malamute, Shiba Inu, Spitz Alemão, Welsh Corgi Pembroke, Whippet, Rhodesian Ridgeback, Maine Coon, Ragdoll, Persa, Exótico, Siamês, Oriental, Doméstico.
- Cada registro inclui `risk_factor`, `evidence_grade`, `genetic_profile` (quando aplicável, ex.: MYBPC3 em Maine Coon, FGF3/4/19 em Rhodesian Ridgeback, SOD1 em Welsh Corgi, PKD1 em Persa), `inheritance_pattern`, `prevalence_pct` e 1–2 fontes clicáveis verificadas.
- Cobertura: 32 → 80 raças com predisposições (de 81 totais); 121 → 254 registros; 76 → 209 com fontes.

### Added - 2026-05-17 — Catálogo bilíngue de raças e condições com fontes científicas
<!-- area: admin · status: entregue · i18n: 1.77.1 -->
- Seed bilíngue com **+30 condições crônicas/degenerativas caninas** (BOAS, mielopatia degenerativa SOD1, EPI, SARDS, hemangiossarcoma, MDR1, etc.) com `sources` JSONB contendo links diretos para OMIA, PubMed, ACVIM, ESCCAP, IRIS e Merck Vet Manual.
- Seed bilíngue com **+61 raças** (AKC/FCI + Fila Brasileiro) e **+76 predisposições** enriquecidas com `risk_factor`, `evidence_grade`, `inheritance_pattern`, `prevalence_pct` e até 3 fontes científicas com URL direta por predisposição.
- `BreedPredispositionsPanel` agora renderiza chips de Perfil Genético / Padrão de Herança / Prevalência e lista de fontes clicáveis (`target="_blank"`, ícone ExternalLink) sob cada predisposição.
- `usePlatformCounts` + counters dinâmicos na home (`Index.tsx`) substituíram números fixos por leitura real do banco com sufixo "em contínua expansão".
- Documentação: `docs/BREED_PREDISPOSITIONS_AUDIT.md` lista todos os pontos de consumo onde `breed_predispositions` realmente influencia KG, timeline biológica, pipeline clínico e hybrid-recommendation.
- Files: supabase/migrations/20260517144239_*.sql, src/components/administrador/breeds/BreedPredispositionsPanel.tsx, src/hooks/usePlatformCounts.ts, src/pages/Index.tsx, src/i18n.ts, src/locales/{pt,en}/translation.json, docs/BREED_PREDISPOSITIONS_AUDIT.md

### Added - 2026-05-13 — Digital Twin do paciente (Fase 2 — histórico, traits, labs)
<!-- area: vet-ui · status: entregue · i18n: 1.74.5 -->
- `PatientKnowledgeSubgraph` ganha 3 novas camadas opcionais conectadas ao nó Pet central:
  - **Diagnósticos passados** (círculos cinza, aresta `HAS_HISTORY` tracejada) lidos de `pet_conditions` resolvidas + consultas anteriores em `pet_consultations`.
  - **Traits** (hexágonos azul-claro, aresta `HAS_TRAIT`) representando raça, faixa etária (filhote/adulto/sênior/geriátrico) e sexo. Traits de raça desenham `BREED_RISK_FOR` (tracejada azul-escura) apontando para condições predispostas vindas de `BreedPredisposition`.
  - **Labs anormais** (triângulo invertido amarelo, aresta `PRESENTS_LAB`) lidos de `LabAlert`s, com aresta `INDICATES` (tracejada amarela) ligando o exame às condições mencionadas em `clinical_significance`.
- Legenda + i18n PT/EN atualizadas (`past_diagnosis`, `trait`, `lab`); `I18N_VERSION` → 1.74.5.
- Conformidade No-Mock: cada nó só aparece quando há registro real (consulta, predisposição ou lab anormal); deduplicação por nome para histórico.
- Files: src/components/pet/PatientKnowledgeSubgraph.tsx, src/pages/veterinario/PetProfilePage.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Added - 2026-05-13 — Subgrafo do paciente vira Digital Twin (Fase 1)
<!-- area: vet-ui · status: entregue · i18n: 1.74.4 -->
- `PatientKnowledgeSubgraph` agora renderiza um **nó Pet central** (estrela azul) com tooltip de raça/idade/peso/sexo, conectando-se via `HAS_CONDITION` a todas as condições ativas — antes condições e compostos flutuavam soltos sem dono clínico.
- Novos tipos de nó: **medicação ativa** (caixa roxa, lida de `pet_medications`) ligada ao Pet por `TAKES`, e **detratores geriátricos ocultos** (diamante âmbar) ligados por `EXHIBITS_DETRACTOR`.
- Novo tipo de aresta **`INTERACTS_WITH`** (vermelha, bidirecional) desenhada automaticamente entre composto recomendado e medicação atual sempre que o pipeline detecta um `InteractionAlert` — vet vê o conflito antes de aprovar.
- Heurística geroscience exportada (`inferGeroscienceTriggers`) reutilizada pela página para listar detratores no grafo sem duplicar lógica.
- Conformidade No-Mock: nó/aresta só aparece se houver registro real em `pet_profiles`/`pet_medications`/`InteractionAlert`. Próximas fases: histórico, proveniência `JUSTIFIED_BY` e projeções `EXPECTED_IMPROVEMENT`.
- Files: src/components/pet/PatientKnowledgeSubgraph.tsx, src/components/pet/VetGraphRAGInsightsPanel.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts

### Changed - 2026-05-13 — Evidências sempre com 2-3 links de estudos
<!-- area: vet-ui · status: entregue · i18n: 1.74.3 -->
- "Ver evidências e contexto" agora garante 2-3 referências clicáveis por composto, mesmo quando não há estudo curado para o par (composto × condição) — antes a seção "Estudos científicos" simplesmente sumia.
- Pipeline (`clinical-analysis-pipeline.ts → attachStudiesToCompounds`): novo helper `buildPublicSearchStudies(compound, condition)` que monta links determinísticos PubMed + Google Scholar; usado para top-up até `MAX_STUDIES_PER_COMPOUND = 3` quando o conjunto curado tem < 2 itens, e como fallback final no catch.
- UI (`CompoundDosageSlider.tsx`): novo badge **"Busca pública"** (cinza) diferenciando-o de PubMed/DOI/Scholar curados — mantém transparência do No-Mock Policy: nada é simulado, são buscas reais rotuladas.
- i18n: `petProfile.recommendation.linkSource.publicSearch` PT/EN, `I18N_VERSION` 1.74.2 → 1.74.3.
- Files: src/services/clinical-analysis-pipeline.ts, src/components/pet/CompoundDosageSlider.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Changed - 2026-05-13 — Detratores Geriátricos Ocultos: separação rigorosa de gerociência vs. clínica
<!-- area: vet-ui · status: entregue · i18n: 1.74.2 -->
- Renomeada seção "Comorbidades Ocultas (Gerociência)" → **"Detratores Geriátricos Ocultos"** (PT) / "Hidden Geriatric Detractors" (EN). Reforça que o que aparece ali são **processos moleculares de envelhecimento** (senescência celular, inflammaging, estresse oxidativo, disfunção mitocondrial), não diagnósticos clínicos.
- `VetGraphRAGInsightsPanel`: rótulos de gerociência (`Cellular Senescence`, `Inflammaging`, `Oxidative Stress`, `Mitochondrial Dysfunction`) **nunca** mais aparecem em "Condições Clínicas Atuais Confirmadas" — são sempre redirigidos para detratores ocultos, mesmo se vierem registrados em `pet_conditions` (legado).
- Nova heurística `inferGeroscienceTriggers()`: dispara detrator oculto a partir de portas de entrada clínicas e idade (≥7a) — Osteoartrite/displasia/sarcopenia → Senescência Celular; Inflamação crônica/obesidade/OA → Inflammaging; DRC/MMVD/CDS → Estresse Oxidativo; CDS/mielopatia/sarcopenia → Disfunção Mitocondrial. Garante que o painel não fica em "0" mesmo quando o KG ainda não tem triplets.
- Sample data Thor: `Inflammaging` substituído por `Chronic Inflammation` em `pet_conditions` (rótulo clínico aceitável); a camada Senex AI infere o detrator inflammaging.
- I18N_VERSION: 1.74.1 → 1.74.2.
- Files: src/components/pet/VetGraphRAGInsightsPanel.tsx, src/components/pet/GenerateSamplePetsButton.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Changed - 2026-05-13 — Diferenciação de vozes na consulta: vet livre vs. interpretação rica da IA
<!-- area: vet-ui · status: entregue · i18n: no -->
- Reescritos todos os campos `assessment` das 15 consultas de demo (`SAMPLE_PETS`) com texto livre/coloquial em primeira pessoa do veterinário; em ~1 a cada 3 consultas, uma das condições é **propositalmente omitida** do texto (mas mantida em `conditions[]`) para demonstrar valor da camada Senex AI.
- Substituída a geração trivial de `machine_summary` (antes: primeira frase do assessment) por nova função `buildMachineSummary()` que sintetiza queixa + exame físico + achados laboratoriais (com `flags_abnormal` e `interpretation`) + condições canônicas completas + medicações + plano. Resultado renderizado no callout amarelo "Interpretação automática desta consulta".
- Reforço da proposta de valor: o texto livre do vet pode esquecer um diagnóstico — a interpretação automática (Senex AI · PetMoreTime) sempre cobre todas as condições registradas via base de conhecimento.
- Files: src/components/pet/GenerateSamplePetsButton.tsx

### Changed - 2026-05-13 — Reforço de marca: Senex AI · © PetMoreTime · 2025–presente
<!-- area: meta · status: entregue · i18n: 1.74.1 -->
- Adicionada linha de assinatura de marca nos headers das tabs administrativas: **Organograma**, **Auditorias Técnicas** e **Conformidade FDA/EMA/AVMA**, deixando explícito que **Senex AI é o motor proprietário desenvolvido e operado exclusivamente pela PetMoreTime (2025–presente), sucessor da arquitetura interna VetGraphRAG/VetMedGraph**.
- Documentação técnica (`docs/TECHNICAL_DECISIONS.md`, `ARCHITECTURE.md`) recebeu nota de autoria/operação no header.
- Knowledge File do projeto (project memory) atualizado com nova entrada `mem://branding/senex-ai-rename` consolidando: marca pública = Senex AI, autoria/operação exclusiva = PetMoreTime, identificadores internos preservados.
- I18N bumped para `1.74.1` (patch — completa o rebrand iniciado em 1.74.0).
- Files: src/pages/administrador/OrganogramaTab.tsx, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/components/administrador/compliance/ComplianceDashboard.tsx, src/i18n.ts, ARCHITECTURE.md, docs/TECHNICAL_DECISIONS.md

### Changed - 2026-05-13 — Rebrand: motor "VetGraphRAG" passa a se chamar "Senex AI" na camada visível
<!-- area: meta · status: entregue · i18n: 1.74.0 -->
- Substituição em massa da marca exposta ao usuário: "VetGraphRAG" → **Senex AI** em todas as traduções (PT/EN, 27 ocorrências cada), strings JSX, descrições de tabs administrativas, organograma, taxonomia biomédica, exports de PDF e relatórios de confiança.
- Identificadores internos preservados intencionalmente: tipos (`VetGraphRAGAnalysisResult`, `VetGraphRAGConditionTag`), hooks (`useVetGraphRAGConfig`, `useVetGraphRAGLogs`, `useVetGraphRAGQueue`, `useNtaiProcessing`), componentes (`VetGraphRAGInsightsPanel`), arquivos (`vetgraphrag-service.ts`, `vetgraphrag.ts`), edge functions e colunas de DB. Evita refactor estrutural.
- I18N bumped para `1.74.0` para invalidar cache de traduções.
- Docs atualizadas: ARCHITECTURE.md, docs/TECHNICAL_DECISIONS.md, .lovable/plan.md.

### Changed - 2026-05-12 — Card de consulta: separa exame físico vs complementares, renomeia avaliação e adiciona quadro amarelo de interpretação automática
<!-- area: vet-ui · status: entregue · i18n: 1.73.0 -->
- Achados de "Neurological/Orthopedic/Cardiovascular Examination" gravados em `pet_exams` deixam de poluir a tabela de **Exames Complementares** e passam a ser fundidos em `physical_exam.specific.<área>` no `PhysicalExamBlock`. Lógica em novo `src/services/exam-classification.ts` (`partitionExams`, `mergePhysicalExamRows`).
- Tabela "Exames Complementares" agora mostra estado vazio explícito quando não há sangue/imagem/urina na consulta.
- Bloco "Avaliação" renomeado para **"Suspeita / Diagnóstico"** (`petTimeline.assessmentTitle`) e "Conduta" para **"Plano / Conduta"** (`petTimeline.planTitle`). Texto cru do veterinário permanece intacto.
- Novo `AssessmentInterpretation.tsx` exibe sob o texto cru as condições canônicas, sistemas afetados e refs ontológicas extraídas pelo LLM (`pet_consultations.assessment_interpretation`). Sem fallback mock.
- Novo `ConsultationMachineSummary.tsx` — quadro amarelo no fim do card agregando: tags clínicas (movidas do rodapé antigo), `machine_summary` (1–2 frases) e termos canônicos prontos para o Senex AI.
- Form `HistoricalConsultationsSection` alinhado ao card: "Queixa principal" → **Motivo**, "Achados/Diagnóstico" → **Suspeita / Diagnóstico**, "Conduta" → **Plano / Conduta**.
- Migration: `pet_consultations` ganha `assessment_interpretation jsonb` e `machine_summary text`.
- `GenerateSamplePetsButton` popula `tags`, `machine_summary` e `assessment_interpretation` determinísticos para os pets demo, derivados de `assessment` + `conditions`.
- I18N bumped para `1.73.0`. Novas chaves: `petTimeline.assessmentTitle`, `petTimeline.planTitle`, `examResults.empty`, `assessmentInterpretation.*`, `machineSummary.*`.
- Files: src/services/exam-classification.ts, src/components/pet/AssessmentInterpretation.tsx, src/components/pet/ConsultationMachineSummary.tsx, src/components/pet/PetConsultationsTimeline.tsx, src/components/pet/HistoricalConsultationsSection.tsx, src/components/pet/GenerateSamplePetsButton.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts, supabase/migrations/*pet_consultations_machine_interpretation*.sql

### Added - 2026-05-12 — Reestrutura da consulta clínica + agrupamento gerociência + remoção da aba Notas
<!-- area: vet-ui · status: entregue · i18n: 1.71.0 -->
- Aba **Notas Clínicas** removida do `PetProfilePage` (notas continuam visíveis dentro de cada consulta no histórico). Card "0 Notas Clínicas" mantido no topo conforme decisão do usuário.
- Lista de condições no perfil agora ordena condições tradicionais primeiro e empurra hallmarks de **gerociência** (inflammaging, sarcopenia, disfunção mitocondrial, senescência celular, CCD, imunossenescência etc.) para o final, marcadas como "atenção geriátrica" via `condition-classification.ts`.
- Novo serviço `src/services/condition-classification.ts` com whitelist EN/PT de hallmarks de envelhecimento e helper `geroscienceOriginLabelKey` que devolve i18n key + params (`bySuggestedExams`, `byVetVisit`, `byVetGeneric`).
- Novo componente `PhysicalExamBlock` para o **Exame Físico estruturado** (Geral: postura, pele, comportamento, BCS · Específico: parâmetros fisiológicos, ortopédico, cardiovascular, neurológico, abdominal) com fallback para texto livre.
- Novo componente `ExamResultsWithReferences` que renderiza exames laboratoriais em tabela comparando com **faixas de referência caninas** built-in (ALT, BUN, creatinina etc.) e marca status normal/alto/baixo.
- `PetConsultationsTimeline` refatorado para a ordem aprovada: **Motivo → Exame Físico → Exames Complementares (com referências) → Avaliação (destacada por último) → Conduta → Tags representativas**.
- Migração `pet_consultations`: novas colunas `physical_exam JSONB` e `tags TEXT[] DEFAULT '{}'` (mantém `clinical_exam TEXT` para retrocompatibilidade).
- I18N_VERSION 1.70.0 → 1.71.0; chaves novas em PT/EN para `physicalExam.*`, `examResults.*`, `geroscienceAttention.*` e `consultationCard.tags`.
- Files: src/pages/veterinario/PetProfilePage.tsx, src/components/pet/PetConsultationsTimeline.tsx, src/components/pet/PhysicalExamBlock.tsx, src/components/pet/ExamResultsWithReferences.tsx, src/services/condition-classification.ts, src/locales/{pt,en}/translation.json, src/i18n.ts, supabase/migrations/20260512172541_*.sql

### Added - 2026-05-12 — Análise nutricional condicional ao catálogo + nomenclatura preventivo/terapêutico + revisão técnica admin-only
<!-- area: vet-ui · status: entregue · i18n: 1.70.0 -->
- `NutritionGapAnalysis` agora **suprime** a tabela de gaps e a seção "Sugerido pela raça" quando a ração não está no catálogo (`pet_food_nutrition` ausente). Em vez disso, exibe um card âmbar único: "A análise de complementação nutricional não foi concluída porque esta ração ainda não está no nosso banco de dados."
- Botões **Procurar** e **Incorporar** (restritos a admin via `useAuth().hasRole('admin')`) chamam a edge `enrich-pet-food-product`. "Incorporar" só é habilitado quando a confiança da extração ≥ 0.4. Sucesso invalida `['nutrition-gap', petId]` e a análise re-roda automaticamente.
- Edge `enrich-pet-food-product` extendida com `persist: true` + `link_to_item_id?`: cria/recupera `pet_food_brands` e `pet_food_products` (snake-insensitive), insere a composição em `pet_food_nutrition` e vincula o `pet_nutrition_items.product_id` em uma única chamada (service role).
- Princípio formalizado em `.lovable/memory/principles/preventive-vs-therapeutic-nomenclature.md`: separação entre **profilática (preventiva)** vs **manejo terapêutico/curativo** vs **suporte** para nutracêuticos, rações e drogas.
- UI da seção "Sugerido pela raça" passa a exibir badge **Profilática (preventiva)** (azul) ou **Manejo terapêutico** (destrutivo, quando `already_active`), além de um disclaimer explícito de que o pet ainda NÃO tem a condição listada — apenas predisposição racial documentada.
- `TechnicalReviewSection` ganhou ícone `(?)` ao lado do título com tooltip explicativo.
- Painel "Depuração do MedGraphRAG longitudinal" agora é renderizado **apenas para admins** em `PetProfilePage`; vet/tutor não veem mais essa seção.
- Novo hook `usePetFoodEnrichment` (lookup + incorporate, com state de confiança).
- I18N_VERSION 1.69.0 → 1.70.0; chaves `nutritionGap.notInCatalog`, `searchCatalog`, `incorporate`, `lookupConfidence`, `breed.preventiveBadge`, `breed.therapeuticBadge`, `breed.disclaimer` etc. em PT/EN.
- Files: src/components/pet/NutritionGapAnalysis.tsx, src/components/ui/technical-review-section.tsx, src/hooks/usePetFoodEnrichment.ts, src/pages/veterinario/PetProfilePage.tsx, supabase/functions/enrich-pet-food-product/index.ts, src/locales/{pt,en}/translation.json, src/i18n.ts, .lovable/memory/principles/preventive-vs-therapeutic-nomenclature.md

### Added - 2026-05-12 — Camada de gerociência separada da voz do vet + marcação "revisão técnica" (Missões B & C)
<!-- area: clinical-pipeline · status: entregue · i18n: 1.69.0 -->
- Princípio formalizado: vet escreve em linguagem clínica tradicional (OA, ALT, Carprofen). Gerociência (senescência, inflammaging, NAD+, autofagia, hallmarks, senolíticos) é responsabilidade do sistema e nunca atribuída ao vet.
- Memória `.lovable/memory/principles/clinical-language-vs-geroscience-layer.md` documentando o contrato e a obrigação de prefixo "Inferência de gerociência — gerada pelo sistema".
- Prompts atualizados em `hybrid-recommendation` (ENRICH + FALLBACK) e `extract-pet-clinical-data`: input do vet em linguagem tradicional; output do sistema explicita ponte achado clínico → hallmark → composto, com prefixo de inferência.
- Novo componente `TechnicalReviewSection` (âmbar, colapsado por padrão, badge `🔧 Revisão técnica` com tooltip "Disponível para validação interna. Não fará parte da versão operacional.") aplicado ao painel `LongitudinalDebugPanel` no perfil do pet.
- Token `--warning` (38 92% 50%) reaproveitado, mantendo o sistema de design HSL e separando visualmente conteúdo de QA dos dados operacionais (verde/vermelho).
- I18N_VERSION 1.68.0 → 1.69.0.
- Files: supabase/functions/hybrid-recommendation/index.ts, supabase/functions/extract-pet-clinical-data/index.ts, src/components/ui/technical-review-section.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts, .lovable/memory/principles/clinical-language-vs-geroscience-layer.md

### Added - 2026-05-12 — Nutrition gap & breed-based recommendations (Passos 1–4)
<!-- area: vet-ui · status: entregue · i18n: 1.68.0 -->
- Passo 1: aba "Atual" no perfil do pet expondo dieta/ração com vínculo ao catálogo nutricional.
- Passo 2: catálogo `pet_food_products` populado com 20 produtos reais (Royal Canin, Hill's, Premier, Pro Plan, Acana, Orijen, N&D, Taste of the Wild, Golden) e perfis nutricionais (`pet_food_nutrition`) com proteína/gordura/kcal/EPA-DHA/Ca:P/glicosamina e flag AAFCO.
- Passo 3: motor `nutrition-gap-analyzer.ts` comparando dieta atual vs. mínimos FEDIAF 2024 + alvos clínicos (DRC, OA, hepático…) com cálculo de RER/MER, conversão as-fed→DM e ponderação por `share_percent`.
- Passo 4: justificativas conectadas a `breed_predispositions` — bloco "Sugerido pela raça" com `risk_factor`, `evidence_grade`, alvos preventivos e tooltips com racional científico (ex.: Roush 2010 para EPA+DHA em OA).
- I18n: chaves `nutritionGap.*` em PT/EN, bump 1.67.0 → 1.68.0; remoção dos textos `lang === 'pt' ? ... : ...` inline em `NutritionGapAnalysis.tsx`.
- Files: src/components/pet/NutritionGapAnalysis.tsx, src/components/pet/PetNutritionPanel.tsx, src/services/nutrition-gap-analyzer.ts, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Added - 2026-05-11 — Cadastro manual rico (Fase 3) + i18n (Fase 4)
<!-- area: vet-ui · status: entregue · i18n: 1.67.0 -->
- Foto do pet no cadastro (bucket `pet-photos`) com preview e upload pós-INSERT.
- Campo `birth_date` com cálculo automático de `age_years`.
- Anexar PDFs de exames já no formulário; após salvar dispara `parse-pet-exam-pdf` em batch.
- Seção "Consultas anteriores" colapsável: cria N `pet_consultations` com diagnósticos e medicações vinculados, deixando o trigger `refresh_pet_consultation_latest` marcar a última.
- Service `pet-consultation-writer.ts` (DRY entre formulário manual e gerador de pets demo) e helper `pet-exam-uploader.ts`.
- Tooltip didático `(?)` na seção de consultas anteriores explicando os pesos do MedGraphRAG.
- I18n: bump para 1.67.0 com chaves PT/EN para birthDate, photoUploader, initialExams e historicalConsultations.
- Files: src/components/pet/PetRegistrationForm.tsx, src/components/pet/PetPhotoUploader.tsx, src/components/pet/HistoricalConsultationsSection.tsx, src/services/pet-consultation-writer.ts, src/services/pet-exam-uploader.ts, src/pages/veterinario/PetRegistrationPage.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Added - 2026-05-11 — Painel de depuração e avaliação do MedGraphRAG longitudinal
<!-- area: vet-ui · status: entregue · i18n: 1.65.0 -->
- Edge function `hybrid-recommendation` aceita `debug:true` e `disableLongitudinal:true`. Quando `debug` está ligado a resposta inclui `debug.longitudinal` (quais blocos foram ativados — CURRENT_STATE/CLINICAL_TRAJECTORY/DIET_PROFILE — número de entradas, condições ativas, exames anormais, produtos de dieta) e `debug.renderedContextBlock` (texto exato injetado no prompt). `disableLongitudinal` remove os blocos longitudinais para permitir comparação A/B.
- Novo serviço `src/services/longitudinal-debug-service.ts` com 3 utilidades: `auditPetLongitudinalIntegrity(petId)` (verifica N consultas, `is_latest`, FK `consultation_id` em conditions/meds/exams e `is_current` em pet_nutrition); `fetchLongitudinalDebug(...)` (debug single-shot); `compareWithVsWithoutHistory(...)` (roda inferência 2× em paralelo e calcula diff: compostos adicionados/removidos, flags anormais consideradas, menções a lacunas nutricionais, delta de racional/precauções).
- Novo componente `LongitudinalDebugPanel` com 3 abas (Auditoria · Blocos usados · Comparação) renderizado no perfil do pet, abaixo do Patient Knowledge Subgraph — acessível ao veterinário em um clique.
- `buildLongitudinalContext` exportado para reuso.
- Files: supabase/functions/hybrid-recommendation/index.ts, src/services/longitudinal-debug-service.ts, src/services/hybrid-recommendation-service.ts, src/components/pet/LongitudinalDebugPanel.tsx, src/pages/veterinario/PetProfilePage.tsx

### Added - 2026-05-11 — Aprovação e normalização de exames PDF
<!-- area: vet-ui · status: entregue · i18n: 1.65.0 -->
- `pet_exams` ganha colunas `approved`, `approved_at`, `approved_by` para fluxo de revisão antes de entrar no histórico.
- Edge function `parse-pet-exam-pdf`: normaliza unidades (mg/dL, U/L, 10^3/µL…), coerge valores numéricos, recalcula `flag` (high/low) a partir da faixa, normaliza datas (dd/mm/aaaa → ISO), e auto-vincula a uma `pet_consultation` quando a data do exame casa com uma visita (±3 dias).
- Edge function `enrich-pet-food-product`: clamp de percentuais 0-100, normalização de kcal/kg (detecta kcal/100g), validação de enums (`species`, `life_stage`, `food_form`, `size_target`).
- UI `PetExamPdfUploader`: seletor de consulta para vincular novos uploads (Automático / Sem vínculo / consulta específica) + badge "Pendente revisão" / "Aprovado" por exame.
- Novo `PetExamReviewDialog`: revisar/editar tipo, data, laboratório, comentários, vínculo de consulta e tabela editável de analitos (valor, unidade, faixa min/max, flag recalculado em tempo real). Botões "Salvar rascunho" e "Aprovar e salvar no histórico".
- Files: supabase/migrations/*_pet_exams_approval.sql, supabase/functions/parse-pet-exam-pdf/index.ts, supabase/functions/enrich-pet-food-product/index.ts, src/components/pet/PetExamPdfUploader.tsx, src/components/pet/PetExamReviewDialog.tsx

### Added - 2026-05-11 — Histórico longitudinal nos demo pets + MedGraphRAG context-aware
<!-- area: clinical-pipeline · status: entregue · i18n: 1.65.0 -->
- Demo pets agora geram histórico clínico longitudinal: Buddy 1 consulta, Max 2, Rex 3, Thor 4, Luna 5 (total 15 consultas), com `pet_conditions`/`pet_medications`/`pet_exams` linkados via `consultation_id` e `pet_nutrition` + `pet_nutrition_items` por pet (Rex em dieta de controle de peso, Luna trocou para fórmula renal na 4ª consulta). Trigger `refresh_pet_consultation_latest` marca a última como `is_latest`.
- Edge function `hybrid-recommendation`: novo `ClinicalContext` longitudinal com blocos **CURRENT_STATE (peso 1.0)**, **CLINICAL_TRAJECTORY (peso 0.4)** e **DIET_PROFILE**. Prompts (enrich + fallback) instruídos a tratar a última consulta como sinal dominante e usar trajetória apenas para detectar progressão, falhas terapêuticas e exposições cumulativas — sem reabrir condições resolvidas.
- Service `hybrid-recommendation-service`: novo helper `buildLongitudinalContext(petId)` lê `pet_consultations` + entidades vinculadas + `pet_nutrition` e injeta no edge call. `ConfidenceCalculationParams` ganhou `petId` opcional.
- i18n: `petRegistration.generator.successDescWithHistory` (PT/EN), `I18N_VERSION` 1.64.0 → 1.65.0.
- Files: src/components/pet/GenerateSamplePetsButton.tsx, supabase/functions/hybrid-recommendation/index.ts, src/services/hybrid-recommendation-service.ts, src/types/recommendation-confidence.ts, src/i18n.ts, src/locales/{pt,en}/translation.json

### Added - 2026-05-11 — Consultas veterinárias + Catálogo de Rações (Fase 1+2)
<!-- area: clinical-pipeline · status: parcial · i18n: 1.64.0 -->
- Schema: nova tabela `pet_consultations` (consulta como unidade central com data, vet, queixa, exame clínico, peso, BCS, conduta) com trigger `refresh_pet_consultation_latest` que mantém `is_latest = true` na consulta mais recente de cada pet
- Schema: colunas `consultation_id` adicionadas a `pet_conditions`, `pet_medications`, `pet_exams`, `pet_clinical_notes` para vincular itens à consulta de origem
- Schema: novas tabelas `pet_nutrition` (snapshot da dieta por pet/consulta com `is_current`) + `pet_nutrition_items` (N produtos por entrada, com `share_percent` para dietas mistas)
- Schema: catálogo de rações — `pet_food_brands` (30 marcas seedadas: Royal Canin, Hill's, Pro Plan, Premier, Golden, Origens, Farmina, Acana, Orijen, Guabi, Quatree, GranPlus, Biofresh, N&D, Equilíbrio, Magnus, etc.), `pet_food_products` (com fluxo `submission_status` pending/approved/rejected para curadoria), `pet_food_nutrition` (perfil completo: macros, minerais, ω3/ω6, Ca:P, funcionais, AAFCO/FEDIAF, com `revision` versionado e `source` declarado), `pet_food_ingredients` (lista ordenada)
- RLS: consultas/dieta visíveis apenas ao vet responsável, ao criador do pet ou admin; catálogo legível por todos autenticados, escrita só admin, vet pode submeter produto pendente
- UI: nova tab admin "Catálogo de Rações" (`src/components/administrador/pet-food/PetFoodCatalogTab.tsx`) com listagem filtrável de produtos, badges de status, criação de marcas e produtos com composição garantida (proteína/gordura/kcal/Ca/P/ω3/ω6) e fluxo aprovar/rejeitar pendentes
- Próximo: edge `enrich-pet-food-product` (Gemini + web), autocomplete na UI de consulta, edge `resolve-drug-brand`, parser PDF de exames, enriquecimento do grafo do paciente com DietProfile
- Files: supabase/migrations/*pet_consultations*.sql, src/components/administrador/pet-food/PetFoodCatalogTab.tsx, src/config/admin-tabs.ts, src/hooks/useSystemGuideStats.ts

### Fixed - 2026-05-11 — Sidebar/tabs admin mostrando chaves de tradução literais
<!-- area: i18n · status: entregue · i18n: 1.64.0 -->
- Raiz do problema: os arquivos `src/locales/{pt,en}/translation.json` continham a chave `"admin"` declarada **duas vezes** no nível raiz. O segundo bloco (adicionado junto com a Base Farmacológica em 2026-05-09) sobrescrevia silenciosamente o primeiro durante o `JSON.parse`, apagando todos os namespaces `admin.sidebar.*`, `admin.tabs.*`, `admin.errors.*`, `admin.studies.*`, etc. — daí as chaves cruas aparecendo em quase toda a UI administrativa
- Correção: fundidos os dois blocos `"admin"` num só (PT e EN), preservando `pharmacology` ao lado das 19 sub-chaves originais (total 20)
- Salvaguarda: novo script `scripts/check-translation-duplicates.mjs` (parser custom que detecta chaves duplicadas em qualquer profundidade) exposto via `npm run check:translations` — o `audit-translations` antigo só checava paridade PT↔EN, não duplicatas internas
- `I18N_VERSION` 1.63.0 → 1.64.0 para invalidar o cache do navegador
- Files: src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts, scripts/check-translation-duplicates.mjs, package.json

### Added - 2026-05-11 — Auditorias Técnicas Internas (aba admin versionada)
<!-- area: admin · status: entregue · i18n: 1.63.0 -->
- Nova aba `Auditorias Técnicas` em Configurações exibindo o histórico versionado de auditorias internas do Senex AI, cada uma vinculada à versão do sistema auditada (i18n + última entrada do changelog)
- Auditoria v3 convertida para HTML navegável em `public/audits/v3/index.html` (com os 9 infográficos preservados em `public/audits/v3/media/`) e PDF/DOCX para download direto
- Botão "Fazer nova auditoria" abre dialog com escopo editável (pré-preenchido) e versão do sistema auto-detectada — registra o pedido em `audit_requests` para o agente Lovable gerar na próxima sessão dedicada
- Edição retroativa do escopo de auditorias passadas com histórico preservado em `scope_history`
- Files: src/components/administrador/audits/TechnicalAuditsTab.tsx, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx, public/audits/v3/index.html, supabase/migrations

### Added - 2026-05-09 — Base Farmacológica (Fase 1) integrada ao perfil do pet
<!-- area: admin · status: entregue · i18n: 1.63.0 -->
- Novo `DrugLookupBadge` plugado na lista de medicamentos em `PetProfilePage.tsx` — resolve marca comercial (ex.: "Previcox") para princípio ativo + classe (ex.: `= firocoxibe · AINE COXIB`), com tooltip de mecanismo; exibe alerta "Não reconhecido" quando a medicação não está no catálogo
- Chaves i18n formais adicionadas em `pharmacology.lookup.*` e `admin.pharmacology.*` (PT/EN), substituindo fallbacks inline
- I18N_VERSION incrementado para 1.63.0
- Files: src/pages/veterinario/PetProfilePage.tsx, src/components/pet/DrugLookupBadge.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-07 — Sprint 7: CTA honesto em dois passos + ROI
<!-- area: tutor-ui · status: entregue · i18n: 1.60.0 -->
- Novo serviço `src/services/proposal-roi.ts` (puro) — calcula custo anual do plano, comparativo com tratamento da condição instalada (mostra `—` quando não há referência, sem inventar número) e crédito M3 = 50% do investimento dos 3 primeiros meses
- Novo componente `src/components/tutor/HonestCTA.tsx` — bloco de comparação de custo (3 colunas), promessa testável de M3 (devolução em crédito se exames de calibração não mostrarem ≥15% de melhora), CTA primário "Começar com a primeira caixa" + secundário "Continuar plano anual após reavaliação no M3" + link para abrir o chat de dúvidas
- `TreatmentProposalCard` substitui o bloco antigo de Aceitar/Dúvidas pelo `HonestCTA`, mantendo `handleAccept` como ação primária
- i18n PT/EN: novo namespace `tutor.proposal.cta.*` (12 chaves cada lado), `I18N_VERSION` → 1.60.0
- Suíte `src/services/__tests__/proposal-roi.test.ts` (7/7 passing): custo anual, ausência de referência → null, delta positivo/negativo, crédito M3, clamp de input inválido, default de melhora-alvo > 0
- Files: src/services/proposal-roi.ts, src/services/__tests__/proposal-roi.test.ts, src/components/tutor/HonestCTA.tsx, src/components/tutor/TreatmentProposalCard.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-07 — Sprint 6: Exportação PDF do protocolo do tutor
<!-- area: tutor-ui · status: entregue · i18n: 1.59.0 -->
- Novo serviço `src/services/pdf-export.ts` usando `@react-pdf/renderer` — gera Documento A4 com cabeçalho fixo, condições, cenário comparado (Gêmeo Digital), compostos com posologia/racional, racional clínico, investimento, referências em formato Vancouver e rodapé com data de geração
- Botão "Baixar protocolo em PDF" no `TreatmentProposalCard` (sempre disponível, mesmo após aceite) — reaproveita as referências já carregadas pelo hook `useProposalReferences`
- Suíte `src/services/__tests__/pdf-export.test.ts` (5/5 passing): cobre forma do documento, condições vazias, cenário ausente, refs vazias e mistura de shapes (string × objeto)
- i18n: novo namespace `tutor.proposal.pdf.*` (PT/EN), `I18N_VERSION` 1.58.0 → 1.59.0
- Files: src/services/pdf-export.ts, src/services/__tests__/pdf-export.test.ts, src/components/tutor/TreatmentProposalCard.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-07 — Sprint 5: Biblioteca de referências científicas no relatório do tutor
<!-- area: tutor-ui · status: entregue · i18n: 1.58.0 -->
- Novo componente `ScientificReferencesLibrary` — lista expandível com filtro de busca, citação Vancouver, tags de composto/condição e link clicável para PMID/DOI
- Novo serviço puro `references-builder` — deduplica por PMID/DOI, ordena por ano desc, formata Vancouver, faz merge de tags por estudo
- Novo hook `useProposalReferences` — busca triplets aprovados (compound × condition) no banco e resolve `scientific_studies` reais (sem mock)
- Integrado em `TreatmentProposalCard` abaixo do subgrafo do paciente; render silencioso quando não há referências
- Suíte Vitest 9/9 passando: dedupe por PMID, fallback DOI, ordenação, formato Vancouver, "et al." em 7+ autores, URL canônica, merge de tags, filtro multi-campo, input vazio
- Files: src/services/references-builder.ts, src/services/__tests__/references-builder.test.ts, src/hooks/useProposalReferences.ts, src/components/tutor/ScientificReferencesLibrary.tsx, src/components/tutor/TreatmentProposalCard.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Added - 2026-05-07 — Sprint 4: Subgrafo do paciente no relatório do tutor
<!-- area: tutor-ui · status: entregue · i18n: 1.57.0 -->
- `TreatmentProposalCard` agora renderiza `PatientKnowledgeSubgraph` abaixo das curvas de progressão, usando `key_triplets`, `biological_pathways`, condições e compostos do próprio `proposal`
- Subgrafo reaproveita o componente já existente (vis-network), com legenda de cores, contagem de nós/arestas e arestas tracejadas âmbar para triplets provisórios via `petId`
- Render condicional: só aparece quando há triplets ou pathways no `scientific_summary`
- Nova suíte Vitest `subgraph-logic.test.ts` (6 casos: extração de nomes em formatos mistos, render condicional, entradas vazias)
- Files: src/components/tutor/TreatmentProposalCard.tsx, src/components/tutor/__tests__/subgraph-logic.test.ts

### Added - 2026-05-07 — Sprint 3: Cenário "Com vs Sem protocolo" (Digital Twin real)
<!-- area: tutor-ui · status: entregue · i18n: 1.57.0 -->
- Novo componente `ScenarioComparison.tsx` no relatório do tutor: cards lado-a-lado mostrando idade biológica projetada e expectativa de vida total **sem** vs **com** o protocolo
- Dados 100% reais do edge function `project-pet-trajectory` (Gêmeo Digital, Gemini 2.5 Pro grounded no KG); reusa o mesmo query do Sprint 2 (sem requests adicionais)
- Selo de transparência `Gêmeo Digital · ancorado no KG` (verde) vs `Estimativa heurística` (âmbar) com tooltip explicativo bilíngue
- Ganho de anos exibido com 3 estados honestos: positivo (`+X anos`), zero (mensagem clara de que o benefício é em qualidade de vida, não longevidade direta), negativo (alerta para revisão pelo veterinário — caveat de polifarmácia)
- Nova suíte Vitest `scenario-logic.test.ts` (4 casos: arrays vazios, `years_gained_total` direto, fallback por delta, ganho negativo)
- i18n: novo namespace `tutor.proposal.scenario.*` em PT/EN; bump `I18N_VERSION` 1.56.0 → 1.57.0
- Files: src/components/tutor/ScenarioComparison.tsx, src/components/tutor/TreatmentProposalCard.tsx, src/components/tutor/__tests__/scenario-logic.test.ts, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-07 — Sprint 2: Badges KG-covered / KG-gap no relatório do tutor
<!-- area: tutor-ui · status: entregue · i18n: 1.56.0 -->
- Cada condição no `TreatmentProposalCard` agora exibe selo `KG-covered` (verde) ou `KG-gap` (âmbar) com tooltip explicativo (PT/EN), usando `coverage_by_condition` do `usePetTrajectoryProjection`
- Novo selo agregado no header de "Condições Identificadas": "X de Y com cobertura científica" + tooltip
- Match case-insensitive e tolerante a whitespace; fallback silencioso quando não há dados de cobertura (não quebra)
- Nova suíte Vitest `coverage-logic.test.ts` (5 casos: shapes mistos, case-insensitive, lista vazia, condição ausente, condição em gap)
- i18n: novo namespace `tutor.proposal.coverage.*` em PT/EN; bump `I18N_VERSION` 1.55.0 → 1.56.0
- Files: src/components/tutor/TreatmentProposalCard.tsx, src/components/tutor/__tests__/coverage-logic.test.ts, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-05-07 — Sprint 1: Curva de progressão calibrada em literatura real
<!-- area: tutor-ui · status: entregue · i18n: 1.55.0 -->
- Nova tabela `condition_response_curves` (Supabase) com parâmetros (time_to_effect, peak_effect, plateau_week, placebo_decline, SMD, banda de confiança, citações PMID/DOI) ancorados em meta-análises reais
- Seed inicial com 5 curvas: Osteoartrite × (Ômega-3, Glucosamina+Condroitina, PCSO-524, Curcumina) + Senescência Celular × NMN/NR (extrapolada de humanos, claramente sinalizada)
- Novo serviço `condition-progression-engine.ts` com `buildCalibratedCurve`, `classifyCompound`, `pickBestCurve`, `buildPointsFromRow` — substitui sigmoide heurística do `ConditionProgressionChart`
- `ConditionProgressionChart` agora exibe selos: **Curva calibrada** (verde, com nº de estudos no tooltip), **Extrapolada de humanos** (âmbar) ou **Sem curva calibrada** (mostra apenas baseline, sem inventar projeção)
- Suíte de testes Vitest (17 casos) cobrindo classificação de compostos, monotonia do declínio sem tratamento, plateau ~M4, banda de confiança crescente, limites [0,100] e prioridade não-extrapolada
- Files: supabase/migrations/* condition_response_curves, src/services/condition-progression-engine.ts, src/services/__tests__/condition-progression-engine.test.ts, src/components/tutor/ConditionProgressionChart.tsx, src/components/tutor/TreatmentProposalCard.tsx, src/locales/{pt,en}/translation.json, src/i18n.ts

### Changed - 2026-05-06 — Pets demo agora usam condições com forte cobertura no Senex AI
<!-- area: vet-ui · status: entregue · i18n: 1.54.1 -->
- Reformuladas as condições dos 5 pets de exemplo (`GenerateSamplePetsButton`) para usar exclusivamente outcomes com ≥15 compostos no KG (layer_4_outcome aprovado)
- Substituições: `Mild Periodontal Disease` → `Oxidative Stress` (Buddy); `Hip Dysplasia`+`Overweight` → `Obesity`+`Oxidative Stress` (Rex); `Hip Dysplasia`+`Degenerative Myelopathy` → `Neuroinflammation`+`Cellular Senescence` (Thor); `Pulmonary Hypertension` → `Cardiovascular Disease` e label MMVD canonicalizado para `Myxomatous Mitral Valve Disease` (Luna)
- Exames atualizados de forma coerente com as novas condições (Oxidative Stress Panel, Senescence Biomarkers, Cardiovascular Panel) — narrativa clínica mantida e plausível por raça/idade
- Resultado esperado: Gêmeo Digital (`project-pet-trajectory`) opera em modo `ai_kg_grounded` para todos os 5 pets, com `years_gained_total` mensurável e `coverage_by_condition.kg_covered=true` em ≥80% dos casos — eliminando fallback heurístico nos demos
- Files: src/components/pet/GenerateSamplePetsButton.tsx, src/i18n.ts

### Added - 2026-05-04 — Sistema de tags estruturadas para estudos científicos
<!-- area: curation · status: entregue · i18n: 1.54.0 -->
- Novas colunas em `processed_studies`: `tags` (jsonb com `study_design`, `population`, `methodology`, `sample_size`, `ai_confidence`), `prestige_tier` (1-5), `tags_source` (`pending` | `ai_extracted` | `manual` | `reviewed`)
- Nova tabela `journal_prestige_tiers` com seed de ~40 journals top (Nature/Cell/JVIM/Aging Cell/etc.) classificados por tier 1-5 baseado em quartil Scimago + prestígio do publisher
- Edge function `auto-tag-studies`: extrai tags via Gemini Flash Lite (apenas extração textual de title/abstract/journal — sem inferência) e calcula `prestige_tier` via lookup; throttle 300ms; sem alucinação porque enums fechados via tool calling
- UI da Library: 3 novos filtros (Desenho, População, Tier de prestígio), botão "Auto-tag pendentes", badges coloridos nos cards (T1-T5 ambar, design cinza, população azul, metodologia roxa)
- Tags ficam disponíveis para futura ponderação no motor de recomendação (peso por tier × evidence_level)
- Files: supabase/migrations/*_journal_tiers_and_study_tags.sql, supabase/functions/auto-tag-studies/index.ts, src/components/administrador/estudos/library/StudiesLibraryTab.tsx, src/i18n.ts, src/locales/{pt,en}/translation.json

### Fixed - 2026-05-04 — Library tab agora renderiza os estudos curados
<!-- area: admin · status: entregue · i18n: — -->
- Corrigido bug de navegação em que a aba `Library` existia no menu, mas não tinha `TabsContent` associado em `SciImportSection`
- A aba agora reutiliza `StudiesLibraryTab`, exibindo os estudos vindos de `processed_studies` e `scientific_studies` conforme já implementado
- Validado no backend: 40 estudos `approved`, 4 `processed` e 2 `new` disponíveis para listagem
- Files: src/components/administrador/estudos/import/SciImportSection.tsx

### Added - 2026-05-01 — QA gate + provenance for AI enrichment
<!-- area: curation · status: entregue · i18n: — -->
- New columns `enrichment_source` (none/extracted/llm/llm_low_confidence/human), `enrichment_confidence`, `enrichment_needs_review`, `enrichment_at` on `triplet_extractions` for full provenance of AI-inferred metadata
- New table `enrichment_qa_samples` storing stratified human-reviewed AI enrichment samples (batch_id, AI vs human verdict per field)
- Guard-rails in `enrich-triplet`: short excerpts (<80 chars) skip the LLM; AI must return a verbatim `source_quote` that is substring-verified against the source text; AI must self-report confidence; failures are flagged `enrichment_source = llm_low_confidence` + `needs_review = true`
- New edge function `enrichment-qa-sample`: draws ~50 stratified samples (high/med/low extraction_confidence) and enriches them for human QA
- New admin tab "QA Enriquecimento" (CurationDashboard) to review AI output one-by-one, see per-batch approval rate and gate status
- `backfill-triplet-enrichment` now blocks bulk runs unless ≥30 reviewed samples with ≥85% approval; can be overridden with `force=true`
- Files: supabase/functions/enrich-triplet/index.ts, supabase/functions/backfill-triplet-enrichment/index.ts, supabase/functions/enrichment-qa-sample/index.ts, src/components/administrador/estudos/curation/EnrichmentQAReview.tsx, src/components/administrador/estudos/curation/CurationDashboard.tsx

### Changed - 2026-05-01 — Auto-enrichment of triplet intensity & evidence_level
<!-- area: curation · status: parcial · i18n: — -->
- Improved `enrich-triplet` prompt: anchored intensity scale in observed magnitude (% change, effect size), forces low intensity for null/negative results, requires verbatim source excerpt in `confidence_rationale`, added `in_vivo`/`animal_study` to evidence_level enum
- Added DB CHECK constraint update to allow `in_vivo` evidence_level (previously fell back to `expert_opinion`)
- New `backfill-triplet-enrichment` edge function: idempotent batch enrichment with rate-limit-aware batching; also serves single-triplet mode for post-approval hooks
- New `src/services/triplet-enrichment-service.ts` helper plugged into all 4 client-side approval paths (TripletCurationQueue, StudyTripletCuration single + bulk, TripletCurationBoard drag/bulk/auto-approve) — every approval now triggers fire-and-forget enrichment
- Backfill partially run (688/3737 approved triplets now have evidence_level, 588 have intensity); remaining ~3050 will be processed by repeated calls to backfill-triplet-enrichment due to per-function rate limits
- Files: supabase/functions/enrich-triplet/index.ts, supabase/functions/backfill-triplet-enrichment/index.ts, src/services/triplet-enrichment-service.ts, src/components/administrador/estudos/curation/{TripletCurationQueue,StudyTripletCuration,TripletCurationBoard}.tsx

### Fixed - 2026-05-01 — KG Evidence Gap-Fill: PubMed complementary search when Perplexity PMIDs fail validation
<!-- area: kg · status: entregue · i18n: — -->
- Critical fix: when Perplexity returns efficacy > 0 but all cited PMIDs are hallucinated (fail PubMed validation), the pipeline now searches PubMed directly for real papers and re-assesses with Gemini
- Previously, PubMed fallback only triggered when Perplexity returned efficacy = 0, which almost never happens for known correlations
- Reduced sleep intervals (400ms→200ms Perplexity, 360ms→150ms PubMed) to fit within 150s idle timeout
- Reduced default max_pairs from 10 to 5 in the UI to prevent timeout
- Added heartbeat events during streaming to prevent idle timeout disconnections
- New provider type `perplexity+pubmed` tracks when both sources contributed to a triplet
- Files: supabase/functions/kg-evidence-gap-fill/index.ts, src/components/pet/EvidenceGapCard.tsx

### Changed - 2026-05-01 — Digital Twin workflow expandido + log reposicionado
<!-- area: vet-ui · status: entregue · i18n: 1.49.0 -->
- Workflow do Gêmeo Digital expandido de 4 para 7 estágios: Snapshot → Condições → Raça → Trajectory API → Parse → Cobertura KG → Render
- Log panel movido para imediatamente abaixo do workflow monitor (antes ficava após o EvidenceGapCard)
- Novos ícones e labels bilíngues para cada estágio
- Files: src/components/pet/DigitalTwinDog.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Changed - 2026-05-01 — Pipeline: recommendation timing + KG stratification
<!-- area: clinical-pipeline · status: entregue · i18n: 1.48.0 -->
- Adicionado `durationMs` ao stage6_recommendation para exibir tempo individual no stepper
- KG dividido em dois cards visuais: **KG Query** (consulta Neo4j) e **KG Enrich** (extração de pathways/projeções)
- Novo estágio `stage4b_kg_enrich` no pipeline com contagem de pathways
- Files: src/services/clinical-analysis-pipeline.ts, src/components/pet/ClinicalPipelineWorkflow.tsx, src/pages/veterinario/PetProfilePage.tsx

### Fixed - 2026-04-30 — Edge function kg-evidence-gap-fill: PascalCase types + FK study_id
<!-- area: infra · status: entregue · i18n: — -->
- Corrigido `subject_type: 'compound'` → `'Compound'` e `object_type: 'condition'` → `'Condition'` — constraint `triplet_extractions_object_type_check` rejeitava todos os inserts
- Corrigido `study_id` FK violation: FK aponta para `processed_studies`, não `scientific_studies`. Gap-fill triplets agora usam `study_id = null` com proveniência em `approval_chain.cited_pmids`
- Verificado: triplet "Chondroitin Sulfate treats Osteoarthritis" salvo com sucesso como pending
- Files: supabase/functions/kg-evidence-gap-fill/index.ts

### Fixed - 2026-04-30 — Edge function kg-evidence-gap-fill: constraint violation + timeout
<!-- area: infra · status: entregue · i18n: — -->
- Corrigido bug onde campo `direction` era inserido como `positive` (valor inválido) em vez de `improves` — constraint `chk_direction` rejeitava todos os triplets encontrados pelo Perplexity
- `mapEvidenceLevel` garante mapeamento `clinical_trial` → `rct` para satisfazer constraint `chk_evidence_level`
- Reduzido `max_pairs` default de 12 para 5 para evitar timeout de conexão HTTP (cada par leva ~20-30s no Perplexity)
- Stream controller close protegido contra "stream already closed" error
- Edge function redeployada com versão corrigida
- Files: supabase/functions/kg-evidence-gap-fill/index.ts

### Fixed - 2026-04-30 — Restaurado Digital Twin + busca de evidências + marcadores dos avatares
<!-- area: vet-ui · status: entregue · i18n: — -->
- `DigitalTwinDog` (com `EvidenceGapCard` e log panel) restaurado na tab "trajectory" do PetProfilePage — havia sido removido na consolidação de tabs anterior
- Corrigida lógica dos marcadores nos avatares: cenário "sem protocolo" agora faz fallback para os dados do cenário "com protocolo" quando a API retorna `yearWithout` vazio, garantindo que ambos mostrem as doenças
- Perplexity connector verificado como ativo e vinculado ao projeto
- Files: src/pages/veterinario/PetProfilePage.tsx, src/components/pet/DigitalTwinDog.tsx

### Fixed - 2026-04-30 — Corrigido insert de triplets no gap-fill + UI de conclusões
<!-- area: kg · status: entregue · i18n: 1.47.0 -->
- **Bug crítico**: `direction: 'positive'` violava constraint `chk_direction` (mapeado para `'improves'`); `evidence_level` com valores inválidos (`clinical_trial`, `in_vivo`, `review`, `unclear`) mapeados para enum do DB (`rct`, `cohort`, `expert_opinion`)
- UI agora exibe conclusões claras por par: score de eficácia (0-5) com barra visual, nível de evidência, espécie, rationale colapsável do Perplexity/Gemini, links para PMIDs no PubMed e URLs citadas
- Botão de curadoria aparece automaticamente após triplets criados com sucesso
- Files: supabase/functions/kg-evidence-gap-fill/index.ts, src/components/pet/EvidenceGapCard.tsx, src/locales/*/translation.json

### Fixed - 2026-04-30 — Traduções evidenceGap.log e layout responsivo DT workflow
<!-- area: i18n · status: entregue · i18n: 1.46.0 -->
- Adicionadas 16 chaves de tradução `evidenceGap.log.*` em PT e EN para o painel de log em tempo real da busca de evidências
- DT mini-workflow: trocado `overflow-x-auto` por `flex-wrap` para quebrar em duas linhas em vez de sair do quadro
- Conectores entre etapas ocultados em telas pequenas (`hidden sm:block`)
- Files: src/locales/en/translation.json, src/locales/pt/translation.json, src/components/pet/DigitalTwinDog.tsx, src/i18n.ts

### Fixed - 2026-04-30 — Pipeline scroll, DT workflow visual, Evidence Gap search fix
<!-- area: clinical-pipeline · status: entregue · i18n: 1.44.0 -->
- Pipeline workflow card: adicionada barra de rolagem horizontal estilizada para telas menores
- Digital Twin: novo mini-workflow visual com 4 etapas (Snapshot → Trajectory API → Parse → Render) com tempos individuais e total
- Evidence Gap Search: corrigido bug onde `condition_id = NULL` em `pet_conditions` fazia a busca retornar 0 pares — agora usa `condition_name` como fallback
- Prompt do Perplexity expandido para incluir estratégias gerociência, senolytics, NAD+ precursores e terapias medicamentosas emergentes
- Files: src/components/pet/ClinicalPipelineWorkflow.tsx, src/components/pet/DigitalTwinDog.tsx, supabase/functions/kg-evidence-gap-fill/index.ts, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts

### Added - 2026-04-30 — Pipeline: card sinergias, tempos por etapa, log do Digital Twin
<!-- area: clinical-pipeline · status: entregue · i18n: 1.43.0 -->
- Novo 7o estágio `stage7_synergies` (ícone Zap) no `ClinicalPipelineWorkflow` com contagem de sinergias entre compostos recomendados
- Tempo de execução exibido abaixo de cada etapa concluída + indicador de tempo total no canto direito do workflow
- Novo `DigitalTwinLogPanel`: console ao vivo no Digital Twin rastreando ciclo de vida da projeção de trajetória (início, chamada AI, resposta, cache, erros) com autoscroll, limpar e exportar
- Pipeline e DT log totalmente bilíngues (PT/EN)
- Files: src/components/pet/ClinicalPipelineWorkflow.tsx, src/components/pet/DigitalTwinLogPanel.tsx, src/components/pet/DigitalTwinDog.tsx, src/pages/veterinario/PetProfilePage.tsx, src/services/clinical-analysis-pipeline.ts

### Fixed - 2026-04-30 — Organograma usa bbox real para centralização e escala
<!-- area: admin · status: entregue · i18n: 1.42.0 -->
- `useScrollPanZoom` agora mede o bounding box real do conteúdo SVG via `getBBox()` antes de aplicar `fit`, corrigindo o caso em que o Mermaid ficava minúsculo no canto apesar de haver espaço disponível.
- `OrganogramaDiagram` ganhou viewport útil maior (`calc(100vh - 230px)`, `minHeight: 520`) e `svg overflow-visible`, melhorando o aproveitamento horizontal e vertical.
- Files: src/hooks/useScrollPanZoom.ts, src/components/administrador/organograma/OrganogramaDiagram.tsx

### Added - 2026-04-30 — Internacionalização completa do Organograma do Projeto
<!-- area: i18n · status: entregue · i18n: 1.42.0 -->
- **7 arquivos corrigidos**: OrganogramaTab, OrganogramaCards, OrganogramaDiagram, OrganogramaForceGraph, ChangelogTimeline, AreaMiniTimeline — todos agora usam `useTranslation()` + `t()` para textos visíveis.
- **projectOrganograma.ts bilíngue**: todas as ~60 entidades (áreas, filhos, convenções) agora possuem campos `title_en`, `description_en`, `label_en`, `value_en`.
- **~50 chaves i18n** criadas no namespace `organograma` em ambos `translation.json` (PT/EN).
- **useLocalizedField** reutilizado para selecionar título/descrição pelo idioma ativo.
- Files: src/pages/administrador/OrganogramaTab.tsx, src/components/administrador/organograma/*.tsx, src/data/projectOrganograma.ts

### Added - 2026-04-30 — Diagnóstico Gap-Fill e detalhamento de fontes no EvidenceGapCard
<!-- area: kg · status: entregue · i18n: 1.41.9 -->
- **EvidenceGapCard expandido**: agora exibe breakdown por fonte (Perplexity / PubMed) com contagem de consultas, sucessos, falhas e motivos de ausência de evidências. Erros inline e flag de "sem chave Perplexity" nos detalhes de cada par.
- **Nova tab admin "Diagnóstico Gap-Fill"**: tela completa para inspecionar health_conditions (name_en), nutraceuticals (name_en), links pet_conditions ↔ condition_id, e todos os triplets gerados pelo gap-fill. Badges visuais indicam dados faltantes que impedem a pipeline.
- Files: src/components/pet/EvidenceGapCard.tsx, src/components/administrador/diagnostics/GapFillDiagnosticsTab.tsx, src/config/admin-tabs.ts

### Fixed - 2026-04-30 — Restauração do pipeline de evidências (gap-fill → projeção → gêmeo digital)
<!-- area: kg · status: entregue · i18n: 1.41.8 -->
- **Deploy das Edge Functions**: `kg-evidence-gap-fill`, `kg-missing-triplets`, `perplexity-health`, `provider-health` e `project-pet-trajectory` estavam retornando 404 (não publicadas). Agora todas estão ativas no backend.
- **Backfill canônico**: migração preencheu `pet_conditions.condition_id` (match por nome em `health_conditions`) e `nutraceuticals.name_en` para os 22 compostos que estavam sem nome inglês — requisito para o gap-fill montar pares de busca.
- **Auth do gap-fill**: substituído `getClaims` (indisponível na versão do SDK) por `getUser` para autenticação robusta do admin.
- **Preview Perplexity na projeção**: `project-pet-trajectory` agora inclui triplets pending de `perplexity_gap_fill` além de `pubmed_gap_fill` no modo preview, para que o gêmeo digital reflita evidências de ambas as fontes.
- **UX de erro**: `EvidenceGapCard` distingue "backend indisponível" de outros erros, com mensagem acionável bilíngue.
- Files: supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/project-pet-trajectory/index.ts, src/components/pet/EvidenceGapCard.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Added - 2026-04-30 — Seletor de modelo Perplexity + tester genérico de provedores
<!-- area: admin · status: entregue · i18n: 1.41.7 -->
- `perplexity-health` agora retorna `supported_models` (catálogo Sonar) e aceita `model` no body/querystring para pingar o modelo selecionado; em falha, devolve `status`, `status_text`, `provider_error`, `hint` (401 chave inválida, 403 modelo fora do plano, 429 quota, 5xx provedor) e ecoa `model` testado.
- Nova edge function `provider-health` (verify_jwt) que valida autenticação **e escopo** das chaves OpenAI / Claude / Gemini / Grok / Perplexity contra o endpoint real de chat de cada provedor e expõe HTTP status, mensagem de erro do upstream e dica acionável.
- `kg-evidence-gap-fill` lê `ai_configurations.perplexity_gap_fill_model` (com override via body `perplexity_model`) e propaga a escolha para `assessWithPerplexity` em vez do hard-coded `sonar-reasoning-pro`.
- `PerplexityStatusCard` ganhou Select de modelos (lista vinda do health-check com fallback estático), botões "Testar este modelo" / "Salvar" persistindo em `ai_configurations`, exibe `hint` e bloco de erro com HTTP status quando a chave não tem acesso ao modelo.
- Novo componente `ProviderHealthButton` montado nas abas OpenAI, Claude, Grok, Google Gemini e Perplexity de `ConfiguracoesIATab` — badges OK/Falha/Chave ausente, latência, modelo testado e detalhe do erro HTTP.
- Files: supabase/functions/perplexity-health/index.ts, supabase/functions/provider-health/index.ts, supabase/functions/kg-evidence-gap-fill/index.ts, supabase/config.toml, src/components/administrador/configuracoes/PerplexityStatusCard.tsx, src/components/administrador/configuracoes/ProviderHealthButton.tsx, src/components/administrador/ConfiguracoesIATab.tsx, src/i18n.ts

### Added - 2026-04-29 — Monitor de saúde + aba de API key para Perplexity
<!-- area: admin · status: entregue · i18n: 1.41.6 -->
- Nova edge function `perplexity-health` (verify_jwt) que executa um ping `sonar` ("ping" → "ok", `max_tokens: 5`) e retorna `{ configured, connected, latency_ms, model, checked_at, error? }`. Detecta ausência de `PERPLEXITY_API_KEY`, falhas HTTP do upstream e mede latência real do round-trip.
- Novo componente `PerplexityStatusCard` em Configurações IA: roda o health-check no mount + botão "Testar", mostra badges Conectado/Falha/Não configurado/Verificando com modelo e latência, exibindo `checked_at` formatado.
- `ConfiguracoesIATab`: adicionada aba **Perplexity** (TabsList agora `grid-cols-8`) com `ApiKeyForm` + validador (`pplx-` + ≥ 20 chars) + card explicativo do uso no KG Gap-Fill, novo `ApiStatusItem` ✨ "Perplexity – Sonar Academic – KG Gap-Fill" no painel "Status das Conexões", e `<PerplexityStatusCard />` montado abaixo do Neo4jStatusCard.
- `supabase/config.toml`: registrada `[functions.perplexity-health] verify_jwt = true`.
- Files: supabase/functions/perplexity-health/index.ts, src/components/administrador/configuracoes/PerplexityStatusCard.tsx, src/components/administrador/ConfiguracoesIATab.tsx, supabase/config.toml, src/i18n.ts

### Added - 2026-04-29 — Auto-preview da projeção e arestas provisórias no subgrafo após gap-fill
<!-- area: vet-ui · status: entregue · i18n: 1.41.5 -->
- `EvidenceGapCard`: novo callback `onTripletsAdded(count)` disparado quando o gap-fill (Perplexity → PubMed) retorna `triplets_pending > 0`. Antes o vet precisava ativar manualmente o toggle "Pré-visualizar com pendentes" no Digital Twin para ver o impacto.
- `DigitalTwinDog`: ao receber `onTripletsAdded`, liga `previewPending=true` e invalida `['pet-trajectory-projection', petId]` + `['patient-pending-gap-fill-triplets', petId]` — a projeção é re-fetchada incluindo os triplets recém-importados e o KPI "Ganho com protocolo" reage instantaneamente.
- `usePatientPendingGapFillTriplets`: novo hook que busca triplets `pending` cujo `approval_chain.source ∈ {pubmed_gap_fill, perplexity_gap_fill}` filtrando client-side por compostos do stack OU condições do pet (matching `subject_name`/`object_name`).
- `PatientKnowledgeSubgraph`: aceita `petId` opcional; quando presente, renderiza arestas tracejadas âmbar (`color: #f59e0b`, `dashes: [6,4]`, label com `⏳`) para os triplets provisórios. Adicionados badge `+N provisórios`, legenda dedicada e contador inferior. Hover mostra `[provisional · perplexity_gap_fill] subject predicate object · evidence_level`.
- i18n 1.41.5: novas chaves `petProfile.subgraph.provisionalBadge|provisionalLegend|provisionalCount` em PT/EN.
- Files: src/components/pet/EvidenceGapCard.tsx, src/components/pet/DigitalTwinDog.tsx, src/components/pet/PatientKnowledgeSubgraph.tsx, src/hooks/useKgEvidenceGapFill.ts, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Added - 2026-04-29 — Perplexity-first no Gap-Fill + busca a partir do diálogo de triplets faltantes
<!-- area: kg · status: entregue · i18n: 1.41.4 -->
- `kg-evidence-gap-fill`: nova estratégia em duas passadas — **Perplexity Sonar (academic, json_schema)** primeiro, **PubMed E-utilities + Gemini** como fallback. Perplexity retorna JSON estruturado com `efficacy_0_5`, `evidence_level`, `species_context`, `cited_pmids`, `cited_dois`, `cited_urls`, `llm_confidence`. PMIDs citados pelo Perplexity são **validados via NCBI esummary** antes de virarem `scientific_studies` (anti-alucinação). `source_api` distingue `perplexity_gap_fill` × `pubmed_gap_fill`; `approval_chain` registra `cited_urls` e provider.
- `kg-evidence-gap-fill`: aceita lista direta `pairs: [{ compound_en, condition_en, condition_id? }]` no body, permitindo o `MissingTripletsDialog` mandar exatamente os pares que ele já calculou em vez de o gap-fill recalcular.
- `kg-missing-triplets` + `kg-evidence-gap-fill`: declarados em `supabase/config.toml` (`verify_jwt = true`) — ambos não estavam no toml e por isso não tinham logs no servidor (causa do `Failed to send a request to the Edge Function` no botão "Ver triplets faltantes"). Adicionado log de boot + early-return 500 com mensagem clara se faltar `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
- `MissingTripletsDialog`: novo botão violeta **"Buscar evidências via Perplexity"** que envia até 10 pares faltantes para o gap-fill, mostra resultado inline (pairs/studies/pending) e link direto para `/administrador?tab=triplet-curation`.
- `EvidenceGapCard`: detalhes da última busca agora exibem o provider (`perplexity` × `pubmed`) por par.
- Conector **Perplexity** ligado ao projeto; `PERPLEXITY_API_KEY` disponível em runtime nas edge functions.
- Files: supabase/config.toml, supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/kg-missing-triplets/index.ts, src/components/pet/MissingTripletsDialog.tsx, src/components/pet/EvidenceGapCard.tsx, src/hooks/useKgEvidenceGapFill.ts, src/i18n.ts

### Fixed - 2026-04-29 — Gap-Fill robusto + preview de pendentes + lista de condições no Digital Twin
<!-- area: vet-ui · status: entregue · i18n: 1.41.3 -->
- `kg-evidence-gap-fill`: logging detalhado em todas as etapas (auth, discovery, busca, geração de triplets); shortlist de compounds prioriza o stack recomendado do pet (snapshot `pet_clinical_analysis_snapshots`) antes do fallback geriátrico; busca PubMed em duas passadas (estrita canine → relaxada `unspecified`) com `species_hint` registrado no triplet; CORS/`Cache-Control: no-store` garantidos em todos os retornos.
- `EvidenceGapCard`: toasts diferenciados (sucesso, sem pares, sem triplets, erro) e card inline com breakdown da última busca (pairs/studies/pending + lista por par com status `ok | no_pubmed_results | assessment_failed | error | dry_run` e `species_hint`).
- `project-pet-trajectory`: aceita flag `include_pending_gap_fill` e, quando ativo, inclui triplets `pending` originados de `pubmed_gap_fill` no cálculo de cobertura/years_gained, marcando contribuições como `provisional: true`.
- `usePetTrajectoryProjection`: novo parâmetro `includePending` (entra na queryKey, `staleTime: 0` no modo preview).
- `DigitalTwinDog`: toggle admin-only "Pré-visualizar com pendentes" com banner violeta e sub-rótulo `(provisório)` no KPI de anos ganhos; restaurada a `ConditionsMiniList` sob cada silhueta (severidade + nome + "Novo X%" + "★ protegido"), substituindo a linha "N marcadores".
- i18n: novas chaves `petProfile.digitalTwin.previewPendingToggle/previewPendingBanner/provisional` e `evidenceGap.detailsTitle/detailStatus.*/toastNoPairs/toastNoTriplets` em PT/EN. Bump `I18N_VERSION` 1.41.2 → 1.41.3.
- Files: supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/project-pet-trajectory/index.ts, src/hooks/usePetTrajectoryProjection.ts, src/hooks/useKgEvidenceGapFill.ts, src/components/pet/DigitalTwinDog.tsx, src/components/pet/EvidenceGapCard.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Added - 2026-04-29 — Pipeline KG Evidence Gap-Fill (PubMed → triplets pendentes)
<!-- area: kg · status: entregue · i18n: 1.41.2 -->
- Nova edge function `kg-evidence-gap-fill`: para cada par (composto canônico × condição do pet) sem evidência forte no KG (`approved` com `extraction_confidence ≥ 0.6`), busca o PubMed via NCBI E-utilities (`esearch` + `efetch`), extrai abstracts e usa Gemini (`google/gemini-3-flash-preview`, tool-calling) para gerar `efficacy_0_5`, `evidence_level`, `rationale` e `cited_pmids`.
- Persiste estudos em `scientific_studies` (`source_api='pubmed_gap_fill'`, dedup por `pmid`) e cria triplets em `triplet_extractions` SEMPRE como `curation_status='pending'` (mesmo com alta confiança — protocolo Curation Gatekeeper). `approval_chain` registra `{source: 'pubmed_gap_fill', cited_pmids}` para rastreabilidade.
- Acesso restrito a admin (validação via `getClaims` + `user_roles`). Rate limit serial: 360ms entre chamadas PubMed (110ms se `NCBI_API_KEY` for configurada).
- Novo componente `EvidenceGapCard` integrado ao `DigitalTwinDog`, visível apenas para admin quando `years_gained < 0.3`. Mostra explicação contextual (sem cobertura vs. cobertura sem eficácia ≥ 3), botão de busca, contador de triplets pendentes do gap-fill e link direto para a curadoria.
- Novo hook `useKgEvidenceGapFill` (`useTriggerGapFill` + `usePendingGapFillTriplets`).
- i18n: namespace `evidenceGap.*` em PT/EN. Bump `I18N_VERSION` 1.41.1 → 1.41.2.
- Decisão arquitetural: PubMed direto (não Perplexity) — citações 100% rastreáveis (PMID/DOI), zero novos secrets, custo zero. Perplexity reservado para missões futuras (vigilância de contraindicações, sumários narrativos, raças raras, descoberta exploratória).
- Files: supabase/functions/kg-evidence-gap-fill/index.ts, src/hooks/useKgEvidenceGapFill.ts, src/components/pet/EvidenceGapCard.tsx, src/components/pet/DigitalTwinDog.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Changed - 2026-04-29 — Digital Twin agora compara cenários ao longo dos anos
<!-- area: vet-ui · status: entregue · i18n: 1.41.1 -->
- `DigitalTwinDog` reescrito para consumir `usePetTrajectoryProjection` (mesma fonte do `BiologicalTimeline`): renderiza duas silhuetas lado a lado (Sem protocolo × Com protocolo) e um slider 0–8 anos. Antes só mostrava o estado atual, sem variação temporal nem cenário comparativo.
- Para cada ano projetado, os marcadores anatômicos refletem severidade real (`existing_conditions[].projected_severity_label`), risco emergente (`new_conditions[].probability` ≥ 20% com anel tracejado âmbar) e cobertura do stack (`coverage_by_condition[].kg_covered` → estrela ★ verde no marcador).
- KPIs alinhados com o `BiologicalTimeline`: idade biológica, cronológica, anos restantes e ganho com protocolo (`years_gained` da edge function `project-pet-trajectory`).
- Estados `locked` (sem snapshot Senex AI), `loading` (projeção rodando) e `noKgBenefit` (cobertura zero) mostram banners coerentes com o resto do perfil — nenhuma simulação, nada de mock.
- `PetProfilePage` passa `petId`, `onRequestAnalysis` e `isAnalyzing` para o componente.
- I18N_VERSION 1.41.0 → 1.41.1; novas chaves em `petProfile.digitalTwin.{lockedTitle,lockedBody,aiLoading,newRisk,protected,markersLabel,protectedLabel}` (PT+EN).
- Files: src/components/pet/DigitalTwinDog.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts, src/locales/pt/translation.json, src/locales/en/translation.json

### Added - 2026-04-29 — Testes de inferArea e ordenação real do parser
<!-- area: admin · status: entregue -->
- 17 novos testes em `scripts/__tests__/sync-changelog.test.mjs` cobrindo: prioridade `kg > infra` em `supabase/functions/kg-*`, `triplet`/`process-pdf`/`extract` → `curation`, `biomedical-taxonomy` e qualquer path com `knowledge-graph|neo4j` → `kg`, `base-knowledge` antes de regras genéricas, `i18n` para `src/locales/**` e `src/i18n.ts`, `auth` para `AuthContext`/`pages/Auth`, `projectOrganograma`/`projectChangelog` → `admin`, ordem-importa quando múltiplos paths casam, fallback `meta`
- Testes de ordenação validando: data desc estrita com seções intercaladas (`## [Unreleased]` × `## [1.0.0]`), cabeçalhos `### Added - YYYY-MM-DD 🗺️ Título` (emoji direto, sem separador), múltiplas linhas em branco e bullets indentados, datas duplicadas mantendo entradas distintas, `## [versão]` não confundido com cabeçalho de entrada, fallback para `inferArea` quando metadata não declara área
- **Bugs corrigidos no parser** (descobertos pelos testes):
  - Emoji com variation selector (`🗺️` = `U+1F5FA U+FE0F`) deixava caractere invisível no início do título — regex de limpeza estendida para aceitar `\uFE0F` e sequências ZWJ
  - Bullets indentados (`   - texto`) preservavam o `- ` literal por o strip não tolerar espaços iniciais — `^[-*]` virou `^\s*[-*]`
- Files: scripts/__tests__/sync-changelog.test.mjs, scripts/sync-changelog.mjs

### Added - 2026-04-29 — Testes automatizados do parser do CHANGELOG (vitest)
<!-- area: admin · status: entregue -->
- Setup mínimo de Vitest (`vitest.config.ts`, `src/test/setup.ts`, scripts `test` / `test:watch` em `package.json`) — inclui `scripts/**/*.test.mjs` no glob
- Refactor de `scripts/sync-changelog.mjs`: `parseMetaComment`, `extractFiles`, `inferArea`, `parseChangelog`, `KIND_MAP` e `AREA_RULES` agora são exportados; `main()` só roda quando o script é chamado como CLI (detecção via `import.meta.url` × `process.argv[1]`)
- 22 testes em `scripts/__tests__/sync-changelog.test.mjs` cobrindo: separadores variados (`·`, `,`, `;`, `|`), `commit:` no metadata-comment, captura de paths em prosa/listas/crases, dedup, todas as extensões suportadas, inferência de área por path, ordenação por data, fallback de `status`/`area`, limpeza de ✅/`**`/emoji, hífen e em-dash em cabeçalhos, mapping `deprecated → changed`
- Bug fix descoberto pelos testes: regex de `extractFiles` agora coloca `tsx`/`ts`/`json` antes de `js` e adiciona `(?![a-zA-Z0-9])` no fim — antes `translation.json` era capturado como `translation.js`
- Files: scripts/sync-changelog.mjs, scripts/__tests__/sync-changelog.test.mjs, vitest.config.ts, src/test/setup.ts, package.json

### Added - 2026-04-29 — Mini-timeline por área no Organograma com links de arquivos e commits
<!-- area: admin · status: entregue · i18n: 1.40.0 -->
- Novo `src/components/administrador/organograma/AreaMiniTimeline.tsx`: timeline vertical com bolinhas coloridas por tipo (added=verde, changed=âmbar, fixed=azul, removed=vermelho, security=roxo), expandir/recolher por entrada, filtros toggle por tipo e botão "Ver mais" (3 → 8)
- Cada entrada expandida mostra bullets resumidos (até 3), chips de arquivos (até 8) e — quando presente — chip de commit com hash curto e ícone `GitCommit`
- Arquivos e commits viram links externos quando `REPO_CONFIG.baseUrl` está configurado em `src/data/repoConfig.ts` (default vazio = chips estáticos seguros). Quando o GitHub estiver conectado via Connectors, basta preencher `baseUrl` para ativar todos os links
- Parser `scripts/sync-changelog.mjs` agora reconhece `<!-- commit: <hash> -->` no metadata-comment e propaga para `ChangelogEntry.commit`
- Novo helper `changesByAreaFiltered(area, { sinceDays, limit, kinds })` em `src/data/changelogQuery.ts`
- `OrganogramaCards` substituiu o bloco simples `RecentChanges` pelo novo componente
- i18n v1.40.0
- Files: src/components/administrador/organograma/AreaMiniTimeline.tsx, src/data/repoConfig.ts, src/data/changelogQuery.ts, src/components/administrador/organograma/OrganogramaCards.tsx, scripts/sync-changelog.mjs

### Added - 2026-04-29 — Sincronização automática do CHANGELOG → Organograma + briefing do agente
<!-- area: admin · status: entregue · i18n: 1.39.0 -->
- Novo `scripts/sync-changelog.mjs`: parser determinístico que lê CHANGELOG.md e regenera `src/data/projectChangelog.generated.ts` + `.lovable/CONTEXT.md` + atualiza `organogramaLastUpdated`
- `src/data/projectChangelog.ts` virou shim re-exportando o gerado — fim da dupla manutenção
- Inferência automática de `area` a partir dos arquivos citados (mapa explícito em AREA_RULES); override opcional via comentário `<!-- area: ... -->`
- `.lovable/CONTEXT.md` autogerado com top 10 entradas + contagem por área nas últimas 2 semanas + última versão i18n — agente lê isso no início de cada tarefa
- Novo `src/data/changelogQuery.ts` com helpers `recentChangesByArea`, `findChangesTouching`, `lastI18nVersion`
- Bloco "Recentes nesta área" em `OrganogramaCards` mostra últimas 3 mudanças por área
- Banner "auto-sincronizado" em `ChangelogTimeline`
- Memory rule nova `mem://workflow/changelog-driven-context` (Core): consultar `.lovable/CONTEXT.md` antes de iniciar tarefas e rodar `npm run sync:changelog` ao final
- i18n v1.39.0
- Files: scripts/sync-changelog.mjs, src/data/projectChangelog.ts, src/data/changelogQuery.ts, src/components/administrador/organograma/OrganogramaCards.tsx, src/components/administrador/organograma/ChangelogTimeline.tsx, package.json

### Added - 2026-04-29 🗺️ Organograma do Projeto (admin) — 4 lentes + changelog visual (i18n v1.38.0)
- ✅ **Nova tab `Organograma do Projeto`** em `/administrador?tab=organograma` (grupo Configurações), inspirada na `/admin/organograma` do Sleep Graph RAG
- ✅ **4 lentes complementares**: Grafo (force-graph 2D com áreas como hubs coloridos + componentes como folhas + cross-links com partículas), Diagrama (Mermaid TD/LR com pan/zoom estilo Figma), Cards (árvore expansível por área com busca + ASCII fallback), Changelog (timeline filtrada por área e status)
- ✅ **Single source of truth tipada**: `src/data/projectOrganograma.ts` (10 áreas: auth, curation, kg, base-knowledge, clinical-pipeline, vet-ui, tutor-ui, admin, i18n, infra), `src/data/projectChangelog.ts` (espelho do CHANGELOG visual filtrável), `src/data/organogramaAreaMeta.ts` (ícones + paleta hex por área)
- ✅ **Card Convenções Core** extraído da knowledge base (No-Mock, Bilíngue, Canonical IDs, Curation Gatekeeper, etc.)
- ✅ **Hook `useScrollPanZoom`**: zoom focado no cursor + pan via translate3d + ResizeObserver para re-fit ao trocar de tab
- ✅ **Memory rule nova** (`mem://architecture/organograma-source-of-truth`): protocolo obrigatório de atualização simultânea (organograma + changelog + I18N_VERSION) a cada mudança estrutural — institucionaliza o padrão que tem reduzido erros do agente
- ✅ **Itens da sidebar** agrupados em Configurações com ícone `ListTree`
- ✅ **i18n v1.38.0**: bump de versão para forçar refresh de cache

### Changed - 2026-04-28 ⏱️ Pipeline Clínico com Progresso Real + Console ao Vivo (i18n v1.30.0)
- ✅ **Progresso real por estágio**: `runClinicalAnalysisPipeline` agora aceita um callback `onProgress` que emite eventos `stage-start` / `stage-end` / `log` para cada etapa (predisposições, exames, KG, interações, recomendação). O workflow visual em `ClinicalPipelineWorkflow` deixa de "completar tudo de uma vez" no final — cada estágio acende e apaga conforme realmente termina, com duração medida via `performance.now()`
- ✅ **Novo `ClinicalPipelineLogPanel`**: console ao vivo (estilo digestão científica) renderizado abaixo do workflow na `PetProfilePage`. Mostra timestamp `HH:MM:SS.mmm`, ícone por nível (info/sucesso/aviso/erro), badge do estágio ativo, contador de eventos, autoscroll e ações **Limpar** / **Exportar `.log`**. Limite circular de 200 entradas
- ✅ **Logs informativos por consulta KG**: cada hit/miss no Knowledge Graph agora aparece no console com nome canônico utilizado, contagem de nós e relações — substituindo os `console.log/warn` que só ficavam no devtools
- ✅ **i18n v1.30.0**: novas chaves `petProfile.pipeline.log.{title,eventCount,clear,export,waiting}` em PT/EN

### Added - 2026-04-28 💊 Painel Admin de Curadoria de Doses + i18n v1.28.0
- ✅ **Nova tab admin "Curadoria de Doses"** (`Knowledge Base → Curadoria de Doses`) com 3 visões:
  - **Pendentes**: doses com `needs_review=true` (vindas de web lookup ou estimativas de IA) prontas para edição inline (faixa mg/kg, frequência, fonte, citação, confiança) e aprovação canônica
  - **Curadas**: doses já validadas por especialista
  - **Mais Usadas**: ranking dos pares (composto, condição) mais consultados pelo pipeline (via `dosage_lookup_log`) — guia o esforço de curadoria pelos casos de maior impacto clínico
- ✅ **Selos de proveniência**: badges visuais por origem (Curado / Web Autoritativo / KG Triplet / Estimativa IA / Default) replicando o padrão usado no `CompoundDosageSlider`
- ✅ **Aprovação registra autor + timestamp** em `curated_by` / `curated_at` e remove `needs_review`, tornando a dose canônica para o pipeline
- ✅ **i18n v1.28.0**: bump de versão para refresh de cache

### Fixed - 2026-04-28 🔗 Links de Estudos Persistindo nos Cards
- ✅ **Sincronização do `VetRecommendationPanel`**: os cards de recomendação agora reagem a novas análises/atualizações de `compounds`, evitando ficar presos a um estado inicial sem links de estudos
- ✅ **Fallback de link no frontend**: `CompoundDosageSlider` passou a reconstruir o URL clicável localmente a partir de `link`, `doi`, `pmid` ou título, mesmo se algum card receber payload parcial
- ✅ **i18n v1.26.2**: bump para forçar refresh de cache do navegador após a correção dos cards

### Added - 2026-04-28 🔗 Selo de Fonte do Link + Fallback de Estudos
- ✅ **Selo de proveniência do link**: cada estudo no card mostra um pequeno badge (DOI / PubMed / PMC / Scholar / Externo) derivado da URL final, deixando claro para onde o clique leva
- ✅ **Ícone `ExternalLink` + `aria-label`**: títulos de estudos sinalizam visualmente que abrem em nova aba (`target="_blank" rel="noopener noreferrer"`, sem mudança de comportamento)
- ✅ **Fallback "compound-only" em `attachStudiesToCompounds`**: quando não existe triplet aprovado para o par exato (composto, condição), a pipeline busca até 3 estudos de alta confiança que mencionam o composto sozinho — assim todo card sempre tem referências clicáveis. Esses estudos são sinalizados como "Geral" e o card exibe o aviso "Estudos sobre o composto (não específicos a esta condição)" para preservar transparência clínica
- ✅ **i18n v1.26.1**: novas chaves `petProfile.recommendation.openExternal`, `studiesCompoundOnly` e bloco `linkSource.{doi,pubmed,pmc,scholar,external,generic}`

### Changed - 2026-04-28 🔗 Links Robustos + Evidência Completa Dentro do Card
- ✅ **Links de estudos com fallback robusto**: pipeline agora normaliza `link` (DOI/PubMed/Scholar) antes de devolver — sem mais cliques mortos. DOIs salvos como URL completa não duplicam mais o prefixo
- ✅ **Knowledge Graph dentro de cada card de composto**: `CompoundDosageSlider` ganhou bloco com triplets reais `[composto] → [predicado] → [condição]` (estilo "Embasamento Científico"), incluindo contagem de estudos, evidência e % de confiança — não precisa mais trocar de aba
- ✅ **Sinergias por paciente**: cada card mostra outras condições do pet que o mesmo composto também trata (cruzando `triplet_extractions` aprovados com a lista de condições do paciente)
- ✅ **Abas reduzidas**: removidas "Embasamento Científico" e "Chat por Composto" (este último já vive dentro de cada card via "Discutir esta recomendação"). Restam: **Recomendações** · **Caminho Biológico** · **Projeção de Melhora**
- ✅ **Util compartilhado `predicateStyles.ts`**: cores/símbolos de predicados agora são reutilizados entre `CompoundDosageSlider` e `ScientificEvidencePanel`
- ✅ **i18n v1.26.0**: chaves `knowledgeGraph`, `synergies`, `noKgEvidence`

### Changed - 2026-04-28 🧭 Consolidação de Alertas + Cards com Evidência Profunda
- ✅ **Aba "Alertas Clínicos" removida**: predisposições não-diagnosticadas já aparecem em "Análise Senex AI → Alvos para Prevenção" — fim da duplicação
- ✅ **Reordenação de tabs**: Recomendações (default) → Caminho Biológico → Evidência Científica → Projeção → Chat por Composto
- ✅ **CompoundDosageSlider — bloco "Ver evidências e contexto"**: novo dropdown por card mostrando
  - Mecanismo molecular (mechanism_path da triplet de maior confiança)
  - Estudos científicos (até 3) com link externo (DOI/PubMed) **e trecho destacado** do `study_embeddings.chunk_text` com o nome do composto em `<mark>`
  - Mini-bloco de conexões composto → condição
- ✅ **Backend `attachStudiesToCompounds`**: agora também consulta `study_embeddings` por chunks contendo o composto + condição e retorna `excerpt` + `mechanism`
- ✅ **i18n v1.25.0**: novas chaves `evidenceAndContext`, `mechanism`, `relations`, `targets`, `relationsHint`

### Fixed - 2026-04-28 🩺 Categorias Genéricas → Doenças Específicas
- ✅ **Pets demo**: Luna agora tem `Degenerative Valve Disease (Myxomatous Mitral Valve Disease)` (MMVD — doença real do Cavalier King Charles compatível com sopro 4/6) em vez da categoria genérica "Cardiovascular Disease"
- ✅ **Pets demo**: Thor agora tem `Hip Dysplasia` (já indicada no exame) em vez de "Chronic Inflammation" (categoria, não doença)
- ✅ **Migração de dados**: UPDATE em `pet_conditions` para corrigir registros existentes
- ✅ **Guard-rail `conditionValidation.ts`**: Lista de termos genéricos proibidos + função `warnIfGenericCategory()` que alerta no console se sample/extração tentar gravar uma categoria como doença
- ✅ **i18n v1.23.0**

### Fixed - 2026-04-12 🔬 Taxonomia de Condições: Separação Clínica vs Molecular
- ✅ **Coluna `origin` em pet_conditions**: Rastreamento real de origem (vet_diagnosis, exam_suggested, breed_predisposition, kg_inference) — substituiu inferência por string matching
- ✅ **Dados de exemplo corrigidos**: Removidos "Cellular Senescence", "Inflammaging" e "Inflammation" dos dados seed — processos moleculares agora são inferidos exclusivamente pelo Senex AI
- ✅ **inferOrigin() reescrita**: Lê coluna `origin` do banco em vez de adivinhar pelo nome da condição
- ✅ **Senex AI panel**: Renomeado "Comorbidades Ocultas" → "Processos Biológicos Inferidos" com descrições contextuais explicando a via molecular
- ✅ **Nova badge "kg_inference"**: Processo Biológico Inferido (roxo) distinto de Comorbidade Inferida
- ✅ **i18n v1.22.0**: Novas chaves PT/EN para taxonomia de origem

### Changed - 2026-04-12 📊 Projeção de Melhora Baseada em Evidências Reais
- ✅ **Motor de Projeção Evidence-Based**: Substituído `Math.random()` por cálculo baseado em triplets aprovados do KG (intensidade ponderada × nível de evidência × confiança)
- ✅ **3 camadas de dados**: Knowledge Graph (prioridade) → Hybrid KG+LLM → LLM-only, cada uma com metadados de transparência
- ✅ **Badges de fonte**: Indicadores visuais verde (KG) / amarelo (KG+IA) / vermelho (Apenas IA) no gráfico
- ✅ **Tooltip de evidência**: Mostra N triplets, N estudos, nível de evidência dominante, compostos envolvidos, intensidade média
- ✅ **Alerta de lacunas**: Sugere curadoria de mais estudos quando dados insuficientes para uma condição
- ✅ **Confiança calibrada**: Banda de confiança derivada do desvio padrão real das confidences dos triplets
- ✅ **i18n v1.21.0**: Novas chaves PT/EN para transparência de projeções

### Added - 2026-03-31 🏥 Integração SNOMED-CT VetSCT + UMLS com Auditoria e Deduplicação
- ✅ **Edge Function `fetch-external-ontologies`**: Novas funções `searchUMLS()` e `searchSNOMED()` com fallback graceful (retorna vazio se API key ausente)
- ✅ **Ontology Mapping Service** (`src/services/ontology-mapping-service.ts`): Serviço completo com `searchStandardMappings`, `checkDuplicateMapping`, `saveMapping`, `batchMapUnmapped`, `getMappingStats`, `checkApiStatus`
- ✅ **OntologyMappingTab admin UI**: Dashboard com tabela de entidades, filtros (All/Mapped/Unmapped), toggle health_conditions/nutraceuticals, auto-map com preview obrigatório, busca manual UMLS inline, alertas de deduplicação, badge de status API
- ✅ **Pipeline de curadoria enriquecido**: `useApproveCandidate` propaga `snomed_code`, `umls_cui` e metadados de auditoria para tabelas destino com verificação de duplicatas
- ✅ **Auditoria completa**: Cada mapeamento registra quem mapeou, quando, de qual fonte e com qual método
- ✅ **i18n v1.20.0**: 50+ chaves PT/EN para mapeamento de ontologia

### Added - 2026-03-30 🏷️ Separação Clara: Dados Clínicos vs Análise Senex AI
- ✅ **ConditionInsightCard modo "simple"**: Tab Conditions mostra apenas dados clínicos puros (nome, severidade, status) sem KG
- ✅ **Badges de origem**: 🩺 Diagnóstico Veterinário, 🧪 Sugerida por Exames, 🧬 Predisposição Racial, 🔬 Comorbidade Inferida
- ✅ **Análise por Condição (pós-Senex AI)**: ComorbidityMap + ConditionInsightCards completos movidos para após análise
- ✅ **i18n v1.19.0**: Novas chaves PT/EN para badges de origem e seção de análise

### Added - 2026-03-30 🧠 Reorganização do Perfil do Pet — Separação Dados vs Análise Senex AI
- ✅ **Senex AIInsightsPanel**: Novo painel de 3 seções (Condições Atuais, Comorbidades Ocultas, Prevenção Futura)
- ✅ **PatientKnowledgeSubgraph**: Subgrafo interativo do KG utilizado nas recomendações do paciente
- ✅ **Inferência de gerociência**: Detecção automática de comorbidades ocultas via KG
- ✅ **Razões de inferência**: Cada insight mostra "por que inferimos isso"
- ✅ **i18n completo**: Chaves PT/EN para novos componentes

### Added - 2026-03-12 📊 Gráfico de Progressão por Condição na Proposta do Tutor
- ✅ **ConditionProgressionChart**: Gráfico AreaChart com duas curvas — "Com Tratamento" (melhora sigmoide) vs "Sem Tratamento" (declínio gradual) por condição
- ✅ **Dropdown de condições**: Quando há múltiplas condições, dropdown permite selecionar qual visualizar
- ✅ **Pontos de calibração**: Exames de baseline (M0) e calibração (M11) destacados com ReferenceDot/ReferenceLine
- ✅ **Badges de projeção**: Exibe baseline, projeção com e sem tratamento como badges informativos
- ✅ **i18n completo**: 13 novas chaves PT/EN para o gráfico de progressão

### Added - 2026-03-12 🚀 Owner Portal Enriquecido — Proposta Rica + Chat IA + Timeline + Exames
- ✅ **Filtro de pets por propostas**: Owner Portal agora mostra apenas pets que possuem propostas de tratamento
- ✅ **Pathways Biológicos na proposta**: Visualização simplificada Composto → Mecanismo → Efeito → Resultado para o tutor
- ✅ **Triplets-chave como frases legíveis**: Top 5 relações científicas exibidas como "Curcumina TRATA Artrite — 87% confiança"
- ✅ **Timeline de Tratamento 12 meses**: Adaptação → Primeiros Efeitos → Melhora Mensurável → Consolidação → Reavaliação
- ✅ **Cronograma de Exames Periódicos**: Marcadores inflamatórios (3m), painel hepático/renal (6m), reavaliação completa (12m)
- ✅ **Chat IA contextualizado para tutores**: ProposalAIChat com system prompt incluindo pet, condições, compostos e pathways — sugestões rápidas de perguntas
- ✅ **handleApproveStack enriquecido**: Agora salva biological_pathways, key_triplets, treatment_timeline, periodic_exams, predispositions, lab_alerts no scientific_summary JSONB
- ✅ **i18n expandido**: ~30 novas chaves PT/EN para pathways, timeline, exames e chat

### Added - 2026-03-12 📋 Proposta de Tratamento para o Tutor (Owner Portal)
- ✅ **Nova tabela `treatment_proposals`**: Armazena propostas geradas na aprovação do stack pelo veterinário (pet_id, compounds, conditions, scientific_summary, pricing, status)
- ✅ **`TreatmentProposalCard`**: Componente bilíngue com seções: Gerociência, Condições, Evidência Científica (triplets/studies/KG coverage), Compostos, Aprovação Veterinária, Programa Vivo, Preço (R$105-270/mês)
- ✅ **Geração automática de proposta**: `handleApproveStack` em PetProfilePage agora insere proposta no banco com dados clínicos snapshot, preço calculado por complexidade
- ✅ **Tab "Propostas" no Owner Portal**: TutorPage exibe propostas pendentes com badge de contagem, aceite com atualização de status
- ✅ **i18n completo**: ~35 novas chaves PT/EN para toda a feature de propostas

### Fixed - 2026-03-12 🐛 Recomendações Genéricas → Individualizadas (Root Cause Fix)
- ✅ **Canonicalização de condições**: Mapa de nomes clínicos → nomes canônicos do KG (ex: "Heart Disease" → "Cardiovascular Disease", "CDS" → "Cognitive Dysfunction Syndrome") com fallback progressivo
- ✅ **graph-rag-search resiliente**: Escape de caracteres regex em nomes de condições + fallback `CONTAINS` case-insensitive no Cypher
- ✅ **hybrid-recommendation enrich mode**: Agora retorna `nutraceuticals[]` estruturado (antes retornava só texto, causando lista vazia → fallback mock)
- ✅ **Remoção total de mock estático**: `generateMockCompounds()` não é mais usado como fallback — se KG retorna 0, LLM gera recomendação individualizada
- ✅ **Migração de dados existentes**: `pet_conditions` atualizados para nomes canônicos ("Heart Disease" → "Cardiovascular Disease", etc.)
- ✅ **GenerateSamplePetsButton**: Novos pets agora usam nomes canônicos alinhados ao grafo


### Added - 2026-03-12 🔬 Recomendações Individualizadas + Descobertas Clínicas
- ✅ **`generateClinicalDiscoveries()`**: Função que cruza predisposições raciais, exames, medicações e condições para identificar padrões clínicos não-óbvios (correlações lab-condição, monitoramento medicamentoso, confirmação por exames, oportunidades terapêuticas)
- ✅ **`prioritizeCompoundsByLabFindings()`**: Re-ranqueamento de compostos recomendados com base em achados laboratoriais específicos do paciente (inflamação → anti-inflamatórios, estresse oxidativo → antioxidantes, etc.)
- ✅ **Seção "Descobertas Clínicas" no ClinicalAlertsPanel**: Cards categorizados por severidade (critical/warning/info) mostrando correlações lab-condição, alertas de monitoramento medicamentoso, confirmações breed-lab e oportunidades de compostos
- ✅ **Dados clínicos enriquecidos para 5 pets demo**: Rex (Painel Geriátrico + Inflamatório + Estresse Oxidativo), Luna (Biomarcadores Cardíacos + Renal), Mel (Tireoide + Rim + Fígado), Max (Neurocognitivo + Inflamatório), Thor (Metabólico + Líquido Sinovial)

### Changed - 2026-03-12 🎯 Edge Function hybrid-recommendation individualizada
- ✅ **`clinicalContext` agora aceito e usado**: Interface ampliada para receber allConditions, labAlerts, currentMedications, examSummary — injetados nos prompts do LLM
- ✅ **Prompts individualizados**: System prompts ENRICH e FALLBACK agora exigem recomendações específicas ao paciente (baseadas em labs, meds, breed)
- ✅ **Mapeamento compound→condition corrigido**: Cada composto agora mapeia para sua condição específica em vez de todos para a primaryCondition
- ✅ **Deduplicação**: Compostos já prescritos como medicação são filtrados; compostos duplicados do KG são removidos

### Added - 2026-03-12 🔬 Diagnóstico Clínico Profundo com Conexões Inter-Condições
- ✅ **Edge function `condition-insights`**: Consulta `triplet_extractions` para tratamentos (TREATS/PREVENTS), caminhos causais (CAUSES/AGGRAVATES/LEADS_TO), mecanismos (HAS_MECHANISM) e compostos sinérgicos por condição
- ✅ **`ConditionInsightCard`**: Card expansível por condição mostrando tratamentos do KG com confidence, conexões causais, mecanismos biológicos e medicações vinculadas
- ✅ **`ComorbidityMap`**: Mapa visual de comorbidades mostrando caminhos inter-condições e compostos sinérgicos (nutracêuticos que tratam 2+ condições simultaneamente)
- ✅ **`useConditionInsights` hook**: Query reativa que chama a edge function automaticamente quando condições estão disponíveis
- ✅ **Substituição da lista plana de condições**: Tab "Condições" no perfil do pet agora exibe cards inteligentes em vez de linhas simples
- ✅ **i18n completo**: 30+ novas chaves em PT/EN para toda a interface de insights

### Changed - 2026-03-12 🧹 Auditoria e Limpeza do Sistema (Fases 1–4)
- ✅ **Fase 1 — Código morto removido**: `active-ingredients-service.ts`, `nutraceutical-outcomes-service.ts`, `scientific-studies-service.ts`, `useSenex AIProcessing.tsx`, `useSenex AIProcessingLegacy.ts`, aggregador `nutraceuticals/index.ts`
- ✅ **Fase 2 — Simulações perigosas eliminadas**: `ntai/simulation.ts` (Math.random) removido; `vetgraphrag-service.ts` reescrito para usar edge function `process-study`; `openai.ts` reescrito para usar edge function `chat` via Lovable AI (sem mais respostas hardcoded)
- ✅ **Fase 3 — Duplicações consolidadas**: `examEnhancer.ts` refatorado para consultar `lab_reference_ranges` do banco em vez de valores hardcoded locais
- ✅ **Fase 4 — Páginas conectadas a dados reais**: `RecommendationsList.tsx` e `TutorPage.tsx` migrados de mock (`@/data`) para queries reais (`pet_profiles`, `recommendation_logs`); `useNutraceuticalsData.ts` sem mais fallback mock

### Added - 2026-03-12 🌐 Full Bilingual System + Clinical Reasoning + Inline Compound Chat
- ✅ **Evidence levels i18n**: All 7 levels ("Very High" → "Very Low") + recommendation strengths now use i18n keys
- ✅ **Bilingual tags**: `NutraceuticalTag`, `ConditionTag`, `EvidenceTag`, `PredispositionTag` all translated
- ✅ **Bilingual mock compounds**: `generateMockCompounds()` uses `t()` for names, conditions, rationales (EN/PT)
- ✅ **`ScientificScoreIndex` & `EvidenceLegend`**: Fully translated with i18n keys
- ✅ **Clinical Reasoning section**: `ConditionInsightCard` now shows *why* a condition is relevant (age, breed, causal connections)
- ✅ **Suggested Pre-Treatment Exams**: 26 exam types mapped to conditions (Inflammatory Markers, Telomere Length, etc.)
- ✅ **Inline Compound Chat**: Each compound in `CompoundDosageSlider` has a collapsible "Discuss this recommendation" chat with biological pathway awareness
- ✅ **`PredispositionTag` bilingual**: Accepts `conditionNameEn` prop, displays based on active language
- ✅ **~80 new translation keys** added to EN/PT locale files


### Changed - 2026-03-12 🔗 Unificação Relations ← Knowledge Graph
- ✅ **useSankeyData reescrito**: Agora consulta `hierarchical_edges` via RPC (`get_relations_graph_data`) em vez de tabelas legadas manuais
- ✅ **DB function criada**: `get_relations_graph_data(p_limit)` faz JOIN com `triplet_extractions` para resolver nomes de entidades
- ✅ **Cores sincronizadas com KG**: 9 tipos de entidade com cores do Knowledge Graph 3D (Nutraceutical=verde, Condition=laranja, etc.)
- ✅ **Links simulados removidos**: `relations/utils.ts` não gera mais conexões falsas (extraLinks)
- ✅ **Filtros por tipo de entidade**: Novo filtro por `source_type`/`target_type` no header
- ✅ **Filtros por predicado real**: `TREATS`, `INHIBITS`, `ACTIVATES`, etc. em vez dos 3 tipos legados
- ✅ **Badge de status**: Header mostra contagem de nodes/edges e fonte "Knowledge Graph"


### Changed - 2026-03-11 📋 Reformulação do Import History
- ✅ **Coluna `duplicate_check_log`**: Nova coluna JSONB em `processed_studies` para log de verificação
- ✅ **Log persistido no upload**: Resultado da verificação salvo automaticamente ao importar
- ✅ **HistoryTab reformulado**: Importações com estudos expandíveis, datas formatadas, ícones de duplicidade
- ✅ **Correção formatDate**: Removido hardcoded "há menos de um dia", usa `date-fns`

### Added - 2026-03-11 🔍 Detecção de Estudos Duplicados no Upload
- ✅ **Hash SHA-256**: Cálculo de hash do arquivo via Web Crypto API para detecção exata de duplicatas
- ✅ **Similaridade de nome**: Levenshtein distance para detectar nomes similares (threshold 75%)
- ✅ **Coluna `content_hash`**: Nova coluna na tabela `processed_studies` para armazenar hash
- ✅ **Alertas inline**: Componente `DuplicateAlert` com alertas visuais (🔴 exato / 🟡 similar)
- ✅ **Opções do usuário**: Remover da fila ou importar mesmo assim (dismiss alerta)
- ✅ **Hash salvo**: Hash SHA-256 salvo no registro para futuras verificações

### Changed - 2026-03-11 📊 Stats filtradas por estudo + Remoção Enrich
- ✅ **Stats de triplets filtradas por estudo**: Hook `useKnowledgeGraphStats` agora aceita `studyId` opcional e filtra contagens de pending/approved por estudo selecionado
- ✅ **Banner de estudo selecionado**: Indicador visual nos stats cards mostrando qual estudo está filtrado, com botão X para limpar
- ✅ **Subtítulo contextual**: `KGExtractedKnowledgeRow` mostra nome do estudo filtrado no subtítulo
- ✅ **Remoção do Enrich with Studies**: Removido botão, dialog e imports do `EnrichKnowledgeGraphDialog`


### Added - 2026-03-11 🏦 Banco de Triplets + Review Enriquecido

- ✅ **TripletBankDialog**: Novo dialog centralizado com 3 abas (Pendentes/Aprovados/Rejeitados), busca, contadores e botão "Revisar" em cada triplet
- ✅ **TripletReviewDialog enriquecido**: Dialog de revisão com 3 abas internas (Detalhes, Fonte, Chat) — source excerpts do estudo original, TripletInlineChat contextual, metadados expandidos (intensity, evidence_level, dose_range, mechanism_path, KG Match, LLM Confidence, hallucination_flag)
- ✅ **Disclaimer visual fonte interna vs externa**: Badges "📄 Fonte interna" e "⚠️ Conhecimento externo IA" para distinguir origens
- ✅ **Revert de status**: Botão para reverter triplets aprovados/rejeitados de volta para pendente
- ✅ **Integração KG Stats**: Clique em "Triplets Aprovados" ou "Triplets Pendentes" nos stats agora abre o TripletBankDialog
- ✅ **Traduções PT/EN**: ~40 novas chaves para tripletReview e tripletBank

### Added - 2026-03-11 🔍 Auditor Conversacional sobre Relações e Conexões

- ✅ **Auditor Conversacional**: Nova aba "Auditor" na tab Relações com chat de IA (gemini-2.5-pro) para interrogar o banco de dados sobre relações nutracêutico-condição, identificar inconsistências e validar premissas
- ✅ **Diagramas Mermaid Inline**: Componente reutilizável `MermaidBlock` que renderiza diagramas Mermaid como SVG inline nas respostas do chat — disponível para uso em qualquer chat futuro
- ✅ **Edge Function dedicada**: `relations-auditor` com system prompt especializado e contexto profundo (relações, predisposições, triplets, estudos)
- ✅ **Contexto profundo do banco**: Carrega automaticamente nutraceutical_conditions, breed_predispositions, triplet_extractions e nutraceutical_studies como contexto para o LLM
- ✅ **Traduções PT/EN**: ~20 novas chaves para o auditor conversacional


### Added - 2026-03-10 🏗️ Governança de Entidades Base + Pipeline Visual

- ✅ **Raças & Predisposições (Admin)**: Nova aba `BreedsManagementTab` com CRUD de raças, painel expandível de predisposições por raça vinculadas a `health_conditions`, filtro por porte e busca
- ✅ **Referências Laboratoriais (Admin)**: Nova aba `LabReferencesTab` com CRUD inline de intervalos de referência (test_name, min/max, age_group, clinical_significance)
- ✅ **Pipeline Visual de 6 Etapas**: Componente `ClinicalPipelineWorkflow` com stepper visual mostrando progresso da análise em tempo real (perfil → predisposições → exames → KG → interações → recomendação)
- ✅ **Sidebar atualizado**: Novos links "Raças & Predisposições", "Referências Lab" e "Dados Base" no grupo Base de Conhecimento
- ✅ **Traduções PT/EN**: ~60 novas chaves para breeds, labReferences e pipeline

### Added - 2026-03-10 🏥 Motor de Decisão Clínica Completo (6 Etapas)

- ✅ **Pipeline de Análise Clínica**: Novo serviço `clinical-analysis-pipeline.ts` com 6 etapas de análise individualizada (perfil → predisposições → exames → KG → interações → recomendação híbrida)
- ✅ **Tabela `lab_reference_ranges`**: 31 intervalos de referência laboratorial caninos (hematologia, bioquímica hepática/renal, metabólico, endócrino, inflamatório, urinálise) com ranges específicos para seniores
- ✅ **Seed `breed_predispositions`**: 45 predisposições raciais para 13 raças caninas populares com risk_factor e evidence_grade baseados em dados OFA/OMIA
- ✅ **ClinicalAlertsPanel**: Nova aba "Alertas Clínicos" mostrando predisposições raciais (diagnosticadas vs não), exames fora de faixa e interações medicamentosas
- ✅ **Treatability com dados reais**: Scores agora usam triplets do KG quando disponíveis em vez de `Math.random()`
- ✅ **Card de alertas no header**: Novo card de contagem de alertas aparece após análise quando há achados
- ✅ **Contexto clínico enriquecido**: LLM agora recebe predisposições, labs e medicações no prompt para recomendações individualizadas

### Fixed - 2026-03-10

- 🔧 **Build errors**: Substituídos `process.env.NODE_ENV` por `import.meta.env.DEV` e `NodeJS.Timeout` por `ReturnType<typeof setTimeout>` em 7 arquivos


### Added - 2026-02-27 🐾 Imagens de Raça, Condições KG-Aligned e Painéis de Evidência Científica

- ✅ **Imagens de raça nos cards**: `PetProfileCard` e `PetProfilePage` agora exibem foto real da raça do pet (Labrador, Cavalier, German Shepherd, Golden Retriever, Beagle) com fallback para ícone de pata
- ✅ **Condições alinhadas ao KG**: Pets de exemplo atualizados com condições que possuem cobertura real no Knowledge Graph (Osteoarthritis, Cardiovascular Disease, Cognitive Decline, Inflammation, Cellular Senescence, Aging)
- ✅ **ScientificEvidencePanel**: Novo componente exibindo triplets TREATS/PREVENTS/ALLEVIATES do KG com sujeito → predicado → objeto, contagem de estudos e score de confiança
- ✅ **BiologicalPathway**: Novo componente com diagrama vertical L0→L2→L3→L4 mostrando Composto → Mecanismo → Efeito → Resultado Clínico
- ✅ **ImprovementProjectionChart**: Gráfico de projeção de melhora ao longo de 12 meses com curva sigmoide e faixas de confiança (Recharts AreaChart)
- ✅ **Integração real KG→Painéis**: `handleAnalyzeWithKG` agora extrai triplets, pathways e projeções dos resultados do graph-rag-search e passa aos novos componentes
- ✅ **Dados mock enriquecidos**: Botão "Gerar Dados de Exemplo" agora também popula os painéis de evidência, pathway e projeção
- ✅ **i18n v1.9.80**: Novas chaves `petProfile.evidence.*`, `petProfile.pathway.*`, `petProfile.projection.*` em PT e EN

### Added - 2026-02-26 🩺 Painel de Recomendações Veterinárias com Sliders de Dosagem

- ✅ **CompoundDosageSlider**: Novo componente com slider interativo mostrando dose mín/máx/recomendada, badge de nível de evidência (KG-backed, AI-suggested, clinical-experience), rationale, e botão para remover/restaurar composto
- ✅ **VetRecommendationPanel**: Painel completo com stack geroprotetor, badge de confiança, botões Aprovar/Aprovar com Modificações/Rejeitar, disclaimer de validação veterinária
- ✅ **TreatabilityChart**: Gráfico de barras horizontais (Recharts) comparando Evidência Científica vs Experiência do Plano para cada condição do pet
- ✅ **PetProfilePage reestruturada**: Layout vertical com Gráfico de Tratabilidade → Stack Geroprotetor → Tabs clínicas (2/3) + Chat Clínico sidebar (1/3)
- ✅ **Botão "Gerar Dados de Exemplo"**: Gera stack mockado com 5 compostos (Curcumina, NMN, Resveratrol, Ômega-3, Rapamicina) para demonstração
- ✅ **i18n**: Novas chaves bilíngues em `petProfile.recommendation.*` e `petProfile.treatability.*`

### Added - 2026-02-25 🔧 Enrich Triplets + Inline Chat + Fix Generate Pipeline

- ✅ **Toast duplicado removido**: `useStudyApprovalWorkflow` não dispara mais toast redundante (mantido apenas no dialog)
- ✅ **Fix generate-triplets**: `intensity` agora usa `??` em vez de `||` (valor 0 não vira null), `confidence_rationale` é salvo no banco, `properties` e campos-chave são `required` no tool schema, `intensity` marcado como REQUIRED no prompt
- ✅ **Edge function `enrich-triplet`**: Enriquece triplets antigos com N/A via LLM — busca chunks relevantes, extrai evidence_level, intensity e rationale, atualiza o banco
- ✅ **Botão "Enriquecer com IA"**: Aparece nos details expandidos quando evidence_level ou intensity estão null
- ✅ **TripletInlineChat**: Mini-chat inline dentro do card expandido — pergunta pré-populada enviada automaticamente ao abrir, suporta follow-ups, renderiza markdown
- ✅ **i18n**: Novas chaves para enrichWithAI, enriching, enrichSuccess, enrichError, inlineChat (title, placeholder, thinking, noResponse, error)

### Added - 2026-02-25 📄 Trecho de Origem nos Triplets + Threshold Unificado

- ✅ **Trecho de Origem nos Details expandidos**: Ao expandir um triplet, o sistema busca automaticamente chunks do `study_embeddings` que mencionam o subject/object, exibindo o trecho científico original para suporte à decisão do revisor
- ✅ **Botão "Perguntar à IA"**: Link direto para a tab de Chat do estudo com pergunta pré-formulada sobre a relação do triplet
- ✅ **Cache local de chunks**: Chunks buscados são cacheados em memória (useRef) para evitar queries repetidas ao expandir/colapsar
- ✅ **Threshold de aprovação unificado**: O threshold hardcoded de 0.7 em `useStudyApprovalWorkflow` e `EstudoDetailDialog` foi parametrizado — agora usa slider configurável (50-99%, default 70%) no dialog de confirmação
- ✅ **Preview dinâmico**: O painel de confirmação de aprovação recalcula "Will auto-approve" em tempo real conforme o slider é ajustado
- ✅ **i18n**: Novas chaves bilíngues para sourceExcerpt, viewInStudy, askAI, noSourceAvailable, loadingSource

### Changed - 2026-02-25 🔬 Reorganização do Pipeline de Estudos Científicos

- ✅ **Rename para "Scientific Studies Digestion"**: Título e descrição refletem o pipeline completo de digestão
- ✅ **Pipeline linear unificado**: Library → Upload PDFs → AI Processing → Curation (kanban) — tudo em uma única seção
- ✅ **Kanban integrado como 4ª aba**: Curadoria movida de tab separada para dentro do fluxo sequencial
- ✅ **"Imports" movido para dialog**: Histórico de importações acessível via botão discreto no header, fora do fluxo principal
- ✅ **EstudosTab simplificado**: Removidas abas superiores redundantes ("Import & Process" / "Manage Studies")
- ✅ **Warning de curadoria**: Card verde de sucesso substituído por alerta âmbar informando que estudo não será incorporado ao Senex AI sem curadoria
- ✅ **i18n completo em NtaiProcessCard**: ~15 textos hardcoded em português migrados para sistema de tradução bilíngue
- ✅ **Correção de namespace i18n**: `studies.ntai.*` corrigido para `studies.vetgraphrag.*` (namespace correto)

### Fixed - 2026-02-25 🧠 Correção crítica da vetorização

- ✅ **Compatibilidade de dimensão restaurada no `vectorize-study`**: embeddings agora são solicitados com `outputDimensionality: 768` para compatibilidade com `study_embeddings.embedding` (`vector(768)`)
- ✅ **Guard rail para drift de modelo**: quando a API retornar dimensão inesperada, o vetor é ajustado para 768 antes do upsert, evitando erro 500
- ✅ **Diagnóstico de erro melhorado**: respostas 500 agora propagam `message` de erros do banco ao invés de retornar apenas "Vectorization failed"

### Added - 2026-02-08 🔐 Sistema de Acesso com Google OAuth + Aprovação de Admin

- ✅ **Google OAuth**: Login via Google configurado com Lovable Cloud
- ✅ **Acesso automático @stanford.edu**: Emails Stanford recebem role 'user' instantaneamente
- ✅ **Fila de aprovação @gmail.com**: Emails Gmail criam solicitação pendente para admin
- ✅ **Tabela `access_requests`**: Controle de solicitações com status pending/approved/rejected, RLS segura
- ✅ **Função `approve_access_request`**: Security Definer que cria role + perfil automaticamente
- ✅ **Badge no Header**: Notificação em tempo real com contagem de solicitações pendentes para admins
- ✅ **Painel de Aprovação**: Nova tab "Solicitações de Acesso" no admin com tabs Pendentes/Aprovadas/Rejeitadas
- ✅ **Tela "Acesso Pendente"**: Página para usuários aguardando aprovação com verificação de status
- ✅ **Tela "Acesso Rejeitado"**: Página para usuários rejeitados com motivo da rejeição
- ✅ **Realtime**: Tabela `access_requests` com realtime habilitado para atualização automática
- ✅ **i18n completo**: Todas as chaves de tradução em PT e EN
- ✅ **Header atualizado**: Exibe `full_name` do perfil/metadata Google com avatar

### Added - 2025-12-27 📊 Reorganização das Estatísticas do Knowledge Graph

- ✅ **Nova estrutura em 3 linhas temáticas**:
  - **Base de Conhecimento** (azul): Ontologia Manual, ChEBI, Nutracêuticos, Condições, Desfechos, Pathways
  - **Conhecimento Extraído (AI)** (verde): Entidades AI, Relações AI, Estudos Ativos, Triplets Aprovados/Pendentes
  - **Estrutura do Grafo (Neo4j)** (cinza): Total Nós, Total Relações, Positivas, Negativas + badges de cobertura
- ✅ **Hook `useKnowledgeGraphStats`**: Busca centralizada de estatísticas categorizadas
- ✅ **Componentes modulares**: `KGBaseKnowledgeRow`, `KGExtractedKnowledgeRow`, `KGGraphStructureRow`
- ✅ **Indicadores de cobertura**: Percentual de nutracêuticos/condições com relações no grafo
- ✅ **Subtotais por seção**: Totais parciais para cada categoria de conhecimento
- ✅ **i18n bilíngue**: Chaves `knowledgeGraph.statsSection.*` em PT e EN

### Fixed - 2025-12-27 🛡️ Correção Crítica: Soft Delete + Recuperação de Estudos

- ✅ **Recuperados 6 estudos "Approved"** que foram deletados acidentalmente
- ✅ **Implementado Soft Delete**: Colunas `deleted_at` e `deleted_by` em `processed_studies`
- ✅ **Tabela de Auditoria**: `study_audit_logs` para rastrear todas as operações de delete/restore
- ✅ **Modal de Confirmação Seguro**: Para delete em massa exige digitar "DELETE" e bloqueia estudos "Approved"
- ✅ **Hook `useStudyDeletion`**: `softDeleteStudy()`, `softDeleteMultiple()`, `restoreStudies()`, `previewDeletion()`
- ✅ **Componente `BulkDeleteConfirmDialog`**: Lista estudos afetados, destaca aprovados, exige confirmação tipada
- ✅ **Causa do bug identificada**: `handleDeleteStudies` usava `selectedItems` global que podia conter IDs de outras colunas

### Fixed - 2025-12-27 🔧 Correção de Tradução NTAI → Senex AI

- ✅ **Corrigido problema de chaves de tradução literais** - 8 componentes atualizados para usar `studies.vetgraphrag.*` ao invés de `studies.ntai.*`
- ✅ Arquivos corrigidos: `NtaiActiveProcessingCard.tsx`, `NtaiAnalysisResults.tsx`, `NtaiProcessingSection.tsx`, `NtaiProcessingLog.tsx`, `NtaiTripletsStatsTab.tsx`, `NtaiStudySelectionTable.tsx`
- ✅ **i18n version**: Incrementado para 1.9.30 para forçar atualização de cache

### Added - 2025-12-24 🎯 Sistema de Confidence Scoring + Fallback Híbrido LLM

- ✅ **Tipos TypeScript** (`src/types/recommendation-confidence.ts`):
  - `RecommendationConfidence` com métricas overall, kgCoverage, evidenceQuality, dataFreshness
  - `KGCoverageMetrics`, `EvidenceQualityMetrics`, `DataFreshnessMetrics`
  - `ConfidenceLevel`: 'high' | 'medium' | 'low' | 'insufficient'
  - `HybridRecommendationResult` para orquestração de recomendações
  
- ✅ **Serviços de Confiança** (`src/services/recommendation-confidence-service.ts`):
  - `calculateKGCoverage()` - Avalia cobertura do Knowledge Graph
  - `calculateEvidenceQuality()` - Avalia qualidade das evidências científicas
  - `calculateDataFreshness()` - Avalia recência dos estudos
  - `computeRecommendationConfidence()` - Combina métricas em score final
  
- ✅ **Serviço Híbrido** (`src/services/hybrid-recommendation-service.ts`):
  - `getHybridRecommendation()` - Orquestra recomendações com fallback
  - `useHybridRecommendation()` - Hook React Query para uso em componentes
  - Fallback automático para Lovable AI (Gemini 2.5 Flash) quando KG insuficiente
  
- ✅ **Edge Functions**:
  - `calculate-recommendation-confidence` - Calcula confiança via API
  - `hybrid-recommendation` - Enriquecimento e fallback LLM com prompts especializados
  
- ✅ **Componentes UI**:
  - `ConfidenceIndicator` - Badge colorido com tooltip de breakdown (verde/amarelo/laranja/vermelho)
  - `RecommendationDisclaimer` - Banners de aviso por nível de confiança
  - Integração no `RecommendationCardContainer`
  
- ✅ **Tabela `recommendation_logs`**:
  - Campos de confiança: `confidence_overall`, `confidence_level`, `kg_coverage_score`, `evidence_quality_score`
  - Rastreamento de fonte: `recommendation_source`, `triplets_used`, `studies_referenced`
  - Loop de feedback: `veterinarian_reviewed`, `outcome_rating`
  
- ✅ **Traduções PT/EN** para chaves `confidence.*` e `disclaimer.*`
- ✅ **i18n version**: Incrementado para 1.9.28

### Added - 2025-12-24 📚 Fase 4: Documentação Senex AI Enriquecida

- ✅ **Novas Referências Científicas** no TabInfo da tab "Estudos":
  - AgeXtend (Ahuja et al., Nature Aging 2024) - Plataforma AI para predição de geroprotetores
  - Dog Aging Project (Creevy et al., GeroScience 2022) - Maior estudo longitudinal canino
  - TRIAD Study (Kaeberlein et al., GeroScience 2025) - Ensaio clínico de rapamicina em cães
  - PrimeKG (Chandak et al., Nature Sci Data 2023) - Knowledge Graph de medicina de precisão
  - Canine Cognitive Nutraceuticals (Yarborough et al., 2025) - Revisão de nutracêuticos cognitivos
- ✅ **Roadmap Arquitetural de 4 Fases** adicionado à metodologia:
  - Fase 1: Knowledge Base (Senex AI) - Implementado
  - Fase 2: Patient System - Planejado
  - Fase 3: Recommendation Engine - Planejado
  - Fase 4: Longitudinal Follow-up - Planejado
- ✅ **Component Links** com links internos para componentes e edge functions
- ✅ **Objetivo atualizado** com foco em LONGEVIDADE CANINA e recomendação de geroprotetores
- ✅ **Botão renomeado** para "ℹ️ About Senex AI" na tab estudos

### Changed - 2025-12-24 🔄 Renomeação NTAI → Senex AI

- ✅ **Renomeação completa** de NTAI para Senex AI em todo o código
  - Tipos: `ntai.ts` → `vetgraphrag.ts` (com aliases de compatibilidade)
  - Hooks: `useNtaiProcessing` → `useSenex AIProcessing`
  - Serviços: `ntai-service.ts` → `vetgraphrag-service.ts`
  - Traduções: chave `ntai` → `vetgraphrag` em PT e EN
- ✅ **i18n version**: Incrementado para 1.9.27

### Added - 2025-12-03 📋 Sistema de Decisões Técnicas

- ✅ **Criado `docs/TECHNICAL_DECISIONS.md`** - Documento central de decisões técnicas obrigatórias
  - Seção de LLM & AI com modelos obrigatórios
  - Seção de Database & Backend com estrutura hierárquica
  - Seção de Internacionalização com processo i18n
  - Seção de Design & UI com regras de estilização
  - Seção "O Que NUNCA Fazer" com proibições claras
  - Histórico de decisões para rastreabilidade

### Changed - 2025-12-03 🤖 Migração para Gemini 3 Pro Preview

- ✅ **Padronização de todas as edge functions para `google/gemini-3-pro-preview`**
  - `supabase/functions/generate-triplets/index.ts` - Fase 1 e Fase 2 atualizadas
  - `supabase/functions/gemini-file-search/index.ts` - Extração e análise atualizadas
  - `supabase/functions/document-chat/index.ts` - Chat RAG atualizado
  - `supabase/functions/translate-and-categorize-conditions/index.ts` - Tradução atualizada
- ✅ **Motivo**: Gemini 3 Pro Preview oferece multi-hop reasoning superior para extração de cadeias biológicas complexas
- ✅ **Documentação atualizada**: ARCHITECTURE.md v1.10.0, CURRENT_STATE.md v1.6.0

### Added - 2025-11-29 🚀 Senex AI Hierarchical Model Migration

- ✅ **FASE 1: SQL Migrations** - Expansão completa do modelo de dados
  - Criado ENUM `entity_layer` com 5 camadas hierárquicas (layer_0_compound → layer_4_outcome)
  - Criado ENUM `entity_type_expanded` com 16+ tipos de entidade (nutraceutical, pathway, mechanism, biological_effect, condition, etc.)
  - Criado ENUM `relationship_type_expanded` com 20+ predicados semânticos (INHIBITS, ACTIVATES, TREATS, SYNERGIZES_WITH, etc.)
  - Expandida tabela `triplet_extractions` com 11 novos campos hierárquicos:
    - `subject_layer`, `object_layer` - Camadas das entidades
    - `intensity`, `direction` - Força e direção do efeito
    - `evidence_level` - Nível de evidência (high/moderate/low/very_low)
    - `dose_dependent`, `dose_range` - Dependência de dose
    - `species_context` - Espécies validadas
    - `mechanism_path` - Cadeia completa L0→L4
    - `relationship_category`, `synergy_data` - Categorização e dados de sinergia
  - Criada tabela `pathway_nodes` (Layer 1) - Vias moleculares com kegg_id, reactome_id, go_term
  - Criada tabela `mechanism_nodes` (Layer 2) - Mecanismos com action_type, molecular_target
  - Criada tabela `biological_effect_nodes` (Layer 3) - Efeitos com onset_time, duration, severity
  - Criada tabela `hierarchical_edges` - Relações detalhadas com todas as propriedades científicas
  - RLS policies e triggers configurados para todas as novas tabelas

- ✅ **FASE 2: Neo4j Schema (Cypher)** - Configuração completa do grafo
  - Criado arquivo `docs/neo4j-schema/VETGRAPHRAG_SCHEMA.cypher` (~400 linhas)
  - 18 constraints de unicidade para todos os node types
  - 20+ índices de propriedades e relacionamentos
  - 6 índices fulltext para busca avançada
  - Exemplos completos de criação de nós (L0→L4)
  - Exemplos de relacionamentos enriquecidos (INHIBITS, TREATS, SYNERGIZES_WITH)
  - 5 queries hierárquicas de referência para traversal
  - Queries de validação de dados

- ✅ **FASE 3: generate-triplets Edge Function** - Extração hierárquica
  - Atualizado prompt sistema com modelo Senex AI de 5 camadas
  - Suporte a 20+ relationship types com validação
  - Extração de `mechanism_path` - cadeia completa L0→L1→L2→L3→L4
  - Extração de `synergy_data` - dados estruturados para sinergias/antagonismos
  - Categorização automática de relacionamentos (therapeutic, adverse, interaction, etc.)
  - KG Matching expandido para `pathway_nodes`, `mechanism_nodes`, `biological_effect_nodes`
  - Auto-criação de `hierarchical_edges` para triplets de alta confiança
  - Tratamento de rate limits (429) e payment required (402)

- ✅ **FASE 4: sync-approved-triplets Edge Function** - Sincronização hierárquica
  - Node labels dinâmicos baseados em entity_type (Nutraceutical, Pathway, Mechanism, etc.)
  - Propriedades hierárquicas nos nós: `layer`, `entity_type`, `source`
  - Edges enriquecidas com 15+ propriedades científicas:
    - `intensity`, `evidence_level`, `dose_range`, `species_validated`
    - `synergy_data`, `evidence_count`, `curated`
  - Sincronização de `mechanism_path` - cria nós e edges intermediários
  - Auto-criação de schema Neo4j (constraints e índices)
  - Estatísticas detalhadas: nodeTypes, relationshipTypes, mechanismPathsCreated
  - Inferência de tipo para nós não tipados baseado em posição na cadeia

- ✅ **FASE 5: Integração Frontend Senex AI** - Pipeline completo
  - `NtaiProcessingSection.tsx`: Pipeline expandido de 3→4 stages (Upload → Gemini AI → Triplets → Complete)
  - `handleProcessWithAI`: Chama `generate-triplets` automaticamente após `extract-study-entities`
  - `handleRegenerateSenex AI`: Nova função para regenerar triplets de estudos existentes
  - `NtaiStudySelectionTable.tsx`: Nova coluna "Senex AI" com botão de regeneração por estudo
  - `TripletCurationBoard.tsx`: Exibição completa de campos hierárquicos:
    - Badges coloridas para `subject_layer` e `object_layer` (L0-L4)
    - Badge de `evidence_level` (high/moderate/low/very_low)
    - Badge de `intensity` com percentual
    - Badge de `species_context` com espécies validadas
    - Exibição de `mechanism_path` como cadeia (Compound → Target → Mechanism → Effect → Outcome)
    - Exibição de `relationship_category`

### Changed - 2025-11-29
- 📝 **ARCHITECTURE.md v1.9.0**: Seção GraphRAG completamente reescrita com modelo Senex AI de 5 camadas
- 📝 **Diagrama Mermaid**: Novo diagrama mostrando hierarquia L0→L4 com tipos de relacionamento
- 📝 **Tabela de Status**: Atualizada com 4 fases concluídas do Senex AI

### Fixed - 2025-11-26
- ✅ **Neo4j Aura Compatibility**: Corrigido endpoint em todas edge functions para usar Query API v2 (`/db/neo4j/query/v2`) compatível com Neo4j Aura, substituindo o endpoint HTTP Transaction API antigo (`/db/neo4j/tx/commit`) que retornava erro 403 Forbidden
- ✅ Edge functions corrigidas: `ai-config` (teste de conexão), `sync-approved-triplets`, `neo4j-sync`
- ✅ Formato de requisição atualizado para Query API v2: `{ statement: "...", parameters: {...} }` ao invés do formato antigo com `statements` array

### Added - 2025-11-26
- ✅ **Endpoint de Teste de Conexão Neo4j**: Adicionado action 'test-neo4j' na edge function `ai-config` que valida credenciais executando query simples (`RETURN 1`)
- ✅ **Botão "Testar Conexão Neo4j"** na interface de configuração com loading state e validação de campos obrigatórios

### Changed - 2025-11-26
- ✅ **Unificação de Credenciais Neo4j**: Edge functions `sync-approved-triplets` e `neo4j-sync` agora buscam credenciais da tabela `ai_configurations` ao invés de secrets do Supabase
- ✅ **Gerenciamento Centralizado**: Todas as credenciais de APIs externas (OpenAI, Claude, Neo4j, etc.) gerenciadas no mesmo local (AI Configuration tab)

### Added - 2025-11-26
- ✅ **Sistema Completo de Curadoria para Knowledge Graph**: Implementação total do workflow de validação humana
  - **Tabelas Supabase**: 
    - `triplet_extractions`: Armazena triplets (subject-predicate-object) extraídos por IA de estudos científicos com scores (kg_match_score, llm_confidence, extraction_confidence), workflow de curadoria (pending/approved/rejected/needs_review), approval_chain JSON, e RLS policies para admins/veterinários
    - `auto_discoveries`: Armazena links preditos por TransE com scores (transe_score, evidence_multiplier, novelty_factor, discovery_score), supporting_paths JSON, workflow de aprovação científica (suggested/under_review/validated/rejected), e RLS policies
  - **Componentes React**:
    - `TripletCurationQueue.tsx`: Interface de curadoria com filtros (status, confidence, search), ações (Approve/Reject/Request Expert Review), visualização de scores (KG Match, LLM Conf., Overall), e notas de revisão
    - `AutoDiscoveryReview.tsx`: Interface de validação de Auto-Discoveries com breakdown de scores (TransE, Evidence Mult., Novelty), visualização de supporting paths do KG, e ações (Validate/Reject/Request Review)
    - `CurationDashboard.tsx`: Dashboard centralizado com métricas (pending, approved, validated, approval/validation rates), tabs para Triplets e Discoveries, e overview cards
  - **Edge Function**: `sync-approved-triplets` para sincronizar triplets aprovados com Neo4j AuraDB via REST API (MERGE nodes, CREATE relationships com metadata)
  - **Traduções Bilíngues**: Novas chaves PT/EN completas para todo sistema de curadoria (`curation.triplets.*`, `curation.discoveries.*`, `curation.dashboard.*`)
  - **Documentação**: Atualizado `supabase/config.toml` com nova função, `ARCHITECTURE.md` v1.8.0 com seção de Curadoria, e `CHANGELOG.md`
  - **Lógica de Auto-Aprovação**: Thresholds documentados (confidence ≥ 0.85, kg_match_score = 1.0, GRADE High/Moderate)
  - **Workflow Completo**: AI Extraction → Human Curation → Neo4j Sync → Knowledge Graph Update

### Added
- ✅ **Tab "Estudos" v2.1.0 - Conteúdo Científico Completo**: Quadro comparativo expandido (16 features: MedGraphRAG vs KGARevion vs NTAI), diagrama ASCII completo da arquitetura NTAI (~100 linhas, 5 fases: Ingestion→Validation→Storage→Retrieval→Synthesis), e todas as 6 fórmulas matemáticas com exemplos clínicos detalhados (~20 linhas cada):
  - **Fórmula 1**: Triple Graph Construction (MedGraphRAG) - 4 níveis hierárquicos (Doc→Chunk→Entity→Mechanism)
  - **Fórmula 2**: U-Retrieval Score - Busca bidirecional (Top-down Graph Cypher + Bottom-up Vector pgvector, α=0.6)
  - **Fórmula 3**: KGARevion Confidence Score - Sistema GRRA de validação (KG_match×0.5 + LLM×0.3 + GRADE×0.2)
  - **Fórmula 4**: Synergy Score (NTAI Original) ⭐ - Quantificação de sinergia por pathways compartilhados (escala 0-5, threshold≥3.5)
  - **Fórmula 5**: Pathway Discovery Score (NTAI + TransE) ⭐ - Auto-descoberta de novos tratamentos via TransE embeddings
  - **Fórmula 6**: Treatment Efficacy Score (NTAI Original) ⭐ - Rastreamento temporal de eficácia por breed/outcome
  - Cada fórmula inclui exemplo expandido com dados clínicos reais (Curcumin, Resveratrol, Berberine, Labrador Retriever)
  - Atualizado `src/data/admin-tabs-info.ts` (estudos v2.1.0)
  - Incrementada versão i18n para `1.3.35` em `src/i18n.ts`

### Added - 2025-11-26
- ✨ **TabInfoButton Expandido**: Interface estendida para conteúdo científico avançado (version, lastUpdate, keyExcerpts, comparisonTable, architectureDiagram, implementationStatus)
- 📚 **Conteúdo Científico Completo Tab "Estudos"**: Citações MedGraphRAG/KGARevion, quadro comparativo 12+ features, diagrama ASCII arquitetura, 6 fórmulas matemáticas (Synergy Score, Pathway Discovery, Treatment Efficacy), status implementação
- 🌍 **Traduções Bilíngues PT/EN**: Novas chaves para conteúdo científico (keyExcerpts, comparisonTable, implementationStatus)
- 📖 **Renderização Avançada**: Citações com links, tabelas HTML comparativas, diagramas ASCII, status com emojis coloridos

### Changed - 2025-11-26
- 📝 **ARCHITECTURE.md**: Atualizado para v1.7.0 (Auto-Discovery, Synergy Scoring, Pet Graph)
- 📝 **docs/GRAPHRAG_ARCHITECTURE.md**: Atualizado para v2.0.0 (conteúdo científico completo)
- 🔢 **i18n versão**: Incrementado para 1.3.34 (force cache clear)

### Added - 2025-11-26
- ✅ **FASE 0 GraphRAG**: Documentação completa da arquitetura híbrida Neo4j + Supabase (`docs/GRAPHRAG_ARCHITECTURE.md`)
- ✅ **FASE 1 GraphRAG (PARCIAL)**: Edge function `neo4j-sync` implementada (aguardando credenciais Neo4j)
- ✅ `ARCHITECTURE.md` v1.5.0: Nova seção "Arquitetura GraphRAG Híbrida"
- ✅ `docs/CURRENT_STATE.md` v1.5.0: Status GraphRAG atualizado

### Added
- ✅ **Service Layer**: Criado `StudyResetService.ts` centralizando operações de reset, cleanup e diagnóstico
  - `resetStudy()`: Reseta estudo específico para reprocessamento
  - `resetAllErroredStudies()`: Reseta todos estudos com erro em batch
  - `cleanOldImports()`: Remove importações antigas mantendo N mais recentes (padrão: 5)
  - `removeDuplicateStudies()`: Remove estudos duplicados por título
  - `checkSystemHealth()`: Retorna estatísticas completas do sistema (taxa de sucesso, tempo médio, alertas)
  - `getProblematicStudies()`: Lista estudos com erro ou analysis_data NULL
- ✅ **Emergency Actions Panel**: Novo componente `EmergencyActionsPanel.tsx` com 4 ações críticas:
  - 🗑️ Limpar Importações Antigas (manter últimas 5)
  - 🔄 Resetar Estudos com Erro (batch reset)
  - 🧹 Remover Duplicatas (detecta por título)
  - 📊 Verificar Saúde do Sistema (dashboard rápido)
  - Accordion expansível com confirmação via `BulkCleanupDialog`
- ✅ **Diagnostics Dashboard**: Novo componente `DiagnosticsTab.tsx` com:
  - 📊 Cards de métricas em tempo real (total estudos, taxa sucesso, tempo médio, importações)
  - 🔴 Tabela de estudos problemáticos com checkbox para seleção múltipla
  - 🔄 Botões de reset individual e em massa
  - ✅ Estado vazio bonito quando não há problemas
  - ⚠️ Alertas visuais quando importações > 10
- ✅ **Inline Reset Button**: `NtaiProcessCard.tsx` agora detecta erros críticos e mostra botão "🔄 Resetar e Reprocessar"
  - Detecta automaticamente erros de "Insufficient text extracted" ou "analysis_data NULL"
  - Executa reset via `StudyResetService` e re-adiciona à fila automaticamente
  - Spinner durante operação de reset
- ✅ **Enhanced Processing Log**: `NtaiProcessingLog.tsx` com melhorias:
  - Filtro "Mostrar Apenas Erros" / "Mostrar Tudo"
  - Botões de ação rápida "🔄 Tentar Novamente" em entradas de erro
  - Contexto expandido de erros com ID e título do estudo

### Changed
- ✅ **Zero Manual SQL**: Todas operações de cleanup agora via interface (não precisa mais de SQL manual)
- ✅ **Actionable Error Messages**: Mensagens de erro agora têm botões clicáveis ao invés de instruções SQL
- ✅ **Better Error Context**: Erros mostram ícone, título, problema e ações sugeridas
- ✅ **Removed SQL from UI**: Nenhuma mensagem de erro mostra SQL (substituído por ações inline)
- ✅ i18n version incremented to 1.3.32 with new translation keys:
  - `studies.emergency.*`: Traduções para painel de emergência
  - `studies.diagnostics.*`: Traduções para dashboard de diagnóstico
  - `studies.ntai.*`: Traduções para erros contextuais e ações de reset

### Fixed
- ✅ **UX Issue**: Usuário não conseguia executar SQL de erro "Insufficient text extracted"
- ✅ **Critical Workflow**: Implementado fluxo completo de reset sem precisar acessar backend manualmente
- ✅ **Error Messages**: Removido SQL de todas mensagens de erro (confuso para usuários não-técnicos)
- 🔥 **CRITICAL**: Validação robusta no pipeline de extração de estudos para prevenir erro "Insufficient text extracted (0 chars)"
  - Edge function `extract-study-entities` agora valida se `analysis_data` existe antes de processar
  - Mensagens de erro 400 (Bad Request) detalhadas com recomendações quando `analysis_data` está ausente ou inválido
  - Validação da estrutura do `analysis_data` (parse-study vs gemini-file-search) com lista de chaves esperadas
  - `useProcessingLogic.ts` agora valida se PDF existe (`storage_path`) antes de chamar gemini-file-search
  - `useProcessingLogic.ts` valida se gemini-file-search populou `analysis_data` antes de chamar extract-study-entities
  - Previne processamento de estudos sem dados, evitando erros 500 desnecessários
- ✅ **CRITICAL BUG FIX**: Corrigido pipeline de extração de texto de PDFs processados
  - `extract-study-entities` agora suporta estrutura do `parse-study` (Unstructured API: elements, sections, tables)
  - `document-chat` também atualizado para processar corretamente documentos do parse-study
  - Prevenção de alucinação da IA: validação de texto extraído antes de enviar para análise
  - Logging detalhado para debug: tamanho do texto, estrutura detectada, preview dos primeiros 200 chars

### Added
- ✅ Inline success confirmation in File Upload panel (replacing toast)
- ✅ Duration display for each RAG processing log step (shows time taken between consecutive log entries)
- ✅ Real document context extraction for AI chat citations (extracts full_text, abstract, sections from study data)
- ✅ Literal text quotes from original documents in AI responses (enforces exact quotes in citations)
- ✨ **Renderização avançada de Markdown no chat**: Mensagens da IA agora são renderizadas com formatação completa, incluindo títulos, listas, negrito, itálico, code blocks e links
- 🎨 **Componente CitationCard**: Citações científicas são destacadas visualmente em cards especiais com ícones e formatação diferenciada
- 🏷️ **Badges para nutracêuticos**: Nutracêuticos mencionados no texto são automaticamente convertidos em badges clicáveis
- 📊 **Barras de progresso para scores**: Scores de eficácia (formato X/Y) são renderizados como barras de progresso visuais com percentual
- 📝 **Prompt estruturado para IA**: Sistema prompt melhorado com diretrizes claras de formatação, uso de emojis, e formato obrigatório de resposta em seções
- 🔍 **Citações contextualizadas**: Suporte para citações no formato [Citação: texto - Seção X] que são extraídas e renderizadas em cards separados
- 📦 **Dependências**: Adicionadas bibliotecas `react-markdown`, `remark-gfm`, `rehype-sanitize`, `rehype-raw` para renderização rica de markdown

### Changed
- ✅ File upload success feedback changed from toast to inline message panel with navigation button
- ✅ RAG processing log now calculates and displays duration (in seconds) between consecutive steps
- ✅ AI chat prompt enhanced to use literal document text for accurate citations (enforces exact quotes)
- ✅ Document context extraction improved to include full_text, abstract, sections, and findings from study data
- ✅ Citation format enforced to use exact quotes from original document text (no paraphrasing allowed)
- ✅ i18n version incremented to 1.3.28

### Removed
- ✅ Toast notification removed from file upload success flow (replaced with inline panel)

### Fixed
- ✅ **Edge Functions Deployment**: Forçado deploy de `document-chat` e `extract-study-entities` para garantir versões atualizadas no servidor
- ✅ **Chat com Documento - Logging Detalhado**: Adicionados logs extensivos em toda pipeline de chat para facilitar debugging
  - Log de studyId, question, conversation history na entrada
  - Log de dados carregados (study, extraction, analysis_data)
  - Log de contexto construído (contagens de nutracêuticos, condições, achados)
  - Log de resposta da AI (tamanho, preview)
  - Log de erros detalhados no frontend e backend
- ✅ **Chat com Documento - Tratamento de Erros**: Melhorado feedback para usuários em casos de erro
  - Mensagens específicas para rate limiting (429)
  - Mensagens específicas para estudo não encontrado (404)
  - Exibição de detalhes técnicos quando disponíveis
  - Sugestões de ação para o usuário
- ✅ **Extract Study Entities - Fallbacks Robustos**: Mantidos fallbacks para usar dados do Gemini File Search quando AI retorna vazio
- ✅ **Extract Study Entities - Status Correto**: Confirmado uso de `kanban_status: 'processed'` (não 'reviewed')

### Improved
- 📊 **Observabilidade**: Sistema agora possui logging completo do fluxo de processamento e chat
- 🎯 **UX de Erros**: Mensagens de erro mais claras e acionáveis para usuários

### Added - 2025-11-21 16:45 BRT
- ✅ **REVOLUCIONÁRIO: Sistema completo de Chat com Documento usando Lovable AI**
  - Nova edge function `document-chat` com Gemini 2.5 Flash para conversação contextual
  - Interface de chat moderna com histórico persistente em tempo real
  - Sugestões de perguntas inteligentes contextuais baseadas no conteúdo do estudo
  - Citações automáticas com referências precisas ao documento
  - Export de conversas em formato Markdown (.md)
  - Tabela `study_chat_history` para persistência com RLS policies
  - Suporte a histórico de conversação (últimas 6 mensagens para contexto)
  - Rate limiting gracioso (429) com mensagens amigáveis ao usuário
  - Componente `DocumentChatInterface.tsx` (330 linhas)
  - Integração completa: copia mensagens, limpa chat, mostra timestamps

- ✅ **VISUALIZAÇÕES AVANÇADAS: Sistema rico de visualizações científicas**
  - Timeline animada do processamento com 4 fases (Upload → File Search → Extração → Análise)
  - Network Graph interativo com vis-network (Nutracêuticos ↔ Condições)
  - Distribuição de eficácia com barras de progresso coloridas por score (verde ≥80%, azul ≥60%, amarelo ≥40%, vermelho <40%)
  - Cards estatísticos com ícones temáticos e cores personalizadas
  - Sistema de tabs: Timeline, Network Graph, Distribuição
  - Suporte a dados parciais, estados de loading e mensagens de "dados insuficientes"
  - Componente `EnhancedStudyVisualization.tsx` (291 linhas)
  - Integração com biblioteca vis-network para grafos de relações complexas

- ✅ **INTEGRAÇÕES COMPLETAS: Expansão de interfaces administrativas**
  - `NtaiAnalysisResults`: Novas abas "📊 Visualizações" e "💬 Chat" (4 → 6 abas)
  - `EstudoDetailDialog`: Novas abas "📊 Visualizações" e "💬 Chat" (4 → 6 abas)
  - Ícones lucide-react (MessageCircle, BarChart3) para melhor UX
  - Navegação fluida entre análise tradicional, visualização avançada e chat interativo
  - Props passadas corretamente: `studyId`, `studyTitle`, `extractedData`

- ✅ **COMPONENTES REUTILIZÁVEIS**:
  - `DocumentChatInterface.tsx`: Chat completo com mensagens, scrolling automático, sugestões, copy, export
  - `EnhancedStudyVisualization.tsx`: Container de visualizações com múltiplas abas e stats cards
  - Suporte total a internacionalização (PT/EN)
  - Responsive design para mobile e desktop

### Fixed - 2025-11-21 16:45 BRT
- ✅ **CRÍTICO: Corrigido erro de constraint `processed_studies_kanban_status_check`**
  - **Problema**: `extract-study-entities` tentava definir `kanban_status = 'reviewed'` (valor inválido)
  - **Constraint permite**: `['new', 'processing', 'processed', 'error']`
  - **Solução**: Mudado de `'reviewed'` para `'processed'` em `extract-study-entities/index.ts` (linha 254)
  - **Impacto**: Workflow de extração agora completa sem erro de DB constraint
  - **Logs atualizados**: "Atualizando status do estudo para 'processed'..."

### Changed - 2025-11-21 16:45 BRT
- 🌍 **Traduções bilíngues completas (PT/EN)**:
  - `chat.*`: title, inputPlaceholder, thinking, suggestions, responseReceived, error, copied, exported, etc. (12 chaves)
  - `viz.tabs.*`: timeline, network, distribution
  - `viz.timeline.*`: title, upload, fileSearch, extraction, analysis
  - `viz.status.*`: completed, inProgress, pending
  - `viz.stats.*`: nutraceuticals, conditions, mechanisms, findings
  - `viz.network.*`: title, description, noData
  - `viz.distribution.*`: title
- 🔄 **Versão i18n**: 1.3.25 → 1.3.26 (force cache reload)
- ⚙️ **Supabase config.toml**: Adicionada configuração `[functions.document-chat]` com `verify_jwt = true`

### Fixed - 2025-11-21 16:00 BRT
- **CRÍTICO: Corrigido erro InvalidKey ao fazer upload de PDFs com espaços ou caracteres especiais**
  - **Problema identificado**: Supabase Storage rejeita nomes de arquivo com espaços e caracteres especiais (—, –, etc.)
  - **Solução implementada**:
    1. ✅ Criada função utilitária `sanitizeFileName()` em `src/utils/fileNameSanitizer.ts`
       - Substitui espaços por underscores
       - Converte em-dashes (—) para hífens (-)
       - Remove caracteres especiais mantendo legibilidade
       - Normaliza caracteres unicode (remove acentos)
       - Limita tamanho do nome (max 200 chars)
    2. ✅ Criada função `createSafeStoragePath()` para combinar UUID + nome sanitizado
    3. ✅ Atualizado `FileUploadTab.tsx`:
       - Upload usa `createSafeStoragePath()` (linha 78)
       - Mostra aviso visual quando nome é sanitizado (linhas 241-246)
    4. ✅ Atualizado `SciSpace2StepImport.tsx`:
       - Meta sumário sanitizado (linha 43)
       - Base de estudos sanitizada (linha 50)
    5. ✅ Traduções bilíngues completas:
       - `studies.import.fileNameSanitized` (PT/EN)
       - `studies.import.invalidCharactersRemoved` (PT/EN)
    6. ✅ Versão i18n incrementada: 1.3.24 → 1.3.25
  - **Impacto**: Upload de PDFs com nomes complexos agora funciona (ex: "Turmeric and Curcumin—Health-Promoting Properties in Humans versus Dogs.pdf" → "Turmeric_and_Curcumin-Health-Promoting_Properties_in_Humans_versus_Dogs.pdf")
  - **Arquivos afetados**:
    - `src/utils/fileNameSanitizer.ts` (NOVO - 36 linhas)
    - `src/components/administrador/estudos/import/FileUploadTab.tsx` (linhas 10, 78, 241-246)
    - `src/components/administrador/estudos/import/SciSpace2StepImport.tsx` (linhas 5, 43, 50)
    - `src/locales/pt/translation.json` (linhas 1475-1476)
    - `src/locales/en/translation.json` (linhas 1475-1476)
    - `src/i18n.ts` (linha 23: versão 1.3.25)

### Fixed - 2025-11-21 15:20 BRT
- **CRÍTICO: Correção de estrutura de dados em extract-study-entities**
  - Corrigido `extractTextContent()` para suportar estrutura atual do `gemini-file-search` (ExtractedStudyData)
  - Adicionado fallback para usar dados já extraídos pelo Gemini quando AI retornar arrays vazios
  - Corrigido kanban_status de 'extracted' (inválido) para 'reviewed' (válido)
  - Melhorados prompts da AI para extração mais abrangente e precisa
  - Adicionado logging detalhado em todas as etapas de extração
  - Agora a extração identifica corretamente nutracêuticos e condições de saúde
  - Implementada compatibilidade com estruturas antigas (sections) e novas (flat format)

### Fixed - 2025-11-21 (Critical Bug: Study Extraction 404)
- **🐛 [CRÍTICO] Corrigido erro 404 "Study not found" na extração de estudos**
  - **Problema identificado**: `extract-study-entities` edge function usava `.eq('study_id', studyId)` para buscar em `processed_studies`, mas o parâmetro recebido é o `id` (UUID, primary key), não o `study_id` (TEXT)
  - **Causa raiz**: Inconsistência entre schema do banco e lógica da edge function
  - **Solução implementada**:
    1. ✅ Migração DB: Alterado `study_extractions.study_id` de TEXT → UUID com foreign key para `processed_studies.id`
    2. ✅ Corrigido `extract-study-entities/index.ts`: Mudado todas as queries de `.eq('study_id', ...)` para `.eq('id', ...)`
    3. ✅ Adicionados logs detalhados de debug para rastreamento (🔍 busca, ✅ sucesso, ❌ erro, 💾 salvamento)
  - **Impacto**: Workflow completo de processamento de estudos (upload → gemini-file-search → extract-study-entities → study_extractions) agora funciona corretamente
  - **Arquivos afetados**:
    - `supabase/functions/extract-study-entities/index.ts` (linhas 38-42, 44-53, 175-184, 199-206)
    - Migration: `study_extractions.study_id` tipo alterado + foreign key constraint corrigida

### Changed
- **🔧 Corrigido nome do modelo de IA exibido nos logs**
  - Alterado de "GPT-4o" para "gemini-2.5-flash" em todos os estados iniciais
  - Arquivos: `useNtaiConfig.ts`, `useNtaiProcessing.ts`, `useProcessingLogic.ts`
  - Adicionado emoji 🤖 nos logs de modelo para melhor identificação

### Added
- **✨ Botões de Limpar e Exportar Log no painel NTAI**
  - Botão "Limpar Log" com confirmação via AlertDialog
  - Botão "Exportar Log" para download em formato .txt
  - Feedback via toast notifications
  - Traduções PT/EN completas
  - Arquivos: `NtaiProcessingLog.tsx`, `NtaiProcessingSection.tsx`, `useNtaiLogs.ts`

### Removed
- ❌ **Tab duplicada "AI Processing" removida do menu lateral**
  - Deletado arquivo `src/components/administrador/ProcessamentoIATab.tsx` (componente redundante)
  - Removida entrada `processamento-ia` de `src/config/admin-tabs.ts`
  - Removido import do `ProcessamentoIATab` em `admin-tabs.ts`
  - **Funcionalidade mantida**: AI Processing agora acessível APENAS via Scientific Studies → Import & Process → AI Processing (sub-tab)
  - **Motivo**: Eliminação de duplicação crítica que causava confusão de navegação e potenciais conflitos de estado

### Changed
- 🔄 **Arquitetura de processamento de IA simplificada**:
  - AI Processing consolidado em uma única localização dentro de Scientific Studies
  - Badge "Recomendado" adicionado na seção "Upload e Extração Automática (Gemini AI)" para orientação visual
  - Navegação contextual mantida: botões "Process with AI" continuam funcionando corretamente
  - Contagem de tabs: 28 → 27 tabs administrativas (8 Knowledge Base → 7 Knowledge Base)
- 📚 **Documentação atualizada**:
  - `ARCHITECTURE.md` v1.4.0: Seção de navegação atualizada (27 tabs, 7 no Knowledge Base)
  - `CURRENT_STATE.md` v1.4.0: Correção de arquitetura registrada
  - Scientific Studies agora explicitamente lista sub-tabs (Import & Process com AI Processing)

### Added
- ✅ Documentação completa da arquitetura NTAI Knowledge Graph em `docs/NTAI_KNOWLEDGE_GRAPH_ARCHITECTURE.md` (~700 linhas)
  - Modelo de dados expandido com 6 novas tabelas (mechanisms, study_findings GRADE, study_extractions, etc.)
  - Workflow de ingestão: PDF → Unstructured API → LLM → Curadoria → KG
  - Sistema RAG graph-aware: Top-down + Bottom-up + LLM synthesis
  - 8 visualizações interativas "WOW" (Network Graph, Evidence Heatmap, Pipeline Dashboard, etc.)
  - Roadmap de implementação de 6 fases (4-6 semanas)
- ✅ Sistema de explicações científicas contextuais in-app para demonstração Stanford
  - Componente reutilizável `TabInfoButton` com Dialog de 3 tabs (Visão Geral, Metodologia, Científica)
  - Conteúdo científico completo para 6 abas do Knowledge/Relational Base
  - ~50+ referências científicas com links PubMed/journals
- ✅ Referência à documentação NTAI adicionada em `ARCHITECTURE.md` v1.5.0

### Fixed
- 🐛 Corrigido sistema de traduções do `TabInfoButton` - chaves literais (`admin.tabInfo.*`) agora traduzem corretamente
  - Mesclado conteúdo de `tab-info.json` em `translation.json` (PT e EN)
  - Incrementada versão i18n para 1.3.15 (force cache clear)
  - Botão e dialog agora exibem traduções em PT/EN corretamente

### Changed
- ✅ Removidas badges de contagem de nutracêuticos da coluna "Tratabilidade Média" (mantém apenas porcentagem e "A Catalogar")
- ✅ Ajustado arredondamento de tratabilidade para múltiplos de 5 (5%, 10%, 15%...) para apresentação mais limpa e profissional
- ✅ Implementado badge "A Catalogar" para condições sem nutracêuticos catalogados (mais claro e positivo que "0%")
- ✅ Ajustados thresholds de tratabilidade: Baixa (0-35%), Moderada (40-65%), Boa (70-85%), Excelente (90-100%)
- ✅ Seção expandida de detalhes agora mostra mensagem apropriada quando não há dados catalogados

### Added
- 📊 **Nova coluna "Tratabilidade Média" na tabela de Alvos Veterinários**:
  - Cálculo baseado em efficacy scores e tipos de relacionamento (tratamento/prevenção/suporte)
  - Badges coloridos indicando nível de tratabilidade (Baixa 🔴, Moderada 🟡, Boa 🟢, Excelente 🟦)
  - Contagem de nutracêuticos disponíveis por condição
  - Detalhamento expandido com métricas de tratamento, prevenção, suporte e eficácia média
  - Card de estatística mostrando tratabilidade média geral do arsenal
  - Nova função SQL `get_conditions_with_treatability()` para cálculo otimizado no banco
  - Hook customizado `useConditionsWithTreatability` para busca de dados com métricas

### Changed
- 🎨 **Backgrounds dos cards de estudos agora muito transparentes (30% opacidade) para visual mais clean**
- 🎨 **Card "Next Steps" agora usa cor teal (verde-azulado) em vez de roxo para estética mais elegante e científica**
- ✅ **i18n**: Versão incrementada para 1.3.10 (cache refresh)

### Changed
- 🎨 **Study Progress Timeline - Labels abreviados com tooltips**:
  - Labels de fase agora usam formato compacto (M0, M2, M4, M6, M8, M10...) evitando sobreposição
  - Tooltip mostra nome completo da fase + dia ao passar o mouse
  - Marcadores visuais maiores (2.5px) com cores mais destacadas
  - Labels coloridos dinamicamente: azul para fases passadas, cinza para futuras
  - Cursor "help" indica interatividade dos marcadores
  - Solução elegante que mantém timeline limpa e informativa
- ✅ **i18n**: Versão incrementada para 1.3.9 (cache refresh)
- 📚 **Traduções**: Adicionada chave `admin.studies.progress.day` (PT: "Dia" / EN: "Day")

### Changed
- 🎨 **Study Notes - Redesign da seção "Preliminary Results"**:
  - Consolidados múltiplos cards coloridos em um único card elegante azul/índigo
  - Estrutura visual simplificada: introdução + lista com bullets para resultados
  - Removido grid de cards verdes individuais por categoria
  - Mantidas seções "Current Limitations" (amarelo) e "Next Steps" (roxo) inalteradas
  - Tipografia mais limpa: categorias em negrito, conteúdo em gray-700 para melhor legibilidade
  - Design mais profissional e elegante, reduzindo poluição visual
- 📊 **Population do Estudo Rapamycin + SGLT2i - Ajustado para dados reais**:
  - Treatment Count: 10 → 6 cães (refletindo os 6 que realmente iniciaram o protocolo)
  - Control Count: 10 → 2 cães (população controle atual)
  - Total iniciado: 8 cães dos 20 planejados (6 tratamento + 2 controle)
  - Visualização com paw prints agora mostra 6 🐾 no grupo tratamento e 2 🐾 no controle
  - Alinhado com as notas do estudo: "Apenas 6 cães dos 20 planejados iniciaram o protocolo"
- ✅ **i18n**: Versão incrementada para 1.3.8 (cache refresh)

### Changed
- ✅ **Study Notes**: Melhorada organização e estruturação das notas do estudo em andamento
  - Seção "Resultados Preliminares" com introdução destacada em card azul/índigo
  - Grid de resultados com cards verdes individuais para cada categoria (Perfil Lipídico, Função Renal, Cardioproteção, etc.)
  - Seção "Limitações Atuais" com card amarelo/âmbar e lista estruturada
  - Seção "Próximos Passos" com card roxo e lista de ações futuras
  - Ícones contextuais (TrendingUp, CheckCircle2, AlertTriangle, FlaskConical) para cada seção
  - Parsing automático do texto das notas para extrair e organizar informações por categoria
- ✅ **i18n**: Versão incrementada para 1.3.7 (cache refresh)
- ✅ **Estudos em Andamento**: Substituído estudo mockado de Omega-3 por estudo clínico REAL em andamento - "Protocolo Rapamicina + SGLT2i para Longevidade e Saúde Multiorgânica Canina"
  - 20 cães planejados (6 já iniciados há 6 meses)
  - Protocolo: Rapamicina 0,3mg/kg + SGLT2i alternado (Dapagliflozina 0,1mg/kg / Empagliflozina 0,2mg/kg a cada 2 meses)
  - 21 métricas científicas rigorosas em 7 categorias: Exames Laboratoriais Básicos, Função Renal, Função Cardíaca, Biomarcadores de Envelhecimento, Marcadores Inflamatórios, Biomarcadores Oncológicos, Métricas de Wearable (preparação API Invoxia)
  - Dados preliminares de 6 meses demonstram: redução de 28% no LDL, 50% na proteinúria, 40% no NT-proBNP, 43% na atividade mTOR, 54% na IL-6
  - Múltiplos outcomes: cardioproteção, proteção renal, prevenção oncológica, efeito anti-inflamatório, longevidade
  - Preparação para integração futura com API Invoxia (wearables) para monitoramento contínuo de FC, HRV e atividade física
  - Notas clínicas detalhadas com limitações atuais (recrutamento em andamento) e próximos passos (telômeros, relógio epigenético)

### Added
- ✨ **Sistema de Monitoramento Clínico completo**:
  - Nova tab "Monitoramento Clínico" com 12,847 pets em acompanhamento
  - 9 condições de saúde: Artrite, Cardíaca, Renal, Hepática, Alergias, Ansiedade, **Obesidade**, **Diabetes**, **Câncer**
  - Dashboard com métricas: tempo médio acompanhamento (8.3 meses), taxa adesão (76.2%)
  - Distribuição realista: 32.4% melhora significativa, 21.8% leve, 18.7% sem melhora, 27.1% dados insuficientes
  - Análise por condição com top raças, nutracêuticos usados, tempo para melhora
  - Timeline evolutiva com novos pets/mês, taxas de resposta, dropouts
  - Filtros: raça (50+), condição, status resposta, região
  - Dados mock estatisticamente realistas para demo Stanford
  - Arquivos: `mockClinicalData.ts`, `ClinicalMonitoringTab.tsx` + 6 componentes

### Changed
- 🔄 **Reorganização de navegação administrativa**:
  - "Bulk Actions" movido de "Actions" → "Configuration"
  - "Monitoring" renomeado para "Campaign Management" (PT: Gestão de Campanhas)
  - Nova tab "Clinical Monitoring" adicionada ao grupo "Actions"
  - ActionsGroup.tsx e ConfigurationGroup.tsx atualizados
- 🌍 **Traduções bilíngues completas**: `clinicalMonitoring.*` e `campaignManagement` em PT/EN
- 🔢 **Versão i18n incrementada**: `1.3.4` → `1.3.5` para refresh de cache

### Fixed
- 🔧 **Gráfico "Response Rates Over Time" corrigido para padrão clínico realista**:
  - Substituída lógica de "novos pets por mês" por "taxa de resposta acumulada"
  - Implementado padrão S-curve realista: crescimento (0-3m) → aceleração (3-8m) → plateau (8-12m)
  - Adicionada variabilidade natural (±5%) para simular flutuações mensais
  - Removida dependência problemática de dados de pets
  - Adicionado tooltip explicativo com Alert component sobre padrão de resposta nutracêutica
  - Título atualizado: PT "Taxa de Resposta Acumulada ao Longo do Tempo" / EN "Cumulative Response Rate Over Time"

### Changed
- 🎨 **Rebrand visual NTAI → RAG no frontend**:
  - **Badge removido**: Removido badge "Advanced Processing" / "Processamento Avançado" da seção de análise (EstudosTab.tsx linhas 136-142)
  - **Terminologia atualizada na UI**: Todas as strings visíveis mudaram de "NTAI" e "Multi-Agent" para "RAG" (Retrieval-Augmented Generation)
  - **Traduções atualizadas**: 
    - PT: "Análise NTAI" → "Análise RAG", "Processamento NTAI" → "Processamento RAG", "Adicionar à Fila NTAI" → "Adicionar à Fila RAG", "Simulação Multi-Agente" → "Simulação RAG", "Análise de IA Multi-Agente" → "Análise RAG", "Sistema de Análise Colaborativa" → "Sistema de Análise RAG", "Iniciar Análise Multi-Agente" → "Iniciar Análise RAG"
    - EN: "NTAI Analysis" → "RAG Analysis", "NTAI Processing" → "RAG Processing", "Add to NTAI Queue" → "Add to RAG Queue", "Multi-Agent Simulation" → "RAG Simulation", "Multi-Agent AI Analysis" → "RAG Analysis", "Collaborative Analysis System" → "RAG Analysis System", "Start Multi-Agent Analysis" → "Start RAG Analysis"
  - **Chaves de tradução**: `studies.ntai.*` → `studies.rag.*` + `admin.sidebar.dataProcessing.multiAgentSimulation` + `admin.multiAgentAnalysis.*` (valores atualizados)
  - **Componentes atualizados**: EstudosTab (linha 138), NtaiProcessingSection (linha 45), NtaiProcessingLog (linha 25), AnalysisStep (linhas 38-39, 48, 60, 147, 462)
  - **Menu administrativo**: "Multi-Agent Simulation" → "RAG Simulation" na sidebar (linha 340 PT/EN)
  - **Página de análise**: Título, subtítulo, descrição do card e botão principal atualizados para refletir RAG
  - **Versão i18n incrementada**: 1.0.1 → 1.3.2 (força reload de traduções)
  - **Código interno preservado**: Nomes de arquivos, hooks, tipos e interfaces permanecem inalterados (`useNtaiProcessing`, `NtaiAnalysisResult`, `multiAgentAnalysis` key, etc.)
  - **Impacto**: Mudança puramente visual - terminologia mais técnica e reconhecida pela comunidade de IA/ML (RAG é método padrão para LLMs com conhecimento externo)

### Changed
- 🌍 **Internacionalização da tela de resultados da análise RAG**:
  - **Componente atualizado**: `AnalysisResult.tsx` agora suporta PT/EN
  - **Traduções adicionadas**: 
    - `multiAgentAnalysis.result.*` em `pt/translation.json` e `en/translation.json`
    - Título, descrição, seções de processamento, correlações, recomendações e próximos passos
  - **Versão i18n incrementada**: 1.3.2 → 1.3.3
  - **Impacto**: Tela de sucesso da análise RAG agora exibe em português e inglês conforme idioma selecionado

### Fixed
- 🐛 **Corrigido erro de importação dinâmica do ActionsStep.tsx**:
  - **Problema**: "Failed to fetch dynamically imported module" causado por conflito de cache após reload forçado do i18n (versão 1.3.2)
  - **Solução**: Adicionados comentários JSDoc aos componentes ActionsStep e SmartCampaignSystem para forçar recompilação pelo Vite
  - **Arquivos modificados**: 
    - `src/components/administrador/dataAnalysis/ActionsStep.tsx` (linhas 4-7: documentação adicionada)
    - `src/components/administrador/massActions/SmartCampaignSystem.tsx` (linhas 9, 15-18: comentários atualizados)
  - **Causa raiz**: HMR (Hot Module Replacement) do Vite perdeu referência ao módulo após limpeza de cache do localStorage
  - **Impacto**: Tab "Ações" (/administrador?tab=actions) agora carrega corretamente sem erro de módulo não encontrado

### Removed
- 🗑️ **Sistema de inicialização automática de admin removido**:
  - Deletado `src/hooks/useInitAdmin.ts` (hook que expunha credenciais em toasts)
  - Removida chamada do hook de `src/pages/Index.tsx` (linhas 8 e 17)
  - Deletada edge function `supabase/functions/init-admin-user/index.ts` (189 linhas de código morto)
  - **Motivo da remoção**:
    - ❌ Toasts expunham credenciais hardcoded (`mrachlyn@gmail.com / nutra12`)
    - ❌ Gerava erros constantes nos logs (profiles.email não existe, violação de constraint unique)
    - ❌ Não mais necessário após desproteger rotas (commit anterior - qualquer usuário autenticado tem acesso total)
  - **Impacto**: Zero - sistema não era mais útil após remoção de `requiredRole` das rotas
  - **Segurança**: Melhoria significativa - credenciais não são mais expostas na interface

### Changed
- 🔓 **CRÍTICO: Acesso liberado para demo Stanford - Rotas desprotegidas**:
  - Removida verificação de `requiredRole` nas rotas `/veterinario` e `/administrador`
  - Agora **qualquer usuário autenticado** pode acessar todos os portais
  - Veterinarian Portal: Não requer mais role 'veterinarian'
  - Control Panel (Admin): Não requer mais role 'admin'
  - Owner Portal: Continua em construção (under construction)
  - ⚠️ **APROPRIADO PARA DEMO STANFORD (ambiente acadêmico controlado)**
  - ⚠️ **NÃO USAR EM PRODUÇÃO**: Para produção futura, restaurar verificações de role e implementar RLS policies específicas por role
  - Arquivo modificado: `src/App.tsx` (linhas 40-49)
  - Comportamento: `ProtectedRoute` apenas verifica se `user !== null` (autenticação básica)
  - Não autenticados: Continuam sendo redirecionados para `/auth`

- 🔄 **Reorganização dos cards da homepage**:
  - Nova ordem (esquerda → direita): Control Panel → Veterinarian Portal → Owner Portal
  - Layout adaptado para destacar primeiro o painel administrativo/pesquisa
  
- 📝 **Descrição do Owner Portal atualizada**:
  - PT: "Acompanhe os PETs que aderiram ao NutraTherapy e monitore seu plano de tratamento nutracêutico personalizado"
  - EN: "Follow the PETs enrolled in NutraTherapy and monitor their personalized nutraceutical treatment plan"
  - Reflete melhor o contexto de adesão ao programa e acompanhamento de planos personalizados
  - Atualizada tanto na área logada (`tutorAreaDesc`) quanto não-logada (`forTutorsDesc`)

### Added
- 🎓 **Sistema de Acesso Simplificado Stanford**:
  - Novo componente `StanfordDemoForm.tsx` para acesso demo simplificado
  - Autenticação com email único + senha fixa (`@stanford@`)
  - Login/signup automático: tenta login → se falhar, cria conta automaticamente
  - Validação de email com feedback visual (zod schema)
  - Interface minimalista: campo de email + botão de acesso
  - Ícone GraduationCap (🎓) para identidade visual Stanford
  - Toast notifications para feedback do usuário (bem-vindo, login existente, erros)
  - Nota visual explicando autenticação simplificada para demo
  - Traduções completas PT/EN para todas as mensagens (12 novas chaves)
  - Versão i18n: 1.2.6 → 1.2.7

### Changed
- 🔄 **AuthPage simplificada para Demo Stanford**:
  - Removidas tabs Login/Register (simplificação total)
  - Interface direta: Card único com `StanfordDemoForm`
  - Título: "Stanford Demo Access" (PT: "Acesso Demo Stanford")
  - Descrição: "Enter your email to explore the NutraTherapy platform"
  - Mantém redirecionamento automático se já autenticado
  - Removidas funções de registro manual (`handleRegister`)

### Changed
- 🔓 **Acesso liberado para demo Stanford**:
  - **Veterinarian Portal**: Removida validação de role (veterinarian) - todos os usuários logados podem acessar
  - **Control Panel (Admin)**: Removida validação de role (admin) - todos os usuários logados podem acessar
  - Removidos botões desabilitados e mensagens "Request access" dos portais liberados
  
- 🚧 **Owner Portal bloqueado temporariamente**:
  - Card do "Owner Portal" na homepage marcado como "Under Construction"
  - Botão desabilitado com estilo visual de bloqueio (opacity 60%, badge 🚧)
  - Nova chave de tradução `home.underConstruction` (PT: "Em Construção" / EN: "Under Construction")
  - Acesso ao `/tutor` será reabilitado em versão futura

- 📝 **Placeholder do email simplificado para demo Stanford**:
  - EN: `your.name@stanford.edu` → `yourname@stanford.edu` (sem ponto)
  - PT: `seu.nome@stanford.edu` → `seunome@stanford.edu` (sem ponto)
  - Reflete melhor a aceitação de qualquer formato de email na demo

### Removed
- ❌ **Componentes antigos de autenticação deletados**:
  - Arquivo `src/components/auth/LoginForm.tsx` deletado (não mais utilizado)
  - Arquivo `src/components/auth/RegisterForm.tsx` deletado (não mais utilizado)
  - Removidos do AuthPage: tabs de Login/Register (Tabs, TabsList, TabsTrigger)
  - Removido estado `activeTab` (não mais necessário)
  - Código limpo: redução de ~300 linhas de código obsoleto

### Technical
- ✅ Fluxo de autenticação: `signIn()` → se erro → `signUp()` automático
- ✅ Nome extraído do email: `email.split('@')[0]` (parte antes do @)
- ✅ Sobrenome fixo: "Stanford Demo" para todos os usuários demo
- ✅ Senha fixa conhecida: `@stanford@` (OK para ambiente acadêmico controlado)
- ✅ Loading states durante autenticação (botão desabilitado + spinner)
- ✅ Todos os emails registrados automaticamente na tabela `profiles`

### Changed
- 📝 **Refinamento de textos da plataforma**:
  - **Footer**: Adicionado "scalable" antes de "intelligent" (destaque escalabilidade)
  - **Hero subtitle**: Reescrito para melhor descrever atividades mantendo estatísticas (267 estudos, 35 compostos, 95 condições, índice 4.2/5)
    - Ênfase em "evidence-based", "peer-reviewed", "AI-driven personalized recommendations"
  - **Header slogan**: Quebrado em duas linhas para melhor legibilidade visual
    - Linha 1: "Mass-personalized nutraceutical therapy platform"
    - Linha 2: "& research"
  - Todas as mudanças mantêm suporte bilíngue completo (PT/EN)
- 📝 **Atualização massiva de textos da plataforma para apresentação profissional**:
  - **Header**: Novo slogan conciso "Mass-personalized nutraceutical therapy platform & research"
  - **Hero subtitle**: Incluídas estatísticas concretas "A scientific database built from 267 studies covering 35 nutraceuticals and 95 condition links, with an overall efficacy index of 4.2/5"
  - **Welcome message**: Simplificado para "Welcome back! You're signed in as [email]"
  - **Cards de áreas renomeados**:
    - "Área do Tutor" → "Owner Portal" (EN) / "Portal do Tutor" (PT)
    - "Área do Veterinário" → "Veterinarian Portal" (EN) / "Portal do Veterinário" (PT)
    - Descrições expandidas com foco em funcionalidades específicas
    - Botões com textos mais descritivos: "Go to Owner Portal", "Go to Vet Portal", "Open Admin"
  - **Footer**: Atualizado para "NutraTherapy Pet © 2025 — Intelligent nutraceutical recommendation system for pets"
  - Versão i18n: 1.2.4 → 1.2.5
  - Todas as mudanças mantêm suporte bilíngue completo (PT/EN)
- 🎨 **Redesign da página inicial**:
  - Card "R&D + Base de Conhecimento" renomeado para **"Painel de Controle"** (PT) / **"Control Panel"** (EN)
  - Descrição atualizada: "Central de gerenciamento da plataforma: pesquisa, base de conhecimento, configurações e administração do sistema"
  - Ícone alterado de Microscope (🔬) para UserCog (⚙️) para melhor representar o controle centralizado da plataforma
  - Layout otimizado: grid alterado de 4 para 3 cards (mais limpo e balanceado)
- 🔄 **Reorganização da Base de Conhecimento**:
  - "Relations" movido para antes de "A.I. Insights"
  - Nova ordem: Estudos → Nutracêuticos → Alvos → **Relations** → **A.I. Insights** → Configurações
  - Melhora a progressão lógica: primeiro visualiza relações, depois insights gerados pela IA

### Added
- ✨ **Nova aba "A.I. Insights" na Base de Conhecimento**:
  - Apresenta 3 tipos de insights: Descobertas Longitudinais, Novos Estudos, Análises de Eficácia
  - Interface inspirada em sugestões de estudos com confidence score
  - Tabs detalhadas: Overview, Evidence, Required Resources
  - Mock data com 3 insights reais baseados em 18.347+ cães monitorizados
- ✅ **Restaurada aba "Relações" na Base de Conhecimento**:
  - Visualização de relações entre nutracêuticos e condições de saúde
  - Componente `RelationsTab` reintegrado (network, Sankey, matrix views)
  - Posição: Entre "A.I. Insights" e "Settings"

### Removed
- ❌ **Card "Área do Administrador" removido da página inicial**:
  - Eliminada duplicação desnecessária (ambos cards "R&D" e "Admin" redirecionavam para `/administrador`)
  - Funcionalidades consolidadas no novo card "Painel de Controle"
  - Interface mais limpa: 3 cards ao invés de 4
- ❌ **Aba "Manage Outcomes" removida**:
  - Funcionalidade não essencial como aba standalone
  - Componente `OutcomeManagementPanel` mantido no código mas não acessível via navegação principal

### Changed
- 🔄 **Estrutura da Base de Conhecimento corrigida**:
  - Ordem final: Estudos → Nutracêuticos → Alvos Veterinários → A.I. Insights → **Relações** → Settings
  - "Manage Outcomes" movido para fora do fluxo principal
  - Versão i18n: 1.1.9 → 1.2.0 (force reload)

### Added
- 🌍 **Sistema completo de bilinguismo para condições veterinárias**:
  - Todas condições agora criadas com name (PT) + name_en (EN) desde o início
  - Interface 100% consistente independente do idioma selecionado (PT/EN)
  - Sistema automático de tradução via Lovable AI (Gemini 2.5 Flash)
  - Nova Edge Function `translate-and-categorize-conditions` para atualizar condições existentes

- 📊 **Sistema inteligente de categorização de condições**:
  - 14 categorias veterinárias profissionais definidas:
    * Musculoesquelética, Cardiovascular, Renal, Imunológica
    * Digestiva, Hepática, Dermatológica, Metabólica
    * Oncológica, Oftalmológica, Respiratória, Oxidativa
    * Envelhecimento, Inflamatória, Geral
  - Categorização automática baseada em análise semântica do nome da condição
  - Cada categoria possui nome bilíngue (PT/EN)
  - Todas condições exibem categoria apropriada na tabela

- 🎯 **Sistema de severity level para condições**:
  - 4 níveis de gravidade clínica: low, medium, high, critical
  - Atribuição automática baseada na categoria e tipo de condição
  - Badges coloridos na interface para visualização rápida
  - Facilita priorização e tomada de decisão clínica

### Fixed
- 🐛 **CRÍTICO: Correção do efficacy_score na migração de condições**:
  - Removida multiplicação por 10 que violava check constraint do banco (0-10)
  - Edge Function agora salva valores corretos (era 32-45, agora 1.0-4.5)
  - Migração de condições finalmente funcionando! 🎉

### Added
- ✅ **10 novos nutracêuticos no mapeamento de condições**:
  - Silimarina (3 condições), Própolis Verde (4), Pólen de Abelha (4)
  - Allicina (4), Apigenina (5), Beta-Glucanas (5)
  - Ácido Alfa-Lipóico (6), Astaxantina (5), Quercetina (3), Astragalus (5)
  - Total: ~126 relações de condições prontas para migração
  - Aba Matriz agora exibirá TAGs para todos os 19 nutracêuticos

### Changed
- 🌍 **Idioma padrão alterado para Inglês (EN)**:
  - Aplicação agora inicia em inglês para novos usuários
  - Fallback de traduções alterado de PT → EN
  - Usuários que já definiram idioma manualmente mantêm sua escolha
  - Versão i18n: 1.1.8 → 1.1.9

### Fixed
- 🌍 **Correção DEFINITIVA de fallbacks i18n (PT → EN)**:
  - Todos fallbacks em `NutraceuticalDetails.tsx`, `StudiesTable.tsx`, `ConditionsTable.tsx`, `ExpandedContent.tsx` alterados de PT para EN
  - Interface agora mostra inglês correto quando i18n falha ou não está pronto
  - Fallbacks atualizados: 'Details', 'Description', 'Chemical Compound', 'Source', 'Dosage', 'Not defined', 'Title', 'Journal', 'Relevance', 'Unknown study', 'Condition', 'Type', 'Efficacy', 'Unknown condition', 'Conditions', 'Scientific Studies', 'No associated studies', 'No associated conditions'
  - Versão i18n: 1.1.7 → 1.1.8
- 🌍 **Correção completa de i18n na aba Nutracêuticos Unificados**:
  - Tabs principais ("Catálogo", "Relações", "Matriz") agora traduzem corretamente para EN
  - Subtítulo da página traduzido corretamente
  - Versão i18n: 1.1.6 → 1.1.7
- 🔥 **Correção DEFINITIVA de cache i18n (versão 1.1.6)**:
  - Limpeza ultra-agressiva: localStorage + sessionStorage
  - Força limpeza em TODA primeira carga
  - Delay de 500ms antes do reload para garantir persistência
  - Logs detalhados: 🔥 LIMPEZA FORÇADA, ✅ Cache limpo
  - Versão i18n: 1.1.4 → 1.1.5 → 1.1.6
- ✅ **Sistema de fallback para traduções**:
  - Helper `getText()` adicionado em 4 componentes
  - Fallbacks em português para UX imediata
  - Detecta quando i18n não está ready
  - Previne chaves literais na interface
- 🔗 **Correção crítica nos links DOI**:
  - Adicionado `encodeURIComponent()` para caracteres especiais
  - DOIs com `()[]` agora funcionam corretamente
  - Links testados: 10.1111/j.1532-950X.2016.12287.x ✅
  - 93 associações de estudos com links corrigidos

### Added
- ✅ **Dados mockados para Prebióticos e Vitamina E na Edge Function**:
  - Prebióticos: 9 relações de condições (3 prevention: Disbiose intestinal 3.8, Problemas digestivos 3.6, Sistema imunológico enfraquecido 3.5 | 3 treatment: Disbiose intestinal 4.1, Diarreia crônica 3.9, Constipação 3.7 | 3 support: Saúde digestiva 4.0, Microbiota intestinal 4.2, Sistema imunológico 3.8)
  - Vitamina E: 9 relações de condições (3 prevention: Estresse oxidativo 3.9, Problemas de pele 3.6, Imunodeficiência 3.5 | 3 treatment: Dermatite 3.8, Estresse oxidativo 4.0, Problemas musculares 3.7 | 3 support: Saúde da pele 3.9, Sistema imunológico 3.7, Função celular 3.8)
  - Total de nutracêuticos cobertos: 9 (era 7)
  - Total de relações de condições a migrar: ~75 (era ~55)
- ✅ **Edge Function para migração de condições de nutracêuticos** (`migrate-nutraceutical-conditions`):
  - Migra ~150-200 relações de condições dos arquivos mockados para o banco
  - Popula `health_conditions` e `nutraceutical_conditions` automaticamente
  - Suporte para 3 tipos de relações: prevention, treatment, support
  - Cache inteligente de condições para evitar duplicatas
  - Nutracêuticos migrados: Glucosamina, Condroitina, L-carnitina, Equinácea, Quitosana, Coenzima Q10, EPA
- 🔘 **Botão de migração de condições na UI**:
  - Adicionado botão "🔗 Migrar Condições" na aba Catálogo
  - Feedback visual durante migração
  - Toast com estatísticas de sucesso (relações criadas, nutracêuticos atualizados)
  - Refresh automático dos dados após migração
  - Traduções completas PT/EN para todas mensagens

### Changed
- 📊 **Aba Matriz agora exibe TAGs de condições**:
  - Nutracêuticos migrados exibirão badges coloridos baseados em eficácia
  - Glucosamina: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.2-4.2
  - Condroitina: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.4-4.1
  - L-carnitina: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.5-4.3
  - Equinácea: 6 condições (prevention: 3, treatment: 2, support: 1) com eficácia 3.5-4.2
  - Quitosana: 6 condições (prevention: 2, treatment: 2, support: 2) com eficácia 3.5-3.9
  - Coenzima Q10: 8 condições (prevention: 2, treatment: 3, support: 3) com eficácia 3.7-4.1
  - EPA: 9 condições (prevention: 3, treatment: 3, support: 3) com eficácia 3.6-4.3
  - Total estimado: ~55 relações de condições criadas

### Fixed
- ✅ **Correção CRÍTICA na exibição de estudos científicos**:
  - Journals exibidos corretamente (não mais "N/A" quando há dados)
  - Relevância mostra valor real (não mais "0" quando há score)
  - Mapper corrigido para preservar estrutura aninhada do banco (`nutraceutical_studies`)
- ✅ **Enriquecimentos na tabela de estudos**:
  - Títulos clicáveis com link direto para DOI externo
  - Suporte completo a i18n (PT/EN) para títulos e journals
  - Ano de publicação exibido ao lado do título quando disponível
  - Ícone de link externo para melhor UX e indicação visual
  - Modo dark adaptativo em badges de relevância
- ✅ **Validação dos 90 estudos**: Todas as associações nutracêutico-estudo agora visíveis na interface

### Added
- ✅ **78 estudos científicos veterinários** adicionados ao banco de dados
  - 100% focados em aplicações veterinárias para cães e gatos
  - Journals tier-1: JAVMA, JVIM, Vet Immunol, Vet Surgery, Nature, Cell Metabolism
  - Período: 2005-2023 (últimos 18 anos de pesquisa veterinária)
  - Todos com títulos bilíngues (PT/EN), DOI, abstracts completos e lista de autores
- ✅ **Base científica completa**: 31/31 nutracêuticos com ≥3 estudos cada
  - Total de estudos no sistema: 90 estudos científicos
  - Média de 3.0 estudos por nutracêutico
  - 93 associações nutracêutico-estudo criadas
  - Relevância média: 5.0/5 (todos os estudos veterinários de alta qualidade)
- ✅ **Cobertura de condições veterinárias**:
  - Osteoartrite e mobilidade: 12 estudos
  - Cardioproteção e cardiomiopatias: 11 estudos
  - Imunomodulação e resposta vacinal: 9 estudos
  - Doença renal crônica: 6 estudos
  - IBD e saúde gastrointestinal: 8 estudos
  - Função cognitiva e neuropatias: 7 estudos
  - Câncer e senolíticos: 5 estudos
  - Hepatoproteção: 6 estudos
  - Dermatite atópica: 4 estudos
  - Longevidade e sarcopenia: 6 estudos

### Fixed
- ✅ Corrigida contagem de estudos científicos (usava números fictícios 150-300, agora usa dados reais do banco)
- ✅ Estudos associados agora aparecem corretamente na interface expandida de nutracêuticos
- ✅ Substituídos 15+ textos hardcoded por traduções completas (PT/EN) em componentes de tabelas
- ✅ Removida função `getRealisticStudyCount` que gerava contagens fictícias
- ✅ Melhorado mapeamento de dados para garantir consistência entre `studies` e `nutraceutical_studies`

### Added
- ✅ Sistema completo de gerenciamento de estudos científicos
- ✅ Componente StudyCard com informações enriquecidas (ano, autores, DOI, abstract, escala visual de relevância)
- ✅ Componente EditRelevanceDialog para ajustar scores de relevância (1-5 com descrições detalhadas)
- ✅ Componente StudyDetailModal para preview detalhado de estudos (abstracts PT/EN, autores, nutracêuticos relacionados)
- ✅ 18 estudos científicos-chave para os 8 novos nutracêuticos (Espermidina, NMN, Urolitina A, Fisetina, PQQ, Berberina, DHA, Boswellia)
- ✅ Sistema de busca e filtragem de estudos por título, journal e autores
- ✅ Validações robustas para associações (existência de estudo, duplicação)
- ✅ Escala visual de relevância nos cards (5 barras coloridas)
- ✅ Links externos para DOI e estudos completos
- ✅ Query dinâmica para nutracêuticos relacionados a cada estudo

### Changed
- ✅ Melhorado feedback visual durante salvamento de associações (loading states)
- ✅ Expandida exibição de informações de estudos relacionados (de 3 campos para 9 campos)
- ✅ StudiesTab agora exibe contador de resultados de busca

### Technical
- ✅ Adicionados queries para buscar nutracêuticos relacionados a um estudo via JOIN
- ✅ Implementada lógica de edição inline de relevância com UPDATE direto
- ✅ Otimizado carregamento de relações estudo-nutracêutico
- ✅ Base científica robusta: 18 estudos em journals tier-1 (Nature, Science, Cell Metabolism, JACC)
- ✅ Relevância média: 4.8/5 (95% dos estudos com score ≥4)

### Added
- ✅ Tab unificada "Nutracêuticos" com 3 sub-tabs (Catálogo, Relações, Matriz)
- ✅ Nova tab "Alvos Veterinários" para gerenciamento completo de Health Conditions
- ✅ CRUD completo para Health Conditions (criar, editar, deletar com confirmação)
- ✅ Componentes VeterinaryTargetsHeader, VeterinaryTargetsStats, VeterinaryTargetsTable, VeterinaryTargetCRUDDialog
- ✅ Filtros avançados por categoria e severidade em Alvos Veterinários
- ✅ Traduções bilíngues completas (PT/EN) para todas as novas funcionalidades
- ✅ Sistema de tabs interno para organização de funcionalidades de nutracêuticos

### Changed
- ✅ Reorganização completa da estrutura do sidebar Knowledge Base
- ✅ Unificação de tabs "Nutracêuticos" e "Banco de Nutracêuticos" em uma única tab unificada
- ✅ Atualização do `admin-tabs.ts` removendo tabs redundantes e adicionando novas
- ✅ Atualização do `KnowledgeBaseGroup.tsx` com nova estrutura de menu
- ✅ Incremento da versão do i18n para 1.1.0 (force reload de traduções)
- ✅ Total de tabs Knowledge Base: 8 → 6 tabs (eliminação de redundância)

### Removed
- ✅ Removida tab "Database Migrations" do sidebar
- ✅ Removida tab "Banco de Nutracêuticos" (agora sub-tab "Catálogo")
- ✅ Removida tab "Regras Clínicas" (funcionalidade pouco utilizada)
- ✅ Removida tab "Análise de Microbioma" (demo não essencial)

### Fixed
- ✅ Implementada lógica completa de limpeza de dados no hook `useDataManagement` (função `cleanSeedData` agora funcional)
- ✅ Adicionados toasts de feedback (sucesso/erro) na função cleanSeedData para melhor UX
- ✅ Nova tab administrativa "Análise de Microbioma" no grupo Knowledge Base (funcionalidade mockada para demonstração)
- Sistema de versionamento semântico para documentação
- Headers de versão em todos os arquivos de documentação

### Changed
- Total de tabs administrativas: 27 → 28 tabs
- Grupo Knowledge Base: 7 → 8 tabs

### Fixed
- ✅ **CRÍTICO:** Corrigida duplicação da chave `admin.settings` em arquivos de tradução PT/EN
- ✅ Mesclada estrutura `admin.settings.knowledgeBase` com `admin.settings.general/data/messages`
- ✅ Incrementada versão i18n para 1.0.15 (force reload total do cache)
- ✅ Implementado desenvolvimento bilíngue obrigatório no `DataManagementPanel` (39 textos traduzidos PT/EN)
- ✅ Implementado desenvolvimento bilíngue obrigatório no `KnowledgeBaseSettingsTab` (6 textos traduzidos PT/EN)
- ✅ Adicionada estrutura completa `dataManagement` com 39 chaves em `pt/translation.json` e `en/translation.json`
- ✅ Adicionada estrutura completa `admin.settings.knowledgeBase` com 6 chaves em ambos arquivos de tradução
- ✅ Todos os textos hardcoded substituídos por chamadas `t()` com `useTranslation` hook

---

## [1.0.0] - 2025-11-10

### Added
- ✅ **Documentação Completa do Projeto**
  - Criado `ARCHITECTURE.md` com arquitetura técnica, modelo de dados, navegação e padrões
  - Criado `docs/STANFORD_DEMO.md` com estratégia de demo e funcionalidades prioritárias
  - Criado `docs/CURRENT_STATE.md` com estado atual (funcionalidades reais vs mockadas)
  - Adicionado sistema de versionamento semântico (MAJOR.MINOR.PATCH)
  - Adicionado `CHANGELOG.md` para histórico de mudanças

- ✅ **Sistema Administrativo**
  - 27 tabs administrativas organizadas em 5 grupos principais:
    - Knowledge Base (5 tabs)
    - Data Processing (6 tabs)
    - Research & Development (8 tabs)
    - Predictive Analysis (5 tabs)
    - Configuration (3 tabs)
  - Sistema de lazy loading para otimização de performance
  - Breadcrumb navigation para melhor UX

- ✅ **Backend Supabase**
  - Tabelas principais: `nutraceuticals`, `health_conditions`, `scientific_studies`, `nutraceutical_outcomes`
  - Tabelas de relacionamento: `health_condition_correlations`, `nutraceutical_health_conditions`
  - Tabelas de configuração: `research_sources`, `data_sources`, `user_feedback`
  - Storage buckets: `studies-pdfs`, `nutraceutical-images`, `pet-images`
  - Edge Functions: `ntai-process-study`
  - Row Level Security (RLS) habilitado em todas as tabelas

- ✅ **Frontend React**
  - React 18.3 + TypeScript + Vite
  - Sistema de design com Tailwind CSS e shadcn-ui
  - Visualizações avançadas: Recharts, Nivo, vis-network
  - Framer Motion para animações
  - React Query para gerenciamento de estado assíncrono
  - Modularização completa de serviços (NutraceuticalsService, etc.)

- ✅ **Internacionalização**
  - Sistema bilíngue completo (PT/EN)
  - i18next + react-i18next
  - Traduções completas em todos os componentes
  - Detecção automática de idioma do navegador
  - Versioning system para cache invalidation

- ✅ **Autenticação e Autorização**
  - Supabase Auth com email/password
  - Controle de acesso baseado em roles (Admin, Veterinário, Tutor)
  - Protected routes e role-based UI

- ✅ **Visualizações de Dados**
  - Gráficos de barra, linha, pizza (Recharts)
  - Heatmaps e gráficos radar (Nivo)
  - Grafos de relações interativos (vis-network)
  - Cards estatísticos e tabelas interativas
  - Sistema de drill-down para dados detalhados

### Mocked (Funcionalidades Simuladas)
- 🔶 **NTAI Processing**: Interface completa, mas sem integração real com OpenAI
- 🔶 **Predictive Models**: Visualizações prontas, mas modelos ML são simulados
- 🔶 **Longitudinal Studies**: Timeline visual criada, mas dados são mockados
- 🔶 **Combination Suggestions**: UI implementada, mas algoritmo não é real
- 🔶 **Correlation Discovery**: Heatmaps funcionais, mas correlações são pré-definidas

### Technical Debt
- 🔴 **Crítico**: Complexidade excessiva (27 tabs), features duplicadas
- 🟡 **Alto**: Excesso de dados mockados, modelos preditivos falsos
- 🟢 **Médio**: Integração incompleta (OpenAI não utilizado), queries não otimizadas
- 🔵 **Baixo**: Traduções incompletas, dark mode parcial

### Known Issues
- Edge Function `ntai-process-study` está configurada mas não utiliza OpenAI API
- Alguns componentes ainda têm textos hardcoded (não traduzidos)
- Dark mode não funciona perfeitamente em todos os componentes
- Performance pode degradar com muitos dados (falta paginação em algumas views)

---

## Formato de Versionamento

### MAJOR.MINOR.PATCH

- **MAJOR** (x.0.0): Mudanças incompatíveis com versões anteriores
  - Exemplos: Reescrita completa da arquitetura, mudança de framework, breaking changes na API
  
- **MINOR** (0.x.0): Adição de novas funcionalidades (compatível com versões anteriores)
  - Exemplos: Novas tabs, novos módulos, novos endpoints, novos gráficos
  
- **PATCH** (0.0.x): Correções de bugs e ajustes menores
  - Exemplos: Fix de bugs, ajustes de UI, correções de typos, otimizações de performance

---

## Convenções de Commit

Para facilitar a geração automática do changelog, use os seguintes prefixos:

- `feat:` - Nova funcionalidade (incrementa MINOR)
- `fix:` - Correção de bug (incrementa PATCH)
- `docs:` - Mudanças na documentação
- `style:` - Mudanças de formatação (não afetam código)
- `refactor:` - Refatoração de código (sem mudança funcional)
- `perf:` - Melhorias de performance
- `test:` - Adição/correção de testes
- `chore:` - Tarefas de manutenção

**Breaking changes**: Adicione `BREAKING CHANGE:` no corpo do commit (incrementa MAJOR)

---

## Links Úteis

- **Documentação do Projeto**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Plano de Demo Stanford**: [docs/STANFORD_DEMO.md](./docs/STANFORD_DEMO.md)
- **Estado Atual**: [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md)
- **Keep a Changelog**: https://keepachangelog.com/pt-BR/1.0.0/
- **Semantic Versioning**: https://semver.org/lang/pt-BR/
