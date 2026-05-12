# Project context briefing (auto)
Generated: 2026-05-12T17:34:06.105Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.70.0

## Changes by area (last 14 days)
- **vet-ui**: 11
- **admin**: 11
- **tutor-ui**: 7
- **meta**: 7
- **clinical-pipeline**: 6
- **kg**: 6
- **i18n**: 3
- **curation**: 3
- **infra**: 2

## Top 10 recent entries
### 2026-05-12 · [vet-ui] ADDED — Análise nutricional condicional ao catálogo + nomenclatura preventivo/terapêutico + revisão técnica admin-only
- `NutritionGapAnalysis` agora suprime a tabela de gaps e a seção "Sugerido pela raça" quando a ração não está no catálogo (`pet_food_nutrition` ausente). Em vez disso, exibe um card âmbar único: "A análise de complementação nutricional não foi concluída porque esta ração ainda não está no nosso banco de dados."
- Botões Procurar e Incorporar (restritos a admin via `useAuth().hasRole('admin')`) chamam a edge `enrich-pet-food-product`. "Incorporar" só é habilitado quando a confiança da extração ≥ 0.4. Sucesso invalida `['nutrition-gap', petId]` e a análise re-roda automaticamente.
- Edge `enrich-pet-food-product` extendida com `persist: true` + `link_to_item_id?`: cria/recupera `pet_food_brands` e `pet_food_products` (snake-insensitive), insere a composição em `pet_food_nutrition` e vincula o `pet_nutrition_items.product_id` em uma única chamada (service role).
_files: .lovable/memory/principles/preventive-vs-therapeutic-nomenclature.md, src/components/pet/NutritionGapAnalysis.tsx, src/components/ui/technical-review-section.tsx, src/hooks/usePetFoodEnrichment.ts…_

### 2026-05-12 · [clinical-pipeline] ADDED — Camada de gerociência separada da voz do vet + marcação "revisão técnica" (Missões B & C)
- Princípio formalizado: vet escreve em linguagem clínica tradicional (OA, ALT, Carprofen). Gerociência (senescência, inflammaging, NAD+, autofagia, hallmarks, senolíticos) é responsabilidade do sistema e nunca atribuída ao vet.
- Memória `.lovable/memory/principles/clinical-language-vs-geroscience-layer.md` documentando o contrato e a obrigação de prefixo "Inferência de gerociência — gerada pelo sistema".
- Prompts atualizados em `hybrid-recommendation` (ENRICH + FALLBACK) e `extract-pet-clinical-data`: input do vet em linguagem tradicional; output do sistema explicita ponte achado clínico → hallmark → composto, com prefixo de inferência.
_files: .lovable/memory/principles/clinical-language-vs-geroscience-layer.md, supabase/functions/hybrid-recommendation/index.ts, supabase/functions/extract-pet-clinical-data/index.ts, src/components/ui/technical-review-section.tsx…_

### 2026-05-12 · [vet-ui] ADDED — Nutrition gap & breed-based recommendations (Passos 1–4)
- Passo 1: aba "Atual" no perfil do pet expondo dieta/ração com vínculo ao catálogo nutricional.
- Passo 2: catálogo `pet_food_products` populado com 20 produtos reais (Royal Canin, Hill's, Premier, Pro Plan, Acana, Orijen, N&D, Taste of the Wild, Golden) e perfis nutricionais (`pet_food_nutrition`) com proteína/gordura/kcal/EPA-DHA/Ca:P/glicosamina e flag AAFCO.
- Passo 3: motor `nutrition-gap-analyzer.ts` comparando dieta atual vs. mínimos FEDIAF 2024 + alvos clínicos (DRC, OA, hepático…) com cálculo de RER/MER, conversão as-fed→DM e ponderação por `share_percent`.
_files: src/components/pet/NutritionGapAnalysis.tsx, src/components/pet/PetNutritionPanel.tsx, src/services/nutrition-gap-analyzer.ts, src/pages/veterinario/PetProfilePage.tsx…_

### 2026-05-11 · [vet-ui] ADDED — Cadastro manual rico (Fase 3) + i18n (Fase 4)
- Foto do pet no cadastro (bucket `pet-photos`) com preview e upload pós-INSERT.
- Campo `birth_date` com cálculo automático de `age_years`.
- Anexar PDFs de exames já no formulário; após salvar dispara `parse-pet-exam-pdf` em batch.
_files: src/components/pet/PetRegistrationForm.tsx, src/components/pet/PetPhotoUploader.tsx, src/components/pet/HistoricalConsultationsSection.tsx, src/services/pet-consultation-writer.ts…_

### 2026-05-11 · [vet-ui] ADDED — Painel de depuração e avaliação do MedGraphRAG longitudinal
- Edge function `hybrid-recommendation` aceita `debug:true` e `disableLongitudinal:true`. Quando `debug` está ligado a resposta inclui `debug.longitudinal` (quais blocos foram ativados — CURRENT_STATE/CLINICAL_TRAJECTORY/DIET_PROFILE — número de entradas, condições ativas, exames anormais, produtos de dieta) e `debug.renderedContextBlock` (texto exato injetado no prompt). `disableLongitudinal` remove os blocos longitudinais para permitir comparação A/B.
- Novo serviço `src/services/longitudinal-debug-service.ts` com 3 utilidades: `auditPetLongitudinalIntegrity(petId)` (verifica N consultas, `is_latest`, FK `consultation_id` em conditions/meds/exams e `is_current` em pet_nutrition); `fetchLongitudinalDebug(...)` (debug single-shot); `compareWithVsWithoutHistory(...)` (roda inferência 2× em paralelo e calcula diff: compostos adicionados/removidos, flags anormais consideradas, menções a lacunas nutricionais, delta de racional/precauções).
- Novo componente `LongitudinalDebugPanel` com 3 abas (Auditoria · Blocos usados · Comparação) renderizado no perfil do pet, abaixo do Patient Knowledge Subgraph — acessível ao veterinário em um clique.
_files: src/services/longitudinal-debug-service.ts, supabase/functions/hybrid-recommendation/index.ts, src/services/hybrid-recommendation-service.ts, src/components/pet/LongitudinalDebugPanel.tsx…_

### 2026-05-11 · [vet-ui] ADDED — Aprovação e normalização de exames PDF
- `pet_exams` ganha colunas `approved`, `approved_at`, `approved_by` para fluxo de revisão antes de entrar no histórico.
- Edge function `parse-pet-exam-pdf`: normaliza unidades (mg/dL, U/L, 10^3/µL…), coerge valores numéricos, recalcula `flag` (high/low) a partir da faixa, normaliza datas (dd/mm/aaaa → ISO), e auto-vincula a uma `pet_consultation` quando a data do exame casa com uma visita (±3 dias).
- Edge function `enrich-pet-food-product`: clamp de percentuais 0-100, normalização de kcal/kg (detecta kcal/100g), validação de enums (`species`, `life_stage`, `food_form`, `size_target`).
_files: supabase/functions/parse-pet-exam-pdf/index.ts, supabase/functions/enrich-pet-food-product/index.ts, src/components/pet/PetExamPdfUploader.tsx, src/components/pet/PetExamReviewDialog.tsx_

### 2026-05-11 · [clinical-pipeline] ADDED — Histórico longitudinal nos demo pets + MedGraphRAG context-aware
- Demo pets agora geram histórico clínico longitudinal: Buddy 1 consulta, Max 2, Rex 3, Thor 4, Luna 5 (total 15 consultas), com `pet_conditions`/`pet_medications`/`pet_exams` linkados via `consultation_id` e `pet_nutrition` + `pet_nutrition_items` por pet (Rex em dieta de controle de peso, Luna trocou para fórmula renal na 4ª consulta). Trigger `refresh_pet_consultation_latest` marca a última como `is_latest`.
- Edge function `hybrid-recommendation`: novo `ClinicalContext` longitudinal com blocos CURRENT_STATE (peso 1.0), CLINICAL_TRAJECTORY (peso 0.4) e DIET_PROFILE. Prompts (enrich + fallback) instruídos a tratar a última consulta como sinal dominante e usar trajetória apenas para detectar progressão, falhas terapêuticas e exposições cumulativas — sem reabrir condições resolvidas.
- Service `hybrid-recommendation-service`: novo helper `buildLongitudinalContext(petId)` lê `pet_consultations` + entidades vinculadas + `pet_nutrition` e injeta no edge call. `ConfidenceCalculationParams` ganhou `petId` opcional.
_files: src/components/pet/GenerateSamplePetsButton.tsx, supabase/functions/hybrid-recommendation/index.ts, src/services/hybrid-recommendation-service.ts, src/types/recommendation-confidence.ts…_

### 2026-05-11 · [clinical-pipeline] ADDED — Consultas veterinárias + Catálogo de Rações (Fase 1+2)
_status: parcial_
- Schema: nova tabela `pet_consultations` (consulta como unidade central com data, vet, queixa, exame clínico, peso, BCS, conduta) com trigger `refresh_pet_consultation_latest` que mantém `is_latest = true` na consulta mais recente de cada pet
- Schema: colunas `consultation_id` adicionadas a `pet_conditions`, `pet_medications`, `pet_exams`, `pet_clinical_notes` para vincular itens à consulta de origem
- Schema: novas tabelas `pet_nutrition` (snapshot da dieta por pet/consulta com `is_current`) + `pet_nutrition_items` (N produtos por entrada, com `share_percent` para dietas mistas)
_files: src/components/administrador/pet-food/PetFoodCatalogTab.tsx, src/config/admin-tabs.ts, src/hooks/useSystemGuideStats.ts_

### 2026-05-11 · [i18n] FIXED — Sidebar/tabs admin mostrando chaves de tradução literais
- Raiz do problema: os arquivos `src/locales/{pt,en}/translation.json` continham a chave `"admin"` declarada duas vezes no nível raiz. O segundo bloco (adicionado junto com a Base Farmacológica em 2026-05-09) sobrescrevia silenciosamente o primeiro durante o `JSON.parse`, apagando todos os namespaces `admin.sidebar.*`, `admin.tabs.*`, `admin.errors.*`, `admin.studies.*`, etc. — daí as chaves cruas aparecendo em quase toda a UI administrativa
- Correção: fundidos os dois blocos `"admin"` num só (PT e EN), preservando `pharmacology` ao lado das 19 sub-chaves originais (total 20)
- Salvaguarda: novo script `scripts/check-translation-duplicates.mjs` (parser custom que detecta chaves duplicadas em qualquer profundidade) exposto via `npm run check:translations` — o `audit-translations` antigo só checava paridade PT↔EN, não duplicatas internas
_files: scripts/check-translation-duplicates.mjs, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts_

### 2026-05-11 · [admin] ADDED — Auditorias Técnicas Internas (aba admin versionada)
- Nova aba `Auditorias Técnicas` em Configurações exibindo o histórico versionado de auditorias internas do VetGraphRAG, cada uma vinculada à versão do sistema auditada (i18n + última entrada do changelog)
- Auditoria v3 convertida para HTML navegável em `public/audits/v3/index.html` (com os 9 infográficos preservados em `public/audits/v3/media/`) e PDF/DOCX para download direto
- Botão "Fazer nova auditoria" abre dialog com escopo editável (pré-preenchido) e versão do sistema auto-detectada — registra o pedido em `audit_requests` para o agente Lovable gerar na próxima sessão dedicada
_files: src/components/administrador/audits/TechnicalAuditsTab.tsx, src/config/admin-tabs.ts, src/components/administrador/sidebar/groups/ConfigurationGroup.tsx_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.