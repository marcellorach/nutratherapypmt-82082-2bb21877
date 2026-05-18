# Auditoria do Sistema de Prompts — pós refactor v5.1.0

Objetivo: validar que a refatoração (manifest `_shared/system-prompts.ts` + edge function `sync-system-prompts` + remoção do "Gerar Prompts de Exemplo") não quebrou nada em produção.

## Escopo de testes

### 1. Banco de dados (read-only)
- `SELECT prompt_key, length(default_content), length(override_content), updated_at FROM ai_system_prompts ORDER BY prompt_key` — confirmar que **as 24 chaves têm `default_content` preenchido** após o sync; nenhuma vazia.
- Confirmar que `override_content` permaneceu intacto onde o admin já havia customizado (comparar `updated_at` antigo).
- `SELECT count(*) FROM ai_configurations WHERE name LIKE 'prompt_%'` — verificar se há mocks órfãos do botão removido a serem limpos (apenas reportar, sem deletar).

### 2. Edge function `sync-system-prompts`
- Invocação via `curl_edge_functions` (POST sem body) → esperar `{ updated: 24, skipped: 0 }` e status 200.
- Reinvocar imediatamente → deve ser idempotente (mesmo resultado, sem erros).
- Checar `edge_function_logs` por erros.

### 3. Edge functions consumidoras dos prompts
Validar que cada função que migrou para `getSystemPrompt()` ainda resolve o prompt corretamente. Para cada uma:
- Inspecionar código (`supabase/functions/<name>/index.ts`) — confirmar import correto de `_shared/system-prompts.ts`, fallback chain `override → default → manifest`.
- Smoke-test via `curl_edge_functions` com payload mínimo realista; checar resposta 200 e logs sem `prompt is undefined`/`empty system prompt`.

Funções a auditar (as 4 refatoradas + qualquer outra que use `ai_system_prompts`):
- `clinical-extraction` (ou nome equivalente)
- `knowledge-graph-enrichment`
- `recommendation-engine` / `hybrid-recommendations`
- `triplet-extraction`
- Mais: `rg -l "ai_system_prompts|getSystemPrompt|SYSTEM_PROMPTS" supabase/functions` para enumerar todos os consumidores e garantir cobertura.

### 4. UI — `SystemPromptsCatalog.tsx` (Admin → Prompts)
Via browser no preview, logado:
- Tab carrega sem erro de console.
- Lista exibe as 24 prompts com `default_content` visível (não mais "sem conteúdo").
- Botão **"Sincronizar com o código"** dispara o edge function, mostra toast de sucesso e atualiza a lista.
- Auto-sync silencioso: simular um prompt vazio (apenas verificar lógica no código, sem mutar DB) e confirmar trigger no `useEffect` de mount.
- Edição de `override_content` salva e tem precedência na exibição.

### 5. UI — `PromptConfigurationTab.tsx` (Admin → Recomendação)
- Botão "Gerar Prompts de Exemplo" **não existe mais** no DOM.
- Função `generateRandomPrompts` removida do bundle (`rg` no source).
- Empty state mostra a nova mensagem informativa apontando para System Prompts.
- "Novo Prompt" customizado ainda funciona (criar → salvar → listar → deletar).

### 6. i18n
- `I18N_VERSION === '1.86.6'` em `src/i18n.ts`.
- Chaves `generateExample`, `generateExamples`, `messages.generated` **ausentes** em ambos `pt/translation.json` e `en/translation.json` (rg para confirmar).
- Nova chave `systemHint` presente em PT e EN com texto coerente.
- Trocar idioma na UI e revalidar a tab Prompts em EN.

### 7. Regressão cruzada
- Verificar que nenhum componente fora desses dois ainda importa as funções/chaves removidas (`rg "generateRandomPrompts|generateExample"`).
- Build/typecheck limpo (automático no harness).

## Entregável
Relatório no chat com:
- ✅/❌ por item acima
- Lista de prompts com `default_content` vazio (se houver)
- Quaisquer erros nos logs de edge functions
- Recomendações de fix se algo falhar (em mensagem separada, fora do plano)

Nenhuma alteração de código será feita durante a auditoria. Se eu encontrar problemas, apresento-os e aguardo sua decisão antes de corrigir.
