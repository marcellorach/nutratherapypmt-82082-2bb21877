## Problema raiz

A busca do Perplexity **está funcionando** — encontrou evidências reais (ex: Chondroitin Sulfate → Osteoarthritis, clinical trial canino, efficacy 4/5). Porém **100% dos inserts falham** por dois bugs de mapeamento:

1. **`direction: 'positive'`** — o constraint `chk_direction` só aceita: `improves | worsens | neutral | bidirectional`
2. **`evidence_level`** — o código envia valores como `clinical_trial`, `in_vivo`, `review`, `unclear`, mas o constraint `chk_evidence_level` só aceita: `meta_analysis | rct | cohort | case_control | case_report | in_vitro | expert_opinion`

Por isso: 10 pares buscados, 1 estudo inserido (o estudo científico em si é salvo OK), mas 0 triplets pendentes (todos falharam no insert).

---

## Plano

### 1. Corrigir mapeamento de valores no Edge Function

**Arquivo:** `supabase/functions/kg-evidence-gap-fill/index.ts`

- Mapear `direction: 'positive'` → `'improves'`, `'negative'` → `'worsens'`
- Criar dicionário de mapeamento para `evidence_level`:
  - `clinical_trial` → `rct`
  - `in_vivo` → `cohort`
  - `review` → `expert_opinion`
  - `unclear` → `expert_opinion`
  - `case_report` → `case_report` (OK)
  - `meta_analysis` → `meta_analysis` (OK)
  - `in_vitro` → `in_vitro` (OK)

### 2. Melhorar UI com conclusões claras

**Arquivo:** `src/components/pet/EvidenceGapCard.tsx`

- Para cada par no `details`, exibir:
  - Score de eficácia (0-5) com barra visual colorida
  - Nível de evidência (badge)
  - Rationale/conclusão do Gemini/Perplexity (texto colapsável)
  - PMIDs citados como links para PubMed
  - Espécie da evidência (canine vs rodent vs human)
- Separar visualmente pares com sucesso vs falha vs sem evidência

### 3. Adicionar ação "Enviar para curadoria no Grafo"

**Arquivo:** `src/components/pet/EvidenceGapCard.tsx`

- Após busca com resultados, mostrar botão "Abrir Curadoria de Triplets" que leva à tab de curadoria admin (`/administrador?tab=triplet-curation`)
- O botão já existe parcialmente (quando `pendingCount > 0`), mas precisa funcionar melhor após a correção dos inserts — agora os triplets serão criados corretamente como `pending`

### 4. Governança (i18n + changelog)

- Adicionar chaves PT/EN para novos textos (rationale, efficacy labels)
- Incrementar `I18N_VERSION` para `1.47.0`
- Atualizar `CHANGELOG.md`

---

## Resultado esperado

Ao clicar "Search PubMed for evidence":
1. Perplexity/PubMed buscam evidências para cada par (compound × condition)
2. Estudos científicos são salvos no DB
3. **Triplets são inseridos como `pending`** (bug corrigido)
4. UI mostra conclusão clara: "Chondroitin Sulfate → Osteoarthritis: efficacy 4/5, clinical trial canino, rationale: ..."
5. Botão para ir à curadoria aparece com contagem de triplets pendentes
6. Na curadoria, o admin aprova/rejeita, e os aprovados alimentam o Knowledge Graph e o Digital Twin
