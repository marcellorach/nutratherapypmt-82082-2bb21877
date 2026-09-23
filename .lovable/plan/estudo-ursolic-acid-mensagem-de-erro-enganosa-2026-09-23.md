# Estudo "Ursolic Acid..." — mensagem de erro enganosa

## O que foi verificado
- Existe **um único** registro desse estudo no banco, importado hoje (23/09, 15:31), com status `new`, PDF presente e análise vazia. Ele **nunca foi processado** — não há duplicata.
- A mensagem "Este estudo já foi processado anteriormente" vem de `NtaiProcessCard.tsx:129`, que troca **qualquer** erro contendo as palavras "status", "already" ou "já" por essa frase. Um erro comum como "Edge Function returned a non-2xx status code" cai nessa regra. O erro real ficou escondido.
- A causa real da falha ainda **não está confirmada**.

## O que será feito
1. **Descobrir o erro real**: ler os registros das funções de extração (`gemini-file-search`, `extract-study-entities`) no horário da tentativa e reportar o erro literal. Se for consequência dos gates de permissão recentes (ex.: identidade não propagada → 401/403), corrigir a propagação; se for outra causa, reportar antes de mexer.
2. **Parar de mascarar erros**: em `formatErrorMessage`, remover a regra genérica de "status/already/já". Mostrar "já processado" somente quando o código realmente detectar `kanban_status = 'processed'`. Para os demais erros, mostrar a mensagem real (com código HTTP e corpo de erro da função, quando houver).
3. Reprocessar o estudo "Ursolic Acid" e confirmar que avança além de 50%.

## Detalhes técnicos
- `useProcessingLogic.ts:125` já trata "já processado" como sucesso (stage `complete`), então a regra no card é redundante e só gera falso positivo.
- Extrair `error.context` do `FunctionsHttpError` para exibir status e body reais.
- i18n: nova chave `studies.vetgraphrag.errorFunctionFailed` ("A etapa de extração falhou ({{status}}): {{detail}}") em PT/EN; incrementar `I18N_VERSION`.
- CHANGELOG + `sync:changelog`. Nada publicado.
