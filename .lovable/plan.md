## Fase 2 — Conectar Nutrition ↔ Pet / Recomendações

Objetivo: transformar a aba "Tabela nutricional" + "Rações" num motor clínico que (a) compara a ração atual do pet com as necessidades AAFCO/FEDIAF por porte/idade/condição, (b) destaca deficiências/excessos, e (c) alimenta o engine de recomendação nutracêutica.

### Entregáveis

1. **Serviço `nutritionGapAnalysis.ts`** (frontend, puro)
   - Input: `pet` (espécie, porte, idade, peso, condições) + `petFoodProduct` + `pet_food_nutrition`.
   - Calcula necessidades diárias (kcal RER×fator, proteína g/kg^0.75, gordura, ômega-3, cálcio, etc.) usando `nutritionRequirementsCanine.ts` já existente.
   - Retorna `NutritionGap[]` por nutriente: `{ nutrient, current, target, unit, status: 'deficient'|'adequate'|'excess', deltaPct, severity }`.

2. **Componente `PetNutritionGapPanel.tsx`** (perfil do pet)
   - Mostra ração ativa do pet + tabela de gaps com badges coloridos (vermelho/âmbar/verde).
   - Linha "Sugestão nutracêutica" para cada gap (ex: EPA+DHA baixo → ômega-3 marinho).
   - Botão "Adicionar à pilha terapêutica".

3. **Integração no flow existente**
   - Novo campo `current_pet_food_product_id` em `pets` (já existe `pet_food_brand`? verificar).
   - Hook `usePetNutritionGaps(petId)` que faz join `pets` → `pet_food_products` → `pet_food_nutrition`.
   - Painel renderizado na PetProfilePage abaixo de "Exames" e acima de "Recomendações IA".

4. **Bridge para engine de recomendação**
   - Edge function `hybrid-recommendation` recebe `nutrition_gaps` no contexto.
   - Prompt sistêmico passa a priorizar compostos que fecham gaps detectados.

5. **Bilíngue + Changelog**
   - Chaves `t('petProfile.nutritionGap.*')` PT/EN.
   - Bump `I18N_VERSION`.
   - Entry no CHANGELOG `[Unreleased]` (area: nutrition · status: implemented · i18n: yes).

### Ordem de execução

```text
Step 1  Inspect DB: pets schema (food fields), nutritionRequirementsCanine shape
Step 2  Create nutritionGapAnalysis.ts service + unit logic
Step 3  Migration: add pets.current_pet_food_product_id (FK nullable)
Step 4  usePetNutritionGaps hook
Step 5  PetNutritionGapPanel.tsx (UI bilíngue, design tokens)
Step 6  Mount panel in PetProfilePage
Step 7  Update hybrid-recommendation edge function to consume gaps
Step 8  i18n keys PT/EN + I18N_VERSION bump
Step 9  CHANGELOG + sync:changelog + organograma update
```

### Notas técnicas

- Reusa `nutritionRequirementsCanine.ts` (já bilíngue); não duplicar.
- Severidade: `|delta| < 15%` adequate, `15–40%` mild, `>40%` severe.
- Wet food: usar `kcal_per_kg` já corrigido (Fase 1); converter porção diária em g a partir do peso do pet.
- Se `confidence < 0.5` na ração, mostrar tooltip "valores estimados por IA — confiar com cautela".
- Sem mocks: se pet sem ração cadastrada, painel mostra CTA "Cadastrar ração atual" em vez de dados fake.

### Confirmação

Vou começar pelo Step 1 (inspeção) e seguir em sequência. Posso emendar a migração da Fase 1 (pets.current_pet_food_product_id) se preferir tudo numa só. Confirma?