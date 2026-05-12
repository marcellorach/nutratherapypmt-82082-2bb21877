## Escopo (5 itens confirmados)

### a) Condições de gerociência ao final, com label de origem
**Onde:** lista de condições do pet (`PetProfilePage.tsx` → seção "Condições" / `ConditionInsightCard`).

- Criar helper `src/services/condition-classification.ts` com whitelist de condições gerociência: `inflammaging`, `oxidative stress`, `cellular senescence`, `mitochondrial dysfunction`, `sarcopenia`, `cognitive dysfunction syndrome`, `immunosenescence`, `telomere attrition`, etc. (bilíngue PT/EN).
- Ordenação da lista: primeiro condições clínicas tradicionais (mantendo ordem atual: ativas → monitoramento → resolvidas), depois bloco "**Atenção geriátrica / gerociência**" com subtítulo separador.
- Para cada condição gerociência, sub-label de origem derivada da consulta vinculada (`consultation_id` → `chief_complaint`/`assessment` ou `exam`):
  - `Atenção geriátrica sugerida por exames` (origin = `exam_suggested`)
  - `Atenção geriátrica sugerida pelo veterinário (consulta de DD/MM/AAAA)` (origin = `vet_diagnosis`, mostrando data da consulta)
- Manter badges atuais (severidade/status), mas o badge "Diagnóstico Veterinário"/"Sugerida por Exames" troca para o sub-label acima quando for condição de gerociência.

### b) Remover apenas a **aba** "Notas Clínicas" (manter o card-contador)
**Arquivo:** `src/pages/veterinario/PetProfilePage.tsx`.
- Remover `<TabsTrigger value="notes">` e `<TabsContent value="notes">`.
- Card "0 Notas Clínicas" do topo permanece (só o contador).
- Notas continuam visíveis dentro de cada consulta no histórico.

### c) "Queixa" → "Motivo"
- `chief_complaint` continua sendo a coluna do banco (sem migração).
- Trocar labels nas chaves i18n existentes:
  - `petTimeline.chiefComplaint` PT: "Motivo" / EN: "Reason"
  - `petRegistration.form.historicalConsultations.chiefComplaint` PT: "Motivo" / EN: "Reason"
- Bumpar `I18N_VERSION`.

### d) "Exame Clínico" → "Exame Físico" estruturado (campos)
**Schema:** adicionar coluna `physical_exam JSONB` em `pet_consultations` (mantém `clinical_exam TEXT` por compatibilidade — leitura cai em fallback).

Forma do JSON:
```json
{
  "general": {
    "posture": "...",
    "skin_lesions": "...",
    "behavior": "...",
    "body_condition_score": 5
  },
  "specific": {
    "physiological": { "hr_bpm": 90, "rr_rpm": 22, "temp_c": 38.6, "mucous_membranes": "..." },
    "orthopedic": "...",
    "cardiovascular": "...",
    "neurological": "...",
    "abdominal": "..."
  }
}
```

UI:
- `PetConsultationsTimeline.tsx`: substituir bloco `clinical_exam` por componente novo `PhysicalExamBlock` que renderiza, em duas mini-tabelas/seções colapsáveis ("Geral" e "Específico"), só os campos preenchidos. Fallback: se `physical_exam` for null e `clinical_exam` tiver texto, mostra texto cru sob título "Exame físico (texto livre)".
- `HistoricalConsultationsSection.tsx` (form de cadastro): novo bloco com inputs para Geral (3 campos + ECC) e Específico (FC/FR/TR/mucosa + 4 textareas curtas).
- Demos (`GenerateSamplePetsButton`) e extração (`extract-pet-clinical-data`) populam o JSON.

### e) Reordenar conteúdo da consulta + Exames com referências + Tags IA
**Nova ordem dentro de cada card de consulta** (`PetConsultationsTimeline.tsx`):
1. Cabeçalho (data/vet)
2. **Motivo**
3. **Exame físico** (estruturado, item d)
4. **Exames complementares** — tabela com colunas: Exame · Resultado · **Faixa de referência canina** · Status (normal/alterado).
   - Lê de `pet_exams.results` (já é JSON) e cruza com `lab-references-canine` (já existe em `src/services/lab-references` ou similar — checar `automated-lab-result-interpretation-system`).
5. **Avaliação** (`assessment`) — agora por último, em destaque visual (border-l accent), aceita texto mais longo (textarea cresce até 6 linhas no form).
6. **Tags representativas** no rodapé: chips clicáveis (read-only) com até 8 tags (ex.: `ortopédico`, `dor leve`, `atividade intensa`, `inflamação subclínica`).

**Geração das tags (IA):**
- Estender `extract-pet-clinical-data` (Edge Function) com novo campo `tags: string[]` no JSON de saída. Prompt instrui Gemini a emitir 3-8 tags curtas (snake/kebab clínico, PT) cobrindo: sistema acometido, severidade, fator desencadeante, hipótese.
- Persistir em nova coluna `tags TEXT[]` em `pet_consultations` (default `'{}'`).
- Para consultas demo: gerar tags determinísticas no `GenerateSamplePetsButton`.
- Para consultas existentes sem tags: ficam vazias (sem mock retroativo).

## Mudanças técnicas

**Migration (Supabase):**
```sql
ALTER TABLE public.pet_consultations
  ADD COLUMN IF NOT EXISTS physical_exam jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
```
Sem mudanças em RLS (já cobertas pelas policies existentes).

**Arquivos a editar:**
- `src/pages/veterinario/PetProfilePage.tsx` — remove aba notes; ordenação de condições com bloco gerociência.
- `src/components/pet/PetConsultationsTimeline.tsx` — reordenação Motivo→Exame físico→Exames→Avaliação→Tags; render `PhysicalExamBlock`; tabela exames com referências.
- `src/components/pet/HistoricalConsultationsSection.tsx` — campos novos do exame físico, label "Motivo", textarea avaliação maior.
- `src/components/pet/ConditionInsightCard.tsx` — sub-label "Atenção geriátrica…" para condições da whitelist.
- **Novos:**
  - `src/services/condition-classification.ts` — whitelist gerociência + `isGeroscienceCondition()` + `formatGeroscienceOriginLabel()`.
  - `src/components/pet/PhysicalExamBlock.tsx` — render estruturado.
  - `src/components/pet/ExamResultsWithReferences.tsx` — tabela exames + faixa canina + status.
- `src/components/pet/GenerateSamplePetsButton.tsx` — popular `physical_exam` + `tags` nos demos.
- `supabase/functions/extract-pet-clinical-data/index.ts` — novo schema `physical_exam` + `tags` no JSON, prompt atualizado.
- `src/locales/pt|en/translation.json` + `src/i18n.ts` — chaves novas (`petTimeline.reason`, `physicalExam.*`, `examResults.*`, `consultationTags.title`, `geroscienceAttention.bySuggestionExams|VetVisit`), bump `I18N_VERSION`.
- `CHANGELOG.md` (`[Unreleased]`) + `npm run sync:changelog`.
- Memória nova: `mem://principles/geroscience-condition-grouping.md` documentando whitelist e label de origem.

**Sem mudanças** em: hybrid-recommendation, NutritionGapAnalysis, KG, payment.

## Validação
- Pet com Inflammaging + Osteoartrite → OA primeiro, Inflammaging no bloco "Atenção geriátrica" com data da consulta de origem.
- Aba "Notas Clínicas" some; card-contador permanece.
- Consulta nova: vet preenche FC/FR/TR/postura etc.; render mostra duas seções; avaliação por último; tags geradas pela IA aparecem ao salvar via extract-pet-clinical-data.
- Consulta antiga (sem `physical_exam`): cai no fallback texto livre, sem quebra.

## Fora de escopo
- Refatorar nutricional / VetGraphRAG / hybrid-recommendation.
- Migrar texto livre legado de `clinical_exam` para JSON estruturado (fica como follow-up).
- Editor inline de tags (somente leitura nesta entrega).