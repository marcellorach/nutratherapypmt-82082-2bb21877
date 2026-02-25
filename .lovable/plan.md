

## Plano: Enriquecer Details dos Triplets + Corrigir Workflow de Aprovação

---

### Problema A: "Details" genéricos e sem contexto do estudo

Atualmente, ao expandir um triplet, o revisor vê campos genéricos (Evidence Level: N/A, Intensity: N/A, KG Match: N/A). Não há nenhuma informação do estudo científico que gerou aquele triplet — nenhum trecho de texto, nenhum contexto, nenhum link.

**Proposta**: Ao expandir os details de um triplet, buscar o trecho mais relevante do texto do estudo (`study_embeddings.chunk_text`) e exibi-lo como "Trecho de Origem", junto com o título do estudo e um link para abrir a tab de Chat (onde pode fazer perguntas sobre o estudo).

#### O que será adicionado nos Details expandidos:

```text
┌─────────────────────────────────────────────────────┐
│ 📄 Trecho de Origem (do estudo)                      │
│ ┌─────────────────────────────────────────────────┐  │
│ │ "L-carnitine has been shown to support mito-    │  │
│ │ chondrial function in aging canines, with        │  │
│ │ evidence suggesting benefits for..."             │  │
│ └─────────────────────────────────────────────────┘  │
│ Fonte: Geroscience and aging interventions...        │
│ [🔗 Ver no estudo]  [💬 Perguntar à IA]             │
│                                                      │
│ Racional da Nota: Base: review (0.6) + canine (+0)  │
│ Evidence Level: N/A    Intensidade: N/A              │
│ Espécies: 🐾 canine                                  │
│ KG Match: N/A         LLM Confidence: 100%           │
└─────────────────────────────────────────────────────┘
```

#### Implementação técnica:

1. **No `TripletCard`**: Quando expandido, fazer uma query a `study_embeddings` buscando chunks que contenham `subject_name` ou `object_name` do triplet, limitado a 1-2 chunks mais relevantes
2. **Exibir**: O chunk_text truncado (300 chars), título do estudo (já disponível via join), botão "Ver no estudo" que muda a tab do dialog para "chat" com a pergunta pré-populada
3. **Fallback**: Se não houver chunks, mostrar mensagem "Texto original não disponível (estudo não vetorizado)"
4. **Cache local**: Usar state no componente para cachear chunks já buscados, evitando queries repetidas

#### Arquivos afetados:
- `src/components/administrador/estudos/curation/StudyTripletCuration.tsx` — adicionar fetch de chunks e seção "Trecho de Origem" no bloco expandido (linhas 762-832)

---

### Problema B: Threshold de aprovação inconsistente

Existem **3 thresholds diferentes** no sistema:

| Local | Threshold | Tipo |
|-------|-----------|------|
| `useStudyApprovalWorkflow.ts` (linha 30) | `>= 0.7` (hardcoded) | Auto-aprovação real |
| `EstudoDetailDialog.tsx` (linha 76) | `>= 0.7` (hardcoded) | Preview "Will auto-approve" |
| `StudyTripletCuration.tsx` slider | Default 85%, editável 50-99% | UI bulk actions |

O resultado é que:
- O slider diz 85% mas o botão "Yes, Approve" usa 70%
- O preview mostra "Will be auto-approved: 0" porque com 70%, a maioria dos pendentes está em 0.60 (abaixo)
- Auto-approvals anteriores incluem triplets com 0.60, sugerindo que o threshold mudou

**Proposta**: Unificar o threshold. O slider do `StudyTripletCuration` define o valor, e esse valor é passado para o workflow de aprovação.

#### Implementação técnica:

1. **`EstudoDetailDialog.tsx`**: Adicionar state `approvalThreshold` (default 70%), exibir no confirmation dialog com opção de ajuste rápido
2. **`useStudyApprovalWorkflow.ts`**: Modificar `autoApproveTriplets` para aceitar `threshold` como parâmetro em vez de hardcodar 0.7
3. **`EstudoDetailDialog.tsx` confirmation**: Usar o threshold correto para calcular `willAutoApprove`
4. **Consistência**: Exibir claramente qual threshold será usado no dialog de confirmação

#### Arquivos afetados:
- `src/hooks/useStudyApprovalWorkflow.ts` — parametrizar threshold
- `src/components/administrador/dialogs/EstudoDetailDialog.tsx` — passar threshold, ajustar preview

---

### Seção Técnica: Queries e Performance

**Query para buscar trecho de origem do triplet:**
```sql
SELECT chunk_text, chunk_index 
FROM study_embeddings 
WHERE study_id = :studyId 
  AND (chunk_text ILIKE '%subject_name%' OR chunk_text ILIKE '%object_name%')
LIMIT 2
```

Esta query é feita sob demanda (quando o usuário clica em "Details"), não pré-carregada, para evitar sobrecarga. O resultado é cacheado em memória local do componente.

**i18n**: Novas chaves necessárias para "Trecho de Origem", "Ver no estudo", "Perguntar à IA", "Texto original não disponível".

---

### Resumo de mudanças

| Arquivo | Mudança |
|---------|---------|
| `StudyTripletCuration.tsx` | Adicionar fetch de chunks + seção "Trecho de Origem" nos details expandidos |
| `useStudyApprovalWorkflow.ts` | Parametrizar threshold (aceitar como argumento) |
| `EstudoDetailDialog.tsx` | Passar threshold para workflow, ajustar cálculo de preview |
| `src/locales/pt/translation.json` | Chaves para trecho de origem |
| `src/locales/en/translation.json` | Idem |
| `src/i18n.ts` | Incrementar versão |

