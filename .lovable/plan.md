## Objetivo

Adicionar **check de originalidade** às sugestões de cohort, com 3 camadas de busca em cascata e **transparência total** sobre o que foi encontrado (para você poder julgar se a busca realmente funcionou, não só confiar no score).

## Arquitetura: 3 camadas, da mais barata para a mais cara

```text
1. Base interna (study_embeddings)   → grátis, ~200ms     [sempre roda]
2. PubMed E-utilities                → grátis, ~2s         [sempre roda]
3. Perplexity sonar (academic mode)  → ~$0.005, ~5s        [opt-in via toggle]
```

A camada 3 fica **desligada por padrão** (toggle na UI "Usar Perplexity para busca expandida"). Quando você quiser ativar, é 1 clique — a chave já está lá.

## O que o usuário vê

Cada sugestão de cohort ganha um bloco **"Originalidade"** com:

- Score 0–100 + badge (`Alta` / `Média` / `Já bem estudado`)
- **Breakdown transparente**: quantos hits em cada fonte
  - Base interna: 3 estudos (similaridade máx 0.78)
  - PubMed: 47 artigos para `golden retriever AND hepatic AND SAMe`
  - Perplexity: desligado / X citações
- **Top 3 títulos mais próximos** clicáveis (link direto PubMed)
- **Query usada** exibida em mono — você vê exatamente o que foi pesquisado
- Botão "Re-rodar busca" caso ache que ficou ruim

Se a busca falhar (API down, timeout), mostra `Indisponível` em vez de score falso — isso é o que você pediu ("ver se realmente houve sucesso").

## Como gero a query de busca

Uma chamada Gemini 2.5 Flash converte o cohort em query estruturada:

```
input:  "Golden 8+ com elevação de ALT testando SAMe vs placebo"
output: {
  pubmed_query: "(golden retriever[tiab] OR canine[tiab]) AND (ALT[tiab] OR hepatic[tiab]) AND (SAMe[tiab] OR S-adenosylmethionine[tiab])",
  google_scholar_query: "golden retriever ALT SAMe hepatic dog clinical trial",
  keywords: ["golden retriever", "hepatic", "SAMe", "ALT"]
}
```

A `google_scholar_query` é mostrada na UI como **link clicável** (`https://scholar.google.com/scholar?q=...`) — não chamamos Scholar via API (não tem API pública), mas você pode clicar e validar manualmente em 1 segundo. Isso responde diretamente seu "talvez um query de busca no Google já ajude".

## Cálculo do score

```
internal_score  = 100 - (max_cosine_similarity * 100)   // 0–100
pubmed_score    = clamp(100 - (hits * 2), 0, 100)        // 50 hits ≈ 0
perplexity_score = (se ativo) baseado em nº citações relevantes

originalidade = 0.4 * internal + 0.6 * pubmed
              (se Perplexity ativo: 0.3 internal + 0.4 pubmed + 0.3 perplexity)
```

Cohort com originalidade **< 30** ganha badge vermelho "⚠️ Já bem estudado — considere refinar o recorte".

## Onde encaixa no fluxo

Roda **logo após** `suggest-cohort-ideas` retornar as 5 sugestões, em paralelo (uma chamada por cohort). Não bloqueia a UI — cada card mostra spinner "Verificando originalidade…" e atualiza quando termina. Persiste o resultado em `cohort_suggestions` (3 colunas novas: `originality_score`, `originality_breakdown jsonb`, `originality_checked_at`).

## Detalhes técnicos

**Arquivos novos**
- `supabase/functions/check-cohort-originality/index.ts` — orquestra as 3 camadas, retorna `{ score, breakdown, queries, similar_studies, status }`
- `src/components/administrador/priorizacoes/CohortOriginalityBadge.tsx` — badge + popover com breakdown
- `supabase/migrations/<ts>_cohort_originality_columns.sql` — adiciona 3 colunas em `cohort_suggestions`

**Arquivos editados**
- `supabase/functions/suggest-cohort-ideas/index.ts` — dispara `check-cohort-originality` via `EdgeRuntime.waitUntil` para cada sugestão persistida
- Componente que renderiza os cards de sugestão (provavelmente em `priorizacoes/` — vou localizar quando implementar) — embed do badge
- `src/i18n.ts` (bump versão) + `pt/en translation.json` (chaves `prioritization.originality.*`)
- `CHANGELOG.md` + organograma + `npm run sync:changelog`

**Perplexity**
- Reutilizo a edge function `query-perplexity` que já existe, mas só chamada quando o toggle estiver ativo. **Não pede nada de você agora.**

**Sem impacto em outras áreas** — mudanças isoladas em Priorizações.

## O que NÃO faço

- Não chamo Google Scholar via scraping (frágil, ToS).
- Não bloqueio a geração de cohort se originalidade for baixa — só sinalizo. Você decide.
- Não mexo no `generate-synthetic-cohort` nem em outras partes do fluxo.

Posso seguir?
