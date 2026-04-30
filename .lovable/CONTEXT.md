# Project context briefing (auto)
Generated: 2026-04-30T20:25:39.781Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: —

## Changes by area (last 14 days)
- **admin**: 8
- **meta**: 7
- **kg**: 5
- **vet-ui**: 4
- **i18n**: 2
- **clinical-pipeline**: 2
- **infra**: 1

## Top 10 recent entries
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

### 2026-04-30 · [i18n] ADDED — Internacionalização completa do Organograma do Projeto
- 7 arquivos corrigidos: OrganogramaTab, OrganogramaCards, OrganogramaDiagram, OrganogramaForceGraph, ChangelogTimeline, AreaMiniTimeline — todos agora usam `useTranslation()` + `t()` para textos visíveis.
- projectOrganograma.ts bilíngue: todas as ~60 entidades (áreas, filhos, convenções) agora possuem campos `title_en`, `description_en`, `label_en`, `value_en`.
- ~50 chaves i18n criadas no namespace `organograma` em ambos `translation.json` (PT/EN).
_files: src/pages/administrador/OrganogramaTab.tsx, src/data/projectOrganograma.ts_

### 2026-04-30 · [kg] ADDED — Diagnóstico Gap-Fill e detalhamento de fontes no EvidenceGapCard
- EvidenceGapCard expandido: agora exibe breakdown por fonte (Perplexity / PubMed) com contagem de consultas, sucessos, falhas e motivos de ausência de evidências. Erros inline e flag de "sem chave Perplexity" nos detalhes de cada par.
- Nova tab admin "Diagnóstico Gap-Fill": tela completa para inspecionar health_conditions (name_en), nutraceuticals (name_en), links pet_conditions ↔ condition_id, e todos os triplets gerados pelo gap-fill. Badges visuais indicam dados faltantes que impedem a pipeline.
- Files: src/components/pet/EvidenceGapCard.tsx, src/components/administrador/diagnostics/GapFillDiagnosticsTab.tsx, src/config/admin-tabs.ts
_files: src/components/pet/EvidenceGapCard.tsx, src/components/administrador/diagnostics/GapFillDiagnosticsTab.tsx, src/config/admin-tabs.ts_

### 2026-04-30 · [kg] FIXED — Restauração do pipeline de evidências (gap-fill → projeção → gêmeo digital)
- Deploy das Edge Functions: `kg-evidence-gap-fill`, `kg-missing-triplets`, `perplexity-health`, `provider-health` e `project-pet-trajectory` estavam retornando 404 (não publicadas). Agora todas estão ativas no backend.
- Backfill canônico: migração preencheu `pet_conditions.condition_id` (match por nome em `health_conditions`) e `nutraceuticals.name_en` para os 22 compostos que estavam sem nome inglês — requisito para o gap-fill montar pares de busca.
- Auth do gap-fill: substituído `getClaims` (indisponível na versão do SDK) por `getUser` para autenticação robusta do admin.
_files: supabase/functions/kg-evidence-gap-fill/index.ts, supabase/functions/project-pet-trajectory/index.ts, src/components/pet/EvidenceGapCard.tsx, src/i18n.ts…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.