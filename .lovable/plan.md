## Objetivo

Refinar a "Análise de déficit nutricional" do perfil do pet em três eixos: (a) só rodar análise de gaps quando a ração estiver no banco, (b) deixar explícito quando uma sugestão é **preventiva** vs. **terapêutica/curativa**, (c) restringir o painel "Revisão técnica" a administradores e mantê-lo minimizado com tooltip (?).

---

## a) Análise nutricional condicional ao catálogo

**Comportamento atual** (`NutritionGapAnalysis.tsx` + `nutrition-gap-analyzer.ts`):
- Se a ração não está vinculada a `pet_food_nutrition`, mostra um aviso amarelo genérico ("noLinked"), mas ainda calcula gaps com defaults e exibe a seção raça.

**Novo comportamento**:
1. Quando `data.has_data === false` (sem composição da ração no banco), **não** exibir a tabela de gaps nem a seção "Sugerido pela raça (preventivo)". Substituir tudo por um card único:
   - Texto: *"A análise de complementação nutricional não foi concluída porque esta ração não está no nosso banco de dados."*
   - Mostrar marca/produto observado (vindos de `pet_nutrition_items.raw_brand_text/raw_product_text`).
   - Dois botões **visíveis apenas para admin** (`hasRole('admin')` via `useAuth()`):
     - **"Procurar"** → invoca `enrich-pet-food-product` com `{ brand_name, product_name, species }`. Mostra spinner.
     - Se a edge devolver dados com `confidence ≥ 0.4` → habilita botão **"Incorporar"** que persiste em `pet_food_products` + `pet_food_nutrition` (a edge já faz upsert quando `product_id` é passado; aqui criamos primeiro o produto e re-invocamos com o id, ou estendemos a edge para aceitar brand+product e persistir).
     - Após "Incorporar" com sucesso → invalidar query `['nutrition-gap', petId, ...]` e a análise roda normalmente.
   - Para vet/tutor não-admin: apenas o texto informativo, sem botões.
2. Quando a ração **existe** no banco: comportamento atual de gaps preservado.

## b) Linguagem preventivo vs. terapêutico

Atualmente a seção "Sugerido pela raça (Beagle)" mostra "Diabetes Mellitus Tipo 2 — Risco 2.0×" como se fosse diagnóstico. Não há distinção clara entre prevenção e tratamento.

**Mudanças**:
1. **Terminologia padrão** (memorizar em `mem://principles/preventive-vs-therapeutic-nomenclature.md`):
   - **Preventivo / profilático** — pet sem a condição, ação para reduzir risco (predisposição racial, marcador subclínico).
   - **Terapêutico / curativo / de manejo** — pet já diagnosticado com a condição.
   - Termos veterinários aceitos: *profilaxia nutricional*, *manejo dietético*, *dieta terapêutica*.
2. **UI da seção raça** (`NutritionGapAnalysis.tsx`):
   - Renomear título: `"Sugerido pela raça"` → `"Profilaxia nutricional sugerida pela raça"` / EN `"Breed-based nutritional prophylaxis"`.
   - Subtítulo explícito: *"Estas sugestões são preventivas. O pet não tem a condição listada — apenas predisposição racial documentada."*
   - Substituir o badge `Risco 2.0×` por dois badges combinados: `Preventivo` (cor neutra/azul) + `Risco 2.0×`.
   - Quando `rec.already_active === true` (pet já tem a condição) → trocar badge `Preventivo` por `Manejo terapêutico` (âmbar/destrutivo) e ajustar copy do bloco.
3. **Catálogo de nutracêuticos / drogas / rações** (`hybrid-recommendation` edge function): adicionar ao prompt instrução para classificar cada item como `intent: "preventive" | "therapeutic" | "supportive"` e exibir esse rótulo em todos os cards de recomendação (será incremento futuro — esta plan cobre apenas a flag no schema de saída + leitura no `VetRecommendationPanel`).
4. **i18n**: adicionar chaves `nutritionGap.breed.preventive`, `.therapeutic`, `.disclaimer`, etc., em PT e EN. Bumpar `I18N_VERSION`.

## c) Revisão técnica restrita a admin + tooltip

Atualmente `TechnicalReviewSection` (que envolve `LongitudinalDebugPanel` em `PetProfilePage.tsx`) aparece para todos os usuários, colapsada.

**Mudanças**:
1. Em `PetProfilePage.tsx` envolver o bloco com `{hasRole('admin') && ...}` para ocultar totalmente para vet/tutor.
2. No componente `TechnicalReviewSection.tsx`: adicionar um ícone `(?)` ao lado do título (ou substituir o tooltip do badge por um `HelpHint`/`?` separado clicável), garantindo que o tooltip continue explicando "Disponível para validação interna. Não fará parte da versão operacional."
3. Garantir `defaultOpen={false}` (já é) e revisar todos os usos para confirmar que estão minimizados.

---

## Detalhes técnicos

**Arquivos a editar**
- `src/components/pet/NutritionGapAnalysis.tsx` — fluxo "sem ração" + botões admin + textos preventivo.
- `src/services/nutrition-gap-analyzer.ts` — quando `has_data=false`, retornar `gaps: []` e `breed_recommendations: []` (ou flag `skip_render`) para forçar UI vazia.
- `supabase/functions/enrich-pet-food-product/index.ts` — aceitar payload `{ brand_name, product_name, species, persist: true }` e, se `persist`, criar `pet_food_products` + `pet_food_nutrition` e devolver `product_id`. Vincular ao `pet_nutrition_item` correspondente.
- Novo hook `src/hooks/usePetFoodEnrichment.ts` — wrapper React Query/mutation para os botões "Procurar" e "Incorporar".
- `src/components/ui/technical-review-section.tsx` — botão `(?)` extra ao lado do título.
- `src/pages/veterinario/PetProfilePage.tsx` — gate `hasRole('admin')` no bloco de revisão técnica.
- `src/locales/pt/translation.json` + `src/locales/en/translation.json` — novas chaves; bump `src/i18n.ts` `I18N_VERSION`.
- `.lovable/memory/principles/preventive-vs-therapeutic-nomenclature.md` — nova memória.
- `CHANGELOG.md` (`[Unreleased]`) + `npm run sync:changelog`.

**Sem mudanças de schema de banco** nesta entrega (a edge já tem permissão de service role para upsert em `pet_food_products` / `pet_food_nutrition`).

**Validação**
- Pet com ração no catálogo → fluxo idêntico ao atual.
- Pet com ração não cadastrada, login admin → vê texto + botões; "Procurar" preenche, "Incorporar" persiste e a análise roda.
- Pet com ração não cadastrada, login vet → vê apenas o texto informativo.
- Seção "Revisão técnica" some para vet/tutor; admin a vê colapsada com `(?)`.

---

## Fora de escopo

- Reescrever todo o catálogo de nutracêuticos com flag `intent` (apenas leitura/preparação para futura iteração).
- Mudar o pipeline VetGraphRAG.
- Tradução automática de produtos novos para EN além do que a edge já faz.
