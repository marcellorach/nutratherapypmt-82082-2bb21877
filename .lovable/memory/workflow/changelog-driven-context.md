---
name: Changelog-driven context
description: Antes de qualquer tarefa não-trivial, ler .lovable/CONTEXT.md e o CHANGELOG.md para evitar refazer/reverter trabalho recente. Ao terminar, registrar e rodar npm run sync:changelog.
type: preference
---

**Antes de iniciar** qualquer tarefa não-trivial:

1. Ler `.lovable/CONTEXT.md` (briefing autogerado: top 10 entradas + contagem por área + última versão i18n).
2. Se a tarefa toca arquivos específicos, escanear `CHANGELOG.md` por menções a esses caminhos para entender mudanças recentes (ou usar `findChangesTouching` em `src/data/changelogQuery.ts`).

**Ao terminar** uma mudança estrutural ou nova feature:

1. Adicionar entrada NO TOPO de `[Unreleased]` em `CHANGELOG.md` no formato estruturado:
   ```
   ### Added - YYYY-MM-DD — Título curto
   <!-- area: <area> · status: entregue · i18n: x.y.z -->
   - bullet 1
   - bullet 2
   - Files: src/foo.tsx, supabase/functions/bar/index.ts
   ```
2. Rodar `npm run sync:changelog` — isso regenera `src/data/projectChangelog.generated.ts`, atualiza `organogramaLastUpdated` e renova `.lovable/CONTEXT.md`.

**Why:** o agente perdia contexto entre tarefas e às vezes desfazia trabalho recente. O CHANGELOG passa a ser memória de trabalho do projeto, não só documentação.

**How to apply:** sempre. O custo de ler `.lovable/CONTEXT.md` é baixo e evita retrabalho caro.