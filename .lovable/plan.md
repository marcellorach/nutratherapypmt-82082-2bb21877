# Plano

## Parte 1 — Validar as 2 edge functions refatoradas

Sem alterar código, executar:

1. **`extract-pet-clinical-data`**
   - `supabase--curl_edge_functions` POST com payload mínimo de teste (texto clínico curto).
   - `supabase--edge_function_logs` filtrando por `fetchSystemPrompt` para confirmar que o prompt veio de `override_content` → `default_content` → manifesto.
   - Validar que a resposta JSON mantém o mesmo formato de antes (campos esperados pelo frontend).

2. **`relations-auditor`**
   - `supabase--curl_edge_functions` POST com uma query de auditoria simples.
   - `supabase--edge_function_logs` verificando ausência de erros e log de origem do prompt.
   - Conferir que a resposta continua compatível com o consumidor no admin.

3. **Teste de override real**: gravar temporariamente `override_content` em um dos prompts via `supabase--insert`, re-invocar a função, confirmar nos logs que o override foi usado, e reverter.

Resultado: tabela com status (OK / falha) por função + amostra do log mostrando a origem do prompt.

## Parte 2 — Remover footer "Restore Defaults for TRIPLETS" e mover para o topo

**Arquivo:** `src/components/administrador/configuracoes/ExtractionPromptsEditor.tsx`

Hoje há um `Card` rodapé (linhas 332–358) com dois botões:
- `Restaurar Padrões do {{stage}}`  ← o que o usuário quer remover dali
- `Test with Real Study` ← o usuário **não** mencionou; manter? **Decisão proposta:** mover ambos para o topo, junto da barra de stages, para ficarem contextuais ao stage ativo (incluindo Triplets). Se preferir só mover o Restore e descartar o Test, faço isso na implementação.

Mudanças:
1. Remover o `Card` rodapé inteiro (linhas 332–358).
2. No `Card` do cabeçalho (linha 239), adicionar à direita do título/descrição um pequeno grupo de ações com:
   - Botão **Restaurar Padrões do {{stage}}** (mesma função `resetToDefaults(activeStage)`).
   - Botão **Testar com estudo real** (mantém o toast atual).
3. Garantir que o rótulo se atualiza dinamicamente conforme o stage ativo (Stage 1, Stage 2, …, Triplets) — já é o comportamento atual via `activeStage.toUpperCase()`.
4. Sem novas chaves i18n (reuso de `extractionPrompts.restoreDefaults` e `extractionPrompts.testWithStudy`).
5. Sem mudança de versão I18N (nenhuma string nova).

## Detalhes técnicos

- Nenhuma mudança de schema; nenhuma migração.
- Nenhum impacto nos demais consumidores (`ai-config`, `resetToDefaults`, `savePrompt` continuam idênticos).
- Atualizar `CHANGELOG.md [Unreleased]` com entrada em **Changed** (área: `admin`, i18n: `none`) e rodar `npm run sync:changelog`.
- Não é necessário tocar em `projectOrganograma.ts` (não há mudança de sidebar/tabs).
