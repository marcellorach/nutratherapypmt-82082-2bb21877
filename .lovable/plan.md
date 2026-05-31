## Objetivo

Hoje a barra mostra só "Bloco 5/15 — AI Scientist · 36%" e fica parada se um bloco travar (timeout do LLM, rate limit, erro silencioso). Vamos adicionar:

1. **Log ao vivo** do que a edge function está fazendo, visível na UI em tempo real.
2. **Watchdog autônomo** que detecta travamento e age sozinho (retry → pular bloco → finalizar com warnings) sem precisar do usuário clicar em nada.

## 1. Log estruturado persistido

### Nova coluna em `technical_audits`
```sql
ALTER TABLE technical_audits
  ADD COLUMN progress_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN last_heartbeat timestamptz;
```

Cada entrada do log:
```ts
{ ts: ISO, level: 'info'|'warn'|'error', phase: 'outline'|'block'|'cierre'|'validate'|'save'|'watchdog',
  block_id?: string, message: string, duration_ms?: number, attempt?: number }
```

### Edge function `generate-audit`
- Helper `pushLog(entry)` → `UPDATE technical_audits SET progress_log = progress_log || $1, last_heartbeat = now() WHERE id=$2`.
- Chamado em cada transição relevante: início/fim de outline, início/fim de cada bloco (com `duration_ms`), retries, validação, salvamento, erros capturados.
- `last_heartbeat` atualizado também a cada ~5s dentro de blocos longos (via `setInterval` antes da chamada ao LLM, limpo no fim).

## 2. Painel de log ao vivo na UI

Em `TechnicalAuditsTab.tsx`, dentro do card de progresso já existente:
- Nova seção colapsável **"Log da geração"** (aberta por padrão durante `processing`).
- Lista invertida das últimas ~30 entradas com ícone por `level`, timestamp relativo ("há 4s"), e badge da fase.
- Polling existente (2s) já traz `progress_log` — só renderizar.
- Indicador "Última atividade: há Xs" baseado em `last_heartbeat`; fica âmbar > 30s, vermelho > 90s.

## 3. Watchdog anti-travamento (autônomo)

### 3a. Dentro da própria edge function (watchdog local)
- Cada chamada ao LLM envolvida em `Promise.race([call, timeout(90s)])`.
- Em timeout/erro: log `warn` + retry automático (até 2x, backoff 5s/15s).
- Se 3 tentativas falharem no mesmo bloco:
  - Log `error` + marca o bloco como `skipped` no `outline`.
  - Continua para o próximo bloco em vez de quebrar tudo.
- No fim, se houver blocos `skipped`, status final = `ready_with_warnings` com lista dos blocos pulados.

### 3b. Watchdog externo (cron) para travas duras
Nova edge function `audit-watchdog` agendada via `pg_cron` a cada 1 min:
```sql
select cron.schedule('audit-watchdog', '* * * * *',
  $$ select net.http_post('<project>/functions/v1/audit-watchdog', ...) $$);
```
Lógica:
- Busca auditorias com `status='processing'` e `last_heartbeat < now() - interval '3 minutes'`.
- Para cada uma:
  - Log `watchdog: heartbeat perdido há Xs, tentando retomar`.
  - Reinvoca `generate-audit` em modo `resume` (usa `outline` salvo, retoma do próximo bloco pendente).
  - Se já foi retomada 2x sem progresso, marca como `failed` com erro claro e libera a UI.

### 3c. Botão manual (fallback)
Mantém o botão "Retomar do último bloco" já planejado, mas agora ele é o último recurso — o watchdog deve resolver sozinho na maioria dos casos.

## 4. Arquivos afetados

```text
supabase/migrations/<ts>_audit_progress_log_and_heartbeat.sql      (novo)
supabase/functions/generate-audit/index.ts                          (pushLog + race+retry+skip+resume)
supabase/functions/audit-watchdog/index.ts                          (novo)
supabase/config.toml                                                (registrar audit-watchdog se necessário)
src/components/administrador/audits/TechnicalAuditsTab.tsx          (painel de log + indicador de heartbeat)
src/integrations/supabase/types.ts                                  (regenerado pela migração)
```

## 5. Fora de escopo
- Reescrever o pipeline de geração (mantém outline → blocks → cierre).
- Mudar o checklist canônico ou o snapshot.
- UI fora do card de progresso.

Sigo?
