## Objetivo

Garantir que todos os cards de recomendação exibam links clicáveis para os estudos que embasam o composto, mesmo quando não há triplet aprovado para o par exato (composto, condição), e adicionar pequenos selos de proveniência (DOI / PubMed / Scholar) ao lado de cada link para deixar claro para onde leva.

## Diagnóstico

O renderizador de estudos no card (`CompoundDosageSlider`) já está correto: cada estudo vira um `<a target="_blank">` apontando para `s.link`, e a pipeline já normaliza esse link com a cadeia de fallback:

```text
link absoluto (http/https)
  → DOI (https://doi.org/<doi>)
  → PubMed (https://pubmed.ncbi.nlm.nih.gov/<pmid>)
  → Google Scholar (busca pelo título)
```

O motivo de o usuário não ver links em alguns cards é que a Stage 6.5 só anexa estudos quando existe **triplet aprovado** para o par exato `(composto ILIKE %name%, condição ILIKE %condition%)` em `triplet_extractions`. Quando não há, o card recebe `studies: []` e a seção "Estudos científicos" some.

## O que vamos mudar

### 1. Fallback de estudos por composto (clinical-analysis-pipeline.ts)

Em `attachStudiesToCompounds`, quando a busca pareada `(subject_name ~ composto, object_name ~ condição)` retornar zero triplets aprovados, fazer uma segunda busca **apenas por composto** (qualquer condição) restrita aos predicados terapêuticos e curadoria aprovada, pegando os 3 estudos com maior `extraction_confidence`. Esses estudos entram no card marcados internamente como `provenance: 'compound-only'` para diferenciar da evidência pareada.

### 2. Selo de proveniência do link (CompoundDosageSlider.tsx)

Ao renderizar cada estudo, adicionar um pequeno badge ao lado do título indicando o destino real do link, derivado da URL final:

- `DOI` quando `host = doi.org`
- `PubMed` quando `host` contém `pubmed.ncbi.nlm.nih.gov`
- `PMC` quando contém `pmc.ncbi.nlm.nih.gov`
- `Scholar` quando contém `scholar.google.com`
- `Externo` para qualquer outro domínio

Também adicionar um ícone `ExternalLink` discreto ao lado do título para reforçar visualmente que abre fora da plataforma, e `aria-label` apropriado.

### 3. Mensagem de "evidência geral" (CompoundDosageSlider.tsx)

Quando os estudos vierem do fallback (`provenance === 'compound-only'`), mostrar uma linha pequena acima da lista: "Estudos sobre o composto (não específicos a esta condição)" para manter a transparência clínica exigida pelo princípio de transparência de recomendações.

### 4. i18n + versionamento

Adicionar chaves em PT/EN:
- `petProfile.recommendation.openExternal` — "Abrir estudo"
- `petProfile.recommendation.linkSource.doi|pubmed|pmc|scholar|external`
- `petProfile.recommendation.studiesCompoundOnly` — "Estudos sobre o composto (não específicos a esta condição)"

Bumpar `I18N_VERSION` em `src/i18n.ts` (1.26.0 → 1.26.1).

### 5. Documentação

- `CHANGELOG.md` em `[Unreleased] → Fixed/Added`: registrar fallback de estudos por composto e selos de proveniência do link.
- Sem mudanças em ARCHITECTURE/CURRENT_STATE (ajuste pontual de UX/dados, não muda arquitetura).

## Arquivos afetados

- `src/services/clinical-analysis-pipeline.ts` — fallback de estudos
- `src/components/pet/CompoundDosageSlider.tsx` — selo de fonte do link + ícone externo + linha de proveniência
- `src/i18n.ts` — bump de versão
- `src/locales/pt/translation.json`, `src/locales/en/translation.json` — novas chaves
- `CHANGELOG.md` — entrada em [Unreleased]

## Fora de escopo

- Não alterar o componente de abas nem outros painéis.
- Não criar viewer interno de PDF — links continuam abrindo em nova aba (target=`_blank`, `rel="noopener noreferrer"`), conforme já implementado.
