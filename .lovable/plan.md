## Objetivo

Corrigir a falha da aba **Priorizações → Gerar 6 sugestões**, em que o `gemini-3.5-flash` ignora o JSON Schema do tool-call e devolve apenas 5 cohorts sem `target_model_id`, `record_requirements`, `cohort_population`, `breadth`, etc.

## Estratégia: 3 camadas de defesa

```text
[1] Modelo primário forte
      google/gemini-3.1-pro-preview
              │ falhou validação?
              ▼
[2] Retry no mesmo modelo
      + mensagem de correção apontando o que faltou
              │ ainda falhou?
              ▼
[3] Fallback automático
      openai/gpt-5.4 (tool-calling mais estrito)
              │ ainda falhou?
              ▼
      Retorna 200 com cohorts crus + warning para o front exibir aviso
```

## Mudanças em `supabase/functions/suggest-cohort-ideas/index.ts`

### 1. Constantes de modelo
```ts
const PRIMARY_MODEL  = "google/gemini-3.1-pro-preview";
const FALLBACK_MODEL = "openai/gpt-5.4";
```
Remove a const `MODEL` fixa. O campo `source_model` persistido passa a refletir qual modelo de fato gerou cada cohort.

### 2. Reforço inline da estrutura no user prompt
Acrescenta no final do `userPrompt` um bloco com a forma JSON literal esperada (alguns modelos respeitam melhor schema quando ele aparece também no prompt):

```text
RESPONDA chamando a função propose_cohorts com EXATAMENTE este shape:
{
  "cohorts": [
    {
      "target_model_id": "<um dos 6 ids literais>",
      "cohort_population": "living|deceased|mixed",
      "breadth": "broad|stratified",
      "pattern_family": "...",
      "value_to_partner": "...",
      "record_requirements": ["...", "..."],
      "target_model_expected_gain": "...",
      "title": "...", "rationale": "...", "discoverable": "...",
      "kind": "prevention|treatment_validation|exploratory",
      "suggested_criteria": { "breeds": "...", "age_range": "...", "conditions": "...", "target_n": "..." },
      "impact_score": 0-100, "viability_score": 0-100
    }
  ]
}
Array DEVE ter 6 itens, 1 por modelo, pelo menos 2 com cohort_population != "living".
```

### 3. Função `validateCohorts(cohorts)` — server-side
Regras (todas devem passar):
- `cohorts.length === 6`
- Conjunto de `target_model_id` cobre **exatamente** os 6 ids literais (sem duplicatas, sem faltantes).
- Para todo cohort: `record_requirements` é array não-vazio; `cohort_population`, `breadth`, `pattern_family`, `value_to_partner`, `target_model_expected_gain` presentes e não-vazios.
- Pelo menos 2 cohorts com `cohort_population ∈ {deceased, mixed}`.

Retorna `{ ok: true }` ou `{ ok: false, issues: string[] }` (lista legível dos problemas para alimentar o retry).

### 4. Função `callModel(model, messages)` extraída
Encapsula a chamada ao gateway + parse do `tool_calls[0].function.arguments`. Trata 429/402 como hoje, mas devolve para o caller (sem `return` direto) para permitir o orquestrador decidir.

### 5. Orquestrador (substitui o bloco atual de fetch)
```text
1. messages = [system, user]
2. tentativa 1: callModel(PRIMARY_MODEL, messages)
3. validate → se ok, segue
4. senão: append assistant tool_call result + user "Sua resposta falhou validação: <issues>. Corrija e devolva 6 cohorts completos." → callModel(PRIMARY_MODEL, messages)
5. validate → se ok, segue
6. senão: callModel(FALLBACK_MODEL, messages_originais_com_correcao)
7. validate → registra resultado final + `validation_warnings` se ainda inválido
```

429 e 402 do **primário** disparam fallback imediato (sem retry). 429/402 do fallback retornam o status original para o cliente.

### 6. Persistência + resposta
- Persiste somente cohorts da tentativa que passou (ou da última tentativa se nenhuma passou, marcando `validation_warnings`).
- Resposta JSON ganha:
  ```json
  { "ok": true, "model": "<modelo_vencedor>", "attempts": [{"model":"...","valid":false,"issues":[...]}, ...], "validation_warnings": [...] | null, "cohorts": [...], "persisted": N, "generated_at": "..." }
  ```
- O front (`CohortAISuggester.tsx`) **não muda** — continua lendo `cohorts`. `attempts`/`validation_warnings` ficam disponíveis para diagnóstico futuro.

## Fora de escopo

- Mudanças de UI no `CohortAISuggester`.
- Alterações no schema da tabela `cohort_suggestions` (campos já existem).
- Mudar prompt do system (mantém o atual; só reforço inline no user).
- Tornar o fallback configurável via body — fica hardcoded por ora.

## Validação após implementar

1. `supabase--deploy_edge_functions` em `suggest-cohort-ideas`.
2. `supabase--curl_edge_functions` POST `/suggest-cohort-ideas` com `{ "signals": {} }`.
3. Verificar na resposta:
   - `cohorts.length === 6`
   - 6 `target_model_id` distintos cobrindo os ids esperados
   - `record_requirements` não-vazio em todos
   - ≥ 2 com `cohort_population ∈ {deceased, mixed}`
   - `model` retornado (idealmente `google/gemini-3.1-pro-preview` direto, sem cair no fallback)
4. Se cair no fallback de cara, inspecionar `attempts` para entender o que o Gemini 3.1 Pro errou e ajustar o reforço inline.

## CHANGELOG

Entrada em `[Unreleased] → Fixed`:
- 🛠️ `suggest-cohort-ideas`: trocado modelo para `gemini-3.1-pro-preview`, adicionada validação server-side (6 cohorts, 6 modelos distintos, ≥2 deceased/mixed, `record_requirements` obrigatório) com retry e fallback para `gpt-5.4`.

Depois rodar `npm run sync:changelog`.
