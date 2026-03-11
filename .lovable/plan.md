

## Plano: Reformular Import History com Estudos e Log de Duplicidade

### Problema atual
O HistoryTab mostra dados do `scispace_imports` (meta_summary_filename, base_studies_filename) que são campos do fluxo SciSpace antigo. Para uploads manuais de PDF, esses campos ficam vazios/sem sentido. Falta: nomes dos estudos importados, data formatada corretamente, e log da verificação de duplicidade.

### Abordagem

Reformular o HistoryTab para mostrar dados centrados nos **estudos importados** (via `processed_studies`), agrupados por `source_import_id`. A verificação de duplicidade será registrada no momento do upload e exibida no histórico.

### Mudanças

| Arquivo | Ação |
|---|---|
| **Migração SQL** | Adicionar coluna `duplicate_check_log JSONB DEFAULT '[]'` em `processed_studies` para armazenar o resultado da verificação |
| `FileUploadTab.tsx` | Ao inserir em `processed_studies`, salvar o resultado do duplicate check no campo `duplicate_check_log` |
| `HistoryTab.tsx` | Reformular completamente: buscar `scispace_imports` com os `processed_studies` associados via join. Mostrar tabela com: data/hora formatada, lista de estudos (title/original_filename), contagem, e status da verificação de duplicidade |
| `SciImportHistoryRow.tsx` | Reformular para mostrar: data formatada (corrigir o bug "há menos de um dia"), nomes dos estudos expandíveis, ícones de status de duplicidade (verde = limpo, amarelo = similar ignorado, vermelho = exato ignorado) |

### Detalhes

**1. Log de duplicidade no upload** — No `FileUploadTab.tsx`, ao inserir cada `processed_study`, incluir:
```json
{
  "check_type": "none" | "similar" | "exact",
  "similar_to": "nome do estudo existente",
  "similarity": 0.87,
  "action": "imported" | "skipped",
  "checked_at": "2026-03-11T..."
}
```

**2. Query do histórico** — Buscar `scispace_imports` com contagem de estudos:
```sql
scispace_imports(id, imported_at, import_type, scispace_status)
+ processed_studies(id, title, original_filename, kanban_status, duplicate_check_log) via source_import_id
```

**3. UI do histórico reformulado** — Cada linha mostra:
- Data/hora formatada corretamente (usando `date-fns`)
- Tipo de importação (manual/scispace)
- Contagem de estudos (ex: "3 estudos")
- Expandir para ver lista de estudos com ícone de verificação de duplicidade
- Status geral da importação

**4. Correção do formatDate** — Remover o hardcoded "há menos de um dia" e usar `date-fns/formatDistanceToNow` ou formato `dd/MM/yyyy HH:mm`.

