

## Plano: Botão de Revisão nos Pending Triplets

Sim, sua interpretação está correta. Os "pending triplets" são exatamente aqueles que não passaram pelo threshold de confiança ou que você não aprovou manualmente na curadoria do estudo.

### O que será feito

Adicionar um botão "Revisar" em cada triplet pendente no dialog do KG Stats (`KnowledgeGraphStatDialog.tsx`). Ao clicar, abre um dialog de revisão inline com:

1. **Detalhes completos do triplet** — subject, predicate, object, confiança, evidence level, confidence rationale, species context
2. **Ações de curadoria** — botões Aprovar / Rejeitar com notas opcionais
3. **Atualização em tempo real** — ao aprovar/rejeitar, o triplet sai da lista de pendentes e o contador atualiza

### Mudanças

| Arquivo | Ação |
|---------|------|
| `src/components/administrador/visualizations/KnowledgeGraphStatDialog.tsx` | Adicionar botão "Revisar" ao lado de cada pending triplet + estado para dialog de revisão inline |
| `src/components/administrador/visualizations/kg-stats/TripletReviewDialog.tsx` | **Novo** — Dialog com detalhes completos do triplet + botões Aprovar/Rejeitar + campo de notas |

### Detalhes do TripletReviewDialog

- Recebe o triplet completo (id, subject, predicate, object, confidence, rationale, evidence_level, study_id, etc.)
- Mostra a cadeia: `[subject_type] subject_name → predicate → [object_type] object_name`
- Mostra confidence com badge colorido + confidence_rationale se existir
- Campo textarea para review_notes
- Botões: "Aprovar" (verde, atualiza `curation_status = 'approved'`) e "Rejeitar" (vermelho, `curation_status = 'rejected'`)
- Callback `onReviewed` para remover o item da lista e atualizar contadores

