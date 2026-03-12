

## Plano: Unificar dados do Knowledge Graph na aba Relações

### Problema
O hook `useSankeyData` consulta apenas tabelas legadas manuais (`nutraceuticals`, `health_conditions`, `nutraceutical_conditions`, `nutraceutical_studies`) que contêm poucos registros. Enquanto isso, centenas de relações extraídas por IA vivem em `hierarchical_edges` com campos ricos (`source_type`, `target_type`, `relationship`, `confidence`, `evidence_count`).

### Solução
Reescrever `useSankeyData` para buscar dados primariamente de `hierarchical_edges`, criando nós a partir dos `source_id`/`target_id` distintos e links a partir de cada edge. Manter as tabelas legadas como fallback/complemento.

### Mudanças

| Arquivo | Ação |
|---|---|
| `src/hooks/visualizations/useSankeyData.ts` | **Reescrever** — Query principal em `hierarchical_edges` (limit 2000). Extrai nós únicos de `source_id`+`source_type` e `target_id`+`target_type`. Mapeia `source_type`/`target_type` para cores do KG (Nutraceutical=verde, Condition=laranja, Mechanism=azul escuro, Target=azul, Effect=amarelo, etc). Links usam `confidence` e `evidence_count` para valor/espessura e `relationship` como label. Mantém query legada como merge secundário. |
| `src/components/administrador/visualizations/relations/utils.ts` | **Editar** — Remover geração de links simulados/falsos (extraLinks). Com dados reais do KG não precisa inventar conexões. Ajustar mapeamento de cores para os novos `source_type` values. |
| `src/components/administrador/visualizations/relations/RelationsHeader.tsx` | **Editar** — Adicionar filtros por `source_type`/`target_type` (ex: filtrar apenas Nutraceutical→Condition) e por `evidence_level`. |

### Detalhes técnicos

**Query `hierarchical_edges`**:
```sql
SELECT source_id, source_type, target_id, target_type, 
       relationship, confidence, evidence_count, evidence_level
FROM hierarchical_edges
ORDER BY evidence_count DESC
LIMIT 2000
```

**Mapeamento de nós**: Cada `source_id`+`source_type` e `target_id`+`target_type` únicos geram um nó. O `source_id`/`target_id` contém o nome da entidade. Cores seguem o padrão do KG existente (17 tipos).

**Links**: `value = confidence * evidence_count` (normalizado). `relationshipType` vem do campo `relationship`. Cor baseada no `evidence_level` (strong=verde, moderate=azul, emerging=amarelo).

**Filtros atualizados**: O `relationshipFilter` passa a listar os predicados reais do KG (`activates`, `inhibits`, `treats`, `modulates`, etc.) em vez dos 3 tipos legados.

