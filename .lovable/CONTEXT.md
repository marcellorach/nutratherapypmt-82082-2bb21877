# Project context briefing (auto)
Generated: 2026-05-01T22:10:25.819Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: —

## Changes by area (last 14 days)
- **admin**: 8
- **meta**: 7
- **kg**: 6
- **vet-ui**: 5
- **clinical-pipeline**: 3
- **curation**: 2
- **infra**: 2
- **i18n**: 2

## Top 10 recent entries
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

### 2026-04-30 · [vet-ui] FIXED — Restaurado Digital Twin + busca de evidências + marcadores dos avatares
- `DigitalTwinDog` (com `EvidenceGapCard` e log panel) restaurado na tab "trajectory" do PetProfilePage — havia sido removido na consolidação de tabs anterior
- Corrigida lógica dos marcadores nos avatares: cenário "sem protocolo" agora faz fallback para os dados do cenário "com protocolo" quando a API retorna `yearWithout` vazio, garantindo que ambos mostrem as doenças
- Perplexity connector verificado como ativo e vinculado ao projeto
_files: src/pages/veterinario/PetProfilePage.tsx, src/components/pet/DigitalTwinDog.tsx_

### 2026-04-30 · [kg] FIXED — Corrigido insert de triplets no gap-fill + UI de conclusões
- Bug crítico: `direction: 'positive'` violava constraint `chk_direction` (mapeado para `'improves'`); `evidence_level` com valores inválidos (`clinical_trial`, `in_vivo`, `review`, `unclear`) mapeados para enum do DB (`rct`, `cohort`, `expert_opinion`)
- UI agora exibe conclusões claras por par: score de eficácia (0-5) com barra visual, nível de evidência, espécie, rationale colapsável do Perplexity/Gemini, links para PMIDs no PubMed e URLs citadas
- Botão de curadoria aparece automaticamente após triplets criados com sucesso
_files: supabase/functions/kg-evidence-gap-fill/index.ts, src/components/pet/EvidenceGapCard.tsx_

### 2026-04-30 · [i18n] FIXED — Traduções evidenceGap.log e layout responsivo DT workflow
- Adicionadas 16 chaves de tradução `evidenceGap.log.*` em PT e EN para o painel de log em tempo real da busca de evidências
- DT mini-workflow: trocado `overflow-x-auto` por `flex-wrap` para quebrar em duas linhas em vez de sair do quadro
- Conectores entre etapas ocultados em telas pequenas (`hidden sm:block`)
_files: src/locales/en/translation.json, src/locales/pt/translation.json, src/components/pet/DigitalTwinDog.tsx, src/i18n.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.