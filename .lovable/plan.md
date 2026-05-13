## Renomear "Senex AI" → "Senex AI" (apenas camada visível)

### Escopo

Trocar todas as **menções visíveis ao usuário** ("Senex AI") por **"Senex AI"**, mantendo intactos identificadores internos (tipos, hooks, componentes, nomes de arquivo, edge functions, colunas de DB, propriedades de objeto). O motor continua se chamando `Senex AI` no código — só a marca exposta muda.

### O que muda (visível)

1. **Traduções (PT/EN)** — `src/locales/pt/translation.json` e `src/locales/en/translation.json`
   - 27 ocorrências em cada arquivo (títulos, descrições, tooltips, mensagens de pipeline, cards do PetProfile, BiologicalTimeline, RecommendationsList, etc.)
   - Substituição literal: `Senex AI` → `Senex AI` (preserva contexto, ex.: "Análise Senex AI" → "Análise Senex AI", "Pipeline de Digestão Senex AI" → "Pipeline de Digestão Senex AI")

2. **Strings JSX/fallback hardcoded em componentes e páginas**
   - `src/components/pet/Senex AIInsightsPanel.tsx` — fallback `'Análise Senex AI'`
   - `src/components/pet/ConsultationMachineSummary.tsx`, `BiologicalTimeline.tsx`, `DigitalTwinDog.tsx` — strings de UI
   - `src/pages/veterinario/PetProfilePage.tsx`, `RecommendationsList.tsx`, `src/pages/tutor/TutorPage.tsx` — labels e textos
   - `src/components/administrador/...` (PipelineDashboard, NtaiProcessingSection, NtaiStudySelectionTable, PromptManagementPanel, ExtractionPromptsEditor, TechnicalAuditsTab, EnhancedStudyVisualization, PipelineDebugTab, Neo4jStudyGraph) — apenas strings exibidas / labels / descrições
   - `src/services/pdf-export.ts`, `src/services/recommendation-confidence-service.ts` — só textos que vão pro PDF/relatório

3. **Catálogos de tabs e organograma (textos descritivos)**
   - `src/data/admin-tabs-info.ts` e `src/data/admin-tabs-info-bilingual.ts` — campos `objective`, `description`, headers de tabela, labels de diagrama ASCII
   - `src/data/projectOrganograma.ts` — descrições visíveis
   - `src/data/biomedical-taxonomy.ts` — comentário/descrição visível, se existir em campo exibido

4. **Documentação**
   - `ARCHITECTURE.md`, `CHANGELOG.md`, `docs/TECHNICAL_DECISIONS.md`, `.lovable/plan.md`
   - Adicionar nota: "Senex AI é o nome de marca do motor antes chamado Senex AI. Identificadores internos foram mantidos para evitar refactor."
   - Nova entrada em `[Unreleased]` do CHANGELOG → bump `I18N_VERSION` para `1.74.0` (mudança em strings traduzidas)
   - Rodar `npm run sync:changelog` para regerar `src/data/projectChangelog.generated.ts` e `.lovable/CONTEXT.md`

### O que NÃO muda (interno, preservado)

- Tipos: `Senex AIAnalysisResult`, `Senex AIConditionTag`, etc. em `src/types/vetgraphrag.ts`, `ntai.ts`, `recommendation-confidence.ts`
- Componentes/hooks: `Senex AIInsightsPanel` (componente), `useSenex AIConfig`, `useSenex AILogs`, `useSenex AIQueue`, `useNtaiProcessing`
- Arquivos: `vetgraphrag-service.ts`, `vetgraphrag.ts`, `vetgraphrag-enhanced.ts` (paths)
- Edge functions e seus logs internos: `generate-triplets`, `kg-evidence-gap-fill`, `project-pet-trajectory`, `sync-approved-triplets`, `gemini-file-search` — apenas mensagens de log que aparecem na UI são trocadas; identificadores e nomes de função permanecem
- Chaves de tradução (paths como `petProfile.insights.vetgraphragAnalysis`) — mantidas; só os valores mudam
- `public/translation-audit-report.json` — artefato gerado, ignorar

### Critérios de revisão

- Nenhuma string visível ao usuário contém "Senex AI" após a mudança (validar com `grep` em valores de JSON e literais JSX)
- Build passa sem mudanças em assinaturas de tipos
- `I18N_VERSION` incrementado para invalidar cache
- CHANGELOG sincronizado

### Memória a registrar

Nova entrada em `mem://branding/senex-ai-rename`: "Marca pública do motor é **Senex AI**. Internamente o código mantém `Senex AI`/`ntai` em tipos, hooks e arquivos — não renomear identificadores em refactors futuros."