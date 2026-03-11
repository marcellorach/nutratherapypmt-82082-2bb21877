

## Plano: Triplet Review Enriquecido + Banco de Triplets

Faz total sentido. A ideia é transformar o Review Dialog num painel completo de decisão — com as mesmas ferramentas que já existem na curadoria dos estudos — e criar um "Banco de Triplets" centralizado com abas (Pendentes, Aprovados, Rejeitados) acessível do KG.

### 1. Enriquecer o TripletReviewDialog

Expandir o dialog atual (`TripletReviewDialog.tsx`) para incluir:

| Funcionalidade | Origem | Descrição |
|---|---|---|
| **Source Excerpts** | `study_embeddings` | Buscar trechos do estudo original que mencionam subject/object — mesma lógica do `sourceChunkCache` em `StudyTripletCuration` |
| **Inline Chat contextual** | `TripletInlineChat` | Reutilizar o componente já existente, passando subject/predicate/object + studyId para Q&A específico sobre o triplet |
| **Metadados expandidos** | `triplet_extractions` | Mostrar evidence_level, intensity, direction, mechanism_path, dose_range, hallucination_flag, layers (L0-L4) |
| **Informação externa** | Badge visual | O chat já pode trazer informações externas via LLM — adicionar um disclaimer visual claro ("⚠️ Fonte: IA / Conhecimento externo") vs ("📄 Fonte: Estudo original") para distinguir |

### 2. Criar Banco de Triplets centralizado

Novo componente `TripletBankDialog.tsx` acessível do painel do Knowledge Graph (botão no header ou nos stats):

- **3 abas**: Pendentes, Aprovados, Rejeitados
- Cada aba com busca, paginação e contadores
- Cada triplet com botão "Revisar" que abre o TripletReviewDialog enriquecido
- Triplets aprovados/rejeitados podem ser **revertidos** (mudar status de volta)
- Filtragem por estudo de origem, tipo de entidade, predicate

### Mudanças

| Arquivo | Ação |
|---|---|
| `src/components/administrador/visualizations/kg-stats/TripletReviewDialog.tsx` | Expandir com: source excerpts (busca em study_embeddings), TripletInlineChat integrado, metadados completos (layers, intensity, direction, dose_range, hallucination_flag), disclaimer visual fonte interna vs externa |
| `src/components/administrador/visualizations/kg-stats/TripletBankDialog.tsx` | **Novo** — Dialog com Tabs (Pending/Approved/Rejected), busca, filtros por estudo e tipo, botão Revisar em cada item, ações de reverter status |
| `src/components/administrador/visualizations/KnowledgeGraphStatDialog.tsx` | Remover lógica inline de pending/approved-triplets e redirecionar para o TripletBankDialog |
| `src/components/administrador/visualizations/KnowledgeGraphStats.tsx` (ou equivalente) | Adicionar botão "Banco de Triplets" no header do KG stats para abrir o TripletBankDialog |

### Fluxo do usuário

```text
KG Stats → clica "Pending Triplets" ou "Banco de Triplets"
  → TripletBankDialog abre com 3 abas
    → Clica "Revisar" num triplet
      → TripletReviewDialog abre com:
        ├── Cadeia visual (subject → predicate → object)
        ├── Metadados completos (confidence, evidence, layers, intensity...)
        ├── Trechos do estudo original (📄)
        ├── Chat contextual com disclaimer (📄 vs ⚠️ externo)
        └── Botões Aprovar / Rejeitar com notas
```

