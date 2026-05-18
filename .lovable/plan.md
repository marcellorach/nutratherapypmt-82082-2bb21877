
## Contexto confirmado

- **Gêmeo digital, hybrid-recommendation, calculate-recommendation-confidence, breed-predisposition, lab-interpretation, pet-clinical-chat**: NÃO consomem vetores. Operam sobre KG (triplets/hierarchical_edges) e LLM puro. → **Zero risco de regressão clínica** nesta mudança.
- **Único consumidor real de vetor**: `document-chat` (chat RAG por estudo, área admin).
- **Pseudo-consumidor**: `clinical-analysis-pipeline.ts:1378` faz `ILIKE chunk_text` (texto, não vetor) só para mostrar excerpt — pode permanecer.

## Decisão arquitetural

**Embeddings = Google AI direto, gemini-embedding-001, 768d**, com `taskType` correto (`RETRIEVAL_DOCUMENT` na indexação, `RETRIEVAL_QUERY` na busca). Lovable AI Gateway não expõe `taskType`, então perderíamos ~10-15% de recall — não justifica.

**Chat LLM do document-chat = configurável via `useAIConfig`** (admin escolhe entre gemini-3.1-pro-preview, gemini-3-flash-preview, gpt-5, etc. via Lovable AI Gateway). Default: `google/gemini-3-flash-preview`.

## Mudanças

### 1. `supabase/functions/vectorize-study/index.ts`
- Garantir Google AI direto com `taskType: "RETRIEVAL_DOCUMENT"` e `outputDimensionality: 768` em cada chamada de embedding.
- Adicionar header `embedding_model_version = "gemini-embedding-001@768d"` no metadata do registro (coluna existente ou em `full_text_metadata.embedding_model`) para detectar mismatch futuro.

### 2. `supabase/functions/document-chat/index.ts`
- **Embeddings da query**: trocar Lovable AI Gateway (`text-embedding-004`) por Google AI direto com `taskType: "RETRIEVAL_QUERY"`, `outputDimensionality: 768`, modelo `gemini-embedding-001` — alinhado ao `vectorize-study`.
- **Chat LLM (geração da resposta)**: continuar via Lovable AI Gateway, mas ler o modelo de `useAIConfig` (campo `documentChatModel`, default `google/gemini-3-flash-preview`). Tratar erros 402/429.

### 3. `src/hooks/useAIConfig.ts` (ou config admin equivalente)
- Adicionar nova chave `documentChatModel` com dropdown na tela de Configurações de IA listando: gemini-3.1-pro-preview, gemini-3-flash-preview, gemini-2.5-pro, gemini-2.5-flash, gpt-5, gpt-5-mini. Persistir em `ai_configurations` (tabela já existe).

### 4. Backfill dos órfãos
- Endpoint `handleBackfillVectorize` em `SciImportSection.tsx` já existe; só ajustar para chamar `vectorize-study` com o novo `taskType` (transparente — o edge function cuida).
- Adicionar contagem de "órfãos por modelo desatualizado" (`full_text_metadata.embedding_model !== "gemini-embedding-001@768d"`) ao mesmo contador "Vetorizar pendentes (N)".

### 5. UX / i18n
- Renomear badge "Sem RAG" → "Sem trechos indexados" (`noChunksIndexed`).
- Tooltip atualizado: "Os trechos vetoriais (RAG) ainda não foram gerados. A curadoria continua disponível, mas o chat do estudo não terá precisão semântica até a vetorização concluir."
- Adicionar ao admin AI Config tela: descrição "Modelo usado para responder no chat do estudo individual (RAG)".
- Incrementar `I18N_VERSION` → `1.86.10`.

### 6. CHANGELOG + memória
- Entrada `[Unreleased] → Changed`: "Padronizado pipeline de embeddings em Google AI direto (gemini-embedding-001, 768d) com taskType RETRIEVAL_DOCUMENT/QUERY. document-chat agora usa o mesmo modelo do vectorize-study, eliminando incompatibilidade de vetores. Modelo do LLM do chat tornou-se configurável via Admin → Configurações de IA."
- Atualizar `mem://architecture/vectorization-is-pre-curation` com seção "Modelo canônico: gemini-embedding-001@768d via Google AI direto, taskType obrigatório".
- Rodar `npm run sync:changelog`.

## Validação pós-deploy

1. `supabase--curl_edge_functions` em `vectorize-study` com 1 study_id de teste — confirmar 768 dims salvos.
2. `supabase--curl_edge_functions` em `document-chat` com query simples — confirmar resposta com citações.
3. Verificar que badge "Sem trechos indexados" sumiu nos studies pós-backfill.
4. `supabase--read_query` para confirmar `count(*) FROM study_embeddings WHERE array_length(embedding,1) = 768` cresceu.

## Arquivos modificados

- `supabase/functions/vectorize-study/index.ts`
- `supabase/functions/document-chat/index.ts`
- `src/hooks/useAIConfig.ts` + tela de config admin
- `src/components/administrador/estudos/import/SciImportSection.tsx` (tooltip + contador)
- `src/components/administrador/estudos/cards/EstudoCard.tsx` (rename badge)
- `src/locales/pt/translation.json`, `src/locales/en/translation.json`
- `src/i18n.ts` (versão)
- `CHANGELOG.md`, `mem://architecture/vectorization-is-pre-curation`

## Fora de escopo (intencional)

- **Não tocar** em `clinical-analysis-pipeline`, `hybrid-recommendation`, gêmeo digital, `PatientKnowledgeSubgraph`, `breed-predisposition`, `lab-interpretation` — auditado, não usam vetores.
- Não migrar para Lovable AI Gateway nos embeddings (perda de `taskType`).
- Não mudar dimensionalidade (768 já é o padrão do projeto, evita re-vectorização em massa).
