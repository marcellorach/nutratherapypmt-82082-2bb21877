## Diagnóstico

**Estado atual (Max — Cognitive Dysfunction + Sarcopenia):**

1. **Stack KG-backed mas sem ganho projetado** — o `project-pet-trajectory` reporta `Coverage: 0/0` mesmo com 8 compostos rotulados como "KG-backed" no painel. Isso indica desconexão entre o que o `hybrid-recommendation` considera "KG-backed" (provavelmente match canônico de composto) e o que o projetor exige (triplet aprovado `compound × condition` com `efficacy_0_5 ≥ 3` e `extraction_confidence ≥ 0.6` no KG real). Resultado: o card mostra "Confiança Média / KG-backed", mas o twin diz "No knowledge graph evidence available".

2. **`Failed to send a request to the Edge Function` em "Ver triplets faltantes"** — a função `kg-missing-triplets` existe no repo, **não tem nenhum log no servidor** e **não está declarada em `supabase/config.toml`**. A função `kg-evidence-gap-fill` está no mesmo estado (sem logs). Isso é compatível com falha de boot/deploy ou com o cliente sendo bloqueado antes de chegar à função (CORS de preflight, ou simplesmente função não publicada). O erro genérico "Failed to send a request" vem do SDK quando o fetch falha antes de receber resposta.

3. **Botão "Buscar evidências" sumiu da UI** — o `EvidenceGapCard` só aparece quando `yearsGained < 0.3` **E** o usuário é admin. Como `years_gained = 0`, ele deveria aparecer — provavelmente está renderizando, mas o usuário não consegue distingui-lo do diálogo de "triplets faltantes" que abriu por cima. Além disso, o card hoje **só usa PubMed E-utilities** (foi a tentativa anterior que "não retornava resultados").

4. **Triplets gerados pelo gap-fill não aparecem no grafo** — por design: ficam como `pending` em `triplet_extractions` e só vão para o KG depois de aprovação manual em `/administrador?tab=triplet-curation`. Mas ainda não chegam lá porque a função não está rodando.

## Plano

### 1. Destravar as edge functions de KG (causa raiz do "Failed to send a request")

- Acrescentar blocos no `supabase/config.toml` para garantir deploy:
  ```toml
  [functions.kg-missing-triplets]
  verify_jwt = true

  [functions.kg-evidence-gap-fill]
  verify_jwt = true
  ```
- Reforçar tratamento de erro nas duas funções: try/catch em volta de `Deno.serve`, retornar JSON com `{ error, stage }` em qualquer falha (hoje `kg-missing-triplets` ainda pode estourar antes do `try` se faltar env var).
- Adicionar logging estruturado (`console.log('[kg-missing-triplets] start', { petId })`) para que possamos diagnosticar via `supabase--edge_function_logs` na próxima execução.

### 2. Substituir/Complementar PubMed pelo **Perplexity** no gap-fill

O usuário aprovou testar Perplexity. A diferença é grande para este caso: PubMed E-utilities exige termos exatos no `[Title/Abstract]` (e por isso "não retornava nada" para pares como `Quercetin × Cognitive Dysfunction Syndrome` em cães). Perplexity Sonar faz busca semântica + LLM, devolve resposta estruturada e **citações reais** já filtradas por relevância.

- Adicionar Perplexity como connector (tool `standard_connectors--connect`) → injeta `PERPLEXITY_API_KEY` automaticamente nos edge functions.
- Refatorar `kg-evidence-gap-fill` para uma estratégia em 3 passos por par (composto × condição):
  1. **Perplexity Sonar** com `search_mode: 'academic'`, prompt pedindo JSON estruturado (`efficacy_0_5`, `evidence_level`, `mechanism`, `species_context`, `cited_pmids`, `cited_dois`, `summary_pt`).
  2. **Fallback PubMed** (lógica atual) só se Perplexity devolver `efficacy_0_5 = null` ou sem citações.
  3. Persistir as citações como `scientific_studies` (com `source: 'perplexity_gap_fill'`) e `triplet_extractions` `pending` exatamente como hoje.
- Trocar o uso de Gemini interno (que estava só re-estruturando abstracts) — Perplexity já entrega estruturado via `response_format: json_schema`.
- Manter `max_pairs` e log detalhado por par (`status: 'perplexity_hit' | 'pubmed_fallback' | 'no_evidence' | 'low_efficacy'`).

### 3. Conciliar "KG-backed" do stack com o projetor

Existe inconsistência semântica que confunde o vet (e me confundiu): o `hybrid-recommendation` chama de "KG-backed" o composto que tem **qualquer** triplet, mas o `project-pet-trajectory` exige eficácia ≥ 3 contra a **condição específica do pet**. Solução:

- Em `hybrid-recommendation`, marcar o link com nível mais granular: `kg_link_status: 'evidence' | 'partial' | 'mechanism_only' | 'inferred'`.
- No card de stack (UI), mostrar o nível real (ex.: "Mecanismo (sem ECR)" ao invés de "KG-backed" indistinto), com tooltip explicando que ganho projetado exige `evidence`.
- No banner amarelo do twin ("No knowledge graph evidence available..."), citar **explicitamente** quais compostos do stack faltam evidência forte para aquela condição, com botão "Buscar via Perplexity para esses N pares" que dispara o gap-fill direcionado (`compound_ids` + `condition_id`).

### 4. UX dos triplets faltantes

- Quando `kg-missing-triplets` retornar a matriz, mostrar no diálogo um botão **"Buscar evidências para todos via Perplexity"** que chama `kg-evidence-gap-fill` com a lista exata de pares já calculada (em vez de o gap-fill recalcular).
- Após o run, mostrar inline: "X pares processados → Y citações encontradas → Z triplets pendentes para curadoria" + link direto.
- Adicionar **toast persistente** quando o gap-fill termina com `triplets_pending > 0` lembrando que o ganho projetado **só atualiza após aprovação na curadoria**.

### 5. i18n & changelog

- Bump `I18N_VERSION` para `1.41.4`.
- Novas chaves: `evidenceGap.viaPerplexity`, `evidenceGap.providerLabel`, `evidenceGap.fallbackPubmed`, `kgLinkStatus.evidence|partial|mechanism|inferred`.
- Entrada no `CHANGELOG.md` (área: KG / Evidence) + `npm run sync:changelog`.

## Detalhes técnicos

```text
┌──────────────────────┐    busca pares faltantes    ┌────────────────────────┐
│ MissingTriplets UI   │ ──────────────────────────► │ kg-missing-triplets    │
└─────────┬────────────┘                             └────────────────────────┘
          │ "Buscar evidências para todos"
          ▼
┌──────────────────────────────────────────────────────────────┐
│ kg-evidence-gap-fill                                          │
│  for pair in pairs:                                           │
│    1. Perplexity Sonar (academic, json_schema)                │
│    2. if no hit → PubMed fallback                             │
│    3. persist scientific_studies + triplet_extractions(pending)│
└─────────────────────────────────────────────────────────────┘
          │
          ▼  toast / inline summary  →  /administrador?tab=triplet-curation
```

**Arquivos a modificar:**
- `supabase/config.toml` (declarar 2 functions)
- `supabase/functions/kg-evidence-gap-fill/index.ts` (Perplexity-first, fallback PubMed, logging)
- `supabase/functions/kg-missing-triplets/index.ts` (try/catch defensivo + log)
- `supabase/functions/hybrid-recommendation/index.ts` (`kg_link_status` granular)
- `src/components/pet/EvidenceGapCard.tsx` (provider label, melhor empty state)
- `src/components/pet/MissingTripletsDialog.tsx` (botão "Buscar evidências para todos")
- `src/components/pet/DigitalTwinDog.tsx` (banner com pares específicos faltando)
- `src/hooks/useKgEvidenceGapFill.ts` (aceitar `pairs` direcionados)
- `src/i18n.ts`, `src/locales/{pt,en}/translation.json`
- `CHANGELOG.md` + `npm run sync:changelog`

**Pré-requisito de aprovação:** Conectar Perplexity via `standard_connectors--connect` (você precisa autorizar uma vez para que a chave fique disponível nos edge functions).

## Riscos & mitigação

- **Perplexity pode alucinar PMIDs** → validamos cada `cited_pmid` contra `efetch` do PubMed antes de persistir; só salvamos os que existem.
- **Custo** → cap rígido `max_pairs = 10` por execução + cache 24h por par no `triplet_extractions` (não re-buscar par já tentado).
- **Inconsistência KG-backed** → introduzir `kg_link_status` é mudança de contrato; vamos manter campo `kg_backed: boolean` por compatibilidade durante a transição.