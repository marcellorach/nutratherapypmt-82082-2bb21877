# Project context briefing (auto)
Generated: 2026-04-29T18:40:01.979Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.41.2

## Changes by area (last 14 days)
- **meta**: 7
- **admin**: 5
- **kg**: 1
- **vet-ui**: 1

## Top 10 recent entries
### 2026-04-29 · [kg] ADDED — Pipeline KG Evidence Gap-Fill (PubMed → triplets pendentes)
- Nova edge function `kg-evidence-gap-fill`: para cada par (composto canônico × condição do pet) sem evidência forte no KG (`approved` com `extraction_confidence ≥ 0.6`), busca o PubMed via NCBI E-utilities (`esearch` + `efetch`), extrai abstracts e usa Gemini (`google/gemini-3-flash-preview`, tool-calling) para gerar `efficacy_0_5`, `evidence_level`, `rationale` e `cited_pmids`.
- Persiste estudos em `scientific_studies` (`source_api='pubmed_gap_fill'`, dedup por `pmid`) e cria triplets em `triplet_extractions` SEMPRE como `curation_status='pending'` (mesmo com alta confiança — protocolo Curation Gatekeeper). `approval_chain` registra `{source: 'pubmed_gap_fill', cited_pmids}` para rastreabilidade.
- Acesso restrito a admin (validação via `getClaims` + `user_roles`). Rate limit serial: 360ms entre chamadas PubMed (110ms se `NCBI_API_KEY` for configurada).
_files: supabase/functions/kg-evidence-gap-fill/index.ts, src/hooks/useKgEvidenceGapFill.ts, src/components/pet/EvidenceGapCard.tsx, src/components/pet/DigitalTwinDog.tsx…_

### 2026-04-29 · [vet-ui] CHANGED — Digital Twin agora compara cenários ao longo dos anos
- `DigitalTwinDog` reescrito para consumir `usePetTrajectoryProjection` (mesma fonte do `BiologicalTimeline`): renderiza duas silhuetas lado a lado (Sem protocolo × Com protocolo) e um slider 0–8 anos. Antes só mostrava o estado atual, sem variação temporal nem cenário comparativo.
- Para cada ano projetado, os marcadores anatômicos refletem severidade real (`existing_conditions[].projected_severity_label`), risco emergente (`new_conditions[].probability` ≥ 20% com anel tracejado âmbar) e cobertura do stack (`coverage_by_condition[].kg_covered` → estrela ★ verde no marcador).
- KPIs alinhados com o `BiologicalTimeline`: idade biológica, cronológica, anos restantes e ganho com protocolo (`years_gained` da edge function `project-pet-trajectory`).
_files: src/components/pet/DigitalTwinDog.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts, src/locales/pt/translation.json…_

### 2026-04-29 · [admin] ADDED — Testes de inferArea e ordenação real do parser
- 17 novos testes em `scripts/__tests__/sync-changelog.test.mjs` cobrindo: prioridade `kg > infra` em `supabase/functions/kg-*`, `triplet`/`process-pdf`/`extract` → `curation`, `biomedical-taxonomy` e qualquer path com `knowledge-graph|neo4j` → `kg`, `base-knowledge` antes de regras genéricas, `i18n` para `src/locales/` e `src/i18n.ts`, `auth` para `AuthContext`/`pages/Auth`, `projectOrganograma`/`projectChangelog` → `admin`, ordem-importa quando múltiplos paths casam, fallback `meta`
- Testes de ordenação validando: data desc estrita com seções intercaladas (`## [Unreleased]` × `## [1.0.0]`), cabeçalhos `### Added - YYYY-MM-DD 🗺️ Título` (emoji direto, sem separador), múltiplas linhas em branco e bullets indentados, datas duplicadas mantendo entradas distintas, `## [versão]` não confundido com cabeçalho de entrada, fallback para `inferArea` quando metadata não declara área
- Bugs corrigidos no parser (descobertos pelos testes):
_files: scripts/__tests__/sync-changelog.test.mjs, src/i18n.ts, scripts/sync-changelog.mjs_

### 2026-04-29 · [admin] ADDED — Testes automatizados do parser do CHANGELOG (vitest)
- Setup mínimo de Vitest (`vitest.config.ts`, `src/test/setup.ts`, scripts `test` / `test:watch` em `package.json`) — inclui `scripts//*.test.mjs` no glob
- Refactor de `scripts/sync-changelog.mjs`: `parseMetaComment`, `extractFiles`, `inferArea`, `parseChangelog`, `KIND_MAP` e `AREA_RULES` agora são exportados; `main()` só roda quando o script é chamado como CLI (detecção via `import.meta.url` × `process.argv[1]`)
- 22 testes em `scripts/__tests__/sync-changelog.test.mjs` cobrindo: separadores variados (`·`, `,`, `;`, `|`), `commit:` no metadata-comment, captura de paths em prosa/listas/crases, dedup, todas as extensões suportadas, inferência de área por path, ordenação por data, fallback de `status`/`area`, limpeza de ✅/``/emoji, hífen e em-dash em cabeçalhos, mapping `deprecated → changed`
_files: src/test/setup.ts, scripts/sync-changelog.mjs, scripts/__tests__/sync-changelog.test.mjs_

### 2026-04-29 · [admin] ADDED — Mini-timeline por área no Organograma com links de arquivos e commits
- Novo `src/components/administrador/organograma/AreaMiniTimeline.tsx`: timeline vertical com bolinhas coloridas por tipo (added=verde, changed=âmbar, fixed=azul, removed=vermelho, security=roxo), expandir/recolher por entrada, filtros toggle por tipo e botão "Ver mais" (3 → 8)
- Cada entrada expandida mostra bullets resumidos (até 3), chips de arquivos (até 8) e — quando presente — chip de commit com hash curto e ícone `GitCommit`
- Arquivos e commits viram links externos quando `REPO_CONFIG.baseUrl` está configurado em `src/data/repoConfig.ts` (default vazio = chips estáticos seguros). Quando o GitHub estiver conectado via Connectors, basta preencher `baseUrl` para ativar todos os links
_files: src/components/administrador/organograma/AreaMiniTimeline.tsx, src/data/repoConfig.ts, scripts/sync-changelog.mjs, src/data/changelogQuery.ts…_

### 2026-04-29 · [admin] ADDED — Sincronização automática do CHANGELOG → Organograma + briefing do agente
- Novo `scripts/sync-changelog.mjs`: parser determinístico que lê CHANGELOG.md e regenera `src/data/projectChangelog.generated.ts` + `.lovable/CONTEXT.md` + atualiza `organogramaLastUpdated`
- `src/data/projectChangelog.ts` virou shim re-exportando o gerado — fim da dupla manutenção
- Inferência automática de `area` a partir dos arquivos citados (mapa explícito em AREA_RULES); override opcional via comentário `<!-- area: ... -->`
_files: scripts/sync-changelog.mjs, src/data/projectChangelog.generated.ts, .lovable/CONTEXT.md, src/data/projectChangelog.ts…_

### 2026-04-29 · [admin] ADDED — Organograma do Projeto (admin) — 4 lentes + changelog visual (i18n v1.38.0)
- Nova tab `Organograma do Projeto` em `/administrador?tab=organograma` (grupo Configurações), inspirada na `/admin/organograma` do Sleep Graph RAG
- 4 lentes complementares: Grafo (force-graph 2D com áreas como hubs coloridos + componentes como folhas + cross-links com partículas), Diagrama (Mermaid TD/LR com pan/zoom estilo Figma), Cards (árvore expansível por área com busca + ASCII fallback), Changelog (timeline filtrada por área e status)
- Single source of truth tipada: `src/data/projectOrganograma.ts` (10 áreas: auth, curation, kg, base-knowledge, clinical-pipeline, vet-ui, tutor-ui, admin, i18n, infra), `src/data/projectChangelog.ts` (espelho do CHANGELOG visual filtrável), `src/data/organogramaAreaMeta.ts` (ícones + paleta hex por área)
_files: src/data/projectOrganograma.ts, src/data/projectChangelog.ts, src/data/organogramaAreaMeta.ts_

### 2026-04-28 · [meta] CHANGED — Pipeline Clínico com Progresso Real + Console ao Vivo (i18n v1.30.0)
- Progresso real por estágio: `runClinicalAnalysisPipeline` agora aceita um callback `onProgress` que emite eventos `stage-start` / `stage-end` / `log` para cada etapa (predisposições, exames, KG, interações, recomendação). O workflow visual em `ClinicalPipelineWorkflow` deixa de "completar tudo de uma vez" no final — cada estágio acende e apaga conforme realmente termina, com duração medida via `performance.now()`
- Novo `ClinicalPipelineLogPanel`: console ao vivo (estilo digestão científica) renderizado abaixo do workflow na `PetProfilePage`. Mostra timestamp `HH:MM:SS.mmm`, ícone por nível (info/sucesso/aviso/erro), badge do estágio ativo, contador de eventos, autoscroll e ações Limpar / Exportar `.log`. Limite circular de 200 entradas
- Logs informativos por consulta KG: cada hit/miss no Knowledge Graph agora aparece no console com nome canônico utilizado, contagem de nós e relações — substituindo os `console.log/warn` que só ficavam no devtools

### 2026-04-28 · [meta] ADDED — Painel Admin de Curadoria de Doses + i18n v1.28.0
- Nova tab admin "Curadoria de Doses" (`Knowledge Base → Curadoria de Doses`) com 3 visões:
- Pendentes: doses com `needs_review=true` (vindas de web lookup ou estimativas de IA) prontas para edição inline (faixa mg/kg, frequência, fonte, citação, confiança) e aprovação canônica
- Curadas: doses já validadas por especialista

### 2026-04-28 · [meta] FIXED — Links de Estudos Persistindo nos Cards
_status: parcial_
- Sincronização do `VetRecommendationPanel`: os cards de recomendação agora reagem a novas análises/atualizações de `compounds`, evitando ficar presos a um estado inicial sem links de estudos
- Fallback de link no frontend: `CompoundDosageSlider` passou a reconstruir o URL clicável localmente a partir de `link`, `doi`, `pmid` ou título, mesmo se algum card receber payload parcial
- i18n v1.26.2: bump para forçar refresh de cache do navegador após a correção dos cards

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.