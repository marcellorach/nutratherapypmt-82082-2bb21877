## Fases 1+2 — Ingestão robusta com gate qualitativo + truncamento relativo

### 1. Migration
- `processed_studies.ingestion_stages jsonb NOT NULL DEFAULT '{}'::jsonb` + índice GIN.
- Chaves esperadas: `parse_study`, `file_search`, `extract_entities`, `vectorize`.
- Cada chave: `{ status: 'ok'|'degraded'|'failed'|'skipped', error_message?, error_code?, model?, finished_at, ...metrics }`.

### 2. `parse-study/index.ts` — grava o próprio estágio
Acrescentar `ingestion_stages.parse_study = { status:'ok', sections_count, tables_count, total_chars, finished_at }` no mesmo `update` final. `total_chars` = soma de `element.text.length`, usado depois como denominador do `truncation_ratio`. Mantém `analysis_data`/`kanban_status='parsed'`. Try/catch externo grava `status:'failed'` antes de propagar.

### 3. `gemini-file-search/index.ts` — split em 2 calls + gate qualitativo
Refatora o caminho atual (1 call monolítica com schema de 23 props):

```text
Call 1  acquireFullText()    gemini-2.5-flash    schema MINIMAL { full_text: string }
Call 2  extractClinical()    gemini-2.5-pro      schema atual (22 props clínicas, sem full_text)
                             fallback model:     gemini-3-pro-preview
```

Pipeline interno:
1. Chama Call 1. Se exceção OU `full_text` ausente/vazio → grava `file_search = { status:'failed', stage:'call1', error_message, finished_at }` e dá `throw`.
2. Grava `full_text_content` em `processed_studies`. Descarta quaisquer metadados que o Gemini emita na Call 1 (não escreve em title/authors/year/abstract/doi — esses ficam com `parse-study`). Se houver metadados retornados, registra em `file_search.meta_hint` só para auditoria.
3. Lê `ingestion_stages.parse_study.total_chars`. Calcula `truncation_ratio = chars_full_text / max(total_chars, 1)`. Se `parse_study` ausente, `truncation_ratio = null` (não dispara degraded por truncamento).
4. Chama Call 2 com `gemini-2.5-pro`; em erro 4xx/5xx, retry único com `gemini-3-pro-preview`.
5. Avalia entidades: `entitiesNonEmpty = (nutraceuticals?.length || conditions?.length || mechanisms?.length || biological_effects?.length) > 0`.
6. Decide status:
   - `entitiesNonEmpty === false` → `degraded` (reason: `entities_empty`).
   - `truncation_ratio !== null && truncation_ratio < 0.30 && parse_study.sections_count >= 3` → `degraded` (reason: `truncation_suspected`).
   - caso contrário → `ok`.
7. Grava `file_search = { status, reason?, chars: chars_full_text, truncation_ratio, sections_count_ref, model_call1, model_call2, finished_at }`. `chars` e `truncation_ratio` são **informativos**, nunca gatilho isolado.

Todo o corpo da função fica dentro de um try/catch externo que garante `file_search.status='failed'` no banco antes de qualquer `throw` para o orquestrador.

### 4. `extract-study-entities/index.ts` — respeita o gate
- Lê `ingestion_stages.file_search.status` no início.
- `failed` → retorna 200 com `{ skipped:true }`, grava `extract_entities = { status:'skipped', reason:'file_search_failed' }`. Não chama LLM.
- `degraded` → roda Stages 1/2/3 normais, mas marca `extract_entities = { status:'ok', confidence:'degraded', reason: file_search.reason }`.
- `ok` → fluxo atual, grava `extract_entities = { status:'ok', confidence:'normal' }`.
- Mantém o disparo de `vectorize-study` via `EdgeRuntime.waitUntil` (memória de arquitetura).

### 5. `vectorize-study/index.ts`
Acrescenta `update ingestion_stages.vectorize = { status:'ok'|'failed', chunks_count, finished_at }`. Sem mudança de lógica de chunking/embedding.

### 6. Orquestrador front — captura + bloqueio do `processed`
Arquivos: `src/components/administrador/estudos/analysis/NtaiProcessingSection.tsx` (pipeline real) + `src/hooks/ntai/useProcessingLogic.*`.

- Cada `supabase.functions.invoke(<stage>)` envelopado em try/catch. Se a função não retornou OK, faz `update processed_studies set ingestion_stages = jsonb_set(..., '{<stage>}', { status:'failed', error_message, finished_at })`.
- Antes de marcar `kanban_status='processed'`, relê `ingestion_stages` e verifica `parse_study/file_search/extract_entities/vectorize`. Se algum for `failed` → seta `kanban_status='error'`, **nunca** `processed`. Mata o padrão Spermine (processado sem erro registrado).
- Toast usa o `reason` real do banco em vez de mensagem genérica.

### 7. UI — 2 superfícies de badge
**(a) `src/components/administrador/estudos/library/StudiesLibraryTab.tsx`:** card mostra badge derivado de `ingestion_stages.file_search.status`:
- `failed` → badge vermelho "Extração falhou"
- `degraded` → badge âmbar "Extração degradada"
- `ok`/ausente → sem badge

**(b) `src/components/administrador/estudos/curation/StudyTripletCuration.tsx`:** banner no topo quando `file_search.status !== 'ok'`:
- `degraded` âmbar: "Extração degradada (motivo: {reason}, chars={chars}, ratio={truncation_ratio?.toFixed(2)}). Triplets abaixo derivam de extração incompleta — aprove com cautela."
- `failed` vermelho: "Extração falhou: {error_message}. Triplets abaixo (se houver) não devem ser aprovados."
- Chip discreto "extração degradada" por linha quando estudo está `degraded`. Sem coluna nova em `triplet_extractions` — herda do estudo.

### 8. i18n + changelog + versão
- `src/i18n.ts`: bump `I18N_VERSION` (cache-bust obrigatório).
- `src/locales/{pt,en}/translation.json`: chaves novas em `studies.ingestion.*` (`badge.failed`, `badge.degraded`, `banner.failed`, `banner.degraded`, `chip.degraded`, `reasons.entities_empty`, `reasons.truncation_suspected`, `reasons.file_search_failed`).
- `CHANGELOG.md` [Unreleased] → `Fixed` + `Changed`, com `<!-- area: ingestion · status: fixed · i18n: yes -->`.
- Rodar `npm run sync:changelog` (regenera `projectChangelog.generated.ts` + `.lovable/CONTEXT.md`).

### 9. Fora de escopo (Fases 3+4, próximo turno)
- Baseline antes de qualquer backfill (~10 estudos `structured_data_enhanced` / `full_text` vazio).
- Botão "Reprocessar pipeline" nos cards `failed`/`degraded`.
- Bloco `ingestion_health` em `generate-audit`.
- Sem mudança em `generate-triplets`.

### Arquivos tocados
- Migration nova (ingestion_stages + GIN).
- `supabase/functions/parse-study/index.ts`
- `supabase/functions/gemini-file-search/index.ts`
- `supabase/functions/extract-study-entities/index.ts`
- `supabase/functions/vectorize-study/index.ts`
- `src/components/administrador/estudos/analysis/NtaiProcessingSection.tsx`
- `src/hooks/ntai/useProcessingLogic.*`
- `src/components/administrador/estudos/curation/StudyTripletCuration.tsx`
- `src/components/administrador/estudos/library/StudiesLibraryTab.tsx`
- `src/i18n.ts` + `src/locales/{pt,en}/translation.json`
- `CHANGELOG.md` (regenera `src/data/projectChangelog.generated.ts` e `.lovable/CONTEXT.md` via script)