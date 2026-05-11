# Project context briefing (auto)
Generated: 2026-05-11T19:33:59.385Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.65.0

## Changes by area (last 14 days)
- **admin**: 11
- **vet-ui**: 8
- **tutor-ui**: 7
- **meta**: 7
- **kg**: 6
- **clinical-pipeline**: 5
- **i18n**: 3
- **curation**: 3
- **infra**: 2

## Top 10 recent entries
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

### 2026-05-09 · [admin] ADDED — Base Farmacológica (Fase 1) integrada ao perfil do pet
- Novo `DrugLookupBadge` plugado na lista de medicamentos em `PetProfilePage.tsx` — resolve marca comercial (ex.: "Previcox") para princípio ativo + classe (ex.: `= firocoxibe · AINE COXIB`), com tooltip de mecanismo; exibe alerta "Não reconhecido" quando a medicação não está no catálogo
- Chaves i18n formais adicionadas em `pharmacology.lookup.*` e `admin.pharmacology.*` (PT/EN), substituindo fallbacks inline
- I18N_VERSION incrementado para 1.63.0
_files: src/pages/veterinario/PetProfilePage.tsx, src/components/pet/DrugLookupBadge.tsx, src/locales/pt/translation.json, src/locales/en/translation.json…_

### 2026-05-07 · [tutor-ui] ADDED — Sprint 7: CTA honesto em dois passos + ROI
- Novo serviço `src/services/proposal-roi.ts` (puro) — calcula custo anual do plano, comparativo com tratamento da condição instalada (mostra `—` quando não há referência, sem inventar número) e crédito M3 = 50% do investimento dos 3 primeiros meses
- Novo componente `src/components/tutor/HonestCTA.tsx` — bloco de comparação de custo (3 colunas), promessa testável de M3 (devolução em crédito se exames de calibração não mostrarem ≥15% de melhora), CTA primário "Começar com a primeira caixa" + secundário "Continuar plano anual após reavaliação no M3" + link para abrir o chat de dúvidas
- `TreatmentProposalCard` substitui o bloco antigo de Aceitar/Dúvidas pelo `HonestCTA`, mantendo `handleAccept` como ação primária
_files: src/services/proposal-roi.ts, src/components/tutor/HonestCTA.tsx, src/services/__tests__/proposal-roi.test.ts, src/components/tutor/TreatmentProposalCard.tsx…_

### 2026-05-07 · [tutor-ui] ADDED — Sprint 6: Exportação PDF do protocolo do tutor
- Novo serviço `src/services/pdf-export.ts` usando `@react-pdf/renderer` — gera Documento A4 com cabeçalho fixo, condições, cenário comparado (Gêmeo Digital), compostos com posologia/racional, racional clínico, investimento, referências em formato Vancouver e rodapé com data de geração
- Botão "Baixar protocolo em PDF" no `TreatmentProposalCard` (sempre disponível, mesmo após aceite) — reaproveita as referências já carregadas pelo hook `useProposalReferences`
- Suíte `src/services/__tests__/pdf-export.test.ts` (5/5 passing): cobre forma do documento, condições vazias, cenário ausente, refs vazias e mistura de shapes (string × objeto)
_files: src/services/pdf-export.ts, src/services/__tests__/pdf-export.test.ts, src/components/tutor/TreatmentProposalCard.tsx, src/locales/pt/translation.json…_

### 2026-05-07 · [tutor-ui] ADDED — Sprint 5: Biblioteca de referências científicas no relatório do tutor
- Novo componente `ScientificReferencesLibrary` — lista expandível com filtro de busca, citação Vancouver, tags de composto/condição e link clicável para PMID/DOI
- Novo serviço puro `references-builder` — deduplica por PMID/DOI, ordena por ano desc, formata Vancouver, faz merge de tags por estudo
- Novo hook `useProposalReferences` — busca triplets aprovados (compound × condition) no banco e resolve `scientific_studies` reais (sem mock)
_files: src/services/references-builder.ts, src/services/__tests__/references-builder.test.ts, src/hooks/useProposalReferences.ts, src/components/tutor/ScientificReferencesLibrary.tsx…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.