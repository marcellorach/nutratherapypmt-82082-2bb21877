
# Organograma do Projeto — área admin (inspirada em Sleep Graph RAG)

## Por que vale a pena

O projeto Sleep Graph RAG resolveu o mesmo problema que enfrentamos: complexidade alta + agente AI cometendo erros por falta de visão estrutural. A solução deles é um **espelho tipado e visual da arquitetura** que vive no código (não em Markdown solto), com 4 lentes complementares e changelog integrado por área. Os ganhos relatados ("menos erros do agente") batem com nossa hipótese.

## O que vou construir

Nova tab admin **"Organograma"** dentro do grupo `configuration` (rota `/administrador?tab=organograma`), com 4 sub-abas:

```text
Organograma do Projeto
├─ Grafo       (force-graph 2D — áreas como hubs, componentes como folhas, cross-links)
├─ Diagrama    (Mermaid hierárquico com pan/zoom estilo Figma)
├─ Cards       (árvore expansível por área + busca + ASCII fallback)
└─ Changelog   (timeline filtrada por área/status, lendo CHANGELOG.md estruturado)
```

Cabeçalho com data da última atualização + card "Convenções Core" (regras transversais do projeto: bilíngue obrigatório, no-mock, canonical IDs, etc — extraídas da memória).

## Arquitetura de dados (single source of truth)

Três arquivos novos em `src/data/` — tipados, versionados no git, lidos pela UI:

1. **`src/data/projectOrganograma.ts`**
   - `OrganogramaArea[]` com `key` (auth, curation, kg, rag, recommendations, clinical, vet-ui, tutor-ui, admin, infra, i18n)
   - Cada área: `title`, `description`, `children: OrganogramaNode[]` com `files[]` apontando para os componentes/edge functions reais
   - Constante `organogramaLastUpdated` + `organogramaConvencoes[]` + `organogramaAscii` (árvore ASCII gerada)

2. **`src/data/organogramaAreaMeta.ts`**
   - `AREA_META` mapeando cada `key` → ícone Lucide + paleta (tone, ring, badge) usando design tokens semânticos do projeto

3. **`src/data/projectChangelog.ts`**
   - `ChangelogEntry[]` tipado (`date`, `area`, `title`, `bullets[]`, `files[]`, `status: 'entregue'|'parcial'|'revertido'`)
   - Inicialmente populado a partir das últimas ~30 entradas do `CHANGELOG.md` atual
   - Reordenado por data desc

## Componentes novos

```text
src/pages/administrador/OrganogramaTab.tsx        (página principal com Tabs)
src/components/administrador/organograma/
  ├─ OrganogramaForceGraph.tsx    (react-force-graph-2d — já temos a lib)
  ├─ OrganogramaDiagram.tsx       (mermaid + hook useScrollPanZoom)
  ├─ OrganogramaCards.tsx         (árvore expansível + busca + ASCII)
  └─ ChangelogTimeline.tsx        (filtros por área/status + busca)
src/hooks/useScrollPanZoom.ts     (zoom no scroll + pan por arrasto, estilo Figma)
```

## Integrações com o que já existe

- **Reaproveita `react-force-graph-2d`** já presente (KG visualization)
- **Lê de `CHANGELOG.md`** apenas no momento do bootstrap; depois a fonte canônica passa a ser `projectChangelog.ts` (espelho tipado)
- **Bilíngue obrigatório**: todas as labels passam por `useTranslation()` + chaves em `pt/en/translation.json` + bump de `I18N_VERSION` em `src/i18n.ts` (regra do projeto)
- **Registra-se em `admin-tabs.ts`** como nova entrada no grupo `configuration` (lazy-loaded)
- **Atualiza `ARCHITECTURE.md` v1.MINOR+1** + `CURRENT_STATE.md` + `CHANGELOG.md` (regra do projeto)

## Atualização da knowledge base (regra de manutenção)

Adiciono uma nova **memory rule** (`mem://architecture/organograma-source-of-truth`) com o protocolo:

> Sempre que houver mudança estrutural (nova tab, novo componente principal, refactor de área, nova edge function relevante), atualizar **simultaneamente**:
> 1. `src/data/projectOrganograma.ts` (nó da área afetada)
> 2. `src/data/projectChangelog.ts` (nova entrada no topo)
> 3. `organogramaLastUpdated`
> 4. `CHANGELOG.md` ([Unreleased])
> 5. `I18N_VERSION` se mexer em strings

E referência no `index.md` Core. Isso institucionaliza o padrão que tem reduzido seus erros.

## Conteúdo inicial das áreas (proposta — confirmo na execução)

- **Auth & Acesso** — login, profiles, user_roles, access_requests
- **Curadoria Científica** — upload PDFs, digestão, embeddings, triplet extraction, kanban de curadoria, dose curation
- **Knowledge Graph** — Neo4j sync, hierarchical_edges, visualization, relations tab, ontologia
- **Base de Conhecimento** — base entities, breeds, lab references, ontology mapping
- **Pipeline Clínico VetGraphRAG** — runClinicalAnalysisPipeline (7 estágios), edge functions de projeção, missing triplets
- **UI Veterinário** — PetProfilePage, BiologicalTimeline, recommendations, abas analíticas, chats
- **UI Tutor** — landing, planos, acompanhamento
- **Admin & Curadoria** — todas as tabs admin agrupadas
- **i18n** — versionamento, audit, manager
- **Infra** — Lovable Cloud (Supabase), edge functions config, secrets, storage

## O que NÃO faço nesta entrega

- Não conecto changelog a webhook git (mantém-se manual via espelho tipado, igual Sleep Graph)
- Não removo `CHANGELOG.md` — ele continua canônico para changelog técnico; `projectChangelog.ts` é a vista UI do admin
- Não mexo em outras páginas ou design existente

## Detalhes técnicos

- **Lazy load** da tab via padrão atual em `admin-tabs.ts`
- **Force-graph**: nodes = áreas (hub colorido grande) + componentes (folha pequena); links = parent-child + cross-area refs (ex.: pipeline clínico → KG)
- **Mermaid**: orientação alternável TD/LR; SVG renderizado em `useEffect`; pan/zoom via translate+scale (não scroll), com `fit()` automático no mount/troca de tab/fullscreen — replica a solução já validada no Sleep Graph
- **Busca**: full-text em title/description/files, com expansão automática dos nós que casam
- **Permissão**: tab visível só com `role=admin` (igual à `MissingTripletsDialog` recém-adicionada)

Após sua aprovação eu implemento ponta a ponta, popular dados iniciais a partir do código real do projeto e atualizar a documentação + memory rule.
