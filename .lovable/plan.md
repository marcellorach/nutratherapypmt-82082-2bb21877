## Objetivo

Transformar a aba `pet-food-catalog` em uma aba "Nutrition" que (a) mostre nutrientes inline como tags (sem clique, sem botão "Enriquecer"), (b) auto-enriqueça produtos novos via IA em background, e (c) hospede também a tabela oficial de necessidades nutricionais caninas (AAFCO/FEDIAF/NRC) por porte e estágio de vida.

## Mudanças

### a) Tags de nutrientes inline + remoção do diálogo "Composição"

`src/components/administrador/pet-food/PetFoodCatalogTab.tsx`:
- Substituir a linha de texto "Proteína X% · Gordura Y% · …" por uma faixa de `<Badge>` compactos (padrão visual já usado para `species`/`life_stage`/`size_target`), agrupados em uma única linha com scroll horizontal se preciso. Cada nutriente vira uma tag: `Prot 28%`, `Gord 14%`, `Fibra 3%`, `Umid 10%`, `Ca 1.2%`, `P 0.9%`, `Ca:P 1.3`, `n6:n3 5:1`, `EPA+DHA 0.5%`, `Lisina 1.4%`, etc.
- Mostrar **todos** os campos não-nulos como tags (não só macros). Campos nulos: omitidos.
- Mini-barra de completude continua, mas vira uma tag de status (`82% composição · conf 0.7`).
- **Remover** botão "Composição" e o componente `NutritionDetailsDialog` (toda a info já está visível).
- **Remover** botão "Enriquecer com IA" e o estado `enriching` em `ProductActions`.

### b) Auto-enriquecimento em background

- Na query `productsQuery`, ao receber a lista, identificar produtos sem `pet_food_nutrition[0]` ou com `completeness_score < 0.4` e disparar `supabase.functions.invoke('enrich-pet-food-product', { body: { product_id } })` em paralelo (limitar concorrência a 3, fire-and-forget). Após terminar, `invalidateQueries(['pet-food-products'])` para refletir.
- Adicionar um `useEffect` que roda uma vez por sessão por produto (set local de IDs já tentados) para não entrar em loop.
- Em `NewProductDialog.onCreated`: já invocar `enrich-pet-food-product` para o produto recém-criado antes de invalidar a query.
- Sem mudança no edge function — só remover a UI manual.

### c) Sub-tabs "Nutrition" + tabela oficial por raça/porte/idade

Renomear a aba do menu lateral (`KnowledgeBaseGroup.tsx` + chaves i18n `admin.sidebar.knowledgeBase.petFoodCatalog`) de "Catálogo de Rações" para **"Nutrition"**. O `id` da rota `pet-food-catalog` permanece (evita quebrar links).

Dentro do componente, reorganizar com `<Tabs>` em 3 abas:

1. **Rações** — conteúdo atual de produtos/marcas (com tags inline + auto-enriquecimento).
2. **Tabela nutricional (raça · porte · idade)** — nova tabela com requisitos mínimos AAFCO/FEDIAF de cães por:
   - Estágio: filhote em crescimento, adulto manutenção, gestação/lactação, sênior
   - Porte adulto esperado: pequeno (<10 kg), médio (10–25 kg), grande (25–45 kg), gigante (>45 kg)
   - Campos: proteína mín %, gordura mín %, Ca %, P %, Ca:P, n6, n3, EPA+DHA, lisina, metionina, taurina (raças predispostas a DCM), kcal/kg de matéria seca recomendado.
   - Fonte dos dados: arquivo estático bilíngue `src/data/nutritionRequirementsCanine.ts` (constante tipada). Sem mock — valores tirados de AAFCO 2024 Dog Food Nutrient Profiles + FEDIAF 2024 + NRC 2006 (referenciados no rodapé da tabela).
   - UI: filtros por estágio + porte; tabela com linhas de nutrientes e badges de fonte (AAFCO/FEDIAF/NRC).
3. **Outras questões nutricionais** — bloco com cards informativos (também bilíngue, estático):
   - Hidratação (mL/kg/dia por porte)
   - Frequência de refeições por idade
   - Restrições por condição (renal, hepática, alérgico) — links para `health_conditions`
   - Sinais clínicos de deficiência/excesso por nutriente

### Internacionalização

- Renomear chave `admin.sidebar.knowledgeBase.petFoodCatalog` → manter chave mas mudar valor para "Nutrition" (PT/EN).
- Novas chaves: `admin.nutrition.tabs.products`, `admin.nutrition.tabs.requirements`, `admin.nutrition.tabs.other`, abreviações de nutrientes (`admin.nutrition.nutrient.protein`, etc.).
- Bump `I18N_VERSION` em `src/i18n.ts`.

### Changelog/organograma

- Entrada em `CHANGELOG.md` `[Unreleased]` (área: admin/nutrition).
- Atualizar `src/data/projectOrganograma.ts` (renomeação da tab + 3 sub-abas).
- Rodar `npm run sync:changelog`.

## Fora de escopo

- Não criar tabela DB para requisitos nutricionais (dados estáticos já bastam para o MVP — promover a DB futuramente se virar editável).
- Não alterar o edge function `enrich-pet-food-product`.
- Não mexer em outros componentes que consomem `pet_food_nutrition` (`NutritionGapAnalysis`, etc.).

## Detalhes técnicos

- Concorrência do auto-enrich: `Promise.all` em batches de 3 via `for (const batch of chunk(missing, 3))`.
- Guard contra retries infinitos: `useRef<Set<string>>` com IDs já tentados nesta sessão.
- Tags de nutrientes: construir array `[{label, value, unit}]` filtrando `value != null`, render `<Badge variant="outline" className="text-[10px]">{label} {value}{unit}</Badge>`.
- Tabela de requisitos: tipo `CanineNutrientRequirement { stage, size, nutrient, min, max?, unit, source }` em `src/data/nutritionRequirementsCanine.ts` (com campos `_en` para nomes).
