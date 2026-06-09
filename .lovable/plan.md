## Verificações prévias (grep)

- `full_text` na Call 2 só é consumido em 4 pontos confirmados: schema (571-574), mapeamento (1327), e override/leitura pós-Call1 (1902, 1905-1910, 1934-1937). Linhas 2026 (`has_full_text`) e 2116/2214 leem `extractedData.full_text` **depois** do override da Call 1 — passam a refletir só Call 1 e ficam corretas sem mudança.
- Nenhum outro consumidor externo lê `full_text` direto do retorno da Call 2.
- A1 confirmado seguro.

Observação: o `extract-study-entities` (linhas 497-532) **já** relê `ingestion_stages` e bloqueia `processed` se `file_search.status === 'failed'` OU `parse_study.status === 'failed'`. Mas **não** trata `file_search` ausente como falha — esse é o A2 buraco 2 (alinhar critério).

---

## A1 — Call 1 = fonte única do `full_text`

**Arquivo:** `supabase/functions/gemini-file-search/index.ts`

```text
571-574  REMOVER bloco full_text do schema da Call 2
1327     REMOVER linha `full_text: extractedArgs.full_text || '',`
1900-1911  SUBSTITUIR override pós-Call-2 por: chamar acquireFullText, atribuir
           direto: extractedData.full_text = (call1.text || '').trim();
           Logar call1.error se vier vazio. Sem comparação com call2Text.
1933-1938  Manter condição `if (extractedData.full_text && length > 500)` —
           agora alimentada SÓ pela Call 1. `extractionMethod` permanece
           'gemini_full_text_extraction'.
```

Comentários do bloco (1891-1898) reescritos: Call 1 é fonte única; Call 2 não devolve mais `full_text`.

---

## A2 buraco 1 — `useVetGraphRAGQueue.ts:212-237` (`updateProcessedStudy`)

**Diff alvo:**

```text
ANTES do update, ler ingestion_stages:
  const { data: row } = await supabase
    .from('processed_studies')
    .select('ingestion_stages')
    .eq('id', studyId).maybeSingle();
  const stages = (row?.ingestion_stages as Record<string, any>) || {};
  const fs = stages.file_search;
  const anyFailed = Object.values(stages).some(s => s?.status === 'failed');
  const fsOk = fs?.status === 'ok' || fs?.status === 'degraded';

  // Se edge já marcou error → NÃO sobrescrever kanban_status.
  const updatePayload: any = { analysis_data: analysisData };
  if (!anyFailed && fsOk) updatePayload.kanban_status = 'processed';
  else updatePayload.kanban_status = 'error';
```

Sem `kanban_status` cego = 'processed'. Mata o overwrite silencioso do Spermine.

---

## A2 buraco 2 — `extract-study-entities/index.ts:506-508`

**Diff alvo (1 linha lógica):**

```diff
- const anyUpstreamFailed =
-   (refreshedFileSearch?.status === 'failed') ||
-   ((refreshedStages as any).parse_study?.status === 'failed');
+ const fsStatus = refreshedFileSearch?.status;
+ const fsBlocking = fsStatus !== 'ok' && fsStatus !== 'degraded'; // ausente OU failed
+ const anyUpstreamFailed =
+   fsBlocking ||
+   ((refreshedStages as any).parse_study?.status === 'failed');
```

Crash silencioso de upstream (sem gravar `ingestion_stages`) agora bloqueia `processed`.

---

## A2 buraco 3 — `useProcessingLogic.ts` catches gemini/vectorize

**Helper local (topo do arquivo ou inline):**

```ts
async function markStageFailed(supabase, studyId, stage, error_message) {
  const { data } = await supabase.from('processed_studies')
    .select('ingestion_stages').eq('id', studyId).maybeSingle();
  const stages = (data?.ingestion_stages as Record<string, any>) || {};
  stages[stage] = { status: 'failed', error_message, finished_at: new Date().toISOString() };
  await supabase.from('processed_studies')
    .update({ ingestion_stages: stages }).eq('id', studyId);
}
```

**Linha 149 (geminiError):** antes do `updatedQueue[index] = { stage:'error' ... }`, chamar `await markStageFailed(supabase, item.id, 'file_search', errorMsg)`.

**Linhas 173-180 (geminiData inválido):** idem, `markStageFailed(..., 'file_search', errorMsg)`.

**Linha 192-199 (vectorError + catch):** `markStageFailed(..., 'vectorize', err)`. Mantém comportamento atual de não derrubar a fila (vectorize não é crítico), mas grava o `failed` para o gate ler.

---

## Ordem de deploy

1. Editar 3 arquivos (sem migration nova).
2. Deploy edge functions: `gemini-file-search`, `extract-study-entities`.
3. Build front (A2#1, A2#3) sobe junto no preview.
4. **Sem backfill**. Re-extrair 2 estudos longos com baixo yield (dos 49 ≥1500 chars / ~1 nutra) só DEPOIS do deploy, manualmente, como teste de critério (yield = entidades/char).

## Fora deste patch

- Critério de candidato a backfill (yield).
- Backfill em si.
- Botão "Reprocessar pipeline" e bloco `ingestion_health` (Fases 3+4).

Confirma para aplicar?
