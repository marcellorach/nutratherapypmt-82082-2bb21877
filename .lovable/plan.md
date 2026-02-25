

## Análise das suas perguntas e plano

### Sobre o modelo (Gemini 3 vs 2.5)

Você tem razão em questionar. Revisando o código atual, a função `generate-triplets` já usa `gemini-3-pro-preview` para ambas as fases e trunca o texto para **12.000 caracteres** (linha 390). O problema real de timeout não é o modelo em si — é que duas chamadas sequenciais ao Gemini 3 Pro com textos longos somam tempo demais para o limite de 150s da edge function.

**Solução corrigida**: Manter `gemini-3-pro-preview` para ambas as fases, mas implementar **chunking** do texto em vez de truncar/rejeitar.

### Sobre chunking de estudos longos

Concordo completamente — rejeitar estudos longos seria perder informação valiosa. A estratégia será:

1. **Dividir o `full_text_content` em chunks de ~10.000 caracteres** com overlap de 500 chars
2. **Phase 1**: Executar a descoberta livre em cada chunk separadamente, depois concatenar os resultados
3. **Phase 2**: Usar o resultado consolidado da Phase 1 (que é um resumo bem menor que o texto original) para gerar os triplets estruturados
4. **Se o estudo tiver apenas 1 chunk** (< 10K chars): comportamento idêntico ao atual, sem overhead

Isso resolve o timeout porque:
- Cada chamada individual processa menos texto → resposta mais rápida
- A Phase 2 recebe apenas o resumo da Phase 1, não o texto inteiro

### Sobre os ícones (ponto b) — Implementação direta

Mudanças no `NtaiProcessingSection.tsx` (linhas 267-305):

| Etapa | Antes | Depois |
|-------|-------|--------|
| Step 1 (PDF Parsing) | `bg-blue-100` / `text-blue-600` | `bg-sky-100` / `text-sky-600` |
| Step 2 (Entity Extraction) | `bg-indigo-100` / `text-indigo-600` | `bg-amber-100` / `text-amber-600` |
| Step 3 (Triplets) | `bg-violet-100` / `text-violet-600` | `bg-emerald-100` / `text-emerald-600` |
| Step 4 (Vectorization) | `bg-purple-100` / `text-purple-600` | `bg-rose-100` / `text-rose-600` |

Além disso:
- Tornar o `ChevronDown` mais visível: cor mais escura (`text-gray-600`) e tamanho `h-3.5 w-3.5`
- Adicionar um label textual "(expandir)" ao lado da setinha para indicar que há conteúdo oculto

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-triplets/index.ts` | Implementar chunking do texto (dividir em blocos de ~10K chars), executar Phase 1 em cada chunk, concatenar resultados antes da Phase 2 |
| `supabase/functions/enrich-knowledge-graph/index.ts` | Não marcar "completed" se triplets = 0 → marcar como `error` |
| `src/components/administrador/estudos/analysis/NtaiProcessingSection.tsx` | Cores pastéis distintas + setinha dropdown mais visível |

