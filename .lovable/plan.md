# Robustez de carregamento de chunks no admin

Objetivo: nenhum chunk obsoleto pós-deploy deve virar tela branca, e toda falha deve deixar rastro (URL do asset + número de tentativas).

## 1. Telemetria de falha de módulo dinâmico

Hoje `lazyWithRetry` engole o erro em silêncio; a telemetria só existe em `AssetFailureBanner` para erros globais de `<link>`/`<script>`.

- Extrair de `src/components/system/AssetFailureBanner.tsx` a função de registro para um módulo compartilhado (`src/lib/assetFailureTelemetry.ts`), mantendo o mesmo `sessionStorage` e o mesmo evento `asset-preload-failure` (o banner continua funcionando sem mudança visual).
- Ampliar o detalhe registrado com: `url` do asset extraída da mensagem do erro, `attempt` (1, 2, ...), `willReload` (booleano) e `chunkName` quando dedutível.
- `lazyWithRetry` passa a registrar cada tentativa falha via essa função, com `console.error` estruturado — assim o erro aparece nos logs do preview e no banner do usuário.

## 2. Retry com backoff em todos os lazy imports do admin

`src/config/admin-tabs.ts` já usa `lazyWithRetry`. Trocar os `React.lazy` restantes:

- `src/components/administrador/AdminPainel.tsx` (4 imports)
- `src/components/administrador/OntologyHub.tsx` (3)
- `src/components/administrador/TranslationsHub.tsx` (2)
- `src/components/administrador/TripletsHub.tsx` (2)
- `src/components/administrador/visualizations/relations/VisualizationCard.tsx` (1)
- `src/components/lazy/LazyComponents.tsx` (todos os `lazy(...)`)

Sem mudança de comportamento visível: mesma assinatura, mesmo `Suspense`.

Ajuste no próprio `lazyWithRetry`: passar de "1 retry imediato" para 2 retries com backoff (300 ms, 900 ms) antes do reload único, ainda protegido pela chave de sessão `__chunk_reload_attempted__` para nunca entrar em loop de reload.

## 3. Testes

Novo arquivo `src/lib/__tests__/lazyWithRetry.test.ts` (vitest, sem DOM real — stubs de `window.location.reload` e `sessionStorage`), testando a função de carregamento isolada (será exportada como `loadWithRetry`, usada internamente por `lazyWithRetry`):

- sucesso na 1ª tentativa: factory chamada 1x, sem telemetria;
- falha de chunk seguida de sucesso: factory 2x, 1 evento de telemetria com `attempt: 1`, sem reload;
- falha persistente: backoff respeitado (timers fake), reload chamado exatamente 1x, telemetria com URL do asset e contagem de tentativas;
- segunda falha persistente com a flag de sessão já marcada: sem novo reload, erro propagado;
- erro que não é de chunk (ex.: `TypeError` comum): propagado imediatamente, sem retry nem reload.

## Notas técnicas

- Sem alteração de i18n: as strings do banner já existem e não mudam.
- `assetFailureTelemetry.ts` fica livre de dependências de Supabase/React para poder ser testado em Node.
- Nada de mudança em edge functions, schema ou telas de dados.
