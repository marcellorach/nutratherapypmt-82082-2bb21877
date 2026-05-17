
## Objetivo
(a) Adicionar check verde em **Breeds & Predispositions**; (b) remover entrada **AI Processing** (link quebrado — tab não existe mais em `admin-tabs.ts`); (c) auditar todos os links do sidebar admin e listar duplicações, órfãos e tabs sem propósito.

---

## (a) Check verde — Breeds & Predispositions
Em `KnowledgeBaseGroup.tsx`, adicionar `<StatusBadge>` verde (text-emerald-500) ao lado do label, com novas chaves i18n:
- `admin.sidebar.knowledgeBase.breedsManagementStatus` = "100% functional" / "100% funcional"
- `admin.sidebar.knowledgeBase.breedsManagementStatusTooltip` (PT/EN)

## (b) Remover "AI Processing"
- Apagar o `SidebarMenuItem` `processamento-ia` em `KnowledgeBaseGroup.tsx` (linhas ~246–264). Confirmado: o tab já não existe em `admin-tabs.ts` — é um link morto que renderiza tela vazia.
- Manter "A.I. Insights" (`ai-insights`), que é diferente e funcional.

## (c) Auditoria do Sidebar

### 🔴 Links quebrados (apontam para tab inexistente em `admin-tabs.ts`)
| Sidebar | Tab ID | Status |
|---|---|---|
| AI Processing (Knowledge Base) | `processamento-ia` | **Removida em changelog anterior — remover do sidebar** (item b) |

### 🟡 Duplicações (mesma tab em dois grupos)
| Tab ID | Aparece em | Recomendação |
|---|---|---|
| `custo-beneficio` (Análise de ROI) | **Actions** + **Predictive Analysis** | Manter apenas em Predictive Analysis (lar conceitual) |
| `modelos` (Modelos Preditivos) | **Research** + **Predictive Analysis** | Manter apenas em Predictive Analysis |
| `knowledge-base-settings` (Configurações da KB) | **Knowledge Base** + **Configuration** | Manter apenas em Knowledge Base (contextual) |
| `actions` (Ações) | **Configuration** (grupo do sidebar) mas tab definida como `group: 'configuration'` | OK — mas o label "Ações" duplica conceito do grupo "Ações". Considerar renomear para "Ações em Lote" |

### 🟠 Tabs definidas em `admin-tabs.ts` mas SEM link no sidebar (órfãs)
Estas tabs só são acessíveis via URL direta — invisíveis para o usuário:
- `triplet-curation` — Curadoria de Triplets (substituída pela curadoria integrada em EstudoDetailDialog conforme comentário no código → **remover do admin-tabs.ts**)
- `evidence-conflicts` — Conflitos de Evidência (decidir: adicionar ao sidebar ou remover)
- `pet-food-catalog` — Catálogo de Rações (adicionar ao sidebar em Knowledge Base)
- `dosage-curation` — Curadoria de Doses (adicionar ao sidebar em Knowledge Base)
- `fontes` — Fontes (Data Processing) (decidir: adicionar ou remover)
- `analysis` — Análise (Data Processing) (decidir)
- `analytics`, `triplet-quality`, `design-conventions`, `translation-manager`, `access-requests`, `ontology-mapping`, `gapfill-diagnostics` — verificar quais já têm link em ConfigurationGroup vs órfãs

### 🔵 Possivelmente fora de propósito (foco metabólico/degenerativo canino)
| Tab | Avaliação |
|---|---|
| `acompanhamento` — Gestão de Campanhas de marketing | Fora do escopo clínico — mover para grupo separado ou remover |
| `microbiome` (MicrobiomeAnalysisTab importada mas sem entrada em `adminTabsConfig`) | Import órfão — remover do arquivo |

### 📋 Entregáveis da Fase (c)
1. Documento de auditoria (chat) com a tabela acima validada após o usuário decidir.
2. Para cada decisão "remover/manter/mover", aplicar em loop subsequente — **esta plano não faz mudanças destrutivas em (c) sem aprovação por item**.

---

## Arquivos afetados (fases a+b confirmadas)
- `src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx` — adiciona check verde em Breeds + remove bloco AI Processing
- `src/locales/pt/translation.json` + `src/locales/en/translation.json` — chaves breedsManagementStatus / Tooltip
- `src/i18n.ts` — bump `I18N_VERSION` → `1.78.7`

## Fora de escopo neste loop
- Remoções/movimentações de tabs em `admin-tabs.ts` e nos demais grupos do sidebar (item c) — só após você confirmar quais itens da tabela acima quer aplicar.
