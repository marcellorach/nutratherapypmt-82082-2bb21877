

## Plano: Substituir card VetGraphRAG por Guia Visual do Sistema

### Problema
O card `UploadEstudoForm` (foto 1) mostra informações técnicas redundantes: título VetGraphRAG, pipeline de ícones, status de serviços (DB/KG/AI/Store) e diagrama de arquitetura. Isso não ajuda o administrador a entender **o que fazer** no sistema.

### Proposta
Substituir por um **Guia Visual interativo** que mostra todas as seções da sidebar (foto 2) com descrições claras do propósito de cada uma, organizado como um painel informacional elegante. Cada item será clicável e navegará para a seção correspondente.

### Design do componente `SystemGuideCard`

Um card com layout em grid mostrando as 10 seções do Knowledge Base, cada uma com:
- Ícone (mesmo da sidebar)
- Nome da seção
- Descrição curta (1 linha) do propósito
- Badge de status (operacional/em desenvolvimento)
- Click navega para a seção

Organização visual em 2 colunas (desktop) / 1 coluna (mobile), com agrupamento lógico:

| Grupo | Seções |
|---|---|
| **Ingestão** | Scientific Digestion, AI Processing |
| **Ontologia** | Nutraceuticals, Veterinary Targets, Breeds & Predispositions, Lab References, Base Data |
| **Relações & Grafo** | Knowledge Graph, Relations, Ontology Audit |
| **Inteligência** | AI Insights |

### Mudanças

| Arquivo | Ação |
|---|---|
| `src/components/administrador/estudos/SystemGuideCard.tsx` | **Criar** — novo componente com grid de seções, ícones, descrições e navegação |
| `src/components/administrador/EstudosTab.tsx` | **Editar** — substituir `<UploadEstudoForm />` por `<SystemGuideCard />` |
| `src/locales/pt/translation.json` | **Editar** — adicionar descrições curtas para cada seção |
| `src/locales/en/translation.json` | **Editar** — idem em inglês |
| `src/i18n.ts` | **Editar** — bump versão |

O `UploadEstudoForm.tsx`, `CompactPipeline.tsx`, `CompactSystemStatus.tsx` e `DataArchitectureDiagram.tsx` ficam no código mas deixam de ser referenciados neste contexto (podem ser removidos depois se não usados em outro lugar).

### Detalhes visuais

- Header: "Base de Conhecimento — Guia do Sistema" com ícone de mapa
- Cada item: card mini com hover effect, ícone à esquerda, nome + descrição à direita, badge de status no canto
- Cores sutis por grupo (border-left colorido)
- Footer: texto pequeno "Clique em qualquer seção para navegar"
- O componente recebe `onNavigate(step: string)` via props, usando `useSearchParams` para navegar

