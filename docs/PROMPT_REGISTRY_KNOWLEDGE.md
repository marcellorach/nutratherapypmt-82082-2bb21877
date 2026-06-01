# Knowledge File — Registro Único de Prompts & Telemetria de IA

> **Versão:** 1.0.0 · **Última Atualização:** 2026-06-01 · **Status da Migração:** ✅ 24/24 (100%)
>
> Documento de referência permanente para entender a arquitetura do registro
> unificado de system prompts, as decisões tomadas durante a migração
> (Sprints 1–5) e o checklist obrigatório para qualquer nova edge function
> ou alteração em prompt existente.

---

## 1. O que é o Registro Único de Prompts

Antes da migração, cada edge function carregava seu próprio system prompt
hardcoded no `index.ts`. Isso causava três problemas crônicos:

1. **Drift silencioso** — copiar/colar entre funções gerava versões divergentes do mesmo prompt.
2. **Sem governança** — admins não viam, comparavam ou editavam prompts sem patch de código.
3. **Sem telemetria** — impossível medir latência, custo ou taxa de erro por prompt.

O registro único resolve isso com **três camadas**:

```text
┌─────────────────────────────────────────────────────────────┐
│  MANIFESTO (código)                                         │
│  supabase/functions/_shared/system-prompts.ts               │
│  → fonte da verdade versionada em git, fallback final       │
└─────────────────────────────────────────────────────────────┘
              │ sincronizado via UI Admin
              ▼
┌─────────────────────────────────────────────────────────────┐
│  BANCO (governance)                                         │
│  public.ai_system_prompts (prompt_key, default_content,     │
│                            override_content, ...)           │
│  → admin pode sobrescrever sem deploy                       │
└─────────────────────────────────────────────────────────────┘
              │ resolvido em runtime
              ▼
┌─────────────────────────────────────────────────────────────┐
│  RUNTIME (edge function)                                    │
│  fetchSystemPrompt(KEY, SYSTEM_FALLBACK)                    │
│  → ordem: override_content → default_content → manifesto    │
│           → SYSTEM_FALLBACK verbatim (DB offline)           │
└─────────────────────────────────────────────────────────────┘
              │ cada chamada loga
              ▼
┌─────────────────────────────────────────────────────────────┐
│  TELEMETRIA                                                 │
│  public.ai_prompt_usage_log (prompt_key, function_name,     │
│  model, latency_ms, tokens_in/out, success, error)          │
│  → não-bloqueante, via REST + SERVICE_ROLE                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Arquivos

### 2.1 Shared helpers (`supabase/functions/_shared/`)

| Arquivo | Função |
|---|---|
| `system-prompts.ts` | Manifesto `SYSTEM_PROMPTS` + helpers `fetchSystemPrompt(key, fallback)` (REST, zero-dep) e `getSystemPrompt(supabase, key)` (com client). |
| `prompt-usage.ts` | `logPromptUsage(entry)` — telemetria não-bloqueante. Falhas são silenciosamente ignoradas para nunca derrubar a chamada principal. |
| `ai-task-router.ts` | Roteamento legado por task_id (mantido para compatibilidade do harness `ai-task-test`). |

### 2.2 Schema das tabelas de governance

```sql
-- Catálogo de prompts (fonte governada)
public.ai_system_prompts (
  prompt_key text PRIMARY KEY,
  default_content text,        -- espelho do manifesto (sync via UI)
  override_content text,       -- override do admin, tem precedência
  purpose, model_default, temperature, output_format,
  consumers text[], tags text[]
);

-- Telemetria de uso (1 row por chamada LLM)
public.ai_prompt_usage_log (
  prompt_key, function_name, model,
  latency_ms, tokens_in, tokens_out,
  success, error, created_at
);

-- Versões testáveis pelo admin (usado por ai-task-test)
public.ai_prompt_versions (task_id, model_id, system_prompt, user_prompt, is_active);
public.ai_prompt_test_runs (...);

-- Health-check por task
public.ai_task_status (task_id, last_run_at, last_latency_ms, ok, last_error);
```

---

## 3. Decisões Tomadas na Migração (Sprints 1–5)

### Decisão 1 — Fallback verbatim obrigatório em cada função

Cada função declara um `const SYSTEM_FALLBACK = "...verbatim original prompt..."`
passado como segundo argumento de `fetchSystemPrompt`. Razão: se o banco
ficar indisponível (rede, migração quebrada, RLS), a função **mantém
comportamento idêntico ao pré-migração** em vez de falhar ou rodar com
prompt vazio. Zero-downtime garantido.

### Decisão 2 — Helper zero-dependência (`fetch` puro)

`fetchSystemPrompt` usa REST API do Supabase com SERVICE_ROLE, sem
importar `@supabase/supabase-js`. Razão: reduzir cold-start de edge
functions que ainda não usam o SDK e evitar dependência circular.

### Decisão 3 — Telemetria não-bloqueante

`logPromptUsage` engole qualquer erro silenciosamente. Razão: telemetria
nunca deve degradar uma chamada de produção. Se o log falhar, perdemos
observabilidade daquela chamada — não a chamada em si.

### Decisão 4 — Harness `ai-task-test` permanece agnóstica do registro

`ai-task-test` testa prompts arbitrários que o admin digita ou seleciona
de `ai_prompt_versions`. Não migrou para `fetchSystemPrompt` porque seu
propósito é justamente comparar prompts livres. Recebeu apenas
`logPromptUsage` keyed pelo `task_id` testado, complementando o log
detalhado em `ai_prompt_test_runs`.

### Decisão 5 — Modelos e metadados documentados no manifesto

Cada entrada do `SYSTEM_PROMPTS` declara `model_default`, `temperature`,
`output_format` e `consumers`. Esses metadados aparecem na UI Admin e
são exportados no PDF de catálogo. Servem como documentação executável.

### Decisão 6 — `aiProcessor.ts` migrado mesmo sendo código órfão

O `process-nutraceutical-spreadsheet/aiProcessor.ts` não é referenciado
pelo `index.ts` atual, mas foi migrado para o registro mesmo assim.
Razão: centralizar 100% dos prompts evita ressurreição futura com
prompt stale; se o código for reativado, já estará governado.

### Decisão 7 — Naming convention `prompt_key`

Formato: `<snake_case_purpose>` (ex: `extract_pet_clinical_data`,
`check_cohort_originality_perplexity`, `kg_evidence_gap_fill`).
Quando uma função usa **múltiplos prompts**, sufixar com o papel
(`_query_builder`, `_perplexity`, `_gemini_fallback`).

### Decisão 8 — Sprints organizados por afinidade de domínio

| Sprint | Escopo | Funções |
|---|---|---|
| 1 | Clinical extraction & reasoning | extract-pet-clinical-data, condition-insights, project-pet-trajectory, parse-pet-exam-pdf, chat-pet-assistant, chat-proposal |
| 2 | KG enrichment & meta-studies | backfill-triplet-enrichment, enrich-triplet, enrich-knowledge-graph, chat-meta-study, evaluate-meta-study-reliability, kg-evidence-gap-fill |
| 3 | Perplexity trio + utilitários | query-perplexity, perplexity-health, web-dosage-lookup, enrich-pet-food-product, document-chat, suggest-taxonomy-terms |
| 4 | Cohorts | analyze-cohort-patterns, analyze-all-cohorts-patterns, check-cohort-originality, suggest-cohort-ideas, generate-synthetic-cohort, check-insight-originality |
| 5 | Infra & governance final | ai-task-healthcheck, ai-task-test, process-nutraceutical-spreadsheet/aiProcessor |

Razão: agrupar por domínio facilitou code review e permitiu testar
regressões por área (ex: pipeline clínico inteiro num sprint).

---

## 4. Padrão de Implementação (Template para Novas Funções)

Toda nova edge function que chama LLM **deve** seguir este template:

```ts
// supabase/functions/<nome>/index.ts
import { fetchSystemPrompt } from "../_shared/system-prompts.ts";
import { logPromptUsage } from "../_shared/prompt-usage.ts";

// 1. Fallback verbatim — cópia exata do prompt para zero-downtime se DB offline
const SYSTEM_FALLBACK = `Você é um especialista em ... (prompt completo aqui)`;

Deno.serve(async (req) => {
  // ... cors, auth, validação ...

  // 2. Resolver prompt via registro
  const systemPrompt = await fetchSystemPrompt("minha_funcao_key", SYSTEM_FALLBACK);

  // 3. Chamar LLM
  const t0 = Date.now();
  const model = "google/gemini-2.5-flash";
  let success = false;
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  let errorMsg: string | null = null;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
      }),
    });
    const data = await resp.json();
    tokensIn = data?.usage?.prompt_tokens ?? null;
    tokensOut = data?.usage?.completion_tokens ?? null;
    success = resp.ok;
    if (!resp.ok) errorMsg = `${resp.status}: ${(await resp.text()).slice(0, 240)}`;
    // ... processar resposta ...
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    // 4. Telemetria SEMPRE (sucesso ou falha)
    await logPromptUsage({
      prompt_key: "minha_funcao_key",
      function_name: "<nome>",
      model,
      latency_ms: Date.now() - t0,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      success,
      error: errorMsg,
    });
  }
});
```

E adicionar a entrada correspondente em `_shared/system-prompts.ts`:

```ts
minha_funcao_key: {
  purpose: 'O que esta função faz, em uma frase.',
  model_default: 'google/gemini-2.5-flash',
  temperature: 0.2,
  output_format: 'json',
  consumers: ['<nome>'],
  tags: ['clinical', 'extraction'],
  content: `Você é um especialista em ...`,
},
```

---

## 5. Checklist de Manutenção para Próximos Sprints

### 5.1 Ao criar uma NOVA edge function que chama LLM

- [ ] Adicionar entrada em `_shared/system-prompts.ts` com `prompt_key` em snake_case
- [ ] Preencher metadados: `purpose`, `model_default`, `temperature`, `output_format`, `consumers`, `tags`
- [ ] Declarar `SYSTEM_FALLBACK` verbatim no `index.ts`
- [ ] Usar `fetchSystemPrompt(KEY, SYSTEM_FALLBACK)` para resolver o prompt em runtime
- [ ] Chamar `logPromptUsage` em `finally` (cobrindo sucesso E erro)
- [ ] Rodar smoke test: `curl -X POST .../functions/v1/<nome>` com payload vazio → esperar 400 de validação
- [ ] Verificar no painel admin "AI Prompts" se a key apareceu após `Sincronizar com o código`
- [ ] Adicionar entrada estruturada no `CHANGELOG.md` (top de `[Unreleased]`) com `<!-- area: infra · status: entregue -->`
- [ ] Rodar `npm run sync:changelog`

### 5.2 Ao MODIFICAR um prompt existente

- [ ] **Decidir o canal:** mudança experimental → use `override_content` via UI Admin (sem deploy). Mudança definitiva → edite o manifesto e re-sincronize.
- [ ] Se editar manifesto: garantir que `SYSTEM_FALLBACK` na função consumer também seja atualizado (são gêmeos verbatim).
- [ ] Não alterar `prompt_key` (renomear quebra histórico em `ai_prompt_usage_log`). Para renomear, criar nova key e deprecar a antiga.
- [ ] Registrar mudança no `CHANGELOG.md` com diff resumido do prompt.
- [ ] Após deploy, monitorar `ai_prompt_usage_log` por 24h para detectar regressão de latência ou taxa de erro.

### 5.3 Ao ADICIONAR um novo modelo ou trocar provider

- [ ] Atualizar `model_default` da entrada afetada no manifesto.
- [ ] Se for OpenAI com custo conhecido, adicionar ao map `COST_PER_1K` em `ai-task-test/index.ts`.
- [ ] Validar via `ai-task-healthcheck` que o novo modelo responde "ok" antes de rotear tráfego real.
- [ ] Anotar tradeoffs (latência/custo/qualidade) no CHANGELOG.

### 5.4 Health-check periódico (mensal)

- [ ] Executar `POST /functions/v1/ai-task-healthcheck` (ou aguardar cron) e revisar `ai_task_status` no painel admin.
- [ ] Filtrar `ai_prompt_usage_log` por `success = false` nos últimos 30 dias e investigar top 3 prompts com mais falhas.
- [ ] Revisar prompts com `override_content` ativo por > 90 dias: ou promovê-los ao manifesto, ou removê-los.
- [ ] Verificar drift entre `SYSTEM_PROMPTS[key].content` (manifesto) e `default_content` (DB) — usar botão "Sincronizar com o código".

### 5.5 Ao DEPRECAR uma função

- [ ] Manter a entrada no manifesto com tag `['deprecated']` por pelo menos 1 release.
- [ ] Não remover a key de `ai_system_prompts` (preserva histórico de telemetria).
- [ ] Registrar deprecação no CHANGELOG com link para a função substituta.

---

## 6. Anti-Padrões Proibidos

| ❌ Não fazer | ✅ Fazer |
|---|---|
| Hardcode de system prompt no `index.ts` da função | `fetchSystemPrompt(KEY, FALLBACK)` |
| Esquecer o `SYSTEM_FALLBACK` verbatim | Sempre passar o segundo argumento (zero-downtime) |
| Loggar telemetria só no caminho de sucesso | Loggar em `finally` (sucesso E erro) |
| Renomear `prompt_key` para "limpar" naming | Criar nova key e deprecar a antiga |
| Editar `default_content` direto no DB | Editar manifesto + sincronizar via UI |
| Bloquear a request se `logPromptUsage` falhar | Telemetria é fire-and-forget |
| Criar prompts duplicados para variações pequenas | Parametrizar via user-message ou template |

---

## 7. Estado Final da Migração

- **Funções migradas:** 24/24 (100%)
- **Prompts no manifesto:** ~30 entries (algumas funções consomem múltiplos prompts)
- **Tabelas de governance:** `ai_system_prompts`, `ai_prompt_versions`, `ai_prompt_test_runs`, `ai_prompt_usage_log`, `ai_task_status`
- **Endpoints de observabilidade:** painel Admin → "Auditorias Técnicas" + tabs de System Prompts
- **Smoke test consolidado:** `ai-task-healthcheck` retorna `ok:true` para todas as 8 tasks ativas com latência média < 2s

---

## 8. Referências Cruzadas

- `CHANGELOG.md` — histórico completo dos sprints 1–5 (busque por "Sprint N")
- `ARCHITECTURE.md` — visão geral da arquitetura de edge functions
- `docs/TECHNICAL_DECISIONS.md` — outras decisões arquiteturais correlatas
- `supabase/functions/_shared/system-prompts.ts` — manifesto canônico
- `supabase/functions/_shared/prompt-usage.ts` — helper de telemetria
- UI Admin: `/administrador?tab=technical-audits` → System Prompts

---

_Última revisão: 2026-06-01 (fechamento da Sprint 5). Atualizar este documento sempre que o template do §4 ou o checklist do §5 mudar._
