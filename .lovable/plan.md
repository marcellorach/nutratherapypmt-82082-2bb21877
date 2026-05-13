## Objetivo

Garantir que a seção **"Ver evidências e contexto"** de cada composto sempre exiba **2 a 3 links clicáveis para estudos**, mesmo quando o pipeline atual não consegue atrelar nenhum estudo curado ao par (composto × condição) — caso da tela enviada, em que aparecem 3 triplets KG-backed mas nenhum link em "Estudos científicos".

## Diagnóstico

`src/services/clinical-analysis-pipeline.ts` já tenta atrelar até 3 estudos por composto (`MAX_STUDIES_PER_COMPOUND = 3`):

1. Estudos vindos de `triplet_extractions` aprovados para o par (composto, condição).
2. Fallback: até 3 estudos do mesmo composto em qualquer condição (`provenance: 'compound-only'`).

Quando ambos retornam vazio (composto presente em KG mas sem `study_id` aprovado, ou composto ausente da base local), o componente `CompoundDosageSlider` simplesmente omite o bloco "Estudos científicos" — foi o que o usuário viu.

## Mudanças propostas

### 1. Pipeline — segundo nível de fallback (`clinical-analysis-pipeline.ts`)

Antes de devolver `studies: []`, gerar **2 referências de busca pública** determinísticas a partir do nome do composto + condição canônica, sem inventar título nem ano:

```ts
const publicSearchFallback = (compound, condition) => [
  {
    id: `pubmed:${compound}:${condition}`,
    title: `PubMed — ${compound} + ${condition}`,
    link: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`${compound} ${condition}`)}`,
    provenance: 'public-search',
  },
  {
    id: `scholar:${compound}:${condition}`,
    title: `Google Scholar — ${compound} + ${condition}`,
    link: `https://scholar.google.com/scholar?q=${encodeURIComponent(`${compound} ${condition}`)}`,
    provenance: 'public-search',
  },
];
```

Regra: se `studiesWithExcerpts.length < 2`, completar até 2 com esses links; nunca ultrapassar `MAX_STUDIES_PER_COMPOUND = 3`. Mantém o No-Mock Policy: nada é simulado, são buscas reais rotuladas como tal.

### 2. Tipo `StudyRef` (`CompoundDosageSlider.tsx`)

Aceitar `provenance: 'paired' | 'compound-only' | 'public-search'`.

### 3. UI — `CompoundDosageSlider.tsx` (linhas ~492-555)

- Renderizar entradas `public-search` no mesmo bloco "Estudos científicos", mas com badge diferenciado (cinza/azul claro: "Busca pública") para deixar transparente que é um atalho, não um estudo curado.
- Não aplicar a barra lateral primária; usar `border-l-2 border-muted` para distinguir visualmente.
- Sem `excerpt` (o link não traz excerto).
- Reaproveitar `getLinkSource` já existente (`PubMed`, `Scholar`).

### 4. i18n (`pt`/`en`) + `I18N_VERSION`

Novas chaves:
- `petProfile.recommendation.linkSource.publicSearch` → "Busca pública" / "Public search"
- `petProfile.recommendation.studiesPublicSearchHint` → "Sem estudos curados para este par; links de busca pública aproximada." / "No curated studies for this pair; approximate public-search links."

Incrementar `I18N_VERSION` de 1.74.2 → 1.74.3.

### 5. CHANGELOG.md + sync

Entrada `[Unreleased]` em **Added** e/ou **Changed**:
- "Garantia de 2-3 links clicáveis em 'Ver evidências e contexto', com fallback determinístico para PubMed/Scholar quando não há estudo curado para o par (composto × condição)."

Rodar `npm run sync:changelog`.

## Arquivos afetados

- `src/services/clinical-analysis-pipeline.ts` — fallback de busca pública.
- `src/components/pet/CompoundDosageSlider.tsx` — render do badge "Busca pública".
- `src/locales/pt/translation.json`, `src/locales/en/translation.json` — novas chaves.
- `src/i18n.ts` — bump de versão.
- `CHANGELOG.md` (+ regenerado `src/data/projectChangelog.generated.ts`).

## Validação

1. Abrir o pet `85880f2f-…` (Quercetin / Sarcopenia da tela).
2. Expandir "Ver evidências e contexto" — confirmar 2-3 links visíveis.
3. Conferir que pelo menos um, quando existir estudo curado, aparece com badge "PubMed/DOI" e excerpt; e os de busca aparecem com badge "Busca pública".
4. Verificar que pets com estudos curados (Buddy/Omega-3) continuam mostrando os curados primeiro.
