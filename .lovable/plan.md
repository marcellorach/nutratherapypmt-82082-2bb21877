

## Plano: Melhorias no KG — Stats por Estudo, Visibilidade do Filtro e Remoção do Enrich

### Problemas identificados

1. **Stats de triplets incorretas quando um estudo está selecionado** — O hook `useKnowledgeGraphStats` sempre busca contagens globais, ignorando o `studyFilter`. Quando se filtra por estudo, os números de pending/approved/rejected deveriam refletir apenas aquele estudo.

2. **Estudo selecionado não visível nos cards de stats nem no painel** — Quando um estudo é filtrado, não há indicação visual clara nos cards de estatísticas nem no painel lateral.

3. **Botão "Enrich with Studies"** — Deve ser removido completamente.

### Mudanças

| Arquivo | Ação |
|---|---|
| `useKnowledgeGraphStats.ts` | Aceitar parâmetro opcional `studyId`. Quando presente, filtrar queries de `triplet_extractions` e `processed_studies` por `study_id` |
| `KnowledgeGraphStatsSection.tsx` | Propagar `studyId` para o hook e exibir banner com nome do estudo selecionado |
| `KnowledgeGraphViewer.tsx` | (a) Passar `studyFilter` e `selectedStudyDetails` para `KnowledgeGraphStatsSection`; (b) Remover botão "Enrich with Studies", estado `enrichDialogOpen`, e import do `EnrichKnowledgeGraphDialog`; (c) Adicionar indicador visual do estudo selecionado na área de filtros com botão "Todos os estudos" para limpar |
| `KGExtractedKnowledgeRow.tsx` | Mostrar nome do estudo no subtítulo quando filtrado |

### Detalhes técnicos

**Hook `useKnowledgeGraphStats`**: Adicionar `studyId?: string` ao parâmetro. Nas queries de `triplet_extractions`, adicionar `.eq('study_id', studyId)` quando presente. Para `activeStudies`, quando filtrado, retornar 1. Incluir `studyId` na dependency array do `useCallback`.

**Visibilidade do estudo selecionado**: Adicionar um banner/chip acima dos stats cards mostrando "📄 Filtrando por: [nome do estudo]" com botão X para voltar a "todos". No painel lateral (Sheet), adicionar botão "Ver todos os estudos" que faz `setStudyFilter('all')`.

**Remoção do Enrich**: Remover o `<EnrichKnowledgeGraphDialog>`, o botão que o abre, o estado `enrichDialogOpen`, e o import do componente.

