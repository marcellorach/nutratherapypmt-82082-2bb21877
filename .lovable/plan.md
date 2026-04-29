## Objetivo

Resolver o "zero gain" do Digital Twin populando o Knowledge Graph com evidências reais sobre (Condição × Composto), buscando direto no **PubMed/PMC** (NCBI E-utilities), sem connectors externos e sem novas chaves. As triplets entram como `pending` para curadoria humana, respeitando a "Tiered Data Governance".

## Por que PubMed direto (e não Perplexity agora)

- API pública oficial NCBI, sem chave (limite generoso de 3 req/s; 10/s com NCBI_API_KEY opcional).
- Citações 100% rastreáveis (PMID/DOI), sem risco de "alucinação de URL".
- Custo zero. Auditável.
- O Gemini (via Lovable AI Gateway) faz a parte estruturada — extrair `{relationship, efficacy_0_5, rationale, pmids[]}` dos abstracts.

Perplexity fica reservado para missões futuras onde o ganho real dele aparece (ver fim do plano).

## Arquitetura

```text
[Admin] ──▶ EvidenceGapCard (PetProfilePage)
              │
              ▼
    Edge Function: kg-evidence-gap-fill
              │
   ┌──────────┴──────────┐
   │ 1. Detecta gaps     │  query: condições do pet × compostos canônicos sem efficacy ≥ 3
   │ 2. PubMed E-utils   │  esearch → efetch (abstracts) por par
   │ 3. Gemini estrutura │  tool-calling: efficacy 0–5 + rationale + PMIDs citados
   │ 4. Persiste         │  scientific_studies (source_api='pubmed_gap_fill')
   │                     │  triplet_extractions (curation_status='pending')
   └──────────┬──────────┘
              ▼
     Curadoria Triplets (UI já existente)
              │
              ▼
       sync-approved-triplets ──▶ Neo4j ──▶ project-pet-trajectory recalcula
```

## Mudanças

### 1. Nova edge function `supabase/functions/kg-evidence-gap-fill/index.ts`

Entradas:
- `pet_id` (opcional) — descobre gaps do pet específico
- `condition_id` + `compound_ids[]` (opcional) — modo dirigido
- `dry_run` (default false)

Lógica:
1. Se `pet_id`: buscar condições ativas + compostos do stack atual / top-N geriátricos.
2. Para cada par `(condition_en, compound_en)` sem evidência forte no KG:
   - `esearch.fcgi?db=pubmed&term=<compound>+AND+<condition>+AND+(canine OR dog)&retmax=10&sort=relevance`
   - `efetch.fcgi?db=pubmed&id=<PMIDs>&rettype=abstract&retmode=xml` → parse título/abstract/year/journal/DOI
3. Chamar Gemini (`google/gemini-3-flash-preview`) com tool-calling para estruturar:
   - `efficacy_0_5`, `evidence_level` (clinical_trial/meta_analysis/in_vivo/in_vitro), `rationale`, `cited_pmids[]`
4. Inserir em `scientific_studies` (dedup por PMID; `source_api='pubmed_gap_fill'`).
5. Inserir em `triplet_extractions`:
   - `predicate='treats'`, `subject=compound`, `object=condition`
   - `extraction_confidence = efficacy/5`, `llm_confidence = score do Gemini`
   - `curation_status='pending'` (NUNCA auto-aprova — gap-fill é sempre revisado)
   - `evidence_level`, `species_context=['canine']`, `confidence_rationale=rationale`
6. Retorna `{pairs_searched, studies_added, triplets_pending}`.

Rate limit: serial com 350ms entre chamadas PubMed (≈3 req/s). Usar `NCBI_API_KEY` se existir como secret.

### 2. Hook `src/hooks/useKgEvidenceGapFill.ts`

- `useEvidenceGap(petId)` → query Supabase: conta triplets `pending` recentes com `extraction_method='pubmed_gap_fill'` para condições do pet
- `useTriggerGapFill()` → mutation que invoca a edge function

### 3. Componente `src/components/pet/EvidenceGapCard.tsx`

Aparece **só para admin** (checar `useUserRole`) na PetProfilePage quando `years_gained_total < 0.3`.

Conteúdo:
- Título: "Lacuna de evidência detectada"
- Explicação curta: por que a projeção está zerada (sem compostos com efficacy ≥ 3 para as condições)
- Botão "Buscar evidências no PubMed"
- Status pós-execução: "N estudos PubMed adicionados · M triplets aguardando curadoria"
- Link para a tela de Curadoria de Triplets

### 4. Integração em `PetProfilePage.tsx`

Renderizar `<EvidenceGapCard petId={...} />` logo abaixo do Digital Twin, condicionalmente (admin + low-gain).

### 5. Governança

- `mem://architecture/kg-evidence-gap-fill-pipeline` (nova memory)
- `CHANGELOG.md` → `[Unreleased]` Added
- `supabase/config.toml` → bloco para a nova função (verify_jwt default)
- Bump `I18N_VERSION` em `src/i18n.ts` → `1.41.2`
- Chaves PT/EN: `evidenceGap.title`, `evidenceGap.explanation`, `evidenceGap.button`, `evidenceGap.statusFound`, etc.

### 6. Seed inicial (one-shot, opcional)

Após deploy, rodar manualmente via UI: gap-fill para o pet atual em teste. Não criamos cron — execução é sob demanda.

## O que NÃO faremos agora

- Não conectaremos Perplexity neste passo.
- Não auto-aprovaremos triplets do gap-fill (sempre `pending`, mesmo com confiança alta — protocolo de gatekeeper).
- Não tocaremos em `project-pet-trajectory` — assim que a curadoria aprovar, o Neo4j sync já alimenta a próxima projeção naturalmente.

## Missões futuras onde o Perplexity vale a pena (registro)

1. **Sumários clínicos narrativos** para o vet ("o que mudou nas evidências sobre curcumina em cães nos últimos 6 meses?") — precisa síntese + recência.
2. **Vigilância de contraindicações emergentes** — busca aberta na web (não só PubMed): bulas, FDA alerts, fóruns veterinários.
3. **Pesquisa de raças raras** com pouca literatura indexada no PubMed — Perplexity vasculha teses, anais, blogs especializados.
4. **Triagem de novos compostos candidatos** ao catálogo — descoberta exploratória antes de fazer extração estruturada.

Para essas missões eu volto a propor a conexão do Perplexity, com escopo bem definido.

## Aceite

Implementar tudo acima ao aprovar.
