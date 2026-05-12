## Diagnóstico do que está errado hoje

Nas consultas simuladas, o que aparece como "EXAMES COMPLEMENTARES" (ex.: `Neurological Examination → reflexes / proprioception`) **não é exame complementar** — é exame físico específico. Foi parar lá porque o gerador de demos grava esses achados como linha em `pet_exams`. Resultado: a tabela de complementares fica vazia de coisas reais (sangue, RX, urina) e poluída por achados físicos.

Além disso:
- "AVALIAÇÃO" hoje só mostra o texto cru do veterinário; não há camada de interpretação por LLM.
- Não existe um bloco final agregando o que a máquina entendeu da consulta (tags + síntese).
- O form de cadastro (foto 5) usa labels divergentes do que aparece no card (Queixa principal vs Motivo, Achados/Diagnóstico vs Avaliação, Conduta vs Plano).

## Escopo (5 itens)

### a) Reclassificar achados de exame físico que estão em `pet_exams`
Critério: linhas em `pet_exams` cujo `exam_type` casa com a whitelist de exames físicos (`neurological examination`, `orthopedic examination`, `cardiovascular examination`, `dermatological examination`, `abdominal palpation`, `general physical examination`) **não** vão para a tabela de complementares — são fundidas no `physical_exam.specific.<area>` da consulta correspondente, gerando um texto curto tipo `reflexes: preservados; proprioception: reduzida em membros pélvicos`.

Implementação:
- Novo helper `src/services/exam-classification.ts` com `isPhysicalExamType(name)` + `mergeIntoPhysicalExam(physicalExam, examRow)`.
- `PetConsultationsTimeline.tsx`: ao montar cada consulta, particionar `c.exams` em `physicalSpecific` e `complementary`. Passar os primeiros para `PhysicalExamBlock` (modo merge) e os últimos para `ExamResultsWithReferences`.
- `ExamResultsWithReferences`: se a lista filtrada ficar vazia, renderizar estado vazio "Sem exames complementares registrados nesta consulta".

### b) Quadro real de "Exames Complementares"
Sem mudança de schema — apenas filtra para tipos clássicos: `complete blood count / cbc`, `biochemistry / chemistry panel`, `urinalysis`, `radiography / x-ray`, `ultrasound`, `thyroid panel`, `cardiac biomarkers`, `fecal exam`, etc. Lista padrão em `src/services/exam-classification.ts → COMPLEMENTARY_EXAM_TYPES`. Tudo que não casar com físico nem complementar conhecido → cai por padrão em complementar (comportamento atual), preservando dados antigos.

Demos (`GenerateSamplePetsButton`): garantir pelo menos um CBC ou bioquímico por pet (já existe na maioria, mas o pet do screenshot não tem) e mover os achados neurológicos/ortopédicos para `physical_exam` no insert da consulta.

### c) "Avaliação" → "Suspeita / Diagnóstico" + interpretação LLM
Renomear o bloco no card e no form:
- `petTimeline.assessment` PT: "Suspeita / Diagnóstico" / EN: "Assessment / Diagnosis"
- `petRegistration.form.historicalConsultations.assessment` mesmo label.
- Texto cru do vet permanece exatamente como digitado, em destaque (mantém `border-l-2 border-primary/60`).
- **Novo:** abaixo do texto cru, sub-bloco `<AssessmentInterpretation>` com:
  - Termos canônicos extraídos (ex.: `Degenerative Myelopathy`, `early stage`, `breed-typical`),
  - ICD/SNOMED/UMLS quando disponível (apenas exibir se vier do extractor),
  - Sistemas afetados (badges: `nervous system`, `motor`).
- Fonte dos dados: campo novo `assessment_interpretation JSONB` em `pet_consultations` populado pela edge function `extract-pet-clinical-data` (já é nossa via para LLM). Schema:
  ```json
  {
    "canonical_conditions": [{ "name": "Degenerative Myelopathy", "stage": "early", "confidence": 0.78 }],
    "systems_affected": ["nervous", "motor"],
    "ontology_refs": [{ "system": "SNOMED", "code": "230234000", "label": "..." }]
  }
  ```
- Fallback: se `assessment_interpretation` for null, sub-bloco não renderiza (nada de mock).

### d) Quadro amarelo de TAGs + síntese ao final do card
Novo componente `ConsultationMachineSummary.tsx` posicionado **após** o bloco de medicações/diagnósticos, antes do botão Recolher. Estilo: `border-l-4 border-amber-400 bg-amber-50/70 dark:bg-amber-900/20 rounded-md p-3`.

Conteúdo:
1. Título "Interpretação automática desta consulta" + ícone `Sparkles`.
2. Tags (mantém as `c.tags` que já existem hoje no rodapé — **mover** para dentro deste quadro amarelo).
3. Síntese curta gerada pelo LLM (campo novo `machine_summary TEXT` em `pet_consultations`, 1–2 frases).
4. Lista de "termos referência utilizáveis pelo sistema" — chips com canonical labels que serão usados pelo VetGraphRAG (vem de `assessment_interpretation.canonical_conditions`).
5. Microcopy: "Esses dados alimentam a análise VetGraphRAG. O texto original do veterinário não é alterado."

Remove o bloco de tags antigo do rodapé (deduplicado).

### e) Match form ↔ card (foto 5)
Padronizar labels do form `HistoricalConsultationsSection.tsx` para baterem 1:1 com o card:

| Form (foto 5) atual | Novo label form e card | Coluna DB |
|---|---|---|
| Queixa principal | **Motivo** | `chief_complaint` |
| Achados / Diagnóstico | **Suspeita / Diagnóstico** | `assessment` |
| Conduta | **Plano / Conduta** | `plan` |
| Diagnósticos (separados por vírgula) | mantém | `pet_conditions` |
| Medicações (uma por linha) | mantém | `pet_medications` |

Também adicionar no form os campos novos do exame físico (postura, lesões de pele, comportamento, FC, FR, TR, mucosa, e textareas curtas para neurológico/ortopédico/cardiovascular/abdominal/dermatológico) — escondidos por padrão sob um sub-collapsible "Exame físico" para não pesar o form.

## Mudanças técnicas

**Migration:**
```sql
ALTER TABLE public.pet_consultations
  ADD COLUMN IF NOT EXISTS assessment_interpretation jsonb,
  ADD COLUMN IF NOT EXISTS machine_summary text;
```

**Arquivos a editar:**
- `src/components/pet/PetConsultationsTimeline.tsx` — partição de `exams`, render de `AssessmentInterpretation` e `ConsultationMachineSummary`, remoção do bloco antigo de tags.
- `src/components/pet/ExamResultsWithReferences.tsx` — estado vazio + ignorar tipos físicos.
- `src/components/pet/PhysicalExamBlock.tsx` — aceitar `mergedSpecificFromExams` para concatenar achados vindos de `pet_exams` físicos.
- `src/components/pet/HistoricalConsultationsSection.tsx` — labels novos + sub-collapsible exame físico.
- `src/components/pet/GenerateSamplePetsButton.tsx` — gerar tags determinísticas, `machine_summary`, `assessment_interpretation` e mover exames físicos para `physical_exam`.
- `supabase/functions/extract-pet-clinical-data/index.ts` — incluir `assessment_interpretation` e `machine_summary` no JSON de saída.
- `src/hooks/usePetConsultations.ts` — tipar os novos campos.
- `src/locales/pt|en/translation.json` + `src/i18n.ts` — chaves novas (`petTimeline.assessmentTitle`, `petTimeline.machineSummary.*`, `petTimeline.interpretation.*`, `examResults.empty`); bump `I18N_VERSION` → `1.73.0`.

**Novos arquivos:**
- `src/services/exam-classification.ts` — whitelists e helpers.
- `src/components/pet/AssessmentInterpretation.tsx` — sub-bloco LLM.
- `src/components/pet/ConsultationMachineSummary.tsx` — quadro amarelo final.

**Doc:**
- `CHANGELOG.md` `[Unreleased]` + `npm run sync:changelog`.
- Memória nova: `mem://principles/consultation-card-machine-interpretation-block.md`.

## Validação
- Pet do screenshot: "Neurological Examination · reflexes · preservados" deixa de aparecer em "Exames complementares" e passa a aparecer em "Exame físico → Específico → Neurológico". Tabela de complementares mostra estado vazio (ou CBC se tiver).
- Card Avaliação vira "Suspeita / Diagnóstico" com texto do vet intacto + sub-bloco com badge `Degenerative Myelopathy · early stage`.
- No final do card, quadro amarelo com tags (`pastor_alemão`, `mielopatia`, `inicial`) + síntese ("Sinais neurológicos compatíveis com mielopatia degenerativa precoce em raça predisposta.") + chips canônicos.
- Form: vet preenche "Suspeita / Diagnóstico" e ao salvar via extract-pet-clinical-data o card já mostra interpretação + síntese.

## Fora de escopo
- Editor inline de tags/síntese (somente leitura).
- Migrar retroativamente exames antigos já gravados como físicos: rodam só pela classificação em runtime; a base não é reescrita.
- Mudanças em VetGraphRAG / hybrid-recommendation / nutricional.
