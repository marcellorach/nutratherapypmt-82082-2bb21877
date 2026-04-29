# Project context briefing (auto)
Generated: 2026-04-29T06:17:06.512Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.40.0

## Changes by area (last 14 days)
- **meta**: 7
- **admin**: 3

## Top 10 recent entries
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

### 2026-04-29 · [admin] ADDED — ️ Organograma do Projeto (admin) — 4 lentes + changelog visual (i18n v1.38.0)
- Nova tab `Organograma do Projeto` em `/administrador?tab=organograma` (grupo Configurações), inspirada na `/admin/organograma` do Sleep Graph RAG
- 4 lentes complementares: Grafo (force-graph 2D com áreas como hubs coloridos + componentes como folhas + cross-links com partículas), Diagrama (Mermaid TD/LR com pan/zoom estilo Figma), Cards (árvore expansível por área com busca + ASCII fallback), Changelog (timeline filtrada por área e status)
- Single source of truth tipada: `src/data/projectOrganograma.ts` (10 áreas: auth, curation, kg, base-knowledge, clinical-pipeline, vet-ui, tutor-ui, admin, i18n, infra), `src/data/projectChangelog.ts` (espelho do CHANGELOG visual filtrável), `src/data/organogramaAreaMeta.ts` (ícones + paleta hex por área)
_files: src/data/projectOrganograma.ts, src/data/projectChangelog.ts, src/data/organogramaAreaMeta.ts_

### 2026-04-28 · [meta] CHANGED — ️ Pipeline Clínico com Progresso Real + Console ao Vivo (i18n v1.30.0)
- Progresso real por estágio: `runClinicalAnalysisPipeline` agora aceita um callback `onProgress` que emite eventos `stage-start` / `stage-end` / `log` para cada etapa (predisposições, exames, KG, interações, recomendação). O workflow visual em `ClinicalPipelineWorkflow` deixa de "completar tudo de uma vez" no final — cada estágio acende e apaga conforme realmente termina, com duração medida via `performance.now()`
- Novo `ClinicalPipelineLogPanel`: console ao vivo (estilo digestão científica) renderizado abaixo do workflow na `PetProfilePage`. Mostra timestamp `HH:MM:SS.mmm`, ícone por nível (info/sucesso/aviso/erro), badge do estágio ativo, contador de eventos, autoscroll e ações Limpar / Exportar `.log`. Limite circular de 200 entradas
- Logs informativos por consulta KG: cada hit/miss no Knowledge Graph agora aparece no console com nome canônico utilizado, contagem de nós e relações — substituindo os `console.log/warn` que só ficavam no devtools

### 2026-04-28 · [meta] ADDED — Painel Admin de Curadoria de Doses + i18n v1.28.0
- Nova tab admin "Curadoria de Doses" (`Knowledge Base → Curadoria de Doses`) com 3 visões:
- - Pendentes: doses com `needs_review=true` (vindas de web lookup ou estimativas de IA) prontas para edição inline (faixa mg/kg, frequência, fonte, citação, confiança) e aprovação canônica
- - Curadas: doses já validadas por especialista

### 2026-04-28 · [meta] FIXED — Links de Estudos Persistindo nos Cards
_status: parcial_
- Sincronização do `VetRecommendationPanel`: os cards de recomendação agora reagem a novas análises/atualizações de `compounds`, evitando ficar presos a um estado inicial sem links de estudos
- Fallback de link no frontend: `CompoundDosageSlider` passou a reconstruir o URL clicável localmente a partir de `link`, `doi`, `pmid` ou título, mesmo se algum card receber payload parcial
- i18n v1.26.2: bump para forçar refresh de cache do navegador após a correção dos cards

### 2026-04-28 · [meta] ADDED — Selo de Fonte do Link + Fallback de Estudos
- Selo de proveniência do link: cada estudo no card mostra um pequeno badge (DOI / PubMed / PMC / Scholar / Externo) derivado da URL final, deixando claro para onde o clique leva
- Ícone `ExternalLink` + `aria-label`: títulos de estudos sinalizam visualmente que abrem em nova aba (`target="_blank" rel="noopener noreferrer"`, sem mudança de comportamento)
- Fallback "compound-only" em `attachStudiesToCompounds`: quando não existe triplet aprovado para o par exato (composto, condição), a pipeline busca até 3 estudos de alta confiança que mencionam o composto sozinho — assim todo card sempre tem referências clicáveis. Esses estudos são sinalizados como "Geral" e o card exibe o aviso "Estudos sobre o composto (não específicos a esta condição)" para preservar transparência clínica

### 2026-04-28 · [meta] CHANGED — Links Robustos + Evidência Completa Dentro do Card
- Links de estudos com fallback robusto: pipeline agora normaliza `link` (DOI/PubMed/Scholar) antes de devolver — sem mais cliques mortos. DOIs salvos como URL completa não duplicam mais o prefixo
- Knowledge Graph dentro de cada card de composto: `CompoundDosageSlider` ganhou bloco com triplets reais `[composto] → [predicado] → [condição]` (estilo "Embasamento Científico"), incluindo contagem de estudos, evidência e % de confiança — não precisa mais trocar de aba
- Sinergias por paciente: cada card mostra outras condições do pet que o mesmo composto também trata (cruzando `triplet_extractions` aprovados com a lista de condições do paciente)

### 2026-04-28 · [meta] CHANGED — Consolidação de Alertas + Cards com Evidência Profunda
- Aba "Alertas Clínicos" removida: predisposições não-diagnosticadas já aparecem em "Análise VetGraphRAG → Alvos para Prevenção" — fim da duplicação
- Reordenação de tabs: Recomendações (default) → Caminho Biológico → Evidência Científica → Projeção → Chat por Composto
- CompoundDosageSlider — bloco "Ver evidências e contexto": novo dropdown por card mostrando

### 2026-04-28 · [meta] FIXED — Categorias Genéricas → Doenças Específicas
- Pets demo: Luna agora tem `Degenerative Valve Disease (Myxomatous Mitral Valve Disease)` (MMVD — doença real do Cavalier King Charles compatível com sopro 4/6) em vez da categoria genérica "Cardiovascular Disease"
- Pets demo: Thor agora tem `Hip Dysplasia` (já indicada no exame) em vez de "Chronic Inflammation" (categoria, não doença)
- Migração de dados: UPDATE em `pet_conditions` para corrigir registros existentes

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.