## Filtro por cohort de origem em Population Insights v0

Adicionar uma barra de filtro no topo da aba **Population Insights v0** (`src/components/administrador/priorizacoes/PopulationInsightsV0.tsx`) que permite restringir os cards exibidos àqueles gerados a partir de um evento de geração de cohort específico.

### Comportamento

- Nova linha de chips/tags acima do `<Tabs>` de estágios:
  - Chip **"Todos"** (default) — mostra todos os insights.
  - Chip **"Pan-cohort"** — mostra apenas insights com `cohort_id = null` (gerados por `analyze-all-cohorts-patterns`).
  - Um chip por cohort presente em `insights` (label = `cohortNames[cohort_id]`, com contagem `n` ao lado).
- Clicar em um chip ativa o filtro; clicar novamente no ativo volta para "Todos".
- Os 4 contadores de estágio (`grouped[s.id].length`) e os cards renderizados respeitam o filtro ativo.
- Apenas cohorts que têm pelo menos 1 insight aparecem como chip (evita poluição).
- Chips ordenados por contagem decrescente.

### Implementação técnica

- Novo estado `const [cohortFilter, setCohortFilter] = useState<string | 'all' | 'pan'>('all')`.
- `filteredInsights = useMemo(...)` aplica o filtro antes de `grouped`.
- `cohortChips = useMemo(...)` agrega `{ id, label, count }` a partir de `insights`.
- UI: `<div className="flex flex-wrap gap-1.5">` com `<Badge>` clicáveis estilizadas (ativa: `bg-indigo-600 text-white`; inativa: `bg-white border`).

### Escopo

- Sem mudanças em backend, edge functions, schema, ou outros componentes.
- Sem alterações de tradução obrigatórias (labels curtos em PT consistentes com o resto do componente que já está em PT hardcoded).
