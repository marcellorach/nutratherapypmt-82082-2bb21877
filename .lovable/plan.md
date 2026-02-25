

## Diagnóstico da Página Knowledge Graph

### O que encontrei

**O gráfico ESTÁ atualizado com os dados do Neo4j.** Testei diretamente a edge function e confirmei:
- Neo4j tem **1.206 nós** e **2.110 relações** (de 9 estudos sincronizados)
- Os estudos mais recentes (sincronizados hoje às 05:39) estão lá
- Com limit 5K, todos os 2.110 edges são retornados

### Por que parece "igual"

Existem **2 problemas reais** e **1 problema de percepção**:

**Problema 1: Race condition no slider** — O slider default é 500. Quando monta, carrega com 500 edges. Quando você clica em "5K", o `setTimeout(() => loadGraphData(), 100)` pode capturar o valor antigo do `edgeLimit` pela closure do React. Resultado: pode carregar 500 em vez de 5000.

**Problema 2: Sem dependência no `edgeLimit`** — O `useEffect` que chama `loadGraphData()` roda apenas no mount (`[]`). Mudar o slider NÃO re-renderiza automaticamente. Depende do `setTimeout` com o bug de closure.

**Problema 3 (Percepção): Classificação incorreta de entidades** — Nos logs do Neo4j vi nós como "SIRT1", "NF-κB", "AMPK", "mTORC1", "HSP90" classificados como tipo `Nutraceutical` quando são targets/mecanismos. Isso faz o gráfico parecer "mais do mesmo" porque muitas bolhas verdes (Nutraceutical) são na verdade entidades diferentes que deveriam ter outras cores.

### Plano de Correção

**A. Corrigir reload do gráfico quando o limit muda**

No `KnowledgeGraphViewer.tsx`:
- Adicionar `edgeLimit` como dependência de um `useEffect` que recarrega o gráfico
- Remover o `setTimeout` hacky do slider onChange
- Usar `useCallback` no `loadGraphData` com `edgeLimit` como dependência

```tsx
// Antes:
useEffect(() => {
  loadGraphData();
  loadDataSourceStats();
}, []);

// Depois:
useEffect(() => {
  if (studyFilter === 'all') {
    loadGraphData();
  }
}, [edgeLimit]);

useEffect(() => {
  loadDataSourceStats();
}, []);
```

E no slider:
```tsx
onChange={(newLimit) => {
  setEdgeLimit(newLimit);
  // Remove setTimeout - useEffect handles reload
}}
```

**B. Mostrar contadores no header do gráfico para confirmar dados carregados**

Adicionar um mini-badge acima do gráfico mostrando: `"1206 nodes · 2110 edges · Neo4j"` — assim o usuário tem feedback imediato de que os dados mudaram.

**C. Debounce no slider para não disparar muitos requests**

Adicionar um debounce de 500ms no `useEffect` do `edgeLimit` para que arrastar o slider não faça dezenas de requests.

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `KnowledgeGraphViewer.tsx` | Fix useEffect + edgeLimit dependency, remover setTimeout do slider, adicionar badge de contagem, debounce |

### Sobre a classificação incorreta de entidades

Isso é um problema de qualidade dos dados no pipeline de extração (o `generate-triplets` classifica "SIRT1" como "Nutraceutical" em vez de "Target"). É uma correção separada e mais profunda no prompt do LLM. Posso abordar isso depois se quiser.

