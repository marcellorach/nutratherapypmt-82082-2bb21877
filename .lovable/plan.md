
## Diagnóstico: Por que as buscas não encontram evidências conhecidas?

Analisei profundamente o edge function `kg-evidence-gap-fill/index.ts` e identifiquei **3 problemas críticos**:

---

### Problema 1: Perplexity retorna PMIDs alucinados que não validam no PubMed

O pipeline chama o Perplexity primeiro (`sonar-reasoning-pro`). O Perplexity diz "sim, Chondroitin Sulfate trata Hip Dysplasia com eficácia 1.5/5" e cita PMIDs. Porém, a função `validatePmids()` verifica cada PMID contra a API real do PubMed — e nenhum existe de verdade (são alucinações do modelo). Resultado: `citedPmids = []`, `records = []`, **0 estudos persistidos**.

O triplet é criado como "pending", mas sem nenhum estudo real vinculado — uma afirmação sem prova.

**Evidência no log:** `"✓ Chondroitin Sulfate → Hip Dysplasia: ef 1.5/5 via perplexity (0 studies)"`

### Problema 2: PubMed fallback NUNCA é acionado quando Perplexity retorna eficácia > 0

Na linha 697, o código verifica: `if (px.assessment && px.assessment.efficacy_0_5 > 0)`. Se o Perplexity diz que há **qualquer** evidência (mesmo ef=1, anecdotal), o pipeline **pula completamente** a busca direta no PubMed.

Testei manualmente agora: **PubMed TEM 2 artigos reais** para "Chondroitin Sulfate" + "Hip Dysplasia" em caninos (PMIDs 18716453 e 12202124). Mas como o Perplexity já retornou ef=1.5 com PMIDs falsos, esse fallback nunca executa.

Este é o bug principal: o PubMed só é consultado quando o Perplexity retorna eficácia = 0, o que quase nunca acontece para correlações conhecidas.

### Problema 3: Timeout de 150s causa perda do resultado final

O log mostra timestamps de 23:47 a 23:50 — ~3 minutos. Cada par leva ~20-30s (Perplexity + validação + sleep). Com 10 pares, o tempo total (~200-300s) excede o idle timeout de 150s do Deno. Quando o timeout mata a conexão, o evento `result` final nunca chega ao cliente, e o "Detalhamento da última busca" mostra `pares: 0, estudos: 0, pendentes: 0`.

---

## Plano de Correção

### 1. Busca PubMed complementar quando PMIDs do Perplexity não validam
Após `validatePmids()`, se `validPmids.length === 0` mas `efficacy > 0`, executar `pubmedSearch()` para encontrar estudos reais que comprovem a afirmação do Perplexity. Usar esses registros para alimentar `records` e `citedPmids`.

### 2. Re-avaliar com Gemini quando PubMed complementar encontra artigos
Quando a busca PubMed complementar achar papers, chamar `assessWithGemini()` sobre eles para obter uma avaliação baseada em evidência real (não apenas a palavra do Perplexity).

### 3. Reduzir max_pairs padrão de 10 para 5
Cada par leva ~20s. Com 5 pares = ~100s, dentro do limite de 150s.

### 4. Reduzir sleeps desnecessários
Os `sleep(400)` entre chamadas Perplexity e `sleep(360)` sem NCBI_API_KEY são excessivos. Reduzir para 200ms (Perplexity) e 150ms (PubMed sem key).

### 5. Emitir heartbeats periódicos
Adicionar emissão de evento `heartbeat` durante processamento longo para evitar que o idle timeout mate a conexão de streaming.

---

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/kg-evidence-gap-fill/index.ts` | Fix lógica Perplexity→PubMed, reduzir timeouts, heartbeats |
| `CHANGELOG.md` | Registrar correção |
