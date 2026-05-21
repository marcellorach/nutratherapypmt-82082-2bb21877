# Governança de Modelos de IA — Implementação Completa (Fases 2.5 → 4)

## Objetivo

Garantir que o painel **"Modelos & Prompts por Tarefa"** (`/administrador?tab=config-ia`) seja a **única fonte da verdade** para qual modelo e qual prompt cada chamada de IA do sistema usa — sem precisar mexer em código nem fazer deploy. Inclui um **tutorial visual dentro do admin** explicando onde fica e como usar, para que qualquer pessoa do time (e a banca da Stanford) consiga entender em 60 segundos.

## Escopo (o que entra)

1. **Cobertura total** das ~25 edge functions que chamam IA hoje (não só 3).
2. **Router compartilhado** que toda função passa a usar.
3. **Badge "Conectado / Legacy / Planejado"** em cada task card para transparência.
4. **Nova aba `Tutorial`** dentro do admin com walkthrough passo-a-passo e screenshots anotados.
5. **Healthcheck automático** que roda 1×/dia e marca tasks cujo prompt/modelo ativo falha no Gateway.
6. **Smoke test end-to-end** antes de fechar cada fase.

## Fora de escopo

- Fase 3 radar (monitorar novos modelos OpenAI/Google automaticamente) — só deixamos o esqueleto da tabela.
- Chamar APIs dos provedores direto (sem Gateway).
- A/B testing automático em produção.

## Fase 2.5 — Router universal + cobertura completa

### 1. Router compartilhado

Criar `supabase/functions/_shared/ai-task-router.ts` com:

- `resolveTask(taskId)` → lê `ai_prompt_versions` (versão ativa) + `ai_configurations` (override de modelo) + fallback para `AI_TASKS` estático em `src/config/ai-tasks.ts`.
- `callAITask(taskId, { input, variables, overrides })` → executa a chamada ao Lovable AI Gateway já com prompt, modelo, `reasoning_effort`, `temperature`, e logging.
- Logging unificado em nova tabela `ai_task_invocations` (latência, tokens, custo, erro, função-origem).
- Cache in-memory de 30s para `resolveTask` (evita N reads por chamada).

### 2. Mapear cada edge function a um `task_id`

Adicionar em `src/config/ai-tasks.ts` as tasks que faltam (marcadas "novo"):

```text
chat                                -> clinical_chat_factual
document-chat                       -> clinical_chat_factual
extract-meta-study                  -> meta_study_analysis
extract-study-entities              -> extraction_stage1/2/3 (por estagio)
generate-triplets                   -> triplet_extraction
enrich-triplet                      -> triplet_enrichment       (novo)
gemini-file-search                  -> extraction_stage1
hybrid-recommendation               -> geroprotector_stack
project-pet-trajectory              -> trajectory_projection    (novo)
extract-pet-clinical-data           -> clinical_data_extraction (novo)
parse-pet-exam-pdf                  -> lab_pdf_parsing          (novo)
kg-evidence-gap-fill                -> kg_gap_fill              (novo)
relations-auditor                   -> relations_auditor
auto-tag-studies                    -> study_tagging            (novo)
translate-text                      -> translation_generic      (novo)
translate-conditions                -> translation_conditions   (novo)
translate-and-categorize-conditions -> translation_conditions
suggest-taxonomy-terms              -> taxonomy_suggestion      (novo)
web-dosage-lookup                   -> dosage_web_lookup        (novo)
enrich-pet-food-product             -> food_enrichment          (novo)
process-nutraceutical-spreadsheet   -> spreadsheet_enrichment   (novo)
vectorize-study                     -> embeddings_default       (categoria nova)
test-rag-similarity, provider-health -> (probes — pulam o router)
```

### 3. Migrar cada edge function

Trocar o `fetch` direto ao Gateway pela chamada `callAITask(taskId, ...)`. Manter o comportamento atual como fallback caso a task ainda não esteja semeada (zero quebra).

### 4. Semear prompts faltantes

Extrair o `systemPrompt`/`userPrompt` hardcoded atual de cada função e inserir em `ai_prompt_versions` como `version=1`, `is_active=true`, `source='migrated'`.

### 5. Badge de status no painel

Cada task card ganha:
- verde **"Conectado"** — função já usa o router e foi testada
- âmbar **"Legacy"** — task registrada mas função ainda não migrada
- cinza **"Planejado"** — task definida mas sem consumer ainda

## Fase 3 — Aba Tutorial dentro do Admin

Nova tab `tutorial-ia` em `src/config/admin-tabs.ts`, dentro do grupo **Sistema** (acima de Configuração IA). Conteúdo:

- **Onde fica**: screenshot anotado da sidebar mostrando "Sistema → Configuração IA → Modelos & Prompts por Tarefa".
- **Passo 1 — Visualizar**: o que cada coluna do card significa (modelo ativo, badge de prompt, consumidores, status).
- **Passo 2 — Trocar o modelo**: GIF mostrando clicar na task → aba Model → Set Active.
- **Passo 3 — Editar o prompt**: aba Prompt → escrever v2 → Salvar → Ativar (com explicação do destaque de comandos otimizados por modelo).
- **Passo 4 — Testar antes de ativar**: aba Test → side-by-side A/B com latência, custo e tokens.
- **Passo 5 — Ver histórico**: aba History (últimos 20 runs, erros destacados).
- **FAQ**: "Mudei o modelo e não vi efeito" → conferir badge "Conectado"; cache de 30s; etc.
- **Glossário**: `reasoning_effort`, `context_caching`, `prompt_version`, `task_id`.

Bilíngue PT/EN com `t()`. Bump `I18N_VERSION`.

## Fase 4 — Healthcheck automático

- Edge function `ai-task-healthcheck` (cron diário): para cada task ativa, roda input mínimo no modelo ativo. Se 4xx/5xx, marca `ai_task_status.last_error` e o painel mostra badge vermelho **"Falhando"**.
- Tabela `ai_task_status (task_id, last_run_at, last_latency_ms, last_error, ok)`.
- Card no topo do painel: "X de Y tarefas saudáveis".

## Validação por fase (obrigatória antes de avançar)

| Fase  | Smoke test                                                                                  |
|-------|---------------------------------------------------------------------------------------------|
| 2.5   | Para cada uma das ~25 funções: invoke real via `supabase--curl_edge_functions`, conferir log em `ai_task_invocations` e que o modelo usado bate com o ativo no painel. Trocar o modelo no painel, re-invocar, conferir que mudou. |
| 3     | Abrir a aba Tutorial em PT e EN; conferir que cada passo aponta para um elemento que existe.|
| 4     | Rodar healthcheck manual; forçar erro (modelo inválido em 1 task) e ver badge vermelho.     |

## Detalhes técnicos

### Tabelas novas

```sql
create table public.ai_task_invocations (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  model_id text not null,
  prompt_version_id uuid references public.ai_prompt_versions(id),
  caller_function text,
  latency_ms int,
  tokens_in int,
  tokens_out int,
  cost_estimate numeric,
  ok boolean not null default true,
  error text,
  created_at timestamptz default now()
);

create table public.ai_task_status (
  task_id text primary key,
  last_run_at timestamptz,
  last_latency_ms int,
  last_error text,
  ok boolean default true,
  updated_at timestamptz default now()
);
```

RLS: admin-only read; service role write.

### Não-quebra (garantia)

Toda edge function migrada mantém o `try/catch` antigo como fallback. Se `resolveTask` retornar `null`, usa o hardcoded de hoje. Zero regressão garantida.

## Esforço estimado

| Fase | Tempo  | Risco                       |
|------|--------|-----------------------------|
| 2.5  | médio (~25 funções, trabalho mecânico) | baixo (fallback preservado) |
| 3    | pequeno (UI estática + i18n)           | nenhum                      |
| 4    | pequeno (1 cron + 1 tabela + badges)   | baixo                       |

## É muito difícil?

Não. É **trabalho repetitivo, não conceitual** — o padrão já está definido (router + ai_prompt_versions + ai_configurations já existem). Cada função migrada são ~15 linhas alteradas mais um smoke test. O risco real é tempo, não complexidade. Por isso a estratégia de fallback: mesmo se algo for esquecido, o sistema continua funcionando com o comportamento antigo.

## Comunicação ao usuário

Ao final de cada fase: changelog + screenshot do estado novo + lista do que foi conectado vs legacy restante. Nada vai pra demo sem smoke test passando.
