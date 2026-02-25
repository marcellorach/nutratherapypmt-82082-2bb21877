

## Plano: Corrigir Scoring de Estudos (Quality, Relevance, Novelty)

### Diagnóstico do Problema

Investigação completa revelou que os scores **sempre mostram 3.0** por uma cadeia de falhas:

1. **A LLM extrai os scores corretamente** — o prompt no `gemini-file-search` pede `quality_score`, `relevance_score`, `novelty_score` dentro de `study_assessment` (e os marca como `required`)
2. **Mas os scores são descartados** — a interface `ExtractedStudyData` (linha 67-146) **não inclui** `study_assessment`, então o mapeamento (linhas 1227-1332) ignora esses dados
3. **`analysis_data` nunca recebe os scores** — o spread `...extractedData` na linha 1835 não contém `study_assessment`
4. **`study_extractions` também não salva** — o objeto `extractionData` (linhas 1935-1980) omite `study_assessment`
5. **O fallback é 3.0** — Em `EstudoDetailDialog.tsx` (linha 138): `studyAssessment.quality_score || 3.0`

Dados reais no banco confirmam: `processed_studies.analysis_data` contém `"studyAssessment": {}` e `"qualityScore": 3`. Enquanto `study_extractions.extracted_data.study_assessment` tem `quality_score: 4` mas `relevance_score: null`, `novelty_score: null`.

### Solução em 3 Partes

#### Parte 1: Edge Function `gemini-file-search` — Capturar os scores

**Arquivo: `supabase/functions/gemini-file-search/index.ts`**

1. Adicionar `study_assessment` à interface `ExtractedStudyData`:
```typescript
study_assessment?: {
  methodology_type?: string;
  sample_size?: number;
  randomization?: boolean;
  blinding?: string;
  placebo_controlled?: boolean;
  statistical_significance?: boolean;
  follow_up_duration?: string;
  species_tested?: string[];
  quality_score?: number;
  relevance_score?: number;
  novelty_score?: number;
};
study_summary?: {
  objective?: string;
  key_findings?: string[];
  clinical_implications?: string;
  limitations?: string[];
};
```

2. No mapeamento de `extractedArgs` → `extractedData` (após linha ~1332), adicionar:
```typescript
study_assessment: extractedArgs.study_assessment || {},
study_summary: extractedArgs.study_summary || {},
```

3. No objeto `analysisData` (linha ~1835), adicionar explicitamente:
```typescript
studyAssessment: extractedData.study_assessment || {},
study_assessment: extractedData.study_assessment || {},
studySummary: extractedData.study_summary || {},
study_summary: extractedData.study_summary || {},
qualityScore: extractedData.study_assessment?.quality_score || 0,
relevanceScore: extractedData.study_assessment?.relevance_score || 0,
noveltyScore: extractedData.study_assessment?.novelty_score || 0,
```

4. No `extractionData` (para `study_extractions`), adicionar:
```typescript
study_assessment: extractedData.study_assessment || {},
study_summary: extractedData.study_summary || {},
```

#### Parte 2: Frontend — Leitura robusta dos scores

**Arquivo: `src/components/administrador/dialogs/EstudoDetailDialog.tsx`**

Melhorar a lógica de resolução dos scores (linhas 134-141) para buscar de múltiplas fontes possíveis:
```typescript
const studyScores = {
  qualityScore: 
    studyAssessment.quality_score || 
    analysisData.qualityScore || 
    analysisData.study_assessment?.quality_score || 
    0,
  relevanceScore: 
    studyAssessment.relevance_score || 
    analysisData.relevanceScore || 
    analysisData.study_assessment?.relevance_score || 
    0,
  noveltyScore: 
    studyAssessment.novelty_score || 
    analysisData.noveltyScore || 
    analysisData.study_assessment?.novelty_score || 
    0,
};
```

Mudar fallback de `3.0` para `0` — assim fica explícito quando não há score real (em vez de parecer que foi avaliado como "médio").

#### Parte 3: Remover mock em `scoring.ts`

**Arquivo: `src/services/ntai/scoring.ts`**

Substituir as funções mock que retornam `3.0 + Math.random()` por funções que calculam scores baseados em metadados reais do `study_assessment`:
- `quality_score`: baseado em `methodology_type`, `sample_size`, `randomization`, `blinding`, `statistical_significance`
- `relevance_score`: baseado em `species_tested` (canine/feline = maior peso), `follow_up_duration`
- `novelty_score`: manter como input da LLM (não há como calcular deterministicamente)

### Sobre Estudos Já Processados

Os estudos já processados **não vão receber retroativamente** os scores corretos — seria necessário reprocessá-los. Porém, novos estudos terão os 3 scores reais extraídos pela LLM. Para os existentes, o fallback `0` deixará claro que precisam de reprocessamento, e o card de score pode exibir "Não avaliado" quando score = 0.

### Arquivos Modificados
- `supabase/functions/gemini-file-search/index.ts` — interface + mapeamento + salvamento
- `src/components/administrador/dialogs/EstudoDetailDialog.tsx` — leitura multi-fonte
- `src/services/ntai/scoring.ts` — substituir mock por cálculo real
- `src/components/administrador/tags/ScoreSummaryCard.tsx` — exibir "Não avaliado" quando score = 0
- `src/locales/pt/translation.json` e `src/locales/en/translation.json` — chave para "Não avaliado" / "Not evaluated"
- `src/i18n.ts` — incrementar versão

