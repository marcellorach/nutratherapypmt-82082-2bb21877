## Diagnóstico

**(a) Links dos estudos não funcionam.** No `attachStudiesToCompounds` (`clinical-analysis-pipeline.ts`) o `link` vem direto da tabela `scientific_studies.link` — quando vazio, o `CompoundDosageSlider` cai no fallback DOI/PMID, mas se os três campos estiverem ausentes não há link. Além disso, alguns DOIs vêm com URL completa (`https://doi.org/...`), o que duplica o prefixo. Faltam normalização e fallback final para PubMed/Google Scholar por título.

**(b) "Embasamento Científico" e "Conexões KG" estão na aba e não no card.** Hoje o `CompoundDosageSlider` mostra apenas estudos enxutos. Toda a riqueza (predicado TREATS/PREVENTS, contagem de estudos, % de confiança, sinergias) vive no `ScientificEvidencePanel` (aba "Embasamento Científico") e no painel KG. O usuário quer essa informação **dentro de cada card de composto**, mantendo nas abas apenas **Caminho Biológico** e **Projeção de Melhora**.

---

## Plano de Implementação

### 1. Corrigir links de estudos (`clinical-analysis-pipeline.ts`)

Em `attachStudiesToCompounds`, normalizar `link` antes de devolver:

```text
resolvedLink =
  s.link (se começar com http)
  || (s.doi → "https://doi.org/" + doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, ''))
  || (s.pmid → "https://pubmed.ncbi.nlm.nih.gov/" + pmid)
  || "https://scholar.google.com/scholar?q=" + encodeURIComponent(title)
```

Sempre retornar `link` preenchido. No `CompoundDosageSlider`, simplificar para usar somente `s.link` (já normalizado) e abrir em nova aba com `rel="noopener noreferrer"`.

### 2. Trazer KG e Evidência Científica para dentro do card

**a) Pipeline** — em `attachStudiesToCompounds`, além de `studies` e `mechanism`, anexar a cada composto:

- `kgTriplets`: array de triplets (`subject`, `predicate`, `object`, `confidence`, `evidenceLevel`, `studyCount`) onde o composto é sujeito **e** a condição do card é objeto. Filtrar de `triplet_extractions` aprovados, agrupar por `(predicate, object_name)` e contar `study_id` distintos.
- `synergies`: outras condições do paciente também tratadas pelo mesmo composto (cruzar com `petConditions`).

**b) Tipo `CompoundDosage`** (`CompoundDosageSlider.tsx`) — adicionar:

```text
kgTriplets?: Array<{ subject; predicate; object; confidence; evidenceLevel; studyCount }>
synergies?: Array<{ condition; predicate }>
```

**c) UI dentro do collapsible "Ver evidências e contexto"** — reordenar e expandir:

```text
[Compound Card]
  - Slider + Discutir
  - Collapsible "Ver evidências e contexto"
    1. Mecanismo molecular (com Expandir, já existe)
    2. NOVO: Bloco "Knowledge Graph"
        - Linhas estilo ScientificEvidencePanel:
            [🧪 Composto] [→ TREATS] [Condição] [N estudos] [KG-backed] [70%]
        - Inclui também as triplets de sinergia (outras condições do pet)
    3. Estudos científicos (já existe, com links corrigidos e excerpts)
    4. Conexões no KG (manter mini-resumo composto → condição)
```

Reaproveitar paleta de cores de predicados (`predicateBadgeColors`) extraindo para `src/components/pet/utils/predicateStyles.ts` e importando em ambos os componentes (sem duplicar).

### 3. Limpar abas

Em `PetProfilePage.tsx` remover **"Embasamento Científico"** e **"Chat por Composto"** das tabs (o chat já vive dentro de cada card via "Discutir esta recomendação"). Manter apenas:

```text
Tabs: [Recomendações (default)] [Caminho Biológico] [Projeção de Melhora]
```

`kgTriplets` continua sendo computado para alimentar os cards (via `attachStudiesToCompounds`) e o `VetGraphRAGInsightsPanel`.

### 4. i18n e versão

- Adicionar chaves em PT/EN: `petProfile.recommendation.knowledgeGraph` ("Knowledge Graph"), `petProfile.recommendation.synergies` ("Sinergias com outras condições"), `petProfile.recommendation.noKgEvidence` ("Sem evidência direta no KG para esta condição").
- Incrementar `I18N_VERSION` em `src/i18n.ts` (1.25.1 → 1.26.0).

### 5. Documentação

- `CHANGELOG.md` → seção `[Unreleased] / Changed`: links de estudos com fallback robusto; KG e evidência científica movidos para dentro de cada card; abas reduzidas a Recomendações/Caminho Biológico/Projeção.
- `ARCHITECTURE.md` (se houver tópico de tabs do PetProfile): atualizar contagem de tabs.

---

## Arquivos afetados

- `src/services/clinical-analysis-pipeline.ts` — normalizar `link`, anexar `kgTriplets` e `synergies` por composto.
- `src/components/pet/CompoundDosageSlider.tsx` — novo bloco "Knowledge Graph" + sinergias dentro do collapsible; usar link já normalizado.
- `src/components/pet/VetRecommendationPanel.tsx` — passar `petConditions` (já passa) e propagar tipos.
- `src/components/pet/utils/predicateStyles.ts` *(novo)* — extrair `predicateBadgeColors` / `predicateSymbols` para reuso.
- `src/components/pet/ScientificEvidencePanel.tsx` — passar a importar de `predicateStyles.ts` (sem mudança visual; ele será removido do uso, mas mantido caso seja referenciado em outro lugar).
- `src/pages/veterinario/PetProfilePage.tsx` — remover tabs "Embasamento Científico" e "Chat por Composto".
- `src/i18n.ts` + `src/locales/{pt,en}/translation.json` — novas chaves + versão.
- `CHANGELOG.md`.

---

## Resultado esperado

- Cliques nos títulos de estudos abrem o paper (DOI, PubMed ou Scholar como fallback) em nova aba.
- Cada card de composto exibe — sem precisar trocar de aba — o predicado KG (TREATS/PREVENTS/etc.), confiança, contagem de estudos, sinergias com outras condições do pet, mecanismo, excerpts e links.
- Abas ficam enxutas: apenas Recomendações, Caminho Biológico e Projeção.
