## Diagnóstico — raiz do problema

Os arquivos `src/locales/pt/translation.json` e `src/locales/en/translation.json` têm a chave `"admin"` **declarada duas vezes** no nível raiz:

- **Linha 1914** — bloco original, com 19 sub-chaves: `sidebar`, `tabs`, `errors`, `studies`, `nutraceuticals`, `breeds`, `labReferences`, `patients`, `predictiveModels`, `prompts`, `research`, `roi`, `settings`, `tabInfo`, `veterinaryTargets`, `analytics`, `clinicalRules`, `header`, `multiAgentAnalysis`.
- **Linha 7619** — bloco novo (commit `0f80fe49`, "Base Farmacológica" em 2026-05-09), com **apenas** `pharmacology`.

Em JSON com chaves duplicadas, o **último valor vence** — então o parser do i18next entrega apenas `{ admin: { pharmacology: {...} } }` ao app. Resultado: **todas as chaves `admin.sidebar.*`, `admin.tabs.*`, `admin.errors.*` etc. somem** e o `t()` devolve a própria chave literal — exatamente o que aparece nas screenshots ("admin.sidebar.knowledgeBase.title", "admin.sidebar.knowledgeBase.studies"…).

Não é cache, não é versionamento, não é chaves faltando. É **um merge JSON quebrado** ao adicionar a Base Farmacológica.

## Correção

1. Em **ambos** os arquivos (`pt` e `en`):
   - Mover o conteúdo do segundo `"admin"` (linha 7619 — só `pharmacology`) para **dentro** do primeiro bloco `"admin"` (linha 1914), como uma sub-chave a mais ao lado de `sidebar`, `tabs`, etc.
   - Remover o bloco duplicado das linhas 7619+.
   - Manter o bloco `"pharmacology"` top-level (linha ~7613) que coexiste — não conflita.
2. Validar que `python3 -m json.tool` parseia sem erro e que `jq '.admin | keys | length'` devolve **20** (19 originais + `pharmacology`) em PT e EN.
3. Adicionar um **guard** simples para evitar regressão futura:
   - Script `scripts/check-translation-duplicates.mjs` que lê os dois JSONs com `JSONDecoder` preservando pares e falha se encontrar chaves duplicadas em qualquer nível. Pluga no `npm run sync:changelog` e/ou em um `prebuild` leve.
4. Bump do `I18N_VERSION` em `src/i18n.ts` (ex.: `1.63.0 → 1.64.0`) para invalidar o cache do navegador — sem isso o usuário continua vendo o JSON corrompido em cache.
5. Entrada no `CHANGELOG.md` (`area: i18n · status: entregue · i18n: 1.64.0`) descrevendo o bug e a salvaguarda + `npm run sync:changelog`.

## Verificação após o fix

- `jq '.admin | keys' src/locales/pt/translation.json` deve listar `["analytics", "breeds", ..., "pharmacology", ..., "veterinaryTargets"]` (20 itens).
- `python3 -c "import json,collections; [print(k,c) for k,c in collections.Counter([k for k,_ in json.JSONDecoder(object_pairs_hook=lambda p:p).decode(open(f).read())]).items() if c>1] for f in [...]"` não deve imprimir nada.
- Recarregar `/administrador` no preview: sidebar e tabs voltam a mostrar texto em português/inglês em vez das chaves.

## Por que isso não foi pego antes

- O `audit-translations` checa chaves **faltando** entre PT/EN, mas não checa **duplicadas no mesmo arquivo** — a chave `admin.sidebar.knowledgeBase.title` "existe" textualmente no arquivo, só é morta pelo parser. Daí o passo 3 (guard de duplicatas).
