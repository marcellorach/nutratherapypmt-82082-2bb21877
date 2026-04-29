## Objetivo

Em cada card de área do **Organograma** (`/administrador?tab=organograma` → lente Cards), exibir um mini-timeline visual com as últimas entradas do `CHANGELOG.md` daquela área, mostrando arquivos tocados como links clicáveis e — quando disponível — o commit que originou a mudança.

Hoje já existe um bloco "Recentes nesta área" em `OrganogramaCards.tsx`, mas ele é apenas uma lista de 3 linhas em texto. Vamos transformá-lo em um timeline real, navegável e com proveniência.

## O que muda na experiência

- Cada card de área ganha um **mini-timeline vertical** (linha + bolinhas coloridas por tipo: Added=verde, Changed=âmbar, Fixed=azul, Removed=vermelho, Security=roxo).
- Mostra por padrão as **3 entradas mais recentes** da área (últimos 90 dias). Botão "Ver mais" expande para até 8.
- Cada entrada exibe: data, badge de tipo, badge de status (parcial/revertido se aplicável), título e — ao expandir — bullets resumidos (até 3) + chips de arquivos.
- **Chips de arquivos** são links clicáveis que abrem o arquivo no repositório (configurável). Quando não há URL de repo configurada, ficam como chips estáticos com tooltip do path completo (comportamento atual preservado).
- **Link de commit** (ícone `GitCommit`) aparece quando a entrada do CHANGELOG declara `<!-- commit: <hash> -->`. Sem hash, o ícone não aparece (sem ruído).
- Seletor de tipo (chips toggle: Added/Changed/Fixed/...) no topo do timeline para filtrar só dentro daquele card.

## Arquitetura técnica

### 1. Configuração de repositório (novo)

Novo arquivo `src/data/repoConfig.ts`:
- Exporta `REPO_CONFIG = { baseUrl?: string, branch: string }` — `baseUrl` opcional (ex: `https://github.com/<owner>/<repo>`), `branch` default `"main"`.
- Helpers: `fileUrl(path)` → `${baseUrl}/blob/${branch}/${path}` ou `null`; `commitUrl(hash)` → `${baseUrl}/commit/${hash}` ou `null`.
- Documenta no header: deixe `baseUrl` vazio se não quiser links externos. (Lovable gerencia o git internamente, então o usuário pode preencher quando conectar GitHub via Connectors.)

### 2. Suporte a `commit` no parser do changelog

`scripts/sync-changelog.mjs`:
- `parseMetaComment` já captura pares `chave: valor` separados por `·`. Adicionar `commit` ao tipo emitido.
- `pushCur()` passa `commit: cur.meta.commit` para a entrada.
- `emitTs` continua serializando via `JSON.stringify(entries)` — automaticamente inclui o campo novo.

`src/data/projectChangelog.generated.ts` (gerado): adicionar `commit?: string` na interface `ChangelogEntry`. Nada quebra para entradas antigas (campo opcional).

`CHANGELOG.md`: atualizar o bloco de instruções no topo com exemplo:
```
<!-- area: admin · status: entregue · i18n: 1.40.0 · commit: a1b2c3d -->
```

### 3. Helper de query

`src/data/changelogQuery.ts`:
- Nova função `changesByAreaFiltered(area, { sinceDays?, limit?, kinds? })` aceitando filtro por tipo.
- Mantém `recentChangesByArea` como wrapper (compat).

### 4. Componente novo: `AreaMiniTimeline.tsx`

`src/components/administrador/organograma/AreaMiniTimeline.tsx`:
- Props: `areaKey: OrganogramaAreaKey`.
- Estado local: `expanded` (mostra 3 vs 8), `kindFilter` (Set<ChangelogKind>), `openIds` (entradas expandidas com bullets).
- Layout:

```text
History  Recentes nesta área           [Added][Changed][Fixed]
│
●  2026-04-29  ADDED   Sincronização CHANGELOG → Organograma
│   ⌄ (clica para expandir bullets + arquivos + commit)
│       • bullet 1
│       • bullet 2
│       [scripts/sync-changelog.mjs] [src/data/...]   ⧉ a1b2c3d
●  2026-04-28  CHANGED Pipeline Clínico com Progresso Real
│
●  2026-04-28  ADDED   Painel Admin de Curadoria de Doses
                                                [Ver mais 5 →]
```

- Bolinhas coloridas via `KIND_STYLES` dict (já existe padrão em `predicateStyles` — replicamos pequena versão local: `added`→`bg-emerald-500`, `changed`→`bg-amber-500`, `fixed`→`bg-sky-500`, `removed`→`bg-rose-500`, `security`→`bg-violet-500`).
- Chips de arquivos: usam `fileUrl(path)`. Se retornar `null`, render como `<Badge>` (atual). Se URL existe, render como `<a target="_blank" rel="noopener noreferrer">` com mesmo estilo + ícone `ExternalLink` minúsculo.
- Commit chip: render se `entry.commit && commitUrl(entry.commit)` — `<a>` com ícone `GitCommit` + 7 primeiros chars.
- Botões de filtro de tipo: chips toggle pequenos; quando nenhum selecionado, mostra todos.

### 5. Integração no Organograma

`src/components/administrador/organograma/OrganogramaCards.tsx`:
- Substituir o componente interno `RecentChanges` pela importação de `AreaMiniTimeline`.
- Mesma posição (final do `CardContent`, com `border-t border-dashed`).

### 6. i18n (PT/EN obrigatório)

`src/i18n.ts`: bump para `1.40.0`.

Novas chaves em `src/locales/{pt,en}/translation.json` sob `organograma.timeline.*`:
- `title` ("Recentes nesta área" / "Recent in this area")
- `showMore` ("Ver mais {{count}}" / "Show {{count}} more")
- `showLess` ("Ver menos" / "Show less")
- `noChanges` ("Sem mudanças recentes" / "No recent changes")
- `filterAll` ("Todos" / "All")
- `kind.added/changed/fixed/removed/security`
- `viewFile` ("Abrir arquivo no repositório" / "Open file in repo")
- `viewCommit` ("Ver commit" / "View commit")

### 7. Documentação + memory

- `CHANGELOG.md`: adicionar entrada `### Added - 2026-04-29 — Mini-timeline por área no Organograma com links de arquivos e commits` com `<!-- area: admin · status: entregue · i18n: 1.40.0 -->`.
- Rodar `npm run sync:changelog` (regenera `projectChangelog.generated.ts` + `.lovable/CONTEXT.md` + `organogramaLastUpdated`).
- Atualizar `mem://architecture/organograma-source-of-truth` mencionando que entradas do CHANGELOG suportam `commit:` e que `repoConfig.ts` controla URLs externas.

## Arquivos

**Novos**
- `src/data/repoConfig.ts`
- `src/components/administrador/organograma/AreaMiniTimeline.tsx`

**Editados**
- `scripts/sync-changelog.mjs` (suporte ao campo `commit`)
- `src/data/changelogQuery.ts` (filtro por kind)
- `src/components/administrador/organograma/OrganogramaCards.tsx` (usa `AreaMiniTimeline`)
- `src/i18n.ts` (v1.40.0)
- `src/locales/pt/translation.json`, `src/locales/en/translation.json`
- `CHANGELOG.md` (entrada nova + exemplo com `commit:`)
- `.lovable/memory/architecture/organograma-source-of-truth.md`

**Auto-gerados (via `npm run sync:changelog`)**
- `src/data/projectChangelog.generated.ts`
- `.lovable/CONTEXT.md`
- `src/data/projectOrganograma.ts` (campo `organogramaLastUpdated`)

## Notas / decisões

- **Sem mudanças no Knowledge Graph.** Confirmado: feature é puramente UI + parser.
- **Não vamos inferir commits automaticamente** do git (Lovable gerencia git internamente e o sandbox não tem `remote.origin.url` confiável). O hash entra **opcionalmente** via metadata do CHANGELOG — quem escreve a entrada cola o hash quando relevante.
- **Sem `baseUrl` configurado** = experiência atual preservada (chips estáticos), apenas com layout de timeline + filtros + expand. Quando o usuário conectar GitHub via Connectors, basta preencher `REPO_CONFIG.baseUrl` para ativar todos os links.
- Mantém o componente sob 200 linhas; usa apenas `lucide-react` (`History`, `GitCommit`, `ExternalLink`, `ChevronDown`) e shadcn `Badge`/`Button` já no projeto.
