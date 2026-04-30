
# Internacionalização do Organograma do Projeto

## Problema
Todos os 7 arquivos do Organograma usam strings hardcoded em português, violando a política bilíngue PT/EN do projeto. Nenhum deles usa `useTranslation()` / `t()` para textos visíveis.

**Arquivos afetados:**
- `src/pages/administrador/OrganogramaTab.tsx` — header, convenções, tabs, footer
- `src/components/administrador/organograma/OrganogramaCards.tsx` — botões, placeholder, empty state
- `src/components/administrador/organograma/OrganogramaDiagram.tsx` — labels do diagrama
- `src/components/administrador/organograma/OrganogramaForceGraph.tsx` — labels do grafo
- `src/components/administrador/organograma/ChangelogTimeline.tsx` — filtros, headers
- `src/components/administrador/organograma/AreaMiniTimeline.tsx` — labels de timeline
- `src/data/projectOrganograma.ts` — ~108 strings de dados (títulos, descrições, convenções)

## Estratégia

### 1. Dados do Organograma (`projectOrganograma.ts`)

Os dados são estruturais (títulos de áreas, descrições de componentes). Duas abordagens possíveis:

**Opção A — Campos bilíngues inline** (recomendada): adicionar `title_en`, `description_en` ao lado dos campos PT existentes, e usar `useLocalizedField` nos componentes para selecionar o idioma correto em runtime. Mantém o arquivo como fonte única de verdade sem duplicar em JSON de tradução.

**Opção B — Chaves i18n**: mover todos os títulos/descrições para `translation.json` e referenciar por chave. Mais consistente com o resto do app, mas fragmenta a fonte de verdade do organograma.

### 2. Componentes UI (6 arquivos)

- Adicionar `useTranslation()` e substituir todas as strings hardcoded por `t('organograma.xxx')`
- Strings afetadas: ~40 textos (títulos, botões, placeholders, labels de tab, empty states, tooltips)

### 3. Traduções

- Criar namespace `organograma` em ambos `translation.json` (PT e EN)
- Incrementar `I18N_VERSION` para `1.42.0`

### 4. Changelog + sync

- Entrada em `CHANGELOG.md` com `area: i18n`
- Rodar `npm run sync:changelog`

## Escopo estimado
- ~150 strings para traduzir
- 7 arquivos a modificar + 2 JSONs de tradução
- Interface `OrganogramaNode` ganha campos `title_en` / `description_en` opcionais
- `organogramaConvencoes` ganha campo `value_en` e `label_en`

## Detalhes técnicos

```text
projectOrganograma.ts
  ├── OrganogramaNode { title, title_en?, description, description_en? }
  ├── organogramaConvencoes[] { label, label_en, value, value_en }
  └── organogramaAscii → mantém em inglês técnico (já é code-like)

OrganogramaCards.tsx
  └── useTranslation() + t() para: "Buscar área...", "Expandir tudo",
      "Recolher tudo", "Nenhuma área encontrada"

OrganogramaTab.tsx  
  └── t() para: título, subtítulo, tabs (Grafo/Diagrama/Cards/Changelog),
      badges, footer

ChangelogTimeline.tsx / AreaMiniTimeline.tsx / Diagram / ForceGraph
  └── t() para labels, tooltips, estados vazios
```
