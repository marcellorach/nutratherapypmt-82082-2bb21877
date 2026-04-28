## Diagnóstico

Tu estás certo — hoje **não estamos extraindo dose real do grafo**. O que acontece:

1. `queryKnowledgeGraph` busca os nós (Neo4j via `graph-rag-search`) e lê `node.properties?.dosage`. Em quase todos os compostos esse campo vem **vazio ou string genérica** ("Consultar veterinário").
2. A edge function `hybrid-recommendation` recebe esse `dosage` vazio e o LLM, sem âncora, devolve textos vagos sem range mg/kg.
3. No pipeline (`clinical-analysis-pipeline.ts` linhas 923-927) há um regex que tenta extrair `min-max mg/kg` da string. Quando falha, cai no **fallback hardcoded `5–50 mg/kg` → recomendado = 27.5**. Por isso *todas* as recomendações batem em 27.5.
4. Não há ajuste por **peso do paciente**, **condição-alvo** nem **ajuste por interação** com outros itens do stack.

O grafo também não tem hoje um schema dedicado para dose por composto×condição×espécie.

## O que vamos construir

### 1. Schema de dose canônica (Lovable Cloud)

Nova tabela `compound_dosage_reference` com origem rastreável:

```text
compound_name_en | condition_name_en | species | min_mg_per_kg | max_mg_per_kg
unit | frequency_per_day | route | max_daily_mg | source_type
source_url | source_citation | confidence (0-1) | needs_review (bool)
created_by | curated_at | notes
```

`source_type ∈ { 'kg_triplet', 'curated_study', 'web_authoritative', 'llm_estimate' }`

Índice único `(compound_name_en, condition_name_en, species)`.

E uma tabela `dosage_lookup_log` (auditoria): cada vez que o pipeline buscar uma dose e tiver que recorrer a fallback, gravamos: composto, condição, peso do pet, fonte usada, valor retornado, motivo do fallback. Isso te dá a fila do que precisa virar estudo curado.

### 2. Resolver de dose em cascata (5 níveis)

Novo `src/services/dosage-resolver.ts` chamado dentro de `clinical-analysis-pipeline.ts` antes de montar cada `compound`:

```text
Nível 1  Triplet KG do tipo HAS_DOSAGE / RECOMMENDED_DOSE  (composto→condição)
Nível 2  Tabela compound_dosage_reference (curada)         (composto×condição×espécie)
Nível 3  Tabela compound_dosage_reference fallback         (composto×espécie, qualquer condição)
Nível 4  Edge function `web-dosage-lookup` (fontes boas)   marca needs_review=true e loga
Nível 5  Faixa default explícita por classe                marca como "estimativa", UI flagged
```

Cada resultado carrega `{ minPerKg, maxPerKg, unit, source, sourceUrl, confidence, needsReview }`.

### 3. Edge function `web-dosage-lookup`

Consulta apenas fontes veterinárias autoritativas via Lovable AI (Gemini com web search) com prompt restrito:
- Plumb's Veterinary Drug Handbook
- Merck Veterinary Manual (merckvetmanual.com)
- ACVIM consensus statements
- VIN (Veterinary Information Network)
- PubMed/PMC artigos canine/feline
- WSAVA guidelines

Retorna JSON estrito `{ min_mg_per_kg, max_mg_per_kg, unit, frequency_per_day, source_url, source_citation, confidence }`. Tudo gravado em `compound_dosage_reference` com `source_type='web_authoritative'` e `needs_review=true`. Cache permanente — só é chamada na 1ª vez por par (composto×condição×espécie).

### 4. Ajuste por peso e interações

Em `dosage-resolver.ts`, após resolver a faixa mg/kg:

- **Peso**: `dailyMg = recommendedPerKg * pet.weight_kg`, com clamp em `max_daily_mg` se existir.
- **Interação dentro do stack**: se outro composto do stack já está em CONTRAINDICATES/INTERACTS no KG com este, reduzir 25% e adicionar nota.
- **Medicação concorrente**: mesma regra contra `petMedications`.
- **Idade geriátrica (>10 anos)**: começar no terço inferior da faixa.
- **Hepático/renal alterado em labs**: cap no terço inferior + nota.

O resultado sobrescreve `dosageMin/Max/Recommended` no compound antes de chegar no UI.

### 5. UI — transparência da fonte da dose

Em `CompoundDosageSlider.tsx`, ao lado da dose recomendada, badge pequeno:

- `Curado` (verde) — `curated_study` / `kg_triplet`
- `Web autoritativo` (âmbar) — `web_authoritative` + ícone link para `source_url`
- `Estimativa` (cinza outline) — `llm_estimate`
- Tooltip com citação + frequência + via.

Aviso "Dose ajustada para o peso do paciente (Xkg)" abaixo do slider quando peso foi aplicado.

### 6. Painel admin "Doses pendentes de curadoria"

Nova tab simples lendo `compound_dosage_reference WHERE needs_review=true ORDER BY hits DESC` (com contador de uso vindo do `dosage_lookup_log`). Vet/admin valida → marca `needs_review=false`, opcionalmente muda `source_type` para `curated_study` e anexa `study_id`.

## Arquivos afetados

- **Migração**: `compound_dosage_reference` + `dosage_lookup_log` + RLS (admin manage / vet read).
- **Nova edge function**: `supabase/functions/web-dosage-lookup/index.ts`.
- **Novo serviço**: `src/services/dosage-resolver.ts`.
- **Modificado**: `src/services/clinical-analysis-pipeline.ts` (linhas 920-943 — substituir bloco de fallback 5-50).
- **Modificado**: `src/components/pet/CompoundDosageSlider.tsx` (badge fonte + tooltip + aviso peso).
- **Nova tab admin**: `src/components/administrador/DosageCurationPanel.tsx`.
- **i18n**: chaves novas (PT/EN) + bump `I18N_VERSION`.
- **Docs**: ARCHITECTURE.md, CURRENT_STATE.md, CHANGELOG.md.

## Resposta direta às tuas perguntas

> **Estamos mesmo extraindo dose do grafo?** Não. Lemos `properties.dosage` mas ele vem vazio, e caímos num fallback fixo 5–50 → 27.5.
> **Faz sentido buscar em fontes boas da web com log para depois curar?** Sim, é exatamente a abordagem certa para um protótipo clínico — desde que (a) restrito a fontes autoritativas, (b) cacheado por par composto×condição×espécie, (c) marcado `needs_review=true`, (d) visível na UI como "Web autoritativo" com link da fonte, e (e) aparecendo numa fila admin de curadoria. É o que está no plano.

Aprova para eu implementar?
