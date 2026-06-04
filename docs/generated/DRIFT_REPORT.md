# DRIFT_GUARD REPORT

> **Gerado** em 2026-06-04 por `scripts/drift-guard.mjs` (`npm run drift:guard`).
> **WARN-only.** Não bloqueia build/auditoria. Humano reconcilia a superfície sinalizada.

## Resumo

- **Total de achados:** 70
- Por camada: {"A":59,"B":9,"D":2}

## Camadas

- **A** — vocabulário proibido sem mitigador em superfícies à mão
- **B** — ponteiros mortos na MATRIX (arquivo não existe)
- **C** — `implemented` com ponteiro stub (<20 LOC) — info
- **D** — conflito numérico doc × código (RC-013, RC-003)

## Achados

### [A] src/components/administrador/AboutSenexTab.tsx
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/components/administrador/AboutSenexTab.tsx:61 — O1["Hybrid retrieval<br/>Cypher (Neo4j) + pgvector (Supabase)<br/>(inspired by U-Retrieval, no top-down/bottom-up fusion)"]`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:114 — quote: 'The GRRA cycle (Generate-Review-Revise-Answer) leverages LLM latent knowledge to generate triplets, then verifies against grounded KG, achieving 87% error elimination in biomedical entity extr`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:159 — objective: 'Senex AI: Sistema híbrido de GraphRAG que combina MedGraphRAG (Triple Graph + U-Retrieval) com KGARevion (ciclo GRRA), adaptado para medicina veterinária com foco em LONGEVIDADE CANINA. Ob`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:164 — '4. GRRA Cycle (KGARevion) → Generate triplets → Review contra KG → Revise erros → Answer/Approve',`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:180 — description: 'Arquitetura híbrida combinando Triple Graph Construction (MedGraphRAG), GRRA Cycle (KGARevion), e TransE Embeddings para link prediction, com 5 camadas hierárquicas de entidades. Sistema`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:190 — { feature: '7. Validation Cycle', values: ['Not explicit', 'GRRA cycle', 'GRRA + Human-in-Loop + GRADE scoring + Auto-approve thresholds'] },`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:190 — { feature: '7. Validation Cycle', values: ['Not explicit', 'GRRA cycle', 'GRRA + Human-in-Loop + GRADE scoring + Auto-approve thresholds'] },`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:247 — │ PHASE 4: GRRA VALIDATION CYCLE (KGARevion)                                      │`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:406 — foundation: 'Sistema híbrido fundamentado em quatro pilares: (1) MedGraphRAG para construção de grafos hierárquicos e U-Retrieval, (2) KGARevion para validação de triplets com ciclo GRRA, (3) TransE p`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:443 — keyFindings: 'Ciclo GRRA (Generate-Review-Revise-Answer) elimina 87% dos erros de extração ao validar triplets contra Knowledge Graph existente.'`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:109 — quote: 'Medical Graph RAG enhances LLM capabilities through Triple Graph Construction (Document→Chunk→Entity→Mechanism) and bidirectional U-Retrieval, achieving 40% reduction in hallucinations for med`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:159 — objective: 'Senex AI: Sistema híbrido de GraphRAG que combina MedGraphRAG (Triple Graph + U-Retrieval) com KGARevion (ciclo GRRA), adaptado para medicina veterinária com foco em LONGEVIDADE CANINA. Ob`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:166 — '6. U-Retrieval → Top-down (Graph Cypher) + Bottom-up (Vector Search)',`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:189 — { feature: '6. Retrieval Method', values: ['U-Retrieval (Top+Bottom)', 'KG-grounded search', 'Hybrid U-Retrieval + KG Validation + Confidence Scoring'] },`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:189 — { feature: '6. Retrieval Method', values: ['U-Retrieval (Top+Bottom)', 'KG-grounded search', 'Hybrid U-Retrieval + KG Validation + Confidence Scoring'] },`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:406 — foundation: 'Sistema híbrido fundamentado em quatro pilares: (1) MedGraphRAG para construção de grafos hierárquicos e U-Retrieval, (2) KGARevion para validação de triplets com ciclo GRRA, (3) TransE p`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:435 — keyFindings: 'Triple Graph Construction em 4 níveis (Doc→Chunk→Entity→Mechanism) + U-Retrieval bidirectional reduz alucinações em 40% para QA médico.'`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:138 — source: 'TransE Link Prediction (Bordes et al., 2013) - NeurIPS',`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:139 — quote: 'TransE models relationships as translations in embedding space: h + r ≈ t, enabling prediction of missing links in knowledge graphs with high accuracy for structured biomedical data.',`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:168 — '8. Auto-Discovery → TransE Link Prediction sugere pathways novos para revisão veterinária'`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:180 — description: 'Arquitetura híbrida combinando Triple Graph Construction (MedGraphRAG), GRRA Cycle (KGARevion), e TransE Embeddings para link prediction, com 5 camadas hierárquicas de entidades. Sistema`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:195 — { feature: '12. Auto-Discovery', values: ['Not covered', 'Not covered', '✅ TransE Link Prediction para pathways novos'] }`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:366 — name: '3. Pathway Discovery Score (TransE)',`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:387 — TransE: ||h + r - t|| = 0.03 -> normalized 0.85`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:406 — foundation: 'Sistema híbrido fundamentado em quatro pilares: (1) MedGraphRAG para construção de grafos hierárquicos e U-Retrieval, (2) KGARevion para validação de triplets com ciclo GRRA, (3) TransE p`

### [A] src/data/admin-tabs-info.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info.ts:483 — keyFindings: 'TransE modela relações como translações no espaço de embeddings (h + r ≈ t), permitindo link prediction com alta precisão.'`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:275 — pt: 'O Senex AI é um motor híbrido de GraphRAG dedicado à longevidade canina. **Implementado hoje:** (1) Triple Graph Construction inspirada em MedGraphRAG (Document → Chunk → Entity → Mechanism); (2)`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:276 — en: 'Senex AI is a hybrid GraphRAG engine dedicated to canine longevity. **Implemented today:** (1) Triple Graph Construction inspired by MedGraphRAG (Document → Chunk → Entity → Mechanism); (2) tripl`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:282 — { pt: '4. Validação de triplets → Generate (Gemini) + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL para o restante. Inspirado no GRRA do KGARevion, **sem** modelo Review independente ne`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:282 — { pt: '4. Validação de triplets → Generate (Gemini) + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL para o restante. Inspirado no GRRA do KGARevion, **sem** modelo Review independente ne`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:316 — { feature: { pt: '7. Ciclo de Validação', en: '7. Validation Cycle' }, values: [ { pt: 'Não explícito', en: 'Not explicit' }, { pt: 'Ciclo GRRA', en: 'GRRA cycle' }, { pt: 'Generate + scoring heurísti`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:316 — { feature: { pt: '7. Ciclo de Validação', en: '7. Validation Cycle' }, values: [ { pt: 'Não explícito', en: 'Not explicit' }, { pt: 'Ciclo GRRA', en: 'GRRA cycle' }, { pt: 'Generate + scoring heurísti`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:404 — pt: 'Sistema híbrido fundamentado em quatro pilares — separando o que **roda hoje** do que é **apenas inspiração científica**. **Implementado:** (1) Triple Graph Construction hierárquica L0–L4 (inspir`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:427 — { pt: 'Ciclo GRRA completo com modelo Reviewer independente e etapa Revise (hoje: scoring heurístico + HITL)', en: 'Full GRRA cycle with independent Reviewer model and Revise step (today: heuristic sc`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:427 — { pt: 'Ciclo GRRA completo com modelo Reviewer independente e etapa Revise (hoje: scoring heurístico + HITL)', en: 'Full GRRA cycle with independent Reviewer model and Revise step (today: heuristic sc`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:433 — { title: { pt: 'KGARevion: revisão aumentada por KG para extração biomédica', en: 'KGARevion: Knowledge Graph-Augmented Revision for Biomedical Information Extraction' }, authors: 'Su et al.', year: 2`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "GRRA" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:433 — { title: { pt: 'KGARevion: revisão aumentada por KG para extração biomédica', en: 'KGARevion: Knowledge Graph-Augmented Revision for Biomedical Information Extraction' }, authors: 'Su et al.', year: 2`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:212 — en: 'Inspiration paper: Triple Graph Construction (Document → Chunk → Entity → Mechanism) combined with bidirectional U-Retrieval reports ~40% hallucination reduction on medical QA. Senex AI adopts th`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:284 — { pt: '6. Recuperação híbrida → Cypher (Neo4j) + pgvector (Supabase) sobre o KG do paciente. Inspirada em U-Retrieval, **sem** fusão top-down/bottom-up — implementada em `graph-rag-search` e `hybrid-r`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:284 — { pt: '6. Recuperação híbrida → Cypher (Neo4j) + pgvector (Supabase) sobre o KG do paciente. Inspirada em U-Retrieval, **sem** fusão top-down/bottom-up — implementada em `graph-rag-search` e `hybrid-r`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:315 — { feature: { pt: '6. Método de Retrieval', en: '6. Retrieval Method' }, values: [ { pt: 'U-Retrieval (top + bottom)', en: 'U-Retrieval (top + bottom)' }, { pt: 'Busca grounded no KG', en: 'KG-grounded`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:315 — { feature: { pt: '6. Método de Retrieval', en: '6. Retrieval Method' }, values: [ { pt: 'U-Retrieval (top + bottom)', en: 'U-Retrieval (top + bottom)' }, { pt: 'Busca grounded no KG', en: 'KG-grounded`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:426 — { pt: 'Recuperação U-Retrieval bidirecional real (top-down + bottom-up com fusão hierárquica) — hoje recuperação é Cypher + pgvector concatenados', en: 'Real bidirectional U-Retrieval (top-down + bott`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:426 — { pt: 'Recuperação U-Retrieval bidirecional real (top-down + bottom-up com fusão hierárquica) — hoje recuperação é Cypher + pgvector concatenados', en: 'Real bidirectional U-Retrieval (top-down + bott`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:432 — { title: { pt: 'MedGraphRAG: rumo a LLMs médicos seguros via RAG com grafos', en: 'MedGraphRAG: Towards Safe Medical LLM via Graph Retrieval-Augmented Generation' }, authors: 'Wu et al.', year: 2024, `

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:432 — { title: { pt: 'MedGraphRAG: rumo a LLMs médicos seguros via RAG com grafos', en: 'MedGraphRAG: Towards Safe Medical LLM via Graph Retrieval-Augmented Generation' }, authors: 'Wu et al.', year: 2024, `

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:434 — { title: { pt: 'Translating Embeddings para dados multi-relacionais', en: 'Translating Embeddings for Modeling Multi-relational Data' }, authors: 'Bordes et al.', year: 2013, journal: { pt: 'NeurIPS',`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:434 — { title: { pt: 'Translating Embeddings para dados multi-relacionais', en: 'Translating Embeddings for Modeling Multi-relational Data' }, authors: 'Bordes et al.', year: 2013, journal: { pt: 'NeurIPS',`

### [A] src/data/admin-tabs-info-bilingual.ts
- **Severidade:** warn
- Termo "TransE" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `src/data/admin-tabs-info-bilingual.ts:456 — '[Paper] TransE (Bordes et al., NeurIPS 2013) — https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html',`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:37 — 7. [U-Retrieval: Multi-Hop GraphRAG](#u-retrieval-multi-hop-graphrag)`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:37 — 7. [U-Retrieval: Multi-Hop GraphRAG](#u-retrieval-multi-hop-graphrag)`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:90 — - **Contribuição**: Propõe **U-Retrieval** (entity extraction → graph query → vector search → synthesis)`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:130 — GRS[graph-rag-search<br/>U-Retrieval Hybrid]`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:428 — **Responsabilidade**: Implementar U-Retrieval (entity extraction → graph query → vector search → synthesis).`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:569 — ## 🔍 U-Retrieval: Multi-Hop GraphRAG`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:571 — ### O Que É U-Retrieval?`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:573 — **U-Retrieval** é uma técnica proposta no paper **MedGraphRAG** (2024) que combina:`

### [A] docs/GRAPHRAG_ARCHITECTURE.md
- **Severidade:** warn
- Termo "U-Retrieval" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/GRAPHRAG_ARCHITECTURE.md:818 — - [ ] Implementar U-Retrieval completo:`

### [A] docs/STANFORD_DEMO.md
- **Severidade:** warn
- Termo "dados reais" sem mitigador (inspiração/planned/sintético) no parágrafo.
- Evidência: `docs/STANFORD_DEMO.md:1079 — 2. **Implementar Modelos Básicos**: Regressão linear/logística com dados reais`

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "GRRA cycle (Generate → Review → Revise → Answer)": caminho não existe → around

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "GRRA cycle (Generate → Review → Revise → Answer)": caminho não existe → heuristic

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "GRRA cycle (Generate → Review → Revise → Answer)": caminho não existe → thresholds

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "GRRA cycle (Generate → Review → Revise → Answer)": caminho não existe → independent

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "GRRA cycle (Generate → Review → Revise → Answer)": caminho não existe → Reviewer

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "GRRA cycle (Generate → Review → Revise → Answer)": caminho não existe → model)

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "Honest-failure abstain envelope (3 buckets)": caminho não existe → callers

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "validation_status + abstained telemetry": caminho não existe → ai_task_invocations

### [B] ARCHITECTURE_LIVE.MATRIX
- **Severidade:** warn
- Ponteiro morto para "validation_status + abstained telemetry": caminho não existe → callers

### [D] CORE_RULES.md × código
- **Severidade:** info
- Conflito numérico em auto-approve (RC-013) — doc: n/d em CORE_RULES.md · código: extractionConfidence >= 0.85 AND kgMatchScore >= 0.5

### [D] CORE_RULES.md × código
- **Severidade:** info
- Conflito numérico em RC-003 translational modulator (×0.7) — doc: n/d em CORE_RULES.md · código: referenciado em src/components/administrador/tags/ScoreCriteriaPopover.tsx

## Conflitos numéricos rastreados

- **auto-approve (RC-013)** — doc: `n/d em CORE_RULES.md` · código: `extractionConfidence >= 0.85 AND kgMatchScore >= 0.5`
- **RC-003 translational modulator (×0.7)** — doc: `n/d em CORE_RULES.md` · código: `referenciado em src/components/administrador/tags/ScoreCriteriaPopover.tsx`

---
Regerar: `npm run drift:guard`.
