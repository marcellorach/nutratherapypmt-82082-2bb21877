# Project context briefing (auto)
Generated: 2026-05-06T15:52:53.864Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.54.1

## Changes by area (last 14 days)
- **admin**: 9
- **meta**: 7
- **vet-ui**: 6
- **kg**: 6
- **curation**: 3
- **clinical-pipeline**: 3
- **infra**: 2
- **i18n**: 2

## Top 10 recent entries
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

### 2026-05-01 · [curation] ADDED — QA gate + provenance for AI enrichment
- New columns `enrichment_source` (none/extracted/llm/llm_low_confidence/human), `enrichment_confidence`, `enrichment_needs_review`, `enrichment_at` on `triplet_extractions` for full provenance of AI-inferred metadata
- New table `enrichment_qa_samples` storing stratified human-reviewed AI enrichment samples (batch_id, AI vs human verdict per field)
- Guard-rails in `enrich-triplet`: short excerpts (<80 chars) skip the LLM; AI must return a verbatim `source_quote` that is substring-verified against the source text; AI must self-report confidence; failures are flagged `enrichment_source = llm_low_confidence` + `needs_review = true`
_files: supabase/functions/enrich-triplet/index.ts, supabase/functions/backfill-triplet-enrichment/index.ts, supabase/functions/enrichment-qa-sample/index.ts, src/components/administrador/estudos/curation/EnrichmentQAReview.tsx…_

### 2026-05-01 · [curation] CHANGED — Auto-enrichment of triplet intensity & evidence_level
_status: parcial_
- Improved `enrich-triplet` prompt: anchored intensity scale in observed magnitude (% change, effect size), forces low intensity for null/negative results, requires verbatim source excerpt in `confidence_rationale`, added `in_vivo`/`animal_study` to evidence_level enum
- Added DB CHECK constraint update to allow `in_vivo` evidence_level (previously fell back to `expert_opinion`)
- New `backfill-triplet-enrichment` edge function: idempotent batch enrichment with rate-limit-aware batching; also serves single-triplet mode for post-approval hooks
_files: src/services/triplet-enrichment-service.ts, supabase/functions/enrich-triplet/index.ts, supabase/functions/backfill-triplet-enrichment/index.ts_

### 2026-05-01 · [kg] FIXED — KG Evidence Gap-Fill: PubMed complementary search when Perplexity PMIDs fail validation
- Critical fix: when Perplexity returns efficacy > 0 but all cited PMIDs are hallucinated (fail PubMed validation), the pipeline now searches PubMed directly for real papers and re-assesses with Gemini
- Previously, PubMed fallback only triggered when Perplexity returned efficacy = 0, which almost never happens for known correlations
- Reduced sleep intervals (400ms→200ms Perplexity, 360ms→150ms PubMed) to fit within 150s idle timeout
_files: supabase/functions/kg-evidence-gap-fill/index.ts, src/components/pet/EvidenceGapCard.tsx_

### 2026-05-01 · [vet-ui] CHANGED — Digital Twin workflow expandido + log reposicionado
- Workflow do Gêmeo Digital expandido de 4 para 7 estágios: Snapshot → Condições → Raça → Trajectory API → Parse → Cobertura KG → Render
- Log panel movido para imediatamente abaixo do workflow monitor (antes ficava após o EvidenceGapCard)
- Novos ícones e labels bilíngues para cada estágio
_files: src/components/pet/DigitalTwinDog.tsx, src/locales/pt/translation.json, src/locales/en/translation.json, src/i18n.ts_

### 2026-05-01 · [clinical-pipeline] CHANGED — Pipeline: recommendation timing + KG stratification
- Adicionado `durationMs` ao stage6_recommendation para exibir tempo individual no stepper
- KG dividido em dois cards visuais: KG Query (consulta Neo4j) e KG Enrich (extração de pathways/projeções)
- Novo estágio `stage4b_kg_enrich` no pipeline com contagem de pathways
_files: src/services/clinical-analysis-pipeline.ts, src/components/pet/ClinicalPipelineWorkflow.tsx, src/pages/veterinario/PetProfilePage.tsx_

### 2026-04-30 · [infra] FIXED — Edge function kg-evidence-gap-fill: PascalCase types + FK study_id
- Corrigido `subject_type: 'compound'` → `'Compound'` e `object_type: 'condition'` → `'Condition'` — constraint `triplet_extractions_object_type_check` rejeitava todos os inserts
- Corrigido `study_id` FK violation: FK aponta para `processed_studies`, não `scientific_studies`. Gap-fill triplets agora usam `study_id = null` com proveniência em `approval_chain.cited_pmids`
- Verificado: triplet "Chondroitin Sulfate treats Osteoarthritis" salvo com sucesso como pending
_files: supabase/functions/kg-evidence-gap-fill/index.ts_

### 2026-04-30 · [infra] FIXED — Edge function kg-evidence-gap-fill: constraint violation + timeout
- Corrigido bug onde campo `direction` era inserido como `positive` (valor inválido) em vez de `improves` — constraint `chk_direction` rejeitava todos os triplets encontrados pelo Perplexity
- `mapEvidenceLevel` garante mapeamento `clinical_trial` → `rct` para satisfazer constraint `chk_evidence_level`
- Reduzido `max_pairs` default de 12 para 5 para evitar timeout de conexão HTTP (cada par leva ~20-30s no Perplexity)
_files: supabase/functions/kg-evidence-gap-fill/index.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.