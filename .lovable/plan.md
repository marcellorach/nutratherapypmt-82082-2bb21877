## Contexto

**a) "Mismatch de modelos" — o que era e foi resolvido?**

No estado anterior, `vectorize-study` (indexação) usava **Google AI direto com `gemini-embedding-001` (768d)**, enquanto `document-chat` (busca RAG) usava o **gateway Lovable AI com um modelo de embedding diferente/deprecado**. Vetores gerados por modelos diferentes vivem em espaços vetoriais incompatíveis — comparar cosseno entre eles produz scores quase aleatórios (~10–30% de recall útil em vez de 80–90%).

**Sim, foi 100% endereçado no último ajuste:**
- `vectorize-study` → Google AI direto, `gemini-embedding-001`, 768d, `taskType: RETRIEVAL_DOCUMENT`
- `document-chat` → Google AI direto, `gemini-embedding-001`, 768d, `taskType: RETRIEVAL_QUERY`
- Metadata `embedding_model_version: "gemini-embedding-001@768d"` gravada em `processed_studies.full_text_metadata` para detectar mismatches futuros

Único débito pendente: estudos vetorizados **antes** do ajuste podem ter vetores incompatíveis. Como o pipeline atual exige re-vetorização para `RETRIEVAL_DOCUMENT` task type correto, faz sentido oferecer um "re-vetorizar tudo" (mas isso é opcional — não está no escopo desta tarefa).

---

## Plano

### (b) Badge da Biblioteca = estudos curados (não triplets)

Hoje `libraryCount` em `SciImportSection.tsx` conta estudos que têm **pelo menos 1 triplet** com `curation_status in ('approved','rejected')`. Isso conta estudos parcialmente revisados como "biblioteca", o que diverge do que a própria aba Biblioteca exibe (`kanban_status = 'approved'`).

**Mudança:** trocar a contagem por uma query direta em `processed_studies`:

```ts
const { count: libCount } = await supabase
  .from('processed_studies')
  .select('*', { count: 'exact', head: true })
  .is('deleted_at', null)
  .eq('kanban_status', 'approved');
setLibraryCount(libCount ?? 0);
```

Critério único e canônico: **`kanban_status = 'approved'`** (status final do workflow de curadoria definido em `useStudyApprovalWorkflow`). Alinha o badge com o que a aba Biblioteca mostra como "curated".

### (c) Garantir polling correto a cada 15s

O `setInterval` de 15s já existe (linha 121). Mas há **dois bugs reais** que fazem o badge "travar" em valores antigos:

1. **Limite de 1000 linhas do Supabase:** a query `select study_id, curation_status from triplet_extractions` (linha 81-83) carrega **todos** os triplets sem paginação. Com muitos triplets, o cap de 1000 é atingido silenciosamente e os contadores ficam congelados/errados. Solução: usar contadores agregados via `count: 'exact', head: true` em vez de carregar linhas.

2. **`pendingCurationCount` também depende do mesmo loop:** vou substituir as 3 contagens (`pendingCurationCount`, `libraryCount`, `missingVectorCount`) por queries `count`-only baseadas em `processed_studies.kanban_status`:
   - `aiQueueCount`: `kanban_status='new'` e sem triplets → manter lógica atual mas com `count: 'exact'` em vez de listar IDs
   - `pendingCurationCount`: `kanban_status in ('parsed','review','processed')` AND `deleted_at IS NULL`
   - `libraryCount`: `kanban_status='approved'` AND `deleted_at IS NULL`
   - `missingVectorCount`: manter via RPC ou query agregada (não listar)

3. **Cache do React Query / refetch:** confirmar que a aba Biblioteca (`StudiesLibraryTab`) também faz refetch (não é o badge em si, mas para garantir consistência visual após aprovação). Verificar se há `staleTime` exagerado.

### Arquivos a modificar

- `src/components/administrador/estudos/import/SciImportSection.tsx` — reescrever bloco `fetchIndicators` (linhas 50-118) para usar contagens agregadas baseadas em `kanban_status`.
- `CHANGELOG.md` — entrada em `[Unreleased] → Changed`/`Fixed`.
- Rodar `npm run sync:changelog` ao final.

### Fora de escopo

- Re-vetorização de estudos antigos (modelo legacy) — pode ser tarefa separada se você quiser.
- Mudanças em `StudiesLibraryTab.tsx` (já usa o critério correto `kanban_status='approved'`).
- Alterações em edge functions (mismatch já resolvido).

---

## Detalhes técnicos resumidos

| Badge | Critério novo | Query |
|---|---|---|
| AI Queue | `kanban_status='new'` sem triplets | `count` em `processed_studies` + `not.in` join |
| Curation | `kanban_status in ('parsed','review','processed')` | `count: 'exact', head: true` |
| Library | `kanban_status='approved'` | `count: 'exact', head: true` |
| Missing vectors | triplets sem embeddings | RPC ou count agregado |

Todas as queries com `head: true` retornam apenas o número (sem payload), evitando o teto de 1000 linhas e mantendo o polling de 15s consistente.