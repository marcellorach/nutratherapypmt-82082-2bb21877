## Objetivo

Hoje há duas dores combinadas:

1. **Dupla manutenção**: cada mudança precisa ser escrita em `CHANGELOG.md` (texto livre) e espelhada à mão em `src/data/projectChangelog.ts` (tipado, consumido pela aba Organograma). É fácil esquecer um dos dois e o organograma fica defasado.
2. **Perda de contexto entre tarefas**: o agente não consulta o histórico antes de começar e às vezes refaz/reverte coisas recentes.

A solução tem 3 partes: (a) padronizar o CHANGELOG para ser parseável e útil ao agente, (b) gerar o `projectChangelog.ts` automaticamente a partir dele, (c) institucionalizar via memory rule a leitura do changelog no início de cada tarefa.

## Como vai funcionar

```text
CHANGELOG.md  (fonte única, formato estruturado por área)
      │
      ▼
scripts/sync-changelog.mjs   ← parser determinístico
      │
      ├─► src/data/projectChangelog.generated.ts   (autogerado)
      └─► organogramaLastUpdated  (data da entrada mais recente)
              │
              ▼
      Aba Organograma → Changelog (já existente) consome o .generated
```

## 1. Novo formato estruturado do CHANGELOG

Cada entrada vira um bloco com cabeçalho parseável + metadados YAML opcionais. Exemplo:

```markdown
### Added - 2026-04-29 — Organograma do Projeto (admin)
<!-- area: admin · status: entregue · i18n: 1.38.0 -->
- Nova tab `/administrador?tab=organograma` com 4 lentes
- Single source of truth tipada em src/data/projectOrganograma.ts
- Files: src/data/projectOrganograma.ts, src/pages/administrador/OrganogramaTab.tsx
```

Regras:
- `### <Kind> - YYYY-MM-DD — <título>` (kind ∈ Added/Changed/Fixed/Removed/Security)
- Linha HTML-comment opcional com `area`, `status`, `i18n`, `pr` — vira metadado tipado
- Bullets `- …` com texto livre
- Linha `Files:` (ou caminhos `src/...`/`supabase/...` em qualquer bullet) extrai a lista de arquivos
- Sem comment → `area` é inferida pelos arquivos (mapa explícito); sem files → `area: meta`

Vou migrar as ~10 entradas mais recentes para o novo formato (resto fica como histórico legível, parser tolera).

## 2. Parser (`scripts/sync-changelog.mjs`)

Lê `CHANGELOG.md`, gera `src/data/projectChangelog.generated.ts` com a mesma shape `ChangelogEntry` já usada hoje. Inclui:

- Inferência de área via mapa: `src/pages/administrador/` → `admin`, `supabase/functions/kg-*` → `kg`, `src/components/pet/` → `vet-ui`, `src/services/clinical/` → `clinical-pipeline`, etc.
- `i18nVersion` extraída do comment ou de regex `i18n v?\d+\.\d+\.\d+` no título/bullets
- Saída ordenada (mais recente primeiro)
- Atualiza `organogramaLastUpdated` em `projectOrganograma.ts` via line-replace cirúrgico
- Falha cedo se o CHANGELOG estiver malformado (não sobrescreve o gerado anterior)

Comando: `npm run sync:changelog`. O agente passa a rodar isso ao final de toda mudança que toca o CHANGELOG.

## 3. `projectChangelog.ts` vira shim

```ts
export { changelog } from "./projectChangelog.generated";
export type { ChangelogEntry, ChangelogKind, ChangelogStatus } from "./projectChangelog.generated";
```

Zero impacto em `ChangelogTimeline.tsx` e demais consumidores.

## 4. Helpers para o agente consultar o changelog

Novo `src/data/changelogQuery.ts` (também usado por uma futura UI de busca):

```ts
recentChangesByArea(area, sinceDays)   // últimas mudanças de uma área
findChangesTouching(filePath)          // mudanças que mexeram em um arquivo
lastI18nVersion()                      // última versão registrada
```

E um arquivo curto `.lovable/CONTEXT.md` autogerado pelo script com um snapshot legível em ~40 linhas: top 10 entradas, contagem por área nas últimas 2 semanas, último `i18n` registrado. **Esse arquivo é o "briefing" que o agente lê no começo de cada tarefa.**

## 5. Memory rule nova: leitura obrigatória do changelog

Substituo `mem://architecture/organograma-source-of-truth` por um protocolo simplificado e adiciono `mem://workflow/changelog-driven-context` como **Core**:

- **Antes** de iniciar qualquer tarefa não-trivial: ler `.lovable/CONTEXT.md` e, se a tarefa toca arquivos específicos, rodar mentalmente `findChangesTouching(file)` lendo o CHANGELOG.
- **Ao terminar**: adicionar entrada estruturada no CHANGELOG.md + rodar `npm run sync:changelog`. Só editar `projectOrganograma.ts` quando a estrutura (não o histórico) muda.

Isso reduz protocolo de 5 passos para 2 e adiciona o passo de "consultar antes" — que é o que você pediu.

## 6. Mini-painel "Recentes nesta área" no Organograma

Na aba Cards, ao clicar numa área, mostro as últimas 3 entradas do changelog daquela área (já temos os dados, é só filtrar). Útil pra ver de relance o que mudou recentemente sem ir até a aba Changelog.

## Arquivos

**Novos**
- `scripts/sync-changelog.mjs`
- `src/data/projectChangelog.generated.ts` (gerado)
- `src/data/changelogQuery.ts`
- `.lovable/CONTEXT.md` (gerado)
- `.lovable/memory/workflow/changelog-driven-context.md`

**Editados**
- `CHANGELOG.md` — migrar últimas ~10 entradas para o novo formato + entrada da própria automação
- `src/data/projectChangelog.ts` — vira shim
- `src/data/projectOrganograma.ts` — só a linha `organogramaLastUpdated`
- `package.json` — script `sync:changelog`
- `src/components/administrador/organograma/OrganogramaCards.tsx` — bloco "Recentes nesta área"
- `src/components/administrador/organograma/ChangelogTimeline.tsx` — banner "auto-sincronizado em <data>"
- `.lovable/memory/architecture/organograma-source-of-truth.md` — protocolo simplificado
- `src/i18n.ts` + `src/locales/{pt,en}/translation.json` — nova chave + bump I18N_VERSION → 1.39.0
- `mem://index.md` — adicionar Core rule de "consultar changelog antes de iniciar"

## Knowledge graph

**Nenhuma mudança no KG.** Tudo isso vive em código/markdown/memory; tabelas `medical_knowledge_graph*` ficam intactas.

## Riscos & mitigação

- **Parser quebra em entrada antiga** → tolerante: blocos não-conformes viram `area: meta` em vez de falhar.
- **Agente esquece de rodar `sync:changelog`** → adicionar no fim da memory rule + na própria seção do CHANGELOG um comentário lembrete.
- **CONTEXT.md desatualizado** → regenerado a cada `sync:changelog`; adicionar timestamp visível no topo.
