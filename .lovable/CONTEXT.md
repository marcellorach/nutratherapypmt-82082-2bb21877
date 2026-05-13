# Project context briefing (auto)
Generated: 2026-05-13T02:01:45.001Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.74.1

## Changes by area (last 14 days)
- **vet-ui**: 13
- **admin**: 11
- **tutor-ui**: 7
- **clinical-pipeline**: 6
- **kg**: 6
- **i18n**: 3
- **curation**: 3
- **branding**: 2
- **infra**: 2

## Top 10 recent entries
### 2026-05-13 · [branding] CHANGED — Reforço de marca: Senex AI · © PetMoreTime · 2025–presente
- Adicionada linha de assinatura de marca nos headers das tabs administrativas: Organograma, Auditorias Técnicas e Conformidade FDA/EMA/AVMA, deixando explícito que Senex AI é o motor proprietário desenvolvido e operado exclusivamente pela PetMoreTime (2025–presente), sucessor da arquitetura interna VetGraphRAG/VetMedGraph.
- Documentação técnica (`docs/TECHNICAL_DECISIONS.md`, `ARCHITECTURE.md`) recebeu nota de autoria/operação no header.
- Knowledge File do projeto (project memory) atualizado com nova entrada `mem://branding/senex-ai-rename` consolidando: marca pública = Senex AI, autoria/operação exclusiva = PetMoreTime, identificadores internos preservados.
_files: src/pages/administrador/OrganogramaTab.tsx, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/components/administrador/compliance/ComplianceDashboard.tsx, src/i18n.ts_

### 2026-05-13 · [branding] CHANGED — Rebrand: motor "VetGraphRAG" passa a se chamar "Senex AI" na camada visível
- Substituição em massa da marca exposta ao usuário: "VetGraphRAG" → Senex AI em todas as traduções (PT/EN, 27 ocorrências cada), strings JSX, descrições de tabs administrativas, organograma, taxonomia biomédica, exports de PDF e relatórios de confiança.
- Identificadores internos preservados intencionalmente: tipos (`VetGraphRAGAnalysisResult`, `VetGraphRAGConditionTag`), hooks (`useVetGraphRAGConfig`, `useVetGraphRAGLogs`, `useVetGraphRAGQueue`, `useNtaiProcessing`), componentes (`VetGraphRAGInsightsPanel`), arquivos (`vetgraphrag-service.ts`, `vetgraphrag.ts`), edge functions e colunas de DB. Evita refactor estrutural.
- I18N bumped para `1.74.0` para invalidar cache de traduções.
_files: .lovable/plan.md_

### 2026-05-12 · [vet-ui] CHANGED — Card de consulta: separa exame físico vs complementares, renomeia avaliação e adiciona quadro amarelo de interpretação automática
- Achados de "Neurological/Orthopedic/Cardiovascular Examination" gravados em `pet_exams` deixam de poluir a tabela de Exames Complementares e passam a ser fundidos em `physical_exam.specific.<área>` no `PhysicalExamBlock`. Lógica em novo `src/services/exam-classification.ts` (`partitionExams`, `mergePhysicalExamRows`).
- Tabela "Exames Complementares" agora mostra estado vazio explícito quando não há sangue/imagem/urina na consulta.
- Bloco "Avaliação" renomeado para "Suspeita / Diagnóstico" (`petTimeline.assessmentTitle`) e "Conduta" para "Plano / Conduta" (`petTimeline.planTitle`). Texto cru do veterinário permanece intacto.
_files: src/services/exam-classification.ts, src/components/pet/AssessmentInterpretation.tsx, src/components/pet/ConsultationMachineSummary.tsx, src/components/pet/PetConsultationsTimeline.tsx…_

### 2026-05-12 · [vet-ui] ADDED — Reestrutura da consulta clínica + agrupamento gerociência + remoção da aba Notas
- Aba Notas Clínicas removida do `PetProfilePage` (notas continuam visíveis dentro de cada consulta no histórico). Card "0 Notas Clínicas" mantido no topo conforme decisão do usuário.
- Lista de condições no perfil agora ordena condições tradicionais primeiro e empurra hallmarks de gerociência (inflammaging, sarcopenia, disfunção mitocondrial, senescência celular, CCD, imunossenescência etc.) para o final, marcadas como "atenção geriátrica" via `condition-classification.ts`.
- Novo serviço `src/services/condition-classification.ts` com whitelist EN/PT de hallmarks de envelhecimento e helper `geroscienceOriginLabelKey` que devolve i18n key + params (`bySuggestedExams`, `byVetVisit`, `byVetGeneric`).
_files: src/services/condition-classification.ts, src/pages/veterinario/PetProfilePage.tsx, src/components/pet/PetConsultationsTimeline.tsx, src/components/pet/PhysicalExamBlock.tsx…_

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

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.