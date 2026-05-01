# Project context briefing (auto)
Generated: 2026-05-01T02:04:46.600Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.49.0

## Changes by area (last 14 days)
- **admin**: 8
- **meta**: 7
- **vet-ui**: 5
- **kg**: 5
- **clinical-pipeline**: 3
- **infra**: 2
- **i18n**: 2

## Top 10 recent entries
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

### 2026-04-30 · [clinical-pipeline] FIXED — Pipeline scroll, DT workflow visual, Evidence Gap search fix
- Pipeline workflow card: adicionada barra de rolagem horizontal estilizada para telas menores
- Digital Twin: novo mini-workflow visual com 4 etapas (Snapshot → Trajectory API → Parse → Render) com tempos individuais e total
- Evidence Gap Search: corrigido bug onde `condition_id = NULL` em `pet_conditions` fazia a busca retornar 0 pares — agora usa `condition_name` como fallback
_files: src/components/pet/ClinicalPipelineWorkflow.tsx, src/components/pet/DigitalTwinDog.tsx, supabase/functions/kg-evidence-gap-fill/index.ts, src/locales/pt/translation.json…_

### 2026-04-30 · [clinical-pipeline] ADDED — Pipeline: card sinergias, tempos por etapa, log do Digital Twin
- Novo 7o estágio `stage7_synergies` (ícone Zap) no `ClinicalPipelineWorkflow` com contagem de sinergias entre compostos recomendados
- Tempo de execução exibido abaixo de cada etapa concluída + indicador de tempo total no canto direito do workflow
- Novo `DigitalTwinLogPanel`: console ao vivo no Digital Twin rastreando ciclo de vida da projeção de trajetória (início, chamada AI, resposta, cache, erros) com autoscroll, limpar e exportar
_files: src/components/pet/ClinicalPipelineWorkflow.tsx, src/components/pet/DigitalTwinLogPanel.tsx, src/components/pet/DigitalTwinDog.tsx, src/pages/veterinario/PetProfilePage.tsx…_

### 2026-04-30 · [admin] FIXED — Organograma usa bbox real para centralização e escala
- `useScrollPanZoom` agora mede o bounding box real do conteúdo SVG via `getBBox()` antes de aplicar `fit`, corrigindo o caso em que o Mermaid ficava minúsculo no canto apesar de haver espaço disponível.
- `OrganogramaDiagram` ganhou viewport útil maior (`calc(100vh - 230px)`, `minHeight: 520`) e `svg overflow-visible`, melhorando o aproveitamento horizontal e vertical.
- Files: src/hooks/useScrollPanZoom.ts, src/components/administrador/organograma/OrganogramaDiagram.tsx
_files: src/hooks/useScrollPanZoom.ts, src/components/administrador/organograma/OrganogramaDiagram.tsx_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.