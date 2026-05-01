## Contexto

Hoje 87% dos triplets aprovados (3.272 de 3.737) **não têm `intensity`** e 85% (3.172) **não têm `evidence_level`**. Esses dois campos representam 50% combinado do score final do motor de recomendação (`evidence` 30% + `intensity` 20%, definidos em `src/utils/score-normalization.ts`), além de modular espessura de aresta no KG e ranking de evidências em `recommendation-confidence-service`, `hybrid-recommendation-service` e `PatientKnowledgeSubgraph`. Ou seja: o motor está rodando degradado para a maior parte dos dados.

A função `enrich-triplet` existe mas só roda quando alguém clica "Enriquecer com IA" no painel de curadoria.

## O que será feito

### 1. Melhorar o prompt de `supabase/functions/enrich-triplet/index.ts`

Mudanças no prompt e na ferramenta (tool call):

- **Adicionar `in_vivo` e `animal_study`** ao enum de `evidence_level` (e à lista `VALID_EVIDENCE_LEVELS`). Estudos em cães caem aí; hoje viram `expert_opinion` no fallback.
- **Ancorar `intensity`** em magnitude observável: o LLM passa a justificar com o que está escrito (ex.: "redução de 40% no marcador X" → 0.4; "remissão completa" → 0.9–1.0; "tendência não significativa" → 0.1–0.2).
- **Exigir `source_excerpt`**: trecho literal (≤300 chars) do texto-fonte que sustenta o julgamento. Vira parte do `confidence_rationale` salvo no banco. Sem âncora literal, o rationale vira opinião.
- **Instrução explícita** de retornar `intensity` baixa quando o texto descreve resultado nulo/negativo (hoje o modelo tende a inflar).

### 2. Tornar o enriquecimento automático

Dois pontos de injeção:

- **Pós-aprovação**: na função `approve-triplet` (ou no caminho equivalente que muda `curation_status` para `approved`), disparar `enrich-triplet` em background quando o triplet aprovado tiver `intensity IS NULL` ou `evidence_level IS NULL`. Fire-and-forget — não bloqueia a aprovação.
- **Auto-aprovação de alta confiança** (≥50%, regra existente): também dispara o enriquecimento.

### 3. Backfill em massa (rodado uma vez agora)

Nova edge function **`backfill-triplet-enrichment`**:

- Busca todos os triplets onde `curation_status='approved' AND (intensity IS NULL OR evidence_level IS NULL)`.
- Processa em lotes de 10 paralelos com pequena pausa entre lotes (≈10/s) para respeitar rate limit do Lovable AI Gateway.
- Loga progresso em `api_usage_logs` (provider `lovable_ai`, operation `triplet_enrichment_backfill`).
- Idempotente: pula triplets já preenchidos; resgatável se cair no meio.

Volume estimado: ~3.300 chamadas Gemini Flash, ~5–10 minutos, custo ~US$ 3–5.

Disparada uma vez via `supabase--curl_edge_functions` logo após o deploy. Sem botão admin (não vamos precisar repetir).

### 4. Chave da Elicit (você já assinou)

Sem código por enquanto. Caminho para gerar:

1. Login em https://elicit.com
2. Avatar (canto superior direito) → **Account settings**
3. Menu lateral → **API** (link direto provável: `https://elicit.com/settings/api`)
4. **Create API key** → copie (aparece só uma vez, formato `elk_live_…`)

Se a aba "API" não aparecer, confirme em **Account → Plan** que sua assinatura está como Pro (API exige Pro).

Quando você tiver a chave em mãos, me avise — eu disparo o `add_secret` para `ELICIT_API_KEY` e na sequência implemento a integração na aba "External Search" (busca semântica + extração estruturada PICO/dosagem). Isso fica em uma próxima rodada para não misturar escopo com o enriquecimento automático.

## Detalhes técnicos

**Arquivos a modificar:**
- `supabase/functions/enrich-triplet/index.ts` — prompt + enum expandido + `source_excerpt`
- `supabase/functions/approve-triplet/index.ts` (ou equivalente) — hook fire-and-forget pós-aprovação
- `supabase/functions/backfill-triplet-enrichment/index.ts` — **nova**
- `CHANGELOG.md` — entrada em `[Unreleased] → Changed`
- `.lovable/plan.md` — atualizar rastro

**Sem mudança de schema.** `triplet_extractions.intensity`, `evidence_level` e `confidence_rationale` já existem.

**Validação pós-backfill:** rodar a mesma query de diagnóstico (`count(*) FILTER (WHERE intensity IS NULL …)`) e reportar a taxa de cobertura final.

**Risco controlado:** fallback explícito se o LLM falhar — triplet permanece com NULL (não corrompe nada) e fica disponível para nova tentativa.
