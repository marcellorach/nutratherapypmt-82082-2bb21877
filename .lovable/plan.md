## Ajuste solicitado
Reintroduzir algumas condições **não cobertas** pelo VetGraphRAG nos pets demo para mostrar realismo/aleatoriedade do sistema, **sem comprometer** a demonstração do Gêmeo Digital. Regra: ≥66% das condições de cada pet devem estar cobertas pelo KG (≥15 compostos).

## Mudanças em `src/components/pet/GenerateSamplePetsButton.tsx`

| Pet | Condições propostas | KG-covered | Não-covered (realismo) |
|---|---|---|---|
| **Buddy** (1) | Oxidative Stress | 1/1 (100%) | — |
| **Max** (2) | CDS, Sarcopenia | 2/2 (100%) | — |
| **Rex** (3) | Osteoarthritis, Obesity, **Hip Dysplasia** | 2/3 (66%) | Hip Dysplasia (low KG) |
| **Thor** (3) | Osteoarthritis, Cellular Senescence, **Degenerative Myelopathy** (monitoring) | 2/3 (66%) | DM (low KG) |
| **Luna** (4) | MMVD, CDS, CKD, **Pulmonary Hypertension** | 3/4 (75%) | Pulmonary Hypertension (low KG) |

### Justificativa clínica das condições "não-cobertas"
- **Hip Dysplasia (Rex)**: clássico em Labrador, coexiste naturalmente com osteoartrite — o sistema vai mostrar "sem cobertura KG direta" para esta condição enquanto trata as outras 2.
- **Degenerative Myelopathy (Thor)**: clássico em Pastor Alemão, status `monitoring` (não ativa) — demonstra honestidade do sistema ao sinalizar gap de evidência.
- **Pulmonary Hypertension (Luna)**: secundária ao MMVD, plausível clinicamente — outras 3 condições principais carregam o `years_gained`.

### Exames
- Reintroduzir os exames coerentes que tinham sido removidos: X-Ray (Hip) para Rex/Thor, Doppler PAP para Luna, Neurological Examination para Thor.
- Manter os novos exames (Oxidative Stress Panel, Senescence Biomarkers, Cardiovascular Panel) que comprovam as condições KG-covered.

## Critério de aceitação
1. Cada pet ainda atinge `source: 'ai_kg_grounded'` no Digital Twin (porque maioria das condições é coberta).
2. `years_gained_total` mensurável (≥0.5 a ≥1.5 conforme complexidade).
3. UI mostra explicitamente para cada pet pelo menos 1 condição com `kg_covered=false` → demonstra transparência do sistema (gap-fill candidate, conforme `useKgEvidenceGapFill`).

## Detalhes técnicos
- Único arquivo alterado: `src/components/pet/GenerateSamplePetsButton.tsx` (array `SAMPLE_PETS` — só conditions/exams/notes).
- Incrementar `I18N_VERSION` em `src/i18n.ts` (1.54.1 → 1.54.2).
- Adicionar entrada `Changed` no `CHANGELOG.md` e rodar `npm run sync:changelog`.

## Fora de escopo
- Não mexer em lógica do edge function nem em UI do Digital Twin.
- Não alterar Buddy nem Max (já estão 100% cobertos e servem como "casos limpos").