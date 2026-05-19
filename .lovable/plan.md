## Diagnóstico

### (a) Por que os cards variam de visual?
Os 5 prints **não são variantes de extração diferentes** — todos os cards são renderizados pelo mesmo `EstudoCard.tsx`. O que muda é **o estado dos dados** de cada estudo:

| Card no print | nutra/cond em `analysis_data` | triplets em `triplet_extractions` | embeddings | Resultado visual |
|---|---|---|---|---|
| Spermidine (foto 1) | **0 / 0** | 14 | 0 | só abstract + "Sem trechos indexados" |
| Vet geroscience (foto 1) | **0 / 0** | 23 | 0 | idem |
| Senolytic LY-D6/2 (foto 2) | 4 / 3 | 33 | 0 | tem "Análise Senex AI" + "Sem trechos indexados" |
| Tramiprosate (foto 3) | 1 / 1 | 26 | 3 | tem análise + "RAG: 3" |
| CoQ10 (foto 4) | 1 / 2 | 17 | 9 | análise + "RAG: 9" |
| AAHA Diabetes (foto 5) | 8 / 4 | 78 | 4 | análise rica + "RAG: 4" |

Confirmado no DB (`SELECT … FROM processed_studies …`). Ou seja:
- Os badges (`RAG: N` vs `Sem trechos indexados`) refletem fielmente `embeddings_count` de cada estudo. Quem nunca foi vetorizado mostra o aviso amarelo (comportamento correto introduzido na Etapa 2 da governança).
- O bloco "Análise Senex AI" e a linha de stats (`X Entidades · Y Triplets · …`) só aparece quando `analysis_data.extractedNutraceuticals` ou `extractedConditions` têm itens. Para Spermidine e Vet Geroscience, esses arrays vieram **vazios** do Stage 1 do `extract-study-entities`, mesmo havendo 14 e 23 triplets válidos (com `subject_type='Nutraceutical'` e `object_type='Condition'`) em `triplet_extractions`.

**Causa-raiz:** o pipeline grava `extractedNutraceuticals/extractedConditions` a partir do **Stage 1** (extração específica de "nutraceuticals/conditions" via LLM). Stage 1 às vezes falha em identificar entidades que Stage 2/3 (geração de triplets) captura corretamente. Resultado: card "nu" mesmo com triplets ricos.

### (b) Por que faltam infos no modal (fotos 6, 7, 8)?
Mesma causa-raiz, propagada para o modal:
- **Foto 6 "Visão Geral"**: lê `analysis_data.study_summary.summary` e `description`. Quando vazio → "Awaiting processing". Quality/Relevance/Novelty vêm de `analysis_data.studyAssessment` (que Stage 3 escreve só quando bem-sucedido).
- **Foto 7 "Análise IA"**: `ExtractedDataVisualization.tsx:170` checa `hasExpandedData` lendo `study_population`, `structured_dosages`, `biomarkers`, `side_effects`, `contraindications`, `drug_interactions`, `synergies` — todos campos do Stage 3 (`analysis_data`). Se Stage 3 não persistiu, mostra "Dados expandidos não disponíveis".
- **Foto 8 "Condições"**: funciona porque lê direto de `triplet_extractions` (mostra 14 relações para Spermidine — exatamente o que o card deveria refletir).

A "correção anterior" que você lembra funcionou para estudos cujo Stage 1 + Stage 3 rodaram com sucesso. Spermidine e Vet Geroscience são casos em que Stage 1/3 falharam silenciosamente apesar de Stage 2 ter gerado triplets bons.

---

## Plano de correção

### Etapa 1 — Backfill imediato dos 2 estudos afetados
Derivar `extractedNutraceuticals` e `extractedConditions` a partir dos triplets existentes para Spermidine e Vet Geroscience. Migração SQL:

```sql
UPDATE processed_studies ps
SET analysis_data = ps.analysis_data
  || jsonb_build_object(
       'extractedNutraceuticals',
         (SELECT jsonb_agg(DISTINCT jsonb_build_object('name', subject_name, 'confidence', 3))
          FROM triplet_extractions
          WHERE study_id = ps.id AND subject_type IN ('Nutraceutical','Compound')),
       'extractedConditions',
         (SELECT jsonb_agg(DISTINCT jsonb_build_object('name', object_name, 'confidence', 3))
          FROM triplet_extractions
          WHERE study_id = ps.id AND object_type IN ('Condition','Disease','Phenotype'))
     )
WHERE ps.id IN ('83592b04-…','0d0d9135-…')
  AND ( COALESCE(jsonb_array_length(ps.analysis_data->'extractedNutraceuticals'),0) = 0
     OR COALESCE(jsonb_array_length(ps.analysis_data->'extractedConditions'),0) = 0 );
```

Resultado esperado: cards de Spermidine e Vet Geroscience passam a mostrar a faixa "Análise Senex AI" e a linha de stats, igual aos demais. O badge "Sem trechos indexados" continua (até que sejam vetorizados).

### Etapa 2 — Tornar a derivação automática no pipeline (correção definitiva)
No `supabase/functions/extract-study-entities/index.ts` (linha ~552, bloco `frontendData`), antes do `UPDATE processed_studies`:
1. Se `extractedNutraceuticals` veio vazio do Stage 1, popular a partir dos triplets recém-inseridos (`triplets` array já está no escopo da função). Idem para `extractedConditions`.
2. Garantir que o `kanban_status` só vire `processed` quando pelo menos `extractedNutraceuticals` OU `extractedConditions` tiver itens (evita propagar estudo "nu" para a fila de curadoria).

Isso elimina a divergência na origem — não importa se Stage 1 falhar, Stage 2 sempre repopula a vitrine.

### Etapa 3 — Fallback no modal "Análise IA" (defensivo)
`ExtractedDataVisualization.tsx:170` — quando `hasExpandedData=false`, em vez de mostrar só "Dados expandidos não disponíveis", buscar uma derivação mínima a partir de `triplet_extractions`:
- Mostrar lista de compostos × condições com `predicate` agregado.
- Mensagem secundária: "Resumo derivado dos triplets — Stage 3 (dosagens/biomarcadores) ainda não disponível. Clique em Reprocessar para detalhes completos."

Assim o modal nunca fica vazio se há triplets aprovados.

### Etapa 4 — Atualização do briefing
- Entrada em `CHANGELOG.md` `[Unreleased]` → `Fixed`: "Cards de curadoria e modal de detalhes agora derivam entidades de `triplet_extractions` quando Stage 1 falha".
- `npm run sync:changelog`.

### Fora de escopo (já discutido)
- Re-vetorização em massa para popular embeddings dos estudos com badge "Sem trechos indexados" — você decidiu não fazer (smoke test passou, é débito documentado).

---

## Arquivos impactados
- `supabase/migrations/<timestamp>_backfill_analysis_data_from_triplets.sql` (novo)
- `supabase/functions/extract-study-entities/index.ts` (~linha 552-598)
- `src/components/administrador/estudos/visualization/ExtractedDataVisualization.tsx` (~linha 151-180)
- `CHANGELOG.md`

## Como validar
1. Após Etapa 1: recarregar `/administrador → Estudos → Curadoria`. Os 2 cards "nus" devem mostrar Spermidine/Spermine/Putrescine como nutracêuticos e Cancer/Vascular Disease/All-cause mortality como condições, com `14` e `23` triplets na linha de stats.
2. Abrir modal do Spermidine → "Análise IA" deve mostrar lista derivada dos triplets (não mais "Dados expandidos não disponíveis").
3. Próximos uploads testados em isolado: forçar Stage 1 a falhar (mock) e confirmar que Stage 2 popula as listas via fallback.
