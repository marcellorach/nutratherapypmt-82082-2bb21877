
# Investigação: dado rico chega na tela?

Read-only. Confirmando o que existe no código real e no banco antes de propor mudança.

---

## 1) Quem escreve `processed_studies.analysis_data` na produção

Não existe `analyze-study-outputs` no repo. Os escritores reais são **quatro**, nesta ordem do pipeline:

| # | Função | Linha | Modo de escrita | Conteúdo |
|---|---|---|---|---|
| 1 | `parse-study/index.ts` | 214–222 | **REPLACE** (`update({ analysis_data: structuredContent })`) | conteúdo estruturado do PDF (texto + metadados básicos) |
| 2 | `gemini-file-search/index.ts` | 2276–2291 | **REPLACE** (`update({ analysis_data: analysisData })`) | extração rica (nutracêuticos, mecanismos, efeitos, synergies, contraindications, structured_dosages, study_assessment, side_effects, study_summary, biological_effects, biomarkers, study_population, scores) |
| 3 | `extract-study-entities/index.ts` | 866–880 | **DEEP-MERGE com ownership** via `mergeAnalysisData()` (do `_shared/analysisDataMerge.ts`) | Stage 1/2/3 do extrator: `molecularMechanisms`, `clinicalOutcomes`, `synergies`, `hierarchicalRelations`, `extractionStages`, `detailedSideEffects` |
| 4 | `generate-triplets/index.ts` | 1027–1037 | **SHALLOW SPREAD** (`{ ...study.analysis_data, phase1_discovery, pathway_chains, extraction_timestamp }`) | só anexa 3 chaves de descoberta livre |

`extract-study-entities` também faz `update` adicional sem tocar `analysis_data` (linhas 100, 149, 671) — só mexem em `kanban_status` / `ingestion_stages` / `processing_error`. Sem clobber.

**Há REPLACE cego ainda?** Sim, **dois** — mas pela ORDEM são seguros: `parse-study` é o primeiro a popular o registro (estado inicial vazio/textual), e `gemini-file-search` roda **antes** do `extract-study-entities`, então o REPLACE do gemini define o "current" sobre o qual o merge do extract preserva ownership. `generate-triplets` roda **depois** e usa spread raso — não derruba chaves de nível 1, só pode reescrever `phase1_discovery`/`pathway_chains` (não conflita com mecanismos/outcomes). Padrão que o deep-merge "deveria ter matado": nenhum sobrou no caminho mecanismos+outcomes.

## 2) `_shared/analysisDataMerge.ts`: cobertura

`rg mergeAnalysisData|mergeExtractedData supabase/functions`:
- `extract-study-entities/index.ts:608` (mergeExtractedData → `study_extractions`)
- `extract-study-entities/index.ts:873` (mergeAnalysisData → `processed_studies`)

**Nenhum outro escritor importa o merge.** `gemini-file-search`, `parse-study`, `generate-triplets` não passam por ele. Hoje isso é benigno (ordem garante segurança), mas a fronteira de ownership cobre **só o trecho que consertamos**. Se amanhã `gemini-file-search` for reexecutado depois do `extract-study-entities` (re-encadeamento já existe em `gemini-file-search:2297`, condicionado a `shouldRechain`), o REPLACE do gemini **apaga** `molecularMechanisms` / `clinicalOutcomes` / `extractionStages` do extract. Risco real, não hipotético.

## 3) Ponte `study_extractions.extracted_data` → `processed_studies.analysis_data`

**Não há ponte.** Quem grava `extracted_data` é o `extract-study-entities` (linha 608, via `mergeExtractedData`). Quem grava `analysis_data` Stage 1/2/3 é o **mesmo** `extract-study-entities` (linha 873), com o **mesmo** `frontendData` produzido naquela invocação. São duas escritas paralelas a partir da mesma fonte LLM, não uma carregando da outra. Não existe job que leia `study_extractions` e empurre para `analysis_data`.

Confirmado no banco para `7b151ae8` (estudo de teste das ondas):
- `analysis_data.clinicalOutcomes[0]` = `{outcome, effect_size, outcome_type, significance, anchored_mechanism: "none"}` ✓ shape novo + proveniência presente
- `analysis_data.molecularMechanisms[0]` = `{name, type, action, target, category, downstream_effects[]}` ✓

Implicação: `molecularMechanisms`, `clinicalOutcomes` no shape `{outcome, outcome_type, p_value, effect_size, significance}` e `anchored_mechanism` **atravessam para `analysis_data`** — desde que o run de extract tenha sido o último a tocar o registro (volta ao risco do item 2).

## 4) Read-path da UI

`analysis_data` é lido em (grep `analysis_data` em src/):
- `EstudoDetailSections.tsx:68,87` — renderiza `molecularMechanisms` ✓
- `EstudoCard.tsx:172–173` — só conta `molecularMechanisms.length` e `clinicalOutcomes.length` (badges)
- `EnhancedStudyVisualization.tsx`, `VisaoGeralTab.tsx`, `PipelineDebugTab.tsx`, `AnaliseTab.tsx` — varredura visual de chaves

O detalhe rico (Stage 2 + Stage 3 com rigor estatístico) é renderizado pelo `NtaiAnalysisResults` → `NtaiMechanismsTab` / `NtaiClinicalTab`. Cobertura real:

- `NtaiMechanismsTab.tsx` renderiza `name`, `action`, `type`, `category`, `target`, `downstream_effects[]`. **Tudo do shape do extract aparece.** ✓
- `NtaiClinicalTab.tsx:99–122` renderiza `outcome`, `outcome_type`, `p_value`, `effect_size`, `significance` (com cor por significância). **Rigor estatístico aparece.** ✓
- **`anchored_mechanism` NÃO é renderizado em lugar nenhum** (`rg anchored_mechanism src` → zero hits). A proveniência existe no banco (confirmado em `7b151ae8`) mas a tela ignora.

Porém — `NtaiAnalysisResults` recebe `result` via `NtaiProcessingSection`, alimentado pelo `useProcessingLogic.ts:356–377`, que monta o objeto **do response da edge function** (`extractData`), **não** de `analysis_data` relido do banco. Ou seja: a aba "rica" no Admin **só mostra esses dados durante a execução manual da extração via UI**. Depois, navegando para o estudo de novo, quem entrega o dado para a tela é `analysis_data` (via `EstudoDetailSections` + `EstudoCard`), e aí o Stage 3 detalhado **não tem componente** equivalente — só o `molecularMechanisms` em `EstudoDetailSections`. **`clinicalOutcomes`/`p_value`/`effect_size`/`significance`/`anchored_mechanism` não são renderizados a partir de `analysis_data` em nenhuma tela persistente.**

## Onde o dado rico tem mais chance de se perder

1. **Re-execução de `gemini-file-search`** depois de um `extract-study-entities` bem-sucedido apaga Stage 2/3 do `analysis_data` (REPLACE sem merge). Hoje só acontece via `shouldRechain`, mas é uma bomba relógio.
2. **UI persistente não renderiza Stage 3**: `clinicalOutcomes`/rigor estatístico/`anchored_mechanism` só aparecem na sessão de processamento (`NtaiAnalysisResults` montado de `extractData` em memória). Reabrir o estudo amanhã → some.
3. **`anchored_mechanism` não tem leitor**: o guarda-corpo gera o campo, persiste no banco, e nenhum componente o consome.

## Discordância da premissa

- "`analyze-study-outputs`" não existe — o orquestrador é o conjunto `parse-study → gemini-file-search → extract-study-entities (+ generate-triplets)`. Resto da premissa bate.
- "Caminho de produção que o teste não disparou" é parcialmente verdade: o `curl` do extract grava o `analysis_data` via merge correto. O risco real **não é** que o merge não tenha rodado — é que (a) telas persistentes não exibem o Stage 3 a partir de `analysis_data` e (b) outros escritores podem clobberar no futuro.

---

## Opções (com trade-offs) — não implementar ainda

### A) Renderizar Stage 3 persistente a partir de `analysis_data` (mais barato, maior impacto visível)
Adicionar leitura de `analysisData.clinicalOutcomes` em `EstudoDetailSections` (já lê `molecularMechanisms`) e exibir o card de outcomes com p_value/effect_size/significance + badge de `anchored_mechanism`. Reusar `NtaiClinicalTab` ou um componente novo enxuto.
- **Prós:** o dado já está no banco e no shape correto; tela ganha rigor estatístico + proveniência sem mexer em edge function.
- **Contras:** muda UI persistente (precisa i18n + visual review).

### B) Blindar ownership nos demais escritores (`gemini-file-search`, `generate-triplets`)
Mover `gemini-file-search:2278` e `generate-triplets:1029` para passar por `mergeAnalysisData` (ou variantes simétricas com ownership do lado deles).
- **Prós:** elimina a bomba-relógio do re-rechain; fronteira de ownership cobre o pipeline inteiro.
- **Contras:** mexe em duas edge functions críticas; precisa decidir o que `gemini-file-search` "perdoa" do extract (hoje ele assume registro virgem). Risco de regressão silenciosa se a ordem real de algum cenário não for a que pressupomos.

### C) Renderizar `anchored_mechanism` como badge "ancorado em <nome>"
Pequeno ajuste em `NtaiClinicalTab` (e no componente persistente da opção A).
- **Prós:** torna o guarda-corpo visível ao curador — sem isso, o campo só serve para log.
- **Contras:** mínimos; só decidir copy/cor pt-BR.

### D) Nada agora, só monitorar
Aceitar que (a) Stage 3 só aparece no momento do processamento, (b) re-rechain pode clobberar.
- **Prós:** zero risco de regressão.
- **Contras:** o trabalho das ondas 2-A/B/C fica invisível ao usuário fora da janela de processamento, e o blindo do merge só cobre meio caminho.

### Recomendação minha (para você decidir)
A + C juntas (uma onda só de UI, sem tocar edge function) → resolve a percepção "não chegou na tela" com risco baixo. B fica para uma onda dedicada de blindagem do pipeline, com checklist de cenários de re-execução antes.
