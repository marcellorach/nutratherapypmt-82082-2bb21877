
## a) Log da auditoria truncado

**Diagnóstico:** Em `supabase/functions/generate-audit/index.ts` (linha 476), o endpoint de polling devolve apenas `log.slice(-30)` — por isso as primeiras entradas (Bloco 1, 2, 3…) desaparecem após cerca de 30 mensagens. O array `progress_log` no banco continua completo.

**Correção:**
1. Remover o `slice(-30)` no endpoint de status — devolver o log inteiro (`progress_log` completo).
2. Como a coluna pode crescer, adicionar paginação simples por `since_ts` (cliente envia o timestamp da última entrada recebida, server devolve só as novas). Mantém payload leve sem perder histórico.
3. No frontend (`TechnicalAuditsTab.tsx` viewer de log), trocar o estado para **acumular** entradas em vez de substituir, usando `since_ts`. Adicionar botão "Baixar log completo (.txt)" e auto-scroll opcional.

Resultado: log mostra desde "Bloco 1/15" até o final, sem perda.

---

## b) Arquitetura para Catálogo de Prompts + Export PDF

### Estado atual (investigado)

- Existe `ai_system_prompts` (24 registros) + manifest `supabase/functions/_shared/system-prompts.ts` (24 entradas) + UI `SystemPromptsCatalog.tsx` dentro de `PromptConfigurationTab`.
- **Gap crítico:** só **3 de ~33 edge functions** que usam LLM realmente leem do registro (`fetchSystemPrompt`). As outras ~30 têm prompts **hardcoded** dentro do `index.ts` — invisíveis no painel.
- Falta também metadado de **contexto** (para que serve, qual modelo, temperatura, variáveis esperadas, função consumidora).

### Arquitetura proposta — "Registro Único de Prompts" (single source of truth)

```text
┌─────────────────────────────────────────────────────────┐
│  ai_system_prompts (DB)  ←  manifest system-prompts.ts  │
│  + novos campos: purpose, model_default, temperature,    │
│    output_format, consumers[], tags[], example_input,    │
│    last_used_at                                          │
└─────────────────────────────────────────────────────────┘
            ▲                              ▲
            │ sync-system-prompts          │ admin UI
            │ (manifest → DB)              │ (override + metadata)
            │                              │
┌───────────────────────┐         ┌──────────────────────┐
│ Edge functions        │         │ SystemPromptsCatalog │
│ getSystemPrompt(key)  │         │ - busca, filtros      │
│ + report_prompt_usage │         │ - badges (modelo,     │
│   (telemetria)        │         │   família, override)  │
└───────────────────────┘         │ - export PDF (1 ou    │
            │                     │   todos)              │
            ▼                     └──────────────────────┘
   ai_prompt_usage_log                       │
   (key, function, ts, model)                ▼
                                  edge fn `export-prompts-pdf`
                                  (renderiza HTML → PDF via
                                   mesmo pipeline do audit)
```

### Passos de implementação

1. **Migração SQL** (`ai_system_prompts`):
   - Adicionar colunas: `purpose text`, `model_default text`, `temperature numeric`, `output_format text`, `consumers text[]`, `tags text[]`, `example_input text`, `last_used_at timestamptz`.
   - Tabela nova `ai_prompt_usage_log` (key, function_name, model, ts, latency_ms) — append-only, RLS admin-only.

2. **Migrar prompts hardcoded → manifest** (≈30 funções). Para cada função sem `fetchSystemPrompt`:
   - Extrair o system prompt para `SYSTEM_PROMPTS` com `purpose`, `model_default`, `consumers: [function_name]`.
   - Substituir literal por `await fetchSystemPrompt(supabase, "<key>")`.
   - Executar `sync-system-prompts` (já existe) para popular o banco.

3. **UI — `SystemPromptsCatalog` upgrade**:
   - Cabeçalho com badges: modelo padrão · família · função consumidora · `has_override`.
   - Filtros por família, modelo, "sem override / com override", "nunca usado".
   - Painel lateral por prompt: **propósito, variáveis, modelo, temperatura, formato esperado, exemplo, última execução**.
   - Botões: `Exportar este (PDF)`, `Exportar catálogo completo (PDF)`.

4. **Edge function nova `export-prompts-pdf`**:
   - Recebe `{ keys?: string[] }`. Sem `keys` = todos.
   - Lê `ai_system_prompts` (resolved = override ?? default).
   - Renderiza HTML estilizado (mesmo CSS da auditoria) com capa, sumário, e para cada prompt: ficha de contexto + corpo em `<pre>` com syntax highlight leve.
   - Reaproveita o pipeline `openAuditForPrint` (HTML → janela popup → "Salvar como PDF" do navegador). Sem dependência de libs externas, funciona em qualquer browser.

5. **Coordenação com Organograma & Compliance**:
   - Adicionar entrada "Catálogo de Prompts" no `projectOrganograma.ts` sob "Configurações & IA".
   - Adicionar regra de compliance: "Todo edge function que chama LLM deve usar `fetchSystemPrompt` (zero prompts hardcoded)". Lint via script `scripts/audit-prompt-registry.mjs` que falha quando detecta `role: "system"` sem `fetchSystemPrompt` na mesma função.
   - Entrada no `CHANGELOG.md` + `npm run sync:changelog`.

### Detalhes técnicos

- **PDF**: mesma estratégia do relatório de auditoria (HTML em popup com `window.print()`) — preserva Unicode, evita libs e mantém consistência visual.
- **Telemetria opcional** (`ai_prompt_usage_log`): permite mostrar "última vez usado" e "prompts órfãos" (no manifest mas nunca chamados).
- **i18n**: novos textos da UI vão em `pt/translation.json` e `en/translation.json` simultaneamente; incrementar `I18N_VERSION`.

### Escopo desta entrega (sugestão de fasear)

- **Fase 1 (rápido):** correção do log + adicionar campos de metadata + UI upgrade + export PDF.
- **Fase 2:** migrar os ~30 prompts hardcoded para o registro (PR separado, função a função).
- **Fase 3:** telemetria `ai_prompt_usage_log` + lint de compliance.

Confirma se posso seguir com **Fase 1 inteira** já agora, e abrir Fase 2/3 como tarefas separadas?

---

## Status (2026-06-01)

- ✅ **Fase 1** entregue.
- ✅ **Fase 3** entregue: tabela `ai_prompt_usage_log`, helper `logPromptUsage`, script `npm run audit:prompts`.
- 🟡 **Fase 2** em backlog: **23 edge functions** ainda com prompt hardcoded (rodar `npm run audit:prompts` para a lista viva). Migração função-a-função, ordem sugerida por impacto clínico:
  1. `parse-pet-exam-pdf` — chave manifest `parse_pet_exam_pdf` já existe (atenção: prompt atual é PT, manifest é EN — revisar antes de substituir).
  2. `hybrid-recommendation` — dois prompts (ENRICH, FALLBACK) → criar `hybrid_recommendation_enrich` e `hybrid_recommendation_fallback`.
  3. `kg-evidence-gap-fill` — dois system prompts no `index.ts` (linhas 187 e 297). Chave `kg_evidence_gap_fill` já existe no manifest.
  4. `project-pet-trajectory`, `enrich-pet-food-product`, `condition-insights` (parcial), `web-dosage-lookup`.
  5. `suggest-cohort-ideas`, `suggest-taxonomy-terms`, `translate-and-categorize-conditions`.
  6. Coortes (`analyze-*-cohorts-*`, `check-cohort-originality`, `check-insight-originality`, `generate-synthetic-cohort`, `evaluate-meta-study-reliability`, `chat-meta-study`).
  7. Chats (`document-chat`, `query-perplexity`, `perplexity-health`).
  8. Infra/testes (`ai-task-test`, `ai-task-healthcheck`, `generate-audit`, `process-nutraceutical-spreadsheet`).

Padrão de migração por função (checklist):
1. Adicionar/atualizar entrada em `SYSTEM_PROMPTS` em `_shared/system-prompts.ts` com `purpose`, `model_default`, `consumers`, `tags`.
2. Substituir a string literal por `await fetchSystemPrompt("<key>", FALLBACK)`.
3. Chamar `logPromptUsage({ prompt_key, function_name, model, latency_ms, ... })` após a resposta.
4. Rodar `npm run audit:prompts` — a função deve sair da lista de pendentes.
5. Rodar `sync-system-prompts` da UI Admin para popular os campos novos no banco.
