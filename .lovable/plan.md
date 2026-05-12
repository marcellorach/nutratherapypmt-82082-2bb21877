# Plano final aprovado

## Missão A — Catálogo + demos religados

**Localização do catálogo (resposta direta):**
- DB: tabelas `pet_food_products`, `pet_food_brands`, `pet_food_nutrition`
- UI admin: `src/components/administrador/pet-food/PetFoodCatalogTab.tsx`
- Seed atual: migration `20260511181813_*.sql` (20 SKUs)

**Passos:**
1. Pesquisar fichas técnicas oficiais (sites dos fabricantes) para esta lista de candidatos: Pro Plan Adult Large Breed, RC Maxi Adult 5+, Hill's Science Diet 7+ Active Longevity, Premier Sêniores Médias/Grandes, Farmina N&D Pumpkin Lamb Adult Medium/Maxi, Biofresh Adultos Médias/Grandes.
2. Para cada SKU **só adicionar se houver dados nutricionais públicos verificáveis** (proteína, gordura, kcal/100g, Ca, P, ômega-3, fibra). Sem ficha → pula.
3. Migration única inserindo as marcas faltantes + produtos + perfis em `pet_food_nutrition`, com `source_url` apontando para a página oficial.
4. Migration de fix-up nos pets demo (`is_demo = true`): substituir itens órfãos em `pet_nutrition_items` (sem `product_id`) por `product_id` do catálogo coerente com porte/idade/condição (ex.: Rex → Pro Plan Adult Large Breed se entrar; senão → RC Maxi Adult).
5. Atualizar gerador de pets demo (`src/utils/mockClinicalData.ts` + writer de nutrição) para sempre gravar `product_id` do catálogo, nunca texto livre.

**Validação:** card "Análise Nutricional" do Rex calcula sem warning de "linkar ao catálogo".

## Missão B — Linguagem clínica vs. camada de gerociência

**Princípio (vai pra memória + Core):**
> Veterinário descreve achados em linguagem **clínica tradicional** (OA moderada, ALT elevada, perda de massa muscular). A **camada de gerociência (senescência, inflammaging, mitocondrial, NAD+, autofagia, hallmarks of aging) é responsabilidade do nosso sistema** e nunca é atribuída ao vet em consultas/anamneses/condutas demo. As recomendações do sistema **devem** explicitar a ponte gerociência → ação, sob badge "Inferência de gerociência — gerada pelo sistema".

**Aplicação:**
1. Criar `mem://principles/clinical-language-vs-geroscience-layer.md` e referenciar no Core do `mem://index.md`.
2. Reescrever campos `assessment` e `conduct` das consultas demo existentes (capturas anexas: Rex, Bernardo): manter diagnóstico/conduta de fundo, remover jargão senolítico/senescente da boca do vet.
3. Atualizar prompts das edge functions `hybrid-recommendation-service`, `condition-insights`, `extract-pet-clinical-data`:
   - Input do vet vem em linguagem tradicional.
   - Output **deve** mapear achados clínicos → hallmark/pathway de gerociência → composto, rotulado como inferência do sistema.
4. UI: badge "Inferência de gerociência (gerada pelo sistema)" nas seções de inferência IA, separando visualmente da nota clínica do vet.
5. CHANGELOG.md + `docs/STANFORD_DEMO.md`: registrar como decisão de design.

## Missão C — Marcação visual "revisão técnica" (cor: âmbar)

1. Novo componente `src/components/ui/technical-review-section.tsx`:
   - Wrapper colapsável (default fechado, só título + chevron).
   - Badge âmbar `🔧 Revisão técnica` (tokens: `bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30`).
   - Tooltip: *"Disponível para validação interna. Não fará parte da versão operacional."*
2. Aplicar imediatamente em:
   - `LongitudinalDebugPanel` (Depuração do MedGraphRAG) — colapsado por padrão.
   - Outros 2–3 painéis de QA equivalentes (auditoria de relações, auditoria de ontologia, painel de debug de KG).
3. Adicionar entrada no CHANGELOG e bump `I18N_VERSION` → `1.69.0`.

## Ordem de execução (cada passo testado)

1. Catálogo: pesquisa de fichas → migration de SKUs novos → migration de fix-up dos demos → testar Rex.
2. Memória + reescrita de consultas demo + ajuste de prompts.
3. `TechnicalReviewSection` + aplicação no painel longitudinal e correlatos.
4. Bump i18n, sync changelog, validação visual final.
