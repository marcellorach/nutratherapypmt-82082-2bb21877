

## Plano: Badges de Status no Research Group

Adicionar badges de status (CircleCheck + Tooltip) nos 3 itens do grupo Research no sidebar, reutilizando o componente `StatusBadge` já existente no `KnowledgeBaseGroup.tsx`.

### Itens e percentuais:
- **Study Proposals** (sugestoes-ai): 70% → amarelo (`text-yellow-500`)
- **Planned Studies** (estudos-planejados): 90% → verde-claro (`text-emerald-400`)
- **Ongoing Studies** (estudos-andamento): 90% → verde-claro (`text-emerald-400`)

### Arquivos a modificar:

| Arquivo | Mudança |
|---------|---------|
| `ResearchGroup.tsx` | Importar Tooltip, CircleCheck; adicionar StatusBadge nos 3 itens |
| `translation.json` (PT) | 6 chaves: status + tooltip para cada item |
| `translation.json` (EN) | 6 chaves correspondentes |
| `i18n.ts` | Incrementar versão para 1.9.84 |

### Chaves i18n:

**PT:**
- `proposedStudiesStatus`: "70% Funcional"
- `proposedStudiesStatusTooltip`: "Sistema de propostas por IA funcional. Falta integração com pipeline de aprovação automatizado."
- `plannedStudiesStatus`: "90% Funcional"
- `plannedStudiesStatusTooltip`: "CRUD completo e recrutamento visual. Falta integração com calendário e notificações."
- `ongoingStudiesStatus`: "90% Funcional"
- `ongoingStudiesStatusTooltip`: "Painel detalhado com progresso e métricas. Falta integração com dados em tempo real."

**EN:** equivalentes em inglês.

### Implementação técnica:
Criar componente `StatusBadge` local no `ResearchGroup.tsx` (mesmo padrão do `KnowledgeBaseGroup.tsx`) e inserir dentro do `<div className="flex items-center">` de cada item, após o `<span>`.

