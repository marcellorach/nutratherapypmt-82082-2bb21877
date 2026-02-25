

## Diagnóstico: Catalog vs Relations vs Matrix

### O que cada aba faz HOJE

| Aba | Estado | Fonte de dados | Componente de tabela |
|-----|--------|----------------|---------------------|
| **Catalog** | Funcional | `useNutraceuticalContext()` → mesma query Supabase | `NutraceuticalTable` (pesquisa/nutraceuticoGerenciamento/) — tabela simples com nome, outcome, estudos, ações + CRUD + migração |
| **Relations** | **Stub vazio** | Nenhuma | 3 cards estáticos dizendo "em desenvolvimento" |
| **Matrix** | Funcional | `useNutraceuticalContext()` → **mesma query Supabase** | `NutraceuticosExpandableTable` (nutraceuticos/) — tabela expandível com prevenção/tratamento/suporte, convergência, estudos |

### Problema central: duplicidade real

**Catalog e Matrix buscam exatamente os mesmos dados** do mesmo contexto (`NutraceuticalContext`), que faz uma única query na tabela `nutraceuticals` com joins em `nutraceutical_conditions`, `nutraceutical_studies`, `nutraceutical_benefits`, etc.

A diferença é apenas a **visualização**:
- Catalog = tabela CRUD simples (gerenciamento)
- Matrix = tabela expandível com colunas de prevenção/tratamento/suporte (visualização científica)

Relations está 100% vazio — é um placeholder.

### Duplicidade no backend (serviços)

Existem **dois serviços paralelos** que fazem essencialmente a mesma coisa:

1. **`src/services/nutraceuticals.ts`** — classe `NutraceuticalsService` com `getAll()`, `create()`, `update()`, `delete()`, `addConditionRelation()`, etc.
2. **`src/services/nutraceuticals/index.ts`** — agregador que importa de `base-service.ts`, `query-service.ts`, `mutation-service.ts`, `relations-service.ts`

Ambos fazem queries à mesma tabela `nutraceuticals` com selects quase idênticos. O serviço modular (`/nutraceuticals/`) é a versão refatorada, mas o antigo (`nutraceuticals.ts`) ainda existe e pode estar em uso em outros lugares.

### Sua intuição está correta

Você disse: *"a lista de nutracêuticos demanda estudos atrelados, mas nem todos os nutracêuticos dos estudos precisam estar nessas listas — são nutracêuticos disponíveis para tratamentos"*.

Isso é exatamente o propósito. O **Catálogo** deveria ser a lista curada de nutracêuticos **disponíveis para prescrição/tratamento** — a base autoritativa. As relações com condições e estudos são atributos desses nutracêuticos, não uma coisa separada.

---

## Proposta de reorganização

### Conceito: Uma aba com dois modos de visualização

Em vez de 3 abas com sobreposição, consolidar em **uma interface única com alternância de visualização**:

```text
┌─────────────────────────────────────────────────────┐
│  Nutraceuticals Available for Treatment             │
│  [Stats cards: total, com condições, com estudos]   │
│                                                     │
│  [Search] [Filters] [View: 📋 Simple | 📊 Matrix]  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Tabela (alterna entre simples e expandível) │    │
│  │ - CRUD sempre disponível                    │    │
│  │ - Colunas de condições visíveis no modo     │    │
│  │   Matrix                                    │    │
│  │ - Gerenciamento de relações via diálogo     │    │
│  │   (já existe: ManageRelationshipsDialog)    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Ações concretas

1. **Eliminar a aba Relations** — está vazia, e a funcionalidade que promete (associar nutracêuticos a condições/estudos) já existe nos diálogos de CRUD e no `ManageRelationshipsDialog`

2. **Fundir Catalog + Matrix** — manter uma única aba com toggle de visualização:
   - **Modo Simples** (atual Catalog): tabela CRUD rápida para gestão
   - **Modo Matrix** (atual Matrix): tabela expandível com prevenção/tratamento/suporte e convergência
   
3. **Limpar serviços duplicados** — consolidar `src/services/nutraceuticals.ts` (classe) com `src/services/nutraceuticals/index.ts` (modular), mantendo apenas um

4. **Remover dados mockados** — a `NutraceuticosExpandableTable` gera números de estudos aleatórios com `Math.random()` em vez de usar dados reais. Isso deve usar os dados reais de `nutraceutical_studies`

### Detalhes técnicos da implementação

**Componentes a manter:**
- `NutraceuticosExpandableTable` (a melhor tabela, mais rica)
- `ManageRelationshipsDialog` (já gerencia relações)
- `NutraceuticalCRUDDialog` (CRUD completo)
- `StatsGrid` (cards de estatísticas)
- `NutraceuticalSearchFilters` (filtros avançados)

**Componentes a remover/deprecar:**
- `RelationsTab.tsx` (stub vazio)
- `NutraceuticalTable` do `pesquisa/nutraceuticoGerenciamento/` (duplica funcionalidade)
- Serviço antigo `src/services/nutraceuticals.ts` (se não estiver em uso exclusivo em outro lugar)

**Arquivo principal a modificar:**
- `NutraceuticalsUnifiedTab.tsx` — remover as 3 abas, substituir por interface unificada com toggle de visualização

**Estimativa**: 1 lote de implementação

