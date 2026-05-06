## Objetivo
Reformular os 5 pets de exemplo (`GenerateSamplePetsButton`) para que TODAS as condições atribuídas tenham **alta cobertura no VetGraphRAG** (≥15 compostos com triplets aprovados), garantindo que o Gêmeo Digital (`project-pet-trajectory`) consiga calcular `years_gained` significativo e mostrar reversão/controle real baseado em evidência — não fallback heurístico.

## Diagnóstico do KG (triplets aprovados, layer_4_outcome)

Top condições com maior cobertura de compostos:

| Condição | # Compostos | Uso atual nos pets |
|---|---|---|
| Osteoarthritis | 68 | Rex, Thor |
| Aging (sarcopenia/frailty) | 63 + 33 + 16 | Max, Luna |
| MMVD (Degenerative Valve Disease) | 52 | Luna |
| Obesity / Overweight | 32 | Rex |
| Cognitive Dysfunction Syndrome | 30 + 21 + 14 | Max, Luna |
| Oxidative Stress | 29 | — |
| Chronic Kidney Disease | 19 | Luna |
| Osteoporosis | 18 | — |
| Cardiovascular Disease | 15 | — |
| Neuroinflammation | 15 | — |
| Retinal Degeneration | 14 | — |
| Gut Dysbiosis | 14 | — |

**Condições atuais SEM boa cobertura no KG** (causam fallback heurístico, anulando o "wow" do Digital Twin):
- `Mild Periodontal Disease` (Buddy) — quase nenhum triplet
- `Hip Dysplasia` (Rex, Thor) — pouca cobertura direta
- `Degenerative Myelopathy` (Thor) — pouca cobertura
- `Pulmonary Hypertension` (Luna) — pouca cobertura

## Mudanças propostas em `src/components/pet/GenerateSamplePetsButton.tsx`

Manter a regra de complexidade crescente (1→4 condições) e plausibilidade clínica por raça/idade, mas **substituir condições de baixa cobertura por equivalentes de alta cobertura** já presentes no KG:

### 1) Buddy (Beagle, 4a) — SIMPLES, 1 condição
- Substituir `Mild Periodontal Disease` por **`Oxidative Stress`** (29 compostos, geroprotector clássico — antioxidantes/polifenóis).
- Narrativa: cão jovem, marcadores precoces de estresse oxidativo em check-up preventivo.

### 2) Max (Beagle, 9a) — LEVE, 2 condições
- Manter **`Cognitive Dysfunction Syndrome`** (30 compostos) + **`Sarcopenia`** (33 compostos). ✅ Já ótimas.
- Adicionar opcionalmente nada — manter 2 condições.

### 3) Rex (Labrador, 8a) — INTERMEDIÁRIO, 3 condições
- Manter **`Osteoarthritis`** (68 compostos) ✅
- Substituir `Hip Dysplasia` por **`Obesity`** (32 compostos) — promover de "Overweight mild" para `Obesity moderate` (Lab senior é caso clássico).
- Substituir `Overweight` por **`Oxidative Stress`** (29) OU **`Metabolic Disorders`** (14).

### 4) Thor (German Shepherd, 7a) — COMPLEXO, 3 condições
- Manter **`Osteoarthritis`** ✅
- Substituir `Hip Dysplasia` por **`Neuroinflammation`** (15 compostos) — coerente com início de mielopatia.
- Substituir `Degenerative Myelopathy` por **`Cellular Senescence`** (24 compostos) — eixo geroprotector forte; ou manter DM como `monitoring` mas adicionar Cellular Senescence como 3ª condição ativa para garantir KG hit.

### 5) Luna (Cavalier, 9a) — MAIS COMPLEXO, 4 condições + polifarmácia
- Manter **`MMVD`** (52 compostos) ✅
- Manter **`Cognitive Dysfunction Syndrome`** ✅
- Manter **`Chronic Kidney Disease`** (19 compostos) ✅
- Substituir `Pulmonary Hypertension` por **`Cardiovascular Disease`** (15) ou **`Aging/Frailty`** (16) — coerente com perfil sênior cardiopata.

## Critério de aceitação

Após gerar os pets demo:
1. Para cada pet, `usePetTrajectoryProjection` deve retornar `source: 'ai_kg_grounded'` (não `heuristic_fallback`).
2. `years_gained_total` ≥ 0.5 ano para Buddy; ≥ 1.0 para Max/Rex; ≥ 1.5 para Thor/Luna.
3. `coverage_by_condition[].kg_covered = true` em **≥80%** das condições.
4. Cada condição deve ter ≥3 `supporting_compounds` no breakdown.

## Detalhes técnicos

- Arquivo único alterado: `src/components/pet/GenerateSamplePetsButton.tsx` (array `SAMPLE_PETS`).
- Os nomes de condição usados devem bater **exatamente** com `object_name` do triplet (preservar capitalização: ex. `"Osteoarthritis"`, `"Cognitive Dysfunction Syndrome"`, `"Myxomatous Mitral Valve Disease"` — Luna deve usar este label canônico em vez de "Degenerative Valve Disease (...)" para hit perfeito no KG).
- Incrementar `I18N_VERSION` em `src/i18n.ts` (regra do projeto, mesmo que apenas dados estáticos).
- Atualizar `CHANGELOG.md` (`[Unreleased] → Changed`) e rodar `npm run sync:changelog`.
- Atualizar memory `mem://features/sample-pets-complexity-order` para refletir o novo critério "condições devem ter cobertura KG ≥15 compostos".

## Fora de escopo
- Não criar novos triplets/estudos (KG já cobre o necessário).
- Não alterar a lógica do edge function `project-pet-trajectory`.
- Não mexer em UI de exibição do Digital Twin.