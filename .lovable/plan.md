## Objetivo

Tornar a geração de cohort sintético mais transparente (logs no card de origem) e mais robusta (sem travas no último batch), com feedback claro de quais botões estão gerando vs. esperando.

## a) Log ao vivo no card de "Sugestões ativas" (e ocultar dos "Cohorts sintéticos" enquanto gera)

**`CohortAISuggester.tsx`**
- Ao clicar em "Gerar cohort", guardar `cohort_id` em `generatingCohortIds[idx] = cohortId` (não só `generating` index).
- Iniciar polling (a cada 3s) em `synthetic_cohorts` selecionando `status`, `generated_n`, `target_n`, `progress_log`, `generation_error` para os IDs ativos.
- Renderizar dentro do card da sugestão:
  - Barra de progresso `generated_n / target_n`.
  - Painel colapsável "Log de execução (N)" igual ao do manager (componente extraído `<CohortProgressLog />` reutilizável).
  - Mensagem final: "Concluído · N pets prontos · ver em Cohorts sintéticos" com link de tab.
- Parar polling quando status vir a `ready` ou `failed`.

**`SyntheticCohortsManager.tsx`**
- Por padrão filtrar fora `status === 'generating'` da listagem ("Aparecerá aqui quando a geração terminar").
- Adicionar toggle "Mostrar em geração" para o Arquiteto, caso queira inspecionar.
- Remover o log inline dos cards `generating` (já fica no Suggester); manter para `failed`/`ready` (auditoria).

## b) Estado de botões: "Gerando" / "Em espera"

No `CohortAISuggester`:
- `anyGenerating = generatingCohortIds.some(Boolean)`.
- Botão "Gerar cohort" do card ativo: spinner + label "Gerando batch X/Y".
- Botões "Gerar cohort" dos outros cards: `disabled`, label "Em espera" (tooltip: "Aguardando o cohort atual terminar").
- "Pré-preencher" continua liberado.
- "Gerar 5 sugestões" também fica desabilitado durante geração ativa (evita reset de IDs).

## c) Travamento no último batch

Causa provável: chamada ao LLM sem timeout — se o gateway demora ou retorna stream parcial, o `await callLLM` fica pendurado e a função nunca avança/finaliza. Correções no `generate-synthetic-cohort/index.ts`:

1. **Timeout por batch**: envolver `callLLM` com `AbortController` (90s). Em timeout, logar `warn`, fazer 1 retry; se falhar, marcar batch como pulado e seguir.
2. **Retry com backoff** (até 2 tentativas) para erros 429/5xx do gateway.
3. **Heartbeat de progresso**: antes de cada `fetch` ao LLM, atualizar `synthetic_cohorts.last_heartbeat_at = now()` (nova coluna). Permite o cliente detectar "stalled > 3min" e oferecer botão "Marcar como falho e finalizar".
4. **Finalização garantida**: mover o `update({ status: 'ready' })` para um `finally` que sempre roda, mesmo que algum batch jogue. Se `generated >= targetN * 0.8`, marca `ready`; senão `failed` com mensagem.
5. **Pequena pausa entre batches** (300ms) para evitar rate-limit no gateway.

## Migração

```sql
ALTER TABLE public.synthetic_cohorts
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;
```

## UI auxiliar

- Novo componente `src/components/administrador/priorizacoes/CohortProgressLog.tsx` — usado pelo Suggester e (em modo auditoria) pelo Manager.
- Botão "Forçar finalização" no card do Suggester aparece se `now() - last_heartbeat_at > 180s` e status ainda `generating` — chama uma nova action no edge (`finalize-stalled-cohort`) que seta `status='failed'` com nota "Travado · finalizado manualmente".

## Arquivos afetados

- `supabase/functions/generate-synthetic-cohort/index.ts` (timeout + retry + heartbeat + finally)
- `supabase/functions/finalize-stalled-cohort/index.ts` (novo)
- `supabase/migrations/<novo>.sql` (coluna heartbeat)
- `src/components/administrador/priorizacoes/CohortAISuggester.tsx` (polling, log inline, estados de botão)
- `src/components/administrador/priorizacoes/SyntheticCohortsManager.tsx` (esconder `generating` por padrão)
- `src/components/administrador/priorizacoes/CohortProgressLog.tsx` (novo, compartilhado)
- `src/i18n.ts` (+ chaves PT/EN para "Em espera", "Gerando batch X/Y", "Forçar finalização", "Mostrar em geração")
- `CHANGELOG.md` + `projectOrganograma.ts` (entrada da mudança)
