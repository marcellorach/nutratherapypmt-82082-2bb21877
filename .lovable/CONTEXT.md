# Project context briefing (auto)
Generated: 2026-05-07T20:21:20.187Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.60.0

## Changes by area (last 14 days)
- **admin**: 9
- **tutor-ui**: 7
- **meta**: 7
- **vet-ui**: 6
- **kg**: 6
- **curation**: 3
- **clinical-pipeline**: 3
- **infra**: 2
- **i18n**: 2

## Top 10 recent entries
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

### 2026-05-07 · [tutor-ui] ADDED — Sprint 4: Subgrafo do paciente no relatório do tutor
- `TreatmentProposalCard` agora renderiza `PatientKnowledgeSubgraph` abaixo das curvas de progressão, usando `key_triplets`, `biological_pathways`, condições e compostos do próprio `proposal`
- Subgrafo reaproveita o componente já existente (vis-network), com legenda de cores, contagem de nós/arestas e arestas tracejadas âmbar para triplets provisórios via `petId`
- Render condicional: só aparece quando há triplets ou pathways no `scientific_summary`
_files: src/components/tutor/TreatmentProposalCard.tsx, src/components/tutor/__tests__/subgraph-logic.test.ts_

### 2026-05-07 · [tutor-ui] ADDED — Sprint 3: Cenário "Com vs Sem protocolo" (Digital Twin real)
- Novo componente `ScenarioComparison.tsx` no relatório do tutor: cards lado-a-lado mostrando idade biológica projetada e expectativa de vida total sem vs com o protocolo
- Dados 100% reais do edge function `project-pet-trajectory` (Gêmeo Digital, Gemini 2.5 Pro grounded no KG); reusa o mesmo query do Sprint 2 (sem requests adicionais)
- Selo de transparência `Gêmeo Digital · ancorado no KG` (verde) vs `Estimativa heurística` (âmbar) com tooltip explicativo bilíngue
_files: src/components/tutor/ScenarioComparison.tsx, src/components/tutor/TreatmentProposalCard.tsx, src/components/tutor/__tests__/scenario-logic.test.ts, src/locales/pt/translation.json…_

### 2026-05-07 · [tutor-ui] ADDED — Sprint 2: Badges KG-covered / KG-gap no relatório do tutor
- Cada condição no `TreatmentProposalCard` agora exibe selo `KG-covered` (verde) ou `KG-gap` (âmbar) com tooltip explicativo (PT/EN), usando `coverage_by_condition` do `usePetTrajectoryProjection`
- Novo selo agregado no header de "Condições Identificadas": "X de Y com cobertura científica" + tooltip
- Match case-insensitive e tolerante a whitespace; fallback silencioso quando não há dados de cobertura (não quebra)
_files: src/components/tutor/TreatmentProposalCard.tsx, src/components/tutor/__tests__/coverage-logic.test.ts, src/locales/pt/translation.json, src/locales/en/translation.json…_

### 2026-05-07 · [tutor-ui] ADDED — Sprint 1: Curva de progressão calibrada em literatura real
- Nova tabela `condition_response_curves` (Supabase) com parâmetros (time_to_effect, peak_effect, plateau_week, placebo_decline, SMD, banda de confiança, citações PMID/DOI) ancorados em meta-análises reais
- Seed inicial com 5 curvas: Osteoartrite × (Ômega-3, Glucosamina+Condroitina, PCSO-524, Curcumina) + Senescência Celular × NMN/NR (extrapolada de humanos, claramente sinalizada)
- Novo serviço `condition-progression-engine.ts` com `buildCalibratedCurve`, `classifyCompound`, `pickBestCurve`, `buildPointsFromRow` — substitui sigmoide heurística do `ConditionProgressionChart`
_files: src/services/condition-progression-engine.ts, src/services/__tests__/condition-progression-engine.test.ts, src/components/tutor/ConditionProgressionChart.tsx, src/components/tutor/TreatmentProposalCard.tsx…_

### 2026-05-06 · [vet-ui] CHANGED — Pets demo agora usam condições com forte cobertura no VetGraphRAG
- Reformuladas as condições dos 5 pets de exemplo (`GenerateSamplePetsButton`) para usar exclusivamente outcomes com ≥15 compostos no KG (layer_4_outcome aprovado)
- Substituições: `Mild Periodontal Disease` → `Oxidative Stress` (Buddy); `Hip Dysplasia`+`Overweight` → `Obesity`+`Oxidative Stress` (Rex); `Hip Dysplasia`+`Degenerative Myelopathy` → `Neuroinflammation`+`Cellular Senescence` (Thor); `Pulmonary Hypertension` → `Cardiovascular Disease` e label MMVD canonicalizado para `Myxomatous Mitral Valve Disease` (Luna)
- Exames atualizados de forma coerente com as novas condições (Oxidative Stress Panel, Senescence Biomarkers, Cardiovascular Panel) — narrativa clínica mantida e plausível por raça/idade
_files: src/components/pet/GenerateSamplePetsButton.tsx, src/i18n.ts_

### 2026-05-04 · [curation] ADDED — Sistema de tags estruturadas para estudos científicos
- Novas colunas em `processed_studies`: `tags` (jsonb com `study_design`, `population`, `methodology`, `sample_size`, `ai_confidence`), `prestige_tier` (1-5), `tags_source` (`pending` | `ai_extracted` | `manual` | `reviewed`)
- Nova tabela `journal_prestige_tiers` com seed de ~40 journals top (Nature/Cell/JVIM/Aging Cell/etc.) classificados por tier 1-5 baseado em quartil Scimago + prestígio do publisher
- Edge function `auto-tag-studies`: extrai tags via Gemini Flash Lite (apenas extração textual de title/abstract/journal — sem inferência) e calcula `prestige_tier` via lookup; throttle 300ms; sem alucinação porque enums fechados via tool calling
_files: supabase/functions/auto-tag-studies/index.ts, src/components/administrador/estudos/library/StudiesLibraryTab.tsx, src/i18n.ts_

### 2026-05-04 · [admin] FIXED — Library tab agora renderiza os estudos curados
- Corrigido bug de navegação em que a aba `Library` existia no menu, mas não tinha `TabsContent` associado em `SciImportSection`
- A aba agora reutiliza `StudiesLibraryTab`, exibindo os estudos vindos de `processed_studies` e `scientific_studies` conforme já implementado
- Validado no backend: 40 estudos `approved`, 4 `processed` e 2 `new` disponíveis para listagem
_files: src/components/administrador/estudos/import/SciImportSection.tsx_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.