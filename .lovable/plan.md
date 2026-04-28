## Visão Geral

Quatro melhorias no fluxo do veterinário:

a) Pets de exemplo com **gradiente real de complexidade clínica** (1→4 doenças).
b) Nova subdivisão **"Alvos para Prevenção"** no painel VetGraphRAG, alimentada pela tabela `breed_predispositions`.
c) **Análise por Condição** abre **expandida por padrão**.
d) Cada slider de recomendação exibe **links para os estudos científicos** que embasam aquele composto→condição.

---

## a) Gradiente de complexidade dos sample pets

Refatorar `SAMPLE_PETS` em `src/components/pet/GenerateSamplePetsButton.tsx` para que o nº de condições cresça de 1 → 4 ao longo dos 5 pets, sempre usando doenças que naturalmente coexistem na faixa etária/raça (não comorbidades obrigatórias):

| # | Pet | Raça | Idade | Condições (não-categorias) |
|---|-----|------|-------|----------------------------|
| 1 | Buddy | Beagle | 4y | **1**: Mild Periodontal Disease |
| 2 | Max | Beagle | 9y | **2**: Cognitive Dysfunction Syndrome (mild) + Mild Sarcopenia |
| 3 | Rex | Labrador Retriever | 8y | **3**: Osteoarthritis (moderate) + Hip Dysplasia (mild) + Overweight |
| 4 | Thor | German Shepherd | 7y | **3**: Osteoarthritis + Hip Dysplasia + Degenerative Myelopathy (early) |
| 5 | Luna | Cavalier King Charles | 9y | **4**: MMVD (moderate) + Cognitive Dysfunction Syndrome (mild) + Chronic Mitral Regurgitation–related Pulmonary Hypertension + Mild Chronic Kidney Disease (IRIS stage 2) |

Critérios:
- Todas são **doenças específicas** (passa pelo `warnIfGenericCategory`).
- Coexistências plausíveis pela idade/raça (ex.: Cavalier idoso com cardiopatia + DRC iatrogênica leve por uso crônico de furosemida; Pastor Alemão com OA + displasia + mielopatia).
- Medicações e exames acompanham a complexidade (Buddy: 1 exame; Luna: polifarmácia + ecocardio + painel renal).

---

## b) Nova categoria "Alvos para Prevenção" (predisposição racial/etária)

No `VetGraphRAGInsightsPanel.tsx`:

- **Renomear** "Prevenção Futura" para **"Alvos para Prevenção"** (key `petProfile.insights.preventionTargets`).
- A categoria já é alimentada por `predispositions` vindas de `breed_predispositions` (tabela já existe — ver `clinical-analysis-pipeline.ts` linha 81-130). A lógica está quase pronta; vamos:
  - Garantir que **todas** as predisposições não diagnosticadas apareçam (hoje filtra implicitamente por já ter ≥1 triplet).
  - Adicionar **filtro etário**: priorizar predisposições cujo `risk_factor` é relevante para a faixa etária do pet (ex.: pet sênior → mostrar primeiro doenças degenerativas).
  - Mostrar badge com `risk_factor` (ex.: "3.2× risco") e `evidence_grade`.
  - Texto descritivo: "Doença comum em {breed} a partir de {age} anos. Estratégias de prevenção sugeridas pelo KG."

Banco de dados: **já existe** (`breed_predispositions` com `breed_id`, `condition_id`, `risk_factor`, `evidence_grade`, `notes`). Não precisa migração.

---

## c) Análise por Condição expandida por padrão

Em `src/components/pet/ConditionInsightCard.tsx` (linha 97):

```ts
const [expanded, setExpanded] = useState(true); // antes: false
```

Mantém o botão de colapsar/expandir — só inverte o default.

---

## d) Links de estudos sob cada recomendação

### Backend
1. Estender `CompoundDosage` (em `CompoundDosageSlider.tsx`) com:
   ```ts
   studies?: Array<{ id: string; title: string; year?: number; doi?: string; pmid?: string; link?: string }>;
   ```

2. Em `clinical-analysis-pipeline.ts` (bloco `compounds = nutraceuticals.map(...)`, linhas 922-943):
   - Para cada composto recomendado, consultar `hierarchical_edges` filtrando por `subject_name = compound.name` AND `object_name ILIKE condition` AND `predicate IN ('TREATS','AMELIORATES','PREVENTS','MODULATES')`.
   - Pegar o array `study_ids` e fazer JOIN com `scientific_studies` (`id, title, year, doi, pmid, link`).
   - Limitar aos top 3 estudos por composto (ordenar por confidence desc).
   - Anexar ao objeto `compound.studies`.

### Frontend
Em `CompoundDosageSlider.tsx`, abaixo do bloco `Rationale` (linha 176) e acima do slider, ou logo abaixo do slider e antes do "Discutir esta recomendação":

```tsx
{studies && studies.length > 0 && (
  <div className="mt-3 pl-6 space-y-1">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
      {t('petProfile.recommendation.evidenceStudies')}
    </p>
    {studies.map(s => (
      <a key={s.id} href={s.link || (s.doi ? `https://doi.org/${s.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}`)}
         target="_blank" rel="noopener noreferrer"
         className="flex items-start gap-1.5 text-xs text-primary hover:underline">
        <BookOpen className="h-3 w-3 mt-0.5 shrink-0" />
        <span className="line-clamp-2">{s.title} {s.year && `(${s.year})`}</span>
      </a>
    ))}
  </div>
)}
```

Quando o composto não tiver estudos no KG, ocultar a seção (sem mock).

---

## i18n & Versionamento

Adicionar chaves em `src/locales/pt/translation.json` e `src/locales/en/translation.json`:
- `petProfile.insights.preventionTargets`
- `petProfile.insights.preventionTargetsDesc`
- `petProfile.recommendation.evidenceStudies`
- `petProfile.recommendation.noStudies` (opcional)

Incrementar `I18N_VERSION` em `src/i18n.ts` (1.23.0 → **1.24.0**).

---

## Memória de projeto

Atualizar `mem://features/sample-pets-complexity-order` com a nova distribuição (1→4 doenças).

---

## Documentação

- `CHANGELOG.md` em `[Unreleased]` → Added/Changed conforme cada item.

---

## Arquivos afetados

- `src/components/pet/GenerateSamplePetsButton.tsx` (a)
- `src/components/pet/VetGraphRAGInsightsPanel.tsx` (b)
- `src/components/pet/ConditionInsightCard.tsx` (c — 1 linha)
- `src/components/pet/CompoundDosageSlider.tsx` (d — UI dos estudos)
- `src/services/clinical-analysis-pipeline.ts` (d — anexar estudos aos compostos)
- `src/locales/{pt,en}/translation.json` (chaves novas)
- `src/i18n.ts` (versão)
- `mem://features/sample-pets-complexity-order`
- `CHANGELOG.md`

Sem migrações de banco — a tabela `breed_predispositions` e o array `study_ids` em `hierarchical_edges` já existem.