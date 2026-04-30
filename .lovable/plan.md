
## Problema

O Edge Function `kg-evidence-gap-fill` insere `subject_type: 'compound'` e `object_type: 'condition'` (minúsculos), mas o constraint `triplet_extractions_object_type_check` exige valores com inicial maiúscula: `'Compound'`, `'Condition'`.

Resultado: Perplexity encontra evidências, Gemini avalia, mas o INSERT falha silenciosamente. Zero triplets salvos, zero recalibragem.

## Plano

### 1. Fix case-sensitivity no Edge Function
**Arquivo**: `supabase/functions/kg-evidence-gap-fill/index.ts`

- Alterar `subject_type: 'compound'` para `subject_type: 'Compound'`
- Alterar `object_type: 'condition'` para `object_type: 'Condition'`
- Alterar `subject_layer` e `object_layer` se necessário para consistência

### 2. Redeploy e teste
- Redeployar a edge function
- Testar com curl para confirmar que triplets são salvos

### 3. Auto-invalidação do trajectory após gap-fill
**Arquivo**: `src/components/pet/EvidenceGapCard.tsx`

O callback `onTripletsAdded` já existe e é chamado quando `triplets_pending > 0`. Verificar se o pai (`DigitalTwinDog`) está reagindo corretamente para invalidar a query de trajectory e forçar recalculo do `years_gained`.

### 4. CHANGELOG
- Registrar fix no CHANGELOG.md

## Resultado esperado

Após o fix, ao rodar o gap-fill:
1. Perplexity encontra evidências (já funciona)
2. Triplets são salvos como "pending" no Kanban (fix do case)
3. O toggle "Preview with pending" mostra os novos triplets no grafo
4. Ao aprovar triplets, o Digital Twin recalcula `years_gained` com a nova evidência
