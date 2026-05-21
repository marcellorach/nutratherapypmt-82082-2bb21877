# Project context briefing (auto)
Generated: 2026-05-21T23:19:19.175Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.97.0

## Changes by area (last 14 days)
- **admin**: 34
- **vet-ui**: 16
- **tutor-ui**: 9
- **meta**: 4
- **curation**: 4
- **clinical-pipeline**: 4
- **kg**: 3
- **i18n**: 1

## Top 10 recent entries
### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG (lote 3/3): extract-study-entities no router
_status: parcial_
- `extract-study-entities` (Stage 1 + Stage 2 + Stage 3 + extração de título) migrada para `callAITask` via `ai-task-router`. Helper `callLovableAI` agora recebe `taskId` e roteia respectivamente para `extraction_stage1`, `extraction_stage2`, `extraction_stage3` (título reusa `extraction_stage1`). Preserva `tools` + `tool_choice` forçado e fallback (`google/gemini-3-pro-preview`, temp=0.1).
- Status reconciliado em `src/config/ai-tasks.ts`: `extraction_stage1/2/3` passam de `legacy` para `connected` (12 connected · 8 legacy · 3 planned).
- Smoke test: `ai-task-healthcheck {extraction_stage1, extraction_stage2, extraction_stage3}` → 200 OK (825/910/781 ms).
_files: src/config/ai-tasks.ts, supabase/functions/extract-study-entities/index.ts_

### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG (lote 2/3): extract-meta-study no router
_status: parcial_
- `extract-meta-study` (caminho gateway) migrada para `callAITask('meta_study_analysis', ...)`, preservando `tools=[TOOL_V2]` + `tool_choice` forçado e fallback explícito (`google/gemini-3-pro-preview`, reasoning=high, temp=0.2). Caminho Google AI File API (PDFs > 7MB) mantido fora do router por usar `generativelanguage.googleapis.com` diretamente — fora do escopo do gateway.
- Erros do gateway são re-mapeados (`429`/`402`/`413`/`404`/`502`) com a mesma UX anterior (mensagens e `options[]` no payload de falha).
- Smoke test: `ai-task-healthcheck {meta_study_analysis}` → 200 OK em 907ms.
_files: supabase/functions/extract-meta-study/index.ts_

### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG (lote 1/3): kg-evidence-gap-fill plugada no router
_status: parcial_
- `kg-evidence-gap-fill` migrada para `callAITask('kg_gap_fill', ...)` preservando tool calling (`assess_evidence`) e fallback explícito para `google/gemini-3-flash-preview`. Troca de modelo no painel Governança IA agora afeta esta tarefa em runtime, e cada invocação é registrada em `ai_task_invocations` + `ai_task_status` com latência, tokens e custo estimado.
- Smoke test em produção: deploy + healthcheck POST `{task_ids:["kg_gap_fill"]}` → 200 OK em 870 ms.
- Status atualizado em `src/config/ai-tasks.ts`: `kg_gap_fill` agora `connected`. Real: 9 connected · 11 legacy · 3 planned.
_files: src/config/ai-tasks.ts, supabase/functions/kg-evidence-gap-fill/index.ts_

### 2026-05-21 · [admin] FIXED — Healthcheck IA validado em produção + reconciliação de status
- Smoke test do `ai-task-healthcheck` em produção: deploy + POST `{task_ids:["translation_conditions"]}` → 200 OK em 884 ms (`google/gemini-3-flash-preview`). Pipeline ponta-a-ponta validado (router resolve modelo + prompt ativo, grava em `ai_task_status`, retorna telemetria).
- Reconciliação `ai-tasks.ts`: `translation_conditions` marcado como `connected` (a função `translate-conditions` já chama `callAITask()` desde a Fase 2.5 — status estava desatualizado). Contagem real agora: 8 connected · 12 legacy · 3 planned.
- Files: src/config/ai-tasks.ts
_files: src/config/ai-tasks.ts_

### 2026-05-21 · [vet-ui] ADDED — Senex 6.0: skin anatômica em camadas completa + componente DogAnatomyLayered
- 4 novas camadas anatômicas geradas com Imagen premium em estilo ilustração científica clean (1024×768, PNG): `dog_digestive.png` (digestivo - estômago, intestinos, fígado), `dog_urinary.png` (rins + ureteres + bexiga), `dog_skeleton.png` (esqueleto completo lateral) e `dog_nervous.png` (cérebro + medula + nervos periféricos).
- Componente `DogAnatomyLayered` (`src/components/pet/DogAnatomyLayered.tsx`): viewer empilhado que faz cross-fade entre camadas via CSS opacity (500ms transition) sobre a silhueta base. API: `activeLayers={['cardio', 'urinary']}`, `layerOpacity`, `showLegend`. Sem dependências 3D — substituível por `react-three-fiber` na fase 6.1 sem mudar a API consumidora.
- Stack agora cobre os 6 sistemas mais usados no Gêmeo Digital (silhueta, cardio, digestivo, urinário, esquelético, nervoso). Próximos sistemas (endócrino/pâncreas, pele/pelo, linfático) ficam para 6.1 junto com o modo 3D opcional via Sketchfab CC-BY.
_files: src/components/pet/DogAnatomyLayered.tsx_

### 2026-05-21 · [admin] ADDED — Senex 6.0: Healthcheck de tarefas IA (Fase 4) + skin anatômica em camadas (primeira leva)
_status: parcial_
- Edge function `ai-task-healthcheck` (cron-ready, `verify_jwt=false` + `x-cron-secret` opcional): para cada tarefa com prompt ativo, pinga o modelo configurado no Lovable AI Gateway com prompt mínimo, mede latência e grava em `ai_task_status` (já existente). Suporta override por `task_ids[]` no body.
- Painel de Governança IA ganha banner "X de Y tarefas conectadas saudáveis · N falhando", botão Rodar healthcheck manual, badge vermelho Falhando (com erro no tooltip) e badge verde de latência em cada task card. Hooks `useAITaskStatus` + `useRunHealthcheck`.
- Skin anatômica em camadas (Gêmeo Digital) — primeira leva: silhueta canina lateral (`dog_silhouette.png`) e sistema cardio-respiratório (`dog_heart_lungs.png`) gerados com Imagen premium em estilo de ilustração científica clean (1536×1024 PNG transparente), salvos em `src/assets/anatomy/`. Próximas camadas (fígado/GI, rins/urinário, articulações, cérebro/espinha, pâncreas, pele/pelo) e o componente `DogAnatomyLayered` que faz cross-fade conforme doença ativa ficam para a próxima volta.
_files: supabase/functions/ai-task-healthcheck/index.ts, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx, src/hooks/useAITaskStatus.ts, .lovable/plan.md_

### 2026-05-21 · [admin] ADDED — Governança de IA: editor de prompts por modelo, troca de modelo e testes lado a lado (Fase 2)
- Edge function `ai-task-test` (admin-only, `verify_jwt=true`): executa um prompt × modelo contra o Lovable AI Gateway, mede latência, tokens e custo estimado e grava em `ai_prompt_test_runs`. Suporta substituição de `{{input}}` no user prompt e passagem de `reasoning_effort` / `temperature`.
- RPC `activate_ai_prompt_version` + trigger `trg_apv_single_active`: garantem que apenas uma versão fique ativa por `(task_id, model_id)`. Ativação atômica restrita a admins (SECURITY DEFINER + `is_admin()`).
- Componente `TaskDetailSheet`: sheet lateral com 4 abas (Prompt, Modelo, Testar, Histórico). Editor com highlighting heurístico de segmentos model-specific (`<thinking>`, `reasoning_effort`, `context_caching`, delimitadores `===`, templates `{{var}}`). Botões "Salvar nova versão" e "Ativar" usam a RPC. Aba Testar roda Modelo A vs B em paralelo e exibe latência/tokens/custo. Histórico mostra as últimas 20 execuções da tarefa.
_files: supabase/functions/ai-task-test/index.ts, src/components/administrador/configuracoes/TaskDetailSheet.tsx, src/components/administrador/configuracoes/TaskModelGovernancePanel.tsx, src/hooks/useAIPromptVersions.ts…_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.