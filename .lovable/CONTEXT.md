# Project context briefing (auto)
Generated: 2026-05-21T23:28:53.250Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.97.0

## Changes by area (last 14 days)
- **admin**: 34
- **vet-ui**: 16
- **tutor-ui**: 9
- **meta**: 5
- **kg**: 5
- **curation**: 4
- **clinical-pipeline**: 4
- **i18n**: 1

## Top 10 recent entries
### 2026-05-21 · [meta] CHANGED — Consolidação Curadoria/KG no `ai-task-router` (relatório)
- Fechamento do ciclo de migração Curadoria/KG. Funções roteadas via `callAITask`: `kg-evidence-gap-fill` (`kg_gap_fill`), `extract-meta-study` (`meta_study_analysis`, caminho Google AI File API mantido fora do router), `extract-study-entities` (`extraction_stage1/2/3`, com `tools`+`tool_choice` e fallback `google/gemini-3-pro-preview` temp=0.1), `generate-triplets` (`triplet_extraction`, Phase 1 discovery + Phase 2 tool calling, resposta reconstruída para preservar parser downstream, tratamento 429/402 reintroduzido).
- `gemini-file-search` auditada e formalmente fora do escopo: usa Google AI Direct API com `fileData.fileUri` + corpora `file_search` nativos, incompatíveis com o Gateway.
- Estado final em `src/config/ai-tasks.ts`: 13 connected · 7 legacy · 3 planned (23 tasks). `lab_driven_adjustment` e `treatment_proposal_12m` respondem no router (healthcheck OK) mas seguem `planned` porque os consumidores clínicos ainda usam o caminho legado — alvo do próximo lote.
_files: src/config/ai-tasks.ts_

### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG: fechamento (gemini-file-search fica fora do router)
- `gemini-file-search` auditada: todas as chamadas LLM usam a Google AI Direct API (`generativelanguage.googleapis.com`) com `fileData.fileUri` referenciando arquivos da File API + corpora/file_search nativos. O Lovable Gateway não aceita esses URIs nem expõe File Search nativo, então a função permanece fora do escopo do router por design — análogo ao caminho Google AI File API do `extract-meta-study`. Sem mudanças de código.
- Healthcheck pós-migração (Curadoria/KG): `ai-task-healthcheck` retornou 8/8 OK — `extraction_stage1` (815ms), `extraction_stage2` (851ms), `extraction_stage3` (851ms), `triplet_extraction` (820ms), `relations_auditor` (2470ms), `geroprotector_stack` (812ms), `lab_driven_adjustment` (784ms), `treatment_proposal_12m` (864ms).
- Vitest: 94/94 passando (1 suite com falha pré-existente de `localStorage` em Node, alheia ao router).

### 2026-05-21 · [kg] CHANGED — Migração Curadoria/KG: generate-triplets no router
_status: parcial_
- `generate-triplets` (Phase 1 discovery por chunk + Phase 2 structuring com tool calling) migrada para `callAITask('triplet_extraction', ...)`. Phase 2 preserva `tools=[extractTripletsToolDef]` + `tool_choice` forçado; resposta reconstruída no shape `phase2Data.choices[0].message.{content, tool_calls}` para manter o parser downstream intacto. Tratamento de 429/402 reintroduzido a partir das mensagens de erro do router.
- Status reconciliado em `src/config/ai-tasks.ts`: `triplet_extraction` passa de `legacy` para `connected` (13 connected · 7 legacy · 3 planned).
- Smoke test: `ai-task-healthcheck {triplet_extraction}` → 200 OK (827 ms).
_files: src/config/ai-tasks.ts, supabase/functions/generate-triplets/index.ts_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.