# Plano Fase 2: Edição, Testes e Roteamento

Fase 1 entregou registro declarativo + painel read-only. Fase 2 adiciona **edição de prompts por (tarefa × modelo)**, **caixa de testes lado a lado** com o AI Gateway real, **trocar o modelo ativo de uma tarefa** e o **roteador backend** que cada edge function passa a consumir — sem quebrar nada existente.

## O que muda para o usuário

No painel "Modelos & Prompts por Tarefa", cada card de tarefa ganha 3 abas:

- **Prompt** — editor com syntax highlighting de segmentos `model-specific` (ex.: `<thinking>`, `reasoning_effort`, blocos de caching). Permite criar nova versão, marcá-la como ativa e fazer rollback. Histórico de versões visível.
- **Modelo** — cards comparativos dos `candidate_models` com chips de capacidades, custo relativo, latência. Botão "Definir como ativo" grava override em `ai_configurations.ai_model_<task_id>`.
- **Testar** — input livre, dispara o prompt ativo contra o modelo ativo via nova edge function `ai-task-test`, mostra latência, tokens, custo estimado e saída. Pode rodar 2 modelos lado a lado. Resultados gravados em `ai_prompt_test_runs`.

## Arquitetura técnica

### 1. Helper `getModelForTask` em edge functions

`supabase/functions/_shared/ai-task-router.ts` — novo arquivo (compartilhado via `import` relativo `../_shared/...`). Expõe:

```text
resolveTask(taskId, supabaseClient) -> {
  model, routing, systemPrompt, userPromptTemplate, version, source: 'db' | 'config'
}
```

Estratégia:
1. Lê `ai_prompt_versions` (task_id, is_active=true) → se existir, usa esse prompt.
2. Lê override em `ai_configurations` (`ai_model_<task_id>`) → se existir, troca o modelo.
3. Cai no default do registro estático (`AI_TASKS`) embutido como JSON no arquivo.

Edge functions migradas nesta fase (compatibilidade preservada — fallback ao comportamento antigo se a tabela estiver vazia):
- `extract-meta-study` → `meta_study_analysis`
- `chat` → `clinical_chat_factual` (default)
- `relations-auditor` → `relations_auditor`

### 2. Nova edge function `ai-task-test`

`supabase/functions/ai-task-test/index.ts` — recebe `{ task_id, model_id (opcional), prompt_version_id (opcional), input }`. Chama AI Gateway, mede latência/tokens, grava em `ai_prompt_test_runs` e devolve `{ output, latency_ms, tokens_in, tokens_out, cost_estimate }`. Restrito a admin (`verify_jwt = true` + checagem de role).

### 3. UI nova

- `TaskPromptEditor.tsx` — Textarea com `<HighlightedPrompt>` overlay simples (regex destaca `<thinking>`, `reasoning_effort`, `context_caching`, blocos `===` etc.). Botões: Salvar nova versão, Ativar, Rollback.
- `TaskModelSwitcher.tsx` — Grid de cards comparativos dos `candidate_models`. Botão "Definir como ativo".
- `TaskTestBox.tsx` — 2 painéis lado a lado (Modelo A / Modelo B), input compartilhado, run paralelo, mostra diff de saída.
- `TaskHistoryPanel.tsx` — lista as últimas 20 execuções de `ai_prompt_test_runs` para a tarefa.
- Reorganiza `TaskModelGovernancePanel` para abrir um Sheet/Dialog detalhado ao clicar numa tarefa, com as 4 sub-abas acima. O acordeão atual continua funcionando.

### 4. Hooks

- `useCreatePromptVersion(taskId, modelId)` — insert em `ai_prompt_versions`, invalida cache.
- `useActivatePromptVersion(versionId)` — marca `is_active=true` e desativa as outras da mesma `(task_id, model_id)`.
- `useTaskTestRun()` — `supabase.functions.invoke('ai-task-test', ...)`.
- `useTaskTestHistory(taskId)` — read de `ai_prompt_test_runs`.

### 5. Migration

Nada estrutural — tabelas já existem desde a Fase 1. Adiciona apenas:
- Trigger `ai_prompt_versions_only_one_active` — garante 1 ativa por `(task_id, model_id)`.
- Index em `ai_prompt_test_runs(task_id, created_at desc)`.

### 6. i18n

Incrementa `I18N_VERSION` para `1.95.0`. Adiciona chaves PT/EN sob `aiGovernance.editor.*`, `aiGovernance.test.*`, `aiGovernance.switcher.*`.

### 7. Governança / docs

- `CHANGELOG.md` entrada nova em `[Unreleased]` com tag `area: ai-governance · status: shipped · i18n: yes`.
- `npm run sync:changelog`.
- `projectOrganograma.ts`: atualiza sub-aba para refletir as novas capacidades.
- Memória nova `mem://architecture/ai-task-prompt-governance-phase2`.

## Validação obrigatória antes de fechar

1. Build `tsc --noEmit` limpo.
2. Lint nas funções novas via `supabase--linter`.
3. Teste manual da edge function `ai-task-test` via `supabase--test_edge_functions` com 2 modelos diferentes para `meta_study_analysis`.
4. Verificar no preview que abrir o painel não quebra a tela atual (read-only continua funcionando).
5. Confirmar que `extract-meta-study` ainda funciona com payload antigo (fallback).

## Riscos

- **Override do modelo via `ai_configurations`** pode conflitar com chaves legadas (`ai_model_extraction`). Mitigação: prefixo único `ai_model_task_<task_id>`.
- **Trigger de single-active** precisa cuidar de upsert concorrente. Mitigação: `BEGIN/COMMIT` na função RPC `activate_prompt_version`.
- **Custo dos testes** — limitar `ai-task-test` a 4 req/min por admin (rate limit em memória).


Construir um centro de comando único onde cada tarefa de IA do sistema declara explicitamente: (1) qual modelo está rodando, (2) quais modelos são alternativas válidas com seus trade-offs, (3) qual prompt está ativo (otimizado para o modelo escolhido), (4) variantes de prompt versionadas com testes inline, e (5) sugestões automáticas de modelos novos/atualizados.

## Escopo

Substituir o atual `AIModelSelector` (lista plana de 4 tarefas) por uma arquitetura **Tarefa → Modelo → Prompt** com versionamento, testes A/B e radar de novos modelos. Tudo dentro de `Administrador > Configurações`.

## O que muda para o usuário

Uma nova aba **"Modelos & Prompts por Tarefa"** com:

- **Catálogo de tarefas** agrupado por família (Extração de Estudos, Meta-análise, Chat Clínico, Tradução, Embeddings, Auditoria de Relações, Gap-fill, Sync Neo4j).
- Para cada tarefa: card mostrando **modelo atual**, **prompt ativo destacado** (highlighting das instruções otimizadas para aquele modelo), botão **"Testar"** com input livre, e histórico de versões de prompt.
- **Seletor de modelo** por tarefa com 3-5 opções curadas, cada uma com chips de característica (latência, custo relativo, raciocínio, contexto, multimodal).
- **Radar de novos modelos**: painel semanal que compara catálogo atual com o que está disponível no Lovable AI Gateway + provedores diretos, e sugere upgrades com justificativa.
- **Origem do modelo** visível: badge "via Lovable AI" ou "API direta (OpenAI/Google)" — preparando o terreno para futura migração.

## Arquitetura técnica

### 1. Registro declarativo de tarefas (`src/config/ai-tasks.ts`)

Fonte única da verdade. Cada tarefa declara:

```text
{
  id: 'meta_study_analysis',
  family: 'meta_analysis',
  label: { pt: 'Meta-análise cross-estudos', en: '...' },
  edgeFunctions: ['extract-meta-study'],
  candidateModels: [
    { id: 'openai/gpt-5.4', via: 'lovable_ai', reasoning: 'high',
      strengths: ['contradiction_detection','symbolic_reasoning'],
      tradeoffs: ['cost_high'], recommended: true },
    { id: 'google/gemini-2.5-pro', via: 'lovable_ai',
      strengths: ['long_context_2M','multimodal_pdf'] },
  ],
  defaultModel: 'openai/gpt-5.4',
  promptKeys: ['prompt_meta_study_system','prompt_meta_study_user'],
}
```

Famílias previstas (consolidando o que já existe): `extraction_stage1/2/3`, `triplet_extraction`, `meta_study_analysis`, `clinical_chat_factual`, `clinical_chat_critical`, `relations_auditor`, `translation`, `embeddings`, `kg_gap_fill`, `geroprotector_stack`, `treatment_proposal_12m`, `lab_driven_adjustment`.

### 2. Novas tabelas

```text
ai_prompt_versions
  id, task_id, model_id, version, content (jsonb: {system,user}),
  optimized_for_model bool, optimization_notes text,
  highlighted_segments jsonb (trechos marcados como model-specific),
  is_active bool, created_by, created_at

ai_prompt_test_runs
  id, task_id, prompt_version_id, model_id, input, output,
  latency_ms, tokens_in, tokens_out, cost_estimate, run_by, created_at

ai_model_radar
  id, provider, model_id, discovered_at, capabilities jsonb,
  context_window, pricing jsonb, suggested_for_tasks text[],
  status ('new'|'review'|'adopted'|'dismissed'),
  recommendation_note, dismissed_reason
```

Modelos atuais por tarefa continuam em `ai_configurations` (`ai_model_<task>`), alimentados pelo registro declarativo.

### 3. Otimização de prompts por modelo

Para cada `(task, model)` é possível guardar uma variante distinta. O editor destaca em cor diferente os blocos marcados como "model-specific" (ex.: tags de thinking para GPT-5.4, instruções de reasoning effort, formatação de tools para Gemini). Quando o admin troca o modelo, o sistema:

1. Procura prompt ativo para `(task, novo_model)`.
2. Se não existir, propõe migrar o prompt atual e marca segmentos potencialmente sub-ótimos com aviso.
3. Admin pode aceitar, editar manualmente ou gerar variante via IA (`gpt-5.4` reescrevendo o prompt otimizado para o modelo alvo).

### 4. Caixa de testes inline

Cada card de tarefa tem aba "Testar": input → executa `prompt_atual + modelo_atual` vs `prompt_anterior + modelo_atual` lado a lado, mostra latência, tokens, custo estimado e diff de saída. Resultados gravados em `ai_prompt_test_runs`.

### 5. Radar de novos modelos

Edge function `ai-model-radar` (cron semanal):

- Consulta catálogo do Lovable AI Gateway (lista versionada + `provider-health`).
- Quando aparece modelo novo, usa `gpt-5.4` reasoning=high para classificar capacidades e sugerir em quais tarefas ele superaria o modelo atual.
- Grava em `ai_model_radar` com status `new`. UI mostra badge no menu Administrador.
- Admin revisa, marca `adopted` (cria entrada em `candidateModels` da tarefa) ou `dismissed` com justificativa.

### 6. Roteamento em runtime

Novo helper `getModelForTask(taskId)` em `supabase/functions/_shared/ai-task-router.ts`:

- Lê override de `ai_configurations` → fallback no `defaultModel` do registro.
- Retorna `{ model, via, reasoning?, promptSystem, promptUser, headers }`.
- Edge functions (`extract-meta-study`, `chat`, `relations-auditor`, etc.) passam a usar esse helper — mudança backward-compatible.

### 7. Preparação para APIs diretas

Cada candidato tem `via: 'lovable_ai' | 'openai_direct' | 'google_direct' | 'anthropic_direct'`. Hoje só `lovable_ai` está habilitado. Quando o admin alternar, o roteador escolhe a chave correta (`OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` já existem). Sem mudar essa fase agora — só deixar a porta aberta.

## Fases de entrega

**Fase 1 — Fundação (sem quebrar nada existente)**
- `src/config/ai-tasks.ts` declarativo cobrindo as ~12 famílias.
- Migration: tabelas `ai_prompt_versions`, `ai_prompt_test_runs`, `ai_model_radar` + RLS admin-only.
- Seed: importar prompts atuais de `ai_configurations` como `version 1, is_active=true`.
- Nova aba "Modelos & Prompts por Tarefa" mostrando o que existe hoje, agrupado por família, com modelo ativo e prompt destacado.

**Fase 2 — Edição e testes**
- Editor de prompt com highlighting de segmentos model-specific.
- Seletor de modelo por tarefa com cards comparativos.
- Caixa de testes inline com diff lado a lado.
- Migrar `extract-meta-study`, `chat`, `relations-auditor`, `extract-study-entities` para o roteador.

**Fase 3 — Radar automático**
- Edge function `ai-model-radar` + cron semanal.
- UI de revisão com aceitar/dispensar.
- Notificação no menu Admin quando houver novidades.

## Detalhes técnicos relevantes

- **Modelos recomendados iniciais por família** (alinhado com a análise prévia):
  - `meta_study_analysis` → `openai/gpt-5.4` reasoning=high
  - `clinical_chat_factual` → `google/gemini-2.5-pro` + context caching
  - `clinical_chat_critical` → `openai/gpt-5.4` reasoning=high
  - `extraction_stage1/2/3` → `google/gemini-2.5-pro` (multimodal PDF + 2M ctx)
  - `triplet_extraction` → `google/gemini-2.5-pro`
  - `translation` → `google/gemini-2.5-flash`
  - `embeddings` → `gemini-embedding-001@768d` (sem mudança)
  - `relations_auditor` → `openai/gpt-5.4` reasoning=medium
  - `kg_gap_fill` → `google/gemini-2.5-pro`

- **i18n**: incrementar `I18N_VERSION` e adicionar chaves PT/EN para toda a nova UI.
- **Organograma/Memory**: atualizar `projectOrganograma.ts` com a nova sub-aba, criar memória `mem://architecture/ai-task-model-prompt-governance`, registrar no `CHANGELOG.md` e rodar `npm run sync:changelog`.
- **Sem mocks**: radar usa dados reais; se a consulta falhar mostra "última varredura: X" e botão de retry.
- **Backward compatibility**: chaves `ai_model_<task>` em `ai_configurations` permanecem como override. Edge functions antigas continuam funcionando até serem migradas.

## Riscos e mitigação

- **Drift de prompt hard-coded em edge functions** → teste que falha se uma edge function referenciar prompt fora do registro (Fase 2).
- **Custo do radar com gpt-5.4 semanal** → limitar a 10 modelos novos por execução e cachear classificações.
- **Quebra ao migrar prompts** → Fase 1 é read-only; nada é reescrito até o admin salvar nova versão.

## Pergunta aberta

Implementar as 3 fases em sequência neste mesmo loop (mais demorado, entrega completa) ou parar após Fase 1 para você validar a estrutura antes de avançar?